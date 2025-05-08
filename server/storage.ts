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
  updateTasksOrder(tasks: {id: number, order: number, assignmentId?: number}[]): Promise<boolean>;
  deleteTask(id: number): Promise<boolean>;
  
  // Schedule operations
  createScheduleItem(scheduleItem: InsertScheduleItem): Promise<ScheduleItem>;
  getScheduleItem(id: number): Promise<ScheduleItem | undefined>;
  getScheduleForDate(date: Date): Promise<ScheduleItem[]>;
  updateScheduleItem(id: number, data: Partial<InsertScheduleItem>): Promise<ScheduleItem | undefined>;
  deleteScheduleItem(id: number): Promise<boolean>;
  
  // Helper methods for generating schedules
  generateSchedule(assignmentIds: number[], startDate: Date, availableMinutes?: number): Promise<{
    scheduleItems: ScheduleItem[];
    notScheduled: { taskId: number; assignmentId: number }[];
    totalTasksTime: number;
  }>;
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
      description: assignment.description || null,
      completed: assignment.completed || null,
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
    const newTask: Task = { 
      ...task, 
      id,
      completed: task.completed || null,
      order: task.order || 0,
      timeSpent: task.timeSpent || 0
    };
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
  
  async updateTasksOrder(tasks: {id: number, order: number, assignmentId?: number}[]): Promise<boolean> {
    console.log("Storage updateTasksOrder called with:", JSON.stringify(tasks));
    
    // Check if all tasks exist first
    for (const { id } of tasks) {
      const task = this.tasks.get(id);
      if (!task) {
        throw new Error(`Task with ID ${id} not found`);
      }
    }
    
    // If we get here, all tasks exist, so update them
    for (const { id, order } of tasks) {
      const task = this.tasks.get(id)!;
      this.tasks.set(id, { ...task, order });
      console.log(`Task ${id} updated to order ${order} (assignment: ${task.assignmentId})`);
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
    const newItem: ScheduleItem = { 
      ...scheduleItem, 
      id,
      completed: scheduleItem.completed || null
    };
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
  async generateSchedule(
    assignmentIds: number[], 
    startDate: Date, 
    availableMinutes?: number,
    prioritizeTodaysDue: boolean = true // Default to prioritizing today's due tasks
  ): Promise<{
    scheduleItems: ScheduleItem[];
    notScheduled: { taskId: number; assignmentId: number }[];
    totalTasksTime: number;
    todaysDueTasksTime: number; // Time needed for today's and overdue tasks only
    todaysDueCompleted: boolean;
    extraTasksAdded: number;
    todaysUnscheduledCount: number;
    unscheduledTaskDetails: { id: number; description: string; assignmentTitle: string; timeAllocation: number }[];
  }> {
    // Initialize result variables
    const result: ScheduleItem[] = [];
    const notScheduled: { taskId: number; assignmentId: number }[] = [];
    let scheduledTime = 0;
    let extraTasksAdded = 0;
    let todaysDueCompleted = false;
    
    // Set up scheduling dates
    const scheduleStartDate = new Date(startDate);
    // Current time for checking overdue assignments
    const nowDate = new Date();
    // Today's end of day for "due today" assignments
    const endOfToday = new Date(startDate);
    endOfToday.setHours(23, 59, 59, 999);
    
    // Start scheduling at 9 AM if earlier
    if (scheduleStartDate.getHours() < 9) {
      scheduleStartDate.setHours(9, 0, 0, 0);
    }
    
    // Set up current time pointer for scheduling
    let currentTimePointer = new Date(scheduleStartDate);
    
    // Calculate end time based on available minutes
    // No buffer needed - we want exact time calculations
    const BUFFER_MINUTES = 0; // Removed buffer
    let endTime = new Date(currentTimePointer);
    
    // Default to 480 minutes (8 hours) if no available minutes are specified
    let actualAvailableMinutes = availableMinutes ? availableMinutes : 480;
    
    if (availableMinutes) {
      // Set exact end time based on available minutes
      endTime.setMinutes(endTime.getMinutes() + actualAvailableMinutes);
    } else {
      // Default end time at 6 PM if no available minutes specified
      endTime.setHours(18, 0, 0, 0);
    }
    
    // Delete any existing schedule items for this date
    const existingItems = await this.getScheduleForDate(scheduleStartDate);
    for (const item of existingItems) {
      await this.deleteScheduleItem(item.id);
    }
    
    // Get all incomplete tasks for the assignments
    let allTasks: Task[] = [];
    const assignmentsMap = new Map<number, Assignment>();
    
    // First, fetch all tasks and assignments
    for (const assignmentId of assignmentIds) {
      const tasks = await this.getTasksByAssignment(assignmentId);
      const incompleteTasks = tasks.filter(t => !t.completed);
      allTasks = [...allTasks, ...incompleteTasks];
      
      const assignment = await this.getAssignment(assignmentId);
      if (assignment) {
        assignmentsMap.set(assignmentId, assignment);
      }
    }
    
    // Separate tasks into today's/overdue vs future tasks
    const todaysAndOverdueTasks: Task[] = [];
    const futureTasks: Task[] = [];
    let totalTimeNeeded = 0;
    let todaysDueTasksTime = 0;
    
    for (const task of allTasks) {
      const assignment = assignmentsMap.get(task.assignmentId);
      totalTimeNeeded += task.timeAllocation;
      
      if (assignment) {
        const dueDate = new Date(assignment.dueDate);
        if (dueDate <= endOfToday || dueDate < nowDate) {
          // Task is due today or overdue
          todaysDueTasksTime += task.timeAllocation;
          todaysAndOverdueTasks.push(task);
        } else {
          // Task is due in the future
          futureTasks.push(task);
        }
      }
    }
    
    // Sort today's and overdue tasks by:
    // 1. Overdue first
    // 2. Priority (high, medium, low)
    // 3. Due date (earliest first)
    todaysAndOverdueTasks.sort((a, b) => {
      const assignmentA = assignmentsMap.get(a.assignmentId);
      const assignmentB = assignmentsMap.get(b.assignmentId);
      
      if (!assignmentA || !assignmentB) return 0;
      
      // Check if tasks are overdue
      const aIsOverdue = new Date(assignmentA.dueDate) < nowDate;
      const bIsOverdue = new Date(assignmentB.dueDate) < nowDate;
      
      // Overdue tasks come first
      if (aIsOverdue && !bIsOverdue) return -1;
      if (!aIsOverdue && bIsOverdue) return 1;
      
      // Then sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = 
        priorityOrder[assignmentA.priority as keyof typeof priorityOrder] - 
        priorityOrder[assignmentB.priority as keyof typeof priorityOrder];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Finally sort by due date
      return assignmentA.dueDate.getTime() - assignmentB.dueDate.getTime();
    });
    
    // Sort future tasks similarly (by priority then due date)
    futureTasks.sort((a, b) => {
      const assignmentA = assignmentsMap.get(a.assignmentId);
      const assignmentB = assignmentsMap.get(b.assignmentId);
      
      if (!assignmentA || !assignmentB) return 0;
      
      // Sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = 
        priorityOrder[assignmentA.priority as keyof typeof priorityOrder] - 
        priorityOrder[assignmentB.priority as keyof typeof priorityOrder];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then sort by due date
      return assignmentA.dueDate.getTime() - assignmentB.dueDate.getTime();
    });
    
    // Combine the sorted task lists with today's/overdue tasks first
    const orderedTasks = [...todaysAndOverdueTasks, ...futureTasks];
    
    // Flag to track if we've encountered a task that exceeds available time
    let exceededAvailableTime = false;
    
    // Schedule tasks in order
    for (const task of orderedTasks) {
      const timeNeeded = task.timeAllocation;
      
      // If we already encountered a task that exceeds time, add all subsequent tasks to notScheduled
      if (exceededAvailableTime) {
        notScheduled.push({
          taskId: task.id,
          assignmentId: task.assignmentId
        });
        continue;
      }
      
      // Check if we don't have enough time left - use actualAvailableMinutes which includes buffer
      if (availableMinutes && scheduledTime + timeNeeded > actualAvailableMinutes) {
        exceededAvailableTime = true;
        notScheduled.push({
          taskId: task.id,
          assignmentId: task.assignmentId
        });
        continue;
      }
      
      // Check if task would end after our end time
      const taskEndTime = new Date(currentTimePointer.getTime() + timeNeeded * 60000);
      if (taskEndTime.getTime() > endTime.getTime()) {
        exceededAvailableTime = true;
        notScheduled.push({
          taskId: task.id,
          assignmentId: task.assignmentId
        });
        continue;
      }
      
      // Check if task crosses lunch hour (12-1pm)
      if (
        (currentTimePointer.getHours() < 12 && taskEndTime.getHours() >= 12) ||
        (currentTimePointer.getHours() === 12 && currentTimePointer.getMinutes() < 60)
      ) {
        // Adjust for lunch break - move start time to 1pm
        currentTimePointer.setHours(13, 0, 0, 0);
        
        // Recalculate end time after lunch
        taskEndTime.setTime(currentTimePointer.getTime() + timeNeeded * 60000);
        
        // Skip if after adjustment it doesn't fit in available time - use buffered value
        if (availableMinutes && scheduledTime + timeNeeded > actualAvailableMinutes) {
          exceededAvailableTime = true;
          notScheduled.push({
            taskId: task.id,
            assignmentId: task.assignmentId
          });
          continue;
        }
        
        // Skip if after adjustment it ends too late
        if (taskEndTime.getTime() > endTime.getTime()) {
          exceededAvailableTime = true;
          notScheduled.push({
            taskId: task.id,
            assignmentId: task.assignmentId
          });
          continue;
        }
      }
      
      // Create schedule item
      const scheduleItem = await this.createScheduleItem({
        taskId: task.id,
        startTime: new Date(currentTimePointer),
        endTime: new Date(taskEndTime),
        completed: false
      });
      
      // Add to results
      result.push(scheduleItem);
      scheduledTime += timeNeeded;
      
      // Move time pointer forward
      currentTimePointer = new Date(taskEndTime);
      
      // Add a 15-minute break after every 2 tasks, but only if there's room for it
      if (result.length % 3 === 0) {
        // Check if adding a break would exceed available time
        if (availableMinutes && scheduledTime + 15 > actualAvailableMinutes) {
          exceededAvailableTime = true;
          break;
        }
        
        // Add the break to our time tracking
        scheduledTime += 15;
        currentTimePointer.setMinutes(currentTimePointer.getMinutes() + 15);
      }
    }
    
    // Check if all today's/overdue tasks were scheduled
    const unscheduledTaskIds = notScheduled.map(item => item.taskId);
    const unscheduledTodaysTasks = todaysAndOverdueTasks.filter(
      task => unscheduledTaskIds.includes(task.id)
    );
    
    // All today's tasks are completed if none are in the unscheduled list
    todaysDueCompleted = unscheduledTodaysTasks.length === 0;
    
    // Count how many non-today tasks were scheduled
    extraTasksAdded = result.filter(
      item => !todaysAndOverdueTasks.some(task => task.id === item.taskId)
    ).length;
    
    // Process today's unscheduled tasks for warning message
    let todaysUnscheduledCount = 0;
    const unscheduledTaskDetails: { 
      id: number; 
      description: string; 
      assignmentTitle: string; 
      timeAllocation: number 
    }[] = [];
    
    // Add details for unscheduled tasks
    for (const item of notScheduled) {
      const task = allTasks.find(t => t.id === item.taskId);
      const assignment = assignmentsMap.get(item.assignmentId);
      
      if (task && assignment) {
        // Check if task is due today or overdue
        const dueDate = new Date(assignment.dueDate);
        const isDueToday = dueDate <= endOfToday;
        const isOverdue = dueDate < nowDate;
        
        if (isDueToday || isOverdue) {
          todaysUnscheduledCount++;
          
          // Add detailed information about this unscheduled task
          unscheduledTaskDetails.push({
            id: task.id,
            description: task.description,
            assignmentTitle: assignment.title,
            timeAllocation: task.timeAllocation
          });
        } else {
          // For future tasks, add them with a label
          unscheduledTaskDetails.push({
            id: task.id,
            description: task.description,
            assignmentTitle: assignment.title + " (future)",
            timeAllocation: task.timeAllocation
          });
        }
      }
    }
    
    // Sort unscheduled tasks: today's/overdue first, then by time (largest first)
    unscheduledTaskDetails.sort((a, b) => {
      // First sort by whether task is due today/overdue
      const aIsFuture = a.assignmentTitle.endsWith("(future)");
      const bIsFuture = b.assignmentTitle.endsWith("(future)");
      
      if (!aIsFuture && bIsFuture) return -1;
      if (aIsFuture && !bIsFuture) return 1;
      
      // Then sort by time allocation (descending)
      return b.timeAllocation - a.timeAllocation;
    });
    
    // Return complete results
    return {
      scheduleItems: result,
      notScheduled,
      totalTasksTime: totalTimeNeeded,
      todaysDueTasksTime,
      todaysDueCompleted,
      extraTasksAdded,
      todaysUnscheduledCount,
      unscheduledTaskDetails
    };
  }
}

export const storage = new MemStorage();
