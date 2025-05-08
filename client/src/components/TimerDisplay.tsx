import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Pause, Play, RotateCcw } from 'lucide-react';
import { TaskTimerState } from '@/hooks/useTimerSystem';

interface TimerDisplayProps {
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
  timerState: TaskTimerState;
  isActive: boolean;
  taskProgress?: { current: number; total: number }; // Add the task progress interface
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onComplete: () => void;
  onUndo: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
}

export default function TimerDisplay({
  task,
  assignment,
  timerState,
  isActive,
  taskProgress,
  onPlay,
  onPause,
  onReset,
  onComplete,
  onUndo,
  onPrevious,
  onNext
}: TimerDisplayProps) {
  // Format time as mm:ss - Define this first before using it!
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Calculate progress percentage based on elapsed time
  const progressPercentage = Math.min(
    Math.round((timerState.timeElapsed / 60 / task.timeAllocation) * 100),
    100
  );
  
  // Log timer state for debugging
  console.log(`Timer display for task ${task.id}:`, {
    timeElapsed: timerState.timeElapsed,
    isActive: timerState.isActive,
    formattedTime: formatTime(timerState.timeElapsed),
    progressPercentage
  });

  // Format total duration
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0
      ? `${hours}h ${mins > 0 ? `${mins}m` : ''}`
      : `${mins}m`;
  };

  return (
    <Card className="border border-primary/10 shadow-sm">
      <div className="p-3">
        {/* Header with task info */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex-grow">
            <div className="flex items-center gap-1">
              {timerState.isCompleted ? (
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              ) : timerState.isActive ? (
                <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
              )}
              <h3 className="text-sm font-medium line-clamp-1">
                {assignment.title}: {task.description}
              </h3>
            </div>
          </div>
          
          <div className="flex-shrink-0 flex items-center gap-1">
            <Badge variant="outline" className="text-[10px] px-2 py-0 h-5">
              {taskProgress ? `${taskProgress.current}/${taskProgress.total}` : "0/0"}
            </Badge>
            
            <Badge variant="outline" className="text-[10px] px-2 py-0 h-5">
              {formatDuration(task.timeAllocation)}
            </Badge>
          </div>
        </div>
        
        {/* Timer display */}
        <div className="flex items-center mb-1">
          <span className="text-xl font-medium text-gray-700">
            {formatTime(timerState.timeElapsed)}
          </span>
          
          {/* Status badge */}
          {timerState.isCompleted ? (
            <Badge variant="outline" className="ml-auto text-xs bg-green-50 text-green-700 border-green-200">
              Completed
            </Badge>
          ) : (
            <Badge variant="outline" className="ml-auto text-xs bg-blue-50 text-blue-700 border-blue-200">
              {timerState.isActive ? "Active" : "Paused"}
            </Badge>
          )}
        </div>
        
        {/* Progress bar */}
        <Progress value={progressPercentage} className="h-2 mb-2" />
        
        {/* Controls in a single row */}
        <div className="flex items-center justify-between gap-1">
          {/* Navigation and action buttons in a single row */}
          <div className="grid grid-cols-4 gap-1 w-full">
            {/* Previous button */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-1 text-xs"
              onClick={onPrevious}
              disabled={!onPrevious}
            >
              <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Prev
            </Button>
            
            {/* Play/Pause button */}
            <Button
              size="sm"
              variant={timerState.isActive ? "outline" : "default"}
              className="h-8 text-xs"
              onClick={timerState.isActive ? onPause : onPlay}
              disabled={timerState.isCompleted}
            >
              {timerState.isActive ? (
                <><Pause className="h-3 w-3 mr-1" /> Pause</>
              ) : (
                <><Play className="h-3 w-3 mr-1" /> Play</>
              )}
            </Button>
            
            {/* Reset button */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={onReset}
              disabled={timerState.timeElapsed === 0 || timerState.isCompleted}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
            
            {/* Next/Complete button */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-1 text-xs"
              onClick={timerState.isCompleted ? onNext : onComplete}
              disabled={!onNext && timerState.isCompleted}
            >
              {timerState.isCompleted ? "Next" : "Complete"}
              <svg className="h-3 w-3 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}