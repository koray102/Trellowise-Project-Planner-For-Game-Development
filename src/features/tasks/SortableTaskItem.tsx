/**
 * SortableTaskItem — Draggable kanban task card
 *
 * Displays a single task within a kanban column with inline editing
 * for title, description, and assignee. Uses dnd-kit's useSortable
 * for drag-and-drop reordering.
 *
 * Extracted from Tasks page for better separation of concerns.
 */
import { useState, useRef, useCallback } from 'react';
import { useUserStore } from '../../stores/useUserStore';
import { useTaskStore } from '../../stores/useTaskStore';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MoreHorizontal, Trash2 } from 'lucide-react';
import { cn } from '../../shared/lib/cn';
import { useClickOutside } from '../../shared/hooks/useClickOutside';
import type { TaskItem } from '../../shared/types';
import { STATUS_ICONS, STATUS_COLORS } from './constants';

export function SortableTaskItem({ task }: { task: TaskItem }) {
  const users = useUserStore((s) => s.users);
  const removeTask = useTaskStore((s) => s.removeTask);
  const renameTask = useTaskStore((s) => s.renameTask);
  const reassignTask = useTaskStore((s) => s.reassignTask);
  const updateTaskDescription = useTaskStore((s) => s.updateTaskDescription);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingAssignee, setIsEditingAssignee] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setShowMenu(false), []);
  useClickOutside(menuRef, closeMenu, showMenu);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id, data: { type: 'Task', task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const assignee = users.find(u => u.id === task.assignedTo);
  const StatusIcon = STATUS_ICONS[task.status];

  const handleRenameSubmit = () => {
    if (editTitle.trim().length > 0 && editTitle !== task.title) {
      renameTask(task.id, editTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleDescSubmit = () => {
    const finalDesc = editDescription.trim();
    if (finalDesc !== (task.description || '')) {
      updateTaskDescription(task.id, finalDesc);
    }
    setIsEditingDescription(false);
  };

  const isEditing = isEditingTitle || isEditingAssignee || isEditingDescription;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group p-3 rounded-lg border bg-zinc-900 border-zinc-800 shadow-sm flex flex-col gap-3",
        isDragging ? "opacity-30 border-indigo-500" : "hover:border-zinc-700 hover:shadow-md transition-all",
        !isEditing ? "cursor-grab active:cursor-grabbing" : ""
      )}
      {...(!isEditing ? attributes : {})}
      {...(!isEditing ? listeners : {})}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          <GripVertical className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
          {isEditingTitle ? (
            <input
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit();
                if (e.key === 'Escape') {
                  setEditTitle(task.title);
                  setIsEditingTitle(false);
                }
              }}
              onBlur={handleRenameSubmit}
              className="bg-zinc-950 border border-indigo-500 rounded px-1.5 py-0.5 text-sm font-medium text-zinc-200 outline-none w-full leading-snug"
            />
          ) : (
            <span className="text-sm font-medium text-zinc-200 leading-snug break-words">{task.title}</span>
          )}
        </div>
        
        {/* Menu and Delete */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <div ref={menuRef} className="relative">
             <button
               onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
               className={cn("p-1 rounded-md transition-colors", showMenu ? "bg-zinc-800 text-zinc-200" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800")}
               title="More options"
             >
               <MoreHorizontal className="w-3.5 h-3.5" />
             </button>
             
             {showMenu && (
               <div className="absolute right-0 top-full mt-1 w-36 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 z-[100] overflow-hidden">
                 <button 
                   onClick={(e) => { e.stopPropagation(); setIsEditingTitle(true); setShowMenu(false); }}
                   className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-indigo-500/20 hover:text-indigo-400 transition-colors"
                 >
                   Rename Task
                 </button>
                 <button 
                   onClick={(e) => { e.stopPropagation(); setIsEditingAssignee(true); setShowMenu(false); }}
                   className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-indigo-500/20 hover:text-indigo-400 transition-colors"
                 >
                   Change Assignee
                 </button>
                 <button 
                   onClick={(e) => { 
                     e.stopPropagation(); 
                     setEditDescription(task.description || ''); 
                     setIsEditingDescription(true); 
                     setShowMenu(false); 
                   }}
                   className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-indigo-500/20 hover:text-indigo-400 transition-colors"
                 >
                   Edit Description
                 </button>
               </div>
             )}
          </div>
          
          <button
            onClick={(e) => { e.stopPropagation(); removeTask(task.id); }}
            className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      {isEditingDescription ? (
         <div className="px-6 py-1">
           <textarea
             autoFocus
             value={editDescription}
             onChange={(e) => setEditDescription(e.target.value)}
             onKeyDown={(e) => {
               if (e.key === 'Enter' && !e.shiftKey) {
                 e.preventDefault();
                 handleDescSubmit();
               }
               if (e.key === 'Escape') {
                 setEditDescription(task.description || '');
                 setIsEditingDescription(false);
               }
             }}
             onBlur={handleDescSubmit}
             className="w-full bg-zinc-950 border border-indigo-500 rounded px-2 py-1 text-xs text-zinc-300 outline-none resize-none min-h-[60px]"
             placeholder="Task description..."
           />
         </div>
      ) : task.description ? (
        <p 
          className="text-xs text-zinc-400 pl-6 line-clamp-2 cursor-pointer hover:text-zinc-300 transition-colors"
          onClick={(e) => { e.stopPropagation(); setEditDescription(task.description || ''); setIsEditingDescription(true); }}
          title="Click to edit description"
        >
          {task.description}
        </p>
      ) : null}
      
      <div className="flex items-center justify-between pl-6 pt-1">
        <StatusIcon className={cn("w-4 h-4", STATUS_COLORS[task.status])} />
        
        {isEditingAssignee ? (
           <select 
             autoFocus
             value={task.assignedTo}
             onChange={(e) => {
               reassignTask(task.id, e.target.value);
               setIsEditingAssignee(false);
             }}
             onBlur={() => setIsEditingAssignee(false)}
             className="bg-zinc-950 border border-indigo-500 rounded px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-400 outline-none cursor-pointer"
           >
             {users.map(u => (
               <option key={u.id} value={u.id}>{u.name.split(' ')[0]}</option>
             ))}
           </select>
        ) : assignee ? (
           <div 
             className="flex items-center gap-1.5 shrink-0 bg-zinc-950 px-2 py-0.5 rounded-full border border-zinc-800/80 cursor-pointer hover:border-zinc-600 transition-colors"
             onClick={(e) => { e.stopPropagation(); setIsEditingAssignee(true); }}
             title="Click to change assignee"
           >
             <img 
               src={assignee.avatar} 
               alt={assignee.name} 
               className="w-4 h-4 rounded-full bg-zinc-800 shrink-0" 
             />
             <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
               {assignee.name.split(' ')[0]}
             </span>
           </div>
        ) : null}
      </div>
    </div>
  );
}
