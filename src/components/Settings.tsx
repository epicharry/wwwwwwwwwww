import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Key, Save, AlertCircle, CheckCircle, ExternalLink, X } from 'lucide-react';
import { realDebridService } from '../services/realDebridService';

interface SettingsProps {
  onClose: () => void;
}

function Settings({ onClose }: SettingsProps) {
  const [apiToken, setApiToken] = useState('');
  const [savedToken, setSavedToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Load saved token from localStorage
    const saved = localStorage.getItem('rd_api_token');
    if (saved) {
      setSavedToken(saved);
      setApiToken(saved);
      realDebridService.setApiToken(saved);
    }
  }, []);

  const handleSave = async () => {
    if (!apiToken.trim()) {
      return;
    }

    setSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('rd_api_token', apiToken);
      setSavedToken(apiToken);
      
      // Set in service
      realDebridService.setApiToken(apiToken);
      
      // Test the connection
      await testConnection();
    } catch (error) {
      console.error('Error saving API token:', error);
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!apiToken.trim()) {
      return;
    }

    setTestingConnection(true);
    setConnectionStatus('idle');
    
    try {
      // Test by verifying the token
      const isValid = await realDebridService.verifyToken();
      if (isValid) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
    } finally {
      setTestingConnection(false);
    }
  };

  const clearToken = () => {
    setApiToken('');
    setSavedToken('');
    localStorage.removeItem('rd_api_token');
    setConnectionStatus('idle');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-red-600 rounded-lg p-2">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Real-Debrid Configuration</h3>
            
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-blue-300 font-medium mb-1">How to get your API token:</p>
                  <ol className="text-blue-200 space-y-1 list-decimal list-inside">
                    <li>Go to <a href="https://real-debrid.com/apitoken" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Real-Debrid API page</a></li>
                    <li>Log in to your Real-Debrid account</li>
                    <li>Copy your API token</li>
                    <li>Paste it below and save</li>
                  </ol>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  API Token
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    placeholder="Enter your Real-Debrid API token"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:border-red-500 transition-colors"
                  />
                  <Key className="absolute right-4 top-3.5 w-5 h-5 text-gray-400" />
                </div>
              </div>
              
              {connectionStatus === 'success' && (
                <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-green-300">Connection successful!</span>
                </div>
              )}
              
              {connectionStatus === 'error' && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-sm text-red-300">Connection failed. Please check your API token.</span>
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={handleSave}
                  disabled={saving || !apiToken.trim() || apiToken === savedToken}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Save Token</span>
                </button>
                
                <button
                  onClick={testConnection}
                  disabled={testingConnection || !apiToken.trim()}
                  className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                >
                  {testingConnection ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>Test Connection</span>
                </button>
                
                {savedToken && (
                  <button
                    onClick={clearToken}
                    className="bg-gray-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold mb-4">About Real-Debrid</h3>
            <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-300">
              <p className="mb-2">
                Real-Debrid is a premium service that provides high-speed downloads and streaming 
                from various file hosting services and torrents.
              </p>
              <p>
                With Real-Debrid, you can instantly stream torrents that are already cached on 
                their servers, or add new torrents for processing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;