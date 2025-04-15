import { RegisterForm } from '@/components/forms/register-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register | Podcast Search App',
  description: 'Create a new account',
};

export default function RegisterPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <RegisterForm />
      </div>
    </div>
  );
}