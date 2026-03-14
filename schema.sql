-- GameDev Sync (GDS) Supabase Schema

-- 1. Users Table (Simulated or Real)
CREATE TABLE public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'offline'
);

-- 2. Occupied Items Table (For locking Scenes/Prefabs/Scripts)
CREATE TABLE public.occupied_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'Scene', 'Script', 'Prefab'
  locked_by TEXT REFERENCES public.users(id),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tasks Table (Kanban Board)
CREATE TABLE public.tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL, -- 'To Do', 'In Progress', 'Done', 'Debt'
  assigned_to TEXT REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - Optional for internal tools but good practice
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupied_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Allow read/write access to everyone (since this is an internal dashboard without strict auth for now)
CREATE POLICY "Allow anonymous read" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON public.users FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous read" ON public.occupied_items FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON public.occupied_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON public.occupied_items FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous read" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON public.tasks FOR UPDATE USING (true);

-- Insert Mock Data
INSERT INTO public.users (id, name, avatar_url, status) VALUES 
('1', 'Koray (Lead)', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Koray', 'online'),
('2', 'Sam (Art)', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam', 'online'),
('3', 'Jordan (Code)', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan', 'away'),
('4', 'Alex (Design)', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', 'offline');

INSERT INTO public.occupied_items (id, name, type, locked_by) VALUES
('1', 'MainMenu.unity', 'Scene', '1'),
('2', 'PlayerController.cs', 'Script', '3'),
('3', 'Level1.unity', 'Scene', NULL),
('4', 'EnemyAI.prefab', 'Prefab', NULL),
('5', 'GameManager.cs', 'Script', NULL);

INSERT INTO public.tasks (id, title, status, assigned_to) VALUES
('t1', 'Fix jumping physics bug', 'In Progress', '3'),
('t2', 'Design Level 2 layout', 'To Do', '4'),
('t3', 'Create main character animations', 'In Progress', '2'),
('t4', 'Implement audio manager', 'Done', '1'),
('t5', 'Refactor UI code (Technical Debt)', 'Debt', '1');
