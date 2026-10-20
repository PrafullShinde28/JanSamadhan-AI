import React from 'react';

export default function Skeleton({ className = '', variant = 'rect', ...props }) {
  const baseClass = 'bg-slate-200 animate-pulse motion-reduce:animate-none';
  const variantClass = 
    variant === 'circle' ? 'rounded-full' :
    variant === 'text' ? 'rounded h-3 w-5/6' :
    'rounded-xl'; // Default rounded card

  return (
    <div 
      className={`${baseClass} ${variantClass} ${className}`} 
      {...props}
    />
  );
}
