import React from 'react';
import Skeleton from './Skeleton';
import { Map } from 'lucide-react';

export default function SkeletonMap({ className = 'h-[300px]', ...props }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 w-full ${className}`} {...props}>
      <div className="absolute inset-0 bg-grid-slate-200/50" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)', backgroundSize: '24px 24px', opacity: 0.4 }} />
      <Skeleton className="absolute inset-0 w-full h-full rounded-none opacity-20" />
      <div className="text-center z-10 space-y-2">
        <Map className="h-8 w-8 text-slate-350 mx-auto animate-bounce" />
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Syncing map coordinates...</p>
      </div>
    </div>
  );
}
