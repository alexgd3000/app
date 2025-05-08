import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, CheckCircle, Undo as UndoIcon } from "lucide-react";
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
  onPrevious?: () => void; // Optional callback for previous task button
  onNext?: () => void; // Optional callback for next task button
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
  onComplete,
  onPrevious,
  onNext
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
      // Calculate the time spent without enforcing minimum
      const timeSpentMinutes = Math.round(timeElapsed / 60);
      console.log(`Completing task ${taskId} with ${timeSpentMinutes} minutes spent`);
      
      // First, mark the schedule item as completed
      const scheduleResponse = await apiRequest(
        "PUT", 
        `/api/schedule/${scheduleItemId}`, 
        { completed: true }
      );
      
      // Then, mark the actual task as completed in the assignment
      // and save the time spent to preserve progress
      const taskResponse = await apiRequest(
        "PUT",
        `/api/tasks/${taskId}`,
        { 
          completed: true, 
          // Use string format for consistent handling
          timeSpent: timeSpentMinutes.toString()
        }
      );
      
      // Parse the response data
      const scheduleItem = await scheduleResponse.json();
      const task = await taskResponse.json();
      
      console.log("Complete task response:", { scheduleItem, task, timeSpentMinutes });
      
      return {
        scheduleItem,
        task,
        timeSpentMinutes
      };
    },
    onSuccess: (data) => {
      // Clear local storage saved progress when we complete a task
      // since we've now properly saved the state to the server
      const progressKey = `timer_progress_${taskId}`;
      localStorage.removeItem(progressKey);
      console.log(`Cleared saved progress for task ${taskId} from local storage (task completed)`);
      
      toast({
        title: "Task completed",
        description: `Great job! Task marked as completed (${data.timeSpentMinutes} mins spent).`,
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

  // Save current timer progress before leaving a task
  const saveTimerProgressToStorage = () => {
    if (taskId) {
      // Store the current time elapsed for this task in local storage
      const progressKey = `timer_progress_${taskId}`;
      console.log(`Saving timer progress for task ${taskId}: ${timeElapsed} seconds`);
      
      // Only save if there's actual progress (non-zero)
      if (timeElapsed > 0) {
        localStorage.setItem(progressKey, timeElapsed.toString());
      }
    }
  };
  
  // Update time elapsed when a task is first loaded or when taskId changes
  useEffect(() => {
    // First, save the current task progress before switching
    saveTimerProgressToStorage();
    
    // Reset active state when switching tasks
    setIsActive(false);
    
    // Reset last completed state
    setLastCompletedState(null);
    
    // When a task is loaded, check if it has spent time already
    const fetchTaskDetails = async () => {
      try {
        console.log(`Fetching task details for task ID: ${taskId}`);
        const response = await fetch(`/api/tasks/${taskId}`);
        if (response.ok) {
          const taskData = await response.json();
          console.log(`Task data loaded:`, taskData);
          
          // Important: handle timeSpent explicitly to account for zero values
          // Be very explicit about the value we're using to avoid conversion issues
          const timeSpentMinutes = taskData.timeSpent === 0 ? 0 : (taskData.timeSpent || 0);
          
          // First, check if we have a saved progress in local storage
          const progressKey = `timer_progress_${taskId}`;
          const savedProgress = localStorage.getItem(progressKey);
          let timeSpentSeconds = timeSpentMinutes * 60;
          
          // If we have locally saved progress that's greater than the server value, use that instead
          if (savedProgress) {
            const savedProgressSeconds = parseInt(savedProgress, 10);
            console.log(`Found saved progress for task ${taskId}: ${savedProgressSeconds} seconds`);
            
            // Choose the larger value between saved progress and server value
            if (savedProgressSeconds > timeSpentSeconds) {
              console.log(`Using saved progress (${savedProgressSeconds}s) instead of server value (${timeSpentSeconds}s)`);
              timeSpentSeconds = savedProgressSeconds;
            }
          }
          
          console.log(`Setting time elapsed to: ${timeSpentSeconds} seconds (${Math.round(timeSpentSeconds / 60)} minutes)`);
          
          // Always explicitly set the time elapsed
          setTimeElapsed(timeSpentSeconds);
          
          // Set completed state if already completed
          if (taskData.completed) {
            setLastCompletedState({
              timeSpent: timeSpentSeconds,
              isCompleted: true
            });
          }
        }
      } catch (error) {
        console.error("Error fetching task details:", error);
      }
    };
    
    // Always fetch task details when switching tasks
    fetchTaskDetails();
    
    // Save progress when component unmounts or task changes
    return () => {
      saveTimerProgressToStorage();
    };
  }, [taskId]);
  
  // Start timer if task is active and save progress periodically
  useEffect(() => {
    let timerInterval: number | null = null;
    let saveInterval: number | null = null;
    
    if (isActive && !isCompleted) {
      // Update timer every second
      timerInterval = window.setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
      
      // Save progress to API every 30 seconds
      saveInterval = window.setInterval(() => {
        // Only save if timer is active and the task isn't completed
        if (isActive && !isCompleted) {
          // Don't enforce minimum value - allow zero values
          const timeSpentMinutes = Math.round(timeElapsed / 60);
          
          console.log(`Auto-saving task progress for task ${taskId}: ${timeSpentMinutes} minutes`);
          
          // Save current progress to the task
          apiRequest(
            "PUT",
            `/api/tasks/${taskId}`,
            { 
              // Use string format for consistent handling with zero values
              timeSpent: timeSpentMinutes.toString() 
            }
          ).then(() => {
            console.log(`Auto-saved task timer progress: ${timeSpentMinutes} minutes`);
          }).catch(error => {
            console.error("Failed to auto-save timer progress:", error);
          });
        }
      }, 30000); // Save every 30 seconds
    }
    
    return () => {
      // Clean up both intervals
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      if (saveInterval) {
        clearInterval(saveInterval);
      }
    };
  }, [isActive, isCompleted, taskId, timeElapsed]);

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

  // Reset timer mutation to reset the progress in the database
  const resetTimerMutation = useMutation({
    mutationFn: async () => {
      console.log("Resetting timer for task:", taskId);
      
      // Store the value we're trying to set to help with debugging
      const valueToSet = 0;
      console.log("Setting timeSpent to:", valueToSet);
      
      // Reset the task timeSpent in database to 0 - use "0" string to ensure it's treated as explicit zero
      const taskResponse = await apiRequest(
        "PUT",
        `/api/tasks/${taskId}`,
        { 
          timeSpent: "0" // Use string "0" to ensure it's properly handled by the server
        }
      );
      
      const responseData = await taskResponse.json();
      console.log("Reset response data:", responseData);
      
      return {
        task: responseData
      };
    },
    onSuccess: (data) => {
      console.log("Reset success, returned task:", data.task);
      
      // Check the value that was actually set
      console.log("Task timeSpent after reset:", data.task.timeSpent);
      
      // Reset the UI timer state
      setIsActive(false);
      setTimeElapsed(0);
      setLastCompletedState(null);
      
      // Also clear the local storage saved progress
      const progressKey = `timer_progress_${taskId}`;
      localStorage.removeItem(progressKey);
      console.log(`Cleared saved progress for task ${taskId} from local storage`);
      
      toast({
        title: "Timer reset",
        description: "Timer progress has been reset to zero.",
      });
      
      // Refresh assignments to show the updated timeSpent
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      
      // Force refresh the current task data
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}`] });
    },
    onError: (error: Error) => {
      console.error("Error resetting timer:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle reset button click
  const resetTimer = () => {
    resetTimerMutation.mutate();
  };

  // Handle complete button click
  const completeTask = () => {
    // Store the current state before completing the task to enable undoing
    setLastCompletedState({
      timeSpent: timeElapsed,
      isCompleted: false
    });
    markCompletedMutation.mutate();
  };
  
  // Mutation for undoing a task completion
  const undoCompleteMutation = useMutation({
    mutationFn: async () => {
      // First, mark the schedule item as not completed
      const scheduleResponse = await apiRequest(
        "PUT", 
        `/api/schedule/${scheduleItemId}`, 
        { completed: false }
      );
      
      // Then, mark the task as not completed in the assignment
      // Keep the timeSpent value to preserve progress
      const timeToRestore = lastCompletedState ? Math.round(lastCompletedState.timeSpent / 60) : 0;
      console.log(`Restoring time for task ${taskId} to ${timeToRestore} minutes`);
      
      const taskResponse = await apiRequest(
        "PUT",
        `/api/tasks/${taskId}`,
        { 
          completed: false,
          // Use string format for consistent handling with zero values
          timeSpent: timeToRestore.toString()
        }
      );
      
      return {
        scheduleItem: await scheduleResponse.json(),
        task: await taskResponse.json()
      };
    },
    onSuccess: () => {
      // Restore the previous time elapsed state
      if (lastCompletedState) {
        setTimeElapsed(lastCompletedState.timeSpent);
      }
      
      toast({
        title: "Task status reset",
        description: "Task has been marked as in progress again.",
      });
      
      // Invalidate all relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/schedule'] });
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      
      // Call the parent component's onComplete callback to update the UI
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
  
  // Handle undo complete button click
  const undoCompleteTask = () => {
    undoCompleteMutation.mutate();
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
        
        {/* Music player style controls */}
        <div className="flex justify-center space-x-3 items-center">
          {/* Previous task button - always goes to previous task */}
          <Button
            size="icon"
            variant="outline"
            className="rounded-full h-9 w-9"
            title="Previous task"
            onClick={() => {
              if (onPrevious) {
                // Always just navigate to the previous task
                // The parent component will handle uncompleting it
                onPrevious();
              }
            }}
            disabled={undoCompleteMutation.isPending || !onPrevious}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1.94976 2.74963C1.94976 2.44573 2.19605 2.19971 2.49976 2.19971C2.80347 2.19971 3.04976 2.44573 3.04976 2.74963V7.24963L13.0498 2.24966C13.2806 2.11496 13.5626 2.12833 13.7824 2.28385C14.0022 2.43938 14.0839 2.70401 13.9863 2.93814L13.9859 2.93902C13.9826 2.94587 13.9789 2.95267 13.975 2.95938C13.9714 2.96563 13.9678 2.97186 13.9641 2.97803L13.0498 4.74963L13.0498 10.2496L13.9641 12.0212C13.9678 12.0274 13.9714 12.0336 13.975 12.0399C13.9789 12.0466 13.9826 12.0534 13.9859 12.0602L13.9863 12.0611C14.0839 12.2952 14.0022 12.5599 13.7824 12.7154C13.5626 12.8709 13.2806 12.8843 13.0498 12.7496L3.04976 7.74963V12.2496C3.04976 12.5535 2.80347 12.7996 2.49976 12.7996C2.19605 12.7996 1.94976 12.5535 1.94976 12.2496V2.74963Z" fill="currentColor" />
            </svg>
          </Button>
          
          {/* Play/Pause button */}
          <Button
            size="icon"
            variant={isActive ? "outline" : "default"}
            className="rounded-full h-11 w-11"
            onClick={toggleTimer}
            disabled={isCompleted}
          >
            {isActive ? (
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
            title="Next task (Mark complete)"
            onClick={() => {
              if (!isCompleted) {
                // If not completed, mark as complete
                completeTask();
              } else if (onNext) {
                // If already completed, go to next task
                onNext();
              }
            }}
            disabled={markCompletedMutation.isPending}
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
            variant={timeElapsed > 0 ? "secondary" : "ghost"}
            className={`${timeElapsed > 0 ? 'text-xs bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700' : 'text-xs'}`}
            onClick={resetTimer}
            disabled={timeElapsed === 0 || isCompleted || resetTimerMutation.isPending}
          >
            {resetTimerMutation.isPending ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Resetting...
              </>
            ) : (
              <>
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset Timer
              </>
            )}
          </Button>
          
          {isCompleted ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completed
            </Badge>
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