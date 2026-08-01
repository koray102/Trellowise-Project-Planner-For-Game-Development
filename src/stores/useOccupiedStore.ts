/**
 * Occupied Store — Conflict Prevention Engine state management
 *
 * Manages Unity asset lock/unlock state with optimistic updates
 * and rollback on database failure.
 */
import { create } from 'zustand';
import { logger } from '../shared/lib/logger';
import {
  insertOccupiedItem, deleteOccupiedItem,
  renameOccupiedItem as renameOccupiedItemRepo,
  updateOccupiedLock
} from '../services/occupied.repository';
import type { OccupiedItem, ItemType } from '../shared/types';
import { hasSupabase } from '../lib/supabase';

const MODULE = 'OccupiedStore';

// Mock data for offline/demo mode
const MOCK_OCCUPIED: OccupiedItem[] = [
  { id: '1', name: 'MainMenu', type: 'scene', occupiedBy: '1', lastUpdated: Date.now() - 1000 * 60 * 30 },
  { id: '2', name: 'PlayerMovement', type: 'script', occupiedBy: '3', lastUpdated: Date.now() - 1000 * 60 * 5 },
  { id: '3', name: 'Level_01', type: 'scene', occupiedBy: null, lastUpdated: Date.now() - 1000 * 60 * 120 },
  { id: '4', name: 'Enemy_Bruiser', type: 'prefab', occupiedBy: null, lastUpdated: Date.now() - 1000 * 60 * 60 * 24 },
  { id: '5', name: 'GameManager.cs', type: 'script', occupiedBy: null, lastUpdated: Date.now() - 1000 * 60 * 60 },
];

interface OccupiedState {
  /** All occupied/lockable Unity assets */
  occupiedItems: OccupiedItem[];

  // Actions — all use optimistic updates with rollback
  addOccupiedItem: (name: string, type: ItemType) => Promise<void>;
  removeOccupiedItem: (itemId: string) => Promise<void>;
  renameOccupiedItem: (itemId: string, newName: string) => Promise<void>;
  toggleOccupiedLock: (itemId: string, userId: string) => Promise<void>;

  /** @internal Bulk replace occupied items (used by initDb/realtime) */
  _setOccupiedItems: (items: OccupiedItem[]) => void;
}

export const useOccupiedStore = create<OccupiedState>((set, get) => ({
  occupiedItems: hasSupabase ? [] : MOCK_OCCUPIED,

  addOccupiedItem: async (name, type) => {
    const newItemId = `new_${Date.now()}`;
    const newItem: OccupiedItem = { id: newItemId, name, type, occupiedBy: null, lastUpdated: Date.now() };

    // Optimistic: add immediately
    set((state) => ({ occupiedItems: [...state.occupiedItems, newItem] }));

    try {
      await insertOccupiedItem(newItemId, name, type);
      logger.info(MODULE, `Added asset "${name}" (${type})`);
    } catch (err) {
      // Rollback: remove the optimistically added item
      logger.error(MODULE, `Failed to add asset "${name}", rolling back`, err);
      set((state) => ({ occupiedItems: state.occupiedItems.filter(i => i.id !== newItemId) }));
    }
  },

  removeOccupiedItem: async (itemId) => {
    const previousItems = get().occupiedItems;
    set((state) => ({ occupiedItems: state.occupiedItems.filter(i => i.id !== itemId) }));

    try {
      await deleteOccupiedItem(itemId);
      logger.info(MODULE, `Removed asset ${itemId}`);
    } catch (err) {
      logger.error(MODULE, `Failed to remove asset ${itemId}, rolling back`, err);
      set({ occupiedItems: previousItems });
    }
  },

  renameOccupiedItem: async (itemId, newName) => {
    const previousItems = get().occupiedItems;
    set((state) => ({
      occupiedItems: state.occupiedItems.map(i =>
        i.id === itemId ? { ...i, name: newName } : i
      )
    }));

    try {
      await renameOccupiedItemRepo(itemId, newName);
      logger.debug(MODULE, `Renamed asset ${itemId} to "${newName}"`);
    } catch (err) {
      logger.error(MODULE, `Failed to rename asset ${itemId}, rolling back`, err);
      set({ occupiedItems: previousItems });
    }
  },

  toggleOccupiedLock: async (itemId, userId) => {
    const state = get();
    const item = state.occupiedItems.find(i => i.id === itemId);
    if (!item) {
      logger.warn(MODULE, `Cannot toggle lock: item ${itemId} not found`);
      return;
    }

    let newOccupiedBy: string | null = null;

    if (item.occupiedBy === userId) {
      newOccupiedBy = null; // Unlock
    } else if (item.occupiedBy === null) {
      newOccupiedBy = userId; // Lock
    } else {
      logger.warn(MODULE, `Cannot toggle lock on item ${itemId}: locked by user ${item.occupiedBy}`);
      return; // Locked by someone else — cannot override
    }

    const previousItems = state.occupiedItems;

    // Optimistic: update lock status immediately
    set((s) => ({
      occupiedItems: s.occupiedItems.map(i =>
        i.id === itemId ? { ...i, occupiedBy: newOccupiedBy, lastUpdated: Date.now() } : i
      )
    }));

    try {
      await updateOccupiedLock(itemId, newOccupiedBy);
      const action = newOccupiedBy ? 'Locked' : 'Unlocked';
      logger.info(MODULE, `${action} asset ${itemId}`);
    } catch (err) {
      logger.error(MODULE, `Failed to toggle lock for asset ${itemId}, rolling back`, err);
      set({ occupiedItems: previousItems });
    }
  },

  _setOccupiedItems: (items) => set({ occupiedItems: items }),
}));
