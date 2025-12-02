import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Project, PRESET_COLORS } from '../types';
import { api } from '../services/api';

interface ProjectManagerProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({ projects, setProjects }) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].value);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddProject = async () => {
    if (!newProjectName.trim()) return;
    setIsSubmitting(true);
    try {
      const newProject: Project = {
        id: crypto.randomUUID(),
        name: newProjectName,
        color: selectedColor,
      };
      
      const created = await api.createProject(newProject);
      setProjects(prev => [...prev, created]);
      
      setNewProjectName('');
      setIsAdding(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    // if(!confirm("Delete this project?")) return;
    try {
      await api.deleteProject(id);
      setProjects(prev => prev.filter((p) => p.id !== id));
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800">Projects</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
        >
          <Plus size={16} /> New Project
        </button>
      </div>

      <div className="space-y-3">
        {projects.map((project) => (
          <div key={project.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 group">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full shadow-sm"
                style={{ backgroundColor: project.color }}
              />
              <span className="font-medium text-slate-700">{project.name}</span>
            </div>
            <button
              onClick={() => handleDeleteProject(project.id)}
              className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        {projects.length === 0 && !isAdding && (
          <p className="text-sm text-slate-400 italic text-center py-4">
            No projects defined yet. Start by adding one!
          </p>
        )}

        {isAdding && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-blue-800 mb-1">Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g., Holiday Baking"
                  className="w-full px-3 py-2 text-sm border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder-slate-400"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-blue-800 mb-1">Color Code</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setSelectedColor(c.value)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        selectedColor === c.value ? 'scale-110 ring-2 ring-offset-2 ring-blue-600' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleAddProject}
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white text-sm py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Add Project'}
                </button>
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
