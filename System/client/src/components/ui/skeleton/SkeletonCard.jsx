import React from 'react';
import Skeleton from './Skeleton';

export default function SkeletonCard({ className = '', children, ...props }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-card p-4 sm:p-5 shadow-soft space-y-4 ${className}`} {...props}>
      {children || (
        <>
          <div className="flex items-center gap-3">
            <Skeleton variant="circle" className="h-10 w-10 shrink-0" />
            <div className="space-y-1.5 flex-grow">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-2.5 w-1/4" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-2.5 w-full" />
            <Skeleton className="h-2.5 w-5/6" />
          </div>
        </>
      )}
    </div>
  );
}
