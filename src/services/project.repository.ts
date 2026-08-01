/**
 * Project Repository — Data access layer for the `projects` table
 */
import { supabase, hasSupabase } from '../lib/supabase';
import { logger } from '../shared/lib/logger';
import { toProject, toDbProjectInsert } from './mappers/project.mapper';
import type { Project } from '../shared/types';

const MODULE = 'ProjectRepo';

/** Fetch all projects from the database */
export async function fetchAllProjects(): Promise<Project[]> {
  if (!hasSupabase || !supabase) return [];

  const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: true });

  if (error) {
    logger.error(MODULE, 'Failed to fetch projects', error);
    return [];
  }

  logger.debug(MODULE, `Fetched ${data.length} projects`);
  return data.map(toProject);
}

/**
 * Insert a new project.
 * @throws {Error} If the database insert fails
 */
export async function insertProject(project: Project): Promise<void> {
  if (!hasSupabase || !supabase) return;

  const dbRow = toDbProjectInsert(project);

  const { error } = await supabase.from('projects').insert(dbRow);

  if (error) {
    logger.error(MODULE, `Failed to insert project ${project.id}`, error);
    throw new Error(`DB insert failed: ${error.message}`);
  }

  logger.info(MODULE, `Inserted project "${project.name}"`);
}
