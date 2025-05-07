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
  const [showWarning, setShowWarning] = useState<boolean>(false);
  
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
        payload.availableMinutes = totalMinutes;
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
        
        // Only show warning if tasks due today couldn't be scheduled
        setShowWarning(todaysTasksUnscheduled > 0);
      } else {
        setNotScheduledTasks([]);
        setShowWarning(false);
      }
      
      // Save total tasks time
      if (data.totalTasksTime) {
        setTotalTasksTime(data.totalTasksTime);
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
                Total task time needed: <strong>{formatMinutesToHours(totalTasksTime)}</strong>, 
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
                
                return (
                  <li key={item.id} className="relative pl-10">
                    <div className="flex items-center">
                      <div 
                        className={`absolute left-0 p-1 rounded-full border-4 border-white ${inProgress ? 'bg-gray-100' : 'bg-white'}`}
                      >
                        <div 
                          className={`w-2 h-2 rounded-full ${
                            completed ? 'bg-gray-400' : inProgress ? 'bg-emerald-500' : 'bg-gray-400'
                          }`}
                        ></div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900">
                            {item.task && item.assignment
                              ? `${item.assignment.title}: ${item.task.description}`
                              : "Unknown task"}
                          </h3>
                          {inProgress && (
                            <span className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded">
                              In Progress
                            </span>
                          )}
                          {completed && (
                            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                              Completed
                            </span>
                          )}
                          {!inProgress && !completed && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-xs h-7 px-2"
                              onClick={() => handleMarkComplete(item.id)}
                            >
                              Mark Complete
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
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
            <div className="flex items-center gap-2">
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
                variant="outline" 
                size="sm"
                onClick={() => generateScheduleMutation.mutate()}
                disabled={generateScheduleMutation.isPending}
              >
                Regenerate
              </Button>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}