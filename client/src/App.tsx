import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Workflows from "./pages/Workflows";
import Webhooks from "./pages/Webhooks";
import AIWorkflowBuilder from "./pages/AIWorkflowBuilder";

function Router() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <Switch>
      <Route path={"/"} component={Home} />
      {isAuthenticated && (
        <>
          <Route path={"/dashboard"} component={() => <DashboardLayout><Dashboard /></DashboardLayout>} />
          <Route path={"/workflows"} component={() => <DashboardLayout><Workflows /></DashboardLayout>} />
          <Route path={"/webhooks"} component={() => <DashboardLayout><Webhooks /></DashboardLayout>} />
          <Route path={"/ai-builder"} component={() => <DashboardLayout><AIWorkflowBuilder /></DashboardLayout>} />
        </>
      )}
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
