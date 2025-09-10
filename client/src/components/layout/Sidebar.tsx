import { useState } from "react";
import { CheckCircle, Plus, Search, Briefcase, BarChart3, FolderOpen, TrendingUp, Users, MessageSquare, FileText, Gavel, Building, Building2, Scroll, PlayCircle, Wallet, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Sidebar as SidebarUI,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "wouter";
import { ProjectModal } from "@/components/modals/ProjectModal";
import { JobModal } from "@/components/modals/JobModal";
import { useIsMobile } from "@/hooks/use-mobile";

export function Sidebar() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const isMobile = useIsMobile();

  const quickActions = [
    { 
      label: "Create Innovation", 
      icon: Plus, 
      action: "create-innovation",
      onClick: () => setIsProjectModalOpen(true)
    },
    { 
      label: "Wallet", 
      icon: Wallet, 
      action: "wallet",
      onClick: () => navigate("/wallet")
    },
  ];

  // User-specific/Personal navigation - for account management
  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { path: "/my-innovations", label: "My Innovations", icon: FolderOpen },
    { path: "/investments", label: "My Investments", icon: TrendingUp },
    { path: "/my-jobs", label: "My Jobs", icon: Briefcase },
    { path: "/my-communities", label: "My Communities", icon: MessageSquare },
    { path: "/documents", label: "Documents", icon: Scroll },
  ];

  return (
    <>
      <SidebarUI variant="sidebar" data-testid="sidebar-navigation">
        <SidebarHeader className="pt-0 gap-0">
          {/* Qipad Logo */}
          <div className="flex items-center justify-center py-2 border-b border-border/50 mb-3">
            <Link href="/dashboard">
              <div className="flex items-center space-x-2 cursor-pointer">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-lg">Q</span>
                  </div>
                </div>
                <h1 className="text-xl font-bold text-primary" data-testid="sidebar-logo-qipad">
                  Qipad
                </h1>
              </div>
            </Link>
          </div>

          {/* User Profile Card */}
          <div className="bg-secondary/50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user?.profileImage || undefined} alt={`${user?.firstName} ${user?.lastName}`} />
                <AvatarFallback>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground truncate" data-testid="text-user-name">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-sm text-muted-foreground truncate" data-testid="text-user-type">
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
        </SidebarHeader>

        <SidebarContent>
          {/* Quick Actions */}
          <SidebarGroup>
            <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {quickActions.map((action) => (
                  <SidebarMenuItem key={action.action}>
                    <SidebarMenuButton
                      onClick={action.onClick}
                      className={action.action === "create-innovation" ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
                      data-testid={`button-${action.action}`}
                    >
                      <action.icon />
                      <span>{action.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Navigation Links */}
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton 
                      asChild
                      isActive={location === item.path}
                      data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Link href={item.path}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <div className="text-xs text-muted-foreground text-center">
            © 2025 Qipad
          </div>
        </SidebarFooter>
      </SidebarUI>

      {/* Modals */}
      <ProjectModal 
        open={isProjectModalOpen} 
        onOpenChange={setIsProjectModalOpen} 
      />
      
      <JobModal 
        open={isJobModalOpen} 
        onOpenChange={setIsJobModalOpen} 
      />
    </>
  );
}
