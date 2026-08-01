/**
 * Calendar Event Domain Types
 *
 * Defines the shape of calendar/scheduling data.
 * Used by the Calendar page for meetings, milestones, and deadlines.
 */

/** Categories of calendar events */
export type EventType = 'milestone' | 'meeting' | 'deadline';

/** Represents a scheduled event on the team calendar */
export interface CalendarEvent {
  id: string;
  projectId: string;
  /** Title displayed on the calendar and event list */
  title: string;
  /** Optional longer description with event details */
  description?: string;
  /** Event date as Unix timestamp in milliseconds */
  date: number;
  /** Category of the event, determines color and icon in the UI */
  type: EventType;
}
