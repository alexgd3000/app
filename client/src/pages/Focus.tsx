import { useQuery } from "@tanstack/react-query";
import ScheduleTimeline from "@/components/ScheduleTimeline";
import { format } from "date-fns";

export default function Focus() {
  // Get the current date formatted for the query
  const todayFormatted = format(new Date(), 'yyyy-MM-dd');
  
  const { 
    data: scheduleData = [], 
    isLoading: scheduleLoading,
    refetch: refetchSchedule
  } = useQuery<any[]>({
    queryKey: ['/api/schedule', todayFormatted],
    queryFn: async () => {
      const res = await fetch(`/api/schedule?date=${todayFormatted}`);
      if (!res.ok) throw new Error('Failed to fetch schedule');
      return res.json();
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Focus Mode</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your daily schedule and track progress on your tasks
        </p>
      </div>
      
      <ScheduleTimeline 
        isLoading={scheduleLoading} 
        scheduleData={scheduleData} 
        onRefresh={refetchSchedule}
      />
    </div>
  );
}