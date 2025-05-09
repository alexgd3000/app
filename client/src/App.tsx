import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import ProfilePage from "@/pages/ProfilePage";
import UploadPage from "@/pages/UploadPage";
import PlannerPage from "@/pages/PlannerPage";
import FocusPage from "@/pages/FocusPage";
import FocusModePage from "@/pages/FocusModePage";
import AppLayout from "@/components/AppLayout";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/planner" />
      </Route>
      <Route path="/profile">
        <AppLayout>
          <ProfilePage />
        </AppLayout>
      </Route>
      <Route path="/upload">
        <AppLayout>
          <UploadPage />
        </AppLayout>
      </Route>
      <Route path="/planner">
        <AppLayout>
          <PlannerPage />
        </AppLayout>
      </Route>
      <Route path="/focus">
        <AppLayout>
          <FocusPage />
        </AppLayout>
      </Route>
      <Route path="/focus-mode">
        <AppLayout>
          <FocusModePage />
        </AppLayout>
      </Route>
      <Route path="/dashboard">
        <Dashboard />
      </Route>
      <Route>
        <AppLayout>
          <NotFound />
        </AppLayout>
      </Route>
    </Switch>
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
