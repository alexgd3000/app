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
  onPlay,
  onPause,
  onReset,
  onComplete,
  onUndo,
  onPrevious,
  onNext
}: TimerDisplayProps) {
  // Calculate progress percentage
  const progressPercentage = Math.min(
    Math.round((timerState.timeElapsed / 60 / task.timeAllocation) * 100),
    100
  );

  // Format time as mm:ss
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

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
          <h3 className="text-lg font-medium flex items-center">
            {timerState.isCompleted && (
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            )}
            <span>Current Task</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            {assignment.title}: {task.description}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <div>
              <span className="font-medium">Time spent:</span>{" "}
              <Badge variant="outline">{formatTime(timerState.timeElapsed)}</Badge>
            </div>
            <div>
              <span className="font-medium">Allocated:</span>{" "}
              <Badge variant="outline">{formatDuration(task.timeAllocation)}</Badge>
            </div>
          </div>

          <Progress value={progressPercentage} className="h-2" />

          {/* Removed redundant time labels */}
        </div>

        {/* Music player style controls */}
        <div className="flex justify-center space-x-3 items-center">
          {/* Previous task button */}
          <Button
            size="icon"
            variant="outline"
            className="rounded-full h-9 w-9"
            title="Previous task"
            onClick={onPrevious}
            disabled={!onPrevious}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1.94976 2.74963C1.94976 2.44573 2.19605 2.19971 2.49976 2.19971C2.80347 2.19971 3.04976 2.44573 3.04976 2.74963V7.24963L13.0498 2.24966C13.2806 2.11496 13.5626 2.12833 13.7824 2.28385C14.0022 2.43938 14.0839 2.70401 13.9863 2.93814L13.9859 2.93902C13.9826 2.94587 13.9789 2.95267 13.975 2.95938C13.9714 2.96563 13.9678 2.97186 13.9641 2.97803L13.0498 4.74963L13.0498 10.2496L13.9641 12.0212C13.9678 12.0274 13.9714 12.0336 13.975 12.0399C13.9789 12.0466 13.9826 12.0534 13.9859 12.0602L13.9863 12.0611C14.0839 12.2952 14.0022 12.5599 13.7824 12.7154C13.5626 12.8709 13.2806 12.8843 13.0498 12.7496L3.04976 7.74963V12.2496C3.04976 12.5535 2.80347 12.7996 2.49976 12.7996C2.19605 12.7996 1.94976 12.5535 1.94976 12.2496V2.74963Z" fill="currentColor" />
            </svg>
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

          {/* Next task button (Mark complete and advance) */}
          <Button
            size="icon"
            variant="outline"
            className="rounded-full h-9 w-9"
            title={timerState.isCompleted ? "Next task" : "Mark complete"}
            onClick={timerState.isCompleted ? onNext : onComplete}
            disabled={!onNext && timerState.isCompleted}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.0502 2.74963C13.0502 2.44573 12.8039 2.19971 12.5002 2.19971C12.1965 2.19971 11.9502 2.44573 11.9502 2.74963V7.24963L1.95022 2.24966C1.71939 2.11496 1.43739 2.12833 1.21758 2.28385C0.997759 2.43938 0.916107 2.70401 1.01371 2.93814L1.01413 2.93902C1.01741 2.94587 1.02113 2.95267 1.02504 2.95938C1.02859 2.96563 1.03223 2.97186 1.03588 2.97803L1.95022 4.74963V10.2496L1.03588 12.0212C1.03223 12.0274 1.02859 12.0336 1.02504 12.0399C1.02113 12.0466 1.01741 12.0534 1.01413 12.0602L1.01371 12.0611C0.916107 12.2952 0.997759 12.5599 1.21758 12.7154C1.43739 12.8709 1.71939 12.8843 1.95022 12.7496L11.9502 7.74963V12.2496C11.9502 12.5535 12.1965 12.7996 12.5002 12.7996C12.8039 12.7996 13.0502 12.5535 13.0502 12.2496V2.74963Z" fill="currentColor" />
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