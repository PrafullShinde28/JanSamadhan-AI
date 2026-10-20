import React from 'react';
import Skeleton from '../ui/skeleton/Skeleton';
import SkeletonBadge from '../ui/skeleton/SkeletonBadge';
import SkeletonImage from '../ui/skeleton/SkeletonImage';
import SkeletonMap from '../ui/skeleton/SkeletonMap';
import SkeletonTimeline from '../ui/skeleton/SkeletonTimeline';

export default function CitizenComplaintDetailsSkeleton() {
  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col">
      {/* Back button */}
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

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3 w-full min-w-0">
        
        {/* Main Details and Images */}
        <div className="space-y-4 lg:col-span-2 min-w-0 w-full">
          {/* Incident Image and description */}
          <div className="bg-white border border-slate-100 rounded-card p-4 shadow-soft space-y-4 w-full min-w-0">
            <Skeleton className="h-3.5 w-32" />
            <SkeletonImage className="h-48 sm:h-64 w-full" />
            <div className="space-y-1">
              <Skeleton className="h-2 w-1/4" />
              <Skeleton className="h-2.5 w-full" />
            </div>
          </div>

          {/* AI Category Analysis */}
          <div className="bg-white border border-slate-100 rounded-card p-4 shadow-soft space-y-3 w-full min-w-0">
            <Skeleton className="h-3.5 w-36" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Sidebar panels */}
        <div className="space-y-4 min-w-0 w-full">
          {/* Map and address */}
          <div className="bg-white border border-slate-100 rounded-card p-4 shadow-soft space-y-4 w-full min-w-0">
            <Skeleton className="h-3.5 w-24" />
            <SkeletonMap className="h-48 sm:h-56" />
            <div className="space-y-2 pt-3 border-t">
              <Skeleton className="h-2 w-12" />
              <Skeleton className="h-2.5 w-3/4" />
            </div>
          </div>
        </div>

      </div>

      {/* Audit Timeline */}
      <SkeletonTimeline items={3} />
    </div>
  );
}
