import React from 'react';
import Skeleton from '../ui/skeleton/Skeleton';
import SkeletonCard from '../ui/skeleton/SkeletonCard';
import SkeletonMap from '../ui/skeleton/SkeletonMap';
import SkeletonButton from '../ui/skeleton/SkeletonButton';

export default function CitizenDashboardSkeleton() {
  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col">
      {/* Welcome Card */}
      <div className="bg-white border border-slate-100 rounded-card p-4 shadow-soft space-y-3.5 w-full min-w-0">
        <div className="space-y-1.5">
          <Skeleton className="h-4.5 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <SkeletonButton className="h-11 w-full max-w-xs" />
      </div>

      {/* 4 Stats Cards */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 w-full min-w-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-100 p-3 sm:p-4 rounded-card shadow-soft space-y-2.5 min-w-0">
            <Skeleton variant="circle" className="h-7 w-7" />
            <Skeleton className="h-2.5 w-1/2" />
            <Skeleton className="h-5.5 w-1/3" />
          </div>
        ))}
      </section>

      {/* Map Selector Preview */}
      <section className="space-y-3 w-full min-w-0">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-12" />
        </div>
        <SkeletonMap className="h-44 sm:h-56" />
      </section>

      {/* Recent Reports List */}
      <section className="space-y-3 w-full min-w-0">
        <Skeleton className="h-4 w-28" />
        <div className="space-y-3 w-full min-w-0">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 p-4 rounded-card shadow-soft space-y-3.5 w-full min-w-0">
              <div className="flex justify-between items-start gap-2">
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-5 w-12 rounded" />
              </div>
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-2.5 w-full" />
              <div className="pt-2 border-t flex justify-end">
                <Skeleton className="h-8 w-16 rounded-button" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
