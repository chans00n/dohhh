import * as React from 'react';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

export function Avatar({ className = '', size = 'md', ...props }: AvatarProps) {
  return (
    <div
      className={`relative flex shrink-0 overflow-hidden rounded-full ${sizes[size]} ${className}`}
      {...props}
    />
  );
}

export function AvatarImage({ className = '', alt = '', ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      className={`aspect-square h-full w-full object-cover ${className}`}
      alt={alt}
      {...props}
    />
  );
}

export function AvatarFallback({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center rounded-full bg-neutral-100 text-neutral-600 ${className}`}
      {...props}
    />
  );
}