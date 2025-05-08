import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useTimerSystem } from '@/hooks/useTimerSystem';
import { apiRequest } from '@/lib/queryClient';
import TimerDisplay from './TimerDisplay';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, ListChecks, CheckCircle } from 'lucide-react';

interface TaskTimerSystemProps {
  scheduleData: any[];
  onRefresh: () => void;
}

export default function TaskTimerSystem({ scheduleData, onRefresh }: TaskTimerSystemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get all schedule items sorted by start time
  const sortedSchedule = [...scheduleData].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  
  // Initialize timer system
  const {
    timerStates,
    activeTaskId,
    startTimer,
    pauseTimer,
    resetTimer,
    completeTask,
    undoTaskCompletion,
    switchToTask,
    resetAllTimers
  } = useTimerSystem({
    scheduleData,
    onTimerComplete: () => {
      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['/api/schedule'] });
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      onRefresh();
    }
  });
  
  // Find the currently active task in the schedule
  const currentTask = activeTaskId
    ? scheduleData.find(item => item.taskId === activeTaskId)
    : null;
  
  // Get the current task index in the sorted schedule
  const currentTaskIndex = currentTask
    ? sortedSchedule.findIndex(item => item.id === currentTask.id)
    : -1;
  
  // Determine if there are previous/next tasks
  const hasPreviousTask = currentTaskIndex > 0;
  const hasNextTask = currentTaskIndex < sortedSchedule.length - 1 && currentTaskIndex !== -1;
  
  // Simple navigation to previous task - no completion logic
  const handlePreviousTask = () => {
    if (!hasPreviousTask) return;
    
    const previousTask = sortedSchedule[currentTaskIndex - 1];
    
    // Log the current and previous task states for debugging
    console.log('Navigating to previous task:', previousTask.taskId);
    
    // Simply switch to the previous task
    switchToTask(previousTask.taskId);
  };
  
  // Simple navigation to next task - no completion logic
  const handleNextTask = () => {
    if (!hasNextTask) return;
    
    const nextTask = sortedSchedule[currentTaskIndex + 1];
    
    // Log the navigation
    console.log('Navigating to next task:', nextTask.taskId);
    
    // Simply switch to the next task
    switchToTask(nextTask.taskId);
  };
  
  // If there's no current task but there are tasks in the schedule, pick the first one
  // This only runs on initial load, not when switching between tasks
  useEffect(() => {
    // We only want to auto-select a task when the component first renders
    // and there's no active task yet - not when switching between tasks
    if (!currentTask && sortedSchedule.length > 0 && activeTaskId === null) {
      console.log('No active task - selecting initial task');
      
      // Always pick the first task in chronological order
      switchToTask(sortedSchedule[0].taskId);
    }
  }, [sortedSchedule.length]);
  
  // If no schedule data or active task, show empty state
  if (!currentTask || scheduleData.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <div className="text-gray-400 mb-4">
            <ListChecks className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No active tasks</h3>
          <p className="mt-1 text-sm text-gray-500">Generate a schedule to start working on tasks</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Timer display for current task */}
      <TimerDisplay
        task={{
          id: currentTask.taskId,
          description: currentTask.task ? currentTask.task.description : "Unknown task",
          timeAllocation: Math.round((new Date(currentTask.endTime).getTime() - new Date(currentTask.startTime).getTime()) / (1000 * 60)),
          completed: currentTask.completed,
          scheduleItemId: currentTask.id
        }}
        assignment={{
          title: currentTask.assignment ? currentTask.assignment.title : "Unknown assignment"
        }}
        timerState={timerStates[currentTask.taskId]}
        isActive={activeTaskId === currentTask.taskId}
        taskProgress={{ 
          current: currentTaskIndex + 1, 
          total: sortedSchedule.length 
        }}
        completedTasksCount={sortedSchedule.filter(item => item.completed).length}
        onPlay={() => startTimer(currentTask.taskId)}
        onPause={() => pauseTimer(currentTask.taskId)}
        onReset={() => resetTimer(currentTask.taskId)}
        onComplete={() => completeTask(currentTask.taskId, currentTask.id)}
        onUndo={() => undoTaskCompletion(currentTask.taskId, currentTask.id, true)}
        onPrevious={hasPreviousTask ? handlePreviousTask : undefined}
        onNext={hasNextTask ? handleNextTask : undefined}
      />
      
      {/* Remove the task navigation section since we moved it to TimerDisplay */}
      
      {/* Task list - more compact version */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="px-3 py-2 bg-gray-50 border-b flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Today's Schedule</h3>
          <Badge variant="outline" className="text-xs">
            {sortedSchedule.filter(item => item.completed).length}/{sortedSchedule.length} Tasks
          </Badge>
        </div>
        <div className="divide-y divide-gray-100">
          {sortedSchedule.map((item) => {
            const isCurrentTask = item.taskId === currentTask.taskId;
            const timerState = timerStates[item.taskId];
            
            // Format the time
            const startTime = new Date(item.startTime);
            const endTime = new Date(item.endTime);
            const timeString = `${startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            const durationMins = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
            
            return (
              <div 
                key={item.id} 
                className={`px-3 py-2 flex items-center cursor-pointer hover:bg-gray-50 transition-colors ${
                  isCurrentTask ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                }`}
                onClick={() => switchToTask(item.taskId)}
              >
                {/* Status indicator - made clickable */}
                <div 
                  className="mr-2 flex-shrink-0 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the parent div's onClick
                    if (item.completed) {
                      // Mark as incomplete but don't navigate
                      undoTaskCompletion(item.taskId, item.id, false);
                    } else {
                      // Mark as complete but don't navigate
                      completeTask(item.taskId, item.id);
                    }
                  }}
                  title={item.completed ? "Mark as incomplete" : "Mark as complete"}
                >
                  {item.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-500 hover:text-green-600" />
                  ) : timerState?.isActive ? (
                    <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse hover:bg-blue-600" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300 hover:border-gray-500 hover:bg-gray-100" />
                  )}
                </div>
                
                {/* Task info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.task?.description || "Unknown task"}
                    </p>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 mt-0.5">
                    <span className="truncate">{item.assignment?.title || "Unknown assignment"}</span>
                    <span className="mx-1">•</span>
                    <span>{timeString}</span>
                  </div>
                </div>
                
                {/* Timer */}
                <div className="ml-2 flex-shrink-0 text-right">
                  <div className="flex items-center">
                    <span className={`text-sm font-medium ${timerState?.timeElapsed > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                      {timerState ? 
                        `${Math.floor(timerState.timeElapsed / 60)}:${(timerState.timeElapsed % 60).toString().padStart(2, '0')}` :
                        '0:00'
                      }
                    </span>
                    <span className="text-xs text-gray-400 ml-1">/{durationMins}m</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}