import { Movie, TorrentSearchResponse, TorrentResult } from '../types';
import { realDebridService } from './realDebridService';

class MovieService {
  async getTrendingMovies(): Promise<Movie[]> {
    // Return empty array since we're removing mock data
    // Users will need to search and add content to their library
    return [];
  }

  async searchTorrents(query: string, page: number = 1): Promise<TorrentResult[]> {
    try {
      const response = await fetch(`https://valradiant.xyz/rarbg.php?q=${encodeURIComponent(query)}&page=${page}`, {
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Search request failed');
      }
      
      const data: TorrentSearchResponse = await response.json();
      
      // Fix the API response mapping based on your provided structure
      const mappedResults: TorrentResult[] = (data.results || []).map(result => ({
        name: result.name,
        detailUrl: result.detailUrl,
        size: result.seeds, // API returns size in seeds field
        seeds: result.leech, // API returns seeds in leech field  
        leech: result.size, // API returns leech in size field
        magnet: result.magnet,
        date: result.size // API returns date in size field
      }));
      
      return mappedResults;
    } catch (error) {
      console.error('Error searching torrents:', error);
      throw new Error('Failed to search torrents');
    }
  }

  async addMagnetToRD(magnetLink: string, title: string): Promise<void> {
    try {
      await realDebridService.addMagnet(magnetLink);
    } catch (error) {
      console.error('Error adding magnet to Real-Debrid:', error);
      throw new Error('Failed to add magnet link to Real-Debrid');
    }
  }

  async checkInstantAvailability(magnetLink: string): Promise<boolean> {
    try {
      return await realDebridService.checkInstantAvailability(magnetLink);
    } catch (error) {
      console.error('Error checking instant availability:', error);
      return false;
    }
  }

  async streamFromMagnet(magnetLink: string, title: string): Promise<string> {
    try {
      return await realDebridService.processAndStream(magnetLink);
    } catch (error) {
      console.error('Error streaming from magnet:', error);
      throw new Error('Failed to start streaming');
    }
  }
}

export const movieService = new MovieService();