import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useStore } from '../store';
import { Bell, X } from 'lucide-react';
import { playNotificationSound } from '../lib/notificationSound';

const LS_READ_ANNOUNCEMENTS_KEY = 'gds-read-announcements';

/** Get the set of announcement IDs that the user has already dismissed */
function getReadAnnouncementIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_READ_ANNOUNCEMENTS_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* noop */ }
  return new Set();
}

/** Persist dismissed announcement IDs to localStorage */
function saveReadAnnouncementIds(ids: Set<string>) {
  try {
    localStorage.setItem(LS_READ_ANNOUNCEMENTS_KEY, JSON.stringify([...ids]));
  } catch { /* noop */ }
}

export function Layout({ children }: { children: ReactNode }) {
  const { announcements, currentUser, users } = useStore();

  // Track which announcements are shown in the notification banner
  const [unreadAnnouncements, setUnreadAnnouncements] = useState<any[]>([]);

  // Persistent read IDs from localStorage
  const readIdsRef = useRef<Set<string>>(getReadAnnouncementIds());

  // Track IDs we've already "processed" during this session (to detect new real-time ones)
  const processedIdsRef = useRef<Set<string>>(new Set());

  // Flag: has the initial load been done?
  const initialLoadDone = useRef(false);

  // --- On mount: find offline/missed announcements ---
  useEffect(() => {
    if (initialLoadDone.current) return;
    if (announcements.length === 0) return; // wait for data

    initialLoadDone.current = true;

    const readIds = readIdsRef.current;

    // Mark all current announcements as "processed" so we don't replay them as real-time
    announcements.forEach(a => processedIdsRef.current.add(a.id));

    // Find announcements the user hasn't dismissed yet (excluding own announcements)
    const missed = announcements.filter(a =>
      !readIds.has(a.id) &&
      a.userId !== currentUser?.id
    );

    if (missed.length > 0) {
      setUnreadAnnouncements(missed);
    }
  }, [announcements, currentUser?.id]);

  // --- Watch for NEW real-time announcements (after initial load) ---
  useEffect(() => {
    if (!initialLoadDone.current) return;

    const newItems = announcements.filter(a =>
      !processedIdsRef.current.has(a.id) &&
      a.userId !== currentUser?.id
    );

    if (newItems.length > 0) {
      // Mark as processed
      newItems.forEach(a => processedIdsRef.current.add(a.id));

      // Add to unread list
      setUnreadAnnouncements(prev => {
        const combined = [...prev, ...newItems];
        return Array.from(new Map(combined.map(item => [item.id, item])).values());
      });

      // Play notification sound for real-time announcements
      playNotificationSound();
    }
  }, [announcements, currentUser?.id]);

  // --- Dismiss handler: mark all shown as read ---
  const handleDismiss = () => {
    // Add all currently shown unread announcement IDs to the read set
    unreadAnnouncements.forEach(a => readIdsRef.current.add(a.id));
    saveReadAnnouncementIds(readIdsRef.current);
    setUnreadAnnouncements([]);
  };

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden text-slate-200 relative">
      <Sidebar />

      {/* Announcement Notification Center - Global */}
      {unreadAnnouncements.length > 0 && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-full max-w-3xl px-4 pointer-events-none">
          <div className="bg-zinc-900/95 backdrop-blur-md border border-indigo-500/40 rounded-2xl shadow-[0_0_50px_-12px_rgba(99,102,241,0.3)] overflow-hidden flex flex-col max-h-[300px] pointer-events-auto">
            <div className="px-5 py-3.5 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest">
                <Bell className="w-4 h-4 fill-indigo-500/20" />
                New Team Updates ({unreadAnnouncements.length})
              </div>
              <button
                onClick={handleDismiss}
                className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto custom-scrollbar p-6 space-y-5">
              {[...unreadAnnouncements].reverse().map((ann) => {
                const author = users.find(u => u.id === ann.userId);
                return (
                  <div key={ann.id} className="group relative pl-4 border-l-2 border-indigo-500/50">
                    <p className="text-base text-zinc-200 leading-relaxed font-medium">{ann.text}</p>
                    <div className="mt-2 text-xs flex items-center gap-2 text-zinc-500 font-medium">
                      {author && <img src={author.avatar} className="w-5 h-5 rounded-full bg-zinc-800" alt="" />}
                      <span className="text-zinc-400">{author?.name}</span>
                      <span>•</span>
                      <span>Just now</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-zinc-900/50">
        {children}
      </main>
    </div>
  );
}
