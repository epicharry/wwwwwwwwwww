import React, { useState } from 'react';
import { Search, Download, ExternalLink, Magnet, Clock, Users, Play, Zap, AlertCircle } from 'lucide-react';
import { TorrentResult } from '../types';
import { movieService } from '../services/movieService';

interface TorrentSearchProps {
  results: TorrentResult[];
  loading: boolean;
  onSearch: (query: string, page?: number) => void;
  onPlayMovie: (movie: any) => void;
}

function TorrentSearch({ results, loading, onSearch, onPlayMovie }: TorrentSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [checkingAvailability, setCheckingAvailability] = useState<Set<number>>(new Set());
  const [instantAvailable, setInstantAvailable] = useState<Set<number>>(new Set());
  const [streamingTorrent, setStreamingTorrent] = useState<Set<number>>(new Set());

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setCurrentPage(1);
      onSearch(searchQuery, 1);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    onSearch(searchQuery, page);
  };

  const formatSize = (size: string) => {
    return size.includes('GB') || size.includes('MB') ? size : `${size} GB`;
  };

  const getQualityBadge = (name: string) => {
    if (name.includes('4K') || name.includes('2160p')) return { label: '4K', color: 'bg-purple-600' };
    if (name.includes('1080p')) return { label: '1080p', color: 'bg-blue-600' };
    if (name.includes('720p')) return { label: '720p', color: 'bg-green-600' };
    if (name.includes('480p')) return { label: '480p', color: 'bg-yellow-600' };
    return { label: 'SD', color: 'bg-gray-600' };
  };

  const checkInstantAvailability = async (torrent: TorrentResult, index: number) => {
    setCheckingAvailability(prev => new Set(prev).add(index));
    
    try {
      const isAvailable = await movieService.checkInstantAvailability(torrent.magnet);
      if (isAvailable) {
        setInstantAvailable(prev => new Set(prev).add(index));
      }
    } catch (error) {
      console.error('Failed to check availability:', error);
    } finally {
      setCheckingAvailability(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const handleStreamNow = async (torrent: TorrentResult, index: number) => {
    setStreamingTorrent(prev => new Set(prev).add(index));
    
    try {
      const streamUrl = await movieService.streamFromMagnet(torrent.magnet, torrent.name);
      
      const movieData = {
        id: `torrent-${index}`,
        title: torrent.name,
        overview: `Streaming from Real-Debrid - ${formatSize(torrent.size)}`,
        posterUrl: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?w=300&h=450&fit=crop',
        backdropUrl: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?w=1200&h=675&fit=crop',
        releaseDate: '2024-01-01',
        rating: 7.5,
        genre: ['Movie'],
        duration: 120,
        streamUrl: streamUrl
      };
      
      onPlayMovie(movieData);
    } catch (error) {
      console.error('Failed to start streaming:', error);
      alert('Failed to start streaming. The torrent may need time to process.');
    } finally {
      setStreamingTorrent(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const handleAddToRD = async (torrent: TorrentResult, index: number) => {
    try {
      await movieService.addMagnetToRD(torrent.magnet, torrent.name);
      alert('Torrent added to Real-Debrid successfully! Check your library once processing is complete.');
    } catch (error) {
      console.error('Failed to add to Real-Debrid:', error);
      alert('Failed to add torrent to Real-Debrid. Please check your API token.');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Search Torrents</h1>
        
        <form onSubmit={handleSearch} className="relative max-w-2xl">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for movies, TV shows, or any content..."
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-6 py-4 pl-14 text-lg focus:outline-none focus:border-red-500 transition-colors"
          />
          <Search className="absolute left-4 top-4 w-6 h-6 text-gray-400" />
          <button
            type="submit"
            className="absolute right-2 top-2 bg-red-600 hover:bg-red-700 rounded-lg px-6 py-2 font-semibold transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-800 rounded mb-3"></div>
              <div className="h-4 bg-gray-800 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-800 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-400">Found {results.length} results</p>
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300">
                Make sure your Real-Debrid API token is configured in Settings
              </span>
            </div>
          </div>
          
          <div className="grid gap-4">
            {results.map((torrent, index) => {
              const quality = getQualityBadge(torrent.name);
              const isChecking = checkingAvailability.has(index);
              const isInstant = instantAvailable.has(index);
              const isStreaming = streamingTorrent.has(index);
              
              return (
                <div
                  key={index}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-all duration-200 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="font-semibold text-lg line-clamp-2 flex-1">
                          {torrent.name}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${quality.color}`}>
                          {quality.label}
                        </span>
                        {isInstant && (
                          <span className="px-2 py-1 rounded text-xs font-semibold text-white bg-green-600 flex items-center space-x-1">
                            <Zap className="w-3 h-3" />
                            <span>Instant</span>
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-400 mb-4">
                        <div className="flex items-center space-x-1">
                          <Download className="w-4 h-4" />
                          <span>{formatSize(torrent.size)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4 text-green-400" />
                          <span className="text-green-400">{torrent.seeds}</span>
                          <span className="text-gray-500">/ {torrent.leech}</span>
                        </div>
                        
                        {torrent.date && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{torrent.date}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    {!isInstant && !isChecking && (
                      <button
                        onClick={() => checkInstantAvailability(torrent, index)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                      >
                        <Zap className="w-4 h-4" />
                        <span>Check Instant</span>
                      </button>
                    )}
                    
                    {isChecking && (
                      <button
                        disabled
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-2"
                      >
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Checking...</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleStreamNow(torrent, index)}
                      disabled={isStreaming}
                      className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                    >
                      {isStreaming ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Stream Now</span>
                        </>
                      )}
                    </button>
                    
                    <button 
                      onClick={() => handleAddToRD(torrent, index)}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Add to RD</span>
                    </button>
                    
                    <a
                      href={torrent.detailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
              >
                Previous
              </button>
              
              <span className="px-4 py-2 bg-gray-900 rounded-lg">
                Page {currentPage}
              </span>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            Start your search
          </h3>
          <p className="text-gray-500">
            Search for movies, TV shows, or any content you want to stream
          </p>
        </div>
      )}
    </div>
  );
}

export default TorrentSearch;