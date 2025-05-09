import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import AppLayout from "@/components/AppLayout";
import NotFound from "@/pages/not-found";
import Profile from "@/pages/Profile";
import Upload from "@/pages/Upload";
import Planner from "@/pages/Planner";
import Focus from "@/pages/Focus";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/planner" />} />
      <Route path="/profile" component={Profile} />
      <Route path="/upload" component={Upload} />
      <Route path="/planner" component={Planner} />
      <Route path="/focus" component={Focus} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="taskbreak-theme">
        <TooltipProvider>
          <Toaster />
          <AppLayout>
            <Router />
          </AppLayout>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
