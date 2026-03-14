import { useState, useMemo } from 'react';
import { useStore, type TaskStatusType, type TaskItem } from '../store';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
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
import { Plus, GripVertical, AlertCircle, CheckCircle2, Circle, Clock } from 'lucide-react';
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

// --- COMPONENTS ---

function SortableTaskItem({ task }: { task: TaskItem }) {
  const { users } = useStore();
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group p-3 rounded-lg border bg-zinc-900 border-zinc-800 shadow-sm flex flex-col gap-3",
        isDragging ? "opacity-30 border-indigo-500" : "hover:border-zinc-700 hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
        <span className="text-sm font-medium text-zinc-200 leading-snug">{task.title}</span>
      </div>
      
      <div className="flex items-center justify-between pl-6">
        <StatusIcon className={cn("w-4 h-4", STATUS_COLORS[task.status])} />
        {assignee && (
          <img 
            src={assignee.avatar} 
            alt={assignee.name} 
            title={assignee.name}
            className="w-5 h-5 rounded-full bg-zinc-800 ring-1 ring-zinc-700" 
          />
        )}
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
  return (
    <div className="flex flex-col bg-zinc-950/50 rounded-xl border border-zinc-800/60 w-80 shrink-0 h-full max-h-full">
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
      <div className="flex-1 p-3 overflow-y-auto min-h-[150px]">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3">
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

export function Tasks() {
  const { tasks, moveTask, addTask, users, currentUser } = useStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filteredUserId, setFilteredUserId] = useState<string | null>(null);

  // New task modal state (simplified for demo)
  const [isAddingTask, setIsAddingTask] = useState<TaskStatusType | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

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

    // Simplified drop logic: we need to figure out which column the drop happened in.
    // In dnd-kit, we're dropping either on a task (SortableTaskItem) or on a column itself.
    
    // Find the task we are dragging
    const activeTaskData = tasks.find(t => t.id === activeTaskId);
    if (!activeTaskData) return;

    // Find what we dropped it on
    const overTaskData = tasks.find(t => t.id === overId);

     // Simple Status Update Hack for the demo: 
     // If we drop on a different task, take its status
     if (overTaskData && overTaskData.status !== activeTaskData.status) {
         moveTask(activeTaskId, overTaskData.status);
     }
  };

  const handleCreateTask = () => {
    if (newTaskTitle.trim() && isAddingTask && currentUser) {
      addTask(newTaskTitle.trim(), filteredUserId || currentUser.id, isAddingTask);
      setNewTaskTitle('');
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
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-6 h-full min-w-max px-1">
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
            <input 
              autoFocus
              type="text"
              placeholder="Task title..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-6"
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsAddingTask(null)}
                className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateTask}
                disabled={!newTaskTitle.trim()}
                className="px-4 py-2 rounded-lg bg-indigo-500 text-white font-medium hover:bg-indigo-600 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors"
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
