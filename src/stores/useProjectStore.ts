import { create } from 'zustand';
import { logger } from '../shared/lib/logger';
import { insertProject } from '../services/project.repository';
import type { Project } from '../shared/types';
import { useAppStore } from './useAppStore';

const MODULE = 'ProjectStore';
const LS_PROJECT_KEY = 'gds-current-project-id';

interface ProjectState {
  projects: Project[];
  currentProjectId: string | null;

  setProjects: (projects: Project[]) => void;
  selectProject: (projectId: string) => void;
  addProject: (name: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProjectId: null,

  setProjects: (projects) => {
    let currentId = get().currentProjectId;
    
    // If no project is selected, try to load from localStorage, otherwise pick the first one
    if (!currentId && projects.length > 0) {
      const savedId = localStorage.getItem(LS_PROJECT_KEY);
      if (savedId && projects.find(p => p.id === savedId)) {
        currentId = savedId;
      } else {
        currentId = projects[0].id;
      }
      localStorage.setItem(LS_PROJECT_KEY, currentId);
    }

    set({ projects, currentProjectId: currentId });
  },

  selectProject: (projectId) => {
    if (get().currentProjectId === projectId) return;
    
    localStorage.setItem(LS_PROJECT_KEY, projectId);
    set({ currentProjectId: projectId });
    logger.info(MODULE, `Switched to project ${projectId}`);
    
    // Tell AppStore to reload data for this new project
    useAppStore.getState().loadProjectData(projectId);
  },

  addProject: async (name: string) => {
    const newProject: Project = {
      id: `proj_${Date.now()}`,
      name,
      createdAt: Date.now(),
    };

    const previousProjects = get().projects;

    // Optimistic update
    set({ projects: [...previousProjects, newProject] });

    try {
      await insertProject(newProject);
      get().selectProject(newProject.id);
    } catch (err) {
      // Rollback
      logger.error(MODULE, 'Failed to create project, rolling back', err);
      set({ projects: previousProjects });
    }
  },
}));
