import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, AlertCircle, Settings, Volume2 } from 'lucide-react';
import Plyr from 'plyr-react';
import Hls from 'hls.js';
import 'plyr-react/plyr.css';
import { Movie } from '../types';
import { realDebridService } from '../services/realDebridService';

interface VideoPlayerProps {
  movie: Movie;
  onBack: () => void;
}

function VideoPlayer({ movie, onBack }: VideoPlayerProps) {
  const plyrRef = useRef<any>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [streamUrl, setStreamUrl] = useState<string>(movie.streamUrl || '');
  const [streamType, setStreamType] = useState<'hls' | 'mp4' | 'webm'>('mp4');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (movie.streamUrl) {
      handleTranscoding();
    } else {
      setError('No stream URL available');
    }
  }, [movie.streamUrl]);

  useEffect(() => {
    return () => {
      // Cleanup HLS instance on unmount
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, []);

  const handleTranscoding = async () => {
    if (!movie.streamUrl) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Find file ID from downloads list
      const fileId = await realDebridService.findFileIdFromUrl(movie.streamUrl);
      if (!fileId) {
        throw new Error('Could not find file ID for transcoding');
      }
      
      // Get transcoding options
      const transcodingOptions = await realDebridService.getTranscodingOptions(fileId);
      
      // Prefer HLS (M3U8) for adaptive streaming, fallback to MP4
      let selectedUrl = '';
      let selectedType: 'hls' | 'mp4' | 'webm' = 'mp4';
      
      if (transcodingOptions.apple && transcodingOptions.apple.full) {
        // Prefer HLS for adaptive streaming
        selectedUrl = transcodingOptions.apple.full;
        selectedType = 'hls';
      } else if (transcodingOptions.liveMP4 && transcodingOptions.liveMP4.full) {
        // Fallback to MP4
        selectedUrl = transcodingOptions.liveMP4.full;
        selectedType = 'mp4';
      } else if (transcodingOptions.h264WebM && transcodingOptions.h264WebM.full) {
        // Last resort: WebM
        selectedUrl = transcodingOptions.h264WebM.full;
        selectedType = 'webm';
      }
      
      if (selectedUrl) {
        setStreamUrl(selectedUrl);
        setStreamType(selectedType);
      } else {
        // No transcoding available, use original file
        console.log('No transcoding available, using original file');
        setStreamUrl(movie.streamUrl || '');
        setStreamType('mp4');
      }
    } catch (error) {
      console.error('Transcoding failed:', error);
      console.log('Transcoding failed, using original file');
      setStreamUrl(movie.streamUrl || '');
      setStreamType('mp4');
    } finally {
      setLoading(false);
    }
  };

  const setupHLS = (videoElement: HTMLVideoElement, url: string) => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90
      });
      
      hls.loadSource(url);
      hls.attachMedia(videoElement);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest loaded');
      });
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        if (data.fatal) {
          setError('HLS playback failed. Trying fallback...');
          // Try to fallback to MP4 if available
          handleTranscodingFallback();
        }
      });
      
      hlsRef.current = hls;
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      videoElement.src = url;
    } else {
      console.log('HLS not supported, falling back to MP4');
      handleTranscodingFallback();
    }
  };

  const handleTranscodingFallback = async () => {
    if (!movie.streamUrl) return;
    
    try {
      const fileId = await realDebridService.findFileIdFromUrl(movie.streamUrl);
      if (fileId) {
        const transcodingOptions = await realDebridService.getTranscodingOptions(fileId);
        
        if (transcodingOptions.liveMP4 && transcodingOptions.liveMP4.full) {
          setStreamUrl(transcodingOptions.liveMP4.full);
          setStreamType('mp4');
          setError(null);
        } else {
          setStreamUrl(movie.streamUrl);
          setStreamType('mp4');
        }
      }
    } catch (error) {
      console.error('Fallback failed:', error);
      setStreamUrl(movie.streamUrl || '');
      setStreamType('mp4');
    }
  };

  const plyrOptions = {
    controls: [
      'play-large',
      'play',
      'progress',
      'current-time',
      'duration',
      'mute',
      'volume',
      'captions',
      'settings',
      'pip',
      'airplay',
      'fullscreen'
    ],
    settings: ['captions', 'quality', 'speed'],
    quality: {
      default: 1080,
      options: [2160, 1440, 1080, 720, 480, 360]
    },
    speed: {
      selected: 1,
      options: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
    },
    keyboard: {
      focused: true,
      global: true
    },
    tooltips: {
      controls: true,
      seek: true
    },
    captions: {
      active: true,
      language: 'auto',
      update: true
    },
    fullscreen: {
      enabled: true,
      fallback: true,
      iosNative: true
    },
    storage: {
      enabled: true,
      key: 'streamhub-plyr'
    },
    ratio: null, // Let video determine its own ratio
    invertTime: false,
    toggleInvert: true,
    resetOnEnd: false,
    autoplay: false,
    clickToPlay: true,
    disableContextMenu: false,
    loadSprite: true,
    iconPrefix: 'plyr',
    iconUrl: 'https://cdn.plyr.io/3.7.8/plyr.svg'
  };

  const getVideoSource = () => {
    if (!streamUrl) return null;
    
    if (streamType === 'hls') {
      return {
        type: 'video' as const,
        sources: [], // HLS will be handled separately
        poster: movie.backdropUrl,
        tracks: []
      };
    } else {
      return {
        type: 'video' as const,
        sources: [
          {
            src: streamUrl,
            type: streamType === 'webm' ? 'video/webm' : 'video/mp4'
          }
        ],
        poster: movie.backdropUrl,
        tracks: []
      };
    }
  };

  const handlePlyrReady = () => {
    const player = plyrRef.current?.plyr;
    if (player && streamType === 'hls' && streamUrl) {
      const videoElement = player.media;
      setupHLS(videoElement, streamUrl);
    }
  };

  const videoSource = getVideoSource();

  if (loading) {
    return (
      <div className="relative w-full h-screen bg-black flex items-center justify-center">
        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-50 bg-black/50 hover:bg-black/70 rounded-full p-3 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <h2 className="text-xl font-semibold mb-2">Preparing Video</h2>
          <p className="text-gray-400">Transcoding for optimal playback...</p>
        </div>
      </div>
    );
  }

  if (error || !videoSource) {
    return (
      <div className="relative w-full h-screen bg-black flex items-center justify-center">
        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-50 bg-black/50 hover:bg-black/70 rounded-full p-3 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>

        <div className="text-center max-w-md">
          <div className="w-32 h-32 bg-red-600 rounded-full flex items-center justify-center mb-6 mx-auto">
            <AlertCircle className="w-16 h-16 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-red-400">
            {error ? 'Playback Error' : 'No Stream Available'}
          </h2>
          <p className="text-gray-400 mb-4">
            {error || 'This content doesn\'t have a valid stream URL. Please try adding it to Real-Debrid first.'}
          </p>
          <button
            onClick={onBack}
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 z-50 bg-black/50 hover:bg-black/70 rounded-full p-3 transition-colors"
      >
        <ArrowLeft className="w-6 h-6 text-white" />
      </button>

      {/* Movie Info Overlay */}
      <div className="absolute top-6 right-6 z-50 bg-black/70 backdrop-blur-sm rounded-lg p-4 max-w-sm">
        <h1 className="text-xl font-bold mb-2">{movie.title}</h1>
        <p className="text-sm text-gray-300 mb-2">{movie.overview}</p>
        <div className="flex items-center space-x-4 text-xs text-gray-400">
          <span>Rating: {movie.rating}/10</span>
          <span>{movie.duration} min</span>
          <span className="bg-green-600 px-2 py-1 rounded text-white">
            Real-Debrid
          </span>
        </div>
        
        <div className="mt-3 flex items-center space-x-2 text-xs">
          <Settings className="w-3 h-3 text-gray-400" />
          <span className="text-gray-400">Subtitles & Audio available in player settings</span>
        </div>
      </div>

      {/* Plyr Video Player */}
      <div className="w-full h-full">
        {videoSource && (
          <Plyr
            ref={plyrRef}
            source={videoSource}
            options={plyrOptions}
            onReady={handlePlyrReady}
          />
        )}
      </div>
    </div>
  );
}

export default VideoPlayer;