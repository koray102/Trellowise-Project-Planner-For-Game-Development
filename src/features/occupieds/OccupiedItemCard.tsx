/**
 * OccupiedItemCard — Card component for a single occupied item
 *
 * Displays item name, type icon, lock status, occupant info,
 * and action buttons (rename, delete, lock/unlock).
 * Extracted from the Occupieds page for separation of concerns.
 */
import { useState, useRef, useCallback } from 'react';
import { useUserStore } from '../../stores/useUserStore';
import { useOccupiedStore } from '../../stores/useOccupiedStore';
import { Lock, Unlock, Clock, Trash2, MoreHorizontal, Box } from 'lucide-react';
import { cn } from '../../shared/lib/cn';
import { useClickOutside } from '../../shared/hooks/useClickOutside';
import type { OccupiedItem } from '../../shared/types';
import { TYPE_ICONS, TYPE_COLORS, safeFormatDistance } from './constants';

export function OccupiedItemCard({ item }: { item: OccupiedItem }) {
  const users = useUserStore((s) => s.users);
  const currentUser = useUserStore((s) => s.currentUser);
  const toggleOccupiedLock = useOccupiedStore((s) => s.toggleOccupiedLock);
  const removeOccupiedItem = useOccupiedStore((s) => s.removeOccupiedItem);
  const renameOccupiedItem = useOccupiedStore((s) => s.renameOccupiedItem);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [showMenu, setShowMenu] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);

  const isLocked = !!item.occupiedBy;
  const lockedByMe = item.occupiedBy === currentUser?.id;
  const occupant = users.find(u => u.id === item.occupiedBy);
  const Icon = TYPE_ICONS[item.type] || Box;
  const typeColor = TYPE_COLORS[item.type] || 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
  const iconColorClass = typeColor.split(' ')[0] || 'text-zinc-400';

  const closeMenu = useCallback(() => setShowMenu(false), []);
  useClickOutside(menuRef, closeMenu, showMenu);

  const handleRenameSubmit = () => {
    if (editName.trim().length > 0 && editName !== item.name) {
      renameOccupiedItem(item.id, editName.trim());
    }
    setIsEditing(false);
  };

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
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Icon className={cn("w-4 h-4 shrink-0", iconColorClass)} />
          
          {isEditing ? (
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit();
                if (e.key === 'Escape') {
                  setEditName(item.name);
                  setIsEditing(false);
                }
              }}
              onBlur={handleRenameSubmit}
              className="bg-zinc-950 border border-indigo-500 rounded px-1.5 py-0.5 text-sm text-zinc-200 focus:outline-none w-full"
            />
          ) : (
            <h3 className="font-semibold text-zinc-200 text-sm truncate leading-tight" title={item.name}>
              {item.name}
            </h3>
          )}
        </div>

        {isLocked && occupant && occupant.name && (
          <div className="flex items-center gap-1.5 shrink-0 bg-zinc-950 px-2 py-0.5 rounded-full border border-zinc-800/80">
            <img 
              src={occupant.avatar || ''} 
              alt={occupant.name || 'User'} 
              title={`Locked by ${occupant.name || 'Unknown'}`}
              className="w-4 h-4 rounded-full bg-zinc-800 shrink-0" 
            />
            <span className={cn("text-[10px] font-bold uppercase tracking-wide", lockedByMe ? "text-indigo-400" : "text-red-400")}>
              {(occupant.name || 'Unknown').split(' ')[0]}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-1 h-7">
        <div className="flex items-center gap-2">
          {isLocked ? (
            <div className="flex items-center gap-1 text-[10px] text-zinc-500">
              <Clock className="w-3 h-3" />
              <span>{safeFormatDistance(item.lastUpdated)}</span>
            </div>
          ) : (
            <div className="w-4" /> /* spacer */
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity relative">
          
          {/* Menu Trigger */}
          <div ref={menuRef} className="relative">
             <button
               onClick={() => setShowMenu(!showMenu)}
               className={cn("p-1.5 rounded-md transition-colors", showMenu ? "bg-zinc-800 text-zinc-200" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/80")}
               title="More options"
             >
               <MoreHorizontal className="w-3.5 h-3.5" />
             </button>
             
             {showMenu && (
               <div className="absolute right-0 top-full mt-1 w-32 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 z-10 overflow-hidden">
                 <button 
                   onClick={() => {
                     setIsEditing(true);
                     setShowMenu(false);
                   }}
                   className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-indigo-500/20 hover:text-indigo-400 transition-colors"
                 >
                   Rename
                 </button>
               </div>
             )}
          </div>

          <button
            onClick={() => removeOccupiedItem(item.id)}
            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors ml-0.5"
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
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-200 active:scale-95 ml-1",
              isLocked
                ? lockedByMe
                  ? "bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm shadow-indigo-500/20"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-transparent"
            )}
            title={isLocked && !lockedByMe ? `Locked by ${occupant?.name || 'Unknown'}` : "Click to lock this item"}
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
