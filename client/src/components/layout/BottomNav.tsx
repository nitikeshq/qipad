import { BarChart3, FolderOpen, Users, MessageSquare, Wallet } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";

export function BottomNav() {
  const [location] = useLocation();
  const isMobile = useIsMobile();

  const navItems = [
    { path: "/dashboard", label: "Home", icon: BarChart3 },
    { path: "/innovations", label: "Projects", icon: FolderOpen },
    { path: "/investors", label: "Investors", icon: Users },
    { path: "/wallet", label: "Wallet", icon: Wallet },
    { path: "/community", label: "Community", icon: MessageSquare },
  ];

  if (!isMobile) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const isActive = location === item.path || 
            (item.path === "/innovations" && (location === "/my-innovations" || location.startsWith("/innovations/")));
          
          return (
            <Link key={item.path} href={item.path}>
              <a className={`flex flex-col items-center justify-center h-full space-y-1 transition-colors ${
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              }`}>
                <item.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
