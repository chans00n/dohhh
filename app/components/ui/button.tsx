import * as React from 'react';

type Variant = 'default' | 'secondary' | 'ghost' | 'destructive' | 'outline';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  'inline-flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  default:
    'bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-600',
  secondary:
    'bg-neutral-900 text-white hover:bg-neutral-800 focus-visible:ring-neutral-900',
  ghost:
    'bg-transparent text-neutral-900 hover:bg-neutral-100 focus-visible:ring-neutral-300',
  destructive:
    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
  outline:
    'border border-neutral-300 text-neutral-900 hover:bg-neutral-50 focus-visible:ring-neutral-300',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({className = '', variant = 'default', size = 'md', ...props}, ref) => (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  ),
);
Button.displayName = 'Button';


