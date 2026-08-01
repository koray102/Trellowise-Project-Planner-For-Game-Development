/**
 * Occupied Item Mapper — Transforms between Supabase DB rows and App-level OccupiedItem models
 *
 * DB uses: locked_by, last_updated (snake_case columns)
 * App uses: occupiedBy, lastUpdated (camelCase)
 */
import type { OccupiedItem, ItemType } from '../../shared/types';

/** Raw row shape returned by Supabase `occupied_items` table */
export interface DbOccupiedRow {
  id: string;
  project_id: string;
  name: string;
  type: string;
  locked_by: string | null;
  last_updated: string;
}

/**
 * Converts a Supabase `occupied_items` DB row into an App-level OccupiedItem model.
 */
export function toOccupiedItem(row: DbOccupiedRow): OccupiedItem {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    type: row.type as ItemType,
    occupiedBy: row.locked_by,
    lastUpdated: new Date(row.last_updated).getTime(),
  };
}
