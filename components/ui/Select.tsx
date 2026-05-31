import * as React from 'react';
import { cn } from './cn';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'h-10 w-full rounded-[var(--radius)] border border-border bg-card px-3 text-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = 'Select';
