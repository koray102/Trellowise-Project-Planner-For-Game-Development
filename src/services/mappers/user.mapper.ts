/**
 * User Mapper — Transforms between Supabase DB rows and App-level User models
 *
 * DB column names use snake_case (e.g. avatar_url, is_admin)
 * App models use camelCase (e.g. avatar, isAdmin)
 *
 * This is the single source of truth for these transformations,
 * replacing the inline mapping that was previously scattered across store.ts.
 */
import type { User } from '../../shared/types';

/** Raw row shape returned by Supabase `users` table */
export interface DbUserRow {
  id: string;
  name: string;
  avatar_url: string;
  status: string;
  roles: string[] | null;
  is_admin: boolean;
}

/**
 * Converts a Supabase `users` DB row into an App-level User model.
 * Handles null/missing fields with safe defaults.
 */
export function toUser(row: DbUserRow): User {
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar_url,
    status: (row.status as User['status']) || 'offline',
    roles: row.roles || [],
    isAdmin: row.is_admin ?? false,
  };
}

/**
 * Converts an App-level User model into the Supabase DB column format
 * for update operations. Only includes mutable fields.
 */
export function toDbUser(user: Partial<User>): Partial<DbUserRow> {
  const dbRow: Partial<DbUserRow> = {};
  if (user.name !== undefined) dbRow.name = user.name;
  if (user.avatar !== undefined) dbRow.avatar_url = user.avatar;
  if (user.roles !== undefined) dbRow.roles = user.roles;
  if (user.isAdmin !== undefined) dbRow.is_admin = user.isAdmin;
  return dbRow;
}
