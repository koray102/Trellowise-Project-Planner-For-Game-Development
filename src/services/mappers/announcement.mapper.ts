/**
 * Announcement Mapper — Transforms between Supabase DB rows and App-level AnnouncementItem models
 *
 * DB uses: user_id, created_at (snake_case columns)
 * App uses: userId, createdAt (camelCase)
 *
 * Note: created_at is stored as BIGINT (milliseconds) in the DB,
 * but the realtime channel sometimes returns it as a number directly.
 */
import type { AnnouncementItem } from '../../shared/types';

/** Raw row shape returned by Supabase `announcements` table */
export interface DbAnnouncementRow {
  id: string;
  project_id: string;
  text: string;
  user_id: string;
  created_at: number | string;
}

/**
 * Converts a Supabase `announcements` DB row into an App-level AnnouncementItem model.
 * Handles both numeric and string timestamp formats for created_at.
 */
export function toAnnouncement(row: DbAnnouncementRow): AnnouncementItem {
  return {
    id: row.id,
    projectId: row.project_id,
    text: row.text,
    userId: row.user_id,
    createdAt: typeof row.created_at === 'number'
      ? row.created_at
      : new Date(row.created_at).getTime(),
  };
}
