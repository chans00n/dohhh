import * as React from 'react';

export interface ProgressProps {
  value?: number;
  className?: string;
  showAnimation?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4'
};

export function Progress({ value = 0, className = '', showAnimation = true, size = 'md' }: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, value));
  
  return (
    <div className={`relative w-full overflow-hidden rounded-full bg-gradient-to-r from-amber-50 to-amber-100 ${sizes[size]} ${className}`}>
      <div
        className={`h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-700 ease-out relative ${
          showAnimation && percentage > 0 ? 'shadow-[0_0_20px_rgba(245,158,11,0.4)]' : ''
        }`}
        style={{ 
          width: `${percentage}%`,
        }}
      >
        {percentage > 0 && showAnimation && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-[shimmer_2s_ease-in-out_infinite]" />
        )}
      </div>
    </div>
  );
}


