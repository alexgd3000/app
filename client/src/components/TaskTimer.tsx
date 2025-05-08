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
      
      // Invalidate the specific assignment's tasks to update the UI in the Planner tab
      const taskAssignmentId = data.task.assignmentId;
      if (taskAssignmentId) {
        console.log(`Invalidating tasks for assignment ${taskAssignmentId}`);
        queryClient.invalidateQueries({ queryKey: [`/api/assignments/${taskAssignmentId}/tasks`] });
      }
      
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
      
      // Always save the current time regardless of value
      // This ensures we save zero when the timer is reset
      localStorage.setItem(progressKey, timeElapsed.toString());
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
        const response = await apiRequest("GET", `/api/tasks/${taskId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch task details");
        }
        
        const taskData = await response.json();
        console.log('Received task data:', taskData);
        
        // Check if task has existing timeSpent value
        if (taskData.timeSpent) {
          const timeSpentMin = parseInt(taskData.timeSpent, 10);
          if (!isNaN(timeSpentMin) && timeSpentMin > 0) {
            // Convert minutes to seconds
            const timeSpentSec = timeSpentMin * 60;
            console.log(`Task ${taskId} has existing time spent: ${timeSpentMin} minutes (${timeSpentSec} seconds)`);
          }
        }
        
        // Check if we have progress saved in local storage
        const progressKey = `timer_progress_${taskId}`;
        const savedProgressStr = localStorage.getItem(progressKey);
        console.log(`Saved progress for task ${taskId}:`, savedProgressStr);
        
        if (savedProgressStr) {
          // Parse the saved progress seconds
          const savedProgress = parseInt(savedProgressStr, 10);
          
          if (!isNaN(savedProgress)) {
            console.log(`Found saved progress for task ${taskId}: ${savedProgress} seconds`);
            
            // Use the saved value from local storage
            setTimeElapsed(savedProgress);
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
          )
          .then(response => response.json())
          .then(data => {
            console.log('Auto-save successful:', data);
          })
          .catch(error => {
            console.error('Error in auto-save:', error);
          });
        }
      }, 30000); // 30 seconds
    }
    
    // Clean up intervals when inactive or component unmounts
    return () => {
      if (timerInterval) {
        window.clearInterval(timerInterval);
      }
      if (saveInterval) {
        window.clearInterval(saveInterval);
      }
    };
  }, [isActive, isCompleted, taskId, timeElapsed]);
  
  // Toggle the timer active state
  const toggleTimer = () => {
    setIsActive((prev) => !prev);
  };
  
  // Mutation for resetting the timer
  const resetTimerMutation = useMutation({
    mutationFn: async () => {
      // Simply reset the time spent to 0
      const response = await apiRequest(
        "PUT",
        `/api/tasks/${taskId}`,
        { 
          // Use string to handle zero correctly
          timeSpent: "0" 
        }
      );
      
      const responseData = await response.json();
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
      
      // Invalidate the assignment tasks to update the UI in the Planner tab
      const taskAssignmentId = data.task.assignmentId;
      if (taskAssignmentId) {
        console.log(`Invalidating tasks for assignment ${taskAssignmentId} after timer reset`);
        queryClient.invalidateQueries({ queryKey: [`/api/assignments/${taskAssignmentId}/tasks`] });
      }
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
    // Set local timeElapsed to 0 immediately for better UI response
    setTimeElapsed(0);
    
    // Save the zero value to local storage immediately
    const progressKey = `timer_progress_${taskId}`;
    localStorage.setItem(progressKey, "0");
    console.log(`Immediately saved 0 progress for task ${taskId} to local storage on reset`);
    
    // Then run the mutation to save to server
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
    onSuccess: (data) => {
      toast({
        title: "Task status updated",
        description: "Task marked as not completed.",
      });
      
      // Invalidate all relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/schedule'] });
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      
      // Invalidate the specific assignment's tasks to update the UI in the Planner tab
      const taskAssignmentId = data.task.assignmentId;
      if (taskAssignmentId) {
        console.log(`Invalidating tasks for assignment ${taskAssignmentId} after undo completion`);
        queryClient.invalidateQueries({ queryKey: [`/api/assignments/${taskAssignmentId}/tasks`] });
      }
      
      // Call the parent component's onComplete callback to update the UI
      onComplete();
      
      // Clear the last completed state
      setLastCompletedState(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Format time for display (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Format duration for display (Xh Ym)
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (mins === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${mins}m`;
  };
  
  // Calculate the percentage for the progress bar
  // Based on time elapsed vs allocated time
  const progressPercentage = Math.min(
    100,
    (timeElapsed / (duration * 60)) * 100
  );
  
  return (
    <Card className="overflow-hidden">
      <div className="p-4 space-y-4">
        <div className="space-y-1">
          <h3 className="font-medium">{taskDescription}</h3>
          <div className="text-sm text-muted-foreground">
            {assignmentTitle}
          </div>
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
        
        {/* Clear separation of navigation controls and timer controls */}
        
        {/* SECTION 1: Timer Controls - only affect the timer state */}
        <div className="flex justify-center space-x-3 items-center mb-3 border-b pb-3">
          <Button
            size="icon"
            variant={isActive ? "outline" : "default"}
            className="rounded-full h-11 w-11"
            onClick={toggleTimer}
            disabled={isCompleted}
            title={isActive ? "Pause timer" : "Start timer"}
          >
            {isActive ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>
          
          <Button
            size="sm"
            variant={timeElapsed > 0 ? "secondary" : "ghost"}
            className={`${timeElapsed > 0 ? 'text-xs bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700' : 'text-xs'}`}
            onClick={resetTimer}
            disabled={timeElapsed === 0 || isCompleted || resetTimerMutation.isPending}
            title="Reset timer to 0:00"
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
        </div>
        
        {/* SECTION 2: Task Completion Controls - only affect the task completion state */}
        <div className="flex justify-center mb-3 border-b pb-3">
          <Button
            size="sm"
            variant="outline"
            className={`w-full mx-1 ${isCompleted ? 
              'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border-blue-200' : 
              'bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200'
            }`}
            onClick={isCompleted ? () => undoCompleteMutation.mutate() : () => markCompletedMutation.mutate()}
            disabled={markCompletedMutation.isPending || undoCompleteMutation.isPending}
            title={isCompleted ? "Mark as not completed" : "Mark as completed"}
          >
            {markCompletedMutation.isPending || undoCompleteMutation.isPending ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </>
            ) : isCompleted ? (
              <>
                <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 14L4 9l5-5"></path>
                  <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
                </svg>
                Undo Completion
              </>
            ) : (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Mark as Complete
              </>
            )}
          </Button>
        </div>
        
        {/* SECTION 3: Navigation Controls - only affect which task is displayed */}
        <div className="flex justify-between items-center">
          <Button
            size="sm" 
            variant="outline"
            className="h-9 w-24 flex items-center justify-center"
            onClick={() => {
              if (onPrevious) {
                // Navigation only - no completion logic
                onPrevious();
              }
            }}
            disabled={!onPrevious}
            title="Go to previous task (navigation only)"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
              <path d="M8.84182 3.13514C9.04327 3.32401 9.05348 3.64042 8.86462 3.84188L5.43521 7.49991L8.86462 11.1579C9.05348 11.3594 9.04327 11.6758 8.84182 11.8647C8.64036 12.0535 8.32394 12.0433 8.13508 11.8419L4.38508 7.84188C4.20477 7.64955 4.20477 7.35027 4.38508 7.15794L8.13508 3.15794C8.32394 2.95648 8.64036 2.94628 8.84182 3.13514Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
            Previous
          </Button>
          
          <div className="mx-2 text-sm text-gray-500">
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
          
          <Button
            size="sm"
            variant="outline"
            className="h-9 w-24 flex items-center justify-center"
            onClick={() => {
              if (onNext) {
                // Navigation only - no completion logic
                onNext();
              }
            }}
            disabled={!onNext}
            title="Go to next task (navigation only)"
          >
            Next
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1">
              <path d="M6.1584 3.13508C5.95694 3.32394 5.94673 3.64036 6.1356 3.84182L9.56499 7.49991L6.1356 11.1579C5.94673 11.3594 5.95694 11.6758 6.1584 11.8647C6.35986 12.0535 6.67627 12.0433 6.86514 11.8419L10.6151 7.84182C10.7954 7.64949 10.7954 7.35021 10.6151 7.15788L6.86514 3.15788C6.67627 2.95642 6.35986 2.94621 6.1584 3.13508Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
          </Button>
        </div>
      </div>
    </Card>
  );
}