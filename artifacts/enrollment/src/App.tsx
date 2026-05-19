import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import PreRegisterPage from "@/pages/pre-register";
import DashboardPage from "@/pages/dashboard";
import StudentsPage from "@/pages/students";
import CoursesPage from "@/pages/courses";
import EnrolleesPage from "@/pages/enrollees";
import EnrollmentPage from "@/pages/enrollment";
import CurriculumPage from "@/pages/curriculum";
import SettingsPage from "@/pages/settings";
import RoleManagementPage from "@/pages/role-management";
import ProfilePage from "@/pages/profile";
import VouchersPage from "@/pages/vouchers";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403) return false;
        return failureCount < 2;
      },
    },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-3 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return <Redirect to="/login" />;
  return <Component />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/pre-register" component={PreRegisterPage} />
      <Route path="/dashboard">
        <ProtectedRoute component={DashboardPage} />
      </Route>
      <Route path="/students">
        <ProtectedRoute component={StudentsPage} />
      </Route>
      <Route path="/courses">
        <ProtectedRoute component={CoursesPage} />
      </Route>
      <Route path="/enrollees">
        <ProtectedRoute component={EnrolleesPage} />
      </Route>
      <Route path="/enrollment">
        <ProtectedRoute component={EnrollmentPage} />
      </Route>
      <Route path="/curriculum">
        <ProtectedRoute component={CurriculumPage} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={SettingsPage} />
      </Route>
      <Route path="/role-management">
        <ProtectedRoute component={RoleManagementPage} />
      </Route>
      <Route path="/vouchers">
        <ProtectedRoute component={VouchersPage} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={ProfilePage} />
      </Route>
      <Route path="/">
        {isLoading ? (
          <div className="min-h-screen flex items-center justify-center">
            <Skeleton className="h-8 w-48" />
          </div>
        ) : isAuthenticated ? (
          <Redirect to="/dashboard" />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppWithAuth() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppWithAuth />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
