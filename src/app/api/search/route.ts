import { createApiClient } from '@/lib/supabase-server';
import { getEmbeddingService } from '@/lib/embeddingService';
import { NextResponse } from 'next/server';
import { SearchQueryPayload, SearchResult } from '@/types';

export async function GET(request: Request) {
  try {
    const supabase = createApiClient();
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limitParam = searchParams.get('limit');
    const thresholdParam = searchParams.get('threshold');
    
    if (!query) {
      return NextResponse.json(
        { error: 'Missing required parameter: q' }, 
        { status: 400 }
      );
    }
    
    const limit = limitParam ? parseInt(limitParam, 10) : 5;
    const threshold = thresholdParam ? parseFloat(thresholdParam) : 0.5;
    
    // Initialize the embedding service
    const embeddingService = getEmbeddingService();
    
    // Generate embedding for the query
    const queryEmbedding = await embeddingService.generateEmbedding(query);
    
    // Perform similarity search in Supabase
    const { data, error } = await supabase.rpc('match_podcast_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
      user_id: userId
    });
    
    if (error) {
      console.error('Error performing similarity search:', error);
      return NextResponse.json(
        { error: 'Failed to perform search' }, 
        { status: 500 }
      );
    }
    
    // If we don't have a stored function, we can do a direct query instead
    // This is less efficient but works if the function isn't set up
    /*
    const { data, error } = await supabase
      .from('podcast_chunks')
      .select('id, user_id, episode_id, content, start_time, end_time')
      .eq('user_id', userId)
      .order('embedding <=> $1', { ascending: true })
      .limit(limit);
    */
    
    return NextResponse.json({ 
      results: data || [],
      query: query
    });
    
  } catch (error) {
    console.error('Error in /api/search endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' }, 
      { status: 500 }
    );
  }
}