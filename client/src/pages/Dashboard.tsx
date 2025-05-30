import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import AssignmentCard from "@/components/AssignmentCard";
import ScheduleTimeline from "@/components/ScheduleTimeline";
import NewAssignmentDialog from "@/components/NewAssignmentDialog";
import { Assignment, Task } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newAssignmentOpen, setNewAssignmentOpen] = useState(false);
  const [activeAssignmentId, setActiveAssignmentId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<string>("dueDate");

  const { 
    data: assignments = [], 
    isLoading: assignmentsLoading,
    refetch: refetchAssignments
  } = useQuery<Assignment[]>({
    queryKey: ['/api/assignments/incomplete'],
  });

  // Get the current date formatted for the query
  const todayFormatted = format(new Date(), 'yyyy-MM-dd');
  
  const { 
    data: scheduleData = [], 
    isLoading: scheduleLoading,
    refetch: refetchSchedule
  } = useQuery({
    queryKey: ['/api/schedule', todayFormatted],
    queryFn: async () => {
      const res = await fetch(`/api/schedule?date=${todayFormatted}`);
      if (!res.ok) throw new Error('Failed to fetch schedule');
      return res.json();
    }
  });

  // Effect to find if there's an active assignment for the timer
  useEffect(() => {
    const activeScheduleItem = scheduleData.find((item: any) => 
      !item.completed && 
      new Date(item.startTime) <= new Date() && 
      new Date(item.endTime) >= new Date()
    );
    
    if (activeScheduleItem && activeScheduleItem.task) {
      setActiveAssignmentId(activeScheduleItem.task.assignmentId);
    } else {
      setActiveAssignmentId(null);
    }
  }, [scheduleData]);

  // Sort assignments based on the selected criteria
  const sortedAssignments = [...assignments].sort((a, b) => {
    switch (sortBy) {
      case "dueDate":
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      case "priority":
        const priorityOrder: Record<string, number> = { "high": 0, "medium": 1, "low": 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      case "estimatedTime":
        return a.estimatedTime - b.estimatedTime;
      default:
        return 0;
    }
  });

  const refreshData = () => {
    refetchAssignments();
    refetchSchedule();
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} assignments={assignments} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navbar */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center lg:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  <i className="ri-menu-line text-xl"></i>
                </Button>
              </div>
              
              {/* Search bar */}
              <div className="flex-1 px-2 lg:ml-6 lg:justify-end">
                <div className="max-w-lg w-full lg:max-w-xs">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="ri-search-line text-gray-400"></i>
                    </div>
                    <Input
                      className="block w-full pl-10 pr-3 py-2"
                      type="search"
                      placeholder="Search assignments..."
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                {/* Notifications */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  <i className="ri-notification-3-line text-xl"></i>
                </Button>
                
                {/* Create new */}
                <Button
                  className="ml-4"
                  onClick={() => setNewAssignmentOpen(true)}
                >
                  <i className="ri-add-line mr-1"></i>
                  New Assignment
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Assignment Planner</h1>
                  <p className="mt-1 text-sm text-gray-500">Break down your assignments into manageable tasks with time allocation</p>
                </div>
                
                <div className="mt-4 lg:mt-0 flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">View:</span>
                    <div className="rounded-md inline-flex shadow-sm">
                      <Button
                        variant={viewMode === "grid" ? "secondary" : "outline"}
                        className={`rounded-l-md ${viewMode === "grid" ? "bg-primary-50 text-primary-700" : ""}`}
                        onClick={() => setViewMode("grid")}
                      >
                        <i className="ri-layout-grid-line mr-1"></i> Grid
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "secondary" : "outline"}
                        className={`rounded-r-md ${viewMode === "list" ? "bg-primary-50 text-primary-700" : ""}`}
                        onClick={() => setViewMode("list")}
                      >
                        <i className="ri-list-check-2 mr-1"></i> List
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Sort by:</span>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dueDate">Due date</SelectItem>
                        <SelectItem value="priority">Priority</SelectItem>
                        <SelectItem value="estimatedTime">Estimated time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {/* Main Tabs */}
              <Tabs defaultValue="current">
                <div className="border-b border-gray-200">
                  <TabsList className="h-auto bg-transparent border-0 mb-[-2px]">
                    <TabsTrigger
                      value="current"
                      className="py-4 px-1 data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 data-[state=active]:border-b-2 border-transparent rounded-none focus:ring-0"
                    >
                      Current Assignments
                    </TabsTrigger>
                    <TabsTrigger
                      value="all"
                      className="py-4 px-1 data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 data-[state=active]:border-b-2 border-transparent rounded-none focus:ring-0"
                    >
                      All Assignments
                    </TabsTrigger>
                    <TabsTrigger
                      value="completed"
                      className="py-4 px-1 data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 data-[state=active]:border-b-2 border-transparent rounded-none focus:ring-0"
                    >
                      Completed
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="current" className="mt-6">
                  {/* Assignment / Tasks Dashboard */}
                  {assignmentsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col p-6 space-y-4">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <div className="space-y-2">
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : sortedAssignments.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <i className="ri-task-line text-5xl"></i>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">No assignments yet</h3>
                      <p className="mt-1 text-sm text-gray-500">Create your first assignment to get started</p>
                      <Button className="mt-4" onClick={() => setNewAssignmentOpen(true)}>
                        <i className="ri-add-line mr-1"></i>
                        New Assignment
                      </Button>
                    </div>
                  ) : (
                    <div className={`grid grid-cols-1 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : ''} gap-6`}>
                      {sortedAssignments.map((assignment) => (
                        <AssignmentCard
                          key={assignment.id}
                          assignment={assignment}
                          isActive={assignment.id === activeAssignmentId}
                          viewMode={viewMode}
                          onRefresh={refreshData}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="all">
                  <div className="py-12 text-center text-gray-500">
                    All assignments will be shown here
                  </div>
                </TabsContent>
                
                <TabsContent value="completed">
                  <div className="py-12 text-center text-gray-500">
                    Completed assignments will be shown here
                  </div>
                </TabsContent>
              </Tabs>
              
              {/* Schedule Overview Section */}
              <ScheduleTimeline 
                isLoading={scheduleLoading} 
                scheduleData={scheduleData} 
                onRefresh={refreshData}
              />
            </div>
          </div>
        </main>
      </div>

      {/* New Assignment Modal */}
      <NewAssignmentDialog 
        open={newAssignmentOpen} 
        onOpenChange={setNewAssignmentOpen} 
        onAssignmentCreated={refreshData}
      />
    </div>
  );
}
