import { Project, CalendarEvent } from '../types';

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

  // Events
  getEvents: async (): Promise<CalendarEvent[]> => {
    if (USE_LOCAL_STORAGE) return loadLS('familyPlanner_events');
    const res = await fetch(`${API_URL}/events`);
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  createEvent: async (event: CalendarEvent): Promise<CalendarEvent> => {
    if (USE_LOCAL_STORAGE) {
      const events = loadLS('familyPlanner_events');
      const newEvents = [...events, event];
      saveLS('familyPlanner_events', newEvents);
      return event;
    }
    const res = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    return res.json();
  },

  updateEvent: async (event: CalendarEvent): Promise<CalendarEvent> => {
    if (USE_LOCAL_STORAGE) {
      const events = loadLS('familyPlanner_events');
      const newEvents = events.map((e: CalendarEvent) => e.id === event.id ? event : e);
      saveLS('familyPlanner_events', newEvents);
      return event;
    }
    const res = await fetch(`${API_URL}/events/${event.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    return res.json();
  },

  deleteEvent: async (id: string): Promise<void> => {
    if (USE_LOCAL_STORAGE) {
      const events = loadLS('familyPlanner_events');
      saveLS('familyPlanner_events', events.filter((e: CalendarEvent) => e.id !== id));
      return;
    }
    await fetch(`${API_URL}/events/${id}`, { method: 'DELETE' });
  }
};