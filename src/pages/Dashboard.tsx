/**
 * Dashboard — Main overview page
 *
 * Composed of extracted sub-components:
 * - StatsCards: Quick metrics row
 * - AnnouncementFeed: Publisher + timeline
 * - UserSettingsModal: Profile/role editor
 */
import { useState } from 'react';
import { useUserStore } from '../stores/useUserStore';
import { useTaskStore } from '../stores/useTaskStore';
import { useOccupiedStore } from '../stores/useOccupiedStore';
import { useAnnouncementStore } from '../stores/useAnnouncementStore';
import { Link } from 'react-router-dom';
import { Users, CheckCircle2, Settings, LogOut } from 'lucide-react';
import { UserAvatar } from '../shared/components';
import { StatsCards } from '../features/dashboard/StatsCards';
import { AnnouncementFeed } from '../features/dashboard/AnnouncementFeed';
import { UserSettingsModal } from '../features/dashboard/UserSettingsModal';

export function Dashboard() {
  const users = useUserStore((s) => s.users);
  const currentUser = useUserStore((s) => s.currentUser);
  const updateUserProfile = useUserStore((s) => s.updateUserProfile);
  const availableRoles = useUserStore((s) => s.availableRoles);
  const addAvailableRole = useUserStore((s) => s.addAvailableRole);
  const setCurrentUser = useUserStore((s) => s.setCurrentUser);
  const logoutUser = useUserStore((s) => s.logoutUser);
  const tasks = useTaskStore((s) => s.tasks);
  const occupiedItems = useOccupiedStore((s) => s.occupiedItems);
  const announcements = useAnnouncementStore((s) => s.announcements);
  const addAnnouncement = useAnnouncementStore((s) => s.addAnnouncement);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [switchToast, setSwitchToast] = useState<{ from: string; to: string } | null>(null);

  const handleSwitchUser = (userId: string) => {
    const fromName = currentUser?.name || 'Unknown';
    const toUser = users.find(u => u.id === userId);
    if (!toUser || toUser.id === currentUser?.id) return;

    setCurrentUser(userId);
    setSwitchToast({ from: fromName, to: toUser.name });
    setTimeout(() => setSwitchToast(null), 3000);
  };

  const myTasks = tasks.filter(t => t.assignedTo === currentUser?.id && t.status !== 'done');
  const myLocks = occupiedItems.filter(i => i.occupiedBy === currentUser?.id);
  const onlineUsers = users.filter(u => u.status === 'online');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8 relative">

      {/* User Switch Toast */}
      {switchToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] pointer-events-none">
          <div className="bg-zinc-900/95 backdrop-blur-sm border border-indigo-500/30 text-zinc-200 px-5 py-2.5 rounded-full shadow-2xl text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              Switched from <b className="text-white">{switchToast.from}</b> to <b className="text-indigo-400">{switchToast.to}</b>
            </span>
          </div>
        </div>
      )}

      {/* Welcome & Overview */}
      <div className="flex flex-col md:flex-row gap-6 md:items-end justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Welcome back, {currentUser?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-zinc-400">Here's what's happening in GameDev Sync today.</p>
        </div>

        {/* Top-Right Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Online Profiles */}
          <div className="flex items-center gap-4 bg-zinc-900/80 p-4 rounded-xl border border-zinc-800/80 shadow-sm">
            <div className="flex -space-x-3">
              {onlineUsers.map(user => (
                <UserAvatar key={user.id} user={user} size="lg" showStatus className="ring-2 ring-zinc-900" />
              ))}
            </div>
            <div className="pl-4 border-l border-zinc-800">
              <div className="text-sm font-medium text-emerald-400">{onlineUsers.length} Online</div>
              <div className="text-xs text-zinc-500">Team Status</div>
            </div>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shadow-sm"
            title="User Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          <button
            onClick={logoutUser}
            className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-colors shadow-sm"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">

        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <StatsCards
            activeTasks={myTasks.length}
            locksHeld={myLocks.length}
            totalDone={tasks.filter(t => t.status === 'done').length}
          />

          {/* My Tasks Panel */}
          <div className="bg-zinc-900/40 rounded-xl border border-zinc-800/80 overflow-hidden">
            <div className="border-b border-zinc-800/80 px-6 py-4 flex justify-between items-center bg-zinc-900/60">
              <h2 className="font-semibold text-zinc-100 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                My Active Tasks
              </h2>
              <Link to="/tasks" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">View Board &rarr;</Link>
            </div>
            <div className="flex flex-col divide-y divide-zinc-800/50 bg-zinc-950/30">
              {myTasks.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-sm">You have no pending tasks.</div>
              ) : (
                myTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3">
                    <span className="text-sm text-zinc-300 font-medium">{task.title}</span>
                    <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 bg-zinc-800/80 rounded text-zinc-500">
                      {task.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          {currentUser && (
            <AnnouncementFeed
              announcements={announcements}
              users={users}
              currentUser={currentUser}
              onPublish={(text) => addAnnouncement(text, currentUser.id)}
            />
          )}
        </div>
      </div>

      {/* User Settings Modal */}
      {currentUser && (
        <UserSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          currentUser={currentUser}
          users={users}
          availableRoles={availableRoles}
          onSave={updateUserProfile}
          onSwitchUser={handleSwitchUser}
          onAddRole={addAvailableRole}
        />
      )}

    </div>
  );
}
