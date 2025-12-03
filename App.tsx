import React, { useState, useEffect } from 'react';
import { ProjectManager } from './components/ProjectManager';
import { Calendar } from './components/Calendar';
import { DayView } from './components/DayView';
import { AIPlannerModal } from './components/AIPlannerModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { Project, CalendarTask, PRESET_COLORS } from './types';
import { Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { api } from './services/api';

type ViewMode = 'month' | 'day';

const App: React.FC = () => {
  // --- State ---
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    // Default to December of current year
    return new Date(now.getFullYear(), 11, 1);
  });

  const [view, setView] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null);

  // --- Initial Data Load ---
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [loadedProjects, loadedTasks] = await Promise.all([
          api.getProjects(),
          api.getTasks()
        ]);

        if (loadedProjects.length === 0) {
          // Initialize default projects if none exist
          const defaults = [
            { id: '1', name: 'Holiday Baking', color: PRESET_COLORS[0].value },
            { id: '2', name: 'Gift Shopping', color: PRESET_COLORS[1].value },
            { id: '3', name: 'Home Decoration', color: PRESET_COLORS[3].value },
          ];
          // We only save these locally if we are in local mode, or we can just set state
          setProjects(defaults);
          // Optional: Persist defaults to backend immediately? 
          // For now, we just set state so the user sees them.
        } else {
          setProjects(loadedProjects);
        }
        setTasks(loadedTasks);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Timer for pulsating UI
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  // --- Handlers ---

  // Projects
  const handleUpdateProjects = async (newProjects: Project[]) => {
    // Determine diff to see if add/delete (simplistic approach)
    // For a real app, ProjectManager should bubble up specific actions (add/delete)
    // Here we just sync state for now, but ProjectManager needs refactoring to call API directly
    // OR we assume ProjectManager calls setProjects which we intercept? 
    // Actually, passing `setProjects` to ProjectManager directly bypasses the API layer in this structure.
    // To fix this properly, ProjectManager should take "onAdd" and "onDelete" props.
    // For this refactor, we will rely on the fact that ProjectManager calls setProjects.
    // We will wrap the setter passed to it.
    setProjects(newProjects);
  };

  // Tasks
  const handleAddTasks = async (newTasks: CalendarTask[]) => {
    // Optimistic Update
    setTasks(prev => [...prev, ...newTasks]);
    // API Call
    for (const task of newTasks) {
      const jsDate = new Date(task.date);
      if (Number.isNaN(jsDate.getTime())) {
        console.error("Invalid date format");
        return;
      }
      task.date = jsDate;
      await api.createTask(task);
    }
  };

  const handleUpdateTask = async (updatedTask: CalendarTask) => {
    // Optimistic
    const jsDate = new Date(updatedTask.date);
    if (Number.isNaN(jsDate.getTime())) {
      console.error("Invalid date format");
      return;
    }
    updatedTask.date = jsDate;

    setTasks(prev => prev.map(e => e.id === updatedTask.id ? updatedTask : e));
    if (selectedTask && selectedTask.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }
    // API
    await api.updateTask(updatedTask);
  };

  const handleMoveTask = async (task: CalendarTask, newDate: Date) => {
    const updatedTask = { ...task, date: newDate };
    handleUpdateTask(updatedTask);
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(e => e.id !== taskId));
    setSelectedTask(null);
    await api.deleteTask(taskId);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setView('day');
  };

  const currentProject = selectedTask ? projects.find(p => p.id === selectedTask.projectId) : undefined;

  return (
    <div className="min-h-screen bg-slate-50 pb-12 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-red-600 p-2 rounded-lg text-white">
                <CalendarIcon size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 leading-none">December Planner</h1>
                <p className="text-xs text-slate-500 font-medium">
                  {view === 'month' ? format(currentDate, 'MMMM yyyy') : format(selectedDate, 'MMMM yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAIModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Sparkles size={16} />
                <span>AI Planner</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            <div className="lg:col-span-3 space-y-6 hidden lg:block">
              <ProjectManager
                projects={projects}
                setProjects={(val) => {
                  // Intercept setState to call API
                  if (typeof val === 'function') {
                    const newVal = val(projects);
                    // Determine change type is hard here without refactoring ProjectManager completely
                    // For now, we allow the ProjectManager to be "dumb" and just persist the whole list via side-effect
                    // BUT ProjectManager uses crypto.randomUUID(), so we should ideally move that logic out.
                    // For this step, let's keep it simple: ProjectManager updates state, we create wrapper component?
                    // No, let's just make ProjectManager accept generic onAdd/onDelete.
                    // Since I can't edit ProjectManager easily in this single step without making it verbose, 
                    // I will update ProjectManager in the next file block to use the API directly.
                    setProjects(newVal);
                  } else {
                    setProjects(val);
                  }
                }}
              />

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Progress</h3>
                <div className="space-y-4">
                  {projects.map(p => {
                    const pTasks = tasks.filter(e => e.projectId === p.id);
                    const total = pTasks.length;

                    if (total === 0) return null;

                    let totalCompletionScore = 0;

                    pTasks.forEach(e => {
                      if (e.completed) {
                        totalCompletionScore += 1;
                      } else if (e.checklist && e.checklist.length > 0) {
                        const checked = e.checklist.filter(i => i.completed).length;
                        totalCompletionScore += (checked / e.checklist.length);
                      }
                    });

                    const percent = Math.round((totalCompletionScore / total) * 100);
                    const displayPercent = Math.min(100, Math.max(0, percent));

                    return (
                      <div key={p.id}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-slate-600">{p.name}</span>
                          <span className="text-slate-400">{displayPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${displayPercent}%`, backgroundColor: p.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {tasks.length === 0 && <p className="text-xs text-slate-400">No tasks scheduled yet.</p>}
                </div>
              </div>
            </div>

            <div className="lg:col-span-9 h-[calc(100vh-8rem)]">
              {view === 'month' ? (
                <Calendar
                  currentDate={currentDate}
                  projects={projects}
                  tasks={tasks}
                  onTaskClick={setSelectedTask}
                  onDayClick={handleDayClick}
                  onTaskMove={handleMoveTask}
                />
              ) : (
                <DayView
                  date={selectedDate}
                  projects={projects}
                  tasks={tasks}
                  onBack={() => setView('month')}
                  onTaskClick={setSelectedTask}
                  onUpdateTask={handleUpdateTask}
                />
              )}
            </div>
          </div>
        )}
      </main>

      <AIPlannerModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        projects={projects}
        onAddTasks={handleAddTasks}
      />

      <TaskDetailModal
        task={selectedTask}
        project={currentProject}
        onClose={() => setSelectedTask(null)}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
      />
    </div>
  );
};

export default App;
