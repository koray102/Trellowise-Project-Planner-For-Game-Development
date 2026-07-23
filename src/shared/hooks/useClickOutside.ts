/**
 * useClickOutside — Custom hook to detect clicks outside a referenced element
 *
 * Replaces the manually duplicated "handleClickOutside" pattern found in
 * Dashboard.tsx, Tasks.tsx, and Occupieds.tsx.
 *
 * @param ref       - React ref pointing to the container element
 * @param onClose   - Callback fired when a click outside the ref is detected
 * @param isActive  - Whether the listener is currently active (e.g. menu is open)
 *
 * @example
 *   const menuRef = useRef<HTMLDivElement>(null);
 *   const [isOpen, setIsOpen] = useState(false);
 *   useClickOutside(menuRef, () => setIsOpen(false), isOpen);
 */
import { useEffect, type RefObject } from 'react';

export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
  isActive: boolean
): void {
  useEffect(() => {
    if (!isActive) return;

    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }

    // Use 'mousedown' to close before the click completes,
    // matching the existing behavior across the app
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref, onClose, isActive]);
}
