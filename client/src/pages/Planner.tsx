import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import AssignmentCard from "@/components/AssignmentCard";
import NewAssignmentDialog from "@/components/NewAssignmentDialog";
import { Assignment } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export default function Planner() {
  const [newAssignmentOpen, setNewAssignmentOpen] = useState(false);
  const [activeAssignmentId, setActiveAssignmentId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<string>("dueDate");

  const { 
    data: currentAssignments = [], 
    isLoading: currentAssignmentsLoading,
    refetch: refetchCurrentAssignments
  } = useQuery<Assignment[]>({
    queryKey: ['/api/assignments/incomplete'],
  });
  
  const { 
    data: completedAssignments = [], 
    isLoading: completedAssignmentsLoading,
    refetch: refetchCompletedAssignments
  } = useQuery<Assignment[]>({
    queryKey: ['/api/assignments/completed'],
  });

  const { 
    data: scheduleData = [], 
    refetch: refetchSchedule
  } = useQuery<any[]>({
    queryKey: ['/api/schedule'],
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
  const sortAssignments = (assignments: Assignment[]) => {
    return [...assignments].sort((a, b) => {
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
  };
  
  // Get sorted assignments for both current and completed tabs
  const sortedCurrentAssignments = sortAssignments(currentAssignments);
  const sortedCompletedAssignments = sortAssignments(completedAssignments);

  const refreshData = () => {
    refetchCurrentAssignments();
    refetchCompletedAssignments();
    refetchSchedule();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

          <Button
            className="ml-auto"
            onClick={() => setNewAssignmentOpen(true)}
          >
            <i className="ri-add-line mr-1"></i>
            New Assignment
          </Button>
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
              value="completed"
              className="py-4 px-1 data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 data-[state=active]:border-b-2 border-transparent rounded-none focus:ring-0"
            >
              Completed Assignments
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="current" className="mt-6">
          {/* Current Assignments Dashboard */}
          {currentAssignmentsLoading ? (
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
          ) : sortedCurrentAssignments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <i className="ri-task-line text-5xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900">No current assignments</h3>
              <p className="mt-1 text-sm text-gray-500">Create your first assignment to get started</p>
              <Button className="mt-4" onClick={() => setNewAssignmentOpen(true)}>
                <i className="ri-add-line mr-1"></i>
                New Assignment
              </Button>
            </div>
          ) : (
            <div className={`grid grid-cols-1 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : ''} gap-6`}>
              {sortedCurrentAssignments.map((assignment) => (
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
        
        <TabsContent value="completed" className="mt-6">
          {/* Completed Assignments Dashboard */}
          {completedAssignmentsLoading ? (
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
          ) : sortedCompletedAssignments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <i className="ri-check-double-line text-5xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900">No completed assignments</h3>
              <p className="mt-1 text-sm text-gray-500">Completed assignments will appear here</p>
            </div>
          ) : (
            <div className={`grid grid-cols-1 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : ''} gap-6`}>
              {sortedCompletedAssignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  isActive={false} // Completed assignments are never active
                  viewMode={viewMode}
                  onRefresh={refreshData}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* New Assignment Modal */}
      <NewAssignmentDialog 
        open={newAssignmentOpen} 
        onOpenChange={setNewAssignmentOpen} 
        onAssignmentCreated={refreshData}
      />
    </div>
  );
}