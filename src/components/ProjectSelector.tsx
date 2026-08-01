import { useState } from 'react';
import { useProjectStore } from '../stores/useProjectStore';
import { Folder, Plus, ChevronDown, Check } from 'lucide-react';
import { cn } from '../shared/lib/cn';

export function ProjectSelector() {
  const { projects, currentProjectId, selectProject, addProject } = useProjectStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const currentProject = projects.find(p => p.id === currentProjectId);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    
    await addProject(newProjectName.trim());
    setNewProjectName('');
    setIsAdding(false);
    setIsOpen(false);
  };

  return (
    <div className="relative px-4 py-3 border-b border-zinc-800/60">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800 transition-colors text-left"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Folder className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-sm font-medium text-zinc-200 truncate">
            {currentProject?.name || 'Select Project'}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 mx-4 z-50 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl shadow-black/50 overflow-hidden">
          <div className="max-h-60 overflow-y-auto p-1">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  selectProject(project.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
                  currentProjectId === project.id 
                    ? "bg-indigo-500/10 text-indigo-400 font-medium" 
                    : "text-zinc-300 hover:bg-zinc-800"
                )}
              >
                <span className="truncate">{project.name}</span>
                {currentProjectId === project.id && (
                  <Check className="w-4 h-4 shrink-0" />
                )}
              </button>
            ))}
          </div>
          
          <div className="p-2 border-t border-zinc-800 bg-zinc-950/50">
            {isAdding ? (
              <form onSubmit={handleAddProject} className="flex flex-col gap-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Project name..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium py-1.5 rounded-md transition-colors"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium py-1.5 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Project
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
