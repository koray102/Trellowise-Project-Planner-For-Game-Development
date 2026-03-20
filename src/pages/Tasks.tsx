import { useState, useMemo, useEffect, useRef } from 'react';
import { useStore, type TaskStatusType, type TaskItem } from '../store';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  useDroppable,
  type DragStartEvent, 
  type DragEndEvent 
} from '@dnd-kit/core';
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, GripVertical, AlertCircle, CheckCircle2, Circle, Clock, MoreHorizontal, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// --- COLUMN DEFINITIONS ---
const COLUMNS: { id: TaskStatusType; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
  { id: 'debt', title: 'Debt / Backlog' },
];

const STATUS_ICONS: Record<TaskStatusType, React.ElementType> = {
  todo: Circle,
  progress: Clock,
  done: CheckCircle2,
  debt: AlertCircle
};

const STATUS_COLORS: Record<TaskStatusType, string> = {
  todo: 'text-zinc-400',
  progress: 'text-blue-400',
  done: 'text-emerald-400',
  debt: 'text-rose-400'
};

/** Very subtle column background tints for visual differentiation */
const COLUMN_TINTS: Record<TaskStatusType, string> = {
  todo: 'bg-zinc-950/50 border-zinc-800/60',
  progress: 'bg-blue-950/20 border-blue-900/30',
  done: 'bg-emerald-950/20 border-emerald-900/30',
  debt: 'bg-red-950/20 border-red-900/30',
};

// --- COMPONENTS ---

function SortableTaskItem({ task }: { task: TaskItem }) {
  const { users, removeTask, renameTask, reassignTask } = useStore();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingAssignee, setIsEditingAssignee] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group p-3 rounded-lg border bg-zinc-900 border-zinc-800 shadow-sm flex flex-col gap-3",
        isDragging ? "opacity-30 border-indigo-500" : "hover:border-zinc-700 hover:shadow-md transition-all",
        !isEditingTitle && !isEditingAssignee ? "cursor-grab active:cursor-grabbing" : ""
      )}
      {...(!isEditingTitle && !isEditingAssignee ? attributes : {})}
      {...(!isEditingTitle && !isEditingAssignee ? listeners : {})}
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
      
      {task.description && (
        <p className="text-xs text-zinc-400 pl-6 line-clamp-2">{task.description}</p>
      )}
      
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

