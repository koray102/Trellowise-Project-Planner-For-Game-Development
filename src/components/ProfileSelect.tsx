import { useStore } from '../store';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Gamepad2 } from 'lucide-react';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const STATUS_COLORS: Record<string, string> = {
  online: 'bg-emerald-500',
  away: 'bg-amber-500',
  offline: 'bg-zinc-500',
};

export function ProfileSelect() {
  const { users, setCurrentUser } = useStore();

  return (
    <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center z-[200]">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-zinc-950 to-zinc-950 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-10 px-6 max-w-3xl w-full">
        {/* Logo & Title */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
            <Gamepad2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">
              Welcome to <span className="text-indigo-400">GDS</span> Sync
            </h1>
            <p className="text-zinc-500 mt-2 text-sm">
              Select your profile to continue
            </p>
          </div>
        </div>

        {/* User Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          {users.map((user, idx) => (
            <button
              key={user.id}
              onClick={() => setCurrentUser(user.id)}
              className={cn(
                "group relative flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all duration-300",
                "bg-zinc-900/60 border-zinc-800/60 hover:border-indigo-500/50 hover:bg-indigo-500/5",
                "hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1",
                "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-zinc-950",
                "active:scale-[0.97]"
              )}
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              {/* Avatar */}
              <div className="relative">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-16 h-16 rounded-full bg-zinc-800 ring-2 ring-zinc-700/50 group-hover:ring-indigo-500/40 transition-all duration-300"
                />
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-[3px] border-zinc-900",
                  STATUS_COLORS[user.status] || 'bg-zinc-500'
                )} />
              </div>

              {/* Name */}
              <span className="text-sm font-semibold text-zinc-300 group-hover:text-white transition-colors">
                {user.name}
              </span>

              {/* Roles */}
              {user.roles && user.roles.length > 0 && (
                <div className="flex gap-1.5 flex-wrap justify-center">
                  {user.roles.map(r => (
                    <span
                      key={r}
                      className="text-[10px] uppercase tracking-wider bg-zinc-800/80 border border-zinc-700/50 text-zinc-400 group-hover:text-indigo-300 group-hover:border-indigo-500/30 group-hover:bg-indigo-500/10 px-2 py-0.5 rounded-full transition-colors"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <p className="text-zinc-600 text-xs">
          Your selection will be remembered for future visits.
        </p>
      </div>
    </div>
  );
}
