/**
 * UserSettingsModal — Profile editor modal
 *
 * Handles profile switching, name/avatar editing, and role management.
 * Extracted from Dashboard to isolate the settings concern.
 */
import { useState, useRef, useCallback } from 'react';
import { Settings, X, Plus, ChevronDown } from 'lucide-react';
import { useClickOutside } from '../../shared/hooks/useClickOutside';
import { UserAvatar } from '../../shared/components';
import { Modal } from '../../shared/components';
import type { User } from '../../shared/types';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  users: User[];
  availableRoles: string[];
  onSave: (userId: string, updates: Partial<User>) => void;
  onSwitchUser: (userId: string) => void;
  onAddRole: (roleName: string) => void;
}

export function UserSettingsModal({
  isOpen,
  onClose,
  currentUser,
  users,
  availableRoles,
  onSave,
  onSwitchUser,
  onAddRole,
}: UserSettingsModalProps) {
  const [editName, setEditName] = useState(currentUser.name);
  const [editAvatar, setEditAvatar] = useState(currentUser.avatar);
  const [editRoles, setEditRoles] = useState<string[]>(currentUser.roles || []);
  const [newRole, setNewRole] = useState('');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const closeDropdown = useCallback(() => setIsProfileDropdownOpen(false), []);
  useClickOutside(profileDropdownRef, closeDropdown, isProfileDropdownOpen);

  // Reset form when modal opens with fresh data
  const handleOpen = () => {
    setEditName(currentUser.name);
    setEditAvatar(currentUser.avatar);
    setEditRoles(currentUser.roles || []);
    setNewRole('');
  };

  // Keep form in sync when the modal opens
  if (isOpen && editName === '' && currentUser.name !== '') {
    handleOpen();
  }

  const handleSave = () => {
    onSave(currentUser.id, { name: editName, avatar: editAvatar, roles: editRoles });
    onClose();
  };

  const toggleRole = (role: string) => {
    setEditRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleAddRole = () => {
    if (newRole.trim() && currentUser.isAdmin) {
      onAddRole(newRole.trim());
      setEditRoles(prev => [...new Set([...prev, newRole.trim()])]);
      setNewRole('');
    }
  };

  const handleSwitchUser = (userId: string) => {
    if (userId === currentUser.id) return;
    onSwitchUser(userId);
    setIsProfileDropdownOpen(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center shrink-0 mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            User Settings
          </h3>
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-white rounded-md hover:bg-zinc-800 transition-colors">
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
                      <UserAvatar user={user} size="sm" showStatus />
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
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-6 py-2 text-sm font-medium bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors shadow-sm">
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
}
