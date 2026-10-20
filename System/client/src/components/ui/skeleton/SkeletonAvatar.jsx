import React from 'react';
import Skeleton from './Skeleton';

export default function SkeletonAvatar({ size = 'h-10 w-10', className = '', ...props }) {
  return (
    <Skeleton 
      variant="circle" 
      className={`${size} ${className}`} 
      {...props} 
    />
  );
}
