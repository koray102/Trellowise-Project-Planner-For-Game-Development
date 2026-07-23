/**
 * Announcement Domain Types
 *
 * Defines the shape of team announcement/feed data.
 * Announcements appear on the Dashboard feed and as notification banners.
 */

/** Represents a team announcement posted by a user */
export interface AnnouncementItem {
  id: string;
  /** The announcement message text */
  text: string;
  /** User ID of the person who posted this announcement */
  userId: string;
  /** Creation timestamp in milliseconds (used for sorting and relative time display) */
  createdAt: number;
}
