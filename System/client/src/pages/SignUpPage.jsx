import React from 'react';
import { SignUp } from '@clerk/clerk-react';

export default function SignUpPage() {
  return (
    <div className="min-h-screen pt-20 pb-12 flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-card shadow-soft border border-slate-100 p-1 flex justify-center">
        <SignUp 
          signInUrl="/sign-in"
          redirectUrl="/dashboard"
          appearance={{
            elements: {
              formButtonPrimary: 'bg-primary hover:bg-primary-dark transition text-white rounded-button font-bold text-sm',
              card: 'shadow-none border-none p-6',
            }
          }}
        />
      </div>
    </div>
  );
}
