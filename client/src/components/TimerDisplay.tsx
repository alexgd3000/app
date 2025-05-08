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
    <Card className="p-4 border-2 border-primary/10 shadow-sm">
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium flex items-center">
              {timerState.isCompleted && (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              )}
              <span>Current Task</span>
            </h3>
            <Badge variant="outline" className="px-3 py-1">
              {taskProgress ? 
                `${taskProgress.current} of ${taskProgress.total}` : 
                "0 of 0"
              }
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {assignment.title}: {task.description}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <div className="text-lg font-medium text-gray-700">
              {formatTime(timerState.timeElapsed)}
            </div>
            <div>
              <Badge variant="outline">{formatDuration(task.timeAllocation)}</Badge>
            </div>
          </div>

          <Progress value={progressPercentage} className="h-2" />

          {/* Removed redundant time labels */}
        </div>

        {/* Task controls with play/pause button in center */}
        <div className="flex justify-center space-x-3 items-center">
          {/* Previous task button */}
          <Button
            variant="outline"
            className="justify-start"
            onClick={onPrevious}
            disabled={!onPrevious}
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Previous Task
          </Button>
          
          {/* Play/Pause button */}
          <Button
            size="icon"
            variant={timerState.isActive ? "outline" : "default"}
            className="rounded-full h-11 w-11"
            onClick={timerState.isActive ? onPause : onPlay}
            disabled={timerState.isCompleted}
          >
            {timerState.isActive ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>
          
          {/* Next task or complete button */}
          <Button
            variant="outline"
            className="justify-end"
            onClick={timerState.isCompleted ? onNext : onComplete}
            disabled={!onNext && timerState.isCompleted}
          >
            {timerState.isCompleted ? "Next Task" : "Mark Complete"}
            <svg className="h-4 w-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </Button>
        </div>

        {/* Bottom controls */}
        <div className="flex justify-between items-center">
          <Button
            size="sm"
            variant={timerState.timeElapsed > 0 ? "secondary" : "ghost"}
            className={`${timerState.timeElapsed > 0 ? 'text-xs bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700' : 'text-xs'}`}
            onClick={onReset}
            disabled={timerState.timeElapsed === 0 || timerState.isCompleted}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset Timer
          </Button>

          {timerState.isCompleted ? (
            <Button
              size="sm"
              variant="outline"
              className="text-xs bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700"
              onClick={onUndo}
            >
              Undo Complete
            </Button>
          ) : (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              In Progress
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}