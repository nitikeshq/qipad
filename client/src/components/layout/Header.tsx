import { ChevronDown } from "lucide-react";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "wouter";

export function Header() {
  const { user, logout } = useAuth();
  const [location, navigate] = useLocation();

  const navigationItems = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/projects", label: "Projects" },
    { path: "/investors", label: "Investors" },
    { path: "/tenders", label: "Tenders" },
    { path: "/community", label: "Community" },
    { path: "/jobs", label: "Jobs" },
    { path: "/events", label: "Events" },
  ];

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 glass-effect" data-testid="header-navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <Link href="/dashboard">
                <div className="flex items-center space-x-2 cursor-pointer">
                  <div className="p-1.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                    <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">Q</span>
                    </div>
                  </div>
                  <h1 className="text-2xl font-bold text-primary" data-testid="logo-qipad">
                    Qipad
                  </h1>
                </div>
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navigationItems.map((item) => (
                  <Link key={item.path} href={item.path}>
                    <a
                      className={`px-3 py-2 text-sm font-medium transition-colors ${
                        location === item.path
                          ? "nav-active"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      data-testid={`nav-${item.label.toLowerCase()}`}
                    >
                      {item.label}
                    </a>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              <NotificationDropdown />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-3" data-testid="button-profile-menu">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImage} alt={`${user?.firstName} ${user?.lastName}`} />
                      <AvatarFallback>
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user?.firstName} {user?.lastName}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => navigate("/profile-settings")} 
                    data-testid="menu-profile"
                  >
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => navigate("/billing-settings")} 
                    data-testid="menu-billing"
                  >
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => navigate("/general-settings")} 
                    data-testid="menu-settings"
                  >
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} data-testid="menu-logout">
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
