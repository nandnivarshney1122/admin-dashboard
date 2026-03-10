import { Users, GraduationCap, DollarSign, TrendingUp } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import RecentAnnouncements from "@/components/dashboard/RecentAnnouncements";
import RecentStudents from "@/components/dashboard/RecentStudents";
import FeeOverview from "@/components/dashboard/FeeOverview";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl lg:text-3xl font-display font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, Admin! Here's what's happening today.</p>
      </div>

      {/* Stats Grid - Updated for better mobile view */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value="1,245"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
          variant="primary"
        />
        <StatCard
          title="Total Teachers"
          value="89"
          icon={GraduationCap}
          trend={{ value: 5, isPositive: true }}
          variant="accent"
        />
        <StatCard
          title="Fees Collected"
          value="$112.5K"
          icon={DollarSign}
          trend={{ value: 18, isPositive: true }}
          variant="success"
        />
        <StatCard
          title="Pending Fees"
          value="$37.5K"
          icon={TrendingUp}
          trend={{ value: 8, isPositive: false }}
          variant="warning"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RecentStudents />
          <RecentAnnouncements />
        </div>
        <div className="space-y-6">
          <FeeOverview />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;