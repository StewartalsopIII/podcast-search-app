import { TranscriptUploadForm } from '@/components/forms/transcript-upload-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Upload Transcript | Podcast Search App',
  description: 'Upload a podcast transcript for semantic search',
};

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Upload Podcast Transcript
        </h1>
        <p className="text-muted-foreground">
          Upload a podcast transcript in Markdown format to make it searchable.
        </p>
      </div>
      
      <div className="grid gap-6">
        <div className="rounded-lg border p-6 shadow-sm">
          <TranscriptUploadForm />
        </div>
      </div>
    </div>
  );
}