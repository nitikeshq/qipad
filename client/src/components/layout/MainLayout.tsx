import { ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen flex flex-col">
      <SidebarProvider>
        <Sidebar />
        <SidebarInset className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <Header />
          <main className="flex-1 space-y-4 p-2 sm:p-4 md:p-8 pt-4 md:pt-6 overflow-x-auto max-w-full">
            {children}
          </main>
          
          {/* Footer */}
          <footer className="mt-auto bg-secondary/50 border-t border-border py-6">
            <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
              <p className="mb-2">
                © 2025 Qipad. Energized startup space for entrepreneurs and investors.
              </p>
              <p>
                Powered by{" "}
                <a 
                  href="https://www.qwegle.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  Qwegle
                </a>
              </p>
            </div>
          </footer>
        </SidebarInset>
        {isMobile && <BottomNav />}
      </SidebarProvider>
    </div>
  );
}