/**
 * Modal — Reusable modal overlay component
 *
 * Provides a consistent backdrop (blur + dark overlay) and centered
 * content panel used across the application (Tasks add, Calendar add/detail,
 * Dashboard settings).
 *
 * @example
 *   <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
 *     <Modal.Title>Create Task</Modal.Title>
 *     <div>...content...</div>
 *   </Modal>
 */
import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback fired when the backdrop is clicked or Escape is pressed */
  onClose: () => void;
  /** Modal content */
  children: ReactNode;
  /** Max width class (default: 'max-w-md') */
  maxWidth?: string;
}

export function Modal({ isOpen, onClose, children, maxWidth = 'max-w-md' }: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        // Close when clicking the backdrop (not the content)
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl w-full ${maxWidth}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/** Optional title sub-component for consistent modal headers */
function ModalTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-lg font-semibold text-zinc-100">{children}</h3>
  );
}

Modal.Title = ModalTitle;
