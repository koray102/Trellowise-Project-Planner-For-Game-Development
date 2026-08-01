/**
 * StatsCards — Dashboard quick stats row
 *
 * Displays the three key metrics: Active Tasks, Locks Held, Total Done.
 * Extracted from Dashboard to keep the main page focused on layout.
 */
import { KanbanSquare, ShieldAlert, Activity } from 'lucide-react';

interface StatsCardsProps {
  activeTasks: number;
  locksHeld: number;
  totalDone: number;
}

export function StatsCards({ activeTasks, locksHeld, totalDone }: StatsCardsProps) {
  const stats = [
    { icon: KanbanSquare, label: 'Active Tasks', value: activeTasks, color: 'bg-indigo-500/10 text-indigo-400' },
    { icon: ShieldAlert, label: 'Locks Held', value: locksHeld, color: 'bg-amber-500/10 text-amber-500' },
    { icon: Activity, label: 'Total Done', value: totalDone, color: 'bg-emerald-500/10 text-emerald-400' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="bg-zinc-950/50 p-5 rounded-xl border border-zinc-800/60 flex items-center gap-4">
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-zinc-500 font-medium tracking-wide uppercase">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
