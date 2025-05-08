import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ScheduleTimeline from "@/components/ScheduleTimeline";
import { Assignment } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Focus() {
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  
  const { 
    data: assignments = [], 
    isLoading: assignmentsLoading,
  } = useQuery<Assignment[]>({
    queryKey: ['/api/assignments/incomplete'],
  });

  // This function will be used to refresh the schedule data when needed
  const refetchSchedule = async () => {
    setScheduleLoading(true);
    try {
      const response = await fetch('/api/schedule');
      const data = await response.json();
      setScheduleData(data);
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
    } finally {
      setScheduleLoading(false);
    }
  };

  // Effect to fetch schedule data when the component mounts
  useEffect(() => {
    refetchSchedule();
  }, []);

  const refreshData = () => {
    refetchSchedule();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Focus Mode</h1>
          <p className="mt-1 text-sm text-gray-500">Your scheduled tasks and timer for maximum productivity</p>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Schedule Timer Section */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-violet-500 to-purple-500 text-white">
              <CardTitle className="text-xl">Today's Focus Plan</CardTitle>
              <CardDescription className="text-gray-100">
                Follow your schedule and stay on track with timed tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScheduleTimeline 
                isLoading={scheduleLoading} 
                scheduleData={scheduleData} 
                onRefresh={refreshData}
              />
            </CardContent>
          </Card>
          
          {/* Productivity Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Focus Tips</CardTitle>
              <CardDescription>
                Try these techniques to help maintain concentration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-violet-100 rounded-full p-1">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 text-violet-600" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">Pomodoro Technique</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Work for 25 minutes, then take a short 5-minute break. After 4 cycles, take a longer 15-30 minute break.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-violet-100 rounded-full p-1">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 text-violet-600" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" 
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">Minimize Distractions</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Turn off notifications, close unnecessary tabs, and use apps that block distracting websites.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-violet-100 rounded-full p-1">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 text-violet-600" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" 
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">Task Batching</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Group similar tasks together and complete them in one focused session to reduce context switching.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}