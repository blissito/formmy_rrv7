export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  content?: string;
  favicon?: string;
  image?: string; // Open Graph image principal
  siteName?: string;
  publishedTime?: string;
}

export interface ImageGallery {
  url: string;
  images: string[];
  extractedAt: Date;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  timestamp: Date;
}

export interface ToolResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

export interface GhostyMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: SearchResult[];
  timestamp?: Date;
  tools?: string[];
}