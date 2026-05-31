import { clsx, type ClassValue } from 'clsx';

// Tiny class-name combiner shared by the ui primitives.
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
