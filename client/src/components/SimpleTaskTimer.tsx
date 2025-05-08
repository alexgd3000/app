import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCcw, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import useSound from 'use-sound';
import timerCompleteSound from '@/assets/sounds/timer-complete';

interface SimpleTaskTimerProps {
  task: {
    id: number;
    description: string;
    timeAllocation: number;
    completed: boolean;
    scheduleItemId: number;
  };
  assignment: {
    title: string;
  };
  totalTasks: number;
  currentTaskIndex: number;
  completedTasks: number;
  onComplete: (taskId: number, scheduleItemId: number) => void;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
}

export default function SimpleTaskTimer({
  task,
  assignment,
  totalTasks,
  currentTaskIndex,
  completedTasks,
  onComplete,
  onNavigatePrevious,
  onNavigateNext
}: SimpleTaskTimerProps) {
  // Timer state
  const [isActive, setIsActive] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isCompleted, setIsCompleted] = useState(task.completed);
  const timerRef = useRef<number | null>(null);
  const [playTimerComplete] = useSound(timerCompleteSound);

  // Format time as mm:ss
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle timer start
  const handleStart = useCallback(() => {
    if (!isActive && !isCompleted) {
      setIsActive(true);
    }
  }, [isActive, isCompleted]);

  // Handle timer pause
  const handlePause = useCallback(() => {
    if (isActive) {
      setIsActive(false);
    }
  }, [isActive]);

  // Handle timer reset
  const handleReset = useCallback(() => {
    handlePause();
    setTimeElapsed(0);
  }, [handlePause]);

  // Handle task completion
  const handleComplete = useCallback(() => {
    handlePause();
    setIsCompleted(true);
    playTimerComplete();
    onComplete(task.id, task.scheduleItemId);
  }, [handlePause, onComplete, playTimerComplete, task.id, task.scheduleItemId]);

  // Update timer when active
  useEffect(() => {
    if (isActive) {
      timerRef.current = window.setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive]);

  // Update completed state when task changes
  useEffect(() => {
    setIsCompleted(task.completed);
    
    // Reset active state when switching tasks but keep the elapsed time
    if (isActive) {
      setIsActive(false);
    }
  }, [task.id, task.completed]);

  // Calculate progress percentage
  const progressPercentage = Math.min(
    Math.round((timeElapsed / 60 / task.timeAllocation) * 100),
    100
  );

  // Calculate if there are previous/next tasks
  const hasPrevious = currentTaskIndex > 0;
  const hasNext = currentTaskIndex < totalTasks - 1;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4 space-y-3">
        {/* Assignment and task info */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              {!isCompleted ? (
                <span className="flex items-center gap-1">
                  {assignment.title}: {task.description}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  {assignment.title}: {task.description}
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {completedTasks}/{totalTasks} tasks completed
            </p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600">
              {formatTime(timeElapsed)} / {formatTime(task.timeAllocation * 60)}
            </span>
          </div>
        </div>

        {/* Timer display and progress */}
        <div>
          <div className="text-center mb-1">
            <span className="text-3xl font-bold text-gray-800">
              {formatTime(timeElapsed)}
            </span>
            {isActive && <span className="text-blue-500 ml-2">Running</span>}
            {!isActive && !isCompleted && <span className="text-gray-500 ml-2">Paused</span>}
            {isCompleted && <span className="text-green-500 ml-2">Completed</span>}
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Timer controls */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={isActive ? "outline" : "default"}
            onClick={isActive ? handlePause : handleStart}
            disabled={isCompleted}
            className="flex items-center justify-center"
          >
            {isActive ? (
              <>
                <Pause className="h-4 w-4 mr-2" /> Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" /> Start
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={timeElapsed === 0 || isCompleted}
            className="flex items-center justify-center"
          >
            <RotateCcw className="h-4 w-4 mr-2" /> Reset
          </Button>
          
          <Button
            variant="outline"
            onClick={handleComplete}
            disabled={isCompleted}
            className="flex items-center justify-center bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
          >
            <CheckCircle className="h-4 w-4 mr-2" /> Complete
          </Button>
        </div>

        {/* Navigation controls */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={onNavigatePrevious}
            disabled={!hasPrevious}
            className="flex items-center justify-center"
          >
            <ChevronLeft className="h-4 w-4 mr-2" /> Previous Task
          </Button>
          
          <Button
            variant="outline"
            onClick={onNavigateNext}
            disabled={!hasNext}
            className="flex items-center justify-center"
          >
            Next Task <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Current task indicator */}
        <div className="text-center text-xs text-gray-500">
          Task {currentTaskIndex + 1} of {totalTasks}
        </div>
      </div>
    </div>
  );
}