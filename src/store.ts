import { create } from 'zustand';
import { supabase, hasSupabase } from './lib/supabase';

// Types
export type UserStatus = 'online' | 'offline' | 'away';
export type ItemType = 'scene' | 'script' | 'prefab';
export type TaskStatusType = 'todo' | 'progress' | 'done' | 'debt';

export interface User {
  id: string;
  name: string;
  avatar: string;
  status: UserStatus;
  roles: string[];
  isAdmin: boolean;
}

export interface OccupiedItem {
  id: string;
  name: string;
  type: ItemType;
  occupiedBy: string | null; // User ID or null if free
  lastUpdated: number;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  assignedTo: string; // User ID
  status: TaskStatusType;
  sort_order: number;
}

export type EventType = 'milestone' | 'meeting' | 'deadline';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: number; // Unix timestamp
  type: EventType;
}

export interface AnnouncementItem {
  id: string;
  text: string;
  userId: string;
  createdAt: number;
}

export interface GDSState {
  users: User[];
  currentUser: User | null;
  occupiedItems: OccupiedItem[];
  tasks: TaskItem[];
  events: CalendarEvent[];
  announcements: AnnouncementItem[];
  availableRoles: string[];
  dbReady: boolean;
  isAuthenticated: boolean;
  sitePassword: string | null;
  
  // Actions
  initDb: () => Promise<void>;
  loginWithPassword: (password: string) => boolean;
  setCurrentUser: (userId: string) => void;
  logoutUser: () => void;
  updateUserStatus: (userId: string, status: UserStatus) => void;
  updateUserProfile: (userId: string, updates: Partial<User>) => Promise<void>;
  addAvailableRole: (roleName: string) => Promise<void>;
  addOccupiedItem: (name: string, type: ItemType) => Promise<void>;
  removeOccupiedItem: (itemId: string) => Promise<void>;
  renameOccupiedItem: (itemId: string, newName: string) => Promise<void>;
  toggleOccupiedLock: (itemId: string, userId: string) => Promise<void>;
  addTask: (title: string, description: string, assignedTo: string, status: TaskStatusType) => Promise<void>;
  removeTask: (taskId: string) => Promise<void>;
  renameTask: (taskId: string, newTitle: string) => Promise<void>;
  updateTaskDescription: (taskId: string, newDescription: string) => Promise<void>;
  reassignTask: (taskId: string, newAssignee: string) => Promise<void>;
  moveTask: (taskId: string, newStatus: TaskStatusType) => Promise<void>;
  reorderTasks: (reorderedIds: string[], status: TaskStatusType) => Promise<void>;
  addEvent: (title: string, description: string, date: Date, type: EventType) => Promise<void>;
  addAnnouncement: (text: string, userId: string) => Promise<void>;
}

