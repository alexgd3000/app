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
    data: incompleteAssignments = [], 
    isLoading: incompleteAssignmentsLoading,
    refetch: refetchIncompleteAssignments
  } = useQuery<Assignment[]>({
    queryKey: ['/api/assignments/incomplete'],
  });
  
  // Query to fetch all assignments to filter for completed ones
  const { 
    data: allAssignments = [], 
    isLoading: allAssignmentsLoading,
    refetch: refetchAllAssignments
  } = useQuery<Assignment[]>({
    queryKey: ['/api/assignments'],
  });
  
  // Filter out completed assignments
  const completedAssignments = allAssignments.filter(a => a.completed);

  // Sort assignments based on the selected criteria
  const sortedIncompleteAssignments = [...incompleteAssignments].sort((a, b) => {
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
    refetchIncompleteAssignments();
    refetchAllAssignments();
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
                value="completed"
                className="py-4 px-1 data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 data-[state=active]:border-b-2 border-transparent rounded-none focus:ring-0"
              >
                Completed Assignments
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="current" className="mt-6">
            {/* Assignment / Tasks Dashboard */}
            {incompleteAssignmentsLoading || allAssignmentsLoading ? (
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
            ) : sortedIncompleteAssignments.length === 0 ? (
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
                {sortedIncompleteAssignments.map((assignment: Assignment) => (
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
            {allAssignmentsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col p-6 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="space-y-2">
                      <Skeleton className="h-20 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : completedAssignments.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <i className="ri-checkbox-circle-line text-5xl"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900">No completed assignments</h3>
                <p className="mt-1 text-sm text-gray-500">Completed assignments will appear here</p>
              </div>
            ) : (
              <div className={`grid grid-cols-1 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : ''} gap-6`}>
                {completedAssignments.map((assignment: Assignment) => (
                  <div key={assignment.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">{assignment.title}</h2>
                          <p className="text-sm text-gray-500">{assignment.course}</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="ml-auto bg-primary/10 text-primary hover:bg-primary/20"
                          onClick={() => {
                            // Show confirmation dialog
                            const confirmed = window.confirm(`Reactivate "${assignment.title}"? This will move it back to the current assignments list.`);
                            
                            if (confirmed) {
                              // Update assignment as incomplete
                              fetch(`/api/assignments/${assignment.id}`, {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ 
                                  completed: false,
                                  // Include original values for other required fields
                                  title: assignment.title,
                                  course: assignment.course,
                                  dueDate: assignment.dueDate,
                                  priority: assignment.priority,
                                  estimatedTime: assignment.estimatedTime,
                                }),
                              }).then(() => {
                                refreshData();
                              });
                            }
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                            <path d="M3 3v5h5"></path>
                          </svg>
                          Reactivate
                        </Button>
                      </div>
                      
                      <div className="mt-3 flex items-center text-sm text-gray-500">
                        <i className="ri-calendar-check-line mr-1"></i>
                        <span>Completed</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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