// This file should ONLY be imported by server components
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

// Client for use in Server Components
export const createServerSideClient = () => {
  return createServerComponentClient<Database>({ cookies });
};

// Client for use in API Routes
export const createApiClient = () => {
  return createRouteHandlerClient<Database>({ cookies });
};