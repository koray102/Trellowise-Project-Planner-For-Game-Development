/**
 * AnnouncementFeed — Team announcement timeline + publisher
 *
 * Displays the announcement textarea and the timeline feed.
 * Extracted from Dashboard to isolate announcement concerns.
 */
import { useState } from 'react';
import { Users } from 'lucide-react';
import type { AnnouncementItem, User } from '../../shared/types';

interface AnnouncementFeedProps {
  announcements: AnnouncementItem[];
  users: User[];
  currentUser: User;
  onPublish: (text: string) => void;
}

/** Simple relative time formatter */
function formatRelativeTime(createdAt: number): string {
  const diffMins = Math.floor((Date.now() - createdAt) / 60000);
  if (diffMins > 60 * 24) return `${Math.floor(diffMins / (60 * 24))}d ago`;
  if (diffMins > 60) return `${Math.floor(diffMins / 60)}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return 'Just now';
}

export function AnnouncementFeed({ announcements, users, currentUser, onPublish }: AnnouncementFeedProps) {
  const [annText, setAnnText] = useState('');

  const handlePublish = () => {
    if (annText.trim()) {
      onPublish(annText.trim());
      setAnnText('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Publisher */}
      <div className="bg-zinc-900/40 rounded-xl border border-zinc-800/80 p-4">
        <div className="flex gap-3">
          <img src={currentUser.avatar} className="w-8 h-8 rounded-full bg-zinc-800 shrink-0" alt="" />
          <div className="flex-1 flex flex-col gap-2">
            <textarea
              value={annText}
              onChange={e => setAnnText(e.target.value)}
              placeholder="Share an update with the team..."
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-indigo-500/50 h-16"
            />
            <div className="flex justify-end">
              <button
                onClick={handlePublish}
                disabled={!annText.trim()}
                className="px-4 py-1.5 text-xs font-medium bg-indigo-500 text-white rounded-md hover:bg-indigo-600 disabled:opacity-50 transition-colors"
              >
                Announce
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-gradient-to-br from-indigo-500/10 to-transparent rounded-xl border border-indigo-500/20 overflow-hidden h-full min-h-[300px] flex flex-col">
        <div className="px-6 py-5 border-b border-indigo-500/10 bg-indigo-500/5 shrink-0">
          <h2 className="font-semibold text-indigo-400 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Announcements
          </h2>
        </div>
        <div className="p-6 flex-1 text-sm space-y-6 overflow-y-auto custom-scrollbar max-h-[480px] pr-4">
          {announcements.map((ann, i) => {
            const author = users.find(u => u.id === ann.userId);
            const isLast = i === announcements.length - 1;
            const timeStr = formatRelativeTime(ann.createdAt);

            return (
              <div key={ann.id} className={`relative pl-4 ${isLast ? 'pb-0' : 'pb-2 border-l-2 border-indigo-500/30'}`}>
                <div className={`absolute w-2 h-2 rounded-full ${i === 0 ? 'bg-indigo-500 ring-4 ring-zinc-950' : 'bg-indigo-500/50 ring-4 ring-zinc-950'} -left-[5px] top-1.5`} />
                <p className="text-zinc-200">{ann.text}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                  {author && <img src={author.avatar} className="w-4 h-4 rounded-full" alt="" />}
                  {author?.name.split(' ')[0]} • {timeStr}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
