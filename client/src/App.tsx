import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Auth from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import Investors from "@/pages/investors";
import Community from "@/pages/community";
import CommunityDetail from "@/pages/community-detail";
import Jobs from "@/pages/jobs";
import Bidding from "@/pages/bidding";
import { NetworkPage } from "@/pages/network";
import { DocumentsPage } from "@/pages/documents";
import { InvestmentsPage } from "@/pages/investments";
import { ProjectDetailsPage } from "@/pages/project-details";
import CompanyFormation from "@/pages/company-formation";
import Companies from "@/pages/companies";
import Tenders from "@/pages/tenders";
import ProfileSettings from "@/pages/profile-settings";
import BillingSettings from "@/pages/billing-settings";
import GeneralSettings from "@/pages/general-settings";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import Events from "@/pages/events";
import MyProjects from "@/pages/my-projects";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Auth />;
  }
  
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={Auth} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/projects/:id" component={() => <ProtectedRoute component={ProjectDetailsPage} />} />
      <Route path="/projects" component={() => <ProtectedRoute component={Projects} />} />
      <Route path="/my-projects" component={() => <ProtectedRoute component={MyProjects} />} />
      <Route path="/investors" component={() => <ProtectedRoute component={Investors} />} />
      <Route path="/network" component={() => <ProtectedRoute component={NetworkPage} />} />
      <Route path="/documents" component={() => <ProtectedRoute component={DocumentsPage} />} />
      <Route path="/investments" component={() => <ProtectedRoute component={InvestmentsPage} />} />
      <Route path="/communities/:id" component={() => <ProtectedRoute component={CommunityDetail} />} />
      <Route path="/community" component={() => <ProtectedRoute component={Community} />} />
      <Route path="/communities" component={() => <ProtectedRoute component={Community} />} />
      <Route path="/jobs" component={() => <ProtectedRoute component={Jobs} />} />
      <Route path="/bidding" component={() => <ProtectedRoute component={Bidding} />} />
      <Route path="/tenders" component={() => <ProtectedRoute component={Tenders} />} />
      <Route path="/company-formation" component={() => <ProtectedRoute component={CompanyFormation} />} />
      <Route path="/companies" component={() => <ProtectedRoute component={Companies} />} />
      <Route path="/events" component={() => <ProtectedRoute component={Events} />} />
      <Route path="/profile-settings" component={() => <ProtectedRoute component={ProfileSettings} />} />
      <Route path="/billing-settings" component={() => <ProtectedRoute component={BillingSettings} />} />
      <Route path="/general-settings" component={() => <ProtectedRoute component={GeneralSettings} />} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
