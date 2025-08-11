import * as React from 'react';

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
}

export function Separator({
  className = '',
  orientation = 'horizontal',
  decorative = true,
  ...props
}: SeparatorProps) {
  const ariaProps = decorative ? { role: 'none' } : { role: 'separator', 'aria-orientation': orientation };
  
  return (
    <div
      {...ariaProps}
      className={`shrink-0 bg-neutral-200 ${
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]'
      } ${className}`}
      {...props}
    />
  );
}