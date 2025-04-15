-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ==================================================================
-- IMPORTANT: SET YOUR EMBEDDING DIMENSION BEFORE RUNNING!
-- Change the 'embedding_dimension' variable below to match your model:
-- - OpenAI text-embedding-3-small: 1536
-- - BGE bge-base-en-v1.5: 768
-- ==================================================================
DO $$
DECLARE
    -- <<< SET YOUR DIMENSION HERE >>>
    embedding_dimension INT := 1536;
BEGIN
    -- Create podcast_chunks table with pgvector support
    -- Using format() to safely inject the dimension variable into the SQL string
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS podcast_chunks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          episode_id TEXT NOT NULL,
          content TEXT NOT NULL,
          start_time REAL NOT NULL DEFAULT 0,
          end_time REAL NOT NULL DEFAULT 0,
          embedding VECTOR(%s), -- Dimension injected here
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        );',
        embedding_dimension -- Value passed to %s placeholder
    );

    -- Create an HNSW index for faster similarity searches
    -- Manually naming the index for easier dropping/recreating if dimensions change
    EXECUTE format('
        CREATE INDEX IF NOT EXISTS podcast_chunks_embedding_idx ON podcast_chunks USING hnsw (embedding vector_cosine_ops);'
    );

    -- Create similarity search function
    -- Function signature and body must also use the correct dimension
    EXECUTE format('
        CREATE OR REPLACE FUNCTION match_podcast_chunks(
          query_embedding VECTOR(%s),        -- Dimension injected here
          match_threshold FLOAT,
          match_count INT,
          query_user_id UUID                 -- Renamed parameter to avoid conflict
        )
        RETURNS TABLE (
          id UUID,
          user_id UUID,
          episode_id TEXT,
          content TEXT,
          start_time REAL,
          end_time REAL,
          similarity FLOAT
        )
        LANGUAGE plpgsql
        AS $function$
        BEGIN
          RETURN QUERY
          SELECT
            pc.id,
            pc.user_id,
            pc.episode_id,
            pc.content,
            pc.start_time,
            pc.end_time,
            1 - (pc.embedding <=> query_embedding) AS similarity
          FROM podcast_chunks pc
          WHERE pc.user_id = query_user_id -- Use the function parameter here
          AND 1 - (pc.embedding <=> query_embedding) > match_threshold
          ORDER BY similarity DESC
          LIMIT match_count;
        END;
        $function$;',
        embedding_dimension -- Pass dimension value for the function signature
    );
END $$;

-- Enable Row Level Security (run separately to ensure table exists)
-- This command is idempotent, safe to run even if already enabled.
ALTER TABLE podcast_chunks ENABLE ROW LEVEL SECURITY;

-- Create policies for Row Level Security (run separately or after table creation)
-- Policies are idempotent on CREATE IF NOT EXISTS, but simpler to run CREATE POLICY
-- Dropping and recreating policies is also safe if needed.

DROP POLICY IF EXISTS "Users can insert their own podcast chunks" ON podcast_chunks;
CREATE POLICY "Users can insert their own podcast chunks"
  ON podcast_chunks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own podcast chunks" ON podcast_chunks;
CREATE POLICY "Users can update their own podcast chunks"
  ON podcast_chunks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id); -- Added WITH CHECK for update safety

DROP POLICY IF EXISTS "Users can select their own podcast chunks" ON podcast_chunks;
CREATE POLICY "Users can select their own podcast chunks"
  ON podcast_chunks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own podcast chunks" ON podcast_chunks;
CREATE POLICY "Users can delete their own podcast chunks"
  ON podcast_chunks FOR DELETE
  USING (auth.uid() = user_id);

-- ==================================================================
-- REMINDER: If you switch embedding providers with different dimensions:
-- ==================================================================
-- 1. Update the 'embedding_dimension' variable in this script AND your app's
--    EMBEDDING_DIMENSION environment variable.
-- 2. Alter the table column type:
--    ALTER TABLE podcast_chunks ALTER COLUMN embedding TYPE VECTOR(new_dimension); -- Replace new_dimension
-- 3. Recreate the HNSW index:
--    DROP INDEX IF EXISTS podcast_chunks_embedding_idx;
--    CREATE INDEX podcast_chunks_embedding_idx ON podcast_chunks USING hnsw (embedding vector_cosine_ops);
-- 4. Rerun the DO $$ ... END $$ block above to update the match_podcast_chunks function definition.
-- 5. Re-embed and update all existing data in the podcast_chunks table using the new provider.
-- ==================================================================