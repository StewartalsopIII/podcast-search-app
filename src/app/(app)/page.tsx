import { SearchForm } from '@/components/forms/search-form';
import { createServerSideClient } from '@/lib/supabase-server';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search | Podcast Search App',
  description: 'Search your podcast transcripts with semantic search',
};

export default async function HomePage() {
  const supabase = createServerSideClient();
  
  // Get user's transcript count
  const { count } = await supabase
    .from('podcast_chunks')
    .select('id', { count: 'exact', head: true });
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Search Your Podcast Transcripts
        </h1>
        <p className="text-muted-foreground">
          Use semantic search to find exactly what you&apos;re looking for across your podcast transcripts.
        </p>
      </div>
      
      <div className="grid gap-6">
        <div className="rounded-lg border p-6 shadow-sm">
          <SearchForm />
        </div>
        
        <div className="rounded-lg border p-6 shadow-sm bg-muted/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Library</h2>
            <a 
              href="/upload"
              className="text-primary text-sm hover:underline"
            >
              Upload New Transcript
            </a>
          </div>
          <div className="mt-4">
            <p>
              {count 
                ? `You have ${count} transcript segments in your library.` 
                : "You don't have any transcripts yet. Upload your first one to get started."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}