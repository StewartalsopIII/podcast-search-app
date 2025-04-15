'use client';

import Link from 'next/link';
import { UserAccountNav } from '@/components/auth/user-account-nav';
import { User } from '@/types';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  user: User | null;
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="font-bold text-xl">
            Podcast Search
          </Link>
          
          {user && (
            <nav className="hidden md:flex items-center gap-2 ml-4">
              <Link 
                href="/" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
              >
                Search
              </Link>
              
              <Link 
                href="/upload" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
              >
                Upload
              </Link>
            </nav>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <UserAccountNav user={user} />
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              
              <Link href="/auth/register">
                <Button size="sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}