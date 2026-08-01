import { useState, useMemo, useEffect } from 'react';
import { useUserStore } from '../stores/useUserStore';
import { useTaskStore } from '../stores/useTaskStore';
import type { TaskStatusType, TaskItem } from '../shared/types';
import { Modal } from '../shared/components';
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
  arrayMove
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { cn } from '../shared/lib/cn';

// Feature sub-components and constants
import { SortableTaskItem } from '../features/tasks/SortableTaskItem';
import { COLUMNS, COLUMN_TINTS } from '../features/tasks/constants';

// --- COLUMN COMPONENT ---

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
  const tasks = useTaskStore((s) => s.tasks);
  const moveTask = useTaskStore((s) => s.moveTask);
  const reorderTasks = useTaskStore((s) => s.reorderTasks);
  const addTask = useTaskStore((s) => s.addTask);
  const users = useUserStore((s) => s.users);
  const currentUser = useUserStore((s) => s.currentUser);
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNewTaskAssignee(filteredUserId || currentUser.id);
    }
  }, [isAddingTask, currentUser, filteredUserId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Filter tasks based on selected user tab (or all), then sort by sort_order
  const filteredTasks = useMemo(() => {
    const base = !filteredUserId ? tasks : tasks.filter(t => t.assignedTo === filteredUserId);
    return [...base].sort((a, b) => a.sort_order - b.sort_order);
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

    if (activeTaskId === overId) return;

    const activeTaskData = tasks.find(t => t.id === activeTaskId);
    if (!activeTaskData) return;

    // Determine target status
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

    if (newStatus === activeTaskData.status) {
      // Same column reorder
      const columnTasks = filteredTasks.filter(t => t.status === newStatus);
      const oldIndex = columnTasks.findIndex(t => t.id === activeTaskId);
      const newIndex = columnTasks.findIndex(t => t.id === overId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = arrayMove(columnTasks, oldIndex, newIndex);
        reorderTasks(reordered.map(t => t.id), newStatus);
      }
    } else {
      // Cross-column move
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

      {/* Add Task Modal */}
      <Modal isOpen={!!isAddingTask} onClose={() => setIsAddingTask(null)}>
        <div className="p-6">
          <Modal.Title>Add New Task to {COLUMNS.find(c => c.id === isAddingTask)?.title}</Modal.Title>
            
            <div className="space-y-4 mt-4 mb-6">
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
      </Modal>

    </div>
  );
}
