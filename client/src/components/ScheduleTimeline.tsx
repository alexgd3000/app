import { format, parseISO } from "date-fns";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ScheduleTimelineProps {
  isLoading: boolean;
  scheduleData: any[];
  onRefresh: () => void;
}

export default function ScheduleTimeline({ isLoading, scheduleData, onRefresh }: ScheduleTimelineProps) {
  const { toast } = useToast();
  
  const generateScheduleMutation = useMutation({
    mutationFn: async () => {
      // Get all incomplete assignment IDs
      const response = await fetch('/api/assignments/incomplete');
      const assignments = await response.json();
      
      if (!assignments || !assignments.length) {
        throw new Error("No assignments available to schedule");
      }
      
      const assignmentIds = assignments.map((a: any) => a.id);
      
      // Generate a schedule
      const scheduleResponse = await apiRequest("POST", `/api/schedule/generate`, {
        assignmentIds,
        startDate: new Date().toISOString()
      });
      
      return scheduleResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule'] });
      onRefresh();
      toast({
        title: "Schedule generated",
        description: "Your optimized work schedule has been created",
      });
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
  
  return (
    <Card className="mt-6">
      <CardHeader className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Today's Schedule</h2>
            <p className="mt-1 text-sm text-gray-500">Your optimized work plan for completing all assignments.</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <i className="ri-calendar-line mr-1"></i>
              Calendar View
            </Button>
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
            <Button 
              className="mt-3" 
              onClick={() => generateScheduleMutation.mutate()}
              disabled={generateScheduleMutation.isPending}
            >
              <i className="ri-magic-line mr-1"></i>
              Generate Now
            </Button>
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
    </Card>
  );
}
