import { Header } from '@/components/layout/header';
import { createServerSideClient } from '@/lib/supabase-server';
import { User } from '@/types';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSideClient();
  
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  // Get user profile data
  let user: User | null = null;
  
  if (session?.user) {
    user = {
      id: session.user.id,
      email: session.user.email || '',
      full_name: session.user.user_metadata?.full_name,
      avatar_url: session.user.user_metadata?.avatar_url,
    };
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      <main className="flex-1 container py-6">
        {children}
      </main>
      <footer className="border-t py-4">
        <div className="container flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Podcast Search App
          </div>
          <div className="text-sm text-muted-foreground">
            Current embedding provider: {process.env.EMBEDDING_PROVIDER || 'openai'}
          </div>
        </div>
      </footer>
    </div>
  );
}