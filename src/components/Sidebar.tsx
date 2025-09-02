import React from 'react';
import { Home, Search, Library, Plus, Download, Settings as SettingsIcon } from 'lucide-react';

type ViewType = 'home' | 'search' | 'library' | 'player';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onAddMagnet: () => void;
  onOpenSettings: () => void;
}

function Sidebar({ currentView, onViewChange, onAddMagnet, onOpenSettings }: SidebarProps) {
  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search Torrents', icon: Search },
    { id: 'library', label: 'My Library', icon: Library },
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-gray-950 border-r border-gray-800 z-40">
      <div className="p-6">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id as ViewType)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-red-600 text-white shadow-lg' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="mt-8 pt-6 border-t border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">
            Quick Actions
          </h3>
          
          <button
            onClick={onAddMagnet}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add Magnet Link</span>
          </button>
          
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 mt-2">
            <Download className="w-5 h-5" />
            <span className="font-medium">Downloads</span>
          </button>
          
          <button 
            onClick={onOpenSettings}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 mt-2"
          >
            <SettingsIcon className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-800">
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Real-Debrid Status</h4>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-200">Connected</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;