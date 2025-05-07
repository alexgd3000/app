import type { Express, Request, Response } from "express";
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
      // Convert string time values to minutes
      const body = {
        ...req.body,
        estimatedTime: Math.round(parseFloat(req.body.estimatedTime)), // Store as-is, no conversion
        timeAvailable: 120, // Default value of 2 hours
        dueDate: new Date(req.body.dueDate)
      };
      
      // Validate the request body
      const validatedData = insertAssignmentSchema.parse(body);
      
      // Ensure priority is valid
      PriorityEnum.parse(validatedData.priority);
      
      const assignment = await storage.createAssignment(validatedData);
      return res.status(201).json(assignment);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  });
  
  app.put("/api/assignments/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      
      // Format time data if present
      let body = req.body;
      if (body.estimatedTime !== undefined) {
        body.estimatedTime = Math.round(parseFloat(body.estimatedTime));
      }
      if (body.timeAvailable !== undefined) {
        body.timeAvailable = Math.round(parseFloat(body.timeAvailable) * 60);
      }
      if (body.dueDate !== undefined) {
        body.dueDate = new Date(body.dueDate);
      }
      
      // Check if priority is valid
      if (body.priority) {
        PriorityEnum.parse(body.priority);
      }
      
      const updated = await storage.updateAssignment(id, body);
      if (!updated) {
        return res.status(404).json({ message: "Assignment not found" });
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
  
  app.post("/api/tasks", async (req: Request, res: Response) => {
    try {
      // Convert timeAllocation to minutes
      const body = {
        ...req.body,
        timeAllocation: Math.round(parseFloat(req.body.timeAllocation))
      };
      
      const validatedData = insertTaskSchema.parse(body);
      const task = await storage.createTask(validatedData);
      
      // Update the assignment's estimated time to be the sum of all tasks
      const allTasks = await storage.getTasksByAssignment(task.assignmentId);
      const totalTime = allTasks.reduce((sum, t) => sum + t.timeAllocation, 0);
      
      await storage.updateAssignment(task.assignmentId, {
        estimatedTime: totalTime
      });
      
      return res.status(201).json(task);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  });
  
  app.put("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      
      // Format time data if present
      let body = req.body;
      if (body.timeAllocation !== undefined) {
        body.timeAllocation = Math.round(parseFloat(body.timeAllocation));
      }
      if (body.timeSpent !== undefined) {
        body.timeSpent = Math.round(parseFloat(body.timeSpent));
      }
      
      const updated = await storage.updateTask(id, body);
      if (!updated) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Update the assignment's estimated time
      const allTasks = await storage.getTasksByAssignment(updated.assignmentId);
      const totalTime = allTasks.reduce((sum, t) => sum + t.timeAllocation, 0);
      
      await storage.updateAssignment(updated.assignmentId, {
        estimatedTime: totalTime
      });
      
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
      
      await storage.updateTasksOrder(tasks);
      return res.json({ message: "Tasks reordered successfully" });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });
  
  app.delete("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      
      // Get the task before deleting to know its assignment
      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      const assignmentId = task.assignmentId;
      const success = await storage.deleteTask(id);
      
      if (!success) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Update the assignment's estimated time
      const remainingTasks = await storage.getTasksByAssignment(assignmentId);
      const totalTime = remainingTasks.reduce((sum, t) => sum + t.timeAllocation, 0);
      
      await storage.updateAssignment(assignmentId, {
        estimatedTime: totalTime
      });
      
      return res.json({ message: "Task deleted successfully" });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });
  
  // Schedule API
  app.get("/api/schedule", async (req: Request, res: Response) => {
    try {
      // Default to today if no date provided
      const dateParam = req.query.date as string || new Date().toISOString();
      const date = new Date(dateParam);
      
      if (isNaN(date.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
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
      const { assignmentIds, startDate, availableMinutes } = req.body;
      
      if (!Array.isArray(assignmentIds) || assignmentIds.length === 0) {
        return res.status(400).json({ message: "Assignment IDs must be a non-empty array" });
      }
      
      const date = startDate ? new Date(startDate) : new Date();
      if (isNaN(date.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      // Convert availableMinutes to a number if it exists
      const minutes = availableMinutes ? Number(availableMinutes) : undefined;
      
      const result = await storage.generateSchedule(assignmentIds, date, minutes);
      
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
        availableMinutes: minutes
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
