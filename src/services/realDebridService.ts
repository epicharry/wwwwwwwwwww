import { RealDebridTorrent, UnrestrictedLink, InstantAvailability } from '../types';

class RealDebridService {
  private baseUrl = 'https://api.real-debrid.com/rest/1.0';
  private apiToken: string | null = null;

  setApiToken(token: string) {
    this.apiToken = token;
    localStorage.setItem('rd_api_token', token);
  }

  getApiToken(): string | null {
    if (!this.apiToken) {
      this.apiToken = localStorage.getItem('rd_api_token');
    }
    return this.apiToken;
  }

  clearApiToken() {
    this.apiToken = null;
    localStorage.removeItem('rd_api_token');
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = this.getApiToken();
    if (!token) {
      throw new Error('No API token available');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async verifyToken(): Promise<boolean> {
    try {
      await this.makeRequest('/user');
      return true;
    } catch {
      return false;
    }
  }

  private extractHashFromMagnet(magnetLink: string): string {
    const match = magnetLink.match(/btih:([a-fA-F0-9]{40})/);
    return match ? match[1].toLowerCase() : '';
  }

  async checkInstantAvailability(magnetLink: string): Promise<boolean> {
    const hash = this.extractHashFromMagnet(magnetLink);
    if (!hash) {
      throw new Error('Invalid magnet link - could not extract hash');
    }

    try {
      const data: InstantAvailability = await this.makeRequest(`/torrents/instantAvailability/${hash}`);
      return Object.keys(data[hash] || {}).length > 0;
    } catch (error) {
      console.error('Error checking instant availability:', error);
      return false;
    }
  }

  async addMagnet(magnetLink: string): Promise<string> {
    const body = `magnet=${encodeURIComponent(magnetLink)}`;
    
    const data = await this.makeRequest('/torrents/addMagnet', {
      method: 'POST',
      body,
    });
    
    return data.id;
  }

  async selectFiles(torrentId: string, fileIds: string = 'all'): Promise<void> {
    const body = `files=${fileIds}`;
    
    await this.makeRequest(`/torrents/selectFiles/${torrentId}`, {
      method: 'POST',
      body,
    });
  }

  async getTorrentInfo(torrentId: string): Promise<RealDebridTorrent> {
    return this.makeRequest(`/torrents/info/${torrentId}`);
  }

  async getTorrents(): Promise<RealDebridTorrent[]> {
    return this.makeRequest('/torrents');
  }

  async unrestrictLink(link: string): Promise<UnrestrictedLink> {
    const body = `link=${encodeURIComponent(link)}`;
    
    return this.makeRequest('/unrestrict/link', {
      method: 'POST',
      body,
    });
  }

  async deleteTorrent(torrentId: string): Promise<void> {
    await this.makeRequest(`/torrents/delete/${torrentId}`, {
      method: 'DELETE',
    });
  }

  async getTranscodingOptions(fileId: string): Promise<any> {
    try {
      return await this.makeRequest(`/streaming/transcode/${fileId}`);
    } catch (error) {
      console.error('Error getting transcoding options:', error);
      throw new Error('Failed to get transcoding options');
    }
  }

  async processAndStream(magnetLink: string): Promise<string> {
    try {
      // Add magnet to Real-Debrid
      const torrentId = await this.addMagnet(magnetLink);
      
      // Select all files
      await this.selectFiles(torrentId);
      
      // Get torrent info to check status
      let torrentInfo = await this.getTorrentInfo(torrentId);
      
      // Wait for processing if needed
      let attempts = 0;
      while (torrentInfo.status !== 'downloaded' && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        torrentInfo = await this.getTorrentInfo(torrentId);
        attempts++;
      }
      
      if (torrentInfo.status !== 'downloaded') {
        throw new Error('Torrent processing timeout');
      }
      
      // Get the first available link
      if (torrentInfo.links.length === 0) {
        throw new Error('No download links available');
      }
      
      // Unrestrict the first link
      const unrestrictedLink = await this.unrestrictLink(torrentInfo.links[0]);
      
      return unrestrictedLink.download;
    } catch (error) {
      console.error('Error processing torrent for streaming:', error);
      throw error;
    }
  }
}

export const realDebridService = new RealDebridService();