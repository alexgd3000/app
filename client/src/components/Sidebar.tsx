import { Assignment } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { format, isToday, isTomorrow } from "date-fns";
import { useTheme } from "@/components/ui/theme-provider";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  assignments: Assignment[];
}

export default function Sidebar({ open, setOpen, assignments }: SidebarProps) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();

  // Get recent assignments (up to 5)
  const recentAssignments = assignments
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-amber-500';
      case 'low':
        return 'bg-emerald-500';
      default:
        return 'bg-gray-400';
    }
  };

  const formatDueDate = (date: Date) => {
    if (isToday(new Date(date))) return 'Today';
    if (isTomorrow(new Date(date))) return 'Tomorrow';
    return format(new Date(date), 'MMM d');
  };

  return (
    <div 
      className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transition-transform duration-300 lg:translate-x-0 lg:static lg:w-72",
        open ? "translate-x-0 ease-out" : "-translate-x-full ease-in"
      )}>
      
      <div className="flex flex-col h-full overflow-y-auto">
        {/* Logo and Close button */}
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-md bg-primary-600 flex items-center justify-center">
              <i className="ri-timer-line text-white text-xl"></i>
            </div>
            <span className="text-xl font-bold text-gray-900">TaskBreak</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 lg:hidden"
          >
            <i className="ri-close-line text-xl"></i>
          </Button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 py-4 px-3">
          <div className="space-y-1">
            <Link href="/">
              <a className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                location === "/" 
                  ? "bg-primary-50 text-primary-700" 
                  : "text-gray-700 hover:bg-gray-100"
              )}>
                <i className={cn(
                  "ri-dashboard-line mr-3",
                  location === "/" ? "text-primary-500" : "text-gray-500"
                )}></i>
                Dashboard
              </a>
            </Link>
            <Link href="/schedule">
              <a className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100">
                <i className="ri-calendar-line mr-3 text-gray-500"></i>
                Schedule
              </a>
            </Link>
            <Link href="/assignments">
              <a className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100">
                <i className="ri-task-line mr-3 text-gray-500"></i>
                Assignments
              </a>
            </Link>
            <Link href="/time-tracking">
              <a className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100">
                <i className="ri-time-line mr-3 text-gray-500"></i>
                Time Tracking
              </a>
            </Link>
            <Link href="/analytics">
              <a className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100">
                <i className="ri-bar-chart-line mr-3 text-gray-500"></i>
                Analytics
              </a>
            </Link>
          </div>
          
          <div className="mt-8">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Recent Assignments
            </h3>
            <div className="mt-2 space-y-1">
              {recentAssignments.length > 0 ? (
                recentAssignments.map((assignment) => (
                  <Link key={assignment.id} href={`/assignments/${assignment.id}`}>
                    <a className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 group">
                      <span className={`w-2 h-2 mr-3 rounded-full ${getPriorityColor(assignment.priority)}`}></span>
                      <div className="flex-1 flex justify-between">
                        <span className="truncate">{assignment.title}</span>
                        <span className="text-xs text-gray-500 ml-1">{formatDueDate(assignment.dueDate)}</span>
                      </div>
                    </a>
                  </Link>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No assignments yet
                </div>
              )}
            </div>
          </div>
        </nav>
        
        {/* User profile */}
        <div className="px-4 py-3 mt-auto border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                JS
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                Jamie Smith
              </p>
              <p className="text-xs text-gray-500 truncate">
                jamie@university.edu
              </p>
            </div>
            <button 
              className="p-1 rounded-md text-gray-400 hover:text-gray-500"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <i className={theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line'}></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
