import React from 'react';
import Skeleton from './Skeleton';

export default function SkeletonChart({ type = 'bar', className = '', ...props }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-card p-4 sm:p-5 shadow-soft space-y-4 w-full ${className}`} {...props}>
      <Skeleton className="h-3.5 w-1/3 mb-2" />
      
      {type === 'pie' || type === 'donut' ? (
        <div className="flex flex-col items-center justify-center h-48 py-2 space-y-3">
          <Skeleton variant="circle" className="h-28 w-28" />
          <div className="flex gap-3 justify-center w-full">
            <Skeleton className="h-2 w-10" />
            <Skeleton className="h-2 w-12" />
            <Skeleton className="h-2 w-10" />
          </div>
        </div>
      ) : type === 'horizontalBar' ? (
        <div className="space-y-4 h-48 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 w-full">
              <Skeleton className="h-2.5 w-10 shrink-0" />
              <div className="flex-grow flex items-center gap-2">
                <Skeleton className="h-4 rounded-r" style={{ width: `${30 + Math.random() * 50}%` }} />
              </div>
            </div>
          ))}
          <div className="flex justify-between pl-13 pt-1 text-[9px] text-slate-300">
            <Skeleton className="h-2 w-6" />
            <Skeleton className="h-2 w-6" />
            <Skeleton className="h-2 w-6" />
          </div>
        </div>
      ) : (
        <div className="flex items-end justify-between gap-3 h-48 pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <Skeleton className="w-full rounded-t" style={{ height: `${20 + Math.random() * 65}%` }} />
              <Skeleton className="h-2 w-6" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
