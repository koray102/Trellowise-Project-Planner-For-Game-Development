/**
 * User Repository — Data access layer for the `users` table
 *
 * Encapsulates all Supabase queries for user data.
 * The store calls these functions instead of making direct Supabase queries.
 */
import { supabase, hasSupabase } from '../lib/supabase';
import { logger } from '../shared/lib/logger';
import { toUser, toDbUser } from './mappers/user.mapper';
import type { User } from '../shared/types';

const MODULE = 'UserRepo';

/** Fetch all users from the database */
export async function fetchAllUsers(): Promise<User[]> {
  if (!hasSupabase || !supabase) return [];

  const { data, error } = await supabase.from('users').select('*');

  if (error) {
    logger.error(MODULE, 'Failed to fetch users', error);
    return [];
  }

  logger.debug(MODULE, `Fetched ${data.length} users`);
  return data.map(toUser);
}

/** Update a user's profile (name, avatar, roles) */
export async function updateUser(userId: string, updates: Partial<User>): Promise<void> {
  if (!hasSupabase || !supabase) return;

  const dbUpdates = toDbUser(updates);
  const { error } = await supabase.from('users').update(dbUpdates).eq('id', userId);

  if (error) {
    logger.error(MODULE, `Failed to update user ${userId}`, error);
  } else {
    logger.info(MODULE, `Updated user ${userId}`, dbUpdates);
  }
}

/** Fetch site password from the config table */
export async function fetchSitePassword(): Promise<string | null> {
  if (!hasSupabase || !supabase) return null;

  const { data, error } = await supabase
    .from('config')
    .select('*')
    .eq('key', 'site_password')
    .single();

  if (error) {
    logger.warn(MODULE, 'Could not fetch site password from config', error);
    return null;
  }

  return data?.value ?? null;
}
