/**
 * Calendar Event Mapper — Transforms between Supabase DB rows and App-level CalendarEvent models
 *
 * DB stores date as BIGINT (millisecond timestamp).
 * App uses the same numeric format, but we ensure proper type coercion.
 */
import type { CalendarEvent, EventType } from '../../shared/types';

/** Raw row shape returned by Supabase `events` table */
export interface DbEventRow {
  id: string;
  title: string;
  description: string | null;
  date: number | string;
  type: string;
}

/**
 * Converts a Supabase `events` DB row into an App-level CalendarEvent model.
 */
export function toCalendarEvent(row: DbEventRow): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    date: Number(row.date),
    type: row.type as EventType,
  };
}
