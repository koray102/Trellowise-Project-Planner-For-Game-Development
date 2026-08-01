/**
 * Barrel Export — All Domain Types
 *
 * Central re-export point for all domain type definitions.
 * Components and services can import from here instead of
 * individual type files for convenience.
 *
 * @example
 *   import { User, TaskItem, CalendarEvent } from '@/shared/types';
 */

export type { User, UserStatus } from './user.types';
export type { TaskItem, TaskStatusType } from './task.types';
export type { OccupiedItem, ItemType } from './occupied.types';
export type { CalendarEvent, EventType } from './calendar.types';
export type { AnnouncementItem } from './announcement.types';
export type { Project } from './project.types';
