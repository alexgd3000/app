import { useState, useEffect } from "react";
import { Task } from "@shared/schema";
import { useTimer } from "@/hooks/useTimer";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TimerDisplayProps {
  task: Task;
}

export default function TimerDisplay({ task }: TimerDisplayProps) {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(true);
  
  // Initialize timer with task's allocated time
  const timeInSeconds = task.timeAllocation * 60;
  const elapsedSeconds = task.timeSpent * 60;
  
  const { 
    currentTime, 
    formattedTime, 
    percentComplete, 
    startTimer, 
    pauseTimer, 
    resetTimer,
    isActive
  } = useTimer(timeInSeconds, elapsedSeconds);
  
  // Update task time spent
  const updateTaskMutation = useMutation({
    mutationFn: async (timeSpent: number) => {
      const response = await apiRequest("PUT", `/api/tasks/${task.id}`, {
        timeSpent
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/assignments/${task.assignmentId}/tasks`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating time spent",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Start timer automatically
  useEffect(() => {
    if (!isActive && isRunning) {
      startTimer();
    }
  }, [isActive, isRunning, startTimer]);
  
  // Update time spent in the database every minute
  useEffect(() => {
    const timeSpent = Math.floor(elapsedSeconds / 60) + Math.floor(currentTime / 60);
    
    const intervalId = setInterval(() => {
      if (isActive) {
        updateTaskMutation.mutate(timeSpent);
      }
    }, 60000); // Update every minute
    
    return () => clearInterval(intervalId);
  }, [currentTime, elapsedSeconds, isActive, updateTaskMutation]);
  
  // Play sound when timer completes
  useEffect(() => {
    if (currentTime === 0 && !isActive) {
      // Play a notification sound
      const audio = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3");
      audio.play().catch(e => console.log("Audio play failed:", e));
      
      toast({
        title: "Time's up!",
        description: `You've reached the allocated time for "${task.description}"`,
      });
    }
  }, [currentTime, isActive, task.description, toast]);

  const handlePauseResume = () => {
    if (isActive) {
      pauseTimer();
      setIsRunning(false);
    } else {
      startTimer();
      setIsRunning(true);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Timer Circle */}
      <div className="relative mb-3">
        <svg className="w-32 h-32" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e0e7ff" strokeWidth="8"></circle>
          <circle 
            cx="50" 
            cy="50" 
            r="45" 
            fill="none" 
            stroke="#4f46e5" 
            strokeWidth="8" 
            strokeDasharray="283" 
            strokeDashoffset={283 * (1 - percentComplete / 100)} 
            transform="rotate(-90 50 50)"
          ></circle>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-primary-700">
          <span className="text-3xl font-bold">{formattedTime}</span>
          <span className="text-xs font-medium">of {Math.floor(timeInSeconds / 60)}:{(timeInSeconds % 60).toString().padStart(2, '0')}</span>
        </div>
      </div>
      
      {/* Current Task */}
      <div className="text-center mb-4">
        <p className="text-sm font-medium text-gray-500">Current Task:</p>
        <p className="text-base font-semibold text-primary-700">{task.description}</p>
      </div>
      
      {/* Timer Controls */}
      <div className="flex items-center space-x-3">
        <Button 
          variant="outline" 
          size="icon" 
          className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
          disabled
        >
          <i className="ri-skip-back-line text-lg"></i>
        </Button>
        <Button 
          size="icon"
          variant={isActive ? "destructive" : "default"}
          className={`w-12 h-12 rounded-full ${isActive ? 'bg-red-100 text-red-700 hover:bg-red-200' : ''}`}
          onClick={handlePauseResume}
        >
          <i className={`${isActive ? 'ri-pause-line' : 'ri-play-line'} text-xl`}></i>
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
          disabled
        >
          <i className="ri-skip-forward-line text-lg"></i>
        </Button>
      </div>
    </div>
  );
}
