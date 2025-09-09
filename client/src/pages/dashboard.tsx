import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Download, Plus, FolderOpen, DollarSign, Users, Handshake, Wallet, Shield, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { StatsCard } from "@/components/cards/StatsCard";
import { ProjectModal } from "@/components/modals/ProjectModal";
import { InvestmentModal } from "@/components/modals/InvestmentModal";
import { SupportModal } from "@/components/modals/SupportModal";
import { useAuth } from "@/contexts/AuthContext";
import { Project } from "@shared/schema";
import { Link } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const { data: userStats } = useQuery({
    queryKey: ['/api/users/stats'],
    enabled: !!user,
  });

  const { data: walletData } = useQuery({
    queryKey: ['/api/wallet'],
    enabled: !!user,
  });

  const { data: userData } = useQuery({
    queryKey: ['/api/users/me'],
    enabled: !!user,
  });

  const { data: userProjects = [] } = useQuery({
    queryKey: ['/api/projects/my'],
    enabled: !!user,
  });

  const { data: investmentOpportunities = [] } = useQuery({
    queryKey: ['/api/projects'],
  });

  const handleInvest = (project: Project) => {
    setSelectedProject(project);
    setIsInvestmentModalOpen(true);
  };

  const handleSupport = (project: Project) => {
    setSelectedProject(project);
    setIsSupportModalOpen(true);
  };

  const stats = [
    {
      title: "Active Innovations",
      value: (userStats as any)?.activeProjects || 0,
      icon: FolderOpen,
      change: "+2 this month",
      changeType: "positive" as const,
    },
    {
      title: "Funds Raised",
      value: (userStats as any)?.totalFunding || "0 QP",
      icon: DollarSign,
      change: "+15% this month",
      changeType: "positive" as const,
      iconColor: "text-green-600",
    },
    {
      title: "Investors",
      value: (userStats as any)?.investorCount || 0,
      icon: Users,
      change: "+67 new",
      changeType: "positive" as const,
      iconColor: "text-blue-600",
    },
    {
      title: "Connections",
      value: (userStats as any)?.connectionCount || 0,
      icon: Handshake,
      change: "+23 this week",
      changeType: "positive" as const,
      iconColor: "text-purple-600",
    },
  ];



  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        {!isMobile && <Sidebar />}
        <SidebarInset className={`flex-1 flex flex-col ${isMobile ? "w-full" : ""}`}>
          <Header />
          <main className={`flex-1 p-4 md:p-6 ${isMobile ? 'pb-20' : ''}`}>
              {/* Dashboard Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-dashboard-title">
                  Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                  Welcome back, {user?.firstName}! Here's what's happening with your business.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button variant="secondary" size="sm" className="sm:size-default" data-testid="button-export-report">
                  <Download className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Export Report</span>
                </Button>
                <Button onClick={() => setIsProjectModalOpen(true)} size="sm" className="sm:size-default" data-testid="button-new-project">
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">New Project</span>
                </Button>
              </div>
            </div>
          </div>

          {/* KYC and Wallet Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* KYC Status Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">KYC Verification</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {(userData as any)?.isVerified ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                          Verified
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Your account is fully verified
                        </p>
                      </div>
                    </>
                  ) : (userData as any)?.isKycComplete ? (
                    <>
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      <div>
                        <Badge variant="outline" className="border-amber-200 text-amber-800">
                          Under Review
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Documents submitted, verification in progress
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-600" />
                      <div>
                        <Badge variant="outline" className="border-red-200 text-red-800">
                          Not Started
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Complete KYC to unlock all features
                        </p>
                      </div>
                    </>
                  )}
                </div>
                {!(userData as any)?.isVerified && (
                  <Link href="/documents">
                    <Button size="sm" className="w-full mt-3">
                      {(userData as any)?.isKycComplete ? 'View Status' : 'Complete KYC'}
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Wallet Status Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Wallet & Credits</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      ₹{(walletData as any)?.balance || '0'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Available Credits
                    </p>
                  </div>
                  <Link href="/wallet">
                    <Button size="sm" variant="outline">
                      <Wallet className="h-4 w-4 mr-1" />
                      View Wallet
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center space-x-2 mt-3">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${Math.min((parseFloat((walletData as any)?.balance || '0') / 100) * 100, 100)}%` 
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {(walletData as any)?.balance || '0'} credits
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <StatsCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                change={stat.change}
                changeType={stat.changeType}
                iconColor={stat.iconColor}
              />
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Interest Categories */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-lg border border-border shadow-sm" data-testid="section-interest-categories">
                <div className="p-4 md:p-6 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg md:text-xl font-semibold text-foreground">What are you interested in?</h2>
                  </div>
                </div>
                <div className="p-4 md:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {[
                      { name: "Start a new company", icon: "🏢", path: "/company-formation", category: "company-formation" },
                      { name: "Get Selected in Tenders", icon: "📄", path: "/tenders", category: "tenders" },
                      { name: "Find Innovations", icon: "🔍", path: "/innovations", category: "innovations" },
                      { name: "Get a Job", icon: "💼", path: "/jobs", category: "jobs" },
                      { name: "Networking", icon: "🤝", path: "/network", category: "networking" },
                      { name: "Events", icon: "📅", path: "/events", category: "events" },
                      { name: "Community building", icon: "👥", path: "/community", category: "community" },
                      { name: "Find Investors", icon: "💰", path: "/investors", category: "investors" }
                    ].map((interest) => (
                      <Link key={interest.category} href={interest.path}>
                        <div className="p-3 md:p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer text-center h-full min-h-[80px] flex flex-col justify-center" data-testid={`card-interest-${interest.category}`}>
                          <div className="text-2xl md:text-3xl mb-1 md:mb-2">{interest.icon}</div>
                          <p className="text-xs md:text-sm font-medium text-foreground leading-tight">{interest.name}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-4 md:space-y-6">
              {/* Investment Opportunities */}
              <div className="bg-card rounded-lg border border-border shadow-sm" data-testid="section-investment-opportunities">
                <div className="p-4 border-b border-border">
                  <h3 className="text-lg font-semibold text-foreground">Investment Opportunities</h3>
                </div>
                <div className="p-4 space-y-4">
                  {(investmentOpportunities as any[]).slice(0, 3).map((project: Project) => (
                    <div key={project.id} className="flex items-start space-x-3">
                      <img 
                        src="https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=80" 
                        alt="Project" 
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <Link href={`/innovations/${project.id}`}>
                          <h4 className="font-medium text-foreground text-sm hover:text-primary cursor-pointer transition-colors" data-testid={`text-opportunity-title-${project.id}`}>
                            {project.title}
                          </h4>
                        </Link>
                        <p className="text-xs text-muted-foreground">{project.industry}</p>
                        <p className="text-xs text-green-600 font-medium mt-1">
                          ₹{parseFloat(project.minimumInvestment).toLocaleString()} - ₹{parseFloat(project.fundingGoal).toLocaleString()}
                        </p>
                        <div className="flex gap-1 mt-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 text-xs"
                            onClick={() => handleInvest(project)}
                            data-testid={`button-invest-opportunity-${project.id}`}
                          >
                            💼 Invest
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="flex-1 text-xs"
                            onClick={() => handleSupport(project)}
                            data-testid={`button-support-opportunity-${project.id}`}
                          >
                            🤝 Support
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-border">
                  <Link href="/innovations">
                    <Button variant="ghost" className="w-full text-center text-primary hover:text-primary/80 text-sm font-medium">
                      View All Opportunities
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          </main>
        </SidebarInset>
      </div>
      
      {isMobile && <BottomNav />}

      <ProjectModal 
        open={isProjectModalOpen} 
        onOpenChange={setIsProjectModalOpen} 
      />
      
      <InvestmentModal 
        open={isInvestmentModalOpen} 
        onOpenChange={setIsInvestmentModalOpen}
        project={selectedProject}
      />
      
      <SupportModal 
        open={isSupportModalOpen} 
        onOpenChange={setIsSupportModalOpen}
        project={selectedProject}
      />
    </SidebarProvider>
  );
}
