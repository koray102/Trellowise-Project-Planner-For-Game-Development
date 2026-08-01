/**
 * User Store — Team member state management
 *
 * Manages the users list, current active user, profile updates,
 * available roles, and presence tracking via Supabase Realtime.
 */
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { logger } from '../shared/lib/logger';
import { updateUser } from '../services/user.repository';
import { useAuthStore } from './useAuthStore';
import type { User, UserStatus } from '../shared/types';
import { hasSupabase } from '../lib/supabase';

const MODULE = 'UserStore';

const LS_USER_KEY = 'gds-current-user';

/** Read saved user ID from localStorage */
function getSavedUserId(): string | null {
  try { return localStorage.getItem(LS_USER_KEY); } catch { return null; }
}

/** Persist user ID to localStorage */
function saveUserId(userId: string) {
  try { localStorage.setItem(LS_USER_KEY, userId); } catch { /* noop */ }
}

// Mock data for offline/demo mode
const MOCK_USERS: User[] = [
  { id: '1', name: 'Koray', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Koray', status: 'online', roles: ['Lead'], isAdmin: true },
  { id: '2', name: 'Sam', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam', status: 'online', roles: ['Art'], isAdmin: false },
  { id: '3', name: 'Jordan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan', status: 'away', roles: ['Code'], isAdmin: false },
  { id: '4', name: 'Alex', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', status: 'offline', roles: ['Design'], isAdmin: false },
];

const MOCK_AVAILABLE_ROLES = ['Lead', 'Art', 'Code', 'Design', 'QA', 'Audio', 'Producer'];

// Restore currentUser from localStorage for mock mode
const savedId = getSavedUserId();
const initialUsers = hasSupabase ? [] : MOCK_USERS;
const restoredUser = hasSupabase
  ? null
  : (savedId ? MOCK_USERS.find(u => u.id === savedId) ?? null : null);

interface UserState {
  /** All team members */
  users: User[];
  /** Currently active user (selected from profile screen) */
  currentUser: User | null;
  /** Available team roles (Lead, Art, Code, etc.) */
  availableRoles: string[];

  // Actions
  /** Switch to a different user profile */
  setCurrentUser: (userId: string) => void;
  /** Log out: clear current user, untrack presence, reset auth */
  logoutUser: () => void;
  /** Update a user's online/offline/away status (local state only) */
  updateUserStatus: (userId: string, status: UserStatus) => void;
  /** Update user profile and persist to DB */
  updateUserProfile: (userId: string, updates: Partial<User>) => Promise<void>;
  /** Add a new role to the available roles list */
  addAvailableRole: (roleName: string) => Promise<void>;

  // Internal setters (used by initDb orchestrator)
  /** @internal Bulk replace users array */
  _setUsers: (users: User[]) => void;
  /** @internal Set current user directly */
  _setCurrentUser: (user: User | null) => void;
  /** @internal Set available roles */
  _setAvailableRoles: (roles: string[]) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: initialUsers,
  currentUser: restoredUser,
  availableRoles: hasSupabase ? [] : MOCK_AVAILABLE_ROLES,

  setCurrentUser: (userId) => {
    saveUserId(userId);
    const user = get().users.find(u => u.id === userId);
    set({ currentUser: user || null });
    logger.info(MODULE, `Switched to user: ${user?.name || userId}`);

    // Track presence if supabase is available
    if (supabase) {
      const channel = supabase.channel('online-users');
      channel.track({ userId: userId, online_at: new Date().toISOString() });
    }
  },

  logoutUser: () => {
    try {
      localStorage.removeItem(LS_USER_KEY);
      localStorage.removeItem('gds-auth-pass');
    } catch { /* noop */ }

    // Untrack presence
    if (supabase) {
      supabase.channel('online-users').untrack();
    }

    set({ currentUser: null });
    // Also reset authentication state via AuthStore
    useAuthStore.getState()._setAuthenticated(false);
    logger.info(MODULE, 'User logged out');
  },

  updateUserStatus: (userId, status) =>
    set((state) => ({
      users: state.users.map(u => u.id === userId ? { ...u, status } : u),
      currentUser: state.currentUser?.id === userId ? { ...state.currentUser, status } : state.currentUser
    })),

  updateUserProfile: async (userId, updates) => {
    // Snapshot for rollback
    const previousUsers = get().users;
    const previousCurrentUser = get().currentUser;

    // Optimistic UI update
    set((state) => {
      const updatedUsers = state.users.map(u => u.id === userId ? { ...u, ...updates } : u);
      return {
        users: updatedUsers,
        currentUser: state.currentUser?.id === userId ? { ...state.currentUser, ...updates } : state.currentUser
      };
    });

    try {
      await updateUser(userId, updates);
      logger.info(MODULE, `Updated profile for user ${userId}`);
    } catch (err) {
      logger.error(MODULE, `Failed to update profile for user ${userId}, rolling back`, err);
      set({ users: previousUsers, currentUser: previousCurrentUser });
    }
  },

  addAvailableRole: async (roleName) => {
    set((state) => ({
      availableRoles: [...new Set([...state.availableRoles, roleName])]
    }));
    // No separate roles table — roles are stored per-user in users.roles
  },

  // Internal setters
  _setUsers: (users) => set({ users }),
  _setCurrentUser: (user) => set({ currentUser: user }),
  _setAvailableRoles: (roles) => set({ availableRoles: roles }),
}));

// Re-export helpers for initDb usage
export { getSavedUserId };
