/**
 * StatusBadge — Pill-shaped badge for displaying status labels
 *
 * Used to show task status, item count badges, role tags, etc.
 * Replaces 10+ inline `<span className="bg-zinc-800 text-xs px-2 py-0.5 rounded-full ...">` patterns.
 *
 * @example
 *   <StatusBadge>3 items</StatusBadge>
 *   <StatusBadge variant="indigo">Admin</StatusBadge>
 */
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

type BadgeVariant = 'default' | 'indigo' | 'emerald' | 'red' | 'amber' | 'fuchsia' | 'blue';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: 'bg-zinc-800/80 text-zinc-400 border-zinc-700/50',
  indigo: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
  emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  red: 'bg-red-500/10 text-red-300 border-red-500/30',
  amber: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  fuchsia: 'bg-fuchsia-400/10 text-fuchsia-300 border-fuchsia-400/30',
  blue: 'bg-blue-400/10 text-blue-300 border-blue-400/30',
};

interface StatusBadgeProps {
  /** Badge content */
  children: ReactNode;
  /** Color variant (default: 'default') */
  variant?: BadgeVariant;
  /** Additional CSS classes */
  className?: string;
}

export function StatusBadge({ children, variant = 'default', className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'text-xs px-2 py-0.5 rounded-full font-medium border',
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
