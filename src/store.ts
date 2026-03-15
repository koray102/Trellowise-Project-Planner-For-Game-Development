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
}

export type EventType = 'milestone' | 'meeting' | 'deadline';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: number; // Unix timestamp
  type: EventType;
}

export interface GDSState {
  users: User[];
  currentUser: User | null;
  occupiedItems: OccupiedItem[];
  tasks: TaskItem[];
  events: CalendarEvent[];
  
  // Actions
  initDb: () => Promise<void>;
  setCurrentUser: (userId: string) => void;
  updateUserStatus: (userId: string, status: UserStatus) => void;
  addOccupiedItem: (name: string, type: ItemType) => Promise<void>;
  removeOccupiedItem: (itemId: string) => Promise<void>;
  renameOccupiedItem: (itemId: string, newName: string) => Promise<void>;
  toggleOccupiedLock: (itemId: string, userId: string) => Promise<void>;
  addTask: (title: string, description: string, assignedTo: string, status: TaskStatusType) => Promise<void>;
  removeTask: (taskId: string) => Promise<void>;
  renameTask: (taskId: string, newTitle: string) => Promise<void>;
  reassignTask: (taskId: string, newAssignee: string) => Promise<void>;
  moveTask: (taskId: string, newStatus: TaskStatusType) => Promise<void>;
  addEvent: (title: string, description: string, date: Date, type: EventType) => Promise<void>;
}

