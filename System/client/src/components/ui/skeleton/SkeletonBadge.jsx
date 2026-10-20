import React from 'react';
import Skeleton from './Skeleton';

export default function SkeletonBadge({ className = 'h-5 w-16', ...props }) {
  return (
    <Skeleton 
      className={`rounded px-2 py-0.5 ${className}`} 
      {...props} 
    />
  );
}
