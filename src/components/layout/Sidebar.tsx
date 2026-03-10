import { Link, useLocation, useNavigate } from "react-router-dom"; // 1. Added useNavigate
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  CreditCard, 
  Bell, 
  FileText, 
  Settings, 
  LogOut, 
  ClipboardList, 
  Calendar,
  Sparkles,
  BookOpen,
} from "lucide-react";
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { toast } from "sonner"; // 2. Added toast for notifications

// Menu items configuration
const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Students", url: "/students", icon: Users },
  { title: "Teachers", url: "/teachers", icon: GraduationCap },
  { title: "Classes", url: "/classes", icon: BookOpen },
  { title: "Subjects", url: "/subjects", icon: BookOpen },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Exam Results", url: "/results", icon: ClipboardList },
  { title: "Timetable", url: "/timetable", icon: Calendar },
  { title: "AI Timetable Generator", url: "/timetable/generator", icon: Sparkles },
  { title: "Fees", url: "/fees", icon: CreditCard },
  { title: "Announcements", url: "/announcements", icon: Bell },
  { title: "Requests", url: "/requests", icon: FileText },
  { title: "Settings", url: "/settings", icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate(); // 3. Initialize navigation hook
  const { setOpenMobile } = useSidebar();

  // 4. Create the Logout Function
  const handleLogout = () => {
    // Clear the "logged in" flag from storage
    localStorage.removeItem("isAuthenticated");
    
    // Show a success message
    toast.success("Logged out successfully");
    
    // Redirect the user to the Login page
    navigate("/login");
  };

  return (
    <SidebarComponent>
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <GraduationCap className="h-6 w-6" />
          <span>SchoolHub</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                    onClick={() => setOpenMobile(false)}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            {/* 5. Attach the handleLogout function to onClick */}
            <SidebarMenuButton 
              onClick={handleLogout} 
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut />
              <span>Log Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </SidebarComponent>
  );
}