/**
 * Occupied Item Domain Types
 *
 * Defines the shape of data for the Conflict Prevention Engine.
 * Occupied items represent Unity assets (Scenes, Scripts, Prefabs)
 * that can be locked by team members to prevent Git merge conflicts.
 */

/** Categories of Unity assets that can be locked */
export type ItemType = 'scene' | 'script' | 'prefab';

/** Represents a Unity asset that can be locked/unlocked by team members */
export interface OccupiedItem {
  id: string;
  projectId: string;
  /** Name of the asset (e.g. 'MainMenu', 'PlayerController.cs') */
  name: string;
  /** Category of the asset */
  type: ItemType;
  /** User ID of the person who locked this item, or null if free */
  occupiedBy: string | null;
  /** Timestamp (ms) of when the lock status was last changed */
  lastUpdated: number;
}
