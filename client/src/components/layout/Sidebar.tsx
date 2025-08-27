import { useState } from "react";
import { CheckCircle, Plus, Search, Briefcase, BarChart3, FolderOpen, TrendingUp, Users, MessageSquare, FileText, Gavel, Building, Scroll } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "wouter";
import { ProjectModal } from "@/components/modals/ProjectModal";
import { JobModal } from "@/components/modals/JobModal";

export function Sidebar() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);

  const quickActions = [
    { 
      label: "Create Project", 
      icon: Plus, 
      action: "create-project",
      onClick: () => setIsProjectModalOpen(true)
    },
    { 
      label: "Find Investors", 
      icon: Search, 
      action: "find-investors",
      onClick: () => navigate("/investors")
    },
    { 
      label: "Post Job", 
      icon: Briefcase, 
      action: "post-job",
      onClick: () => setIsJobModalOpen(true)
    },
  ];

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { path: "/my-projects", label: "My Projects", icon: FolderOpen },
    { path: "/bidding", label: "Project Bidding", icon: Gavel },
    { path: "/investments", label: "Investments", icon: TrendingUp },
    { path: "/company-formation", label: "Company Formation", icon: Building },
    { path: "/tenders", label: "Government Tenders", icon: Scroll },
    { path: "/jobs", label: "Jobs", icon: Briefcase },
    { path: "/network", label: "Network", icon: Users },
    { path: "/community", label: "Communities", icon: MessageSquare },
    { path: "/documents", label: "Documents", icon: FileText },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border" data-testid="sidebar-navigation">
      <div className="p-6">
        <div className="space-y-6">
          {/* User Profile Card */}
          <div className="bg-secondary/50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user?.profileImage || undefined} alt={`${user?.firstName} ${user?.lastName}`} />
                <AvatarFallback>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-foreground" data-testid="text-user-name">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-sm text-muted-foreground" data-testid="text-user-type">
                  {user?.userType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
                {user?.isVerified && (
                  <div className="flex items-center mt-1">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-xs text-green-600 font-medium" data-testid="status-verified">
                      Verified
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Quick Actions
            </h4>
            {quickActions.map((action) => (
              <Button
                key={action.action}
                variant={action.action === "create-project" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={action.onClick}
                data-testid={`button-${action.action}`}
              >
                <action.icon className="h-4 w-4 mr-2" />
                {action.label}
              </Button>
            ))}
          </div>

          {/* Navigation Links */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Menu
            </h4>
            {menuItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a
                  className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                    location === item.path
                      ? "text-foreground bg-secondary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <item.icon className={`h-4 w-4 mr-3 ${location === item.path ? 'text-primary' : ''}`} />
                  {item.label}
                </a>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProjectModal 
        open={isProjectModalOpen} 
        onOpenChange={setIsProjectModalOpen} 
      />
      
      <JobModal 
        open={isJobModalOpen} 
        onOpenChange={setIsJobModalOpen} 
      />
    </aside>
  );
}
