import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { UserCircle, Upload, Calendar, Clock } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useQuery } from "@tanstack/react-query";
import { Assignment } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const isMobile = useIsMobile();

  const { 
    data: assignments = []
  } = useQuery<Assignment[]>({
    queryKey: ['/api/assignments/incomplete'],
  });

  const getNavItemClass = (path: string) => {
    const isActive = location === path;
    return `flex items-center px-4 py-2 text-sm font-medium rounded-md ${
      isActive
        ? "bg-primary-50 text-primary-700"
        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
    }`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sidebar for mobile */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} assignments={assignments} />

      {/* Top navigation bar */}
      <header className="bg-white border-b border-gray-200 z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-primary-600">TaskBreak</h1>
              </div>
              
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="ml-2 md:hidden text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                <i className="ri-menu-line text-xl"></i>
              </Button>
            </div>
            
            {/* Main navigation for desktop */}
            <nav className="hidden md:flex space-x-1 ml-8">
              <Link href="/profile">
                <a className={getNavItemClass("/profile")}>
                  <UserCircle className="mr-2 h-5 w-5" />
                  Profile
                </a>
              </Link>
              
              <Link href="/upload">
                <a className={getNavItemClass("/upload")}>
                  <Upload className="mr-2 h-5 w-5" />
                  Upload
                </a>
              </Link>
              
              <Link href="/planner">
                <a className={getNavItemClass("/planner")}>
                  <Calendar className="mr-2 h-5 w-5" />
                  Planner
                </a>
              </Link>
              
              <Link href="/focus">
                <a className={getNavItemClass("/focus")}>
                  <Clock className="mr-2 h-5 w-5" />
                  Focus
                </a>
              </Link>
            </nav>

            {/* Right-side actions */}
            <div className="flex items-center">
              {!isMobile && (
                <div className="flex-1 px-2 lg:ml-6 lg:justify-end mr-4">
                  <div className="max-w-lg w-full lg:max-w-xs">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i className="ri-search-line text-gray-400"></i>
                      </div>
                      <input
                        className="block w-full pl-10 pr-3 py-2 rounded-md text-sm border border-gray-300 placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        type="search"
                        placeholder="Search assignments..."
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Notifications & Profile */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  <i className="ri-notification-3-line text-xl"></i>
                </Button>
                
                <Link href="/profile">
                  <a className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                      <i className="ri-user-line"></i>
                    </div>
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-4">
          <Link href="/profile">
            <a className="flex flex-col items-center py-2 text-xs font-medium">
              <UserCircle className="h-6 w-6 mb-1" color={location === "/profile" ? "#4F46E5" : "#6B7280"} />
              <span className={location === "/profile" ? "text-primary-600" : "text-gray-500"}>
                Profile
              </span>
            </a>
          </Link>
          <Link href="/upload">
            <a className="flex flex-col items-center py-2 text-xs font-medium">
              <Upload className="h-6 w-6 mb-1" color={location === "/upload" ? "#4F46E5" : "#6B7280"} />
              <span className={location === "/upload" ? "text-primary-600" : "text-gray-500"}>
                Upload
              </span>
            </a>
          </Link>
          <Link href="/planner">
            <a className="flex flex-col items-center py-2 text-xs font-medium">
              <Calendar className="h-6 w-6 mb-1" color={location === "/planner" ? "#4F46E5" : "#6B7280"} />
              <span className={location === "/planner" ? "text-primary-600" : "text-gray-500"}>
                Planner
              </span>
            </a>
          </Link>
          <Link href="/focus">
            <a className="flex flex-col items-center py-2 text-xs font-medium">
              <Clock className="h-6 w-6 mb-1" color={location === "/focus" ? "#4F46E5" : "#6B7280"} />
              <span className={location === "/focus" ? "text-primary-600" : "text-gray-500"}>
                Focus
              </span>
            </a>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 bg-gray-50 pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
}