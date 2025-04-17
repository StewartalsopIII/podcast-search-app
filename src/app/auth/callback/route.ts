import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/utils';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    try {
      const supabase = createRouteHandlerClient({ cookies });
      await supabase.auth.exchangeCodeForSession(code);
      console.log('Successfully exchanged code for session at /auth/callback');
    } catch (error) {
      console.error('Error exchanging code for session:', error);
    }
  }

  // Use our utility to get the correct base URL
  const baseUrl = getBaseUrl(request);
  return NextResponse.redirect(new URL('/', baseUrl));
}