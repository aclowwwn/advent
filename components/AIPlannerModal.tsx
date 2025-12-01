import React, { useState } from 'react';
import { X, Sparkles, Loader2, CalendarPlus } from 'lucide-react';
import { Project, CalendarEvent } from '../types';
import { generateSchedule } from '../services/geminiService';

interface AIPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onAddEvents: (events: CalendarEvent[]) => void;
}

export const AIPlannerModal: React.FC<AIPlannerModalProps> = ({
  isOpen,
  onClose,
  projects,
  onAddEvents,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedEvents, setGeneratedEvents] = useState<Partial<CalendarEvent>[]>([]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim() || projects.length === 0) return;
    setIsLoading(true);
    setGeneratedEvents([]);

    try {
      const currentYear = new Date().getFullYear();
      const events = await generateSchedule(projects, prompt, currentYear);
      setGeneratedEvents(events);
    } catch (error) {
      alert("Failed to generate schedule. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    const fullEvents: CalendarEvent[] = generatedEvents.map(e => ({
      ...e,
      id: crypto.randomUUID(),
      completed: false,
      checklist: e.checklist || [],
      contentIdeas: e.contentIdeas || [],
    } as CalendarEvent));
    
    onAddEvents(fullEvents);
    onClose();
    setPrompt('');
    setGeneratedEvents([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="text-yellow-300" />
            <h2 className="text-xl font-bold">AI Planner Assistant</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {projects.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Please define some projects first before using the AI Planner.
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  What are your goals for December?
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., I want to bake cookies every Saturday morning and plan a family movie night every Friday evening. Also need to buy gifts for grandparents by the 15th."
                  className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[120px] resize-none bg-white text-slate-900 placeholder-slate-400"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Be specific about timing preferences (e.g., "weekend mornings", "after 5pm") for better scheduling.
                </p>
              </div>

              {generatedEvents.length > 0 && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800">Suggested Schedule ({generatedEvents.length} events)</h3>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 max-h-[250px] overflow-y-auto space-y-2">
                    {generatedEvents.map((event, idx) => {
                      const project = projects.find(p => p.id === event.projectId);
                      return (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                          <div 
                            className="w-2 h-2 mt-2 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: project?.color || '#cbd5e1' }}
                          />
                          <div>
                            <div className="font-medium text-sm text-slate-800">{event.title}</div>
                            <div className="text-xs text-slate-500">
                              {event.date} • {event.startTime} - {event.endTime}
                            </div>
                            <div className="text-xs text-slate-400 mt-1 flex gap-2">
                               <span>{event.checklist?.length || 0} tasks</span>
                               <span>•</span>
                               <span>{event.contentIdeas?.length || 0} content ideas</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
          {generatedEvents.length > 0 ? (
            <>
              <button
                onClick={() => setGeneratedEvents([])}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleConfirm}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2"
              >
                <CalendarPlus size={18} />
                Add to Calendar
              </button>
            </>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim() || projects.length === 0}
              className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              Generate Plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
};