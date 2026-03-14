import { useState, useMemo } from 'react';
import { useStore, type ItemType, type OccupiedItem } from '../store';
import { Search, Plus, ShieldAlert, Lock, Unlock, Clock, FileJson, FileCode2, Box, Trash2, List } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const TYPE_ICONS: Record<ItemType, React.ElementType> = {
  scene: Box,
  script: FileCode2,
  prefab: FileJson,
};

const TYPE_COLORS: Record<ItemType, string> = {
  scene: 'text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/20',
  script: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  prefab: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
};

const TYPE_LABELS: Record<ItemType, string> = {
  scene: 'Scenes',
  script: 'Scripts',
  prefab: 'Prefabs'
};

const COLUMNS: ItemType[] = ['scene', 'prefab', 'script'];

function OccupiedItemCard({ item }: { item: OccupiedItem }) {
  const { users, currentUser, toggleOccupiedLock, removeOccupiedItem } = useStore();
  const isLocked = !!item.occupiedBy;
  const lockedByMe = item.occupiedBy === currentUser?.id;
  const occupant = users.find(u => u.id === item.occupiedBy);
  const Icon = TYPE_ICONS[item.type];

  return (
    <div 
      className={cn(
        "p-3 rounded-lg border transition-all duration-300 flex flex-col gap-2 group",
        isLocked 
          ? lockedByMe 
            ? "bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.05)]" 
            : "bg-red-500/5 border-red-500/30"
          : "bg-zinc-900/80 border-zinc-800/80 hover:bg-zinc-800 hover:border-zinc-700"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className={cn("w-4 h-4 shrink-0", TYPE_COLORS[item.type].split(' ')[0])} />
          <h3 className="font-semibold text-zinc-200 text-sm truncate leading-tight" title={item.name}>
            {item.name}
          </h3>
        </div>
        {isLocked && occupant && (
          <div className="flex items-center gap-1.5 shrink-0 bg-zinc-950 px-2 py-0.5 rounded-full border border-zinc-800/80">
            <img 
              src={occupant.avatar} 
              alt={occupant.name} 
              title={`Locked by ${occupant.name}`}
              className="w-4 h-4 rounded-full bg-zinc-800 shrink-0" 
            />
            <span className={cn("text-[10px] font-bold uppercase tracking-wide", lockedByMe ? "text-indigo-400" : "text-red-400")}>
              {occupant.name.split(' ')[0]}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-1 h-7">
        <div className="flex items-center gap-2">
          {isLocked ? (
            <div className="flex items-center gap-1 text-[10px] text-zinc-500">
              <Clock className="w-3 h-3" />
              <span>{formatDistanceToNow(item.lastUpdated)}</span>
            </div>
          ) : (
            <div className="w-4" /> /* spacer */
          )}
        </div>

        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            onClick={() => removeOccupiedItem(item.id)}
            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
            title="Delete item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => {
               if (currentUser) {
                  toggleOccupiedLock(item.id, currentUser.id);
               }
            }}
            disabled={isLocked && !lockedByMe}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-200 active:scale-95",
              isLocked
                ? lockedByMe
                  ? "bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm shadow-indigo-500/20"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-transparent"
            )}
            title={isLocked && !lockedByMe ? `Locked by ${occupant?.name}` : "Click to lock this item"}
          >
            {isLocked ? (
              lockedByMe ? (
                 <>
                   <Unlock className="w-3 h-3" />
                   Release
                 </>
              ) : (
                 <>
                   <Lock className="w-3 h-3 text-red-500/50" />
                   LOCKED
                 </>
              )
            ) : (
              <>
                <Lock className="w-3 h-3" />
                Lock
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function OccupiedsAllColumn() {
  const { occupiedItems } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  // Only take locked items, filter by search, sort by last updated
  const sortedAndFilteredItems = useMemo(() => {
    const lockedItems = occupiedItems.filter(i => i.occupiedBy !== null);
    const result = lockedItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => b.lastUpdated - a.lastUpdated);
    return result;
  }, [occupiedItems, searchTerm]);

  return (
    <div className="flex flex-col bg-zinc-950/30 rounded-xl border border-zinc-800/40 w-80 shrink-0 h-[calc(100vh-12rem)] md:h-[calc(100vh-14rem)]">
      {/* Column Header */}
      <div className="p-4 flex flex-col gap-4 border-b border-zinc-800/40 bg-zinc-900/20 rounded-t-xl group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <List className="w-5 h-5 text-indigo-400 opacity-80" />
            <h3 className="font-semibold text-zinc-400 group-hover:text-zinc-300 transition-colors">All Occupied Assets</h3>
          </div>
          <span className="bg-zinc-800/80 text-zinc-500 text-xs px-2 py-0.5 rounded-full font-medium">
            {sortedAndFilteredItems.length}
          </span>
        </div>

        {/* Column-specific Search ONLY (No Add) */}
        <div className="relative w-full">
           <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
           <input
             type="text"
             placeholder="Search active locks..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full pl-8 pr-2 py-1.5 bg-zinc-950/80 border border-zinc-800/50 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all placeholder:text-zinc-600 text-zinc-400"
           />
        </div>
      </div>

      {/* Item List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {sortedAndFilteredItems.length === 0 ? (
          <div className="text-center py-8 px-4 border border-dashed border-zinc-800/30 rounded-lg opacity-50">
            <p className="text-zinc-500 text-sm">No active locks found.</p>
          </div>
        ) : (
          sortedAndFilteredItems.map(item => (
            <OccupiedItemCard key={`all_${item.id}`} item={item} />
          ))
        )}
      </div>
    </div>
  );
}

function OccupiedsColumn({ type }: { type: ItemType }) {
  const { occupiedItems, addOccupiedItem } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  const columnItems = useMemo(() => {
    return occupiedItems.filter(i => i.type === type);
  }, [occupiedItems, type]);

  const sortedAndFilteredItems = useMemo(() => {
    const result = columnItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      if ((a.occupiedBy && b.occupiedBy) || (!a.occupiedBy && !b.occupiedBy)) {
        return b.lastUpdated - a.lastUpdated;
      }
      return a.occupiedBy ? -1 : 1;
    });

    return result;
  }, [columnItems, searchTerm]);

  const handleCreate = () => {
    if (searchTerm.trim().length > 0) {
      addOccupiedItem(searchTerm.trim(), type);
      setSearchTerm('');
    }
  };

  const Icon = TYPE_ICONS[type];

  return (
    <div className="flex flex-col bg-zinc-950/50 rounded-xl border border-zinc-800/60 w-80 shrink-0 h-[calc(100vh-12rem)] md:h-[calc(100vh-14rem)]">
      {/* Column Header */}
      <div className="p-4 flex flex-col gap-4 border-b border-zinc-800/60 bg-zinc-900/40 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={cn("w-5 h-5", TYPE_COLORS[type].split(' ')[0])} />
            <h3 className="font-semibold text-zinc-200">{TYPE_LABELS[type]}</h3>
          </div>
          <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-0.5 rounded-full font-medium">
            {columnItems.length}
          </span>
        </div>

        {/* Column-specific Search/Add */}
        <div className="flex items-center gap-2">
           <div className="relative flex-1">
             <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
             <input
               type="text"
               placeholder="Search or add..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
               className="w-full pl-8 pr-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-zinc-600"
             />
           </div>
           <button
             onClick={handleCreate}
             disabled={searchTerm.trim().length === 0}
             className="p-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white flex-shrink-0 rounded-lg transition-colors border border-transparent disabled:border-zinc-700/50"
             title={`Add new ${type}`}
           >
             <Plus className="w-4 h-4" />
           </button>
        </div>
      </div>

      {/* Item List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {sortedAndFilteredItems.length === 0 ? (
          <div className="text-center py-8 px-4 border border-dashed border-zinc-800/50 rounded-lg">
            <p className="text-zinc-500 text-sm">No items found.</p>
          </div>
        ) : (
          sortedAndFilteredItems.map(item => (
            <OccupiedItemCard key={item.id} item={item} />
          ))
        )}
      </div>
    </div>
  );
}

export function Occupieds() {
  return (
    <div className="h-full flex flex-col pt-2 pb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-amber-500 flex items-center gap-3">
          <ShieldAlert className="w-8 h-8" />
          Conflict Prevention Engine
        </h1>
        <p className="text-zinc-400 mt-2">
          Lock items across specific categories to prevent Git merge conflicts in Unity.
        </p>
      </div>

      {/* Kanban-style Columns Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-6 h-full min-w-max px-1">
          {COLUMNS.map(colType => (
            <OccupiedsColumn key={colType} type={colType} />
          ))}
          
          <div className="w-px bg-zinc-800/50 my-2 mx-1 rounded-full" />
          
          {/* All Occupied Assets Rightmost Column */}
          <OccupiedsAllColumn />
        </div>
      </div>
    </div>
  );
}

