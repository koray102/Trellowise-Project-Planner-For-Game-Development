import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { Link } from 'react-router-dom';
import { Users, ShieldAlert, KanbanSquare, Activity, CheckCircle2, Settings, X, Plus, LogOut, ChevronDown, Bell } from 'lucide-react';

export function Dashboard() {
  const { users, currentUser, tasks, occupiedItems, updateUserProfile, availableRoles, addAvailableRole, announcements, addAnnouncement, setCurrentUser, logoutUser } = useStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [newRole, setNewRole] = useState('');
  const [annText, setAnnText] = useState('');
  const [switchToast, setSwitchToast] = useState<{ from: string; to: string } | null>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Announcement Notification State
  const [unreadAnnouncements, setUnreadAnnouncements] = useState<any[]>([]);
  const sessionStartTime = useRef(Date.now());
  const seenIds = useRef<Set<string>>(new Set());

  // Initialize seenIds with current announcements so we don't notify on existing ones
  useEffect(() => {
    announcements.forEach(a => seenIds.current.add(a.id));
  }, []);

  // Watch for new announcements
  useEffect(() => {
    const newItems = announcements.filter(a => 
      !seenIds.current.has(a.id) && 
      a.userId !== currentUser?.id &&
      a.createdAt > sessionStartTime.current
    );

    if (newItems.length > 0) {
      setUnreadAnnouncements(prev => {
        const combined = [...prev, ...newItems];
        // Unique filter
        return Array.from(new Map(combined.map(item => [item.id, item])).values());
      });
      newItems.forEach(a => seenIds.current.add(a.id));
    }
  }, [announcements, currentUser?.id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    }
    if (isProfileDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileDropdownOpen]);

  const openSettings = () => {
    if (!currentUser) return;
    setEditName(currentUser.name);
    setEditAvatar(currentUser.avatar);
    setEditRoles(currentUser.roles || []);
    setNewRole('');
    setIsSettingsOpen(true);
  };

  const saveSettings = () => {
    if (!currentUser) return;
    updateUserProfile(currentUser.id, {
      name: editName,
      avatar: editAvatar,
      roles: editRoles
    });
    setIsSettingsOpen(false);
  };

  const toggleRole = (role: string) => {
    setEditRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleAddRole = () => {
    if (newRole.trim() && currentUser?.isAdmin) {
      addAvailableRole(newRole.trim());
      setEditRoles(prev => [...new Set([...prev, newRole.trim()])]);
      setNewRole('');
    }
  };

  const handleSwitchUser = (userId: string) => {
    const fromName = currentUser?.name || 'Unknown';
    const toUser = users.find(u => u.id === userId);
    if (!toUser || toUser.id === currentUser?.id) return;

    setCurrentUser(userId);
    setIsProfileDropdownOpen(false);
    setIsSettingsOpen(false);

    // Show switch toast
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
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
          <div className="bg-zinc-900/95 backdrop-blur-sm border border-indigo-500/30 text-zinc-200 px-5 py-2.5 rounded-full shadow-2xl text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              Switched from <b className="text-white">{switchToast.from}</b> to <b className="text-indigo-400">{switchToast.to}</b>
            </span>
          </div>
        </div>
      )}

      {/* Announcement Notification Center */}
      {unreadAnnouncements.length > 0 && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] w-full max-w-sm px-4">
          <div className="bg-zinc-900/95 backdrop-blur-md border border-indigo-500/40 rounded-2xl shadow-[0_0_50px_-12px_rgba(99,102,241,0.3)] overflow-hidden flex flex-col max-h-[300px]">
            <div className="px-4 py-3 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest">
                  <Bell className="w-3.5 h-3.5 fill-indigo-500/20" />
                  New Updates ({unreadAnnouncements.length})
               </div>
               <button 
                 onClick={() => setUnreadAnnouncements([])}
                 className="p-1 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-white transition-colors"
               >
                 <X className="w-4 h-4" />
               </button>
            </div>
            <div className="overflow-y-auto custom-scrollbar p-4 space-y-4">
               {[...unreadAnnouncements].reverse().map((ann) => {
                 const author = users.find(u => u.id === ann.userId);
                 return (
                   <div key={ann.id} className="group relative pl-3 border-l-2 border-indigo-500/50">
                      <p className="text-sm text-zinc-200 leading-relaxed">{ann.text}</p>
                      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-zinc-500 font-medium">
                        {author && <img src={author.avatar} className="w-4 h-4 rounded-full bg-zinc-800" alt="" />}
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

      {/* Welcome & Overview */}
      <div className="flex flex-col md:flex-row gap-6 md:items-end justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Welcome back, {currentUser?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-zinc-400">Here's what's happening in GameDev Sync today.</p>
        </div>

        {/* Top-Right Actions: Online Profiles → Settings → Logout */}
        <div className="flex items-center gap-3 shrink-0">

          {/* Online Profiles */}
          <div className="flex items-center gap-4 bg-zinc-900/80 p-4 rounded-xl border border-zinc-800/80 shadow-sm">
            <div className="flex -space-x-3">
              {onlineUsers.map(user => (
                <div key={user.id} className="relative group">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    title={user.name}
                    className="w-10 h-10 rounded-full bg-zinc-800 ring-2 ring-zinc-900 group-hover:z-10 relative transition-transform"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-900 z-20 bg-emerald-500" />
                </div>
              ))}
            </div>
            <div className="pl-4 border-l border-zinc-800">
              <div className="text-sm font-medium text-emerald-400">{onlineUsers.length} Online</div>
              <div className="text-xs text-zinc-500">Team Status</div>
            </div>
          </div>

          {/* Settings Button */}
          <button
            onClick={openSettings}
            className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shadow-sm"
            title="User Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Logout Button */}
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

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-950/50 p-5 rounded-xl border border-zinc-800/60 flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <KanbanSquare className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{myTasks.length}</div>
                <div className="text-xs text-zinc-500 font-medium tracking-wide uppercase">Active Tasks</div>
              </div>
            </div>

            <div className="bg-zinc-950/50 p-5 rounded-xl border border-zinc-800/60 flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{myLocks.length}</div>
                <div className="text-xs text-zinc-500 font-medium tracking-wide uppercase">Locks Held</div>
              </div>
            </div>

            <div className="bg-zinc-950/50 p-5 rounded-xl border border-zinc-800/60 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{tasks.filter(t => t.status === 'done').length}</div>
                <div className="text-xs text-zinc-500 font-medium tracking-wide uppercase">Total Done</div>
              </div>
            </div>
          </div>

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

          {/* Announcements/Feed */}
          <div className="space-y-4">

            {/* Publisher */}
            <div className="bg-zinc-900/40 rounded-xl border border-zinc-800/80 p-4">
              <div className="flex gap-3">
                <img src={currentUser?.avatar} className="w-8 h-8 rounded-full bg-zinc-800 shrink-0" alt="" />
                <div className="flex-1 flex flex-col gap-2">
                  <textarea
                    value={annText}
                    onChange={e => setAnnText(e.target.value)}
                    placeholder="Share an update with the team..."
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-indigo-500/50 h-16"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        if (annText.trim() && currentUser) {
                          addAnnouncement(annText.trim(), currentUser.id);
                          setAnnText('');
                        }
                      }}
                      disabled={!annText.trim()}
                      className="px-4 py-1.5 text-xs font-medium bg-indigo-500 text-white rounded-md hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                    >
                      Announce
                    </button>
                  </div>
                </div>
              </div>
            </div>

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
                  // Simple relative time format
                  const diffMins = Math.floor((Date.now() - ann.createdAt) / 60000);
                  let timeStr = 'Just now';
                  if (diffMins > 60 * 24) timeStr = `${Math.floor(diffMins / (60 * 24))}d ago`;
                  else if (diffMins > 60) timeStr = `${Math.floor(diffMins / 60)}h ago`;
                  else if (diffMins > 0) timeStr = `${diffMins}m ago`;

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

        </div>
      </div>

      {/* User Settings Modal */}
      {isSettingsOpen && currentUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center shrink-0 mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                User Settings
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="p-1 text-zinc-500 hover:text-white rounded-md hover:bg-zinc-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 overflow-y-auto custom-scrollbar flex-1 pr-2">

              {/* Profile Switcher */}
              <div className="pb-4 border-b border-zinc-800">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Active Profile</label>
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 bg-zinc-900 border border-zinc-700/50 rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-full bg-zinc-800" />
                      <div className="text-left">
                        <div className="text-sm font-medium text-white">{currentUser.name}</div>
                        {currentUser.roles && currentUser.roles.length > 0 && (
                          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{currentUser.roles.join(' · ')}</div>
                        )}
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isProfileDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700/50 rounded-lg shadow-xl z-10 overflow-hidden">
                      {users.map(user => (
                        <button
                          key={user.id}
                          onClick={() => handleSwitchUser(user.id)}
                          disabled={user.id === currentUser.id}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${user.id === currentUser.id
                            ? 'bg-indigo-500/10 text-indigo-400 cursor-default'
                            : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                            }`}
                        >
                          <div className="relative shrink-0">
                            <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full bg-zinc-800" />
                            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 ${user.status === 'online' ? 'bg-emerald-500' :
                              user.status === 'away' ? 'bg-amber-500' : 'bg-zinc-500'
                              }`} />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{user.name}</div>
                            {user.roles && user.roles.length > 0 && (
                              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{user.roles.join(' · ')}</div>
                            )}
                          </div>
                          {user.id === currentUser.id && (
                            <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-bold uppercase">Current</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                />
              </div>

              {/* Avatar */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Avatar URL</label>
                <div className="flex gap-3">
                  <img src={editAvatar} alt="preview" className="w-10 h-10 rounded-lg bg-zinc-800 object-cover border border-zinc-700/50" onError={(e) => { e.currentTarget.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fallback' }} />
                  <input
                    type="text"
                    value={editAvatar}
                    onChange={e => setEditAvatar(e.target.value)}
                    className="flex-1 min-w-0 bg-zinc-900 border border-zinc-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Roles */}
              <div className="pt-2 border-t border-zinc-800">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Team Roles</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {availableRoles.map(role => {
                    const isSelected = editRoles.includes(role);
                    return (
                      <button
                        key={role}
                        onClick={() => toggleRole(role)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors border ${isSelected
                          ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/20'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200'
                          }`}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>

                {/* Admin Role Creation */}
                {currentUser.isAdmin && (
                  <div className="mt-4 p-3 bg-zinc-900/50 border border-zinc-800/80 rounded-lg">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-500/80 mb-2">Admin: Add New Role</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="New role name..."
                        value={newRole}
                        onChange={e => setNewRole(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddRole()}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
                      />
                      <button
                        onClick={handleAddRole}
                        disabled={!newRole.trim()}
                        className="px-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded hover:bg-amber-500/20 disabled:opacity-50 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-800 flex justify-end shrink-0 gap-3">
              <button onClick={() => setIsSettingsOpen(false)} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={saveSettings} className="px-6 py-2 text-sm font-medium bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors shadow-sm">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
