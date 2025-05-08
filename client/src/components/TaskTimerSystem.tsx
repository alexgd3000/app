import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useTimerSystem } from '@/hooks/useTimerSystem';
import TimerDisplay from './TimerDisplay';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, ListChecks } from 'lucide-react';

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
    switchToTask
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
  
  // Handle moving to previous task
  const handlePreviousTask = () => {
    if (!hasPreviousTask) return;
    
    const previousTask = sortedSchedule[currentTaskIndex - 1];
    
    // Log the current task timer state before switching
    if (currentTask && timerStates[currentTask.taskId]) {
      console.log('Current task timer state before going back:', 
        { taskId: currentTask.taskId, timeElapsed: timerStates[currentTask.taskId].timeElapsed }
      );
    }
    
    // Log the previous task timer state before switching
    if (timerStates[previousTask.taskId]) {
      console.log('Previous task timer state before going back:',
        { taskId: previousTask.taskId, timeElapsed: timerStates[previousTask.taskId].timeElapsed }
      );
    }
    
    // If previous task was completed, undo its completion
    if (previousTask.completed) {
      console.log('Undoing completion of previous task:', previousTask.taskId);
      undoTaskCompletion(previousTask.taskId, previousTask.id);
    } else {
      console.log('Switching to previous task:', previousTask.taskId);
      switchToTask(previousTask.taskId);
    }
    
    // Log the states after switching
    setTimeout(() => {
      console.log('Timer states after going back:', timerStates);
    }, 100);
  };
  
  // Handle moving to next task
  const handleNextTask = () => {
    if (!hasNextTask) return;
    
    const nextTask = sortedSchedule[currentTaskIndex + 1];
    
    // Log the current task timer state before switching
    if (currentTask && timerStates[currentTask.taskId]) {
      console.log('Current task timer state before switching:', 
        { taskId: currentTask.taskId, timeElapsed: timerStates[currentTask.taskId].timeElapsed }
      );
    }
    
    // Log the next task timer state before switching
    if (timerStates[nextTask.taskId]) {
      console.log('Next task timer state before switching:',
        { taskId: nextTask.taskId, timeElapsed: timerStates[nextTask.taskId].timeElapsed }
      );
    }
    
    // Switch to the next task
    switchToTask(nextTask.taskId);
    
    // Log the states after switching
    setTimeout(() => {
      console.log('Timer states after switching:', timerStates);
    }, 100);
  };
  
  // If there's no current task but there are tasks in the schedule, pick the first uncompleted one
  useEffect(() => {
    if (!currentTask && sortedSchedule.length > 0) {
      const firstUncompleted = sortedSchedule.find(item => !item.completed);
      if (firstUncompleted) {
        switchToTask(firstUncompleted.taskId);
      } else {
        // All tasks are completed, pick the first one
        switchToTask(sortedSchedule[0].taskId);
      }
    }
  }, [currentTask, sortedSchedule]);
  
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
        onPlay={() => startTimer(currentTask.taskId)}
        onPause={() => pauseTimer(currentTask.taskId)}
        onReset={() => resetTimer(currentTask.taskId)}
        onComplete={() => completeTask(currentTask.taskId, currentTask.id)}
        onUndo={() => undoTaskCompletion(currentTask.taskId, currentTask.id)}
        onPrevious={hasPreviousTask ? handlePreviousTask : undefined}
        onNext={hasNextTask ? handleNextTask : undefined}
      />
      
      {/* Remove the task navigation section since we moved it to TimerDisplay */}
      
      {/* Task list */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-100 border-b border-gray-200">
          <h3 className="font-medium text-gray-700">Today's Schedule</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {sortedSchedule.map((item) => {
            const isCurrentTask = item.taskId === currentTask.taskId;
            const timerState = timerStates[item.taskId];
            
            // Format the time
            const startTime = new Date(item.startTime);
            const endTime = new Date(item.endTime);
            const timeString = `${startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            
            return (
              <div 
                key={item.id} 
                className={`p-3 flex items-center cursor-pointer hover:bg-gray-50 transition-colors ${isCurrentTask ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                onClick={() => switchToTask(item.taskId)}
              >
                <div className="flex-1">
                  <div className="flex items-center">
                    {item.completed ? (
                      <Badge variant="outline" className="mr-2 bg-green-50 text-green-700 border-green-200">Completed</Badge>
                    ) : timerState?.isActive ? (
                      <Badge variant="outline" className="mr-2 bg-blue-50 text-blue-700 border-blue-200 animate-pulse">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="mr-2 bg-gray-50 text-gray-700 border-gray-200">Not Started</Badge>
                    )}
                    <span className="text-sm text-gray-500">{timeString}</span>
                  </div>
                  <div className="mt-1 font-medium">
                    {item.task?.description || "Unknown task"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {item.assignment?.title || "Unknown assignment"}
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <div className="text-sm font-medium">
                    {timerState ? (
                      <span className={timerState.timeElapsed > 0 ? 'text-blue-600' : 'text-gray-500'}>
                        {Math.floor(timerState.timeElapsed / 60)}:{(timerState.timeElapsed % 60).toString().padStart(2, '0')}
                      </span>
                    ) : (
                      <span className="text-gray-500">0:00</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    of {Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))} mins
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