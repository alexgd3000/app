import { useState } from "react";
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
    data: assignments = [], 
    isLoading: assignmentsLoading,
    refetch: refetchAssignments
  } = useQuery<Assignment[]>({
    queryKey: ['/api/assignments/incomplete'],
  });

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
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Assignment Planner</h1>
            <p className="mt-1 text-sm text-gray-500">Manage and break down your assignments into tasks</p>
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
              className="ml-4"
              onClick={() => setNewAssignmentOpen(true)}
            >
              <i className="ri-add-line mr-1"></i>
              New Assignment
            </Button>
          </div>
        </div>
        
        {/* Assignment Tabs */}
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