import React from 'react';
import Skeleton from '../ui/skeleton/Skeleton';
import SkeletonCard from '../ui/skeleton/SkeletonCard';
import SkeletonButton from '../ui/skeleton/SkeletonButton';
import SkeletonBadge from '../ui/skeleton/SkeletonBadge';

export default function ComplaintHistorySkeleton() {
  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col">
      {/* Header */}
      <header className="rounded-card border border-slate-100 bg-white p-4 shadow-soft w-full min-w-0">
        <Skeleton className="h-5 w-1/3 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </header>

      {/* Search and Filters */}
      <section className="bg-white border border-slate-100 rounded-card p-4 shadow-soft space-y-3.5 w-full min-w-0">
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-3 grid-cols-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </section>

      {/* List */}
      <div className="space-y-4 w-full min-w-0">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-100 p-4 rounded-card shadow-soft space-y-3.5 w-full min-w-0">
            <div className="flex justify-between items-start gap-2">
              <Skeleton className="h-3 w-20 font-mono" />
              <div className="flex gap-1">
                <SkeletonBadge className="h-5 w-12" />
                <SkeletonBadge className="h-5 w-10" />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>

            <Skeleton className="h-2.5 w-full" />

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
              <Skeleton className="h-2 w-1/2" />
              <Skeleton className="h-2 w-1/3" />
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center w-full">
              <Skeleton className="h-3.5 w-24" />
              <SkeletonButton className="h-9 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
