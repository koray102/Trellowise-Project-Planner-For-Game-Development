/**
 * Announcement Repository — Data access layer for the `announcements` table
 *
 * Encapsulates all Supabase queries for team announcement data.
 * Functions throw on error so the caller (store) can handle rollback.
 */
import { supabase, hasSupabase } from '../lib/supabase';
import { logger } from '../shared/lib/logger';
import { toAnnouncement } from './mappers/announcement.mapper';
import type { AnnouncementItem } from '../shared/types';

const MODULE = 'AnnouncementRepo';

/** Fetch all announcements for a specific project, ordered by creation date (newest first) */
export async function fetchAllAnnouncements(projectId: string): Promise<AnnouncementItem[]> {
  if (!hasSupabase || !supabase) return [];

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error(MODULE, 'Failed to fetch announcements', error);
    return [];
  }

  logger.debug(MODULE, `Fetched ${data.length} announcements`);
  return data.map(toAnnouncement);
}

/**
 * Insert a new announcement.
 * @throws {Error} If the database insert fails
 */
export async function insertAnnouncement(announcement: AnnouncementItem): Promise<void> {
  if (!hasSupabase || !supabase) return;

  const { error } = await supabase.from('announcements').insert({
    id: announcement.id,
    project_id: announcement.projectId,
    text: announcement.text,
    user_id: announcement.userId,
    created_at: announcement.createdAt,
  });

  if (error) {
    logger.error(MODULE, `Failed to insert announcement "${announcement.id}"`, error);
    throw new Error(`DB insert failed: ${error.message}`);
  }

  logger.info(MODULE, `Inserted announcement from user ${announcement.userId}`);
}
