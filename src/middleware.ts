import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Process the verification code if present (handles root path verification links)
  const code = req.nextUrl.searchParams.get('code');
  if (code && req.nextUrl.pathname === '/') {
    try {
      await supabase.auth.exchangeCodeForSession(code);
      // Successfully exchanged code for session, let the request continue
      return res;
    } catch (error) {
      console.error('Error exchanging code for session:', error);
      // Continue with regular middleware flow
    }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check auth condition
  const isAuthRoute = req.nextUrl.pathname.startsWith('/auth');
  const isApiRoute = req.nextUrl.pathname.startsWith('/api');
  const isCallbackRoute = req.nextUrl.pathname.startsWith('/callback');
  
  // Skip auth check for callback routes or routes with verification code
  const hasAuthCode = req.nextUrl.searchParams.has('code');
  const isAppRoute = !isAuthRoute && !isCallbackRoute && !(req.nextUrl.pathname === '/' && hasAuthCode);
  
  // Get the correct origin based on the incoming request
  const origin = req.headers.get('host') || 'search.getcrazywisdom.com';
  const protocol = req.headers.get('x-forwarded-proto') || 'https';
  const baseUrl = `${protocol}://${origin}`;
  
  // Redirect if conditions are not met
  if (isAppRoute && !session) {
    // Redirect unauthenticated users to login page
    return NextResponse.redirect(new URL('/auth/login', baseUrl));
  }

  if (isAuthRoute && session) {
    // Redirect authenticated users to app home
    return NextResponse.redirect(new URL('/', baseUrl));
  }

  // API routes need authentication
  if (isApiRoute && !session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};