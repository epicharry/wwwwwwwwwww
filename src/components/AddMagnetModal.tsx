import React, { useState } from 'react';
import { X, Magnet, Plus, AlertCircle } from 'lucide-react';

interface AddMagnetModalProps {
  onAdd: (magnetLink: string, title: string) => void;
  onClose: () => void;
}

function AddMagnetModal({ onAdd, onClose }: AddMagnetModalProps) {
  const [magnetLink, setMagnetLink] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateMagnetLink = (link: string) => {
    return link.startsWith('magnet:?xt=urn:btih:');
  };

  const extractTitleFromMagnet = (link: string) => {
    const match = link.match(/&dn=([^&]+)/);
    if (match) {
      return decodeURIComponent(match[1].replace(/\+/g, ' '));
    }
    return '';
  };

  const handleMagnetChange = (link: string) => {
    setMagnetLink(link);
    setError('');
    
    if (link && validateMagnetLink(link)) {
      const extractedTitle = extractTitleFromMagnet(link);
      if (extractedTitle && !title) {
        setTitle(extractedTitle);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!magnetLink.trim()) {
      setError('Please enter a magnet link');
      return;
    }
    
    if (!validateMagnetLink(magnetLink)) {
      setError('Invalid magnet link format');
      return;
    }
    
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    setLoading(true);
    try {
      await onAdd(magnetLink, title);
    } catch (err) {
      setError('Failed to add magnet link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-red-600 rounded-lg p-2">
              <Magnet className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold">Add Magnet Link</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Magnet Link
            </label>
            <textarea
              value={magnetLink}
              onChange={(e) => handleMagnetChange(e.target.value)}
              placeholder="magnet:?xt=urn:btih:..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition-colors resize-none"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              Paste your magnet link here. The title will be extracted automatically.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a custom title (optional)"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
          
          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-300">{error}</span>
            </div>
          )}
          
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="font-semibold mb-2 text-green-400">What happens next?</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Magnet link will be added to your Real-Debrid account</li>
              <li>• Files will be processed and made available for streaming</li>
              <li>• You'll be able to stream instantly once processing completes</li>
              <li>• Content will appear in your library for future access</li>
            </ul>
          </div>
          
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !magnetLink.trim() || !title.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Add to Real-Debrid</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddMagnetModal;