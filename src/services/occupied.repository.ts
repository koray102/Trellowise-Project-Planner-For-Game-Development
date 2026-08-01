/**
 * Occupied Item Repository — Data access layer for the `occupied_items` table
 *
 * Encapsulates all Supabase queries for the Conflict Prevention Engine.
 * Write operations throw on error to support store-level rollback.
 */
import { supabase, hasSupabase } from '../lib/supabase';
import { logger } from '../shared/lib/logger';
import { toOccupiedItem } from './mappers/occupied.mapper';
import type { OccupiedItem, ItemType } from '../shared/types';

const MODULE = 'OccupiedRepo';

/** Fetch all occupied items from the database for a specific project */
export async function fetchAllOccupiedItems(projectId: string): Promise<OccupiedItem[]> {
  if (!hasSupabase || !supabase) return [];

  const { data, error } = await supabase.from('occupied_items').select('*').eq('project_id', projectId);

  if (error) {
    logger.error(MODULE, 'Failed to fetch occupied items', error);
    return [];
  }

  logger.debug(MODULE, `Fetched ${data.length} occupied items`);
  return data.map(toOccupiedItem);
}

/**
 * Insert a new occupied item (asset).
 * @throws {Error} If the database insert fails
 */
export async function insertOccupiedItem(id: string, projectId: string, name: string, type: ItemType): Promise<void> {
  if (!hasSupabase || !supabase) return;

  const { error } = await supabase.from('occupied_items').insert({ id, project_id: projectId, name, type });

  if (error) {
    logger.error(MODULE, `Failed to insert occupied item "${name}"`, error);
    throw new Error(`DB insert failed: ${error.message}`);
  }

  logger.info(MODULE, `Inserted occupied item "${name}" (${type})`);
}

/**
 * Delete an occupied item by ID.
 * @throws {Error} If the database delete fails
 */
export async function deleteOccupiedItem(itemId: string): Promise<void> {
  if (!hasSupabase || !supabase) return;

  const { error } = await supabase.from('occupied_items').delete().eq('id', itemId);

  if (error) {
    logger.error(MODULE, `Failed to delete occupied item ${itemId}`, error);
    throw new Error(`DB delete failed: ${error.message}`);
  }

  logger.info(MODULE, `Deleted occupied item ${itemId}`);
}

/**
 * Rename an occupied item.
 * @throws {Error} If the database update fails
 */
export async function renameOccupiedItem(itemId: string, newName: string): Promise<void> {
  if (!hasSupabase || !supabase) return;

  const { error } = await supabase.from('occupied_items').update({ name: newName }).eq('id', itemId);

  if (error) {
    logger.error(MODULE, `Failed to rename occupied item ${itemId}`, error);
    throw new Error(`DB update failed: ${error.message}`);
  }

  logger.info(MODULE, `Renamed occupied item ${itemId} to "${newName}"`);
}

/**
 * Update the lock status (locked_by) of an occupied item.
 * @throws {Error} If the database update fails
 */
export async function updateOccupiedLock(itemId: string, lockedBy: string | null): Promise<void> {
  if (!hasSupabase || !supabase) return;

  const { error } = await supabase.from('occupied_items').update({
    locked_by: lockedBy,
    last_updated: new Date().toISOString(),
  }).eq('id', itemId);

  if (error) {
    logger.error(MODULE, `Failed to update lock for item ${itemId}`, error);
    throw new Error(`DB update failed: ${error.message}`);
  }

  const action = lockedBy ? `Locked by ${lockedBy}` : 'Unlocked';
  logger.info(MODULE, `${action}: item ${itemId}`);
}
