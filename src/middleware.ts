import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check auth condition
  const isAuthRoute = req.nextUrl.pathname.startsWith('/auth');
  const isApiRoute = req.nextUrl.pathname.startsWith('/api');
  const isAppRoute = !isAuthRoute && !req.nextUrl.pathname.startsWith('/callback');
  
  // Redirect if conditions are not met
  if (isAppRoute && !session) {
    // Redirect unauthenticated users to login page
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  if (isAuthRoute && session) {
    // Redirect authenticated users to app home
    return NextResponse.redirect(new URL('/', req.url));
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