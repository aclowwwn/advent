import React, { useMemo, useState } from 'react';
import startOfMonth from 'date-fns/startOfMonth';
import endOfMonth from 'date-fns/endOfMonth';
import startOfWeek from 'date-fns/startOfWeek';
import endOfWeek from 'date-fns/endOfWeek';
import eachDayOfInterval from 'date-fns/eachDayOfInterval';
import isSameMonth from 'date-fns/isSameMonth';
import isSameDay from 'date-fns/isSameDay';
import format from 'date-fns/format';
import isWithinInterval from 'date-fns/isWithinInterval';
import parse from 'date-fns/parse';
import { Project, CalendarTask } from '../types';
import { CheckCircle2 } from 'lucide-react';

interface CalendarProps {
  currentDate: Date;
  projects: Project[];
  tasks: CalendarTask[];
  onTaskClick: (task: CalendarTask) => void;
  onDayClick?: (date: Date) => void;
  onTaskMove?: (task: CalendarTask, newDate: Date) => void;
}

export const Calendar: React.FC<CalendarProps> = ({
  currentDate,
  projects,
  tasks,
  onTaskClick,
  onDayClick,
  onTaskMove
}) => {
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // Calendar Grid Logic
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  const getTasksForDay = (date: Date) => {
    return tasks.filter(task => isSameDay(task.date, date))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const isTimeNow = (task: CalendarTask): boolean => {
    const now = new Date();
    const taskDate = task.date;

    if (!isSameDay(now, taskDate)) return false;

    const [startH, startM] = task.startTime.split(':').map(Number);
    const [endH, endM] = task.endTime.split(':').map(Number);

    const startTime = new Date(taskDate);
    startTime.setHours(startH, startM, 0);

    const endTime = new Date(taskDate);
    endTime.setHours(endH, endM, 0);

    return isWithinInterval(now, { start: startTime, end: endTime });
  };

  const getTaskStyle = (task: CalendarTask, project: Project | undefined, active: boolean) => {
    const checklist = task.checklist || [];
    const total = checklist.length;
    const completed = checklist.filter(i => i.completed).length;

    // Progress calculation: 
    // If manually marked completed, force 100%. 
    // If no items, assume empty/start state (0%) unless marked completed.
    let progress = total === 0 ? (task.completed ? 1 : 0) : completed / total;
    if (task.completed) progress = 1;

    // Visual Intensity (Alpha):
    // 0% -> 0.15 (Light but visible)
    // 100% -> 1.0 (Full color)
    // Linear interpolation
    const alpha = 0.15 + (progress * 0.85);

    const baseColor = project?.color || '#3b82f6';

    // Convert hex to RRGGBBAA
    const alphaInt = Math.round(alpha * 255);
    const alphaHex = alphaInt.toString(16).padStart(2, '0');
    const colorWithAlpha = `${baseColor}${alphaHex}`;

    // Text Contrast Logic
    // White text if background is dark/opaque enough (>50% opaque)
    // Exception for naturally light colors like Yellow/Gold/Lime where black text is better
    const isLightColor = ['#eab308', '#f97316', '#bef264', '#fde047'].some(c => baseColor.toLowerCase().includes(c));
    const textColor = (alpha > 0.5 && !isLightColor) ? '#ffffff' : '#1e293b';

    return {
      style: {
        backgroundColor: colorWithAlpha,
        color: textColor,
        borderColor: baseColor,
      },
      alpha
    };
  };

  const handleDragEnter = (e: React.DragTask, dateStr: string) => {
    e.prtaskDefault();
    setDragOverDate(dateStr);
  };

  const handleDragLeave = (e: React.DragTask) => {
    e.prtaskDefault();
    // Prtask flickering when dragging over children
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverDate(null);
  };

  const handleDrop = (e: React.DragTask, date: Date) => {
    e.prtaskDefault();
    setDragOverDate(null);
    const taskId = e.dataTransfer.getData('text/plain');
    const task = tasks.find(ev => ev.id === taskId);

    if (task && onTaskMove) {
      onTaskMove(task, date);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
      {/* Header Days */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 auto-rows-fr bg-slate-200 gap-px flex-1">
        {days.map((day, dayIdx) => {
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, currentDate);
          const dayTasks = getTasksForDay(day);
          const dayIso = day.toISOString();
          const isDragTarget = dragOverDate === dayIso;

          // Determine which tasks to show (max 3)
          const activeIndex = dayTasks.findIndex(e => isTimeNow(e));
          let displayTasks = dayTasks;
          const maxVisible = 3;
          let hasMore = false;

          if (dayTasks.length > maxVisible) {
            hasMore = true;
            if (activeIndex !== -1) {
              // Try to center active task: 1 before, active, 1 after
              let start = Math.max(0, activeIndex - 1);
              // Ensure we don't go past the end
              if (start + maxVisible > dayTasks.length) {
                start = Math.max(0, dayTasks.length - maxVisible);
              }
              displayTasks = dayTasks.slice(start, start + maxVisible);
            } else {
              // No active task, just show first 3
              displayTasks = dayTasks.slice(0, maxVisible);
            }
          }

          return (
            <div
              key={dayIso}
              onClick={() => onDayClick && onDayClick(day)}
              onDragOver={(e) => e.prtaskDefault()}
              onDragEnter={(e) => handleDragEnter(e, dayIso)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, day)}
              className={`
                min-h-[120px] bg-white p-2 flex flex-col gap-1 transition-all relative group cursor-pointer
                ${!isCurrentMonth ? 'bg-slate-50/50' : ''}
                ${isToday ? 'z-10 ring-2 ring-inset ring-indigo-500 shadow-xl scale-[1.02] rounded-lg' : isDragTarget ? 'bg-indigo-50 ring-2 ring-inset ring-indigo-300 z-10' : 'hover:bg-slate-50'}
              `}
            >
              {/* Date Number */}
              <div className="flex justify-between items-start mb-1 pointer-tasks-none">
                <span
                  className={`
                    text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                    ${isToday
                      ? 'bg-indigo-600 text-white shadow-md'
                      : isCurrentMonth ? 'text-slate-700' : 'text-slate-400'}
                  `}
                >
                  {format(day, 'd')}
                </span>

                {dayTasks.length > 0 && dayTasks.every(e => e.completed) && (
                  <CheckCircle2 size={14} className="text-green-500 opacity-50" />
                )}
              </div>

              {/* Tasks List */}
              <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                {displayTasks.map((task) => {
                  const project = projects.find(p => p.id === task.projectId);
                  const active = isTimeNow(task);
                  const { style } = getTaskStyle(task, project, active);

                  return (
                    <button
                      key={task.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', task.id);
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskClick(task);
                      }}
                      className={`
                        text-left text-xs px-2 py-1.5 rounded-md truncate font-medium transition-all w-full
                        relative overflow-visible group/task border flex-shrink-0 cursor-grab active:cursor-grabbing
                        ${active ? 'shadow-lg ring-1 ring-white/50 z-20' : 'hover:shadow-sm hover:scale-[1.01] hover:z-10'}
                      `}
                      style={style}
                    >
                      {/* Active Indicator Pulse Bubble */}
                      {active && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3 z-30 pointer-tasks-none">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-white"></span>
                        </span>
                      )}

                      <div className="flex items-center gap-1 pointer-tasks-none">
                        <span className="flex-1 truncate relative z-10">{task.title}</span>
                      </div>
                      <div className="text-[10px] opacity-90 relative z-10 pointer-tasks-none">
                        {task.startTime}
                      </div>
                    </button>
                  );
                })}

                {hasMore && (
                  <div className="text-[10px] text-slate-400 text-center font-medium py-0.5 pointer-tasks-none">
                    + {dayTasks.length - displayTasks.length} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};