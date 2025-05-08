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
      // Use setTimerStates to get the most current states and activeTaskId
      setTimerStates(currentTimerStates => {
        const currentActiveTaskId = activeTaskId;
        if (currentActiveTaskId && 
            currentTimerStates[currentActiveTaskId] && 
            currentTimerStates[currentActiveTaskId].isActive) {
          
          const state = currentTimerStates[currentActiveTaskId];
          const minutesSpent = Math.round(state.timeElapsed / 60);
          
          apiRequest(
            "PUT",
            `/api/tasks/${currentActiveTaskId}`,
            { 
              timeSpent: minutesSpent.toString()
            }
          ).catch(error => {
            console.error("Failed to auto-save timer progress:", error);
          });
        }
        return currentTimerStates; // Return unchanged state
      });
    }, 30000);
    
    setSaveIntervalId(intervalId);
    
    // Cleanup function
    return () => {
      if (saveIntervalId) {
        clearInterval(saveIntervalId);
      }
      saveTimerStates();
    };
  }, [scheduleData, timerStates, activeTaskId, saveIntervalId]);
  
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
  
  // Mark a task as complete - only updates completion status, doesn't navigate
  const completeTask = async (taskId: number, scheduleItemId: number) => {
    if (!timerStates[taskId]) return;
    
    // Pause the timer first but don't trigger API calls yet
    setTimerStates(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        isActive: false
      }
    }));
    
    try {
      // Update local state immediately for UI feedback
      setTimerStates(prev => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          isCompleted: true,
          isActive: false
        }
      }));
      
      // Save timer states to localStorage before API calls
      saveTimerStates();
      
      // Calculate minutes spent
      const minutesSpent = Math.round(timerStates[taskId].timeElapsed / 60);
      
      // Update the task first
      await apiRequest(
        "PUT",
        `/api/tasks/${taskId}`,
        { 
          completed: true,
          timeSpent: minutesSpent.toString()
        }
      );
      
      // Then update the schedule item
      await apiRequest(
        "PUT", 
        `/api/schedule/${scheduleItemId}`, 
        { completed: true }
      );
      
      // Notify parent to refresh UI after a small delay to avoid race conditions
      setTimeout(() => {
        onTimerComplete(taskId);
      }, 300);
    } catch (error) {
      console.error("Failed to complete task:", error);
      
      // Revert the local state change on error
      setTimerStates(prev => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          isCompleted: false
        }
      }));
      
      // Save reverted state
      saveTimerStates();
    }
  };
  
  // Undo task completion - toggle a task back to incomplete state
  const undoTaskCompletion = async (taskId: number, scheduleItemId: number, makeActive: boolean = false) => {
    if (!timerStates[taskId]) return;
    
    try {
      // Update local state first for immediate UI feedback
      setTimerStates(prev => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          isCompleted: false
        }
      }));
      
      // Save timer states to localStorage before API calls
      saveTimerStates();
      
      // Update the task first
      await apiRequest(
        "PUT",
        `/api/tasks/${taskId}`,
        { completed: false }
      );
      
      // Then update the schedule item
      await apiRequest(
        "PUT", 
        `/api/schedule/${scheduleItemId}`, 
        { completed: false }
      );
      
      // Only set as active if requested - this does NOT navigate, 
      // it only updates the active task for UI focus
      if (makeActive) {
        setActiveTaskId(taskId);
      }
      
      // Notify parent to refresh UI after a small delay to avoid race conditions
      setTimeout(() => {
        onTimerComplete(taskId);
      }, 300);
    } catch (error) {
      console.error("Failed to undo task completion:", error);
      
      // Revert the local state change on error
      setTimerStates(prev => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          isCompleted: true // Revert back to completed
        }
      }));
      
      // Save reverted state
      saveTimerStates();
    }
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
    setTimerStates(prev => {
      const currentActiveTaskId = activeTaskId;
      if (!currentActiveTaskId || !prev[currentActiveTaskId] || !prev[currentActiveTaskId].isActive) {
        return prev; // No changes if no active task
      }
      
      return {
        ...prev,
        [currentActiveTaskId]: {
          ...prev[currentActiveTaskId],
          timeElapsed: prev[currentActiveTaskId].timeElapsed + 1
        }
      };
    });
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
  
  // Reset all timers at once
  const resetAllTimers = async () => {
    // Pause any active timer
    if (activeTaskId && timerStates[activeTaskId]?.isActive) {
      pauseTimer(activeTaskId);
    }
    
    // Create a new object with all timers reset to 0
    const resetStates: Record<number, TaskTimerState> = {};
    
    // For each timer in the current states
    Object.keys(timerStates).forEach(taskIdStr => {
      const taskId = parseInt(taskIdStr);
      if (!isNaN(taskId)) {
        resetStates[taskId] = {
          ...timerStates[taskId],
          timeElapsed: 0,
          isActive: false,
          lastUpdated: Date.now()
        };
      }
    });
    
    // Update the state with the reset timers
    setTimerStates(resetStates);
    
    // Clear localStorage
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    
    // Update each task on the server to have timeSpent: "0"
    for (const taskIdStr of Object.keys(timerStates)) {
      const taskId = parseInt(taskIdStr);
      if (!isNaN(taskId)) {
        try {
          await apiRequest(
            "PUT",
            `/api/tasks/${taskId}`,
            { timeSpent: "0" }
          );
        } catch (error) {
          console.error(`Failed to reset timer for task ${taskId} on server:`, error);
        }
      }
    }
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
    switchToTask,
    resetAllTimers
  };
}