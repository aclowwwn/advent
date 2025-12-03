import { Project, CalendarTask } from '../types';

// TOGGLE THIS TO FALSE TO USE THE REAL BACKEND
const USE_LOCAL_STORAGE = false;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// --- LocalStorage Helpers (Legacy/Demo) ---
const loadLS = (key: string) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch { return []; }
};

const saveLS = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// --- API Service ---

export const api = {
  // Projects
  getProjects: async (): Promise<Project[]> => {
    if (USE_LOCAL_STORAGE) return loadLS('familyPlanner_projects');
    const res = await fetch(`${API_URL}/projects`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  createProject: async (project: Project): Promise<Project> => {
    if (USE_LOCAL_STORAGE) {
      const projects = loadLS('familyPlanner_projects');
      const newProjects = [...projects, project];
      saveLS('familyPlanner_projects', newProjects);
      return project;
    }
    const res = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    return res.json();
  },

  deleteProject: async (id: string): Promise<void> => {
    if (USE_LOCAL_STORAGE) {
      const projects = loadLS('familyPlanner_projects');
      saveLS('familyPlanner_projects', projects.filter((p: Project) => p.id !== id));
      return;
    }
    await fetch(`${API_URL}/projects/${id}`, { method: 'DELETE' });
  },

  // Tasks
  getTasks: async (): Promise<CalendarTask[]> => {
    if (USE_LOCAL_STORAGE) return loadLS('familyPlanner_tasks');
    const res = await fetch(`${API_URL}/tasks`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  createTask: async (task: CalendarTask): Promise<CalendarTask> => {
    if (USE_LOCAL_STORAGE) {
      const tasks = loadLS('familyPlanner_tasks');
      const newTasks = [...tasks, task];
      saveLS('familyPlanner_tasks', newTasks);
      return task;
    }
    const res = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    return res.json();
  },

  updateTask: async (task: CalendarTask): Promise<CalendarTask> => {
    if (USE_LOCAL_STORAGE) {
      const tasks = loadLS('familyPlanner_tasks');
      const newTasks = tasks.map((e: CalendarTask) => e.id === task.id ? task : e);
      saveLS('familyPlanner_tasks', newTasks);
      return task;
    }
    const res = await fetch(`${API_URL}/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    return res.json();
  },

  deleteTask: async (id: string): Promise<void> => {
    if (USE_LOCAL_STORAGE) {
      const tasks = loadLS('familyPlanner_tasks');
      saveLS('familyPlanner_tasks', tasks.filter((e: CalendarTask) => e.id !== id));
      return;
    }
    await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
  }
};