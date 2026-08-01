import { useState, useMemo, useEffect } from 'react';
import { useUserStore } from '../stores/useUserStore';
import { useOccupiedStore } from '../stores/useOccupiedStore';
import type { ItemType, User } from '../shared/types';
import { Search, Plus, ShieldAlert, Box, List, User as UserIcon } from 'lucide-react';
import { cn } from '../shared/lib/cn';
import { ErrorBoundary } from '../shared/components';

// Feature sub-components and constants
import { OccupiedItemCard } from '../features/occupieds/OccupiedItemCard';
import {
  TYPE_ICONS,
  TYPE_COLORS,
  TYPE_LABELS,
  COLUMNS,
  TOAST_EVENT,
  pushToast,
  normalizeString,
} from '../features/occupieds/constants';

/**
 * Safely renders text with **bold** markers as React elements.
 * Avoids dangerouslySetInnerHTML to prevent XSS attacks.
 */
function renderBoldText(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <b key={i} className="font-bold text-white">{part}</b> : part
  );
}

function OccupiedsAllColumn() {
  const occupiedItems = useOccupiedStore((s) => s.occupiedItems);
  const [searchTerm, setSearchTerm] = useState('');

  const sortedAndFilteredItems = useMemo(() => {
    const lockedItems = occupiedItems.filter(i => i.occupiedBy !== null);
    const normalizedSearch = normalizeString(searchTerm);

    const result = lockedItems.filter(item => 
      normalizeString(item.name).includes(normalizedSearch)
    );

    return [...result].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  }, [occupiedItems, searchTerm]);

  return (
    <div className="flex flex-col bg-zinc-950/30 rounded-xl border border-zinc-800/40 flex-1 min-w-0 h-[38rem]">
      <div className="p-4 flex flex-col gap-4 border-b border-zinc-800/40 bg-zinc-900/20 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <List className="w-5 h-5 text-indigo-400 opacity-80" />
            <h3 className="font-semibold text-zinc-400">All Occupied Assets</h3>
          </div>
          <span className="bg-zinc-800/80 text-zinc-500 text-xs px-2 py-0.5 rounded-full font-medium">
            {sortedAndFilteredItems.length}
          </span>
        </div>

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

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {sortedAndFilteredItems.length === 0 ? (
          <div className="text-center py-8 px-4 border border-dashed border-zinc-800/30 rounded-lg opacity-50">
            <p className="text-zinc-500 text-sm">No items found.</p>
          </div>
        ) : (
          sortedAndFilteredItems.map(item => (
            <div key={`all_${item.id}`} className="opacity-60 hover:opacity-100 transition-opacity">
              <OccupiedItemCard item={item} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function UserColumn({ user }: { user: User }) {
  const occupiedItems = useOccupiedStore((s) => s.occupiedItems);
  const [searchTerm, setSearchTerm] = useState('');

  const sortedAndFilteredItems = useMemo(() => {
    const userItems = occupiedItems.filter(i => i.occupiedBy === user.id);
    const normalizedSearch = normalizeString(searchTerm);

    const result = userItems.filter(item => 
      normalizeString(item.name).includes(normalizedSearch)
    );

    return [...result].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  }, [occupiedItems, searchTerm, user.id]);

  return (
    <div className="flex flex-col bg-zinc-950/30 rounded-xl border border-zinc-800/40 flex-1 min-w-0 h-80">
      <div className="p-4 flex flex-col gap-4 border-b border-zinc-800/40 bg-zinc-900/20 rounded-t-xl group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={user.avatar || ''} alt={user.name || 'User'} className="w-5 h-5 rounded-full bg-zinc-800 ring-1 ring-zinc-700" />
            <h3 className="font-semibold text-zinc-400 group-hover:text-zinc-300 transition-colors truncate" title={user.name}>
              {(user.name || 'Unknown').split(' ')[0]}'s Assets
            </h3>
          </div>
          <span className="bg-zinc-800/80 text-zinc-500 text-xs px-2 py-0.5 rounded-full font-medium">
            {sortedAndFilteredItems.length}
          </span>
        </div>

        <div className="relative w-full">
           <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
           <input
             type="text"
             placeholder={`Search ${(user.name || 'Unknown').split(' ')[0]}'s locks...`}
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full pl-8 pr-2 py-1.5 bg-zinc-950/80 border border-zinc-800/50 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all placeholder:text-zinc-600 text-zinc-400"
           />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {sortedAndFilteredItems.length === 0 ? (
          <div className="text-center py-8 px-4 border border-dashed border-zinc-800/30 rounded-lg opacity-50">
            <p className="text-zinc-500 text-sm">No items found.</p>
          </div>
        ) : (
          sortedAndFilteredItems.map(item => (
            <OccupiedItemCard key={`user_${user.id}_${item.id}`} item={item} />
          ))
        )}
      </div>
    </div>
  );
}

function OccupiedsColumn({ type }: { type: ItemType }) {
  const occupiedItems = useOccupiedStore((s) => s.occupiedItems);
  const addOccupiedItem = useOccupiedStore((s) => s.addOccupiedItem);
  const [searchTerm, setSearchTerm] = useState('');

  const columnItems = useMemo(() => {
    return occupiedItems.filter(i => i.type === type);
  }, [occupiedItems, type]);

  const sortedAndFilteredItems = useMemo(() => {
    const normalizedSearch = normalizeString(searchTerm);
    const result = columnItems.filter(item => 
      normalizeString(item.name).includes(normalizedSearch)
    );

    return [...result].sort((a, b) => {
      const aLocked = !!a.occupiedBy;
      const bLocked = !!b.occupiedBy;
      
      if (aLocked !== bLocked) {
        return aLocked ? -1 : 1;
      }
      
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [columnItems, searchTerm]);

  const handleCreate = () => {
    const rawName = searchTerm.trim();
    if (rawName.length === 0) return;

    const normalizedNew = normalizeString(rawName);
    
    // Global duplicate check across ALL assets, not just this specific column.
    const duplicateItem = occupiedItems.find(i => normalizeString(i.name) === normalizedNew);

    if (duplicateItem) {
       // e.g. "Ayni isimde SCENE zaten mevcut (MainMenU)"
       pushToast(`Ayni isimde **${duplicateItem.type.toUpperCase()}** zaten mevcut (${duplicateItem.name})`);
       return;
    }

    addOccupiedItem(rawName, type);
    setSearchTerm('');
  };

  const Icon = TYPE_ICONS[type];

  return (
    <div className="flex flex-col bg-zinc-950/50 rounded-xl border border-zinc-800/60 flex-1 min-w-0 h-[38rem]">
      <div className="p-4 flex flex-col gap-4 border-b border-zinc-800/60 bg-zinc-900/40 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={cn("w-5 h-5", (TYPE_COLORS[type] || 'text-zinc-400').split(' ')[0])} />
            <h3 className="font-semibold text-zinc-200">{TYPE_LABELS[type]}</h3>
          </div>
          <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-0.5 rounded-full font-medium">
            {columnItems.length}
          </span>
        </div>

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

function OccupiedsInner() {
  const users = useUserStore((s) => s.users);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Global toast listener
  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setToastMessage(customEvent.detail);
      // Auto dismiss
      setTimeout(() => setToastMessage(null), 3000);
    };

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => window.removeEventListener(TOAST_EVENT, handleToast);
  }, []);

  return (
    <div className="h-full flex flex-col pt-2 pb-6 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-zinc-900/90 backdrop-blur-sm border border-red-500/30 text-red-200 px-4 py-2 rounded-full shadow-lg text-sm flex items-center gap-2">
             <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
             <span>{renderBoldText(toastMessage)}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 shrink-0">
        <h1 className="text-3xl font-bold tracking-tight text-amber-500 flex items-center gap-3">
          <ShieldAlert className="w-8 h-8" />
          Conflict Prevention Engine
        </h1>
        <p className="text-zinc-400 mt-2">
          Lock items across specific categories to prevent Git merge conflicts in Unity.
        </p>
      </div>

      {/* Main Scrollable Area containing rows of boards */}
      <div className="flex-1 overflow-y-auto bg-zinc-950/20 rounded-xl p-2">
        <div className="flex flex-col gap-8 pb-4 px-1">
          
          {/* TOP ROW: Categories */}
          <div>
            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2 pl-1">
              <Box className="w-4 h-4" /> Global Asset Categories
            </h2>
            <div className="flex gap-4 xl:gap-6">
              {COLUMNS.map(colType => (
                <OccupiedsColumn key={colType} type={colType} />
              ))}
              
              <div className="w-px bg-zinc-800/50 my-2 mx-1 rounded-full shrink-0" />
              
              {/* All Occupied Assets Rightmost Column */}
              <OccupiedsAllColumn />
            </div>
          </div>

          <div className="h-px bg-zinc-800/60 w-full" />

          {/* BOTTOM ROW: User Accounts */}
          <div>
            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2 pl-1">
              <UserIcon className="w-4 h-4" /> Team Member Assets
            </h2>
            <div className="flex gap-4 xl:gap-6">
              {users.map(user => (
                <UserColumn key={user.id} user={user} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export function Occupieds() {
  return (
    <ErrorBoundary module="Conflict Prevention Engine">
      <OccupiedsInner />
    </ErrorBoundary>
  );
}

