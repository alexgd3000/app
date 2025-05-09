import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertAssignmentSchema, 
  insertTaskSchema, 
  PriorityEnum
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Assignments API
  app.get("/api/assignments", async (req: Request, res: Response) => {
    try {
      const assignments = await storage.getAllAssignments();
      return res.json(assignments);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/assignments/incomplete", async (req: Request, res: Response) => {
    try {
      const assignments = await storage.getIncompleteAssignments();
      return res.json(assignments);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });
  
  // Get completed assignments
  app.get("/api/assignments/completed", async (req: Request, res: Response) => {
    try {
      const allAssignments = await storage.getAllAssignments();
      const completedAssignments = allAssignments.filter(assignment => assignment.completed === true);
      return res.json(completedAssignments);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/assignments/:id", async (req: Request, res: Response) => {
    try {
      const assignment = await storage.getAssignment(Number(req.params.id));
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      return res.json(assignment);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/assignments", async (req: Request, res: Response) => {
    try {
      // First validate the request body 
      const result = insertAssignmentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid assignment data",
          errors: result.error.flatten().fieldErrors
        });
      }
      
      // Create the assignment
      const newAssignment = await storage.createAssignment(result.data);
      return res.status(201).json(newAssignment);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  });
  
  app.put("/api/assignments/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      
      // Validate priority if provided
      if (req.body.priority && !PriorityEnum.safeParse(req.body.priority).success) {
        return res.status(400).json({ 
          message: "Invalid priority value. Must be 'high', 'medium', or 'low'."
        });
      }
      
      const updated = await storage.updateAssignment(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      // If marking assignment as completed/uncompleted, update all associated tasks
      if (req.body.hasOwnProperty('completed')) {
        const tasks = await storage.getTasksByAssignment(id);
        
        // Update all tasks to match the assignment completion status
        for (const task of tasks) {
          await storage.updateTask(task.id, { completed: req.body.completed });
        }
        
        // Get the updated tasks to return
        const updatedTasks = await storage.getTasksByAssignment(id);
        return res.json({ assignment: updated, tasks: updatedTasks });
      }
      
      return res.json(updated);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  });
  
  app.delete("/api/assignments/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteAssignment(id);
      if (!success) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      return res.json({ message: "Assignment deleted successfully" });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  // Tasks API
  app.get("/api/assignments/:assignmentId/tasks", async (req: Request, res: Response) => {
    try {
      const assignmentId = Number(req.params.assignmentId);
      const tasks = await storage.getTasksByAssignment(assignmentId);
      return res.json(tasks);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      return res.json(task);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/tasks", async (req: Request, res: Response) => {
    try {
      // First validate the request body 
      const result = insertTaskSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid task data",
          errors: result.error.flatten().fieldErrors
        });
      }
      
      // Create the task
      const newTask = await storage.createTask(result.data);
      return res.status(201).json(newTask);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  });
  
  app.put("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const updated = await storage.updateTask(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Task not found" });
      }
      return res.json(updated);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  });
  
  app.put("/api/tasks/reorder", async (req: Request, res: Response) => {
    try {
      const { tasks } = req.body;
      
      if (!Array.isArray(tasks)) {
        return res.status(400).json({ message: "Tasks must be an array" });
      }
      
      const success = await storage.updateTasksOrder(tasks);
      if (!success) {
        return res.status(400).json({ message: "Failed to reorder tasks" });
      }
      
      return res.json({ message: "Tasks reordered successfully" });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  });
  
  app.delete("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteTask(id);
      if (!success) {
        return res.status(404).json({ message: "Task not found" });
      }
      return res.json({ message: "Task deleted successfully" });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });
  
  // Schedule API
  app.get("/api/schedule", async (req: Request, res: Response) => {
    try {
      // Parse date from query or use today's date
      let date = new Date();
      
      if (req.query.date) {
        date = new Date(req.query.date as string);
        if (isNaN(date.getTime())) {
          return res.status(400).json({ message: "Invalid date format" });
        }
      }
      
      console.log("Getting schedule for date:", date.toISOString());
      const scheduleItems = await storage.getScheduleForDate(date);
      
      // Expand schedule items to include task and assignment details
      const expandedItems = await Promise.all(
        scheduleItems.map(async (item) => {
          const task = await storage.getTask(item.taskId);
          if (!task) return { ...item, task: null, assignment: null };
          
          const assignment = await storage.getAssignment(task.assignmentId);
          return { ...item, task, assignment };
        })
      );
      
      return res.json(expandedItems);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/schedule/generate", async (req: Request, res: Response) => {
    try {
      const { assignmentIds, startDate, availableMinutes, prioritizeTodaysDue } = req.body;
      
      if (!Array.isArray(assignmentIds) || assignmentIds.length === 0) {
        return res.status(400).json({ message: "Assignment IDs must be a non-empty array" });
      }
      
      const date = startDate ? new Date(startDate) : new Date();
      if (isNaN(date.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      console.log("Generating schedule for date:", date.toISOString());
      console.log("Assignment IDs:", assignmentIds);
      
      // Convert availableMinutes to a number if it exists
      const minutes = availableMinutes ? Number(availableMinutes) : undefined;
      console.log("Available minutes:", minutes);
      
      const result = await storage.generateSchedule(
        assignmentIds, 
        date, 
        minutes,
        prioritizeTodaysDue === true // Pass the prioritization flag
      );
      
      // Expand schedule items to include task and assignment details
      const expandedItems = await Promise.all(
        result.scheduleItems.map(async (item) => {
          const task = await storage.getTask(item.taskId);
          if (!task) return { ...item, task: null, assignment: null };
          
          const assignment = await storage.getAssignment(task.assignmentId);
          return { ...item, task, assignment };
        })
      );
      
      // Return both the expanded schedule items and information about tasks that couldn't be scheduled
      return res.json({
        scheduleItems: expandedItems,
        notScheduled: result.notScheduled,
        totalTasksTime: result.totalTasksTime,
        todaysDueTasksTime: result.todaysDueTasksTime || 0,
        availableMinutes: minutes,
        todaysDueCompleted: result.todaysDueCompleted || false,
        extraTasksAdded: result.extraTasksAdded || 0,
        todaysUnscheduledCount: result.todaysUnscheduledCount || 0,
        unscheduledTaskDetails: result.unscheduledTaskDetails || []
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/schedule/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const updated = await storage.updateScheduleItem(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Schedule item not found" });
      }
      return res.json(updated);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  });
  
  app.delete("/api/schedule/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteScheduleItem(id);
      if (!success) {
        return res.status(404).json({ message: "Schedule item not found" });
      }
      return res.json({ message: "Schedule item deleted successfully" });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}