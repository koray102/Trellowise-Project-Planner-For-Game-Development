/**
 * Auth Store — Authentication state management
 *
 * Manages site password verification and authentication status.
 * Separated from user identity (handled by useUserStore).
 */
import { create } from 'zustand';
import { logger } from '../shared/lib/logger';

const MODULE = 'AuthStore';

interface AuthState {
  /** Whether the user has passed password verification */
  isAuthenticated: boolean;
  /** The site-wide password (fetched from config table or env) */
  sitePassword: string | null;

  // Actions
  /** Verify a password attempt and update authentication state */
  loginWithPassword: (password: string) => boolean;

  // Internal setters (used by initDb orchestrator)
  /** @internal Set authentication state directly */
  _setAuthenticated: (value: boolean) => void;
  /** @internal Set site password directly */
  _setSitePassword: (value: string | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  sitePassword: null,

  loginWithPassword: (password) => {
    const correctPassword = get().sitePassword;
    if (!correctPassword || password === correctPassword) {
      try { localStorage.setItem('gds-auth-pass', password); } catch { /* noop */ }
      set({ isAuthenticated: true });
      logger.info(MODULE, 'User authenticated successfully');
      return true;
    }
    logger.warn(MODULE, 'Authentication failed — incorrect password');
    return false;
  },

  _setAuthenticated: (value) => set({ isAuthenticated: value }),
  _setSitePassword: (value) => set({ sitePassword: value }),
}));
