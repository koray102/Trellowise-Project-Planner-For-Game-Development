/**
 * Calendar Store — Team calendar event state management
 *
 * Manages calendar events with optimistic updates and rollback
 * on database failure.
 */
import { create } from 'zustand';
import { logger } from '../shared/lib/logger';
import { insertEvent } from '../services/calendar.repository';
import type { CalendarEvent, EventType } from '../shared/types';
import { hasSupabase } from '../lib/supabase';

const MODULE = 'CalendarStore';

// Mock data for offline/demo mode
const MOCK_EVENTS: CalendarEvent[] = [
  { id: 'e1', title: 'Sprint Planning', description: 'Kickoff meeting for the next 2 weeks.', date: new Date().getTime(), type: 'meeting' },
  { id: 'e2', title: 'Level 1 Alpha Lock', description: 'All core assets must be finished for L1.', date: new Date(new Date().setDate(new Date().getDate() + 4)).getTime(), type: 'deadline' },
  { id: 'e3', title: 'Audio Review', description: 'Reviewing the ambient noises in Sector 4.', date: new Date(new Date().setDate(new Date().getDate() + 2)).getTime(), type: 'meeting' },
  { id: 'e4', title: 'Pre-production wrap', description: 'Final meeting before alpha coding phase begins.', date: new Date(new Date().setDate(new Date().getDate() - 5)).getTime(), type: 'milestone' },
  { id: 'e5', title: 'Marketing sync', description: 'Discussing trailer assets.', date: new Date(new Date().setDate(new Date().getDate() - 1)).getTime(), type: 'meeting' },
  { id: 'e6', title: 'Beta Branch Cut', date: new Date(new Date().setDate(new Date().getDate() + 8)).getTime(), type: 'deadline' },
];

interface CalendarState {
  /** All calendar events */
  events: CalendarEvent[];

  // Actions
  addEvent: (title: string, description: string, date: Date, type: EventType) => Promise<void>;

  /** @internal Bulk replace events (used by initDb/realtime) */
  _setEvents: (events: CalendarEvent[]) => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  events: hasSupabase ? [] : MOCK_EVENTS,

  addEvent: async (title, description, date, type) => {
    const id = `event_${Date.now()}`;
    const newEvent: CalendarEvent = {
      id,
      title,
      description,
      date: date.getTime(),
      type
    };

    // Optimistic: add to calendar immediately
    set((state) => ({ events: [...state.events, newEvent] }));

    try {
      await insertEvent({ id, title, description, date: date.getTime(), type });
      logger.info(MODULE, `Added event "${title}" on ${date.toISOString()}`);
    } catch (err) {
      // Rollback: remove the optimistically added event
      logger.error(MODULE, `Failed to add event "${title}", rolling back`, err);
      set((state) => ({ events: state.events.filter(e => e.id !== id) }));
    }
  },

  _setEvents: (events) => set({ events }),
}));
