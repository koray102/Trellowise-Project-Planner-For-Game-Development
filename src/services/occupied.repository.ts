/**
 * Occupied Item Repository — Data access layer for the `occupied_items` table
 *
 * Encapsulates all Supabase queries for the Conflict Prevention Engine.
 */
import { supabase, hasSupabase } from '../lib/supabase';
import { logger } from '../shared/lib/logger';
import { toOccupiedItem } from './mappers/occupied.mapper';
import type { OccupiedItem, ItemType } from '../shared/types';

const MODULE = 'OccupiedRepo';

/** Fetch all occupied items from the database */
export async function fetchAllOccupiedItems(): Promise<OccupiedItem[]> {
  if (!hasSupabase || !supabase) return [];

  const { data, error } = await supabase.from('occupied_items').select('*');

  if (error) {
    logger.error(MODULE, 'Failed to fetch occupied items', error);
    return [];
  }

  logger.debug(MODULE, `Fetched ${data.length} occupied items`);
  return data.map(toOccupiedItem);
}

/** Insert a new occupied item (asset) */
export async function insertOccupiedItem(id: string, name: string, type: ItemType): Promise<void> {
  if (!hasSupabase || !supabase) return;

  const { error } = await supabase.from('occupied_items').insert({ id, name, type });

  if (error) {
    logger.error(MODULE, `Failed to insert occupied item "${name}"`, error);
  } else {
    logger.info(MODULE, `Inserted occupied item "${name}" (${type})`);
  }
}

/** Delete an occupied item by ID */
export async function deleteOccupiedItem(itemId: string): Promise<void> {
  if (!hasSupabase || !supabase) return;

  const { error } = await supabase.from('occupied_items').delete().eq('id', itemId);

  if (error) {
    logger.error(MODULE, `Failed to delete occupied item ${itemId}`, error);
  } else {
    logger.info(MODULE, `Deleted occupied item ${itemId}`);
  }
}

/** Rename an occupied item */
export async function renameOccupiedItem(itemId: string, newName: string): Promise<void> {
  if (!hasSupabase || !supabase) return;

  const { error } = await supabase.from('occupied_items').update({ name: newName }).eq('id', itemId);

  if (error) {
    logger.error(MODULE, `Failed to rename occupied item ${itemId}`, error);
  } else {
    logger.info(MODULE, `Renamed occupied item ${itemId} to "${newName}"`);
  }
}

/** Update the lock status (locked_by) of an occupied item */
export async function updateOccupiedLock(itemId: string, lockedBy: string | null): Promise<void> {
  if (!hasSupabase || !supabase) return;

  const { error } = await supabase.from('occupied_items').update({
    locked_by: lockedBy,
    last_updated: new Date().toISOString(),
  }).eq('id', itemId);

  if (error) {
    logger.error(MODULE, `Failed to update lock for item ${itemId}`, error);
  } else {
    const action = lockedBy ? `Locked by ${lockedBy}` : 'Unlocked';
    logger.info(MODULE, `${action}: item ${itemId}`);
  }
}
