import React from 'react';
import { CheckCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Task {
  id: number;
  description: string;
  completed: boolean;
  scheduleItemId: number;
  assignmentTitle: string;
  timeAllocation: number;
  startTime: string;
  endTime: string;
}

interface SimpleTaskListProps {
  tasks: Task[];
  activeTaskId: number | null;
  onSelectTask: (taskId: number) => void;
  onToggleTaskCompletion: (taskId: number, scheduleItemId: number, completed: boolean) => void;
}

export default function SimpleTaskList({
  tasks,
  activeTaskId,
  onSelectTask,
  onToggleTaskCompletion
}: SimpleTaskListProps) {
  // Format time as HH:MM AM/PM
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format duration in minutes as "45m" or "1h 15m"
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins > 0 ? mins + 'm' : ''}` : `${mins}m`;
  };

  // Calculate completed tasks count
  const completedTasksCount = tasks.filter(task => task.completed).length;

  return (
    <div className="border rounded-lg shadow-sm overflow-hidden">
      <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Today's Schedule</h3>
        <Badge variant="outline" className="text-xs">
          {completedTasksCount}/{tasks.length} Tasks
        </Badge>
      </div>
      
      <div className="divide-y divide-gray-100">
        {tasks.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No tasks scheduled for today
          </div>
        ) : (
          tasks.map(task => {
            const isActive = task.id === activeTaskId;
            const timeRange = `${formatTime(task.startTime)} - ${formatTime(task.endTime)}`;
            
            return (
              <div
                key={task.id}
                className={`p-3 flex items-center hover:bg-gray-50 cursor-pointer transition-colors ${
                  isActive ? 'bg-blue-50 border-l-2 border-blue-500 pl-2.5' : ''
                }`}
                onClick={() => onSelectTask(task.id)}
              >
                {/* Completion checkbox */}
                <div
                  className="mr-3 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleTaskCompletion(task.id, task.scheduleItemId, !task.completed);
                  }}
                >
                  {task.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300 hover:border-gray-500" />
                  )}
                </div>
                
                {/* Task details */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {task.description}
                  </p>
                  <div className="text-xs text-gray-500 flex items-center">
                    <span className="truncate">{task.assignmentTitle}</span>
                    <span className="mx-1">•</span>
                    <span>{timeRange}</span>
                  </div>
                </div>
                
                {/* Duration */}
                <div className="ml-2 text-xs text-gray-500 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDuration(task.timeAllocation)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}