/**
 * UserAvatar — Reusable avatar with online status indicator
 *
 * Displays a user's avatar image with an optional colored dot
 * indicating their online/offline/away status.
 * Used across Sidebar, Dashboard, Tasks, Occupieds, ProfileSelect, etc.
 *
 * @example
 *   <UserAvatar user={currentUser} size="md" showStatus />
 */
import { cn } from '../lib/cn';
import { USER_STATUS_COLORS } from '../constants/statusColors';
import type { User } from '../types';

/** Available size presets for the avatar */
type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASSES: Record<AvatarSize, { img: string; dot: string; border: string }> = {
  xs: { img: 'w-4 h-4', dot: 'w-2 h-2 border', border: 'border-zinc-900' },
  sm: { img: 'w-5 h-5', dot: 'w-2.5 h-2.5 border-2', border: 'border-zinc-900' },
  md: { img: 'w-8 h-8', dot: 'w-3 h-3 border-2', border: 'border-zinc-900' },
  lg: { img: 'w-10 h-10', dot: 'w-3 h-3 border-2', border: 'border-zinc-900' },
  xl: { img: 'w-16 h-16', dot: 'w-4 h-4 border-[3px]', border: 'border-zinc-900' },
};

interface UserAvatarProps {
  /** The user whose avatar and status to display */
  user: Pick<User, 'avatar' | 'name' | 'status'>;
  /** Size preset (default: 'md') */
  size?: AvatarSize;
  /** Whether to show the online/offline status dot (default: false) */
  showStatus?: boolean;
  /** Additional CSS classes for the image element */
  className?: string;
}

export function UserAvatar({ user, size = 'md', showStatus = false, className }: UserAvatarProps) {
  const sizeConfig = SIZE_CLASSES[size];

  return (
    <div className="relative inline-block shrink-0">
      <img
        src={user.avatar}
        alt={user.name}
        className={cn(
          sizeConfig.img,
          'rounded-full bg-zinc-800',
          className
        )}
      />
      {showStatus && (
        <div
          className={cn(
            'absolute -bottom-0.5 -right-0.5 rounded-full',
            sizeConfig.dot,
            sizeConfig.border,
            USER_STATUS_COLORS[user.status] || 'bg-zinc-500'
          )}
        />
      )}
    </div>
  );
}
