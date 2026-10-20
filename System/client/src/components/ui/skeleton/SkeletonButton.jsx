import React from 'react';
import Skeleton from './Skeleton';

export default function SkeletonButton({ className = 'h-11 w-full', ...props }) {
  return (
    <Skeleton 
      className={`rounded-button ${className}`} 
      {...props} 
    />
  );
}
