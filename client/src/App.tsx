import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import UserMenu from "@/components/UserMenu";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import ScanNow from "@/pages/ScanNow";
import Scheduling from "@/pages/Scheduling";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import About from "@/pages/About";
import FAQ from "@/pages/FAQ";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/scan" component={ScanNow} />
      <Route path="/scheduling" component={Scheduling} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route path="/about-us" component={About} />
      <Route path="/about" component={About} />
      <Route path="/faq" component={FAQ} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const handleProfileClick = () => {
    console.log("Profile clicked");
  };

  const handleApiKeysClick = () => {
    console.log("API Keys clicked");
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-background sticky top-0 z-10">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <UserMenu
                  username="Admin User"
                  onProfileClick={handleProfileClick}
                  onApiKeysClick={handleApiKeysClick}
                />
              </header>
              <main className="flex-1 overflow-auto bg-background">
                <Router />
              </main>
              <footer className="px-4 py-2 border-t border-border bg-background">
                <p className="text-xs text-muted-foreground text-center">
                  Version 1.2025 JAP Dwssalopec | Tandlist, Scauniss Vrlimcy,rulisecfy. (App Links.oenne)
                </p>
              </footer>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
