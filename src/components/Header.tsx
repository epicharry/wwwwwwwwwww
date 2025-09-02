import React, { useState } from 'react';
import { Search, Bell, User } from 'lucide-react';

interface HeaderProps {
  onSearch: (query: string) => void;
}

function Header({ onSearch }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-black/90 backdrop-blur-sm z-50 border-b border-gray-800">
      <div className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center space-x-8">
          <h1 className="text-2xl font-bold text-red-600">StreamHub</h1>
          <nav className="hidden md:flex space-x-6">
            <a href="#" className="text-white hover:text-gray-300 transition-colors">Home</a>
            <a href="#" className="text-white hover:text-gray-300 transition-colors">Movies</a>
            <a href="#" className="text-white hover:text-gray-300 transition-colors">TV Shows</a>
            <a href="#" className="text-white hover:text-gray-300 transition-colors">My List</a>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies, torrents..."
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 pl-10 w-80 focus:outline-none focus:border-red-500 transition-colors"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </form>
          
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;