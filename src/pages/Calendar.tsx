import { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  startOfMonth, 
  endOfMonth,
  isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Mock Events
interface Event {
  id: string;
  title: string;
  date: Date;
  type: 'milestone' | 'meeting' | 'deadline';
}

const MOCK_EVENTS: Event[] = [
  { id: '1', title: 'Sprint Planning', date: new Date(), type: 'meeting' },
  { id: '2', title: 'Level 1 Alpha Lock', date: new Date(new Date().setDate(new Date().getDate() + 4)), type: 'deadline' },
  { id: '3', title: 'Audio Review', date: new Date(new Date().setDate(new Date().getDate() + 2)), type: 'meeting' },
];

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "MMMM yyyy";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="h-full flex flex-col pt-2 pb-6">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-indigo-500" />
            Team Calendar
          </h1>
          <p className="text-zinc-400 mt-1">Schedule meetings, milestones, and deadlines.</p>
        </div>

        <div className="flex items-center gap-4 bg-zinc-900/80 p-1.5 rounded-lg border border-zinc-800 shadow-sm min-w-max">
          <button onClick={goToToday} className="px-3 py-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors">
            Today
          </button>
          <div className="w-px h-5 bg-zinc-800" />
          <div className="flex items-center gap-2 px-2">
            <button onClick={prevMonth} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-semibold w-32 text-center text-zinc-200">
              {format(currentDate, dateFormat)}
            </h2>
            <button onClick={nextMonth} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 bg-zinc-950/50 rounded-xl border border-zinc-800 overflow-hidden flex flex-col shadow-sm">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-zinc-800 bg-zinc-900/80">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="py-3 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="flex-1 grid grid-cols-7 grid-rows-5 bg-zinc-950">
          {days.map((day) => {
            const dayEvents = MOCK_EVENTS.filter(e => isSameDay(e.date, day));
            return (
              <div 
                key={day.toString()}
                className={cn(
                  "min-h-[100px] p-2 border-r border-b border-zinc-800/60 relative group transition-colors",
                  !isSameMonth(day, monthStart) && "bg-zinc-950/80",
                  "hover:bg-zinc-900/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "w-7 h-7 flex items-center justify-center text-sm font-medium rounded-full",
                    !isSameMonth(day, monthStart) ? "text-zinc-600" : "text-zinc-300",
                    isToday(day) && "bg-indigo-500 text-white shadow shadow-indigo-500/30"
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  <button className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-all">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-2 space-y-1">
                  {dayEvents.map(event => (
                    <div 
                      key={event.id}
                      className={cn(
                        "px-2 py-1 text-xs font-medium rounded truncate cursor-pointer",
                        event.type === 'meeting' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20" :
                        event.type === 'deadline' ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20" :
                        "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                      )}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
