import { LoginForm } from '@/components/forms/login-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | Podcast Search App',
  description: 'Login to your account',
};

export default function LoginPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <LoginForm />
      </div>
    </div>
  );
}