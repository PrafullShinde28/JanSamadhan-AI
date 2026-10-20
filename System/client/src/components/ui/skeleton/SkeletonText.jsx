import React from 'react';
import Skeleton from './Skeleton';

export default function SkeletonText({ lines = 3, className = '', ...props }) {
  return (
    <div className={`space-y-2.5 w-full ${className}`} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          variant="text" 
          className={i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full'} 
        />
      ))}
    </div>
  );
}