// Initial Mock Users (4-person Unity Team)
const MOCK_USERS: User[] = [
  { id: '1', name: 'Koray', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Koray', status: 'online', roles: ['Lead'], isAdmin: true },
  { id: '2', name: 'Sam', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam', status: 'online', roles: ['Art'], isAdmin: false },
  { id: '3', name: 'Jordan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan', status: 'away', roles: ['Code'], isAdmin: false },
  { id: '4', name: 'Alex', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', status: 'offline', roles: ['Design'], isAdmin: false },
];

const MOCK_AVAILABLE_ROLES = ['Lead', 'Art', 'Code', 'Design', 'QA', 'Audio', 'Producer'];

const LS_USER_KEY = 'gds-current-user';

function getSavedUserId(): string | null {
  try { return localStorage.getItem(LS_USER_KEY); } catch { return null; }
}

function saveUserId(userId: string) {
  try { localStorage.setItem(LS_USER_KEY, userId); } catch { /* noop */ }
}

const MOCK_OCCUPIED: OccupiedItem[] = [
  { id: '1', name: 'MainMenu', type: 'scene', occupiedBy: '1', lastUpdated: Date.now() - 1000 * 60 * 30 },
  { id: '2', name: 'PlayerMovement', type: 'script', occupiedBy: '3', lastUpdated: Date.now() - 1000 * 60 * 5 },
  { id: '3', name: 'Level_01', type: 'scene', occupiedBy: null, lastUpdated: Date.now() - 1000 * 60 * 120 },
  { id: '4', name: 'Enemy_Bruiser', type: 'prefab', occupiedBy: null, lastUpdated: Date.now() - 1000 * 60 * 60 * 24 },
  { id: '5', name: 'GameManager.cs', type: 'script', occupiedBy: null, lastUpdated: Date.now() - 1000 * 60 * 60 },
];

const MOCK_TASKS: TaskItem[] = [
  { id: 't1', title: 'Fix jumping physics bug', description: 'Player occasionally double jumps when hitting a slope.', assignedTo: '3', status: 'progress', sort_order: 0 },
  { id: 't2', title: 'Design Level 2 layout', description: 'Focus on verticality and adding new enemy types.', assignedTo: '4', status: 'todo', sort_order: 0 },
  { id: 't3', title: 'Create main character animations', description: 'Attack, Dash, and Idle loops.', assignedTo: '2', status: 'progress', sort_order: 1 },
  { id: 't4', title: 'Implement audio manager', description: 'Add support for spatial 3D audio in Unity.', assignedTo: '1', status: 'done', sort_order: 0 },
  { id: 't5', title: 'Refactor UI code (Technical Debt)', description: 'Move from old canvas system to UI Toolkit.', assignedTo: '1', status: 'debt', sort_order: 0 },
];

const MOCK_EVENTS: CalendarEvent[] = [
  { id: 'e1', title: 'Sprint Planning', description: 'Kickoff meeting for the next 2 weeks.', date: new Date().getTime(), type: 'meeting' },
  { id: 'e2', title: 'Level 1 Alpha Lock', description: 'All core assets must be finished for L1.', date: new Date(new Date().setDate(new Date().getDate() + 4)).getTime(), type: 'deadline' },
  { id: 'e3', title: 'Audio Review', description: 'Reviewing the ambient noises in Sector 4.', date: new Date(new Date().setDate(new Date().getDate() + 2)).getTime(), type: 'meeting' },
  { id: 'e4', title: 'Pre-production wrap', description: 'Final meeting before alpha coding phase begins.', date: new Date(new Date().setDate(new Date().getDate() - 5)).getTime(), type: 'milestone' },
  { id: 'e5', title: 'Marketing sync', description: 'Discussing trailer assets.', date: new Date(new Date().setDate(new Date().getDate() - 1)).getTime(), type: 'meeting' },
  { id: 'e6', title: 'Beta Branch Cut', date: new Date(new Date().setDate(new Date().getDate() + 8)).getTime(), type: 'deadline' },
];

const MOCK_ANNOUNCEMENTS: AnnouncementItem[] = [
  { id: 'a1', text: 'New Unity Package added to repo.', userId: '4', createdAt: Date.now() - 1000 * 60 * 60 * 2 },
  { id: 'a2', text: 'Main menu scene unlocked. Feel free to tweak UI.', userId: '3', createdAt: Date.now() - 1000 * 60 * 60 * 24 },
];

// Restore currentUser from localStorage if possible, otherwise null (forces profile select)
const savedId = getSavedUserId();
// When Supabase is active, start with empty state to avoid flash of mock data.
// Mock data is only used as fallback when Supabase is not configured.
const initialUsers = hasSupabase ? [] : MOCK_USERS;
const restoredUser = hasSupabase
  ? null // will be restored in initDb after fetching real users
  : (savedId ? MOCK_USERS.find(u => u.id === savedId) ?? null : null);

export const useStore = create<GDSState>((set, get) => ({
  users: initialUsers,
  currentUser: restoredUser,
  occupiedItems: hasSupabase ? [] : MOCK_OCCUPIED,
  tasks: hasSupabase ? [] : MOCK_TASKS,
  events: hasSupabase ? [] : MOCK_EVENTS,
  announcements: hasSupabase ? [] : MOCK_ANNOUNCEMENTS,
  availableRoles: hasSupabase ? [] : MOCK_AVAILABLE_ROLES,
  dbReady: !hasSupabase, // true immediately if no Supabase (mock data ready), false if waiting for fetch
  isAuthenticated: false, // will be confirmed in initDb
  sitePassword: null,

  initDb: async () => {
    if (!hasSupabase || !supabase) {
      console.warn("Supabase credentials not found. Utilizing local mock data for GDS.");
      set({ dbReady: true });
      return;
    }

    try {
      // Local variable to store real-time presence explicitly to avoid DB overwrite
      let currentOnlineIds = new Set<string>();
      let isPresenceSubscribed = false;

      // Create presence channel
      const presenceChannel = supabase.channel('online-users', {
        config: { presence: { key: '' } } // individual keys will be set per user
      });

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          // Extract userId from the metadata of all presence instances
          currentOnlineIds = new Set(
            Object.values(state)
              .flat()
              .map((p: any) => p.userId)
              .filter(Boolean)
          );
          
          set((s) => ({
            users: s.users.map(u => ({
              ...u,
              status: currentOnlineIds.has(u.id) ? 'online' : 'offline'
            }))
          }));
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            isPresenceSubscribed = true;
            const currentU = get().currentUser;
            if (currentU) {
              await presenceChannel.track({ userId: currentU.id, online_at: new Date().toISOString() });
            }
          }
        });

      // Fetch initial data
      const [usersRes, itemsRes, tasksRes, eventsRes, annRes, configRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('occupied_items').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('events').select('*'),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('config').select('*').eq('key', 'site_password').single()
      ]);

      if (usersRes.data) {
        const updatedUsers = usersRes.data.map(u => ({ 
          ...u, 
          avatar: u.avatar_url, 
          isAdmin: u.is_admin, 
          roles: u.roles || [],
          status: currentOnlineIds.has(u.id) ? 'online' : 'offline' 
        }));
        
        // Restore from localStorage; if not found, keep null to force profile select
        const savedUserId = getSavedUserId();
        const prevCurrentUserId = savedUserId || get().currentUser?.id;
        const newCurrentUser = prevCurrentUserId ? (updatedUsers.find(u => u.id === prevCurrentUserId) ?? null) : null;
        
        set({ users: updatedUsers, currentUser: newCurrentUser });

        // If user was restored after channel was subscribed, track them now to avoid ghost offline status
        if (newCurrentUser && isPresenceSubscribed) {
           presenceChannel.track({ userId: newCurrentUser.id, online_at: new Date().toISOString() });
        }
      }

      // Handle config/password
      let currentSitePassword = import.meta.env.VITE_APP_PASSWORD || null;
      if (configRes.data) {
        currentSitePassword = configRes.data.value;
      }
      
      const storedPass = localStorage.getItem('gds-auth-pass');
      const isAuth = !currentSitePassword || storedPass === currentSitePassword;
      
      set({ 
        sitePassword: currentSitePassword, 
        isAuthenticated: isAuth 
      });
      if (itemsRes.data) {
        set({ occupiedItems: itemsRes.data.map(i => ({ 
          id: i.id, name: i.name, type: i.type as ItemType, occupiedBy: i.locked_by, 
          lastUpdated: new Date(i.last_updated).getTime() 
        })) });
      }
      if (tasksRes.data) {
        set({ tasks: tasksRes.data.map(t => ({ 
          id: t.id, title: t.title, description: t.description, assignedTo: t.assigned_to, status: t.status as TaskStatusType,
          sort_order: t.sort_order ?? 0
        })) });
      }
      if (eventsRes.data) {
        set({ events: eventsRes.data.map(e => ({
          id: e.id, title: e.title, description: e.description, date: Number(e.date), type: e.type as EventType
        })) });
      }
      if (annRes.data) {
        set({ announcements: annRes.data.map(a => ({
          id: a.id, text: a.text, userId: a.user_id, createdAt: new Date(a.created_at).getTime()
        })) });
      }

      // Set up Realtime Subscriptions
      supabase.channel('public:occupied_items')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'occupied_items' }, () => {
          // Simplistic reload on any change
          supabase!.from('occupied_items').select('*').then(res => {
            if (res.data) {
              set({ occupiedItems: res.data.map(i => ({ 
                id: i.id, name: i.name, type: i.type, occupiedBy: i.locked_by, 
                lastUpdated: new Date(i.last_updated).getTime() 
              })) });
            }
          });
        }).subscribe();

      supabase.channel('public:tasks')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
          supabase!.from('tasks').select('*').then(res => {
            if (res.data) {
              set({ tasks: res.data.map(t => ({ 
                id: t.id, title: t.title, description: t.description, assignedTo: t.assigned_to, status: t.status as TaskStatusType,
                sort_order: t.sort_order ?? 0
              })) });
            }
          });
        }).subscribe();

      supabase.channel('public:events')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
          supabase!.from('events').select('*').then(res => {
            if (res.data) {
              set({ events: res.data.map(e => ({
                id: e.id, title: e.title, description: e.description, date: Number(e.date), type: e.type as EventType
              })) });
            }
          });
        }).subscribe();

      supabase.channel('public:announcements')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
          supabase!.from('announcements').select('*').order('created_at', { ascending: false }).then(res => {
            if (res.data) {
              set({ announcements: res.data.map(a => ({
                id: a.id, text: a.text, userId: a.user_id, createdAt: Number(a.created_at)
              })) });
            }
          });
        }).subscribe();

      supabase.channel('public:users')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
          supabase!.from('users').select('*').then(res => {
            if (res.data) {
              const updatedUsers = res.data.map(u => ({ ...u, avatar: u.avatar_url, isAdmin: u.is_admin, roles: u.roles || [] }));
              const prevId = get().currentUser?.id;
              const newCurrentUser = updatedUsers.find(u => u.id === prevId) ?? updatedUsers[0] ?? null;
              set({ users: updatedUsers, currentUser: newCurrentUser });
            }
          });
        }).subscribe();
      // Mark DB as ready
      set({ dbReady: true });

    } catch (err) {
      console.error("Failed to initialize Supabase realtime data:", err);
      set({ dbReady: true }); // still mark ready so UI isn't stuck on loading
    }
  },

  loginWithPassword: (password) => {
    const correctPassword = get().sitePassword;
    if (!correctPassword || password === correctPassword) {
      try { localStorage.setItem('gds-auth-pass', password); } catch { /* noop */ }
      set({ isAuthenticated: true });
      return true;
    }
    return false;
  },

  setCurrentUser: (userId) => {
    saveUserId(userId);
    const user = get().users.find(u => u.id === userId);
    set({ currentUser: user || null });

    // Track presence if supabase is available
    if (supabase) {
      const channel = supabase.channel('online-users');
      channel.track({ userId: userId, online_at: new Date().toISOString() });
    }
  },

  logoutUser: () => {
    try { 
      localStorage.removeItem(LS_USER_KEY); 
      localStorage.removeItem('gds-auth-pass');
    } catch { /* noop */ }
    
    // Untrack presence
    if (supabase) {
      supabase.channel('online-users').untrack();
    }

    set({ currentUser: null, isAuthenticated: false });
  },

  updateUserStatus: (userId, status) =>
    set((state) => ({
      users: state.users.map(u => u.id === userId ? { ...u, status } : u),
      currentUser: state.currentUser?.id === userId ? { ...state.currentUser, status } : state.currentUser
    })),

  updateUserProfile: async (userId, updates) => {
    // Optimistic UI update
    set((state) => {
      const updatedUsers = state.users.map(u => u.id === userId ? { ...u, ...updates } : u);
      return {
        users: updatedUsers,
        currentUser: state.currentUser?.id === userId ? { ...state.currentUser, ...updates } : state.currentUser
      };
    });
    
    if (hasSupabase && supabase) {
      await supabase.from('users').update({
        name: updates.name,
        avatar_url: updates.avatar,
        roles: updates.roles
      }).eq('id', userId);
    }
  },

  addAvailableRole: async (roleName) => {
    // Optimistic update
    set((state) => ({
      availableRoles: [...new Set([...state.availableRoles, roleName])]
    }));
    if (hasSupabase && supabase) {
      // No separate roles table — roles are stored per-user in users.roles
    }
  },

  addOccupiedItem: async (name, type) => {
    const newItemId = `new_${Date.now()}`;
    const newItem: OccupiedItem = { id: newItemId, name, type, occupiedBy: null, lastUpdated: Date.now() };
    // Optimistic update — show immediately for the current user
    set((state) => ({ occupiedItems: [...state.occupiedItems, newItem] }));
    if (hasSupabase && supabase) {
      await supabase.from('occupied_items').insert({ id: newItemId, name, type });
    }
  },

  removeOccupiedItem: async (itemId) => {
    // Optimistic update
    set((state) => ({ occupiedItems: state.occupiedItems.filter(i => i.id !== itemId) }));
    if (hasSupabase && supabase) {
      await supabase.from('occupied_items').delete().eq('id', itemId);
    }
  },

  renameOccupiedItem: async (itemId, newName) => {
    // Optimistic update
    set((state) => ({
      occupiedItems: state.occupiedItems.map(i => 
        i.id === itemId ? { ...i, name: newName } : i
      )
    }));
    if (hasSupabase && supabase) {
      await supabase.from('occupied_items').update({ name: newName }).eq('id', itemId);
    }
  },

  toggleOccupiedLock: async (itemId, userId) => {
    const state = get();
    const item = state.occupiedItems.find(i => i.id === itemId);
    if (!item) return;

    let newOccupiedBy: string | null = null;
    
    if (item.occupiedBy === userId) {
      newOccupiedBy = null; // Unlock
    } else if (item.occupiedBy === null) {
      newOccupiedBy = userId; // Lock
    } else {
      return; // Locked by someone else
    }

    // Optimistic update — show lock/unlock immediately
    set((state) => ({
      occupiedItems: state.occupiedItems.map(i => 
        i.id === itemId ? { ...i, occupiedBy: newOccupiedBy, lastUpdated: Date.now() } : i
      )
    }));

    if (hasSupabase && supabase) {
      await supabase.from('occupied_items').update({ 
        locked_by: newOccupiedBy, last_updated: new Date().toISOString() 
      }).eq('id', itemId);
    }
  },

  addTask: async (title, description, assignedTo, status) => {
    const id = `task_${Date.now()}`;
    // New tasks get sort_order = -Date.now() so they appear at the top when sorted ascending
    const sort_order = -Date.now();
    set((state) => ({
      tasks: [...state.tasks, { id, title, description, assignedTo, status, sort_order }]
    }));
    if (hasSupabase && supabase) {
      // Insert core fields first (always works)
      await supabase.from('tasks').insert({ id, title, description, assigned_to: assignedTo, status });
      // Then try to set sort_order separately (won't break if column doesn't exist yet)
      supabase.from('tasks').update({ sort_order }).eq('id', id).then(() => {});
    }
  },

  removeTask: async (taskId) => {
    set((state) => ({ tasks: state.tasks.filter(t => t.id !== taskId) }));
    if (hasSupabase && supabase) {
      await supabase.from('tasks').delete().eq('id', taskId);
    }
  },

  renameTask: async (taskId, newTitle) => {
    set((state) => ({
      tasks: state.tasks.map(t => t.id === taskId ? { ...t, title: newTitle } : t)
    }));
    if (hasSupabase && supabase) {
      await supabase.from('tasks').update({ title: newTitle }).eq('id', taskId);
    }
  },

  updateTaskDescription: async (taskId, newDescription) => {
    set((state) => ({
      tasks: state.tasks.map(t => t.id === taskId ? { ...t, description: newDescription } : t)
    }));
    if (hasSupabase && supabase) {
      await supabase.from('tasks').update({ description: newDescription }).eq('id', taskId);
    }
  },

  reassignTask: async (taskId, newAssignee) => {
    set((state) => ({
      tasks: state.tasks.map(t => t.id === taskId ? { ...t, assignedTo: newAssignee } : t)
    }));
    if (hasSupabase && supabase) {
      await supabase.from('tasks').update({ assigned_to: newAssignee }).eq('id', taskId);
    }
  },

  moveTask: async (taskId, newStatus) => {
    // When moving to a new column, assign sort_order to put it at the top
    const sort_order = -Date.now();
    set((state) => ({
      tasks: state.tasks.map(t => t.id === taskId ? { ...t, status: newStatus, sort_order } : t)
    }));
    if (hasSupabase && supabase) {
      // Always update status first (critical)
      await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
      // Then try sort_order separately (won't break if column doesn't exist yet)
      supabase.from('tasks').update({ sort_order }).eq('id', taskId).then(() => {});
    }
  },

  reorderTasks: async (reorderedIds, _status) => {
    // Assign incremental sort_order to each task based on new position
    const updates: { id: string; sort_order: number }[] = reorderedIds.map((id, index) => ({
      id, sort_order: index
    }));

    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map(t => {
        const update = updates.find(u => u.id === t.id);
        return update ? { ...t, sort_order: update.sort_order } : t;
      })
    }));

    // Persist to Supabase
    if (hasSupabase && supabase) {
      await Promise.all(
        updates.map(u => 
          supabase!.from('tasks').update({ sort_order: u.sort_order }).eq('id', u.id)
        )
      );
    }
  },

  addEvent: async (title, description, date, type) => {
    const id = `event_${Date.now()}`;
    const newEvent: CalendarEvent = {
        id,
        title,
        description,
        date: date.getTime(),
        type
    };

    set((state) => ({ events: [...state.events, newEvent] }));

    if (hasSupabase && supabase) {
        await supabase.from('events').insert({
          id, title, description, date: date.getTime(), type
        });
    }
  },

  addAnnouncement: async (text, userId) => {
    const newAnnounce: AnnouncementItem = {
      id: `ann_${Date.now()}`,
      text,
      userId,
      createdAt: Date.now()
    };
    
    set((state) => ({ announcements: [newAnnounce, ...state.announcements] }));

    if (hasSupabase && supabase) {
      await supabase.from('announcements').insert({
        id: newAnnounce.id, text, user_id: userId, created_at: newAnnounce.createdAt
      });
    }
  }
}));
