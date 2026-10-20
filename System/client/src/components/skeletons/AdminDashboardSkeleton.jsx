import React from 'react';
import Skeleton from '../ui/skeleton/Skeleton';
import SkeletonCard from '../ui/skeleton/SkeletonCard';
import SkeletonBadge from '../ui/skeleton/SkeletonBadge';
import SkeletonChart from '../ui/skeleton/SkeletonChart';

export default function AdminDashboardSkeleton() {
  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-5 sm:space-y-6 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col">
      {/* Identity Banner */}
      <header className="bg-white border border-slate-200 rounded-card p-4 sm:p-5 shadow-soft flex flex-col md:flex-row justify-between items-start gap-3 w-full min-w-0">
        <div className="space-y-1.5 flex-grow min-w-0">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4.5 w-1/3" />
          <Skeleton className="h-2.5 w-1/2" />
        </div>
        <Skeleton className="h-9 w-20 rounded-button shrink-0" />
      </header>

      {/* KPI Stats Grid - 10 cards */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 w-full min-w-0">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 p-3 sm:p-4 rounded-card shadow-soft space-y-2 min-w-0">
            <Skeleton variant="circle" className="h-6 w-6" />
            <Skeleton className="h-2 w-1/2" />
            <Skeleton className="h-5 w-1/3" />
          </div>
        ))}
      </section>

      {/* Charts Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 w-full min-w-0">
        <SkeletonChart type="bar" />
        <SkeletonChart type="pie" />
        <SkeletonChart type="horizontalBar" className="col-span-1 lg:col-span-2" />
      </section>

      {/* Summaries Grids */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 w-full min-w-0">
        {/* Department overview */}
        <div className="bg-white border border-slate-200 rounded-card p-4 sm:p-5 shadow-soft space-y-4 w-full min-w-0">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-12" />
          </div>
          
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <Skeleton className="h-3 w-1/2" />
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-6" />
                  <Skeleton className="h-6" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Field Agents */}
        <div className="bg-white border border-slate-200 rounded-card p-4 sm:p-5 shadow-soft space-y-4 w-full min-w-0">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-12" />
          </div>
          
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-2 w-1/3" />
                  <Skeleton className="h-2.5 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
