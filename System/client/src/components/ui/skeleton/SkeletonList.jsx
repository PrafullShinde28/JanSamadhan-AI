import React from 'react';
import SkeletonCard from './SkeletonCard';

export default function SkeletonList({ items = 3, className = '', ...props }) {
  return (
    <div className={`space-y-4 ${className}`} {...props}>
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
