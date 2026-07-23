/**
 * Task Repository — Data access layer for the `tasks` table
 *
 * Encapsulates all Supabase queries for task/kanban data.
 * Handles the sort_order column gracefully (backward compatible
 * with databases that may not have this column yet).
 */
import { supabase, hasSupabase } from '../lib/supabase';
import { logger } from '../shared/lib/logger';
import { toTask, toDbTaskInsert } from './mappers/task.mapper';
import type { TaskItem, TaskStatusType } from '../shared/types';

const MODULE = 'TaskRepo';

/** Fetch all tasks from the database */
export async function fetchAllTasks(): Promise<TaskItem[]> {
  if (!hasSupabase || !supabase) return [];

  const { data, error } = await supabase.from('tasks').select('*');

  if (error) {
    logger.error(MODULE, 'Failed to fetch tasks', error);
    return [];
  }

  logger.debug(MODULE, `Fetched ${data.length} tasks`);
  return data.map(toTask);
}

/** Insert a new task */
export async function insertTask(task: {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  status: TaskStatusType;
  sort_order: number;
}): Promise<void> {
  if (!hasSupabase || !supabase) return;

  const dbRow = toDbTaskInsert(task);

  // Insert core fields first (always works)
  const { error } = await supabase.from('tasks').insert({
    id: dbRow.id,
    title: dbRow.title,
    description: dbRow.description,
    assigned_to: dbRow.assigned_to,
    status: dbRow.status,
  });

  if (error) {
    logger.error(MODULE, `Failed to insert task ${task.id}`, error);
    return;
  }

  // Then try to set sort_order separately (won't break if column doesn't exist yet)
  supabase.from('tasks').update({ sort_order: task.sort_order }).eq('id', task.id).then(({ error: sortErr }) => {
    if (sortErr) logger.warn(MODULE, `Could not set sort_order for task ${task.id}`, sortErr);
  });

  logger.info(MODULE, `Inserted task "${task.title}"`);
}

/** Delete a task by ID */
export async function deleteTask(taskId: string): Promise<void> {
  if (!hasSupabase || !supabase) return;

  const { error } = await supabase.from('tasks').delete().eq('id', taskId);

  if (error) {
    logger.error(MODULE, `Failed to delete task ${taskId}`, error);
  } else {
    logger.info(MODULE, `Deleted task ${taskId}`);
  }
}

/** Update a single field on a task */
export async function updateTaskField(
  taskId: string,
  field: 'title' | 'description' | 'assigned_to' | 'status',
  value: string
): Promise<void> {
  if (!hasSupabase || !supabase) return;

  const { error } = await supabase.from('tasks').update({ [field]: value }).eq('id', taskId);

  if (error) {
    logger.error(MODULE, `Failed to update task ${taskId} field "${field}"`, error);
  } else {
    logger.debug(MODULE, `Updated task ${taskId}: ${field} = "${value}"`);
  }
}

/** Move a task to a new status column with updated sort_order */
export async function moveTaskStatus(taskId: string, newStatus: TaskStatusType, sort_order: number): Promise<void> {
  if (!hasSupabase || !supabase) return;

  // Always update status first (critical)
  const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);

  if (error) {
    logger.error(MODULE, `Failed to move task ${taskId} to "${newStatus}"`, error);
    return;
  }

  // Then try sort_order separately (won't break if column doesn't exist yet)
  supabase.from('tasks').update({ sort_order }).eq('id', taskId).then(({ error: sortErr }) => {
    if (sortErr) logger.warn(MODULE, `Could not set sort_order for moved task ${taskId}`, sortErr);
  });

  logger.info(MODULE, `Moved task ${taskId} to "${newStatus}"`);
}

/** Batch update sort_order for multiple tasks (used after drag-and-drop reorder) */
export async function reorderTasksSortOrder(updates: { id: string; sort_order: number }[]): Promise<void> {
  if (!hasSupabase || !supabase) return;

  const results = await Promise.all(
    updates.map(u =>
      supabase!.from('tasks').update({ sort_order: u.sort_order }).eq('id', u.id)
    )
  );

  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    logger.error(MODULE, `Failed to reorder ${errors.length}/${updates.length} tasks`, errors);
  } else {
    logger.debug(MODULE, `Reordered ${updates.length} tasks`);
  }
}
