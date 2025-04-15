export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface TranscriptChunk {
  id: string;
  user_id: string;
  episode_id: string;
  content: string;
  start_time: number;
  end_time: number;
  embedding?: number[];
  created_at: string;
}

export interface SearchResult {
  id: string;
  user_id: string;
  episode_id: string;
  content: string;
  start_time: number;
  end_time: number;
  similarity: number;
}

export interface TranscriptUploadPayload {
  episode_id: string;
  content: string;
  chunk_size?: number;
  chunk_overlap?: number;
}

export interface SearchQueryPayload {
  query: string;
  limit?: number;
  threshold?: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}