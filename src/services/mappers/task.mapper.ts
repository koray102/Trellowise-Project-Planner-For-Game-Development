/**
 * Task Mapper — Transforms between Supabase DB rows and App-level TaskItem models
 *
 * DB uses: assigned_to, sort_order (snake_case columns)
 * App uses: assignedTo, sort_order (camelCase except sort_order which matches DB)
 */
import type { TaskItem, TaskStatusType } from '../../shared/types';

/** Raw row shape returned by Supabase `tasks` table */
export interface DbTaskRow {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: string;
  assigned_to: string;
  sort_order: number | null;
}

/**
 * Converts a Supabase `tasks` DB row into an App-level TaskItem model.
 */
export function toTask(row: DbTaskRow): TaskItem {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description ?? undefined,
    assignedTo: row.assigned_to,
    status: row.status as TaskStatusType,
    sort_order: row.sort_order ?? 0,
  };
}

/**
 * Converts App-level task fields into the Supabase DB column format for insert.
 */
export function toDbTaskInsert(task: {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignedTo: string;
  status: TaskStatusType;
  sort_order?: number;
}): Partial<DbTaskRow & { project_id: string }> {
  return {
    id: task.id,
    project_id: task.projectId,
    title: task.title,
    description: task.description || null,
    assigned_to: task.assignedTo,
    status: task.status,
    sort_order: task.sort_order,
  };
}
