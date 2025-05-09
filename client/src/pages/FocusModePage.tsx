import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { RotateCcw, Clock, ArrowRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

// Utility for formatting time (like "3h 15m")
const formatMinutesToHours = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

// Utility for formatting datetime
const formatDateTime = (date: string) => {
  return format(new Date(date), "h:mm a");
};

export default function FocusModePage() {
  const { toast } = useToast();
  
  // State for time input
  const [availableHours, setAvailableHours] = useState<string>("");
  const [availableMinutes, setAvailableMinutes] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("09:00");
  
  // State for schedule and task management
  const [selectedAssignments, setSelectedAssignments] = useState<number[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<any[]>([]);
  const [unscheduledTasks, setUnscheduledTasks] = useState<any[]>([]);
  const [timeNeeded, setTimeNeeded] = useState<number>(0);
  const [showWarning, setShowWarning] = useState(false);
  const [currentTask, setCurrentTask] = useState<any>(null);
  
  // Fetch all incomplete assignments
  const assignmentsQuery = useQuery({
    queryKey: ['/api/assignments/incomplete'],
    refetchOnWindowFocus: false
  });
  
  // Fetch current schedule data
  const scheduleQuery = useQuery({
    queryKey: ['/api/schedule'],
    refetchOnWindowFocus: false
  });
  
  // Update scheduled tasks when data changes
  useEffect(() => {
    if (scheduleQuery.data) {
      const data = scheduleQuery.data as any[];
      setScheduledTasks(data);
      if (data.length > 0) {
        const currentItem = findCurrentTask(data);
        setCurrentTask(currentItem);
      } else {
        setCurrentTask(null);
      }
    }
  }, [scheduleQuery.data]);
  
  // Pre-select all assignments by default when they load
  useEffect(() => {
    if (assignmentsQuery.data) {
      const assignments = assignmentsQuery.data as any[];
      if (assignments.length > 0) {
        setSelectedAssignments(assignments.map((a: any) => a.id));
      }
    }
  }, [assignmentsQuery.data]);
  
  // Calculate total minutes from input fields
  const getTotalMinutes = (): number | undefined => {
    const hours = availableHours ? parseInt(availableHours, 10) : 0;
    const minutes = availableMinutes ? parseInt(availableMinutes, 10) : 0;
    
    // Return undefined if both are empty (use default time)
    if (availableHours === "" && availableMinutes === "") {
      return undefined;
    }
    
    return (hours * 60) + minutes;
  };
  
  // Toggle assignment selection
  const toggleAssignment = (id: number) => {
    setSelectedAssignments(prev => 
      prev.includes(id) 
        ? prev.filter(a => a !== id) 
        : [...prev, id]
    );
  };
  
  // Find the current active task based on time
  const findCurrentTask = (tasks: any[]) => {
    const now = new Date();
    return tasks.find(task => {
      const startTime = new Date(task.startTime);
      const endTime = new Date(task.endTime);
      return !task.completed && startTime <= now && endTime >= now;
    }) || tasks.find(task => !task.completed) || null;
  };
  
  // Generate schedule mutation
  const generateScheduleMutation = useMutation({
    mutationFn: async () => {
      // First clear any existing schedule
      try {
        const existingSchedule = await apiRequest("GET", "/api/schedule");
        const scheduleData = await existingSchedule.json();
        
        // Delete all existing schedule items one by one
        for (const item of scheduleData) {
          await apiRequest("DELETE", `/api/schedule/${item.id}`);
        }
      } catch (error) {
        console.error("Error clearing existing schedule:", error);
      }
      
      // Prepare the date with the specified start time
      const today = new Date();
      const [hours, minutes] = startTime.split(':').map(Number);
      today.setHours(hours, minutes, 0, 0);
      
      // Create the payload
      const payload: {
        assignmentIds: number[];
        startDate: string;
        prioritizeTodaysDue: boolean;
        startTime: string;
        availableMinutes?: number;
      } = {
        assignmentIds: selectedAssignments,
        startDate: today.toISOString(),
        prioritizeTodaysDue: true,
        startTime
      };
      
      // Add available time if specified
      const totalMinutes = getTotalMinutes();
      if (totalMinutes !== undefined) {
        payload.availableMinutes = totalMinutes;
      }
      
      // Generate the new schedule
      const response = await apiRequest("POST", "/api/schedule/generate", payload);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.scheduleItems && data.scheduleItems.length > 0) {
        setScheduledTasks(data.scheduleItems);
        const currentItem = findCurrentTask(data.scheduleItems);
        setCurrentTask(currentItem);
        
        // Display success message
        toast({
          title: "Schedule generated",
          description: `Generated a schedule with ${data.scheduleItems.length} tasks`,
        });
      } else {
        setScheduledTasks([]);
        setCurrentTask(null);
        toast({
          title: "No tasks scheduled",
          description: "No tasks could be scheduled with the current constraints",
          variant: "destructive"
        });
      }
      
      // Handle unscheduled tasks
      if (data.notScheduled && data.notScheduled.length > 0) {
        setUnscheduledTasks(data.unscheduledTaskDetails || []);
        
        // Show warning if needed time exceeds available time
        const availableTime = getTotalMinutes() || 480; // Default to 8 hours
        setTimeNeeded(data.totalTasksTime || 0);
        setShowWarning(data.totalTasksTime > availableTime);
      } else {
        setUnscheduledTasks([]);
        setShowWarning(false);
      }
      
      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/schedule'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate schedule",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Mark task as completed
  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      // First mark the schedule item as completed
      const scheduleItem = scheduledTasks.find(item => item.taskId === taskId);
      if (scheduleItem) {
        await apiRequest("PUT", `/api/schedule/${scheduleItem.id}`, {
          completed: true
        });
      }
      
      // Then update the task itself
      await apiRequest("PUT", `/api/tasks/${taskId}`, {
        completed: true
      });
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Task completed",
        description: "The task has been marked as completed"
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/schedule'] });
      scheduleQuery.refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error completing task",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Reset task progress
  const resetTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      // Clear task progress (this would be implemented based on your timer system)
      localStorage.removeItem(`timer_${taskId}`);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Task progress reset",
        description: "The timer for this task has been reset"
      });
      scheduleQuery.refetch();
    }
  });
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Focus Mode</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Current task and timer */}
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <h2 className="text-xl font-semibold">Currently Working On</h2>
            </CardHeader>
            
            <CardContent>
              {scheduleQuery.isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : currentTask ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">
                      {currentTask.assignmentTitle}
                    </h3>
                    <Badge variant="outline" className="text-sm">
                      {formatDateTime(currentTask.startTime)} - {formatDateTime(currentTask.endTime)}
                    </Badge>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">{currentTask.taskDescription}</h4>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                      <div 
                        className="bg-primary h-2.5 rounded-full" 
                        style={{ width: `${0}%` }} 
                      ></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Time remaining: {formatMinutesToHours(currentTask.duration)}</span>
                      <div className="text-2xl font-mono">00:00</div>
                    </div>
                    
                    <div className="flex space-x-3 mt-4">
                      <Button size="sm">
                        Start
                      </Button>
                      <Button size="sm" variant="outline">
                        Pause
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => resetTaskMutation.mutate(currentTask.taskId)}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Reset
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        className="ml-auto"
                        onClick={() => completeTaskMutation.mutate(currentTask.taskId)}
                      >
                        Complete Task
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-3">
                    <Clock className="mx-auto h-12 w-12" />
                  </div>
                  <h3 className="text-base font-medium text-gray-900">No active task</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Generate a schedule to start working on your tasks
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <h2 className="text-xl font-semibold">Today's Schedule</h2>
              {scheduledTasks.length > 0 && (
                <Badge variant="outline" className="ml-auto">
                  {scheduledTasks.filter(t => t.completed).length}/{scheduledTasks.length} completed
                </Badge>
              )}
            </CardHeader>
            
            <CardContent>
              {scheduleQuery.isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-3 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : scheduledTasks.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No tasks scheduled for today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduledTasks.map((task, index) => (
                    <div 
                      key={task.id} 
                      className={`flex items-start p-3 rounded-lg ${
                        currentTask && currentTask.id === task.id 
                          ? 'bg-blue-50 border border-blue-100' 
                          : task.completed 
                            ? 'bg-gray-50 text-gray-500' 
                            : ''
                      }`}
                    >
                      <div className="flex-grow">
                        <div className="flex items-start">
                          <div className="mr-3">
                            <Checkbox 
                              checked={task.completed} 
                              onCheckedChange={() => {
                                if (!task.completed) {
                                  completeTaskMutation.mutate(task.taskId);
                                }
                              }}
                            />
                          </div>
                          <div>
                            <div className="font-medium">
                              {task.taskDescription}
                              {currentTask && currentTask.id === task.id && (
                                <Badge className="ml-2 bg-blue-100 text-blue-800">Current</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {task.assignmentTitle} • {formatMinutesToHours(task.duration)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 whitespace-nowrap">
                        {formatDateTime(task.startTime)} - {formatDateTime(task.endTime)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Right column: Generate schedule controls */}
        <div>
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <h2 className="text-xl font-semibold">Generate Schedule</h2>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Available Time
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        min="0"
                        placeholder="Hours"
                        className="w-full"
                        value={availableHours}
                        onChange={(e) => setAvailableHours(e.target.value)}
                      />
                    </div>
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        placeholder="Minutes"
                        className="w-full"
                        value={availableMinutes}
                        onChange={(e) => setAvailableMinutes(e.target.value)}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to use default (8 hours)
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <Input 
                    type="time"
                    className="w-full"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                
                <Separator className="my-2" />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignments to Include
                  </label>
                  
                  {assignmentsQuery.isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center space-x-2">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      ))}
                    </div>
                  ) : !assignmentsQuery.data || (assignmentsQuery.data as any[]).length === 0 ? (
                    <p className="text-sm text-gray-500">No assignments available</p>
                  ) : (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2">
                      {(assignmentsQuery.data as any[]).map((assignment: any) => (
                        <div key={assignment.id} className="flex items-start space-x-2">
                          <Checkbox 
                            id={`assignment-${assignment.id}`}
                            checked={selectedAssignments.includes(assignment.id)}
                            onCheckedChange={() => toggleAssignment(assignment.id)}
                          />
                          <div className="grid gap-1.5 leading-none">
                            <label
                              htmlFor={`assignment-${assignment.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {assignment.title}
                            </label>
                            <p className="text-xs text-muted-foreground">
                              Due: {format(new Date(assignment.dueDate), "MMM d, yyyy")}
                              {assignment.priority && (
                                <Badge 
                                  className="ml-2" 
                                  variant={
                                    assignment.priority === "high" ? "destructive" :
                                    assignment.priority === "medium" ? "default" : "outline"
                                  }
                                >
                                  {assignment.priority}
                                </Badge>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                className="w-full"
                onClick={() => generateScheduleMutation.mutate()}
                disabled={
                  generateScheduleMutation.isPending || 
                  selectedAssignments.length === 0
                }
              >
                {generateScheduleMutation.isPending ? (
                  <span className="flex items-center">
                    <i className="ri-loader-2-line animate-spin mr-1"></i>
                    Generating...
                  </span>
                ) : (
                  <>
                    <i className="ri-magic-line mr-1"></i>
                    Generate Schedule
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {showWarning && (
            <Alert className="bg-amber-50 border-amber-200 mb-6">
              <AlertTitle className="text-amber-800">
                Time Constraint Warning
              </AlertTitle>
              <AlertDescription className="text-amber-700">
                <p>Some tasks couldn't be scheduled due to your time constraints.</p>
                <p className="mt-1 text-sm">
                  Time needed: <strong>{formatMinutesToHours(timeNeeded)}</strong>, 
                  Available time: <strong>{getTotalMinutes() ? formatMinutesToHours(getTotalMinutes() || 0) : "8 hours"}</strong>
                </p>
              </AlertDescription>
            </Alert>
          )}
          
          {unscheduledTasks.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <h2 className="text-xl font-semibold">Unscheduled Tasks</h2>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {unscheduledTasks.map((task) => (
                    <div key={task.id} className="flex items-start justify-between p-3 border border-gray-100 rounded-lg">
                      <div>
                        <div className="font-medium">{task.description}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {task.assignmentTitle}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {formatMinutesToHours(task.timeAllocation)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}