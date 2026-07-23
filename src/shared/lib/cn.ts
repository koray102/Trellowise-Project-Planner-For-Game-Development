/**
 * cn() — Tailwind CSS class name merge utility
 *
 * Combines clsx (conditional class joining) with tailwind-merge (conflict resolution).
 * Use this single export across the entire app instead of defining cn() in each file.
 *
 * @example
 *   cn("px-4 py-2", isActive && "bg-indigo-500", "text-white")
 *   // => "px-4 py-2 bg-indigo-500 text-white"
 */
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]): string {
  return twMerge(clsx(inputs));
}
