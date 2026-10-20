import React from 'react';
import Skeleton from './Skeleton';
import { Image as ImageIcon } from 'lucide-react';

export default function SkeletonImage({ className = 'h-48 w-full', ...props }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 ${className}`} {...props}>
      <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
      <ImageIcon className="h-8 w-8 text-slate-350 z-10 relative" />
    </div>
  );
}
