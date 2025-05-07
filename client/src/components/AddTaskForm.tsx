import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

interface AddTaskFormProps {
  assignmentId: number;
  onTaskCreated?: () => void;
  embedded?: boolean;
}

const taskFormSchema = z.object({
  description: z.string().min(1, "Task description is required"),
  timeAllocation: z.coerce.number().min(1, "Time allocation must be at least 1 minute"),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export default function AddTaskForm({ assignmentId, onTaskCreated, embedded = false }: AddTaskFormProps) {
  const { toast } = useToast();
  const [isFormVisible, setIsFormVisible] = useState(embedded);
  
  // Form setup
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      description: "",
      timeAllocation: 30, // Default to 30 minutes
    },
  });
  
  // Mutation for creating task
  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormValues & { assignmentId: number }) => {
      const response = await apiRequest("POST", "/api/tasks", data);
      return response.json();
    },
    onSuccess: () => {
      // Reset form and hide it if not embedded
      form.reset();
      if (!embedded) {
        setIsFormVisible(false);
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`/api/assignments/${assignmentId}/tasks`] });
      
      // Callback
      if (onTaskCreated) {
        onTaskCreated();
      }
      
      toast({
        title: "Task added",
        description: "Your task has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding task",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: TaskFormValues) => {
    createTaskMutation.mutate({
      ...data,
      assignmentId,
    });
  };
  
  return (
    <div className="mt-4">
      {!isFormVisible ? (
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center"
          onClick={() => setIsFormVisible(true)}
        >
          <i className="ri-add-line mr-2"></i>
          Add Task
        </Button>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Task description..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex items-center space-x-2">
              <FormField
                control={form.control}
                name="timeAllocation"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <div className="flex items-center">
                        <Input 
                          type="number" 
                          min={1}
                          placeholder="Minutes" 
                          className="w-24" 
                          {...field}
                        />
                        <span className="ml-2 text-sm text-gray-500">minutes</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex space-x-2">
                <Button 
                  type="submit" 
                  size="sm"
                  disabled={createTaskMutation.isPending}
                >
                  {createTaskMutation.isPending ? "Adding..." : "Add"}
                </Button>
                
                {!embedded && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      form.reset();
                      setIsFormVisible(false);
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
