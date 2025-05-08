import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ScheduleTimeline from "@/components/ScheduleTimeline";
import { Assignment } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";

export default function Focus() {
  // Only fetch assignments when needed, not on every component render
  const { 
    data: assignments = [], 
    isLoading: assignmentsLoading,
  } = useQuery<Assignment[]>({
    queryKey: ['/api/assignments/incomplete'],
    staleTime: 30000, // Data stays fresh for 30 seconds before refetching
  });

  // Use react-query for schedule data instead of useState + fetch
  const {
    data: scheduleData = [],
    isLoading: scheduleLoading,
    refetch: refetchSchedule
  } = useQuery<any[]>({
    queryKey: ['/api/schedule'],
    staleTime: 30000, // Data stays fresh for 30 seconds before refetching
  });
  
  // Manual refresh function that doesn't change timer states
  const refreshData = () => {
    console.log("Manual refresh requested - will only reload if stale");
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
          {/* Schedule Timer Section - Simplified */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <ScheduleTimeline 
                isLoading={scheduleLoading} 
                scheduleData={scheduleData} 
                onRefresh={refreshData}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}