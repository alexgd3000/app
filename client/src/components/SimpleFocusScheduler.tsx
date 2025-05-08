import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import SimpleTaskTimer from './SimpleTaskTimer';
import SimpleTaskList from './SimpleTaskList';
import { Button } from '@/components/ui/button';
import { ArrowUpCircle } from 'lucide-react';

export default function SimpleFocusScheduler() {
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch schedule data
  const { data: scheduleData = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ['/api/schedule'],
  });

  // Processed task data in the format needed by our components
  const tasks = scheduleData.map(item => ({
    id: item.taskId,
    description: item.task?.description || 'Unknown task',
    completed: item.completed || false,
    scheduleItemId: item.id,
    assignmentTitle: item.assignment?.title || 'Unknown assignment',
    timeAllocation: Math.round((new Date(item.endTime).getTime() - new Date(item.startTime).getTime()) / (1000 * 60)),
    startTime: item.startTime,
    endTime: item.endTime
  }));

  // Sort tasks by start time
  const sortedTasks = [...tasks].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // Find active task index
  const activeTaskIndex = activeTaskId 
    ? sortedTasks.findIndex(task => task.id === activeTaskId)
    : -1;

  // Set initial active task to first uncompleted task
  useEffect(() => {
    if (sortedTasks.length > 0 && activeTaskId === null) {
      const firstUncompletedTask = sortedTasks.find(task => !task.completed);
      if (firstUncompletedTask) {
        setActiveTaskId(firstUncompletedTask.id);
      } else {
        setActiveTaskId(sortedTasks[0].id);
      }
    }
  }, [sortedTasks, activeTaskId]);

  // Handle task selection
  const handleSelectTask = (taskId: number) => {
    console.log('Selecting task:', taskId);
    setActiveTaskId(taskId);
  };

  // Complete/uncomplete task mutation
  const toggleTaskCompletionMutation = useMutation({
    mutationFn: async ({ taskId, scheduleItemId, completed }: 
      { taskId: number; scheduleItemId: number; completed: boolean }) => {
      // First update schedule item
      await apiRequest(
        "PUT",
        `/api/schedule/${scheduleItemId}`,
        { completed }
      );
      
      // Then update the task
      await apiRequest(
        "PUT",
        `/api/tasks/${taskId}`,
        { completed }
      );
      
      return { taskId, completed };
    },
    onSuccess: ({ taskId, completed }) => {
      // Only refresh schedule data, not assignments
      queryClient.invalidateQueries({ queryKey: ['/api/schedule'] });
      
      // If the completed task is the active task, move to the next uncompleted task
      if (completed && taskId === activeTaskId) {
        const nextUncompletedTaskIndex = sortedTasks.findIndex(
          (task, index) => index > activeTaskIndex && !task.completed
        );
        
        if (nextUncompletedTaskIndex !== -1) {
          setActiveTaskId(sortedTasks[nextUncompletedTaskIndex].id);
        }
      }
      
      toast({
        title: completed ? "Task completed" : "Task marked as incomplete",
        description: `Task has been ${completed ? 'completed' : 'marked as incomplete'}.`,
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating task",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle task navigation (previous/next)
  const handleNavigatePrevious = () => {
    if (activeTaskIndex > 0) {
      setActiveTaskId(sortedTasks[activeTaskIndex - 1].id);
    }
  };

  const handleNavigateNext = () => {
    if (activeTaskIndex < sortedTasks.length - 1) {
      setActiveTaskId(sortedTasks[activeTaskIndex + 1].id);
    }
  };

  // Handle the "Update Assignments" button
  const handleUpdateAssignments = () => {
    // Invalidate all assignment-related queries to sync the Planner tab
    queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
    queryClient.invalidateQueries({ queryKey: ['/api/assignments/incomplete'] });
    
    // Invalidate individual assignment tasks
    sortedTasks.forEach(task => {
      // Extract assignment ID from the task
      const assignmentId = sortedTasks.find(t => t.id === task.id)?.id;
      if (assignmentId) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/assignments/${assignmentId}/tasks`] 
        });
      }
    });
    
    toast({
      title: "Assignments updated",
      description: "All assignments have been refreshed with the latest changes.",
    });
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading schedule...</div>;
  }

  // Generate schedule mutation
  const generateScheduleMutation = useMutation({
    mutationFn: async () => {
      try {
        // Get all incomplete assignment IDs
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
        
        // Generate schedule with default parameters
        const response2 = await apiRequest(
          "POST",
          "/api/schedule/generate",
          {
            assignmentIds,
            startDate: new Date().toISOString()
          }
        );
        
        const data = await response2.json();
        return data;
      } catch (error) {
        console.error("Failed to generate schedule:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule'] });
      toast({
        title: "Schedule generated",
        description: "Your work schedule has been created successfully",
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

  if (sortedTasks.length === 0) {
    return (
      <div className="p-6 text-center border rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks scheduled</h3>
        <p className="text-gray-500 mb-4">
          Generate a schedule to start working on your tasks.
        </p>
        <Button 
          onClick={() => generateScheduleMutation.mutate()}
          disabled={generateScheduleMutation.isPending}
        >
          {generateScheduleMutation.isPending ? 'Generating...' : 'Generate Schedule'}
        </Button>
      </div>
    );
  }

  // Get the active task
  const activeTask = activeTaskId ? sortedTasks.find(task => task.id === activeTaskId) : null;
  
  if (!activeTask) {
    return <div className="p-4 text-center">No active task selected.</div>;
  }

  // Count completed tasks
  const completedTasksCount = sortedTasks.filter(task => task.completed).length;

  return (
    <div className="space-y-6">
      {/* Timer for active task */}
      <SimpleTaskTimer
        task={{
          id: activeTask.id,
          description: activeTask.description,
          timeAllocation: activeTask.timeAllocation,
          completed: activeTask.completed,
          scheduleItemId: activeTask.scheduleItemId
        }}
        assignment={{
          title: activeTask.assignmentTitle
        }}
        totalTasks={sortedTasks.length}
        currentTaskIndex={activeTaskIndex}
        completedTasks={completedTasksCount}
        onComplete={(taskId, scheduleItemId) => 
          toggleTaskCompletionMutation.mutate({ taskId, scheduleItemId, completed: true })
        }
        onNavigatePrevious={handleNavigatePrevious}
        onNavigateNext={handleNavigateNext}
      />

      {/* Task list */}
      <SimpleTaskList
        tasks={sortedTasks}
        activeTaskId={activeTaskId}
        onSelectTask={handleSelectTask}
        onToggleTaskCompletion={(taskId, scheduleItemId, completed) => 
          toggleTaskCompletionMutation.mutate({ taskId, scheduleItemId, completed })
        }
      />

      {/* Update Assignments button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          className="flex items-center"
          onClick={handleUpdateAssignments}
        >
          <ArrowUpCircle className="h-4 w-4 mr-2" />
          Update Assignments
        </Button>
      </div>
    </div>
  );
}