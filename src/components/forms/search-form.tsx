'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchResult } from '@/types';
import { formatTime } from '@/lib/utils';

export function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Update URL with search query
      const params = new URLSearchParams(searchParams);
      params.set('q', query);
      router.push(`/?${params.toString()}`);
      
      // Fetch search results
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Search failed');
      }
      
      const data = await response.json();
      setResults(data.results || []);
      
    } catch (error: any) {
      setError(error.message || 'Search failed');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex space-x-2">
        <Input
          type="search"
          placeholder="Search your podcast transcripts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-grow"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </Button>
      </form>
      
      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">
          {error}
        </div>
      )}
      
      {results.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Search Results</h2>
          <div className="space-y-4">
            {results.map((result) => (
              <div key={result.id} className="border rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-primary">
                    {result.episode_id}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {formatTime(result.start_time)} - {formatTime(result.end_time)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{result.content}</p>
                <div className="mt-2 text-xs text-muted-foreground">
                  Match score: {(result.similarity * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : initialQuery && !isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          No results found for &quot;{initialQuery}&quot;
        </div>
      ) : null}
    </div>
  );
}