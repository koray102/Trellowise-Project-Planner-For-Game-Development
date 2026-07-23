/**
 * User Status Color Constants
 *
 * Centralized Tailwind background color classes for user online/away/offline status.
 * Previously duplicated in PasswordScreen.tsx and ProfileSelect.tsx.
 *
 * Usage:
 *   import { USER_STATUS_COLORS } from '@/shared/constants/statusColors';
 *   <div className={USER_STATUS_COLORS[user.status] || USER_STATUS_COLORS.offline} />
 */

/** Tailwind background color classes keyed by UserStatus */
export const USER_STATUS_COLORS: Record<string, string> = {
  online: 'bg-emerald-500',
  away: 'bg-amber-500',
  offline: 'bg-zinc-500',
} as const;
