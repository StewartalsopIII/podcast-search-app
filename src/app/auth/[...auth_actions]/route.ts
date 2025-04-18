import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/utils';

export async function GET(
  request: Request,
  { params }: { params: { auth_actions: string[] } }
) {
  const requestUrl = new URL(request.url);
  const pathSegments = params.auth_actions;
  
  // Get any tokens from URL parameters
  const token = requestUrl.searchParams.get('token') || 
                requestUrl.searchParams.get('confirmation_token') ||
                requestUrl.searchParams.get('t') ||
                requestUrl.searchParams.get('code');
  
  console.log('Auth catch-all route accessed:', { 
    path: pathSegments.join('/'),
    url: request.url,
    token: token ? 'Token present' : 'No token'
  });

  if (token) {
    try {
      const supabase = createRouteHandlerClient({ cookies });
      
      // Try different verification methods based on the path
      if (pathSegments.includes('verify') || pathSegments.includes('verify-email')) {
        // Try OTP method first
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email'
        });
        
        if (error) {
          console.error('OTP verification error:', error);
          // Fall back to exchangeCodeForSession
          await supabase.auth.exchangeCodeForSession(token);
        }
      } else if (pathSegments.includes('callback')) {
        // Handle callback-style verification
        await supabase.auth.exchangeCodeForSession(token);
      } else {
        // Generic approach - try both methods
        try {
          await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'email'
          });
        } catch (e) {
          // Fall back to code exchange
          await supabase.auth.exchangeCodeForSession(token);
        }
      }
    } catch (error) {
      console.error('Error during auth action:', error);
    }
  }

  // Always redirect to home after processing
  const baseUrl = getBaseUrl(request);
  return NextResponse.redirect(new URL('/', baseUrl));
}