import { NavLink } from 'react-router-dom';
import { useStore } from '../store';
import { 
  LayoutDashboard, 
  Calendar, 
  KanbanSquare, 
  ShieldAlert
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for cleaner tailwind class merging
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Occupieds', path: '/occupieds', icon: ShieldAlert, highlight: true },
  { name: 'Tasks (Kanban)', path: '/tasks', icon: KanbanSquare },
  { name: 'Calendar', path: '/calendar', icon: Calendar },
];

export function Sidebar() {
  const { users, currentUser } = useStore();

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800/60 flex flex-col hidden md:flex">
      
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white font-bold text-lg leading-none tracking-tighter">GDS</span>
          </div>
          <span className="font-semibold text-zinc-100 tracking-wide text-lg">Sync</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
              isActive 
                ? "bg-zinc-800/80 text-white shadow-sm" 
                : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200",
              item.highlight && !isActive && "text-amber-500/80 hover:text-amber-400 hover:bg-amber-500/10"
            )}
          >
            <item.icon className={cn("w-5 h-5", item.highlight && "text-amber-500")} />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Team List (Display Only) */}
      <div className="p-4 border-t border-zinc-800/60">
        <div className="mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider px-2">
          TEAM
        </div>
        <div className="space-y-1">
          {users.map(user => (
            <div
              key={user.id}
              className={cn(
                "relative group w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm text-left",
                currentUser?.id === user.id 
                  ? "bg-indigo-500/10 text-indigo-400 font-medium" 
                  : "text-zinc-400"
              )}
            >
              <div className="relative shrink-0">
                <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full bg-zinc-800" />
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-950",
                  user.status === 'online' ? "bg-emerald-500" : 
                  user.status === 'away' ? "bg-amber-500" : "bg-zinc-500"
                )} />
              </div>
              <div className="flex flex-col items-start text-left w-full overflow-hidden">
                <span className="truncate font-medium leading-snug w-full">{user.name}</span>
                {user.roles && user.roles.length > 0 && (
                  <div className="flex gap-1 mt-0.5 flex-wrap h-[18px] overflow-hidden">
                    {user.roles.map(r => (
                      <span key={r} className="text-[9px] uppercase tracking-wider bg-zinc-800/80 border border-zinc-700/50 text-zinc-400 px-1 rounded leading-[1.2] flex items-center">
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Hover Popover */}
              <div className="absolute left-0 bottom-full mb-1 w-52 bg-zinc-900 border border-zinc-700 rounded-lg p-3 z-[100] opacity-0 invisible group-hover:opacity-100 group-hover:visible shadow-xl transition-all pointer-events-none">
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-zinc-800" />
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-900",
                      user.status === 'online' ? "bg-emerald-500" : 
                      user.status === 'away' ? "bg-amber-500" : "bg-zinc-500"
                    )} />
                  </div>
                  <div className="flex flex-col items-start text-left">
                    <span className="font-bold text-sm text-zinc-100 truncate w-full">{user.name}</span>
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {user.roles && user.roles.map(r => (
                        <span key={r} className="text-[9.5px] uppercase tracking-wider bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 px-1.5 py-0.5 rounded leading-none flex items-center font-medium">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </aside>
  );
}
