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
  completedTasksCount: number;
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
  completedTasksCount,
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

  // Format total duration in mm:ss format
  const formatDuration = (minutes: number): string => {
    return `${Math.floor(minutes / 60)}:${(minutes % 60).toString().padStart(2, '0')}`;
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
              {taskProgress ? `${completedTasksCount}/${taskProgress.total}` : "0/0"}
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
        
        {/* Controls */}
        <div className="space-y-2">
          {/* Timer controls */}
          <div className="grid grid-cols-3 gap-1">
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
                <><Play className="h-3 w-3 mr-1" /> Start</>
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
            
            {/* Toggle completion button with softer colors */}
            <Button
              size="sm"
              variant="outline"
              className={`h-8 text-xs ${timerState.isCompleted ? 
                'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border-blue-200' : 
                'bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200'
              }`}
              onClick={timerState.isCompleted ? onUndo : onComplete}
            >
              {timerState.isCompleted ? (
                <><svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 14L4 9l5-5"></path>
                  <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
                </svg> Undo</>
              ) : (
                <><CheckCircle className="h-3 w-3 mr-1" /> Complete</>
              )}
            </Button>
          </div>
          
          {/* Navigation controls - separate row */}
          <div className="flex justify-between gap-1 border-t pt-2">
            <Button
              size="sm" 
              variant="outline"
              className="h-8 px-2 text-xs flex-1"
              onClick={onPrevious}
              disabled={!onPrevious}
            >
              <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Previous Task
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2 text-xs flex-1"
              onClick={onNext}
              disabled={!onNext}
            >
              Next Task
              <svg className="h-3 w-3 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Button>
          </div>
          
          {/* Task progress indicator */}
          {taskProgress && (
            <div className="text-xs text-center text-gray-500">
              Task {taskProgress.current} of {taskProgress.total}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}