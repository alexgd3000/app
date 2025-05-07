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
    const result: ScheduleItem[] = [];
    const notScheduled: { taskId: number; assignmentId: number }[] = [];
    let currentDate = new Date(startDate);
    let totalTimeNeeded = 0;
    let scheduledTime = 0;
    
    // Delete any existing schedule items for this date
    const existingItems = await this.getScheduleForDate(currentDate);
    for (const item of existingItems) {
      await this.deleteScheduleItem(item.id);
    }
    
    // Get all incomplete tasks for the assignments
    let allTasks: Task[] = [];
    const assignmentsMap = new Map<number, Assignment>();
    
    for (const assignmentId of assignmentIds) {
      const tasks = await this.getTasksByAssignment(assignmentId);
      const incompleteTasks = tasks.filter(t => !t.completed);
      allTasks = [...allTasks, ...incompleteTasks];
      
      // Calculate total time needed
      totalTimeNeeded += incompleteTasks.reduce((sum, task) => sum + task.timeAllocation, 0);
    }
    
    // Get assignment details for sorting
    for (const assignmentId of assignmentIds) {
      const assignment = await this.getAssignment(assignmentId);
      if (assignment) {
        assignmentsMap.set(assignmentId, assignment);
      }
    }
    
    // Get current time for overdue checking
    const currentTime = new Date();
    
    // Sort tasks:
    // 1. First by overdue status (overdue assignments first)
    // 2. Then by assignment priority (high > medium > low)
    // 3. Finally by due date (closest first)
    allTasks.sort((a, b) => {
      const assignmentA = assignmentsMap.get(a.assignmentId);
      const assignmentB = assignmentsMap.get(b.assignmentId);
      
      if (!assignmentA || !assignmentB) return 0;
      
      // Overdue status - overdue assignments get highest priority
      const aIsOverdue = new Date(assignmentA.dueDate) < currentTime;
      const bIsOverdue = new Date(assignmentB.dueDate) < currentTime;
      
      if (aIsOverdue && !bIsOverdue) return -1; // A is overdue, B is not, so A comes first
      if (!aIsOverdue && bIsOverdue) return 1;  // B is overdue, A is not, so B comes first
      
      // Priority sorting
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[assignmentA.priority as keyof typeof priorityOrder] - 
                           priorityOrder[assignmentB.priority as keyof typeof priorityOrder];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Due date sorting
      return assignmentA.dueDate.getTime() - assignmentB.dueDate.getTime();
    });
    
    // Start scheduling at the provided date, starting at 9 AM if not specified
    if (currentDate.getHours() < 9) {
      currentDate.setHours(9, 0, 0, 0);
    }
    
    // Calculate end time based on available minutes
    let endTime = new Date(currentDate);
    if (availableMinutes) {
      endTime.setMinutes(endTime.getMinutes() + availableMinutes);
    } else {
      // Default end time at 6 PM if no available minutes specified
      endTime.setHours(18, 0, 0, 0);
    }
    
    // Schedule each task
    for (const task of allTasks) {
      // Check if we have enough time left
      const timeNeeded = task.timeAllocation;
      
      // Skip if we don't have enough time to fit the task
      const currentDateTime = currentDate.getTime();
      const taskEndTime = new Date(currentDateTime + timeNeeded * 60000);
      
      if (availableMinutes && scheduledTime + timeNeeded > availableMinutes) {
        // Not enough time left, add to not scheduled list
        notScheduled.push({
          taskId: task.id,
          assignmentId: task.assignmentId
        });
        continue;
      }
      
      // If this task would end after our end time, add to not scheduled list
      if (taskEndTime.getTime() > endTime.getTime()) {
        notScheduled.push({
          taskId: task.id,
          assignmentId: task.assignmentId
        });
        continue;
      }
      
      // Normal scheduling
      const startTaskTime = new Date(currentDate);
      const endTaskTime = new Date(currentDate);
      endTaskTime.setMinutes(endTaskTime.getMinutes() + task.timeAllocation);
      
      // Check if we're crossing lunch time (12-1 PM)
      if (
        (startTaskTime.getHours() < 12 && endTaskTime.getHours() >= 12) ||
        (startTaskTime.getHours() === 12 && startTaskTime.getMinutes() < 60)
      ) {
        // Adjust for lunch break
        currentDate.setHours(13, 0, 0, 0);
        
        // If after lunch adjustment, the task doesn't fit in the available time
        const newEndTime = new Date(currentDate);
        newEndTime.setMinutes(newEndTime.getMinutes() + task.timeAllocation);
        
        if (availableMinutes && scheduledTime + timeNeeded > availableMinutes) {
          notScheduled.push({
            taskId: task.id,
            assignmentId: task.assignmentId
          });
          continue;
        }
        
        // Create schedule item with adjusted time
        const scheduleItem = await this.createScheduleItem({
          taskId: task.id,
          startTime: new Date(currentDate),
          endTime: newEndTime,
          completed: false
        });
        
        result.push(scheduleItem);
        scheduledTime += task.timeAllocation;
        
        // Move time forward
        currentDate = new Date(newEndTime);
      } else {
        // Create normal schedule item
        const scheduleItem = await this.createScheduleItem({
          taskId: task.id,
          startTime: startTaskTime,
          endTime: endTaskTime,
          completed: false
        });
        
        result.push(scheduleItem);
        scheduledTime += task.timeAllocation;
        
        // Move time forward
        currentDate = new Date(endTaskTime);
      }
      
      // Add a 15-minute break after every 2 hours of work
      if (result.length % 3 === 0) {
        currentDate.setMinutes(currentDate.getMinutes() + 15);
        
        // If adding a break pushes us past available time, stop scheduling
        if (availableMinutes && scheduledTime + 15 > availableMinutes) {
          break;
        }
      }
    }
    
    // If prioritizing today's due tasks, handle rescheduling and scheduling additional tasks
    let todaysDueCompleted = false;
    let extraTasksAdded = 0;
    
    if (prioritizeTodaysDue) {
      // Get today's date with end of day time
      const today = new Date(startDate);
      today.setHours(23, 59, 59, 999);
      
      // Check if all tasks due today have been scheduled
      const tasksNotScheduled = notScheduled.map(item => item.taskId);
      const todaysDueTasks = allTasks.filter(task => {
        const assignment = assignmentsMap.get(task.assignmentId);
        // Include both tasks due today and tasks that are already overdue
        return assignment && (
          new Date(assignment.dueDate) <= today || // Due today
          new Date(assignment.dueDate) < currentTime // Already overdue
        );
      });
      
      const unscheduledTodaysTasks = todaysDueTasks.filter(task => 
        tasksNotScheduled.includes(task.id)
      );
      
      todaysDueCompleted = unscheduledTodaysTasks.length === 0;
      
      // If we have time left and all today's tasks are scheduled, add future tasks
      if (availableMinutes && todaysDueCompleted) {
        const usedMinutes = scheduledTime;
        const remainingMinutes = availableMinutes - usedMinutes;
        
        if (remainingMinutes > 0) {
          // Get future tasks that weren't scheduled but could fit in remaining time
          const possibleExtraTasks = notScheduled
            .map(item => {
              const task = allTasks.find(t => t.id === item.taskId);
              if (!task) return null;
              
              const assignment = assignmentsMap.get(task.assignmentId);
              if (!assignment) return null;
              
              // Only consider tasks not due today and not overdue
              if (
                new Date(assignment.dueDate) <= today || // Due today
                new Date(assignment.dueDate) < currentTime // Already overdue
              ) return null;
              
              return { 
                task, 
                assignment,
                // Sort by priority then due date
                priority: assignment.priority === 'high' ? 0 : 
                          assignment.priority === 'medium' ? 1 : 2,
                dueDate: assignment.dueDate.getTime()
              };
            })
            .filter(item => item !== null)
            // Sort by priority (high first) then due date (earlier first)
            .sort((a, b) => {
              if (a!.priority !== b!.priority) {
                return a!.priority - b!.priority;
              }
              return a!.dueDate - b!.dueDate;
            });
          
          // Try to schedule as many extra tasks as possible
          let minutesRemaining = remainingMinutes;
          let currentTime = new Date(currentDate);
          
          for (const extraItem of possibleExtraTasks) {
            if (!extraItem) continue;
            const { task } = extraItem;
            
            // If this task would fit in remaining time
            if (task.timeAllocation <= minutesRemaining) {
              // Create schedule item for this task
              const startTaskTime = new Date(currentTime);
              const endTaskTime = new Date(currentTime);
              endTaskTime.setMinutes(endTaskTime.getMinutes() + task.timeAllocation);
              
              const scheduleItem = await this.createScheduleItem({
                taskId: task.id,
                startTime: startTaskTime,
                endTime: endTaskTime,
                completed: false
              });
              
              result.push(scheduleItem);
              minutesRemaining -= task.timeAllocation;
              currentTime = new Date(endTaskTime);
              extraTasksAdded++;
              
              // Add a small break between added tasks
              if (minutesRemaining >= 10) {
                currentTime.setMinutes(currentTime.getMinutes() + 10);
                minutesRemaining -= 10;
              }
              
              // Stop if we're out of meaningful time
              if (minutesRemaining < 15) {
                break;
              }
            }
          }
        }
      }
    }
    
    // Process today's and overdue unscheduled tasks for warning message
    const today = new Date(startDate);
    today.setHours(23, 59, 59, 999);
    
    // Clear the redeclaration of now
    let todaysUnscheduledCount = 0;
    let todaysDueTasksTime = 0;
    const unscheduledTaskDetails: { id: number; description: string; assignmentTitle: string; timeAllocation: number }[] = [];
    
    // Calculate total time needed for today's and overdue tasks
    for (const task of allTasks) {
      const assignment = assignmentsMap.get(task.assignmentId);
      if (assignment && (new Date(assignment.dueDate) <= today || new Date(assignment.dueDate) < currentTime)) {
        todaysDueTasksTime += task.timeAllocation;
      }
    }
    
    // Process unscheduled tasks that are due today or already overdue for warning purposes
    for (const item of notScheduled) {
      const task = allTasks.find(t => t.id === item.taskId);
      const assignment = assignmentsMap.get(item.assignmentId);
      
      if (task && assignment) {
        // Check if task is due today or overdue
        const isDueToday = new Date(assignment.dueDate) <= today; 
        const isOverdue = new Date(assignment.dueDate) < currentTime;
        
        if (isDueToday || isOverdue) {
          todaysUnscheduledCount++;
          
          // Add detailed information about this unscheduled task
          unscheduledTaskDetails.push({
            id: task.id,
            description: task.description,
            assignmentTitle: assignment.title,
            timeAllocation: task.timeAllocation
          });
        }
      }
    }
    
    // Sort unscheduled tasks by time allocation (descending)
    unscheduledTaskDetails.sort((a, b) => b.timeAllocation - a.timeAllocation);
    
    return {
      scheduleItems: result,
      notScheduled,
      totalTasksTime: totalTimeNeeded,
      todaysDueTasksTime,
      todaysDueCompleted: todaysDueCompleted || false,
      extraTasksAdded: extraTasksAdded,
      todaysUnscheduledCount,
      unscheduledTaskDetails
    };
  }
}

export const storage = new MemStorage();
