import { 
  users, type User, type InsertUser,
  assignments, type Assignment, type InsertAssignment,
  tasks, type Task, type InsertTask,
  scheduleItems, type ScheduleItem, type InsertScheduleItem
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Assignment operations
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  getAssignment(id: number): Promise<Assignment | undefined>;
  getAllAssignments(): Promise<Assignment[]>;
  getIncompleteAssignments(): Promise<Assignment[]>;
  updateAssignment(id: number, data: Partial<InsertAssignment>): Promise<Assignment | undefined>;
  deleteAssignment(id: number): Promise<boolean>;
  
  // Task operations
  createTask(task: InsertTask): Promise<Task>;
  getTask(id: number): Promise<Task | undefined>;
  getTasksByAssignment(assignmentId: number): Promise<Task[]>;
  updateTask(id: number, data: Partial<InsertTask>): Promise<Task | undefined>;
  updateTasksOrder(tasks: {id: number, order: number}[]): Promise<boolean>;
  deleteTask(id: number): Promise<boolean>;
  
  // Schedule operations
  createScheduleItem(scheduleItem: InsertScheduleItem): Promise<ScheduleItem>;
  getScheduleItem(id: number): Promise<ScheduleItem | undefined>;
  getScheduleForDate(date: Date): Promise<ScheduleItem[]>;
  updateScheduleItem(id: number, data: Partial<InsertScheduleItem>): Promise<ScheduleItem | undefined>;
  deleteScheduleItem(id: number): Promise<boolean>;
  
  // Helper methods for generating schedules
  generateSchedule(assignmentIds: number[], startDate: Date): Promise<ScheduleItem[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private assignments: Map<number, Assignment>;
  private tasks: Map<number, Task>;
  private scheduleItems: Map<number, ScheduleItem>;
  
  private userCurrentId: number;
  private assignmentCurrentId: number;
  private taskCurrentId: number;
  private scheduleItemCurrentId: number;

  constructor() {
    this.users = new Map();
    this.assignments = new Map();
    this.tasks = new Map();
    this.scheduleItems = new Map();
    
    this.userCurrentId = 1;
    this.assignmentCurrentId = 1;
    this.taskCurrentId = 1;
    this.scheduleItemCurrentId = 1;
    
    // Add some initial data for testing
    this.addTestData();
  }

  private addTestData() {
    // Sample assignments for demo
    const literatureEssay: InsertAssignment = {
      title: "Literature Essay",
      course: "American Literature 301",
      description: "Write a 5-page essay analyzing the themes in 'The Great Gatsby'",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Due in 2 days
      priority: "high",
      estimatedTime: 240, // 4 hours in minutes
      timeAvailable: 300, // 5 hours in minutes
      completed: false
    };
    
    const physicsReport: InsertAssignment = {
      title: "Physics Lab Report",
      course: "Physics 202",
      description: "Submit a lab report on the pendulum experiment",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Due in 5 days
      priority: "medium",
      estimatedTime: 180, // 3 hours in minutes
      timeAvailable: 240, // 4 hours in minutes
      completed: false
    };
    
    const mathProblemSet: InsertAssignment = {
      title: "Math Problem Set",
      course: "Calculus II",
      description: "Complete problems 1-20 from Chapter 7",
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Due tomorrow
      priority: "low",
      estimatedTime: 120, // 2 hours in minutes
      timeAvailable: 150, // 2.5 hours in minutes
      completed: false
    };
    
    // Create assignments
    this.createAssignment(literatureEssay).then(lit => {
      // Tasks for Literature Essay
      this.createTask({
        assignmentId: lit.id,
        description: "Create outline with thesis",
        timeAllocation: 45,
        completed: false,
        order: 0,
        timeSpent: 0
      });
      
      this.createTask({
        assignmentId: lit.id,
        description: "Research supporting evidence",
        timeAllocation: 90,
        completed: false,
        order: 1,
        timeSpent: 0
      });
      
      this.createTask({
        assignmentId: lit.id,
        description: "Write first draft",
        timeAllocation: 75,
        completed: false,
        order: 2,
        timeSpent: 0
      });
      
      this.createTask({
        assignmentId: lit.id,
        description: "Revise and edit",
        timeAllocation: 30,
        completed: false,
        order: 3,
        timeSpent: 0
      });
    });
    
    this.createAssignment(physicsReport).then(physics => {
      // Tasks for Physics Lab Report
      this.createTask({
        assignmentId: physics.id,
        description: "Organize experimental data",
        timeAllocation: 45,
        completed: true,
        order: 0,
        timeSpent: 45
      });
      
      this.createTask({
        assignmentId: physics.id,
        description: "Write methodology section",
        timeAllocation: 30,
        completed: true,
        order: 1,
        timeSpent: 30
      });
      
      this.createTask({
        assignmentId: physics.id,
        description: "Analyze results",
        timeAllocation: 60,
        completed: false,
        order: 2,
        timeSpent: 0
      });
      
      this.createTask({
        assignmentId: physics.id,
        description: "Write conclusion",
        timeAllocation: 45,
        completed: false,
        order: 3,
        timeSpent: 0
      });
    });
    
    this.createAssignment(mathProblemSet).then(math => {
      // Tasks for Math Problem Set
      this.createTask({
        assignmentId: math.id,
        description: "Review lecture notes on differentiation",
        timeAllocation: 15,
        completed: true,
        order: 0,
        timeSpent: 15
      });
      
      this.createTask({
        assignmentId: math.id,
        description: "Solve differential equations (problems 1-5)",
        timeAllocation: 45,
        completed: false,
        order: 1,
        timeSpent: 23
      });
      
      this.createTask({
        assignmentId: math.id,
        description: "Complete integration problems (6-10)",
        timeAllocation: 45,
        completed: false,
        order: 2,
        timeSpent: 0
      });
      
      this.createTask({
        assignmentId: math.id,
        description: "Check answers and review work",
        timeAllocation: 15,
        completed: false,
        order: 3,
        timeSpent: 0
      });
      
      // Create schedule items for today
      const now = new Date();
      now.setHours(9, 0, 0, 0);
      
      this.getTasksByAssignment(math.id).then(mathTasks => {
        if (mathTasks.length >= 2) {
          const start1 = new Date(now);
          const end1 = new Date(now);
          end1.setMinutes(end1.getMinutes() + 45);
          
          this.createScheduleItem({
            taskId: mathTasks[1].id, // "Solve differential equations (problems 1-5)"
            startTime: start1,
            endTime: end1,
            completed: false
          });
          
          const start2 = new Date(end1);
          const end2 = new Date(start2);
          end2.setMinutes(end2.getMinutes() + 45);
          
          this.createScheduleItem({
            taskId: mathTasks[2].id, // "Complete integration problems (6-10)"
            startTime: start2,
            endTime: end2,
            completed: false
          });
        }
      });
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Assignment operations
  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const id = this.assignmentCurrentId++;
    const newAssignment: Assignment = { 
      ...assignment, 
      id, 
      createdAt: new Date() 
    };
    this.assignments.set(id, newAssignment);
    return newAssignment;
  }
  
  async getAssignment(id: number): Promise<Assignment | undefined> {
    return this.assignments.get(id);
  }
  
  async getAllAssignments(): Promise<Assignment[]> {
    return Array.from(this.assignments.values());
  }
  
  async getIncompleteAssignments(): Promise<Assignment[]> {
    return Array.from(this.assignments.values())
      .filter(assignment => !assignment.completed)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }
  
  async updateAssignment(id: number, data: Partial<InsertAssignment>): Promise<Assignment | undefined> {
    const assignment = this.assignments.get(id);
    if (!assignment) return undefined;
    
    const updatedAssignment = { ...assignment, ...data };
    this.assignments.set(id, updatedAssignment);
    return updatedAssignment;
  }
  
  async deleteAssignment(id: number): Promise<boolean> {
    // Delete all related tasks first
    const tasks = await this.getTasksByAssignment(id);
    for (const task of tasks) {
      await this.deleteTask(task.id);
    }
    
    return this.assignments.delete(id);
  }
  
  // Task operations
  async createTask(task: InsertTask): Promise<Task> {
    const id = this.taskCurrentId++;
    const newTask: Task = { ...task, id };
    this.tasks.set(id, newTask);
    return newTask;
  }
  
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async getTasksByAssignment(assignmentId: number): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.assignmentId === assignmentId)
      .sort((a, b) => a.order - b.order);
  }
  
  async updateTask(id: number, data: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...data };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  async updateTasksOrder(tasks: {id: number, order: number}[]): Promise<boolean> {
    for (const { id, order } of tasks) {
      const task = this.tasks.get(id);
      if (task) {
        this.tasks.set(id, { ...task, order });
      }
    }
    return true;
  }
  
  async deleteTask(id: number): Promise<boolean> {
    // Delete all related schedule items first
    const scheduleItems = Array.from(this.scheduleItems.values())
      .filter(item => item.taskId === id);
    
    for (const item of scheduleItems) {
      this.scheduleItems.delete(item.id);
    }
    
    return this.tasks.delete(id);
  }
  
  // Schedule operations
  async createScheduleItem(scheduleItem: InsertScheduleItem): Promise<ScheduleItem> {
    const id = this.scheduleItemCurrentId++;
    const newItem: ScheduleItem = { ...scheduleItem, id };
    this.scheduleItems.set(id, newItem);
    return newItem;
  }
  
  async getScheduleItem(id: number): Promise<ScheduleItem | undefined> {
    return this.scheduleItems.get(id);
  }
  
  async getScheduleForDate(date: Date): Promise<ScheduleItem[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return Array.from(this.scheduleItems.values())
      .filter(item => {
        return item.startTime >= startOfDay && item.startTime <= endOfDay;
      })
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }
  
  async updateScheduleItem(id: number, data: Partial<InsertScheduleItem>): Promise<ScheduleItem | undefined> {
    const item = this.scheduleItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...data };
    this.scheduleItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async deleteScheduleItem(id: number): Promise<boolean> {
    return this.scheduleItems.delete(id);
  }
  
  // Generate a schedule based on assignment tasks and constraints
  async generateSchedule(assignmentIds: number[], startDate: Date): Promise<ScheduleItem[]> {
    const result: ScheduleItem[] = [];
    const currentDate = new Date(startDate);
    
    // Get all tasks for the given assignments
    let allTasks: Task[] = [];
    for (const assignmentId of assignmentIds) {
      const tasks = await this.getTasksByAssignment(assignmentId);
      allTasks = [...allTasks, ...tasks.filter(task => !task.completed)];
    }
    
    // Sort tasks by assignment priority and due date
    const assignmentsMap = new Map<number, Assignment>();
    for (const assignmentId of assignmentIds) {
      const assignment = await this.getAssignment(assignmentId);
      if (assignment) {
        assignmentsMap.set(assignmentId, assignment);
      }
    }
    
    // Sort tasks:
    // 1. First by assignment priority (high > medium > low)
    // 2. Then by due date (closest first)
    allTasks.sort((a, b) => {
      const assignmentA = assignmentsMap.get(a.assignmentId);
      const assignmentB = assignmentsMap.get(b.assignmentId);
      
      if (!assignmentA || !assignmentB) return 0;
      
      // Priority sorting
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[assignmentA.priority as keyof typeof priorityOrder] - 
                           priorityOrder[assignmentB.priority as keyof typeof priorityOrder];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Due date sorting
      return assignmentA.dueDate.getTime() - assignmentB.dueDate.getTime();
    });
    
    // Start scheduling at the provided date, starting at 9 AM
    currentDate.setHours(9, 0, 0, 0);
    
    // Schedule each task
    for (const task of allTasks) {
      // Create a schedule item
      const startTime = new Date(currentDate);
      const endTime = new Date(currentDate);
      endTime.setMinutes(endTime.getMinutes() + task.timeAllocation);
      
      // Add a break if working for too long (after 2 hours)
      if (currentDate.getHours() >= 11 && currentDate.getHours() < 13) {
        // Add lunch break
        currentDate.setHours(13, 0, 0, 0);
        
        // Reset start and end time
        const newStartTime = new Date(currentDate);
        const newEndTime = new Date(currentDate);
        newEndTime.setMinutes(newEndTime.getMinutes() + task.timeAllocation);
        
        const scheduleItem = await this.createScheduleItem({
          taskId: task.id,
          startTime: newStartTime,
          endTime: newEndTime,
          completed: false
        });
        
        result.push(scheduleItem);
        
        // Move time forward
        currentDate.setTime(newEndTime.getTime());
      } else {
        // Normal scheduling
        const scheduleItem = await this.createScheduleItem({
          taskId: task.id,
          startTime,
          endTime,
          completed: false
        });
        
        result.push(scheduleItem);
        
        // Move time forward
        currentDate.setTime(endTime.getTime());
      }
      
      // Add a 15-minute break after every 2 hours of work
      if (result.length % 3 === 0) {
        currentDate.setMinutes(currentDate.getMinutes() + 15);
      }
      
      // If we reach the end of the day (6pm), move to the next day
      if (currentDate.getHours() >= 18) {
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(9, 0, 0, 0);
      }
    }
    
    return result;
  }
}

export const storage = new MemStorage();
