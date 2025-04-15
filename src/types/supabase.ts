export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      podcast_chunks: {
        Row: {
          id: string
          user_id: string
          episode_id: string
          content: string
          start_time: number
          end_time: number
          embedding: number[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          episode_id: string
          content: string
          start_time: number
          end_time: number
          embedding: number[]
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          episode_id?: string
          content?: string
          start_time?: number
          end_time?: number
          embedding?: number[]
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "podcast_chunks_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_podcast_chunks: {
        Args: {
          query_embedding: number[]
          match_threshold: number
          match_count: number
          user_id: string
        }
        Returns: {
          id: string
          user_id: string
          episode_id: string
          content: string
          start_time: number
          end_time: number
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}