import React from 'react';
import Skeleton from '../ui/skeleton/Skeleton';
import SkeletonCard from '../ui/skeleton/SkeletonCard';
import SkeletonAvatar from '../ui/skeleton/SkeletonAvatar';

export default function WorkerNotificationsSkeleton() {
  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col">
      {/* Header card */}
      <header className="rounded-card border border-slate-100 bg-white p-4 shadow-soft w-full min-w-0 flex justify-between items-center gap-3">
        <div className="space-y-1.5 flex-grow min-w-0">
          <Skeleton className="h-4.5 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-8 w-20 rounded-button shrink-0" />
      </header>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-1 select-none">
        <Skeleton className="h-6 w-14" />
        <Skeleton className="h-6 w-16" />
      </div>

      {/* List */}
      <div className="space-y-3 w-full min-w-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-100 p-4 rounded-card shadow-soft flex gap-3.5 items-start w-full min-w-0">
            <SkeletonAvatar className="h-9 w-9 shrink-0" />
            <div className="flex-grow min-w-0 space-y-2">
              <div className="flex justify-between items-start gap-2">
                <div className="space-y-1.5 flex-grow min-w-0">
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-2 w-1/4" />
                </div>
                <Skeleton className="h-6 w-6 rounded-full shrink-0" />
              </div>
              <Skeleton className="h-2.5 w-full" />
              <Skeleton className="h-2.5 w-5/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
