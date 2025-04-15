'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

const uploadSchema = z.object({
  episodeId: z.string().min(1, { message: 'Episode ID is required' }),
  transcriptFile: z.instanceof(FileList).refine((files) => files.length > 0, {
    message: 'Transcript file is required',
  }),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

export function TranscriptUploadForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
  });

  const onSubmit = async (data: UploadFormValues) => {
    setIsLoading(true);
    setError(null);
    setProgress(0);

    try {
      const file = data.transcriptFile[0];
      
      // Read the file content
      const fileContent = await readFileAsText(file);
      
      // Upload to API
      const response = await fetch('/api/embed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          episode_id: data.episodeId,
          content: fileContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload transcript');
      }

      const result = await response.json();
      setProgress(100);
      
      // Redirect to transcript view or search page
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1000);
    } catch (error: any) {
      setError(error.message || 'Failed to upload transcript');
      setProgress(null);
    } finally {
      setIsLoading(false);
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target?.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Upload Transcript</h2>
        <p className="text-sm text-muted-foreground">
          Upload a podcast transcript in Markdown format with timestamps
        </p>
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="episodeId">
            Episode ID
          </label>
          <Input
            id="episodeId"
            placeholder="e.g., episode-42"
            disabled={isLoading}
            {...register('episodeId')}
          />
          {errors.episodeId && (
            <p className="text-sm text-red-500">{errors.episodeId.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="transcriptFile">
            Transcript File (.md)
          </label>
          <Input
            id="transcriptFile"
            type="file"
            accept=".md,.txt"
            disabled={isLoading}
            {...register('transcriptFile')}
          />
          {errors.transcriptFile && (
            <p className="text-sm text-red-500">{errors.transcriptFile.message}</p>
          )}
        </div>
        
        {progress !== null && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-primary h-2.5 rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Upload and Process'}
        </Button>
      </form>
      
      <div className="bg-muted p-4 rounded-md">
        <h3 className="font-medium mb-2">Transcript Format</h3>
        <p className="text-sm mb-2">
          Upload transcripts in Markdown format with timestamps:
        </p>
        <pre className="bg-background p-2 rounded text-xs overflow-x-auto">
          {`# Episode Title

[00:00:00] Host: Welcome to the podcast...

[00:01:30] Guest: Thanks for having me...

[00:04:15] Host: Let's discuss...`}
        </pre>
      </div>
    </div>
  );
}