function Column({ 
  id, 
  title, 
  tasks,
  onAddTask
}: { 
  id: TaskStatusType; 
  title: string; 
  tasks: TaskItem[];
  onAddTask: (status: TaskStatusType) => void;
}) {
  const { setNodeRef } = useDroppable({ id, data: { type: 'Column' } });

  return (
    <div className={cn("flex flex-col rounded-xl border flex-1 min-w-0 h-full max-h-full", COLUMN_TINTS[id])}>
      {/* Column Header */}
      <div className="p-4 flex items-center justify-between border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-zinc-200">{title}</h3>
          <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-0.5 rounded-full font-medium">
            {tasks.length}
          </span>
        </div>
        <button 
          onClick={() => onAddTask(id)}
          className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Column Body / Droppable Area */}
      <div ref={setNodeRef} className="flex-1 p-3 overflow-y-auto min-h-[150px]">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3 min-h-full">
            {tasks.map(task => (
              <SortableTaskItem key={task.id} task={task} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}


// --- MAIN PAGE ---

// Module-level persistent state so it survives unmount/remount until a hard refresh
let persistentTaskFilter: string | null | 'default' = 'default';

export function Tasks() {
  const { tasks, moveTask, addTask, users, currentUser } = useStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Use persistent filter or fallback to current user
  const [filteredUserId, setFilteredUserId] = useState<string | null>(() => {
    if (persistentTaskFilter !== 'default') return persistentTaskFilter;
    return currentUser?.id || null;
  });

  // Sync back to persistent storage whenever user changes the filter tab
  useEffect(() => {
    if (filteredUserId !== null || persistentTaskFilter !== 'default') {
      persistentTaskFilter = filteredUserId;
    }
  }, [filteredUserId]);

  // Fallback: if user loaded slightly after component mount
  useEffect(() => {
    if (persistentTaskFilter === 'default' && currentUser) {
      setFilteredUserId(currentUser.id);
      persistentTaskFilter = currentUser.id;
    }
  }, [currentUser]);

  // New task modal state
  const [isAddingTask, setIsAddingTask] = useState<TaskStatusType | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>('');
  
  // Set default assignee to current user when opening the modal
  useEffect(() => {
    if (isAddingTask && currentUser) {
      setNewTaskAssignee(filteredUserId || currentUser.id);
    }
  }, [isAddingTask, currentUser, filteredUserId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Filter tasks based on selected user tab (or all)
  const filteredTasks = useMemo(() => {
    if (!filteredUserId) return tasks;
    return tasks.filter(t => t.assignedTo === filteredUserId);
  }, [tasks, filteredUserId]);

  // Derived state for dragging overlay
  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeId),
    [activeId, tasks]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    const activeTaskData = tasks.find(t => t.id === activeTaskId);
    if (!activeTaskData) return;

    // Determine target status layout
    const overTaskData = tasks.find(t => t.id === overId);
    let newStatus: TaskStatusType;
    if (overTaskData) {
      newStatus = overTaskData.status;
    } else {
      const validColumn = COLUMNS.find(c => c.id === overId);
      if (validColumn) {
        newStatus = validColumn.id;
      } else {
        return;
      }
    }

    if (newStatus !== activeTaskData.status) {
       moveTask(activeTaskId, newStatus);
    }
  };

  const handleCreateTask = () => {
    if (newTaskTitle.trim() && isAddingTask && newTaskAssignee) {
      addTask(newTaskTitle.trim(), newTaskDesc.trim(), newTaskAssignee, isAddingTask);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setIsAddingTask(null);
    }
  };


  return (
    <div className="h-full flex flex-col pt-2 pb-6">
      {/* Header & 4-User Filter */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-zinc-400 mt-1">Multi-User Kanban Board</p>
        </div>

        {/* User Filter Tabs */}
        <div className="flex bg-zinc-900/80 p-1 rounded-lg border border-zinc-800/80 max-w-fit">
          <button
            onClick={() => setFilteredUserId(null)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
              filteredUserId === null
                ? "bg-zinc-800 text-white shadow"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            )}
          >
            All Team
          </button>
          <div className="w-px bg-zinc-800 my-2 mx-1" />
          {users.map(user => (
            <button
              key={user.id}
              onClick={() => setFilteredUserId(user.id)}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2",
                filteredUserId === user.id
                  ? "bg-indigo-500/20 text-indigo-300 shadow"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              )}
            >
              <img src={user.avatar} className="w-5 h-5 rounded-full bg-zinc-800" alt="" />
              <span className="hidden sm:inline">{user.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board Area */}
      <div className="flex-1 overflow-x-hidden overflow-y-hidden">
        <div className="flex gap-4 h-full px-1">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {COLUMNS.map(column => (
              <Column 
                key={column.id}
                id={column.id}
                title={column.title}
                tasks={filteredTasks.filter(t => t.status === column.id)}
                onAddTask={setIsAddingTask}
              />
            ))}
            
            <DragOverlay>
              {activeTask ? (
                <SortableTaskItem task={activeTask} />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Simple Add Task Modal Overlay */}
      {isAddingTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 text-zinc-100">Add New Task to {COLUMNS.find(c => c.id === isAddingTask)?.title}</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Title <span className="text-red-500">*</span></label>
                <input 
                  autoFocus
                  type="text"
                  placeholder="Task title..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateTask();
                    if (e.key === 'Escape') setIsAddingTask(null);
                  }}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Description (Optional)</label>
                <textarea 
                  placeholder="Add details..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px] resize-none"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Assign To <span className="text-red-500">*</span></label>
                <select 
                  value={newTaskAssignee}
                  onChange={(e) => setNewTaskAssignee(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="" disabled>Select team member...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsAddingTask(null)}
                className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateTask}
                disabled={!newTaskTitle.trim() || !newTaskAssignee}
                className="px-4 py-2 rounded-lg bg-indigo-500 text-white font-medium hover:bg-indigo-600 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors text-sm shadow-md"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
