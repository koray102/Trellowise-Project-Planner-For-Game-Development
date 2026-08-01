/**
 * Announcement Store — Team announcement feed state management
 *
 * Manages team announcements with optimistic updates and rollback
 * on database failure.
 */
import { create } from 'zustand';
import { logger } from '../shared/lib/logger';
import { insertAnnouncement } from '../services/announcement.repository';
import type { AnnouncementItem } from '../shared/types';
import { hasSupabase } from '../lib/supabase';
import { useProjectStore } from './useProjectStore';

const MODULE = 'AnnouncementStore';

// Mock data for offline/demo mode
const MOCK_ANNOUNCEMENTS: AnnouncementItem[] = [
  { id: 'a1', projectId: 'proj_1', text: 'New Unity Package added to repo.', userId: '4', createdAt: Date.now() - 1000 * 60 * 60 * 2 },
  { id: 'a2', projectId: 'proj_1', text: 'Main menu scene unlocked. Feel free to tweak UI.', userId: '3', createdAt: Date.now() - 1000 * 60 * 60 * 24 },
];

interface AnnouncementState {
  /** All team announcements, newest first */
  announcements: AnnouncementItem[];

  // Actions
  addAnnouncement: (text: string, userId: string) => Promise<void>;

  /** @internal Bulk replace announcements (used by initDb/realtime) */
  _setAnnouncements: (announcements: AnnouncementItem[]) => void;
}

export const useAnnouncementStore = create<AnnouncementState>((set) => ({
  announcements: hasSupabase ? [] : MOCK_ANNOUNCEMENTS,

  addAnnouncement: async (text, userId) => {
    const projectId = useProjectStore.getState().currentProjectId;
    if (!projectId) return;

    const newAnnounce: AnnouncementItem = {
      id: `ann_${Date.now()}`,
      projectId,
      text,
      userId,
      createdAt: Date.now()
    };

    // Optimistic: add to feed immediately
    set((state) => ({ announcements: [newAnnounce, ...state.announcements] }));

    try {
      await insertAnnouncement(newAnnounce);
      logger.info(MODULE, `Published announcement by user ${userId}`);
    } catch (err) {
      // Rollback: remove the optimistically added announcement
      logger.error(MODULE, `Failed to publish announcement, rolling back`, err);
      set((state) => ({
        announcements: state.announcements.filter(a => a.id !== newAnnounce.id)
      }));
    }
  },

  _setAnnouncements: (announcements) => set({ announcements }),
}));
