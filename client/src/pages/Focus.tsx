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