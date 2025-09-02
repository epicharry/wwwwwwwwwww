import React, { useState, useEffect } from 'react';
import { Search, Plus, Home, Library, Download, Settings as SettingsIcon } from 'lucide-react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MovieGrid from './components/MovieGrid';
import TorrentSearch from './components/TorrentSearch';
import LibraryView from './components/LibraryView';
import VideoPlayer from './components/VideoPlayer';
import AddMagnetModal from './components/AddMagnetModal';
import Settings from './components/Settings';
import { Movie, TorrentResult } from './types';
import { movieService } from './services/movieService';

type ViewType = 'home' | 'search' | 'library' | 'player';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [searchResults, setSearchResults] = useState<TorrentResult[]>([]);
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [showAddMagnet, setShowAddMagnet] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // No longer loading trending movies since we removed mock data
    // Users will use search and library instead
  }, []);


  const handleSearch = async (query: string, page = 1) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setCurrentView('search');
    
    try {
      const results = await movieService.searchTorrents(query, page);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayMovie = (movie: Movie) => {
    setCurrentMovie(movie);
    setCurrentView('player');
  };

  const handleAddMagnet = async (magnetLink: string, title: string) => {
    try {
      // Add to Real-Debrid and local library
      await movieService.addMagnetToRD(magnetLink, title);
      setShowAddMagnet(false);
      // Refresh library if currently viewing
      if (currentView === 'library') {
        // Trigger library refresh
      }
    } catch (error) {
      console.error('Failed to add magnet:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header onSearch={handleSearch} />
      
      <div className="flex">
        <Sidebar 
          currentView={currentView}
          onViewChange={setCurrentView}
          onAddMagnet={() => setShowAddMagnet(true)}
          onOpenSettings={() => setShowSettings(true)}
        />
        
        <main className="flex-1 ml-64">
          {currentView === 'home' && (
            <div className="p-8">
              <div className="text-center py-16">
                <div className="w-32 h-32 bg-red-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <Search className="w-16 h-16 text-white" />
                </div>
                <h1 className="text-4xl font-bold mb-4">Welcome to StreamHub</h1>
                <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                  Your personal streaming platform powered by Real-Debrid. Search for content, 
                  add torrents to your library, and stream instantly.
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setCurrentView('search')}
                    className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                  >
                    <Search className="w-5 h-5" />
                    <span>Start Searching</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('library')}
                    className="bg-gray-700 hover:bg-gray-600 px-8 py-4 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                  >
                    <Library className="w-5 h-5" />
                    <span>View Library</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {currentView === 'search' && (
            <TorrentSearch 
              results={searchResults}
              loading={loading}
              onSearch={handleSearch}
              onPlayMovie={handlePlayMovie}
            />
          )}
          
          {currentView === 'library' && (
            <LibraryView onPlayMovie={handlePlayMovie} />
          )}
          
          {currentView === 'player' && currentMovie && (
            <VideoPlayer 
              movie={currentMovie}
              onBack={() => setCurrentView('home')}
            />
          )}
        </main>
      </div>
      
      {showAddMagnet && (
        <AddMagnetModal
          onAdd={handleAddMagnet}
          onClose={() => setShowAddMagnet(false)}
        />
      )}
      
      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

export default App;