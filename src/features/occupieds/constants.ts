/**
 * Occupieds feature constants — Shared type/column definitions
 *
 * Used by OccupiedItemCard and the main Occupieds page.
 */
import { Box, FileCode2, FileJson } from 'lucide-react';
import type { ItemType } from '../../shared/types';

/** Icon for each occupied item type */
export const TYPE_ICONS: Record<ItemType, React.ElementType> = {
  scene: Box,
  script: FileCode2,
  prefab: FileJson,
};

/** Color classes for each type */
export const TYPE_COLORS: Record<ItemType, string> = {
  scene: 'text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/20',
  script: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  prefab: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
};

/** Display labels for each type */
export const TYPE_LABELS: Record<ItemType, string> = {
  scene: 'Scenes',
  script: 'Scripts',
  prefab: 'Prefabs'
};

/** Default column order */
export const COLUMNS: ItemType[] = ['scene', 'prefab', 'script'];

/** Global event name for toast notifications */
export const TOAST_EVENT = 'gds-toast';

/** Dispatch a toast notification */
export function pushToast(message: string) {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: message }));
}

/** Safe wrapper for formatDistanceToNow */
export function safeFormatDistance(timestamp: number): string {
  try {
    if (!timestamp || isNaN(timestamp)) return 'unknown';
    // Inline to avoid importing date-fns in constants file
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return 'unknown';
  }
}

/**
 * Normalizes a string for fuzzy matching.
 * e.g., "Main_ meNu" -> "mainmenu"
 */
export function normalizeString(str: string): string {
  return str.toLowerCase().replace(/[\s_.,-]/g, '');
}
