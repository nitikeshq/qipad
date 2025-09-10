import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
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
import CompanyDetail from "@/pages/company-detail";
import Tenders from "@/pages/tenders";
import ProfileSettings from "@/pages/profile-settings";
import BillingSettings from "@/pages/billing-settings";
import GeneralSettings from "@/pages/general-settings";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import Landing from "@/pages/landing";
import Events from "@/pages/events";
import EventPayment from "@/pages/event-payment";
import MyProjects from "@/pages/my-projects";
import MediaCenter from "@/pages/media-center";
import PaymentSuccess from "@/pages/payment-success";
import { WalletPage } from "@/pages/wallet";

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
  
  return (
    <MainLayout>
      <Component />
    </MainLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={Auth} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/innovations/:id" component={() => <ProtectedRoute component={ProjectDetailsPage} />} />
      <Route path="/innovations" component={() => <ProtectedRoute component={Projects} />} />
      <Route path="/my-innovations" component={() => <ProtectedRoute component={MyProjects} />} />
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
      <Route path="/companies/:id" component={() => <ProtectedRoute component={CompanyDetail} />} />
      <Route path="/companies" component={() => <ProtectedRoute component={Companies} />} />
      <Route path="/payment/event/:eventId" component={() => <ProtectedRoute component={EventPayment} />} />
      <Route path="/payment-success" component={() => <ProtectedRoute component={PaymentSuccess} />} />
      <Route path="/events" component={() => <ProtectedRoute component={Events} />} />
      <Route path="/media-center" component={() => <ProtectedRoute component={MediaCenter} />} />
      <Route path="/wallet" component={() => <ProtectedRoute component={WalletPage} />} />
      <Route path="/profile-settings" component={() => <ProtectedRoute component={ProfileSettings} />} />
      <Route path="/billing-settings" component={() => <ProtectedRoute component={BillingSettings} />} />
      <Route path="/general-settings" component={() => <ProtectedRoute component={GeneralSettings} />} />
      <Route path="/locked-admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/en" component={Landing} />
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
