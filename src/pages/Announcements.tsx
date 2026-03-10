import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Calendar, Megaphone, Plus } from "lucide-react";

const Announcements = () => {
  return (
    <div className="p-6 space-y-6">
      {/* --- HEADER FIX --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">Broadcast news to students and teachers.</p>
        </div>
        
        {/* Button Container */}
        <div className="w-full md:w-auto">
            <Button className="w-full md:w-auto">
                <Plus className="mr-2 h-4 w-4" /> New Announcement
            </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Announcement 1 */}
        <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">School Sports Day</CardTitle>
                    <Megaphone className="h-5 w-5 text-blue-500" />
                </div>
                <CardDescription className="flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" /> Oct 24, 2025
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    The annual sports meet will be held at the main stadium. Attendance is mandatory for all students.
                </p>
            </CardContent>
        </Card>

        {/* Announcement 2 */}
        <Card className="border-l-4 border-l-red-500">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">Exam Schedule Released</CardTitle>
                    <Bell className="h-5 w-5 text-red-500" />
                </div>
                <CardDescription className="flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" /> Oct 20, 2025
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    Mid-term examination dates have been published. Please check the Exam Results tab for details.
                </p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Announcements;