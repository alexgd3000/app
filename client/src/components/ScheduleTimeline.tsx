import { useState } from "react";
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
import { RotateCcw } from "lucide-react";
import TaskTimerSystem from "./TaskTimerSystem";

interface ScheduleTimelineProps {
  isLoading: boolean;
  scheduleData: any[];
  onRefresh: () => void;
}

export default function ScheduleTimeline({ isLoading, scheduleData, onRefresh }: ScheduleTimelineProps) {
  const { toast } = useToast();
  const [availableHours, setAvailableHours] = useState<string>('');
  const [availableMinutes, setAvailableMinutes] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [notScheduledTasks, setNotScheduledTasks] = useState<{ taskId: number; assignmentId: number }[]>([]);
  const [totalTasksTime, setTotalTasksTime] = useState<number>(0);
  const [todaysDueTasksTime, setTodaysDueTasksTime] = useState<number>(0);
  const [unscheduledTaskDetails, setUnscheduledTaskDetails] = useState<{ id: number; description: string; assignmentTitle: string; timeAllocation: number }[]>([]);
  const [showWarning, setShowWarning] = useState<boolean>(false);
  
  // Reset all timers mutation
  const [resetAllTimersFunction, setResetAllTimersFunction] = useState<(() => Promise<void>) | null>(null);
  
  const resetAllTimersMutation = useMutation({
    mutationFn: async () => {
      if (resetAllTimersFunction) {
        await resetAllTimersFunction();
        return true;
      } else {
        // Fallback to just clearing localStorage if we don't have the function
        localStorage.removeItem('timerStates');
        return true;
      }
    },
    onSuccess: () => {
      toast({
        title: "All timers reset",
        description: "All task timers have been reset to 0:00",
        variant: "default"
      });
      onRefresh();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset timers",
        variant: "destructive"
      });
    }
  });
  
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
  
  // Check if schedule is empty - use this to show the initial state
  const isScheduleEmpty = scheduleData.length === 0;

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
      
      // Create a date object from today with the specified start time
      const today = new Date();
      const [hours, minutes] = startTime.split(':').map(Number);
      today.setHours(hours, minutes, 0, 0);
      
      // Generate a schedule with available minutes if provided
      const payload: any = {
        assignmentIds,
        startDate: today.toISOString(),
        prioritizeTodaysDue: true, // Flag to prioritize today's due tasks
        startTime: startTime // Include the start time for display purposes
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

  return (
    <Card className="mt-6">
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <div className="space-y-4">
          {/* First row: Title and description directly together */}
          <div className="flex items-center">
            <h2 className="text-lg font-medium text-gray-900">Today's Schedule</h2>
            <p className="text-sm text-gray-500 ml-3">Your optimized work plan for completing all assignments.</p>
          </div>
          
          {/* Second row: All controls in a single row */}
          <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-3">
            <div className="flex flex-wrap md:flex-nowrap items-center gap-3">
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2 whitespace-nowrap">Available Time:</span>
                <div className="flex space-x-1">
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      placeholder="Hours"
                      className="w-[90px]"
                      value={availableHours}
                      onChange={(e) => setAvailableHours(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="Mins"
                      className="w-[90px]"
                      value={availableMinutes}
                      onChange={(e) => setAvailableMinutes(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2 whitespace-nowrap">Start Time:</span>
                <div className="relative">
                  <Input 
                    type="time"
                    className="w-[130px]"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => generateScheduleMutation.mutate()} 
              disabled={generateScheduleMutation.isPending}
              className="ml-auto"
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
            <div className="mt-3 flex flex-col items-center justify-center gap-2">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">Available:</span>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        placeholder="Hours"
                        className="w-[90px]"
                        value={availableHours}
                        onChange={(e) => setAvailableHours(e.target.value)}
                      />
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        placeholder="Mins"
                        className="w-[90px]"
                        value={availableMinutes}
                        onChange={(e) => setAvailableMinutes(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">Start at:</span>
                  <Input 
                    type="time"
                    className="w-[130px]"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
              </div>
              
              <Button 
                onClick={() => generateScheduleMutation.mutate()}
                disabled={generateScheduleMutation.isPending}
                className="mt-1"
              >
                <i className="ri-magic-line mr-1"></i>
                Generate Schedule
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {/* Task Timer Section - The only section we need */}
            <TaskTimerSystem
              scheduleData={scheduleData}
              onRefresh={onRefresh}
              onResetAllTimers={(resetFn) => setResetAllTimersFunction(() => resetFn)}
              unscheduledTaskDetails={unscheduledTaskDetails}
              availableMinutes={getTotalMinutes()}
            />
          </div>
        )}
      </CardContent>
      
      {scheduleData.length > 0 && (
        <CardFooter className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="text-sm text-gray-500">
              <strong>{scheduleData.length}</strong> tasks scheduled for today
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => resetAllTimersMutation.mutate()}
              disabled={resetAllTimersMutation.isPending || !resetAllTimersFunction}
            >
              {resetAllTimersMutation.isPending ? (
                <span className="flex items-center">
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Resetting...
                </span>
              ) : (
                <span className="flex items-center">
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Reset All Timers
                </span>
              )}
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}