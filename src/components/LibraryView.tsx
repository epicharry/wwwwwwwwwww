import React, { useState, useEffect } from 'react';
import { Play, Download, Trash2, Calendar, HardDrive, Folder, ArrowLeft, FileVideo } from 'lucide-react';
import { Movie, RealDebridTorrent, RealDebridFile } from '../types';
import { realDebridService } from '../services/realDebridService';

interface LibraryViewProps {
  onPlayMovie: (movie: Movie) => void;
}

function LibraryView({ onPlayMovie }: LibraryViewProps) {
  const [torrents, setTorrents] = useState<RealDebridTorrent[]>([]);
  const [selectedTorrent, setSelectedTorrent] = useState<RealDebridTorrent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRealDebridTorrents();
  }, []);

  const loadRealDebridTorrents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const rdTorrents = await realDebridService.getTorrents();
      // Only show downloaded torrents
      const downloadedTorrents = rdTorrents.filter(t => t.status === 'downloaded');
      setTorrents(downloadedTorrents);
    } catch (error) {
      console.error('Failed to load Real-Debrid torrents:', error);
      setError('Failed to load library. Please check your Real-Debrid connection.');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) {
      return `${gb.toFixed(1)} GB`;
    }
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const extractMovieInfo = (filename: string) => {
    const parts = filename.split('.');
    const title = parts[0].replace(/\./g, ' ');
    const year = filename.match(/(\d{4})/)?.[1] || '';
    const quality = filename.match(/(2160p|1080p|720p|480p)/i)?.[1] || 'Unknown';
    
    return { title, year, quality };
  };

  const getVideoFiles = (files: RealDebridFile[] | undefined) => {
    if (!files) return [];
    return files.filter(file => 
      file.path.match(/\.(mp4|mkv|avi|mov|wmv|m4v|flv|webm)$/i)
    );
  };

  const handlePlayFile = async (torrent: RealDebridTorrent, fileIndex?: number) => {
    try {
      const { title, year, quality } = extractMovieInfo(torrent.filename);
      
      let streamUrl = '';
      let fileId = '';
      
      if (fileIndex !== undefined && torrent.links && torrent.links[fileIndex]) {
        // Play specific file
        const unrestrictedLink = await realDebridService.unrestrictLink(torrent.links[fileIndex]);
        streamUrl = unrestrictedLink.download;
        fileId = unrestrictedLink.id;
      } else if (torrent.links && torrent.links.length > 0) {
        // Play first available link
        const unrestrictedLink = await realDebridService.unrestrictLink(torrent.links[0]);
        streamUrl = unrestrictedLink.download;
        fileId = unrestrictedLink.id;
      } else {
        throw new Error('No playable files found');
      }
      
      const movieData: Movie = {
        id: torrent.id,
        title: title,
        overview: `${quality} version from your Real-Debrid library`,
        posterUrl: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?w=300&h=450&fit=crop',
        backdropUrl: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?w=1200&h=675&fit=crop',
        releaseDate: year ? `${year}-01-01` : '2024-01-01',
        rating: 8.5,
        genre: ['Movie'],
        duration: 120,
        streamUrl: streamUrl,
        fileId: fileId
      };
      
      onPlayMovie(movieData);
    } catch (error) {
      console.error('Failed to start playback:', error);
      alert('Failed to start playback. Please try again.');
    }
  };

  const handleDeleteTorrent = async (torrentId: string) => {
    if (!confirm('Are you sure you want to delete this torrent from Real-Debrid?')) {
      return;
    }
    
    try {
      await realDebridService.deleteTorrent(torrentId);
      await loadRealDebridTorrents(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete torrent:', error);
      alert('Failed to delete torrent. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">My Library</h1>
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-800 rounded mb-3 w-3/4"></div>
              <div className="h-4 bg-gray-800 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-800 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">My Library</h1>
        <div className="text-center py-16">
          <HardDrive className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            Connection Error
          </h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={loadRealDebridTorrents}
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (selectedTorrent) {
    const videoFiles = getVideoFiles(selectedTorrent.files);
    
    return (
      <div className="p-8">
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => setSelectedTorrent(null)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold">Files in {selectedTorrent.filename}</h1>
        </div>

        <div className="space-y-3">
          {videoFiles.length === 0 ? (
            <div className="text-center py-16">
              <FileVideo className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                No video files found
              </h3>
              <p className="text-gray-500">
                This torrent doesn't contain any playable video files
              </p>
            </div>
          ) : (
            videoFiles.map((file, index) => {
              const { title, quality } = extractMovieInfo(file.path);
              
              return (
                <div
                  key={file.id}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <FileVideo className="w-5 h-5 text-blue-400" />
                        <h3 className="font-semibold">{title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${
                          quality === '2160p' ? 'bg-purple-600' :
                          quality === '1080p' ? 'bg-blue-600' :
                          quality === '720p' ? 'bg-green-600' : 'bg-gray-600'
                        }`}>
                          {quality}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>{formatFileSize(file.bytes)}</span>
                        <span className="font-mono text-xs">{file.path}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handlePlayFile(selectedTorrent, index)}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>Play</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Library</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-400">
            {torrents.length} torrents • {formatFileSize(torrents.reduce((acc, torrent) => acc + (torrent.bytes || 0), 0))} total
          </div>
          <button
            onClick={loadRealDebridTorrents}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Refresh Library
          </button>
        </div>
      </div>

      {torrents.length === 0 ? (
        <div className="text-center py-16">
          <HardDrive className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            Your library is empty
          </h3>
          <p className="text-gray-500 mb-4">
            Add some torrents to your Real-Debrid account to see them here
          </p>
          <p className="text-sm text-gray-600">
            Use the search feature to find content and add it to your library
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {torrents.map((torrent) => {
            const { title, year, quality } = extractMovieInfo(torrent.filename);
            const videoFiles = getVideoFiles(torrent.files);
            const hasMultipleFiles = videoFiles.length > 1;
            
            return (
              <div
                key={torrent.id}
                className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-all duration-200 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-lg">{title}</h3>
                      {year && (
                        <span className="bg-gray-700 px-2 py-1 rounded text-xs font-semibold">
                          {year}
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${
                        quality === '2160p' ? 'bg-purple-600' :
                        quality === '1080p' ? 'bg-blue-600' :
                        quality === '720p' ? 'bg-green-600' : 'bg-gray-600'
                      }`}>
                        {quality}
                      </span>
                      <span className="bg-green-600 px-2 py-1 rounded text-xs font-semibold text-white">
                        Downloaded
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <HardDrive className="w-4 h-4" />
                        <span>{formatFileSize(torrent.bytes || 0)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(torrent.added).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileVideo className="w-4 h-4" />
                        <span>{videoFiles.length} video file{videoFiles.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-2 font-mono">
                      {torrent.filename}
                    </p>
                  </div>
                  
                  <div className="flex space-x-3 ml-6">
                    {hasMultipleFiles ? (
                      <button
                        onClick={() => setSelectedTorrent(torrent)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                      >
                        <Folder className="w-4 h-4" />
                        <span>Browse Files</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePlayFile(torrent)}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                      >
                        <Play className="w-4 h-4" />
                        <span>Stream</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDeleteTorrent(torrent.id)}
                      className="bg-gray-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LibraryView;