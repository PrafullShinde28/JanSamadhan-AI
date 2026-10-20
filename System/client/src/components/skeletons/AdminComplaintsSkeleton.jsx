import React from 'react';
import Skeleton from '../ui/skeleton/Skeleton';
import SkeletonButton from '../ui/skeleton/SkeletonButton';
import SkeletonTable from '../ui/skeleton/SkeletonTable';
import SkeletonBadge from '../ui/skeleton/SkeletonBadge';

export default function AdminComplaintsSkeleton() {
  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-5 sm:space-y-6 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col">
      {/* Header */}
      <header className="bg-white border border-slate-200 rounded-card p-4 sm:p-5 shadow-soft flex flex-col justify-between items-start gap-2 w-full min-w-0 shrink-0">
        <Skeleton className="h-3 w-16" />
        <div className="space-y-1 mt-1 flex-grow">
          <Skeleton className="h-4.5 w-1/3" />
          <Skeleton className="h-2.5 w-1/2" />
        </div>
      </header>

      {/* Filter Toolbar */}
      <section className="bg-white border border-slate-200 rounded-card p-4 shadow-soft w-full min-w-0 flex gap-2">
        <Skeleton className="h-11 flex-grow" />
        <Skeleton className="h-11 w-11 shrink-0 rounded-button" />
      </section>

      {/* Listing Content */}
      <div className="space-y-4 w-full min-w-0">
        {/* Desktop View Table */}
        <div className="hidden md:block w-full">
          <SkeletonTable rows={6} cols={7} />
        </div>

        {/* Mobile View Card Grid */}
        <div className="md:hidden space-y-3 w-full">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-card p-4 shadow-soft space-y-3">
              <div className="flex justify-between items-start">
                <Skeleton className="h-3.5 w-14 font-mono" />
                <div className="flex gap-1">
                  <SkeletonBadge className="h-5 w-10" />
                  <SkeletonBadge className="h-5 w-12" />
                </div>
              </div>
              
              <div className="space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-2.5 w-1/4" />
              </div>

              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-1.5">
                <Skeleton className="h-2 w-1/2" />
                <Skeleton className="h-2 w-1/3" />
              </div>

              <div className="pt-2 border-t flex justify-between items-center w-full">
                <Skeleton className="h-3 w-20" />
                <SkeletonButton className="h-8 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
