import { useQuery } from "@tanstack/react-query";
import ScheduleTimeline from "@/components/ScheduleTimeline";
import { ScheduleItem } from "@shared/schema";
import { format } from "date-fns";

export default function FocusPage() {
  const { 
    data: scheduleData = [], 
    isLoading: scheduleLoading,
    refetch: refetchSchedule
  } = useQuery<ScheduleItem[]>({
    queryKey: ['/api/schedule'],
  });

  // Combine refetch functions for easier data refreshing
  const refreshData = () => {
    refetchSchedule();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Focus Mode</h1>
        <p className="mt-1 text-sm text-gray-500">Stay productive with your today's schedule and track your progress</p>
      </div>
      
      {/* Schedule Timeline Section - This includes the timer functionality */}
      <ScheduleTimeline 
        isLoading={scheduleLoading} 
        scheduleData={scheduleData} 
        onRefresh={refreshData}
      />
    </div>
  );
}