import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Download, Plus, FolderOpen, DollarSign, Users, Handshake } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { StatsCard } from "@/components/cards/StatsCard";
import { ProjectModal } from "@/components/modals/ProjectModal";
import { InvestmentModal } from "@/components/modals/InvestmentModal";
import { SupportModal } from "@/components/modals/SupportModal";
import { useAuth } from "@/contexts/AuthContext";
import { Project } from "@shared/schema";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const { data: userStats } = useQuery({
    queryKey: ['/api/users/stats'],
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
      title: "Active Projects",
      value: userStats?.activeProjects || 0,
      icon: FolderOpen,
      change: "+2 this month",
      changeType: "positive" as const,
    },
    {
      title: "Funds Raised",
      value: `₹${parseFloat(userStats?.totalFunding || '0').toLocaleString()}`,
      icon: DollarSign,
      change: "+15% this month",
      changeType: "positive" as const,
      iconColor: "text-green-600",
    },
    {
      title: "Investors",
      value: userStats?.investorCount || 0,
      icon: Users,
      change: "+67 new",
      changeType: "positive" as const,
      iconColor: "text-blue-600",
    },
    {
      title: "Connections",
      value: userStats?.connectionCount || 0,
      icon: Handshake,
      change: "+23 this week",
      changeType: "positive" as const,
      iconColor: "text-purple-600",
    },
  ];

  const recentActivity = [
    { message: "New investor joined EcoTech project", time: "2 hours ago", type: "investment" },
    { message: "Document verification completed", time: "5 hours ago", type: "verification" },
    { message: "New connection request from Sarah M.", time: "1 day ago", type: "connection" },
    { message: "Job application received", time: "2 days ago", type: "job" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {/* Dashboard Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground" data-testid="text-dashboard-title">
                  Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                  Welcome back, {user?.firstName}! Here's what's happening with your business.
                </p>
              </div>
              <div className="flex space-x-3">
                <Button variant="secondary" data-testid="button-export-report">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
                <Button onClick={() => setIsProjectModalOpen(true)} data-testid="button-new-project">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </div>
            </div>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Interest Categories */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-lg border border-border shadow-sm" data-testid="section-interest-categories">
                <div className="p-6 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-foreground">What are you interested in?</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { name: "Start a new company", icon: "🏢", path: "/company-formation", category: "company-formation" },
                      { name: "Get Selected in Tenders", icon: "📄", path: "/tenders", category: "tenders" },
                      { name: "Find Projects", icon: "🔍", path: "/projects", category: "projects" },
                      { name: "Get a Job", icon: "💼", path: "/jobs", category: "jobs" },
                      { name: "Networking", icon: "🤝", path: "/network", category: "networking" },
                      { name: "Events", icon: "📅", path: "/events", category: "events" },
                      { name: "Community building", icon: "👥", path: "/community", category: "community" },
                      { name: "Find Investors", icon: "💰", path: "/investors", category: "investors" }
                    ].map((interest) => (
                      <Link key={interest.category} href={interest.path}>
                        <a>
                          <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer text-center h-full" data-testid={`card-interest-${interest.category}`}>
                            <div className="text-3xl mb-2">{interest.icon}</div>
                            <p className="text-sm font-medium text-foreground">{interest.name}</p>
                          </div>
                        </a>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Investment Opportunities */}
              <div className="bg-card rounded-lg border border-border shadow-sm" data-testid="section-investment-opportunities">
                <div className="p-4 border-b border-border">
                  <h3 className="text-lg font-semibold text-foreground">Investment Opportunities</h3>
                </div>
                <div className="p-4 space-y-4">
                  {investmentOpportunities.slice(0, 3).map((project: Project) => (
                    <div key={project.id} className="flex items-start space-x-3">
                      <img 
                        src="https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=80" 
                        alt="Project" 
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground text-sm" data-testid={`text-opportunity-title-${project.id}`}>
                          {project.title}
                        </h4>
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
                  <Link href="/projects">
                    <Button variant="ghost" className="w-full text-center text-primary hover:text-primary/80 text-sm font-medium">
                      View All Opportunities
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-card rounded-lg border border-border shadow-sm" data-testid="section-recent-activity">
                <div className="p-4 border-b border-border">
                  <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
                </div>
                <div className="p-4 space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === 'investment' ? 'bg-green-500' :
                        activity.type === 'verification' ? 'bg-blue-500' :
                        activity.type === 'connection' ? 'bg-purple-500' : 'bg-orange-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground" data-testid={`text-activity-${index}`}>
                          {activity.message}
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>


            </div>
          </div>
        </main>
      </div>

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
    </div>
  );
}
