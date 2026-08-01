/**
 * Task Store — Kanban board state management
 *
 * Manages task items with optimistic updates and rollback on failure.
 * When a user performs an action (add/delete/rename/move), the UI updates
 * instantly. If the database operation fails, the state rolls back
 * to the previous snapshot and logs an error.
 */
import { create } from 'zustand';
import { logger } from '../shared/lib/logger';
import {
  insertTask, deleteTask, updateTaskField,
  moveTaskStatus, reorderTasksSortOrder
} from '../services/task.repository';
import type { TaskItem, TaskStatusType } from '../shared/types';
import { hasSupabase } from '../lib/supabase';

const MODULE = 'TaskStore';

// Mock data for offline/demo mode
const MOCK_TASKS: TaskItem[] = [
  { id: 't1', title: 'Fix jumping physics bug', description: 'Player occasionally double jumps when hitting a slope.', assignedTo: '3', status: 'progress', sort_order: 0 },
  { id: 't2', title: 'Design Level 2 layout', description: 'Focus on verticality and adding new enemy types.', assignedTo: '4', status: 'todo', sort_order: 0 },
  { id: 't3', title: 'Create main character animations', description: 'Attack, Dash, and Idle loops.', assignedTo: '2', status: 'progress', sort_order: 1 },
  { id: 't4', title: 'Implement audio manager', description: 'Add support for spatial 3D audio in Unity.', assignedTo: '1', status: 'done', sort_order: 0 },
  { id: 't5', title: 'Refactor UI code (Technical Debt)', description: 'Move from old canvas system to UI Toolkit.', assignedTo: '1', status: 'debt', sort_order: 0 },
];

interface TaskState {
  /** All task items across all Kanban columns */
  tasks: TaskItem[];

  // Actions — all use optimistic updates with rollback
  addTask: (title: string, description: string, assignedTo: string, status: TaskStatusType) => Promise<void>;
  removeTask: (taskId: string) => Promise<void>;
  renameTask: (taskId: string, newTitle: string) => Promise<void>;
  updateTaskDescription: (taskId: string, newDescription: string) => Promise<void>;
  reassignTask: (taskId: string, newAssignee: string) => Promise<void>;
  moveTask: (taskId: string, newStatus: TaskStatusType) => Promise<void>;
  reorderTasks: (reorderedIds: string[], status: TaskStatusType) => Promise<void>;

  /** @internal Bulk replace tasks array (used by initDb/realtime) */
  _setTasks: (tasks: TaskItem[]) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: hasSupabase ? [] : MOCK_TASKS,

  addTask: async (title, description, assignedTo, status) => {
    const id = `task_${Date.now()}`;
    const sort_order = -Date.now();
    const newTask: TaskItem = { id, title, description, assignedTo, status, sort_order };

    // Optimistic: add immediately
    set((state) => ({ tasks: [...state.tasks, newTask] }));

    try {
      await insertTask({ id, title, description, assignedTo, status, sort_order });
      logger.info(MODULE, `Added task "${title}"`);
    } catch (err) {
      // Rollback: remove the optimistically added task
      logger.error(MODULE, `Failed to add task "${title}", rolling back`, err);
      set((state) => ({ tasks: state.tasks.filter(t => t.id !== id) }));
    }
  },

  removeTask: async (taskId) => {
    // Snapshot for rollback
    const previousTasks = get().tasks;
    set((state) => ({ tasks: state.tasks.filter(t => t.id !== taskId) }));

    try {
      await deleteTask(taskId);
      logger.info(MODULE, `Removed task ${taskId}`);
    } catch (err) {
      logger.error(MODULE, `Failed to remove task ${taskId}, rolling back`, err);
      set({ tasks: previousTasks });
    }
  },

  renameTask: async (taskId, newTitle) => {
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.map(t => t.id === taskId ? { ...t, title: newTitle } : t)
    }));

    try {
      await updateTaskField(taskId, 'title', newTitle);
      logger.debug(MODULE, `Renamed task ${taskId} to "${newTitle}"`);
    } catch (err) {
      logger.error(MODULE, `Failed to rename task ${taskId}, rolling back`, err);
      set({ tasks: previousTasks });
    }
  },

  updateTaskDescription: async (taskId, newDescription) => {
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.map(t => t.id === taskId ? { ...t, description: newDescription } : t)
    }));

    try {
      await updateTaskField(taskId, 'description', newDescription);
      logger.debug(MODULE, `Updated description for task ${taskId}`);
    } catch (err) {
      logger.error(MODULE, `Failed to update description for task ${taskId}, rolling back`, err);
      set({ tasks: previousTasks });
    }
  },

  reassignTask: async (taskId, newAssignee) => {
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.map(t => t.id === taskId ? { ...t, assignedTo: newAssignee } : t)
    }));

    try {
      await updateTaskField(taskId, 'assigned_to', newAssignee);
      logger.debug(MODULE, `Reassigned task ${taskId} to user ${newAssignee}`);
    } catch (err) {
      logger.error(MODULE, `Failed to reassign task ${taskId}, rolling back`, err);
      set({ tasks: previousTasks });
    }
  },

  moveTask: async (taskId, newStatus) => {
    const sort_order = -Date.now();
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.map(t => t.id === taskId ? { ...t, status: newStatus, sort_order } : t)
    }));

    try {
      await moveTaskStatus(taskId, newStatus, sort_order);
      logger.info(MODULE, `Moved task ${taskId} to "${newStatus}"`);
    } catch (err) {
      logger.error(MODULE, `Failed to move task ${taskId} to "${newStatus}", rolling back`, err);
      set({ tasks: previousTasks });
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  reorderTasks: async (reorderedIds, _status) => {
    const updates = reorderedIds.map((id, index) => ({ id, sort_order: index }));
    const previousTasks = get().tasks;

    set((state) => ({
      tasks: state.tasks.map(t => {
        const update = updates.find(u => u.id === t.id);
        return update ? { ...t, sort_order: update.sort_order } : t;
      })
    }));

    try {
      await reorderTasksSortOrder(updates);
      logger.debug(MODULE, `Reordered ${updates.length} tasks`);
    } catch (err) {
      logger.error(MODULE, `Failed to reorder tasks, rolling back`, err);
      set({ tasks: previousTasks });
    }
  },

  _setTasks: (tasks) => set({ tasks }),
}));
