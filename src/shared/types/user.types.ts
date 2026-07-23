/**
 * User Domain Types
 *
 * Defines the shape of user-related data used across the application.
 * These types are the canonical source of truth for user models —
 * all components, stores, and services should import from here.
 */

/** Possible online presence statuses for a user */
export type UserStatus = 'online' | 'offline' | 'away';

/** Represents a team member in GDS Sync */
export interface User {
  id: string;
  /** Display name shown across the UI */
  name: string;
  /** URL for the user's avatar image (e.g. DiceBear SVG) */
  avatar: string;
  /** Current online presence status */
  status: UserStatus;
  /** Team roles assigned to this user (e.g. 'Lead', 'Art', 'Code') */
  roles: string[];
  /** Whether this user has administrative privileges (e.g. creating new roles) */
  isAdmin: boolean;
}
