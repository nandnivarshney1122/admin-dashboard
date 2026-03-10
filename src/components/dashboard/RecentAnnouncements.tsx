import { Megaphone, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const announcements = [
  {
    id: 1,
    title: "Annual Sports Day Registration",
    description: "Registration for the annual sports day is now open. All students are encouraged to participate.",
    date: "Dec 20, 2024",
    target: "All Students",
    priority: "high",
  },
  {
    id: 2,
    title: "Parent-Teacher Meeting Scheduled",
    description: "PTM for all classes will be held on January 5th, 2025.",
    date: "Dec 18, 2024",
    target: "Parents",
    priority: "medium",
  },
  {
    id: 3,
    title: "Winter Break Notice",
    description: "School will remain closed from December 25th to January 1st for winter holidays.",
    date: "Dec 15, 2024",
    target: "All",
    priority: "low",
  },
];

const priorityColors = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-success/10 text-success border-success/20",
};

const RecentAnnouncements = () => {
  return (
    <div className="bg-card rounded-2xl p-5 lg:p-6 shadow-card animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-warning/10">
            <Megaphone className="w-5 h-5 text-warning" />
          </div>
          <h3 className="text-lg font-display font-semibold">Recent Announcements</h3>
        </div>
        <Button variant="ghost" size="sm">
          View All
        </Button>
      </div>

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium truncate">{announcement.title}</h4>
                  <Badge
                    variant="outline"
                    className={priorityColors[announcement.priority as keyof typeof priorityColors]}
                  >
                    {announcement.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {announcement.description}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {announcement.date}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {announcement.target}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentAnnouncements;
