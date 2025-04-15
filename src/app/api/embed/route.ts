import { createApiClient } from '@/lib/supabase-server';
import { getEmbeddingService } from '@/lib/embeddingService';
import { NextResponse } from 'next/server';
import { TranscriptUploadPayload } from '@/types';

// Function to chunk text content
function chunkContent(
  content: string, 
  chunkSize: number = 1000, 
  overlap: number = 200
): { text: string; start_time?: number; end_time?: number }[] {
  // This is a simplified implementation
  // A production solution would handle timestamps and proper chunking
  
  const chunks: { text: string; start_time?: number; end_time?: number }[] = [];
  const lines = content.split('\n');
  let currentChunk = '';
  let startTime = 0;
  let currentTime = 0;
  
  for (const line of lines) {
    // Check for timestamp format [00:00:00]
    const timeMatch = line.match(/\[(\d{2}):(\d{2})(?::(\d{2}))?\]/);
    
    if (timeMatch) {
      const hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const seconds = timeMatch[3] ? parseInt(timeMatch[3]) : 0;
      currentTime = hours * 3600 + minutes * 60 + seconds;
      
      if (currentChunk === '') {
        startTime = currentTime;
      }
    }
    
    currentChunk += line + '\n';
    
    // If we exceed chunk size, save the chunk and start a new one with overlap
    if (currentChunk.length >= chunkSize) {
      chunks.push({
        text: currentChunk.trim(),
        start_time: startTime,
        end_time: currentTime
      });
      
      // Find a good breaking point for the overlap
      const lastNewlineIndex = currentChunk.slice(0, -overlap).lastIndexOf('\n');
      if (lastNewlineIndex !== -1) {
        currentChunk = currentChunk.slice(lastNewlineIndex + 1);
        
        // Adjust the start time for the new chunk
        const newStartTimeMatch = currentChunk.match(/\[(\d{2}):(\d{2})(?::(\d{2}))?\]/);
        if (newStartTimeMatch) {
          const hours = parseInt(newStartTimeMatch[1]);
          const minutes = parseInt(newStartTimeMatch[2]);
          const seconds = newStartTimeMatch[3] ? parseInt(newStartTimeMatch[3]) : 0;
          startTime = hours * 3600 + minutes * 60 + seconds;
        }
      } else {
        currentChunk = currentChunk.slice(-overlap);
      }
    }
  }
  
  // Add the last chunk if there's anything left
  if (currentChunk.trim().length > 0) {
    chunks.push({
      text: currentChunk.trim(),
      start_time: startTime,
      end_time: currentTime
    });
  }
  
  return chunks;
}

export async function POST(request: Request) {
  try {
    console.log('POST request to /api/embed received');
    const supabase = await createApiClient();
    
    // Check authentication
    console.log('Checking authentication...');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('Authentication failed: No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    console.log(`Authenticated as user: ${userId}`);
    
    // Get request body
    console.log('Parsing request body...');
    const body: TranscriptUploadPayload = await request.json();
    
    if (!body.content || !body.episode_id) {
      console.log('Missing required fields in request body');
      return NextResponse.json(
        { error: 'Missing required fields: content, episode_id' }, 
        { status: 400 }
      );
    }
    
    console.log(`Request received for episode_id: ${body.episode_id}, content length: ${body.content.length} chars`);
    
    // Initialize the embedding service
    console.log('Initializing embedding service...');
    const embeddingService = getEmbeddingService();
    console.log(`Using embedding service with dimension: ${embeddingService.getDimension()}`);
    
    // Chunk the transcript content
    console.log('Chunking transcript content...');
    const chunks = chunkContent(
      body.content,
      body.chunk_size,
      body.chunk_overlap
    );
    console.log(`Created ${chunks.length} chunks from transcript`);
    
    // Process each chunk
    const results = [];
    console.log('Processing chunks and generating embeddings...');
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing chunk ${i+1}/${chunks.length} (${chunk.text.length} chars)`);
      try {
        // Generate embeddings
        console.log(`Generating embedding for chunk ${i+1}...`);
        const embedding = await embeddingService.generateEmbedding(chunk.text);
        console.log(`Embedding generated successfully (${embedding.length} dimensions)`);
        
        // Store in database
        console.log(`Inserting chunk ${i+1} into database...`);
        const { data, error } = await supabase
          .from('podcast_chunks')
          .insert({
            user_id: userId,
            episode_id: body.episode_id,
            content: chunk.text,
            start_time: chunk.start_time || 0,
            end_time: chunk.end_time || 0,
            embedding: embedding
          })
          .select('id');
        
        if (error) {
          console.error(`Error storing chunk ${i+1}:`, error);
          continue; // Skip this chunk but continue processing others
        }
        
        console.log(`Successfully stored chunk ${i+1} with ID: ${data[0].id}`);
        results.push(data[0]);
      } catch (error) {
        console.error(`Error processing chunk ${i+1}:`, error);
        // Continue with other chunks
      }
    }
    
    console.log(`Completed processing. Successfully stored ${results.length} of ${chunks.length} chunks.`);
    return NextResponse.json({ 
      success: true, 
      message: `Processed ${results.length} chunks out of ${chunks.length}`,
      chunks_processed: results.length
    });
    
  } catch (error) {
    console.error('Error in /api/embed endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to process transcript' }, 
      { status: 500 }
    );
  }
}