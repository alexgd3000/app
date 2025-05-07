import { z } from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import { insertAssignmentSchema, PriorityEnum, Assignment } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// Create a schema for assignment editing
const editAssignmentSchema = insertAssignmentSchema
  .extend({
    id: z.number(),
  })
  .omit({ completed: true, createdAt: true });

type EditAssignmentFormValues = z.infer<typeof editAssignmentSchema>;

interface EditAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: Assignment | null;
  onAssignmentUpdated?: () => void;
}

export default function EditAssignmentDialog({
  open,
  onOpenChange,
  assignment,
  onAssignmentUpdated,
}: EditAssignmentDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  // Set up the form with default values from the assignment
  const form = useForm<EditAssignmentFormValues>({
    resolver: zodResolver(editAssignmentSchema),
    defaultValues: assignment
      ? {
          id: assignment.id,
          title: assignment.title,
          course: assignment.course,
          description: assignment.description || "",
          dueDate: new Date(assignment.dueDate),
          priority: assignment.priority as z.infer<typeof PriorityEnum>,
          estimatedTime: assignment.estimatedTime,
        }
      : {
          id: 0,
          title: "",
          course: "",
          description: "",
          dueDate: new Date(),
          priority: "medium",
          estimatedTime: 120,
        },
  });

  // Reset form when assignment changes
  useState(() => {
    if (assignment) {
      form.reset({
        id: assignment.id,
        title: assignment.title,
        course: assignment.course,
        description: assignment.description || "",
        dueDate: new Date(assignment.dueDate),
        priority: assignment.priority as z.infer<typeof PriorityEnum>,
        estimatedTime: assignment.estimatedTime,
      });
    }
  });

  // Update assignment mutation
  const updateMutation = useMutation({
    mutationFn: async (data: EditAssignmentFormValues) => {
      const { id, ...updateData } = data;
      const response = await apiRequest("PUT", `/api/assignments/${id}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/assignments/incomplete'] });
      if (assignment?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/assignments/${assignment.id}`] });
      }
      
      toast({
        title: "Assignment updated",
        description: "Your assignment has been updated successfully.",
      });
      
      onOpenChange(false);
      if (onAssignmentUpdated) {
        onAssignmentUpdated();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update assignment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete assignment mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/assignments/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/assignments/incomplete'] });
      
      toast({
        title: "Assignment deleted",
        description: "The assignment has been deleted successfully.",
      });
      
      onOpenChange(false);
      if (onAssignmentUpdated) {
        onAssignmentUpdated();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete assignment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: EditAssignmentFormValues) => {
    updateMutation.mutate(data);
  };

  // Handle delete confirmation
  const handleDelete = () => {
    if (!isDeleting) {
      setIsDeleting(true);
      return;
    }
    
    if (assignment) {
      deleteMutation.mutate(assignment.id);
    }
  };
  
  // Cancel delete
  const cancelDelete = () => {
    setIsDeleting(false);
  };

  return (
    <Dialog open={open && assignment !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Edit Assignment</DialogTitle>
          <DialogDescription>
            Update the details of your assignment. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignment Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Research Paper" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="course"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course / Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Biology 101" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add more details about the assignment..." 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className="w-full pl-3 text-left font-normal flex justify-between"
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="estimatedTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Time (minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormDescription>
                    Total time needed for this assignment
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex justify-between !mt-8">
              <div>
                {!isDeleting ? (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={handleDelete}
                  >
                    Delete
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="destructive" 
                      onClick={handleDelete}
                    >
                      Confirm Delete
                    </Button>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={cancelDelete}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
              <Button 
                type="submit" 
                disabled={updateMutation.isPending || deleteMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}