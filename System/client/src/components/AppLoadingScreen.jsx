import React from 'react';
import { Loader2 } from 'lucide-react';

export default function AppLoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 select-none">
      <div className="text-center space-y-4">
        {/* Spinner */}
        <div className="relative h-14 w-14 mx-auto flex items-center justify-center">
          <span className="absolute animate-ping inline-flex h-10 w-10 rounded-full bg-primary/20 opacity-75" />
          <Loader2 className="h-9 w-9 text-primary animate-spin z-10" />
        </div>
        
        {/* Branding text */}
        <div className="space-y-1">
          <h2 className="font-outfit text-base font-extrabold text-slate-805 tracking-wider uppercase">JanSamadhan AI</h2>
          <p className="text-[10px] font-bold text-slate-450 tracking-widest uppercase">Verifying security context...</p>
        </div>
      </div>
    </div>
  );
}