// Initial Mock Users (4-person Unity Team)
const MOCK_USERS: User[] = [
  { id: '1', name: 'Koray (Lead)', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Koray', status: 'online' },
  { id: '2', name: 'Sam (Art)', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam', status: 'online' },
  { id: '3', name: 'Jordan (Code)', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan', status: 'away' },
  { id: '4', name: 'Alex (Design)', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', status: 'offline' },
];

const MOCK_OCCUPIED: OccupiedItem[] = [
  { id: '1', name: 'MainMenu', type: 'scene', occupiedBy: '1', lastUpdated: Date.now() - 1000 * 60 * 30 },
  { id: '2', name: 'PlayerMovement', type: 'script', occupiedBy: '3', lastUpdated: Date.now() - 1000 * 60 * 5 },
  { id: '3', name: 'Level_01', type: 'scene', occupiedBy: null, lastUpdated: Date.now() - 1000 * 60 * 120 },
  { id: '4', name: 'Enemy_Bruiser', type: 'prefab', occupiedBy: null, lastUpdated: Date.now() - 1000 * 60 * 60 * 24 },
  { id: '5', name: 'GameManager.cs', type: 'script', occupiedBy: null, lastUpdated: Date.now() - 1000 * 60 * 60 },
];

const MOCK_TASKS: TaskItem[] = [
  { id: 't1', title: 'Fix jumping physics bug', description: 'Player occasionally double jumps when hitting a slope.', assignedTo: '3', status: 'progress' },
  { id: 't2', title: 'Design Level 2 layout', description: 'Focus on verticality and adding new enemy types.', assignedTo: '4', status: 'todo' },
  { id: 't3', title: 'Create main character animations', description: 'Attack, Dash, and Idle loops.', assignedTo: '2', status: 'progress' },
  { id: 't4', title: 'Implement audio manager', description: 'Add support for spatial 3D audio in Unity.', assignedTo: '1', status: 'done' },
  { id: 't5', title: 'Refactor UI code (Technical Debt)', description: 'Move from old canvas system to UI Toolkit.', assignedTo: '1', status: 'debt' },
];

const MOCK_EVENTS: CalendarEvent[] = [
  { id: 'e1', title: 'Sprint Planning', description: 'Kickoff meeting for the next 2 weeks.', date: new Date().getTime(), type: 'meeting' },
  { id: 'e2', title: 'Level 1 Alpha Lock', description: 'All core assets must be finished for L1.', date: new Date(new Date().setDate(new Date().getDate() + 4)).getTime(), type: 'deadline' },
  { id: 'e3', title: 'Audio Review', description: 'Reviewing the ambient noises in Sector 4.', date: new Date(new Date().setDate(new Date().getDate() + 2)).getTime(), type: 'meeting' },
  { id: 'e4', title: 'Pre-production wrap', description: 'Final meeting before alpha coding phase begins.', date: new Date(new Date().setDate(new Date().getDate() - 5)).getTime(), type: 'milestone' },
  { id: 'e5', title: 'Marketing sync', description: 'Discussing trailer assets.', date: new Date(new Date().setDate(new Date().getDate() - 1)).getTime(), type: 'meeting' },
  { id: 'e6', title: 'Beta Branch Cut', date: new Date(new Date().setDate(new Date().getDate() + 8)).getTime(), type: 'deadline' },
];

export const useStore = create<GDSState>((set, get) => ({
  users: MOCK_USERS,
  currentUser: MOCK_USERS[0],
  occupiedItems: MOCK_OCCUPIED,
  tasks: MOCK_TASKS,
  events: MOCK_EVENTS,

  initDb: async () => {
    if (!hasSupabase || !supabase) {
      console.warn("Supabase credentials not found. Utilizing local mock data for GDS.");
      return;
    }

    try {
      // Fetch initial data
      const [usersRes, itemsRes, tasksRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('occupied_items').select('*'),
        supabase.from('tasks').select('*')
      ]);

      if (usersRes.data) {
        set({ users: usersRes.data.map(u => ({ ...u, avatar: u.avatar_url })) });
      }
      if (itemsRes.data) {
        set({ occupiedItems: itemsRes.data.map(i => ({ 
          id: i.id, name: i.name, type: i.type, occupiedBy: i.locked_by, 
          lastUpdated: new Date(i.last_updated).getTime() 
        })) });
      }
      if (tasksRes.data) {
        set({ tasks: tasksRes.data.map(t => ({ 
          id: t.id, title: t.title, description: t.description, assignedTo: t.assigned_to, status: t.status 
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
                id: t.id, title: t.title, description: t.description, assignedTo: t.assigned_to, status: t.status 
              })) });
            }
          });
        }).subscribe();

    } catch (err) {
      console.error("Failed to initialize Supabase realtime data:", err);
    }
  },

  setCurrentUser: (userId) => 
    set((state) => ({
      currentUser: state.users.find(u => u.id === userId) || state.currentUser
    })),

  updateUserStatus: (userId, status) =>
    set((state) => ({
      users: state.users.map(u => u.id === userId ? { ...u, status } : u)
    })),

  addOccupiedItem: async (name, type) => {
    const newItemId = `new_${Date.now()}`;
    if (hasSupabase && supabase) {
      await supabase.from('occupied_items').insert({ id: newItemId, name, type });
    } else {
      set((state) => {
        const newItem: OccupiedItem = { id: newItemId, name, type, occupiedBy: null, lastUpdated: Date.now() };
        return { occupiedItems: [...state.occupiedItems, newItem] };
      });
    }
  },

  removeOccupiedItem: async (itemId) => {
    if (hasSupabase && supabase) {
      await supabase.from('occupied_items').delete().eq('id', itemId);
    } else {
      set((state) => ({ occupiedItems: state.occupiedItems.filter(i => i.id !== itemId) }));
    }
  },

  renameOccupiedItem: async (itemId, newName) => {
    if (hasSupabase && supabase) {
      await supabase.from('occupied_items').update({ name: newName }).eq('id', itemId);
    } else {
      set((state) => ({
        occupiedItems: state.occupiedItems.map(i => 
          i.id === itemId ? { ...i, name: newName } : i
        )
      }));
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

    if (hasSupabase && supabase) {
      // Optimistic upate missing for simplicity, wait for db
      await supabase.from('occupied_items').update({ 
        locked_by: newOccupiedBy, last_updated: new Date().toISOString() 
      }).eq('id', itemId);
      // It'll be updated by realtime subscription
    } else {
      set((state) => ({
        occupiedItems: state.occupiedItems.map(i => 
          i.id === itemId ? { ...i, occupiedBy: newOccupiedBy, lastUpdated: Date.now() } : i
        )
      }));
    }
  },

  addTask: async (title, description, assignedTo, status) => {
    const id = `task_${Date.now()}`;
    if (hasSupabase && supabase) {
      await supabase.from('tasks').insert({ id, title, description, assigned_to: assignedTo, status });
    } else {
      set((state) => ({
        tasks: [...state.tasks, { id, title, description, assignedTo, status }]
      }));
    }
  },

  removeTask: async (taskId) => {
    if (hasSupabase && supabase) {
      await supabase.from('tasks').delete().eq('id', taskId);
    } else {
      set((state) => ({ tasks: state.tasks.filter(t => t.id !== taskId) }));
    }
  },

  renameTask: async (taskId, newTitle) => {
    if (hasSupabase && supabase) {
      await supabase.from('tasks').update({ title: newTitle }).eq('id', taskId);
    } else {
      set((state) => ({
        tasks: state.tasks.map(t => t.id === taskId ? { ...t, title: newTitle } : t)
      }));
    }
  },

  reassignTask: async (taskId, newAssignee) => {
    if (hasSupabase && supabase) {
      await supabase.from('tasks').update({ assigned_to: newAssignee }).eq('id', taskId);
    } else {
      set((state) => ({
        tasks: state.tasks.map(t => t.id === taskId ? { ...t, assignedTo: newAssignee } : t)
      }));
    }
  },

  moveTask: async (taskId, newStatus) => {
    if (hasSupabase && supabase) {
      await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    } else {
      set((state) => ({
        tasks: state.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
      }));
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

    if (hasSupabase && supabase) {
        // Assume an 'events' table exists, bypassing for local store execution as requested
    } else {
        set((state) => ({
            events: [...state.events, newEvent]
        }));
    }
  }
}));
