import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface TaskTimerProps {
  scheduleItemId: number;
  taskId: number;
  taskDescription: string;
  assignmentTitle: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  isCompleted: boolean;
  onComplete: () => void;
}

export default function TaskTimer({
  scheduleItemId,
  taskId,
  taskDescription,
  assignmentTitle,
  startTime,
  endTime,
  duration,
  isCompleted,
  onComplete
}: TaskTimerProps) {
  const { toast } = useToast();
  const [isActive, setIsActive] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [initialTime] = useState(Date.now());
  const [lastCompletedState, setLastCompletedState] = useState<{
    timeSpent: number;
    isCompleted: boolean;
  } | null>(null);

  // Mutations for updating the task status
  const markCompletedMutation = useMutation({
    mutationFn: async () => {
      // First, mark the schedule item as completed
      const scheduleResponse = await apiRequest(
        "PUT", 
        `/api/schedule/${scheduleItemId}`, 
        { completed: true }
      );
      
      // Then, mark the actual task as completed in the assignment
      const taskResponse = await apiRequest(
        "PUT",
        `/api/tasks/${taskId}`,
        { completed: true, timeSpent: Math.max(Math.round(timeElapsed / 60), 1) }
      );
      
      return {
        scheduleItem: await scheduleResponse.json(),
        task: await taskResponse.json()
      };
    },
    onSuccess: () => {
      toast({
        title: "Task completed",
        description: "Great job! Task marked as completed.",
      });
      
      // Invalidate all relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/schedule'] });
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      
      // Call the parent component's onComplete callback
      onComplete();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Start timer if task is active
  useEffect(() => {
    let interval: number | null = null;
    
    if (isActive && !isCompleted) {
      interval = window.setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, isCompleted]);

  // Calculate progress percentage
  const progressPercentage = Math.min(
    Math.round((timeElapsed / 60 / duration) * 100),
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

  // Handle start/pause button click
  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  // Handle reset button click
  const resetTimer = () => {
    setIsActive(false);
    setTimeElapsed(0);
  };

  // Handle complete button click
  const completeTask = () => {
    markCompletedMutation.mutate();
  };

  return (
    <Card className="p-4 border-2 border-primary/10 shadow-sm">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium flex items-center">
            {isCompleted && (
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            )}
            <span>Current Task</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            {assignmentTitle}: {taskDescription}
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <div>
              <span className="font-medium">Time spent:</span>{" "}
              <Badge variant="outline">{formatTime(timeElapsed)}</Badge>
            </div>
            <div>
              <span className="font-medium">Allocated:</span>{" "}
              <Badge variant="outline">{formatDuration(duration)}</Badge>
            </div>
          </div>
          
          <Progress value={progressPercentage} className="h-2" />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0:00</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>
        
        <div className="flex justify-between">
          <div className="space-x-2">
            {!isCompleted && (
              <>
                <Button
                  size="sm"
                  variant={isActive ? "outline" : "default"}
                  onClick={toggleTimer}
                  disabled={isCompleted}
                >
                  {isActive ? (
                    <>
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-1" />
                      Start
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetTimer}
                  disabled={timeElapsed === 0 || isCompleted}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              </>
            )}
          </div>
          
          {!isCompleted && (
            <Button 
              size="sm" 
              variant="outline"
              className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
              onClick={completeTask}
              disabled={markCompletedMutation.isPending}
            >
              {markCompletedMutation.isPending ? "Saving..." : "Mark Complete"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}