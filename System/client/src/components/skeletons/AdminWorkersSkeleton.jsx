import React from 'react';
import Skeleton from '../ui/skeleton/Skeleton';
import SkeletonButton from '../ui/skeleton/SkeletonButton';
import SkeletonBadge from '../ui/skeleton/SkeletonBadge';

export default function AdminWorkersSkeleton() {
  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-5 sm:space-y-6 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col">
      {/* Header */}
      <header className="flex flex-col gap-4 rounded-card border border-slate-200 bg-white p-4 sm:p-5 shadow-soft w-full min-w-0">
        <div>
          <Skeleton className="h-3.5 w-16 mb-2" />
          <h1 className="font-outfit text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-1.5">
            <Skeleton variant="circle" className="h-5 w-5 shrink-0" />
            <Skeleton className="h-4 w-40" />
          </h1>
          <Skeleton className="h-2.5 w-2/3 mt-1.5" />
        </div>
      </header>

      {/* Search */}
      <section className="bg-white border border-slate-200 rounded-card p-4 shadow-soft">
        <Skeleton className="h-10 w-full max-w-md" />
      </section>

      {/* Grid List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 w-full min-w-0">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-card p-5 shadow-soft space-y-4 flex flex-col justify-between min-w-0">
            <div className="space-y-3.5">
              <div className="flex justify-between items-start gap-2">
                <div className="space-y-1.5 flex-grow min-w-0">
                  <Skeleton className="h-4 w-2/3 font-bold" />
                  <Skeleton className="h-2.5 w-1/2" />
                </div>
                <SkeletonBadge className="h-5 w-14 shrink-0" />
              </div>

              <div className="grid grid-cols-2 gap-3 py-3 border-t border-b border-slate-100">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="space-y-1">
                    <Skeleton className="h-2 w-12" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Skeleton className="h-2.5 w-24" />
              <Skeleton className="h-3 w-14" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
