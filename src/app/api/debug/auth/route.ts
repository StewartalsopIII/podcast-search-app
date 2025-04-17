import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const supabase = createRouteHandlerClient({ cookies });
  
  // Try to get session
  const { data: { session } } = await supabase.auth.getSession();
  
  // Test generating a redirect URL
  const loginRedirectUrl = new URL('/auth/login', requestUrl.origin);
  const homeRedirectUrl = new URL('/', requestUrl.origin);
  
  // Get all cookies
  const allCookies = cookies().getAll().map(c => ({
    name: c.name,
    value: c.value.substring(0, 5) + '...' // Show only first few chars for security
  }));
  
  // Get headers that might affect redirects
  const headerInfo = {
    host: request.headers.get('host'),
    referer: request.headers.get('referer'),
    origin: request.headers.get('origin'),
    'x-forwarded-host': request.headers.get('x-forwarded-host'),
    'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
    'x-forwarded-for': request.headers.get('x-forwarded-for'),
  };
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    request: {
      url: request.url,
      origin: requestUrl.origin,
      host: requestUrl.host,
      protocol: requestUrl.protocol,
    },
    headers: headerInfo,
    auth: {
      isAuthenticated: !!session,
      sessionExists: !!session,
    },
    redirects: {
      loginRedirect: loginRedirectUrl.toString(),
      homeRedirect: homeRedirectUrl.toString(),
    },
    environment: {
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      NODE_ENV: process.env.NODE_ENV,
      HOSTNAME: process.env.HOSTNAME,
    },
    cookies: allCookies,
  });
}