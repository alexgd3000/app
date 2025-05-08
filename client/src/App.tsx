import { Switch, Route, useLocation, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import NotFound from "@/pages/not-found";
import Profile from "@/pages/Profile";
import Upload from "@/pages/Upload";
import Planner from "@/pages/Planner";
import Focus from "@/pages/Focus";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function AppNavigation() {
  const [location, setLocation] = useLocation();
  
  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-primary-600">TaskBreak</h1>
          </div>
          
          <Tabs value={location} onValueChange={setLocation} className="w-full max-w-md">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="/" className="data-[state=active]:bg-primary-100">
                Profile
              </TabsTrigger>
              <TabsTrigger value="/upload" className="data-[state=active]:bg-primary-100">
                Upload
              </TabsTrigger>
              <TabsTrigger value="/planner" className="data-[state=active]:bg-primary-100">
                Planner
              </TabsTrigger>
              <TabsTrigger value="/focus" className="data-[state=active]:bg-primary-100">
                Focus
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center space-x-4">
            <button className="text-gray-500 hover:text-gray-700">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" 
                  clipRule="evenodd" 
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <AppNavigation />
      <div className="flex-1">
        <Switch>
          <Route path="/" component={Profile} />
          <Route path="/upload" component={Upload} />
          <Route path="/planner" component={Planner} />
          <Route path="/focus" component={Focus} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="taskbreak-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
