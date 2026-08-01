/**
 * Calendar Event Repository — Data access layer for the `events` table
 *
 * Encapsulates all Supabase queries for calendar event data.
 * Write operations throw on error to support store-level rollback.
 */
import { supabase, hasSupabase } from '../lib/supabase';
import { logger } from '../shared/lib/logger';
import { toCalendarEvent } from './mappers/calendar.mapper';
import type { CalendarEvent, EventType } from '../shared/types';

const MODULE = 'CalendarRepo';

/** Fetch all calendar events from the database */
export async function fetchAllEvents(): Promise<CalendarEvent[]> {
  if (!hasSupabase || !supabase) return [];

  const { data, error } = await supabase.from('events').select('*');

  if (error) {
    logger.error(MODULE, 'Failed to fetch events', error);
    return [];
  }

  logger.debug(MODULE, `Fetched ${data.length} events`);
  return data.map(toCalendarEvent);
}

/**
 * Insert a new calendar event.
 * @throws {Error} If the database insert fails
 */
export async function insertEvent(event: {
  id: string;
  title: string;
  description: string;
  date: number;
  type: EventType;
}): Promise<void> {
  if (!hasSupabase || !supabase) return;

  const { error } = await supabase.from('events').insert({
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date,
    type: event.type,
  });

  if (error) {
    logger.error(MODULE, `Failed to insert event "${event.title}"`, error);
    throw new Error(`DB insert failed: ${error.message}`);
  }

  logger.info(MODULE, `Inserted event "${event.title}"`);
}
