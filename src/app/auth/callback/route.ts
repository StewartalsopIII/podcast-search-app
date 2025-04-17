import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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

  // Use NEXT_PUBLIC_SITE_URL for the redirect if available, fallback to origin
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://search.getcrazywisdom.com';
  return NextResponse.redirect(new URL('/', siteUrl));
}