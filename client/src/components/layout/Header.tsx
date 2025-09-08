import { useState } from "react";
import { ChevronDown, Menu } from "lucide-react";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";

export function Header() {
  const { user, logout } = useAuth();
  const [location, navigate] = useLocation();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/innovations", label: "Innovations" },
    { path: "/investors", label: "Investors" },
    { path: "/companies", label: "Companies" },
    { path: "/tenders", label: "Tenders" },
    { path: "/community", label: "Community" },
    { path: "/jobs", label: "Jobs" },
    { path: "/events", label: "Events" },
  ];

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 glass-effect" data-testid="header-navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            {/* Mobile hamburger menu */}
            {isMobile && (
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open main menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle>Navigation</SheetTitle>
                    <SheetDescription>
                      Navigate through the platform
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    {navigationItems.map((item) => (
                      <Link key={item.path} href={item.path}>
                        <Button 
                          variant={location === item.path ? "default" : "ghost"} 
                          className="w-full justify-start"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.label}
                        </Button>
                      </Link>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            )}
            
            <div className="flex-shrink-0">
              <Link href="/dashboard">
                <div className="flex items-center space-x-2 cursor-pointer">
                  <div className="p-1.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                    <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">Q</span>
                    </div>
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold text-primary" data-testid="logo-qipad">
                    Qipad
                  </h1>
                </div>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            {!isMobile && (
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
            )}
          </div>
          
          {/* Desktop Right Side */}
          {!isMobile && (
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
          )}

          {/* Mobile Right Side - Just notifications and profile */}
          {isMobile && (
            <div className="flex items-center space-x-2">
              <NotificationDropdown />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImage} alt={`${user?.firstName} ${user?.lastName}`} />
                      <AvatarFallback>
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{user?.firstName} {user?.lastName}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => navigate("/profile-settings")}
                  >
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => navigate("/billing-settings")}
                  >
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => navigate("/general-settings")}
                  >
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
