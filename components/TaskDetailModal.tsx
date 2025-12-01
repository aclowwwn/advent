import React, { useState, useEffect } from 'react';
import { X, Clock, CheckSquare, Trash2, Save, Plus, Video, Image as ImageIcon, CircleDashed, GripVertical } from 'lucide-react';
import { CalendarEvent, Project, ChecklistItem, ContentIdea } from '../types';

interface TaskDetailModalProps {
  event: CalendarEvent | null;
  project: Project | undefined;
  onClose: () => void;
  onUpdateEvent: (updatedEvent: CalendarEvent) => void;
  onDeleteEvent: (eventId: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  event,
  project,
  onClose,
  onUpdateEvent,
  onDeleteEvent,
}) => {
  const [formData, setFormData] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    setFormData(event);
  }, [event]);

  if (!event || !formData) return null;

  const handleSave = () => {
    if (formData) {
      onUpdateEvent(formData);
      onClose();
    }
  };

  const updateField = (field: keyof CalendarEvent, value: any) => {
    setFormData(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  // Checklist Handlers
  const toggleChecklist = (itemId: string) => {
    const updatedChecklist = formData.checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    updateField('checklist', updatedChecklist);
  };

  const updateChecklistText = (itemId: string, text: string) => {
    const updatedChecklist = formData.checklist.map((item) =>
      item.id === itemId ? { ...item, text } : item
    );
    updateField('checklist', updatedChecklist);
  };

  const addChecklistItem = () => {
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: '',
      completed: false
    };
    updateField('checklist', [...formData.checklist, newItem]);
  };

  const deleteChecklistItem = (itemId: string) => {
    updateField('checklist', formData.checklist.filter(i => i.id !== itemId));
  };

  // Social Media Content Handlers
  const updateContentIdea = (ideaId: string, text: string) => {
    const updatedIdeas = (formData.contentIdeas || []).map((idea) =>
      idea.id === ideaId ? { ...idea, text } : idea
    );
    updateField('contentIdeas', updatedIdeas);
  };

  const addContentIdea = (type: 'video' | 'story' | 'image' = 'image') => {
    const newIdea: ContentIdea = {
      id: crypto.randomUUID(),
      type,
      text: ''
    };
    updateField('contentIdeas', [...(formData.contentIdeas || []), newIdea]);
  };

  const deleteContentIdea = (ideaId: string) => {
    updateField('contentIdeas', (formData.contentIdeas || []).filter(i => i.id !== ideaId));
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'video': return <Video size={16} className="text-purple-500" />;
      case 'story': return <CircleDashed size={16} className="text-pink-500" />;
      case 'image': return <ImageIcon size={16} className="text-blue-500" />;
      default: return <ImageIcon size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        style={{ borderTop: `6px solid ${project?.color || '#cbd5e1'}` }}
      >
        {/* Header / Main Details */}
        <div className="p-6 pb-2">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 mr-4">
               <span 
                className="inline-block px-2 py-0.5 rounded text-xs font-semibold text-white mb-2"
                style={{ backgroundColor: project?.color || '#cbd5e1' }}
               >
                 {project?.name || 'Unknown Project'}
               </span>
               <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full text-2xl font-bold text-slate-900 leading-tight bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="Task Title"
              />
            </div>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-slate-500 mb-4 text-sm">
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
              <Clock size={16} />
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => updateField('startTime', e.target.value)}
                className="bg-transparent focus:outline-none w-20 text-center"
              />
              <span>-</span>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => updateField('endTime', e.target.value)}
                className="bg-transparent focus:outline-none w-20 text-center"
              />
            </div>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => updateField('date', e.target.value)}
              className="bg-slate-50 px-2 py-1 rounded-md border border-slate-100 focus:outline-none text-slate-700"
            />
          </div>

          <textarea
            value={formData.description || ''}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Add a description..."
            className="w-full text-slate-600 text-sm leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 focus:ring-2 focus:ring-blue-100 focus:border-blue-200 focus:outline-none resize-none min-h-[80px]"
          />
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-6 pb-6 space-y-6 flex-1">
          
          {/* Checklist Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <CheckSquare size={16} className="text-slate-500" />
                Checklist
              </h3>
              <button 
                onClick={addChecklistItem}
                className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1 px-2 py-1 hover:bg-blue-50 rounded"
              >
                <Plus size={12} /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              {formData.checklist.map((item) => (
                <div key={item.id} className="flex items-start gap-2 group">
                  <div className="relative flex items-center pt-2">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleChecklist(item.id)}
                      className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-300 shadow-sm checked:border-blue-600 checked:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                    />
                    <svg
                      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100"
                      width="10"
                      height="10"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => updateChecklistText(item.id, e.target.value)}
                    className={`flex-1 text-sm bg-transparent border-b border-transparent focus:border-slate-200 focus:outline-none py-1 ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}
                    placeholder="Checklist item"
                  />
                  <button
                    onClick={() => deleteChecklistItem(item.id)}
                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {formData.checklist.length === 0 && (
                <div className="text-xs text-slate-400 italic pl-1 border-l-2 border-slate-100 py-2">
                  No items yet. Click "Add Item" to start.
                </div>
              )}
            </div>
          </div>

          {/* Social Media Content Ideas Section */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">AI</span>
                Content Creation
              </h3>
              <div className="flex gap-1">
                <button onClick={() => addContentIdea('video')} title="Add Video Idea" className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"><Video size={14} /></button>
                <button onClick={() => addContentIdea('story')} title="Add Story Idea" className="p-1.5 text-slate-400 hover:text-pink-600 hover:bg-pink-50 rounded transition-colors"><CircleDashed size={14} /></button>
                <button onClick={() => addContentIdea('image')} title="Add Image Idea" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><ImageIcon size={14} /></button>
              </div>
            </div>
            
            <div className="space-y-3">
              {(formData.contentIdeas || []).map((idea) => (
                <div key={idea.id} className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 group hover:border-slate-200 transition-colors">
                  <div className="mt-0.5 flex-shrink-0" title={idea.type}>
                    {getIconForType(idea.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">{idea.type}</div>
                    <textarea
                      value={idea.text}
                      onChange={(e) => updateContentIdea(idea.id, e.target.value)}
                      className="w-full text-sm bg-transparent border-none focus:ring-0 p-0 text-slate-700 placeholder-slate-400 resize-none h-auto"
                      rows={2}
                      placeholder={`Describe your ${idea.type} idea...`}
                    />
                  </div>
                  <button
                    onClick={() => deleteContentIdea(idea.id)}
                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all self-start"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {(!formData.contentIdeas || formData.contentIdeas.length === 0) && (
                 <div className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  No content ideas generated. Add one using the icons above.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
           <button
            onClick={() => onDeleteEvent(event.id)}
            className="px-4 py-2 text-red-600 bg-white border border-slate-200 hover:bg-red-50 hover:border-red-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Trash2 size={16} />
            <span className="hidden sm:inline">Delete</span>
          </button>
          <div className="flex-1"></div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 flex items-center gap-2"
          >
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};