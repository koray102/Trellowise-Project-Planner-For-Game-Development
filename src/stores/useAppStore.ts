/**
 * App Store — Application-level orchestration
 *
 * Manages database readiness and the initDb lifecycle.
 * This is the orchestrator that initializes ALL domain stores
 * by fetching data from repositories and setting up Supabase
 * realtime subscriptions.
 *
 * This store does NOT hold domain data — it delegates to individual stores.
 */
import { create } from 'zustand';
import { supabase, hasSupabase } from '../lib/supabase';
import { logger } from '../shared/lib/logger';

// Repositories
import { fetchAllUsers, fetchSitePassword } from '../services/user.repository';
import { fetchAllTasks } from '../services/task.repository';
import { fetchAllOccupiedItems } from '../services/occupied.repository';
import { fetchAllEvents } from '../services/calendar.repository';
import { fetchAllAnnouncements } from '../services/announcement.repository';

// Mappers (used by realtime subscription handlers)
import { toUser } from '../services/mappers/user.mapper';
import { toTask } from '../services/mappers/task.mapper';
import { toOccupiedItem } from '../services/mappers/occupied.mapper';
import { toCalendarEvent } from '../services/mappers/calendar.mapper';
import { toAnnouncement } from '../services/mappers/announcement.mapper';

// Domain stores (accessed via getState() for cross-store updates)
import { useAuthStore } from './useAuthStore';
import { useUserStore, getSavedUserId } from './useUserStore';
import { useTaskStore } from './useTaskStore';
import { useOccupiedStore } from './useOccupiedStore';
import { useCalendarStore } from './useCalendarStore';
import { useAnnouncementStore } from './useAnnouncementStore';

import type { UserStatus } from '../shared/types';

const MODULE = 'AppStore';

interface AppState {
  /** Whether the database (or mock data) is ready for the UI */
  dbReady: boolean;

  /** Initialize all stores: fetch data, set up realtime, configure auth */
  initDb: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  dbReady: !hasSupabase, // true immediately if no Supabase (mock data ready)

  initDb: async () => {
    if (!hasSupabase || !supabase) {
      logger.warn(MODULE, 'Supabase credentials not found. Utilizing local mock data for GDS.');
      set({ dbReady: true });
      return;
    }

    try {
      // Local variable to store real-time presence explicitly to avoid DB overwrite
      let currentOnlineIds = new Set<string>();
      let isPresenceSubscribed = false;

      // Create presence channel
      const presenceChannel = supabase.channel('online-users', {
        config: { presence: { key: '' } }
      });

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          currentOnlineIds = new Set(
            Object.values(state)
              .flat()
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .map((p: any) => p.userId as string | undefined)
              .filter((id): id is string => typeof id === 'string')
          );

          // Update users' online status in the UserStore
          useUserStore.setState((s) => ({
            users: s.users.map(u => ({
              ...u,
              status: currentOnlineIds.has(u.id) ? 'online' as UserStatus : 'offline' as UserStatus
            }))
          }));
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            isPresenceSubscribed = true;
            const currentU = useUserStore.getState().currentUser;
            if (currentU) {
              await presenceChannel.track({ userId: currentU.id, online_at: new Date().toISOString() });
            }
          }
        });

      // Fetch initial data via repositories (parallel)
      logger.info(MODULE, 'Fetching initial data from Supabase...');
      const [users, occupiedItems, tasks, events, announcements, sitePasswordValue] = await Promise.all([
        fetchAllUsers(),
        fetchAllOccupiedItems(),
        fetchAllTasks(),
        fetchAllEvents(),
        fetchAllAnnouncements(),
        fetchSitePassword(),
      ]);

      // Apply presence status to fetched users and restore currentUser
      if (users.length > 0) {
        const updatedUsers = users.map(u => ({
          ...u,
          status: currentOnlineIds.has(u.id) ? 'online' as UserStatus : 'offline' as UserStatus,
        }));

        const savedUserId = getSavedUserId();
        const prevCurrentUserId = savedUserId || useUserStore.getState().currentUser?.id;
        const newCurrentUser = prevCurrentUserId
          ? (updatedUsers.find(u => u.id === prevCurrentUserId) ?? null)
          : null;

        useUserStore.getState()._setUsers(updatedUsers);
        useUserStore.getState()._setCurrentUser(newCurrentUser);

        // Track presence if user was restored after channel subscription
        if (newCurrentUser && isPresenceSubscribed) {
          presenceChannel.track({ userId: newCurrentUser.id, online_at: new Date().toISOString() });
        }
      }

      // Handle config/password → AuthStore
      let currentSitePassword = import.meta.env.VITE_APP_PASSWORD || null;
      if (sitePasswordValue) {
        currentSitePassword = sitePasswordValue;
      }

      const storedPass = localStorage.getItem('gds-auth-pass');
      const isAuth = !currentSitePassword || storedPass === currentSitePassword;

      useAuthStore.getState()._setSitePassword(currentSitePassword);
      useAuthStore.getState()._setAuthenticated(isAuth);

      // Set domain data in individual stores
      useOccupiedStore.getState()._setOccupiedItems(occupiedItems);
      useTaskStore.getState()._setTasks(tasks);
      useCalendarStore.getState()._setEvents(events);
      useAnnouncementStore.getState()._setAnnouncements(announcements);

      // --- Set up Realtime Subscriptions ---
      // Each subscription re-fetches from DB and uses mappers for consistent transformation

      supabase.channel('public:occupied_items')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'occupied_items' }, () => {
          supabase!.from('occupied_items').select('*').then(res => {
            if (res.data) {
              useOccupiedStore.getState()._setOccupiedItems(res.data.map(toOccupiedItem));
            }
          });
        }).subscribe();

      supabase.channel('public:tasks')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
          supabase!.from('tasks').select('*').then(res => {
            if (res.data) {
              useTaskStore.getState()._setTasks(res.data.map(toTask));
            }
          });
        }).subscribe();

      supabase.channel('public:events')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
          supabase!.from('events').select('*').then(res => {
            if (res.data) {
              useCalendarStore.getState()._setEvents(res.data.map(toCalendarEvent));
            }
          });
        }).subscribe();

      supabase.channel('public:announcements')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
          supabase!.from('announcements').select('*').order('created_at', { ascending: false }).then(res => {
            if (res.data) {
              useAnnouncementStore.getState()._setAnnouncements(res.data.map(toAnnouncement));
            }
          });
        }).subscribe();

      supabase.channel('public:users')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
          supabase!.from('users').select('*').then(res => {
            if (res.data) {
              const updatedUsers = res.data.map(toUser);
              const prevId = useUserStore.getState().currentUser?.id;
              const newCurrentUser = updatedUsers.find(u => u.id === prevId) ?? updatedUsers[0] ?? null;
              useUserStore.getState()._setUsers(updatedUsers);
              useUserStore.getState()._setCurrentUser(newCurrentUser);
            }
          });
        }).subscribe();

      // Mark DB as ready
      set({ dbReady: true });
      logger.info(MODULE, 'Database initialized successfully');

    } catch (err) {
      logger.error(MODULE, 'Failed to initialize Supabase realtime data', err);
      set({ dbReady: true }); // still mark ready so UI isn't stuck on loading
    }
  },
}));
