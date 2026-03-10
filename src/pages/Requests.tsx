import { useState } from "react";
import { Search, CheckCircle, XCircle, Clock, FileText, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const requests = [
  {
    id: 1,
    type: "Leave Request",
    from: "Sarah Johnson",
    role: "Teacher",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face",
    description: "Requesting 3 days leave for personal reasons",
    dates: "Dec 26 - Dec 28, 2024",
    status: "Pending",
    submittedOn: "Dec 20, 2024",
  },
  {
    id: 2,
    type: "Document Request",
    from: "Emma Wilson",
    role: "Student",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    description: "Requesting transfer certificate",
    dates: null,
    status: "Pending",
    submittedOn: "Dec 19, 2024",
  },
  {
    id: 3,
    type: "Leave Request",
    from: "Robert Williams",
    role: "Teacher",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    description: "Medical leave for surgery recovery",
    dates: "Jan 5 - Jan 12, 2025",
    status: "Approved",
    submittedOn: "Dec 18, 2024",
  },
  {
    id: 4,
    type: "Document Request",
    from: "James Miller",
    role: "Student",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    description: "Requesting bonafide certificate",
    dates: null,
    status: "Rejected",
    submittedOn: "Dec 15, 2024",
  },
];

const statusConfig = {
  Pending: { icon: Clock, className: "bg-warning/10 text-warning border-warning/20" },
  Approved: { icon: CheckCircle, className: "bg-success/10 text-success border-success/20" },
  Rejected: { icon: XCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const Requests = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredRequests = requests.filter((request) => {
    const matchesSearch = request.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = requests.filter(r => r.status === "Pending").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Requests</h1>
          <p className="text-muted-foreground">
            Manage leave and document requests
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingCount} pending</Badge>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl p-4 shadow-card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-muted p-1 rounded-xl">
          <TabsTrigger value="all" className="rounded-lg">All Requests</TabsTrigger>
          <TabsTrigger value="leave" className="rounded-lg">Leave</TabsTrigger>
          <TabsTrigger value="document" className="rounded-lg">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Requests List */}
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const config = statusConfig[request.status as keyof typeof statusConfig];
              const StatusIcon = config.icon;
              return (
                <div
                  key={request.id}
                  className="bg-card rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={request.avatar} />
                      <AvatarFallback>{request.from.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold">{request.from}</h3>
                        <Badge variant="secondary" className="text-xs">{request.role}</Badge>
                        <Badge variant="outline" className={config.className}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {request.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{request.type}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{request.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        {request.dates && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {request.dates}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Submitted: {request.submittedOn}
                        </span>
                      </div>
                    </div>
                    {request.status === "Pending" && (
                      <div className="flex sm:flex-col gap-2">
                        <Button variant="success" size="sm" className="gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button variant="destructive" size="sm" className="gap-1">
                          <XCircle className="w-4 h-4" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="leave">
          <div className="space-y-4">
            {filteredRequests
              .filter((r) => r.type === "Leave Request")
              .map((request) => {
                const config = statusConfig[request.status as keyof typeof statusConfig];
                const StatusIcon = config.icon;
                return (
                  <div
                    key={request.id}
                    className="bg-card rounded-2xl p-5 shadow-card"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={request.avatar} />
                        <AvatarFallback>{request.from.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{request.from}</h3>
                          <Badge variant="outline" className={config.className}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{request.description}</p>
                        <p className="text-sm font-medium mt-2">{request.dates}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </TabsContent>

        <TabsContent value="document">
          <div className="space-y-4">
            {filteredRequests
              .filter((r) => r.type === "Document Request")
              .map((request) => {
                const config = statusConfig[request.status as keyof typeof statusConfig];
                const StatusIcon = config.icon;
                return (
                  <div
                    key={request.id}
                    className="bg-card rounded-2xl p-5 shadow-card"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={request.avatar} />
                        <AvatarFallback>{request.from.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{request.from}</h3>
                          <Badge variant="outline" className={config.className}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{request.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Requests;
