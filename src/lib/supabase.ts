import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

// Direct client for cases where we need the service role (admin privileges)
export const createServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey);
};

// Client for use in Client Components
export const createClientSideClient = () => {
  return createClientComponentClient<Database>();
};

// Providing placeholder functions that throw errors if called from client
// These are here just to maintain API compatibility
export const createServerSideClient = () => {
  throw new Error(
    'createServerSideClient must be imported from @/lib/supabase-server.ts and can only be used in Server Components'
  );
};

export const createApiClient = () => {
  throw new Error(
    'createApiClient must be imported from @/lib/supabase-server.ts and can only be used in Route Handlers'
  );
};