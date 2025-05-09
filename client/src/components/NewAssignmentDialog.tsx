import { useState } from "react";
import { z } from "zod";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddTaskForm from "@/components/AddTaskForm";

interface NewAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssignmentCreated?: () => void;
}

// Form schema
const assignmentFormSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  course: z.string().min(1, "Course is required"),
  description: z.string().optional(),
  dueDate: z.coerce.date(),
  priority: z.enum(["high", "medium", "low"]),
  estimatedTime: z.coerce.number().default(0),
  timeAvailable: z.coerce.number().default(120), // Default 2 hours in minutes
});

type AssignmentFormValues = z.infer<typeof assignmentFormSchema>;

export default function NewAssignmentDialog({ open, onOpenChange, onAssignmentCreated }: NewAssignmentDialogProps) {
  const { toast } = useToast();
  const [createdAssignmentId, setCreatedAssignmentId] = useState<number | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  
  // Set default values for the form
  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      title: "",
      course: "",
      description: "",
      dueDate: format(new Date(), "yyyy-MM-dd"),
      priority: "medium",
      estimatedTime: 0,
    },
  });
  
  // Mutation for creating a new assignment
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: AssignmentFormValues) => {
      const response = await apiRequest("POST", "/api/assignments", data);
      return response.json();
    },
    onSuccess: (data) => {
      setCreatedAssignmentId(data.id);
      setShowTaskForm(true);
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/assignments/incomplete'] });
      
      toast({
        title: "Assignment created",
        description: "Your new assignment has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating assignment",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: AssignmentFormValues) => {
    createAssignmentMutation.mutate(data);
  };
  
  const handleClose = () => {
    // Reset form on close
    form.reset();
    setCreatedAssignmentId(null);
    setShowTaskForm(false);
    onOpenChange(false);
    
    // Callback to refresh assignments list
    if (onAssignmentCreated) {
      onAssignmentCreated();
    }
  };
  
  const handleTaskCreated = () => {
    // After adding tasks, we could either stay in the dialog or close it
    if (onAssignmentCreated) {
      onAssignmentCreated();
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{showTaskForm ? "Add Tasks to Assignment" : "Create New Assignment"}</DialogTitle>
          <DialogDescription>
            {showTaskForm 
              ? "Break down your assignment into manageable tasks with time allocations." 
              : "Fill in the details to add a new assignment to your planner."}
          </DialogDescription>
        </DialogHeader>
        
        {!showTaskForm ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-4">
                      <FormLabel>Assignment Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter assignment title..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="course"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Course / Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Biology 101" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-6">
                      <FormLabel>Assignment Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the assignment requirements..." 
                          className="resize-none h-20"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-3">
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} min={format(new Date(), "yyyy-MM-dd")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-3">
                      <FormLabel>Priority</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="high">High Priority</SelectItem>
                          <SelectItem value="medium">Medium Priority</SelectItem>
                          <SelectItem value="low">Low Priority</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                

              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createAssignmentMutation.isPending}>
                  {createAssignmentMutation.isPending ? "Creating..." : "Create Assignment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Add tasks to break down your assignment. This will help you manage your time better.
            </p>
            
            <div className="border border-gray-200 rounded-md p-4 max-h-[300px] overflow-y-auto">
              {createdAssignmentId && (
                <AddTaskForm 
                  assignmentId={createdAssignmentId} 
                  onTaskCreated={handleTaskCreated} 
                  embedded={true}
                />
              )}
            </div>
            
            <DialogFooter>
              <Button onClick={handleClose}>
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
