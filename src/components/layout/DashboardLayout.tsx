import { useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import PageTransition from "./PageTransition";
import PullToRefresh from "./PullToRefresh";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

const DashboardLayout = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();

  const handleRefresh = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    navigate(location.pathname, { replace: true });
    toast.success("Page refreshed");
  }, [navigate, location.pathname]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          
          {/* We removed the extra <SidebarTrigger /> here because TopNav now does it */}
          
          <TopNav /> 

          <main className="flex-1 overflow-auto p-4 lg:p-6 pb-24 lg:pb-6 pt-16">
            {isMobile ? (
              <PullToRefresh onRefresh={handleRefresh}>
                <PageTransition>
                  <Outlet />
                </PageTransition>
              </PullToRefresh>
            ) : (
              <PageTransition>
                <Outlet />
              </PageTransition>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;