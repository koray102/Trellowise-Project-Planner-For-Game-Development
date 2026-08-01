/**
 * Tasks feature constants — Shared column/status definitions
 *
 * Used by both the Tasks page and SortableTaskItem sub-component.
 */
import { Circle, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import type { TaskStatusType } from '../../shared/types';

/** Kanban column definitions in display order */
export const COLUMNS: { id: TaskStatusType; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
  { id: 'debt', title: 'Debt / Backlog' },
];

/** Icon for each task status */
export const STATUS_ICONS: Record<TaskStatusType, React.ElementType> = {
  todo: Circle,
  progress: Clock,
  done: CheckCircle2,
  debt: AlertCircle
};

/** Text color for each task status */
export const STATUS_COLORS: Record<TaskStatusType, string> = {
  todo: 'text-zinc-400',
  progress: 'text-blue-400',
  done: 'text-emerald-400',
  debt: 'text-rose-400'
};

/** Column background tints for visual differentiation */
export const COLUMN_TINTS: Record<TaskStatusType, string> = {
  todo: 'bg-zinc-950/50 border-zinc-800/60',
  progress: 'bg-blue-950/20 border-blue-900/30',
  done: 'bg-emerald-950/20 border-emerald-900/30',
  debt: 'bg-red-950/20 border-red-900/30',
};
