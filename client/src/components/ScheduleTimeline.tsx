import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Task } from "@shared/schema";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import TaskTimer from "./TaskTimer";

interface ScheduleTimelineProps {
  isLoading: boolean;
  scheduleData: any[];
  onRefresh: () => void;
}

export default function ScheduleTimeline({ isLoading, scheduleData, onRefresh }: ScheduleTimelineProps) {
  const { toast } = useToast();
  const [availableHours, setAvailableHours] = useState<string>('');
  const [availableMinutes, setAvailableMinutes] = useState<string>('');
  const [notScheduledTasks, setNotScheduledTasks] = useState<{ taskId: number; assignmentId: number }[]>([]);
  const [totalTasksTime, setTotalTasksTime] = useState<number>(0);
  const [todaysDueTasksTime, setTodaysDueTasksTime] = useState<number>(0);
  const [unscheduledTaskDetails, setUnscheduledTaskDetails] = useState<{ id: number; description: string; assignmentTitle: string; timeAllocation: number }[]>([]);
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [currentTask, setCurrentTask] = useState<any | null>(null);
  
  // Calculate total minutes from hours and minutes inputs
  const getTotalMinutes = (): number | undefined => {
    const hours = availableHours ? parseInt(availableHours, 10) : 0;
    const minutes = availableMinutes ? parseInt(availableMinutes, 10) : 0;
    
    // Return undefined if both are empty (use default time)
    if (availableHours === '' && availableMinutes === '') {
      return undefined;
    }
    
    return (hours * 60) + minutes;
  };

  const generateScheduleMutation = useMutation({
    mutationFn: async () => {
      // Get all incomplete assignment IDs with due dates
      const response = await fetch('/api/assignments/incomplete');
      const assignments = await response.json();
      
      if (!assignments || !assignments.length) {
        throw new Error("No assignments available to schedule");
      }
      
      // Sort assignments by due date (upcoming first)
      const sortedAssignments = [...assignments].sort((a, b) => {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        return dateA.getTime() - dateB.getTime();
      });
      
      // Get assignmentIds
      const assignmentIds = sortedAssignments.map((a: any) => a.id);
      
      // Generate a schedule with available minutes if provided
      const payload: any = {
        assignmentIds,
        startDate: new Date().toISOString(),
        prioritizeTodaysDue: true // New flag to prioritize today's due tasks
      };
      
      const totalMinutes = getTotalMinutes();
      if (totalMinutes !== undefined) {
        // Add a hidden 15-minute buffer to ensure tasks that exactly fit will be scheduled
        payload.availableMinutes = totalMinutes + 15;
      }
      
      const scheduleResponse = await apiRequest("POST", `/api/schedule/generate`, payload);
      return scheduleResponse.json();
    },
    onSuccess: (data) => {
      // Get today's unscheduled tasks count (if provided)
      const todaysTasksUnscheduled = data.todaysUnscheduledCount || 0;
      
      // Save not scheduled tasks for display
      if (data.notScheduled && data.notScheduled.length > 0) {
        setNotScheduledTasks(data.notScheduled);
        
        // Only show warning if tasks due today couldn't be scheduled AND
        // the available time is less than the time required for today's due tasks
        // This ensures we don't show warnings when available time equals required time
        // Note: We need to account for our 15-minute buffer that was added
        const actualAvailableTime = getTotalMinutes() || 0; // Use actual time input by user (not buffered time)
        const neededTime = data.todaysDueTasksTime || 0;
        setShowWarning(todaysTasksUnscheduled > 0 && actualAvailableTime < neededTime);
      } else {
        setNotScheduledTasks([]);
        setShowWarning(false);
      }
      
      // Save total tasks time
      if (data.totalTasksTime) {
        setTotalTasksTime(data.totalTasksTime);
      }
      
      // Save time needed for today's and overdue tasks
      if (data.todaysDueTasksTime) {
        setTodaysDueTasksTime(data.todaysDueTasksTime);
      }
      
      // Save unscheduled task details
      if (data.unscheduledTaskDetails) {
        setUnscheduledTaskDetails(data.unscheduledTaskDetails);
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/schedule'] });
      onRefresh();
      
      // Generate appropriate messages
      if (todaysTasksUnscheduled > 0) {
        toast({
          title: "Schedule generated with warnings",
          description: `${todaysTasksUnscheduled} tasks due today or overdue couldn't fit in your available time`,
          variant: "destructive",
        });
      } else if (data.extraTasksAdded > 0) {
        toast({
          title: "Schedule generated successfully",
          description: `All tasks due today were scheduled, plus ${data.extraTasksAdded} additional upcoming tasks`,
        });
      } else {
        toast({
          title: "Schedule generated",
          description: "Your optimized work schedule has been created",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate schedule",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const markScheduleItemCompletedMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("PUT", `/api/schedule/${id}`, {
        completed: true
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule'] });
      onRefresh();
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating schedule",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const formatTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), "h:mm a");
    } catch (error) {
      return "Invalid time";
    }
  };
  
  const formatTimeRange = (startTime: string, endTime: string) => {
    try {
      const start = formatTime(startTime);
      const end = formatTime(endTime);
      const duration = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60));
      return `${start} - ${end} (${duration} minutes)`;
    } catch (error) {
      return "Invalid time range";
    }
  };
  
  const isItemInProgress = (item: any) => {
    const now = new Date();
    const start = new Date(item.startTime);
    const end = new Date(item.endTime);
    return !item.completed && start <= now && end >= now;
  };
  
  const handleMarkComplete = (id: number) => {
    markScheduleItemCompletedMutation.mutate(id);
  };
  
  // Format time for display
  const formatMinutesToHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Move to the previous task in the schedule and mark it as not complete
  const moveToPreviousTask = async () => {
    if (!currentTask || scheduleData.length === 0) return;
    
    // Get all schedule items sorted by start time
    const sortedItems = [...scheduleData].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    
    // Find the index of the current task
    const currentIndex = sortedItems.findIndex(item => item.id === currentTask.id);
    
    // If there is a previous task, go to it and mark it as not complete
    if (currentIndex > 0) {
      const previousTask = sortedItems[currentIndex - 1];
      
      // Mark the previous task as not complete if it was completed
      if (previousTask.completed) {
        try {
          // Update schedule item
          await apiRequest(
            "PUT", 
            `/api/schedule/${previousTask.id}`, 
            { completed: false }
          );
          
          // Update task
          await apiRequest(
            "PUT", 
            `/api/tasks/${previousTask.taskId}`, 
            { completed: false }
          );
          
          // Refresh queries
          queryClient.invalidateQueries({ queryKey: ['/api/schedule'] });
          queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
          
          // This will be set after the queries are invalidated and data is refetched
          setTimeout(() => {
            const updatedScheduleData = scheduleData.map(item => 
              item.id === previousTask.id ? { ...item, completed: false } : item
            );
            setCurrentTask({ ...previousTask, completed: false });
          }, 100);
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to update task status",
            variant: "destructive"
          });
        }
      } else {
        // If the task wasn't completed, just navigate to it
        setCurrentTask(previousTask);
      }
    }
  };
  
  // Move to the next task in the schedule
  const moveToNextTask = () => {
    if (!currentTask || scheduleData.length === 0) return;
    
    // Get all schedule items sorted by start time
    const sortedItems = [...scheduleData].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    
    // Find the index of the current task
    const currentIndex = sortedItems.findIndex(item => item.id === currentTask.id);
    
    // If there is a next task, set it as current
    if (currentIndex < sortedItems.length - 1) {
      const nextTask = sortedItems[currentIndex + 1];
      setCurrentTask(nextTask);
    }
  };

  // Find the current task in progress
  useEffect(() => {
    if (!isLoading && scheduleData && scheduleData.length > 0) {
      const now = new Date();
      // Find the first task that's in progress
      const inProgressTask = scheduleData.find(item => {
        const start = new Date(item.startTime);
        const end = new Date(item.endTime);
        return !item.completed && start <= now && end >= now;
      });
      
      if (inProgressTask) {
        setCurrentTask(inProgressTask);
      } else {
        // If no task in progress, find the next upcoming task
        const nextTask = scheduleData
          .filter(item => !item.completed)
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];
        
        if (nextTask) {
          setCurrentTask(nextTask);
        } else {
          setCurrentTask(null);
        }
      }
    } else {
      setCurrentTask(null);
    }
  }, [isLoading, scheduleData]);
  
  return (
    <Card className="mt-6">
      <CardHeader className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Today's Schedule</h2>
            <p className="mt-1 text-sm text-gray-500">Your optimized work plan for completing all assignments.</p>
          </div>
          
          <div className="flex space-x-3 items-center">
            <div className="flex space-x-2 items-center">
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  placeholder="Hours"
                  className="w-[80px] pl-8"
                  value={availableHours}
                  onChange={(e) => setAvailableHours(e.target.value)}
                />
                <i className="ri-time-line absolute left-2.5 top-2.5 text-gray-400"></i>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="Mins"
                  className="w-[70px]"
                  value={availableMinutes}
                  onChange={(e) => setAvailableMinutes(e.target.value)}
                />
              </div>
            </div>
            
            <Button 
              onClick={() => generateScheduleMutation.mutate()} 
              disabled={generateScheduleMutation.isPending}
            >
              {generateScheduleMutation.isPending ? (
                <span className="flex items-center">
                  <i className="ri-loader-2-line animate-spin mr-1"></i>
                  Generating...
                </span>
              ) : (
                <>
                  <i className="ri-magic-line mr-1"></i>
                  Generate Plan
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {showWarning && (
        <div className="px-6 pt-4">
          <Alert className="bg-amber-50 border-amber-200">
            <AlertTitle className="text-amber-800 flex items-center">
              <i className="ri-error-warning-line mr-2 text-amber-500"></i>
              Time Constraint Warning
            </AlertTitle>
            <AlertDescription className="text-amber-700">
              <p>Some tasks <strong>due today or overdue</strong> couldn't be scheduled due to your time constraints.</p>
              <p className="mt-1 text-sm">
                Today's tasks time needed: <strong>{formatMinutesToHours(todaysDueTasksTime)}</strong>, 
                Available time: <strong>{getTotalMinutes() ? formatMinutesToHours(getTotalMinutes() || 0) : "Auto (9am-6pm)"}</strong>
              </p>
              <p className="mt-3 mb-1 text-sm font-medium">
                {notScheduledTasks.length > 0 ? (
                  <>
                    <span className="text-red-600 font-medium">
                      {generateScheduleMutation.data?.todaysUnscheduledCount || 0} tasks due today or overdue couldn't be scheduled
                    </span>
                    {generateScheduleMutation.data?.todaysUnscheduledCount !== notScheduledTasks.length && (
                      <span className="ml-2">
                        ({notScheduledTasks.length - (generateScheduleMutation.data?.todaysUnscheduledCount || 0)} future tasks also not scheduled)
                      </span>
                    )}
                  </>
                ) : (
                  "No tasks were scheduled"
                )}
              </p>
              
              {/* Unscheduled task details */}
              {unscheduledTaskDetails.length > 0 && (
                <div className="mt-4 mb-1">
                  <h4 className="text-sm font-medium text-amber-800 mb-2">Tasks due today that couldn't be scheduled:</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {unscheduledTaskDetails
                      // Only show tasks that don't have "(future)" in their title
                      .filter(task => !task.assignmentTitle.includes("(future)"))
                      .map(task => (
                        <li key={task.id} className="flex justify-between">
                          <span className="font-medium">{task.assignmentTitle}: {task.description}</span>
                          <span>{formatMinutesToHours(task.timeAllocation)}</span>
                        </li>
                      ))
                    }
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      <CardContent className="px-6 py-5">
        {/* Task Timer Section - Only show when we have a current task */}
        {currentTask && scheduleData.length > 0 && (
          <div className="mb-6">
            <TaskTimer
              scheduleItemId={currentTask.id}
              taskId={currentTask.taskId}
              taskDescription={currentTask.task ? currentTask.task.description : "Unknown task"}
              assignmentTitle={currentTask.assignment ? currentTask.assignment.title : "Unknown assignment"}
              startTime={currentTask.startTime}
              endTime={currentTask.endTime}
              duration={Math.round((new Date(currentTask.endTime).getTime() - new Date(currentTask.startTime).getTime()) / (1000 * 60))}
              isCompleted={currentTask.completed}
              onComplete={() => {
                // Force refresh the schedule and assignments
                queryClient.invalidateQueries({ queryKey: ['/api/schedule'] });
                queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
                
                onRefresh();
              }}
              onPrevious={moveToPreviousTask}
              onNext={moveToNextTask}
            />
            
            {/* Task details section */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Today's Progress</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {scheduleData.filter(item => item.completed).length} of {scheduleData.length} tasks completed
                  </p>
                </div>
                
                <div className="flex items-center">
                  <span className="text-xs text-gray-500 mr-2">
                    Task {scheduleData.findIndex(item => item.id === currentTask.id) + 1} of {scheduleData.length}
                  </span>
                  <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              
              <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full" 
                  style={{ 
                    width: `${(scheduleData.filter(item => item.completed).length / scheduleData.length) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}
      
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-4 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-3 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        ) : scheduleData.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-3">
              <i className="ri-calendar-line text-4xl"></i>
            </div>
            <h3 className="text-base font-medium text-gray-900">No schedule for today</h3>
            <p className="mt-1 text-sm text-gray-500">
              Generate a schedule to optimize your workday
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <div className="flex space-x-2">
                <Input
                  type="number"
                  min="0"
                  placeholder="Hours"
                  className="w-[80px]"
                  value={availableHours}
                  onChange={(e) => setAvailableHours(e.target.value)}
                />
                <Input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="Mins"
                  className="w-[70px]"
                  value={availableMinutes}
                  onChange={(e) => setAvailableMinutes(e.target.value)}
                />
              </div>
              <Button 
                onClick={() => generateScheduleMutation.mutate()}
                disabled={generateScheduleMutation.isPending}
              >
                <i className="ri-magic-line mr-1"></i>
                Generate Now
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute top-0 bottom-0 left-6 w-px bg-gray-200"></div>
            
            <ul className="space-y-6">
              {scheduleData.map((item) => {
                const inProgress = isItemInProgress(item);
                const completed = item.completed;
                
                // Determine the status label
                let statusLabel = "Not started";
                let statusClass = "bg-gray-100 text-gray-700";
                
                if (completed) {
                  statusLabel = "Completed";
                  statusClass = "bg-green-50 text-green-700 border-green-100";
                } else if (inProgress) {
                  statusLabel = "In progress";
                  statusClass = "bg-blue-50 text-blue-700 border-blue-100";
                }
                
                return (
                  <li key={item.id} className="relative pl-10">
                    <div className="flex items-center">
                      <div 
                        className={`absolute left-0 p-1 rounded-full border-4 border-white ${inProgress ? 'bg-gray-100' : 'bg-white'}`}
                      >
                        <div 
                          className={`w-2 h-2 rounded-full ${
                            completed ? 'bg-green-500' : inProgress ? 'bg-blue-500' : 'bg-gray-400'
                          }`}
                        ></div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center">
                          <span className={`${statusClass} text-xs px-2 py-1 rounded border mr-2 min-w-[90px] text-center`}>
                            {statusLabel}
                          </span>
                          <h3 className="text-sm font-medium text-gray-900">
                            {item.task && item.assignment
                              ? `${item.assignment.title}: ${item.task.description}`
                              : "Unknown task"}
                          </h3>
                          
                          {!completed && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-xs h-7 px-2 ml-auto"
                              onClick={() => handleMarkComplete(item.id)}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 ml-[106px]">
                          {formatTimeRange(item.startTime, item.endTime)}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
      
      {scheduleData.length > 0 && (
        <CardFooter className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="text-sm text-gray-500">
              <strong>{scheduleData.length}</strong> tasks scheduled for today
            </div>
            {/* No action buttons needed here - users can use the inputs at the top of the card */}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}