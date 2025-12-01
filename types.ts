export interface Project {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ContentIdea {
  id: string;
  type: 'video' | 'story' | 'image';
  text: string;
}

export interface CalendarEvent {
  id: string;
  projectId: string;
  title: string;
  date: string; // ISO Date string YYYY-MM-DD
  startTime: string; // HH:mm 24h format
  endTime: string; // HH:mm 24h format
  description?: string;
  checklist: ChecklistItem[];
  contentIdeas: ContentIdea[];
  completed: boolean;
}

export interface DayCell {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

export const PRESET_COLORS = [
  { name: 'Holiday Red', value: '#ef4444' }, // red-500
  { name: 'Pine Green', value: '#22c55e' }, // green-500
  { name: 'Winter Blue', value: '#3b82f6' }, // blue-500
  { name: 'Gold', value: '#eab308' }, // yellow-500
  { name: 'Berry Purple', value: '#a855f7' }, // purple-500
  { name: 'Cozy Orange', value: '#f97316' }, // orange-500
  { name: 'Bright Pink', value: '#ec4899' }, // pink-500
  { name: 'Rose', value: '#f43f5e' }, // rose-500
];