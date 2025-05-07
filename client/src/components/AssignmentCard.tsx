import { useState, useEffect } from "react";
import { Assignment, Task } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format, formatDistanceToNow } from "date-fns";
import TaskItem from "@/components/TaskItem";
import TimerDisplay from "@/components/TimerDisplay";
import AddTaskForm from "@/components/AddTaskForm";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface AssignmentCardProps {
  assignment: Assignment;
  isActive: boolean;
  viewMode: "grid" | "list";
  onRefresh: () => void;
}

export default function AssignmentCard({ assignment, isActive, viewMode, onRefresh }: AssignmentCardProps) {
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const { toast } = useToast();
  
  const { data: tasks = [], refetch: refetchTasks } = useQuery<Task[]>({
    queryKey: [`/api/assignments/${assignment.id}/tasks`],
  });

  // Get active task from schedule
  const { data: scheduleData = [] } = useQuery({
    queryKey: ['/api/schedule', format(new Date(), 'yyyy-MM-dd')],
    enabled: isActive,
  });

  // Mark task as complete
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Task> }) => {
      const response = await apiRequest("PUT", `/api/tasks/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/assignments/${assignment.id}/tasks`] });
      queryClient.invalidateQueries({ queryKey: ['/api/schedule'] });
      onRefresh();
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate progress
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Calculate time usage
  const totalTimeSpent = tasks.reduce((sum, task) => sum + task.timeSpent, 0);
  const totalTimeAllocation = tasks.reduce((sum, task) => sum + task.timeAllocation, 0);
  
  // Format time for display (convert minutes to hours and minutes)
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };
  
  // Get priority badge style
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">High Priority</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">Medium Priority</Badge>;
      case 'low':
        return <Badge variant="outline" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Low Priority</Badge>;
      default:
        return null;
    }
  };

  // Find the active task from the schedule
  useEffect(() => {
    if (isActive && scheduleData.length > 0) {
      const activeScheduleItem = scheduleData.find(item => 
        item.task && 
        item.task.assignmentId === assignment.id && 
        !item.completed && 
        new Date(item.startTime) <= new Date() && 
        new Date(item.endTime) >= new Date()
      );
      
      if (activeScheduleItem && activeScheduleItem.task) {
        setActiveTaskId(activeScheduleItem.task.id);
      }
    }
  }, [isActive, scheduleData, assignment.id]);
  
  const handleTaskUpdate = (taskId: number, isCompleted: boolean) => {
    updateTaskMutation.mutate({
      id: taskId,
      data: { completed: isCompleted }
    });
  };
  
  const handleTaskCreated = () => {
    refetchTasks();
    onRefresh();
  };

  // Format due date
  const dueDate = new Date(assignment.dueDate);
  const formattedDueDate = dueDate.getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000 
    ? formatDistanceToNow(dueDate, { addSuffix: true })
    : format(dueDate, 'MMM d, yyyy');

  // Find the active task object
  const activeTask = tasks.find(task => task.id === activeTaskId);

  if (viewMode === "list") {
    return (
      <Card className="mb-4 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="p-4 md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{assignment.title}</h2>
                <p className="text-sm text-gray-500">{assignment.course}</p>
              </div>
              <div>{getPriorityBadge(assignment.priority)}</div>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-500">
                <i className="ri-calendar-line mr-1"></i>
                <span>Due {formattedDueDate}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <i className="ri-time-line mr-1"></i>
                <span>Est: {formatTime(assignment.estimatedTime)}</span>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center">
                <Progress value={progress} className="h-2" />
                <span className="ml-2 text-sm font-medium text-gray-700">{progress}%</span>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {completedTasks} of {totalTasks} tasks · {formatTime(totalTimeSpent)} used of {formatTime(totalTimeAllocation)}
              </div>
            </div>
          </div>
          
          <div className="p-4 md:w-2/3">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Task Breakdown</h3>
            <div className="space-y-2">
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isActive={task.id === activeTaskId}
                  onUpdate={handleTaskUpdate}
                />
              ))}
              
              <AddTaskForm assignmentId={assignment.id} onTaskCreated={handleTaskCreated} />
            </div>
          </div>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className={`overflow-hidden flex flex-col ${isActive ? 'border-2 border-primary-300' : ''}`}>
      {/* Card Header */}
      <CardHeader className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            {isActive && (
              <div className="flex items-center">
                <span className="flex h-3 w-3 mr-2">
                  <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-primary-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
                </span>
              </div>
            )}
            <h2 className="text-lg font-semibold text-gray-900">{assignment.title}</h2>
            <p className="text-sm text-gray-500">{assignment.course}</p>
          </div>
          <div>{getPriorityBadge(assignment.priority)}</div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <i className="ri-calendar-line mr-1"></i>
            <span>Due {formattedDueDate}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <i className="ri-time-line mr-1"></i>
            <span>Est: {formatTime(assignment.estimatedTime)}</span>
          </div>
        </div>
      </CardHeader>
      
      {/* Timer Display for active assignment */}
      {isActive && activeTask && (
        <div className="px-6 py-6 border-b border-gray-200 bg-primary-50">
          <TimerDisplay task={activeTask} />
        </div>
      )}
      
      {/* Card Content - Task Breakdown */}
      <CardContent className="px-6 py-4 flex-1 overflow-y-auto">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Task Breakdown</h3>
        
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isActive={task.id === activeTaskId}
              onUpdate={handleTaskUpdate}
            />
          ))}
        </div>
        
        <AddTaskForm assignmentId={assignment.id} onTaskCreated={handleTaskCreated} />
      </CardContent>
      
      {/* Card Footer */}
      <CardFooter className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3">
              <div className="relative">
                <svg className="w-10 h-10" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#e5e7eb" strokeWidth="2"></circle>
                  <circle 
                    cx="18" 
                    cy="18" 
                    r="16" 
                    fill="none" 
                    stroke="#4f46e5" 
                    strokeWidth="2" 
                    strokeDasharray="100" 
                    strokeDashoffset={100 - progress} 
                    transform="rotate(-90 18 18)"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">{progress}%</div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">{completedTasks} of {totalTasks} tasks</h4>
              <p className="text-xs text-gray-500">{formatTime(totalTimeSpent)} used of {formatTime(totalTimeAllocation)}</p>
            </div>
          </div>
          <Button 
            variant={isActive ? "outline" : "default"}
            disabled={tasks.length === 0 || tasks.every(t => t.completed)}
          >
            {isActive ? "Mark Complete" : "Start Timer"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
