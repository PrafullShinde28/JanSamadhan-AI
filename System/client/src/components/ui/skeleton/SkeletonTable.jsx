import React from 'react';
import Skeleton from './Skeleton';

export default function SkeletonTable({ rows = 5, cols = 5, className = '', ...props }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-card shadow-soft overflow-hidden w-full ${className}`} {...props}>
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="p-3">
                  <Skeleton className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: rows }).map((_, ri) => (
              <tr key={ri}>
                {Array.from({ length: cols }).map((_, ci) => (
                  <td key={ci} className="p-3">
                    <Skeleton className={`h-2.5 ${ci === 0 ? 'w-20 font-mono' : ci === 1 ? 'w-32' : 'w-16'}`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
