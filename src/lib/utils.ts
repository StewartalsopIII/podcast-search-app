import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to get proper base URL for redirects, both in client and server contexts
export function getBaseUrl(req?: Request): string {
  // For server-side (middleware, API routes)
  if (req) {
    // Try to get from X-Forwarded headers (set by Nginx)
    const forwardedHost = req.headers.get('x-forwarded-host');
    const forwardedProto = req.headers.get('x-forwarded-proto');
    
    if (forwardedHost && forwardedProto) {
      return `${forwardedProto}://${forwardedHost}`;
    }
    
    // Fall back to host header
    const host = req.headers.get('host');
    if (host) {
      // Assume HTTPS in production
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      return `${protocol}://${host}`;
    }
  }
  
  // For client-side or when headers aren't available
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  // Last resort fallback - should be configured in ENV properly
  return 'https://search.getcrazywisdom.com';
}

// Utility to format timestamp (seconds) to MM:SS format
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Utility to break text into chunks of specified size
export function chunkText(
  text: string, 
  chunkSize: number = 1000, 
  overlap: number = 200
): string[] {
  const chunks: string[] = [];
  
  if (text.length <= chunkSize) {
    return [text];
  }
  
  let startIndex = 0;
  
  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;
    
    if (endIndex >= text.length) {
      chunks.push(text.slice(startIndex));
      break;
    }
    
    // Try to find a good breaking point (newline or period) within the last 20% of the chunk
    const searchStartIndex = Math.max(endIndex - Math.floor(chunkSize * 0.2), startIndex);
    const searchText = text.slice(searchStartIndex, endIndex);
    
    const lastPeriodIndex = searchText.lastIndexOf('. ');
    const lastNewlineIndex = searchText.lastIndexOf('\n');
    
    const breakpointIndex = Math.max(
      lastPeriodIndex !== -1 ? searchStartIndex + lastPeriodIndex + 2 : -1,
      lastNewlineIndex !== -1 ? searchStartIndex + lastNewlineIndex + 1 : -1
    );
    
    if (breakpointIndex !== -1) {
      endIndex = breakpointIndex;
    }
    
    chunks.push(text.slice(startIndex, endIndex));
    startIndex = endIndex - overlap;
  }
  
  return chunks;
}