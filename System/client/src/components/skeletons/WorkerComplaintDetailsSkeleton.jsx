import React from 'react';
import Skeleton from '../ui/skeleton/Skeleton';
import SkeletonButton from '../ui/skeleton/SkeletonButton';
import SkeletonBadge from '../ui/skeleton/SkeletonBadge';
import SkeletonMap from '../ui/skeleton/SkeletonMap';
import SkeletonImage from '../ui/skeleton/SkeletonImage';
import SkeletonTimeline from '../ui/skeleton/SkeletonTimeline';

export default function WorkerComplaintDetailsSkeleton() {
  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col">
      {/* Back link */}
      <Skeleton className="h-3.5 w-24 mb-1" />

      {/* Hero Header Card */}
      <header className="flex flex-col gap-3 rounded-card border border-slate-100 bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between w-full min-w-0">
        <div className="space-y-1.5 flex-grow min-w-0">
          <Skeleton className="h-3 w-20 font-mono" />
          <Skeleton className="h-4.5 w-1/2" />
          <Skeleton className="h-2.5 w-1/4" />
        </div>
        <div className="flex gap-1.5 shrink-0">
          <SkeletonBadge className="h-5 w-12" />
          <SkeletonBadge className="h-5 w-14" />
        </div>
      </header>

      {/* 3 columns structure */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3 w-full min-w-0">
        
        {/* Col 1: Images and description */}
        <section className="space-y-4 min-w-0 w-full">
          <div className="bg-white border border-slate-100 rounded-card p-4 shadow-soft space-y-3.5 w-full min-w-0">
            <Skeleton className="h-3.5 w-32" />
            <SkeletonImage className="h-44 sm:h-48 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-2.5 w-1/4" />
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5">
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-2 w-5/6" />
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-slate-100 rounded-card p-4 shadow-soft space-y-3 w-full min-w-0">
            <Skeleton className="h-3.5 w-36" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
            </div>
          </div>
        </section>

        {/* Col 2: Map and location */}
        <section className="space-y-4 min-w-0 w-full">
          <div className="bg-white border border-slate-100 rounded-card p-4 shadow-soft space-y-4 w-full min-w-0">
            <Skeleton className="h-3.5 w-32" />
            <SkeletonMap className="h-52 sm:h-56" />
            <div className="space-y-3 pt-3 border-t">
              <div className="flex gap-2">
                <Skeleton variant="circle" className="h-5 w-5 shrink-0" />
                <div className="space-y-1.5 flex-grow">
                  <Skeleton className="h-2 w-12" />
                  <Skeleton className="h-2.5 w-3/4" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Col 3: Transition Controls */}
        <section className="space-y-4 min-w-0 w-full">
          <div className="bg-white border border-slate-100 rounded-card p-4 shadow-soft space-y-3.5 w-full min-w-0">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-2.5 w-full" />
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3">
              <Skeleton className="h-2 w-1/3" />
              <Skeleton className="h-2.5 w-2/3" />
              <SkeletonButton className="h-11" />
            </div>
          </div>
        </section>
      </div>

      {/* Timeline audit log */}
      <SkeletonTimeline items={3} />
    </div>
  );
}
