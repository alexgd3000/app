import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Trash2, Plus, ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import { z } from "zod";

import { Task, insertTaskSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Task form schema
const taskFormSchema = insertTaskSchema.extend({
  id: z.number().optional(),
  // Add support for string input for timeAllocation
  timeAllocation: z.union([
    z.string().transform((val) => parseInt(val, 10) || 0),
    z.number()
  ]),
  // Add support for string input for timeSpent
  timeSpent: z.union([
    z.string().transform((val) => parseInt(val, 10) || 0),
    z.number()
  ]).optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskEditorProps {
  assignmentId: number;
  onTasksUpdated: (totalTime: number) => void;
}

export default function TaskEditor({ assignmentId, onTasksUpdated }: TaskEditorProps) {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  // Fetch tasks for this assignment
  const { data: taskData, isLoading } = useQuery<Task[]>({
    queryKey: [`/api/assignments/${assignmentId}/tasks`],
    enabled: !!assignmentId,
  });

  // We use individual task updates for reordering instead of bulk reordering

  // Create task form
  const addTaskForm = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      assignmentId,
      description: "",
      timeAllocation: 30,
      order: 0,
      completed: false,
    },
  });

  // Edit task form
  const editTaskForm = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      assignmentId,
      description: "",
      timeAllocation: 30,
      order: 0,
      completed: false,
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      const response = await apiRequest("POST", "/api/tasks", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/assignments/${assignmentId}/tasks`] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/assignments'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/assignments/incomplete'] 
      });
      
      toast({
        title: "Task created",
        description: "New task has been added.",
      });
      
      addTaskForm.reset({
        assignmentId,
        description: "",
        timeAllocation: 30,
        order: 0,
        completed: false,
      });
      
      setIsAddingTask(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      if (!data.id) return null;
      
      // Remove id from data to send
      const { id, ...updateData } = data;
      
      const response = await apiRequest(
        "PUT", 
        `/api/tasks/${id}`, 
        updateData
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/assignments/${assignmentId}/tasks`] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/assignments'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/assignments/incomplete'] 
      });
      
      toast({
        title: "Task updated",
        description: "Task has been updated successfully.",
      });
      
      setEditingTaskId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await apiRequest("DELETE", `/api/tasks/${taskId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/assignments/${assignmentId}/tasks`] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/assignments'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/assignments/incomplete'] 
      });
      
      toast({
        title: "Task deleted",
        description: "Task has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update tasks state when data changes
  useEffect(() => {
    if (taskData && Array.isArray(taskData)) {
      setTasks(taskData as Task[]);
      
      // Calculate total time
      const totalTime = taskData.reduce(
        (sum: number, task: Task) => sum + task.timeAllocation, 
        0
      );
      
      // Notify parent of time change
      onTasksUpdated(totalTime);
    }
  }, [taskData, onTasksUpdated]);

  // Handle add task submission
  const onAddTask = (data: TaskFormValues) => {
    // Set correct order (after the last task)
    data.order = tasks.length;
    createTaskMutation.mutate(data);
  };

  // Handle edit task submission
  const onEditTask = (data: TaskFormValues) => {
    updateTaskMutation.mutate(data);
  };

  // Start editing a task
  const startEditTask = (task: Task) => {
    editTaskForm.reset({
      id: task.id,
      assignmentId: task.assignmentId,
      description: task.description,
      timeAllocation: task.timeAllocation,
      order: task.order,
      completed: task.completed,
    });
    setEditingTaskId(task.id);
  };

  // Delete a task
  const deleteTask = (taskId: number) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate(taskId);
    }
  };
  
  // Move task up in order
  const moveTaskUp = (taskIndex: number) => {
    if (taskIndex <= 0) return; // Already at the top
    
    // Create a copy of the tasks array
    const updatedTasks = [...tasks];
    
    // Get the tasks we need to swap
    const taskToMoveUp = updatedTasks[taskIndex];
    const taskToMoveDown = updatedTasks[taskIndex - 1];
    
    console.log("Task details - taskToMoveUp:", taskToMoveUp);
    console.log("Task details - taskToMoveDown:", taskToMoveDown);
    
    // Update local state immediately for better UX
    const newTasks = [...tasks];
    // Swap the tasks
    const temp = newTasks[taskIndex];
    newTasks[taskIndex] = newTasks[taskIndex - 1];
    newTasks[taskIndex - 1] = temp;
    setTasks(newTasks);
    
    // Use individual task update instead of bulk reordering
    // Update the first task
    updateTaskMutation.mutate({
      id: taskToMoveUp.id,
      assignmentId: taskToMoveUp.assignmentId,
      description: taskToMoveUp.description,
      timeAllocation: taskToMoveUp.timeAllocation,
      order: taskIndex - 1,
      completed: taskToMoveUp.completed,
      timeSpent: taskToMoveUp.timeSpent || 0
    });
    
    // Update the second task
    updateTaskMutation.mutate({
      id: taskToMoveDown.id,
      assignmentId: taskToMoveDown.assignmentId,
      description: taskToMoveDown.description,
      timeAllocation: taskToMoveDown.timeAllocation,
      order: taskIndex,
      completed: taskToMoveDown.completed,
      timeSpent: taskToMoveDown.timeSpent || 0
    });
  };
  
  // Move task down in order
  const moveTaskDown = (taskIndex: number) => {
    if (taskIndex >= tasks.length - 1) return; // Already at the bottom
    
    // Create a copy of the tasks array
    const updatedTasks = [...tasks];
    
    // Get the tasks we need to swap
    const taskToMoveDown = updatedTasks[taskIndex];
    const taskToMoveUp = updatedTasks[taskIndex + 1];
    
    console.log("Task details - taskToMoveDown:", taskToMoveDown);
    console.log("Task details - taskToMoveUp:", taskToMoveUp);
    
    // Update local state immediately for better UX
    const newTasks = [...tasks];
    // Swap the tasks
    const temp = newTasks[taskIndex];
    newTasks[taskIndex] = newTasks[taskIndex + 1];
    newTasks[taskIndex + 1] = temp;
    setTasks(newTasks);
    
    // Use individual task update instead of bulk reordering
    // Update the first task
    updateTaskMutation.mutate({
      id: taskToMoveDown.id,
      assignmentId: taskToMoveDown.assignmentId,
      description: taskToMoveDown.description,
      timeAllocation: taskToMoveDown.timeAllocation,
      order: taskIndex + 1,
      completed: taskToMoveDown.completed,
      timeSpent: taskToMoveDown.timeSpent || 0
    });
    
    // Update the second task
    updateTaskMutation.mutate({
      id: taskToMoveUp.id,
      assignmentId: taskToMoveUp.assignmentId,
      description: taskToMoveUp.description,
      timeAllocation: taskToMoveUp.timeAllocation,
      order: taskIndex,
      completed: taskToMoveUp.completed,
      timeSpent: taskToMoveUp.timeSpent || 0
    });
  };

  // Calculate total time
  const totalTimeMinutes = tasks.reduce(
    (sum, task) => sum + task.timeAllocation, 
    0
  );
  
  // Format time as hours and minutes
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours > 0 ? `${hours}h ` : ''}${mins > 0 ? `${mins}m` : ''}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Tasks</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            Total: {formatTime(totalTimeMinutes)}
          </Badge>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setIsAddingTask(true)}
            disabled={isAddingTask}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
        </div>
      </div>
      
      <Separator className="my-4" />
      
      {/* Task list */}
      {isLoading ? (
        <p>Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">
          No tasks yet. Add tasks to break down this assignment.
        </p>
      ) : (
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <Card
              key={task.id}
              className={`p-3 ${
                editingTaskId === task.id 
                  ? "ring-2 ring-primary" 
                  : "hover:bg-muted/50"
              }`}
            >
              {editingTaskId === task.id ? (
                <Form {...editTaskForm}>
                  <form 
                    onSubmit={editTaskForm.handleSubmit(onEditTask)}
                    className="space-y-3"
                  >
                    <div className="flex gap-3">
                      <FormField
                        control={editTaskForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Task description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editTaskForm.control}
                        name="timeAllocation"
                        render={({ field }) => (
                          <FormItem className="w-24">
                            <FormControl>
                              <Input 
                                type="number" 
                                min={1} 
                                placeholder="Minutes" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setEditingTaskId(null)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        size="sm"
                        disabled={updateTaskMutation.isPending}
                      >
                        {updateTaskMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center mr-2">
                      <div className="rounded-full w-5 h-5 bg-muted flex items-center justify-center text-xs font-medium mb-1">
                        {index + 1}
                      </div>
                      <div className="flex flex-col">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-5 w-5 p-0 text-muted-foreground hover:text-primary"
                          disabled={index === 0}
                          onClick={() => moveTaskUp(index)}
                          title="Move task up"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-5 w-5 p-0 text-muted-foreground hover:text-primary"
                          disabled={index === tasks.length - 1}
                          onClick={() => moveTaskDown(index)}
                          title="Move task down"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{task.description}</span>
                      <Badge variant="secondary" className="w-fit mt-1">
                        {formatTime(task.timeAllocation)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => startEditTask(task)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      
      {/* Add task form */}
      {isAddingTask && (
        <Card className="p-4 border-dashed">
          <Form {...addTaskForm}>
            <form 
              onSubmit={addTaskForm.handleSubmit(onAddTask)}
              className="space-y-3"
            >
              <div className="flex gap-3">
                <FormField
                  control={addTaskForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Task description</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Research sources" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addTaskForm.control}
                  name="timeAllocation"
                  render={({ field }) => (
                    <FormItem className="w-28">
                      <FormLabel>Minutes</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1} 
                          placeholder="Minutes" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsAddingTask(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createTaskMutation.isPending}
                >
                  {createTaskMutation.isPending ? "Adding..." : "Add Task"}
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      )}
    </div>
  );
}