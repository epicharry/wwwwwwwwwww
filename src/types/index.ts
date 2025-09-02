export interface Movie {
  id: string;
  title: string;
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  releaseDate: string;
  rating: number;
  genre: string[];
  duration: number;
  streamUrl?: string;
  magnetLink?: string;
  fileId?: string;
}

export interface TorrentResult {
  name: string;
  detailUrl: string;
  size: string;
  seeds: string;
  leech: string;
  magnet: string;
  date?: string;
}

export interface TorrentSearchResponse {
  query: string;
  page: number;
  limit: number;
  totalPages: number;
  results: TorrentResult[];
}

export interface RealDebridFile {
  id: number;
  path: string;
  bytes: number;
  selected: number;
}

export interface RealDebridTorrent {
  id: string;
  filename: string;
  original_filename: string;
  hash: string;
  bytes: number;
  original_bytes: number;
  host: string;
  split: number;
  progress: number;
  status: string;
  added: string;
  files: RealDebridFile[];
  links: string[];
  ended?: string;
  speed?: number;
  seeders?: number;
}

export interface UnrestrictedLink {
  id: string;
  filename: string;
  mimeType: string;
  filesize: number;
  link: string;
  host: string;
  chunks: number;
  crc: number;
  download: string;
  streamable: number;
}

export interface InstantAvailability {
  [hash: string]: {
    [quality: string]: {
      [fileId: string]: {
        filename: string;
        filesize: number;
      };
    };
  };
}