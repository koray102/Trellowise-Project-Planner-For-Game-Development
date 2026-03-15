import { useState, useRef, useEffect, useMemo } from 'react';
import { useStore, type CalendarEvent, type EventType } from '../store';
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
  isToday,
  startOfDay
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, X, ListTodo, MapPin, Flag } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const TYPE_COLORS: Record<EventType, string> = {
  meeting: 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20',
  deadline: 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20',
  milestone: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
};

const TYPE_ICONS: Record<EventType, React.ElementType> = {
  meeting: ListTodo,
  deadline: Flag,
  milestone: MapPin
};

export function Calendar() {
  const { events, addEvent } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal states
  const [addingOnDate, setAddingOnDate] = useState<Date | null>(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventType, setNewEventType] = useState<EventType>('meeting');

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // List refs for scrolling
  const listRef = useRef<HTMLDivElement>(null);
  const targetEventRef = useRef<HTMLDivElement>(null);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Chronologically sort all events
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => a.date - b.date);
  }, [events]);

  // Find the exact event to scroll to on mount: 
  // "At the top, the closest past event, followed by the 3 closest future events."
  // This means if we scroll the closest past event into view, the 3 future ones will naturally be visible below it.
  const targetScrollIndex = useMemo(() => {
    const today = startOfDay(new Date()).getTime();
    
    // Find the first index that is >= today
    const firstFutureIndex = sortedEvents.findIndex(e => e.date >= today);
    
    // If all events are in the past, scroll to very bottom.
    if (firstFutureIndex === -1) return sortedEvents.length - 1;
    
    // If the first future event is the very first item, there is no past event.
    if (firstFutureIndex === 0) return 0;
    
    // The closest past event is the one right before the first future event
    return firstFutureIndex - 1;
  }, [sortedEvents]);

  // Execute scroll once on mount
  useEffect(() => {
    if (!hasScrolled && targetEventRef.current && listRef.current) {
      targetEventRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setHasScrolled(true);
    }
  }, [sortedEvents, hasScrolled]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "MMMM yyyy";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const handleCreateEvent = () => {
    if (addingOnDate && newEventTitle.trim()) {
      addEvent(newEventTitle.trim(), newEventDesc.trim(), addingOnDate, newEventType);
      setAddingOnDate(null);
      setNewEventTitle('');
      setNewEventDesc('');
      setNewEventType('meeting');
    }
  };

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

      {/* Layout Split: Calendar Grid & Event List */}
      <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
        
        {/* Calendar Grid Container */}
        <div className="flex-[3] bg-zinc-950/50 rounded-xl border border-zinc-800 flex flex-col shadow-sm min-w-[500px]">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-zinc-800 bg-zinc-900/80 shrink-0">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="py-3 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="flex-1 grid grid-cols-7 grid-rows-5 bg-zinc-950 overflow-hidden">
            {days.map((day) => {
              const dayEvents = events.filter(e => isSameDay(new Date(e.date), day));
              return (
                <div 
                  key={day.toString()}
                  className={cn(
                    "p-2 border-r border-b border-zinc-800/60 relative group transition-colors overflow-y-auto overflow-x-hidden no-scrollbar",
                    !isSameMonth(day, monthStart) && "bg-zinc-950/80",
                    "hover:bg-zinc-900/50"
                  )}
                >
                  <div className="flex items-center justify-between sticky top-0 bg-inherit z-10 pb-1">
                    <span className={cn(
                      "w-7 h-7 flex items-center justify-center text-sm font-medium rounded-full",
                      !isSameMonth(day, monthStart) ? "text-zinc-600" : "text-zinc-300",
                      isToday(day) && "bg-indigo-500 text-white shadow shadow-indigo-500/30"
                    )}>
                      {format(day, 'd')}
                    </span>
                    
                    <button 
                      onClick={() => setAddingOnDate(day)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    {dayEvents.map(event => (
                      <div 
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className={cn(
                          "px-2 py-1 text-xs font-medium rounded truncate cursor-pointer transition-colors border",
                          TYPE_COLORS[event.type]
                        )}
                        title={event.title}
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

        {/* Right Sidebar: Upcoming Events List */}
        <div className="flex-[1] flex flex-col bg-zinc-950/50 rounded-xl border border-zinc-800 shadow-sm min-w-[280px]">
           <div className="p-4 border-b border-zinc-800 bg-zinc-900/80 shrink-0">
             <h3 className="font-semibold text-zinc-200">Event Timeline</h3>
             <p className="text-xs text-zinc-500 mt-1">Chronological sorted agenda</p>
           </div>
           
           <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {sortedEvents.map((event, index) => {
                const Icon = TYPE_ICONS[event.type];
                const isTarget = index === targetScrollIndex;
                const isPast = event.date < startOfDay(new Date()).getTime();
                
                return (
                  <div 
                    key={event.id}
                    ref={isTarget ? targetEventRef : null}
                    onClick={() => setSelectedEvent(event)}
                    className={cn(
                      "p-3 rounded-lg border flex flex-col gap-2 cursor-pointer transition-all hover:border-zinc-500",
                      isPast ? "bg-zinc-900/30 border-zinc-800/50 opacity-60 hover:opacity-100" : "bg-zinc-900 border-zinc-800 shadow-sm"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                       <h4 className="font-medium text-sm text-zinc-200 leading-snug">{event.title}</h4>
                       <Icon className={cn(
                         "w-4 h-4 shrink-0", 
                         event.type === 'meeting' ? 'text-blue-400' : event.type === 'deadline' ? 'text-rose-400' : 'text-emerald-400'
                       )} />
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span className={cn(
                         "px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider",
                         event.type === 'meeting' ? 'bg-blue-500/10 text-blue-400' : event.type === 'deadline' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                      )}>
                        {event.type}
                      </span>
                      <span>•</span>
                      <span>{format(new Date(event.date), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                );
              })}

              {sortedEvents.length === 0 && (
                <div className="text-center py-6 text-zinc-500 text-sm">No timeline events recorded.</div>
              )}
           </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Add Event Modal */}
      {addingOnDate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 text-zinc-100">Add Agenda Item</h3>
            <p className="text-sm text-zinc-500 mb-6">Scheduling for {format(addingOnDate, 'MMMM do, yyyy')}</p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Title <span className="text-red-500">*</span></label>
                <input 
                  autoFocus
                  type="text"
                  placeholder="Event title..."
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateEvent();
                    if (e.key === 'Escape') setAddingOnDate(null);
                  }}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Description</label>
                <textarea 
                  placeholder="Additional details..."
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Type Categories</label>
                <div className="flex gap-2">
                   {(['meeting', 'milestone', 'deadline'] as EventType[]).map(t => (
                     <button
                       key={t}
                       onClick={() => setNewEventType(t)}
                       className={cn(
                         "flex-1 py-1.5 text-xs font-medium rounded border capitalize transition-colors",
                         newEventType === t 
                           ? (t === 'meeting' ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : t === 'deadline' ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300')
                           : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800"
                       )}
                     >
                       {t}
                     </button>
                   ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setAddingOnDate(null)}
                className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateEvent}
                disabled={!newEventTitle.trim()}
                className="px-4 py-2 rounded-lg bg-indigo-500 text-white font-medium hover:bg-indigo-600 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors text-sm shadow-md"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl w-full max-w-sm shadow-2xl relative">
            <button 
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 p-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5"/>
            </button>
            
            <div className="flex items-center gap-3 mb-4 pr-6">
              <div className={cn(
                  "p-2 rounded-lg",
                  selectedEvent.type === 'meeting' ? 'bg-blue-500/10 text-blue-400' : selectedEvent.type === 'deadline' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
              )}>
                 {selectedEvent.type === 'meeting' && <ListTodo className="w-5 h-5" />}
                 {selectedEvent.type === 'deadline' && <Flag className="w-5 h-5" />}
                 {selectedEvent.type === 'milestone' && <MapPin className="w-5 h-5" />}
              </div>
              <div>
                 <h3 className="text-lg font-semibold text-zinc-100 leading-tight">{selectedEvent.title}</h3>
                 <p className="text-xs font-medium text-zinc-500 capitalize mt-0.5">{format(new Date(selectedEvent.date), 'EEEE, MMMM do yyyy')}</p>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-2">
               <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Description</h4>
               <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                 {selectedEvent.description || "No description provided for this event."}
               </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
