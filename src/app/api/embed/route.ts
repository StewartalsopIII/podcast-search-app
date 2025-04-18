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

// Configure with higher timeout to avoid 504 Gateway Timeout
export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '10mb'
    },
  },
  // Next.js doesn't directly support setting an API timeout, but we'll log duration info
};

export async function POST(request: Request) {
  const startTime = Date.now();
  let memBefore = 0;
  let memAfter = 0;
  
  try {
    // Log memory usage
    memBefore = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`[MEMORY] Initial heap used: ${memBefore.toFixed(2)} MB`);
    
    console.log('[TIMING] POST request to /api/embed received at', new Date().toISOString());
    const supabase = await createApiClient();
    
    // Check authentication
    console.log('[TIMING] Checking authentication...');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('Authentication failed: No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    console.log(`Authenticated as user: ${userId}`);
    
    // Get request body
    console.log('[TIMING] Parsing request body...');
    const bodyText = await request.text();
    console.log(`[TIMING] Request body size: ${(bodyText.length / 1024).toFixed(2)} KB`);
    
    let body: TranscriptUploadPayload;
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      console.error('[ERROR] JSON parse error:', e);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' }, 
        { status: 400 }
      );
    }
    
    if (!body.content || !body.episode_id) {
      console.log('Missing required fields in request body');
      return NextResponse.json(
        { error: 'Missing required fields: content, episode_id' }, 
        { status: 400 }
      );
    }
    
    console.log(`Request received for episode_id: ${body.episode_id}, content length: ${body.content.length} chars`);
    
    // Initialize the embedding service
    console.log('[TIMING] Initializing embedding service...');
    const embeddingService = getEmbeddingService();
    console.log(`Using embedding service with dimension: ${embeddingService.getDimension()}`);
    
    // Chunk the transcript content
    console.log('[TIMING] Chunking transcript content...');
    const chunkStartTime = Date.now();
    const chunks = chunkContent(
      body.content,
      body.chunk_size,
      body.chunk_overlap
    );
    console.log(`[TIMING] Chunking completed in ${Date.now() - chunkStartTime}ms`);
    console.log(`Created ${chunks.length} chunks from transcript`);
    
    // Log memory after chunking
    const memAfterChunking = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`[MEMORY] After chunking: ${memAfterChunking.toFixed(2)} MB (${(memAfterChunking - memBefore).toFixed(2)} MB increase)`);
    
    // Process chunks in batches to manage memory
    const results = [];
    console.log('[TIMING] Processing chunks and generating embeddings...');
    
    // Define batch size (process this many chunks at once)
    const BATCH_SIZE = 5;
    const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);
    
    // Process chunks in batches
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStartTime = Date.now();
      const batchStartIdx = batchIndex * BATCH_SIZE;
      const batchEndIdx = Math.min((batchIndex + 1) * BATCH_SIZE, chunks.length);
      const currentBatch = chunks.slice(batchStartIdx, batchEndIdx);
      
      console.log(`[TIMING] Processing batch ${batchIndex+1}/${totalBatches} (chunks ${batchStartIdx+1}-${batchEndIdx})`);
      
      // Process each chunk in the current batch
      for (let i = 0; i < currentBatch.length; i++) {
        const chunkIndex = batchStartIdx + i;
        const chunkStartTime = Date.now();
        const chunk = currentBatch[i];
        console.log(`[TIMING] Processing chunk ${chunkIndex+1}/${chunks.length} (${chunk.text.length} chars)`);
        
        try {
          // Generate embeddings
          const embedStartTime = Date.now();
          console.log(`[TIMING] Generating embedding for chunk ${chunkIndex+1}...`);
          const embedding = await embeddingService.generateEmbedding(chunk.text);
          console.log(`[TIMING] Embedding for chunk ${chunkIndex+1} generated in ${Date.now() - embedStartTime}ms (${embedding.length} dimensions)`);
          
          // Store in database
          const dbStartTime = Date.now();
          console.log(`[TIMING] Inserting chunk ${chunkIndex+1} into database...`);
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
          
          console.log(`[TIMING] Database insert for chunk ${chunkIndex+1} completed in ${Date.now() - dbStartTime}ms`);
          
          if (error) {
            console.error(`[ERROR] Error storing chunk ${chunkIndex+1}:`, error);
            continue; // Skip this chunk but continue processing others
          }
          
          console.log(`Successfully stored chunk ${chunkIndex+1} with ID: ${data[0].id}`);
          console.log(`[TIMING] Total processing time for chunk ${chunkIndex+1}: ${Date.now() - chunkStartTime}ms`);
          results.push(data[0]);
        } catch (error) {
          console.error(`[ERROR] Error processing chunk ${chunkIndex+1}:`, error);
          // Continue with other chunks
        }
      }
      
      // After each batch, force garbage collection and log memory
      const batchMem = process.memoryUsage().heapUsed / 1024 / 1024;
      console.log(`[MEMORY] After batch ${batchIndex+1}: ${batchMem.toFixed(2)} MB`);
      console.log(`[TIMING] Batch ${batchIndex+1} completed in ${Date.now() - batchStartTime}ms`);
      
      // Small delay between batches to allow garbage collection
      if (batchIndex < totalBatches - 1) {
        console.log(`[TIMING] Pausing briefly between batches...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Final memory usage
    memAfter = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`[MEMORY] Final heap used: ${memAfter.toFixed(2)} MB (${(memAfter - memBefore).toFixed(2)} MB increase)`);
    
    const totalTime = Date.now() - startTime;
    console.log(`[TIMING] Completed processing in ${totalTime}ms. Successfully stored ${results.length} of ${chunks.length} chunks.`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Processed ${results.length} chunks out of ${chunks.length}`,
      chunks_processed: results.length,
      processing_time_ms: totalTime
    });
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[ERROR] Error in /api/embed endpoint after ${totalTime}ms:`, error);
    
    // Final memory usage in case of error
    memAfter = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`[MEMORY] Final heap used (error state): ${memAfter.toFixed(2)} MB (${(memAfter - memBefore).toFixed(2)} MB increase)`);
    
    return NextResponse.json(
      { error: 'Failed to process transcript', processing_time_ms: totalTime }, 
      { status: 500 }
    );
  }
}