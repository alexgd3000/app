import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

export interface TaskTimerState {
  taskId: number;
  assignmentId: number;
  timeElapsed: number;
  isActive: boolean;
  isCompleted: boolean;
  lastUpdated: number;
}

interface UseTimerSystemProps {
  scheduleData: any[];
  onTimerComplete: (taskId: number) => void;
}

const LOCAL_STORAGE_KEY = 'task_timer_system';

export function useTimerSystem({ scheduleData, onTimerComplete }: UseTimerSystemProps) {
  // State to store all timers
  const [timerStates, setTimerStates] = useState<Record<number, TaskTimerState>>({});
  
  // Current active task id
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  
  // Auto-save interval ID
  const [saveIntervalId, setSaveIntervalId] = useState<number | null>(null);
  
  // Initialize timers from schedule data and local storage
  useEffect(() => {
    if (!scheduleData || scheduleData.length === 0) return;
    
    // Load saved timer states from localStorage
    let savedStates: Record<number, TaskTimerState> = {};
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        savedStates = JSON.parse(saved);
        console.log('Loaded saved timer states:', savedStates);
      }
    } catch (error) {
      console.error('Error loading timer states from localStorage:', error);
    }
    
    // Create timer states for all tasks in schedule, using saved data if available
    const newTimerStates: Record<number, TaskTimerState> = {};
    
    scheduleData.forEach(item => {
      if (!item.taskId) return;
      
      const taskId = item.taskId;
      const savedState = savedStates[taskId];
      
      // Always preserve the elapsed time from saved state if it exists
      // Otherwise use 0 or the current timer state if it exists
      const currentTimerState = timerStates[taskId];
      const timeElapsed = savedState?.timeElapsed || currentTimerState?.timeElapsed || 0;
      
      newTimerStates[taskId] = {
        taskId,
        assignmentId: item.task?.assignmentId || 0,
        timeElapsed: timeElapsed,
        isActive: false, // Always start inactive
        isCompleted: item.completed || false,
        lastUpdated: Date.now()
      };
    });
    
    // Also include any saved timer states for tasks that might not be in the current scheduleData
    // This ensures we don't lose progress for tasks when switching between them
    Object.keys(savedStates).forEach(taskIdStr => {
      const taskId = parseInt(taskIdStr);
      if (!newTimerStates[taskId] && !isNaN(taskId)) {
        newTimerStates[taskId] = savedStates[taskId];
      }
    });
    
    console.log('Setting timer states with preserved time:', newTimerStates);
    setTimerStates(newTimerStates);
    
    // Set the active task if one is in progress
    const currentTime = new Date();
    const inProgressTask = scheduleData.find(item => {
      const start = new Date(item.startTime);
      const end = new Date(item.endTime);
      return !item.completed && start <= currentTime && end >= currentTime;
    });
    
    if (inProgressTask) {
      setActiveTaskId(inProgressTask.taskId);
    } else {
      // Find the first uncompleted task
      const nextTask = scheduleData.find(item => !item.completed);
      if (nextTask) {
        setActiveTaskId(nextTask.taskId);
      }
    }
    
    // Setup auto-save interval
    const intervalId = window.setInterval(() => {
      // Save all timer states to localStorage
      saveTimerStates();
      
      // Also save the active timer's progress to the server
      if (activeTaskId && timerStates[activeTaskId] && timerStates[activeTaskId].isActive) {
        const state = timerStates[activeTaskId];
        const minutesSpent = Math.round(state.timeElapsed / 60);
        
        apiRequest(
          "PUT",
          `/api/tasks/${activeTaskId}`,
          { 
            timeSpent: minutesSpent.toString()
          }
        ).catch(error => {
          console.error("Failed to auto-save timer progress:", error);
        });
      }
    }, 30000);
    
    setSaveIntervalId(intervalId);
    
    // Cleanup function
    return () => {
      if (saveIntervalId) {
        clearInterval(saveIntervalId);
      }
      saveTimerStates();
    };
  }, [scheduleData]);
  
  // Save timer states to localStorage
  const saveTimerStates = () => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(timerStates));
    } catch (error) {
      console.error('Error saving timer states to localStorage:', error);
    }
  };
  
  // Start a specific timer
  const startTimer = (taskId: number) => {
    if (!timerStates[taskId]) return;
    
    // Pause any active timer
    if (activeTaskId && activeTaskId !== taskId) {
      pauseTimer(activeTaskId);
    }
    
    setTimerStates(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        isActive: true,
        lastUpdated: Date.now()
      }
    }));
    
    setActiveTaskId(taskId);
  };
  
  // Pause a specific timer
  const pauseTimer = (taskId: number) => {
    if (!timerStates[taskId]) return;
    
    setTimerStates(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        isActive: false
      }
    }));
    
    // Auto-save progress when pausing
    const minutesSpent = Math.round(timerStates[taskId].timeElapsed / 60);
    apiRequest(
      "PUT",
      `/api/tasks/${taskId}`,
      { 
        timeSpent: minutesSpent.toString()
      }
    ).catch(error => {
      console.error("Failed to save timer progress on pause:", error);
    });
  };
  
  // Reset a specific timer
  const resetTimer = async (taskId: number) => {
    if (!timerStates[taskId]) return;
    
    // Pause the timer first
    pauseTimer(taskId);
    
    // Update local state immediately
    setTimerStates(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        timeElapsed: 0,
        isActive: false
      }
    }));
    
    // Save to server
    try {
      await apiRequest(
        "PUT",
        `/api/tasks/${taskId}`,
        { 
          timeSpent: "0"
        }
      );
    } catch (error) {
      console.error("Failed to reset timer on server:", error);
    }
    
    // Save updated states
    saveTimerStates();
  };
  
  // Mark a task as complete
  const completeTask = async (taskId: number, scheduleItemId: number) => {
    if (!timerStates[taskId]) return;
    
    // Pause the timer first
    pauseTimer(taskId);
    
    try {
      // Update the schedule item
      await apiRequest(
        "PUT", 
        `/api/schedule/${scheduleItemId}`, 
        { completed: true }
      );
      
      // Update the task
      const minutesSpent = Math.round(timerStates[taskId].timeElapsed / 60);
      await apiRequest(
        "PUT",
        `/api/tasks/${taskId}`,
        { 
          completed: true,
          timeSpent: minutesSpent.toString()
        }
      );
      
      // Update local state
      setTimerStates(prev => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          isCompleted: true,
          isActive: false
        }
      }));
      
      // Notify parent
      onTimerComplete(taskId);
      
      // Get all tasks sorted by time
      const allTasksSorted = [...scheduleData]
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      
      // Find the index of the current task in the sorted list
      const currentIndex = allTasksSorted.findIndex(item => item.taskId === taskId);
      
      // If there is a next task (regardless of completion status), move to it
      if (currentIndex >= 0 && currentIndex < allTasksSorted.length - 1) {
        const nextTask = allTasksSorted[currentIndex + 1];
        console.log(`Moving to next sequential task ${nextTask.taskId} after completing ${taskId}`);
        setActiveTaskId(nextTask.taskId);
      }
    } catch (error) {
      console.error("Failed to complete task:", error);
    }
    
    // Save updated states
    saveTimerStates();
  };
  
  // Undo task completion
  const undoTaskCompletion = async (taskId: number, scheduleItemId: number, makeActive: boolean = false, skipNotify: boolean = false) => {
    if (!timerStates[taskId]) return;
    
    try {
      // Update the schedule item
      await apiRequest(
        "PUT", 
        `/api/schedule/${scheduleItemId}`, 
        { completed: false }
      );
      
      // Update the task
      await apiRequest(
        "PUT",
        `/api/tasks/${taskId}`,
        { 
          completed: false
        }
      );
      
      // Update local state
      setTimerStates(prev => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          isCompleted: false
        }
      }));
      
      // Only set as active if requested (now optional)
      if (makeActive) {
        setActiveTaskId(taskId);
      }
      
      // Notify parent (optional - can be skipped to prevent unwanted navigation)
      if (!skipNotify) {
        onTimerComplete(taskId);
      }
    } catch (error) {
      console.error("Failed to undo task completion:", error);
    }
    
    // Save updated states
    saveTimerStates();
  };
  
  // Update a timer's elapsed time
  const updateElapsedTime = (taskId: number, seconds: number) => {
    if (!timerStates[taskId]) return;
    
    setTimerStates(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        timeElapsed: seconds
      }
    }));
  };
  
  // Increment active timer by 1 second - to be called from an interval
  const incrementActiveTimer = () => {
    if (!activeTaskId || !timerStates[activeTaskId] || !timerStates[activeTaskId].isActive) return;
    
    setTimerStates(prev => ({
      ...prev,
      [activeTaskId]: {
        ...prev[activeTaskId],
        timeElapsed: prev[activeTaskId].timeElapsed + 1
      }
    }));
  };
  
  // Set up the increment interval for the active timer
  useEffect(() => {
    let intervalId: number | null = null;
    
    if (activeTaskId && timerStates[activeTaskId]?.isActive) {
      intervalId = window.setInterval(incrementActiveTimer, 1000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [activeTaskId, timerStates]);
  
  // Switch to a specific task (make it active)
  const switchToTask = (taskId: number) => {
    if (!timerStates[taskId]) {
      console.error('Cannot switch to task - no timer state found for taskId:', taskId);
      return;
    }
    
    console.log(`Switching to task ${taskId} with current elapsed time:`, timerStates[taskId].timeElapsed);
    
    // Store the current state of all timers before switching
    const currentTimerStates = {...timerStates};
    
    // If there's a currently active timer, pause it
    if (activeTaskId && activeTaskId !== taskId && timerStates[activeTaskId]?.isActive) {
      console.log(`Pausing previous active task ${activeTaskId} with elapsed time:`, timerStates[activeTaskId].timeElapsed);
      pauseTimer(activeTaskId);
    }
    
    // Simply make the task active without resetting its progress
    // This is critical - we just change which task is active without modifying its timeElapsed
    setActiveTaskId(taskId);
    
    // Ensure we're not losing any timer states during the switch
    setTimerStates(prev => {
      // Make sure we keep all timers with their current elapsed times
      Object.keys(currentTimerStates).forEach(id => {
        if (!prev[parseInt(id)]) {
          prev[parseInt(id)] = currentTimerStates[parseInt(id)];
        }
      });
      return prev;
    });
    
    // Save timer states to ensure we persist the current progress
    saveTimerStates();
  };
  
  return {
    timerStates,
    activeTaskId,
    startTimer,
    pauseTimer,
    resetTimer,
    completeTask,
    undoTaskCompletion,
    updateElapsedTime,
    switchToTask
  };
}