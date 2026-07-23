/**
 * Task Domain Types
 *
 * Defines the shape of task/kanban-related data.
 * Used by the Kanban board (Tasks page) and Dashboard task summaries.
 */

/** Possible statuses for a task on the Kanban board */
export type TaskStatusType = 'todo' | 'progress' | 'done' | 'debt';

/** Represents a single task card on the Kanban board */
export interface TaskItem {
  id: string;
  /** Short title displayed on the task card */
  title: string;
  /** Optional longer description with task details */
  description?: string;
  /** User ID of the team member this task is assigned to */
  assignedTo: string;
  /** Current column/status of the task */
  status: TaskStatusType;
  /** Numeric value used for ordering tasks within a column (lower = higher position) */
  sort_order: number;
}
