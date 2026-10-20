import React from 'react';
import Skeleton from '../ui/skeleton/Skeleton';
import SkeletonChart from '../ui/skeleton/SkeletonChart';

export default function AdminAnalyticsSkeleton() {
  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-5 sm:space-y-6 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col">
      {/* Header */}
      <header className="flex flex-col gap-4 rounded-card border border-slate-200 bg-white p-4 sm:p-5 shadow-soft w-full min-w-0">
        <div>
          <Skeleton className="h-3.5 w-16 mb-2" />
          <h1 className="font-outfit text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-1.5">
            <Skeleton variant="circle" className="h-5 w-5 shrink-0" />
            <Skeleton className="h-4 w-44" />
          </h1>
          <Skeleton className="h-2.5 w-2/3 mt-1.5" />
        </div>
      </header>

      {/* Overview Stats */}
      <section className="grid gap-4 grid-cols-1 md:grid-cols-3 w-full min-w-0">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-card p-4 sm:p-5 shadow-soft flex items-center gap-4 min-w-0">
            <Skeleton variant="circle" className="h-10 w-10 shrink-0" />
            <div className="min-w-0 flex-grow space-y-1.5">
              <Skeleton className="h-2.5 w-2/3 truncate" />
              <Skeleton className="h-4.5 w-1/2 truncate" />
              <Skeleton className="h-2 w-1/3 truncate" />
            </div>
          </div>
        ))}
      </section>

      {/* Interactive Charts */}
      <section className="grid gap-5 sm:gap-6 md:grid-cols-2 w-full min-w-0">
        <SkeletonChart type="bar" />
        <SkeletonChart type="pie" />
        <SkeletonChart type="horizontalBar" className="md:col-span-2" />
      </section>
    </div>
  );
}
