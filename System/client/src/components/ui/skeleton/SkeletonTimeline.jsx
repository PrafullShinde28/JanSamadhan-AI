import React from 'react';
import Skeleton from './Skeleton';

export default function SkeletonTimeline({ items = 4, className = '', ...props }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-card p-4 sm:p-5 shadow-soft space-y-4 w-full ${className}`} {...props}>
      <Skeleton className="h-3.5 w-1/3 mb-2" />
      
      <div className="relative border-l-2 border-slate-100 ml-3 pl-4 space-y-5 py-1">
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="relative w-full">
            <span className="absolute -left-[23px] top-1 bg-white border-2 border-slate-200 h-3.5 w-3.5 rounded-full flex items-center justify-center z-20">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-pulse" />
            </span>
            
            <div className="space-y-2">
              <div className="flex gap-2">
                <Skeleton className="h-2.5 w-24" />
                <Skeleton className="h-4 w-12 rounded" />
              </div>
              <Skeleton className="h-2 w-32" />
              <Skeleton className="h-2.5 w-5/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
