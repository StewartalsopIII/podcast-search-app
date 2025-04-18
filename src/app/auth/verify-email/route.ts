import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/utils';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  
  // Try to get the token from different possible parameters
  const token = requestUrl.searchParams.get('token') || 
                requestUrl.searchParams.get('confirmation_token') ||
                requestUrl.searchParams.get('t');
                
  const type = requestUrl.searchParams.get('type') || 'email';
  
  console.log('Verify-email route accessed with params:', { 
    url: request.url,
    token: token ? 'Token present' : 'No token', 
    type 
  });

  if (token) {
    try {
      const supabase = createRouteHandlerClient({ cookies });
      // Attempt verification using OTP method
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email'
      });
      
      if (error) {
        console.error('Email verification error:', error);
        // Try the secondary method - exchange code for session
        await supabase.auth.exchangeCodeForSession(token);
      } else {
        console.log('Successfully verified email');
      }
    } catch (error) {
      console.error('Error during email verification:', error);
    }
  }

  // Always redirect to home, successful or not
  const baseUrl = getBaseUrl(request);
  return NextResponse.redirect(new URL('/', baseUrl));
}