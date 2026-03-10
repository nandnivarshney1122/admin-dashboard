import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; // Added Navigate
import DashboardLayout from "./components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentDetails from "./pages/StudentDetails";
import Teachers from "./pages/Teachers";
import Fees from "./pages/Fees";
import Announcements from "./pages/Announcements";
import Requests from "./pages/Requests";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ExamResults from "./pages/ExamResults";
import Timetable from "./pages/Timetable";
import AITimetableGenerator from "./pages/AITimetableGenerator";
import Classes from "./pages/Classes";
import Subjects from "./pages/Subjects";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

const queryClient = new QueryClient();

// Create a simple "Protected Route" component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Dashboard Routes */}
          <Route element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/:id" element={<StudentDetails />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/fees" element={<Fees />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/results" element={<ExamResults />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/timetable/generator" element={<AITimetableGenerator />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;