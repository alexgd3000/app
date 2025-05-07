import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table - optional for future auth implementation
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Assignment table
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  course: text("course").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date").notNull(),
  priority: text("priority").notNull(), // high, medium, low
  estimatedTime: integer("estimated_time").notNull(), // in minutes
  timeAvailable: integer("time_available").notNull(), // in minutes
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Task table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull(),
  description: text("description").notNull(),
  timeAllocation: integer("time_allocation").notNull(), // in minutes
  completed: boolean("completed").default(false),
  order: integer("order").notNull().default(0),
  timeSpent: integer("time_spent").notNull().default(0), // in minutes
});

// Schedule table
export const scheduleItems = pgTable("schedule_items", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  completed: boolean("completed").default(false),
});

// Define Zod schemas for insert operations
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertAssignmentSchema = createInsertSchema(assignments).pick({
  title: true,
  course: true,
  description: true,
  dueDate: true,
  priority: true,
  estimatedTime: true, 
  timeAvailable: true,
  completed: true,
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  assignmentId: true,
  description: true,
  timeAllocation: true,
  completed: true,
  order: true,
  timeSpent: true,
});

export const insertScheduleItemSchema = createInsertSchema(scheduleItems).pick({
  taskId: true,
  startTime: true,
  endTime: true,
  completed: true,
});

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type ScheduleItem = typeof scheduleItems.$inferSelect;
export type InsertScheduleItem = z.infer<typeof insertScheduleItemSchema>;

// Add priority type for validation
export const PriorityEnum = z.enum(["high", "medium", "low"]);
export type Priority = z.infer<typeof PriorityEnum>;
