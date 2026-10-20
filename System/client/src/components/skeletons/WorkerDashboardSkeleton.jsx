import React from 'react';
import Skeleton from '../ui/skeleton/Skeleton';
import SkeletonCard from '../ui/skeleton/SkeletonCard';
import SkeletonButton from '../ui/skeleton/SkeletonButton';
import SkeletonBadge from '../ui/skeleton/SkeletonBadge';

export default function WorkerDashboardSkeleton() {
  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col">
      {/* Header Profile Card */}
      <div className="bg-white border border-slate-100 rounded-card p-4 shadow-soft flex items-center justify-between gap-3 w-full min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-grow">
          <Skeleton variant="circle" className="h-11 w-11 shrink-0" />
          <div className="space-y-1.5 min-w-0 flex-grow">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-2.5 w-1/4" />
          </div>
        </div>
        <SkeletonBadge className="h-5 w-16 shrink-0" />
      </div>

      {/* Grid statistics (6 cards) */}
      <section className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 w-full min-w-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-100 p-3 sm:p-4 rounded-card shadow-soft space-y-3 min-w-0">
            <Skeleton variant="circle" className="h-7 w-7" />
            <Skeleton className="h-2.5 w-1/2" />
            <Skeleton className="h-6 w-1/3" />
          </div>
        ))}
      </section>

      {/* Active Task Section */}
      <section className="space-y-3 w-full min-w-0">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="bg-white border border-slate-150 rounded-card p-4 shadow-soft space-y-4 w-full min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div className="space-y-2 flex-grow min-w-0">
              <Skeleton className="h-3 w-1/4 font-mono" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <SkeletonBadge className="h-5 w-14 shrink-0" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-2.5 w-full" />
            <Skeleton className="h-2.5 w-5/6" />
          </div>
          <div className="pt-2 border-t border-slate-100 flex gap-2">
            <SkeletonButton className="h-10 flex-1" />
            <SkeletonButton className="h-10 flex-1" />
          </div>
        </div>
      </section>

      {/* Assigned Queue */}
      <section className="space-y-3 w-full min-w-0">
        <Skeleton className="h-4 w-32" />
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full min-w-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 p-4 rounded-card shadow-soft space-y-4 w-full min-w-0">
              <div className="flex justify-between items-start gap-2">
                <Skeleton className="h-3 w-1/3" />
                <SkeletonBadge className="h-5 w-12" />
              </div>
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-2.5 w-full" />
              <div className="pt-2 flex gap-2 border-t">
                <SkeletonButton className="h-9 flex-grow" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
