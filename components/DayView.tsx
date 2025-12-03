import React, { useState, useEffect, useMemo } from 'react';
import format from 'date-fns/format';
import isSameDay from 'date-fns/isSameDay';
import parse from 'date-fns/parse';
import isWithinInterval from 'date-fns/isWithinInterval';
import { ArrowLeft, CheckSquare, Clock, Video, Image as ImageIcon, CircleDashed, CheckCircle2 } from 'lucide-react';
import { Project, CalendarTask } from '../types';

interface DayViewProps {
  date: Date;
  projects: Project[];
  tasks: CalendarTask[];
  onBack: () => void;
  onTaskClick: (task: CalendarTask) => void;
  onUpdateTask: (task: CalendarTask) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  date,
  projects,
  tasks,
  onBack,
  onTaskClick,
  onUpdateTask,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Filter tasks for this day
  const dayTasks = useMemo(() => {
    return tasks.filter(task => 
      isSameDay(parse(task.date, 'yyyy-MM-dd', new Date()), date)
    );
  }, [tasks, date]);

  // Handle default selection: Select current active task ONLY if nothing is selected yet
  useEffect(() => {
    // If we already have a selection that exists in today's tasks, don't change it.
    if (selectedTaskId && dayTasks.some(e => e.id === selectedTaskId)) return;

    const now = new Date();
    const isToday = isSameDay(date, now);
    
    if (isToday) {
      const current = dayTasks.find(e => {
        // Use space instead of T to avoid token conflict in format string
        const start = parse(`${e.date} ${e.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
        const end = parse(`${e.date} ${e.endTime}`, 'yyyy-MM-dd HH:mm', new Date());
        return isWithinInterval(now, { start, end });
      });
      if (current) {
        setSelectedTaskId(current.id);
        return;
      }
    }
    
    // If no current task and no selection, select the first one if available
    if (!selectedTaskId && dayTasks.length > 0) {
      // Optional: select first task of the day?
      // setSelectedTaskId(dayTasks[0].id);
    }
  }, [dayTasks, date, selectedTaskId]);

  const activeTask = useMemo(() => 
    dayTasks.find(e => e.id === selectedTaskId) || null, 
  [dayTasks, selectedTaskId]);

  // --- SVG Math Helpers ---
  const VIEW_SIZE = 340;
  const CENTER = VIEW_SIZE / 2;
  const RADIUS_PM = 120; // Outer ring
  const RADIUS_AM = 80;  // Inner ring
  const STROKE_WIDTH = 30;

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  };

  // Process tasks into visual segments
  const taskSegments = useMemo(() => {
    const segments: any[] = [];

    dayTasks.forEach(task => {
      const [startH, startM] = task.startTime.split(':').map(Number);
      const [endH, endM] = task.endTime.split(':').map(Number);
      
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      const project = projects.find(p => p.id === task.projectId);

      // Helper to push segment
      const addSegment = (isPm: boolean, startMin: number, endMin: number) => {
        // Calculate angles
        let startDeg = ((startMin / 60) % 12) * 30 + (startMin % 60) * 0.5;
        let endDeg = ((endMin / 60) % 12) * 30 + (endMin % 60) * 0.5;
        
        // Handle wrapping at 12 o'clock position (0 deg)
        if (endDeg < startDeg) endDeg += 360;

        segments.push({
          id: task.id,
          task,
          isPm,
          path: describeArc(CENTER, CENTER, isPm ? RADIUS_PM : RADIUS_AM, startDeg, endDeg),
          color: project?.color || '#cbd5e1',
          isActive: isWithinInterval(currentTime, {
            // Use space separator for safe parsing
            start: parse(`${task.date} ${task.startTime}`, 'yyyy-MM-dd HH:mm', new Date()),
            end: parse(`${task.date} ${task.endTime}`, 'yyyy-MM-dd HH:mm', new Date()),
          }),
          duration: endMin - startMin // Used for sorting z-index
        });
      };

      // Split Logic
      if (startMinutes < 720 && endMinutes <= 720) {
        // Pure AM
        addSegment(false, startMinutes, endMinutes);
      } else if (startMinutes >= 720) {
        // Pure PM
        addSegment(true, startMinutes, endMinutes);
      } else {
        // Spans Noon
        addSegment(false, startMinutes, 720); // AM Part
        addSegment(true, 720, endMinutes);   // PM Part
      }
    });

    // Sort segments by duration descending (Longest first, Shortest last)
    // This ensures shorter segments are drawn ON TOP of longer ones, making them clickable
    return segments.sort((a, b) => b.duration - a.duration);
  }, [dayTasks, projects, currentTime]);

  // Visual Styling (Opacity based on completion)
  const getOpacity = (task: CalendarTask) => {
    const total = task.checklist.length;
    const completed = task.checklist.filter(i => i.completed).length;
    if (task.completed) return 1;
    if (total === 0) return 0.2;
    return 0.2 + (completed / total) * 0.8;
  };

  const toggleChecklistItem = (task: CalendarTask, itemId: string) => {
    const updatedChecklist = task.checklist.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    onUpdateTask({ ...task, checklist: updatedChecklist });
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'video': return <Video size={14} className="text-purple-500" />;
      case 'story': return <CircleDashed size={14} className="text-pink-500" />;
      case 'image': return <ImageIcon size={14} className="text-blue-500" />;
      default: return <ImageIcon size={14} className="text-slate-400" />;
    }
  };

  // Clock Hand Position & Background Colors
  const now = new Date();
  const currentHandDegrees = ((now.getHours() % 12) * 30) + (now.getMinutes() * 0.5);
  const isCurrentPm = now.getHours() >= 12;

  // Unified Background Colors (Indigo/Blue Theme)
  // Both use the same hue, but opacity changes based on active time
  const BASE_COLOR_RGB = "99, 102, 241"; // Indigo-500
  const activeRingColor = `rgba(${BASE_COLOR_RGB}, 0.15)`; // More visible
  const inactiveRingColor = `rgba(${BASE_COLOR_RGB}, 0.05)`; // Faint

  const amRingColor = !isCurrentPm ? activeRingColor : inactiveRingColor; 
  const pmRingColor = isCurrentPm ? activeRingColor : inactiveRingColor;

  // Calculate position for the "12" text
  const topTextPos = polarToCartesian(CENTER, CENTER, CENTER - 25, 0);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800 leading-none">
              {format(date, 'EEEE')}
            </h2>
            <p className="text-sm text-indigo-600 font-medium">
              {format(date, 'MMMM do')}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono font-bold text-slate-800 leading-none">
            {format(currentTime, 'h:mm')}
            <span className="text-xs text-slate-400 ml-1">{format(currentTime, 'a')}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center w-full bg-slate-50/50">
        
        {/* Clock Viz */}
        <div className="w-full max-w-[340px] aspect-square relative my-4 flex-shrink-0">
          <svg viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`} className="w-full h-full drop-shadow-xl">
            {/* Clock Face Background */}
            <circle cx={CENTER} cy={CENTER} r={CENTER - 10} fill="white" className="shadow-sm" />
            
            {/* Top "12" Marker Only */}
            <text
              x={topTextPos.x}
              y={topTextPos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-sm font-bold fill-slate-400"
            >
              12
            </text>

            {/* Ring Guides (Background Colors) */}
            <circle cx={CENTER} cy={CENTER} r={RADIUS_PM} fill="none" stroke={pmRingColor} strokeWidth={STROKE_WIDTH} />
            <circle cx={CENTER} cy={CENTER} r={RADIUS_AM} fill="none" stroke={amRingColor} strokeWidth={STROKE_WIDTH} />

            {/* Task Segments */}
            {taskSegments.map((seg, idx) => (
              <g key={`${seg.id}-${idx}`} onClick={() => setSelectedTaskId(seg.id)} className="cursor-pointer hover:opacity-80 transition-opacity">
                {/* Glow for active */}
                {seg.isActive && (
                   <path
                    d={seg.path}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={STROKE_WIDTH + 8}
                    strokeLinecap="round"
                    className="opacity-30 animate-pulse"
                  />
                )}
                {/* Main Arc */}
                <path
                  d={seg.path}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={STROKE_WIDTH}
                  strokeLinecap="round"
                  strokeOpacity={getOpacity(seg.task)}
                />
                {/* Border/Highlight for selected */}
                {seg.id === selectedTaskId && (
                  <path
                    d={seg.path}
                    fill="none"
                    stroke="black"
                    strokeWidth={2}
                    strokeLinecap="round"
                    className="opacity-20"
                    transform="translate(1,1)"
                  />
                )}
              </g>
            ))}

            {/* Clock Hand */}
            <g transform={`rotate(${currentHandDegrees}, ${CENTER}, ${CENTER})`}>
               {/* Hand Line */}
               <line x1={CENTER} y1={CENTER} x2={CENTER} y2={CENTER - RADIUS_PM - 10} stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
               {/* Center Dot */}
               <circle cx={CENTER} cy={CENTER} r="4" fill="#ef4444" />
               {/* End Dot */}
               <circle cx={CENTER} cy={CENTER - RADIUS_PM - 10} r="3" fill="#ef4444" />
            </g>
            
            {/* Center Time Label for selected task context (optional) or just decoration */}
             {activeTask && (
               <text x={CENTER} y={CENTER + 40} textAnchor="middle" className="text-[10px] fill-slate-400 font-medium">
                  {activeTask.startTime}
               </text>
             )}

          </svg>
        </div>

        {/* Selected Task Details Card */}
        <div className="w-full px-4 pb-8 max-w-md">
          {activeTask ? (
            <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
               {/* Card Header */}
               <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                 <div>
                    <span 
                      className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider mb-1"
                      style={{ backgroundColor: projects.find(p => p.id === activeTask.projectId)?.color || '#cbd5e1' }}
                    >
                      {projects.find(p => p.id === activeTask.projectId)?.name}
                    </span>
                    <h3 className="font-bold text-slate-800 leading-tight">{activeTask.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <Clock size={12} />
                      {activeTask.startTime} - {activeTask.endTime}
                    </div>
                 </div>
                 <button onClick={() => onTaskClick(activeTask)} className="text-indigo-600 text-xs font-semibold hover:underline">
                   Edit
                 </button>
               </div>

               {/* Inline Checklist */}
               <div className="p-4 space-y-3">
                 <div className="space-y-2">
                   {activeTask.checklist.map(item => (
                     <div key={item.id} className="flex items-start gap-3 group cursor-pointer" onClick={() => toggleChecklistItem(activeTask, item.id)}>
                        <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${item.completed ? 'bg-green-500 border-green-500' : 'border-slate-300 bg-white'}`}>
                          {item.completed && <CheckSquare size={10} className="text-white" />}
                        </div>
                        <span className={`text-sm flex-1 leading-snug ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                          {item.text}
                        </span>
                     </div>
                   ))}
                   {activeTask.checklist.length === 0 && (
                     <p className="text-xs text-slate-400 italic">No items in checklist.</p>
                   )}
                 </div>

                 {/* Content Ideas Preview */}
                 {activeTask.contentIdeas && activeTask.contentIdeas.length > 0 && (
                   <div className="pt-3 border-t border-slate-100">
                     <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Content Ideas</p>
                     <div className="flex gap-2 overflow-x-auto pb-2">
                       {activeTask.contentIdeas.map(idea => (
                         <div key={idea.id} className="flex-shrink-0 bg-slate-50 border border-slate-100 rounded-lg p-2 w-24 flex flex-col gap-1 items-center text-center">
                           {getIconForType(idea.type)}
                           <span className="text-[10px] text-slate-600 line-clamp-2 leading-tight">{idea.text}</span>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <p className="text-sm">Select a time slot on the dial</p>
              <p className="text-xs opacity-70 mt-1">to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};