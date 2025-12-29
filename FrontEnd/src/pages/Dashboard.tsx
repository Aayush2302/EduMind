/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from "framer-motion";
import { FolderOpen, MessageSquare, FileText, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getFolders } from "@/services/folderService";
import { getChats } from "@/services/chatService";
import { getCurrentUser } from "@/lib/api";

interface ActivityItem {
  type: "chat" | "document" | "subject";
  title: string;
  time: string;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
}

const Dashboard = () => {
  const [folders, setFolders] = useState<any[]>([]);
  const [totalChats, setTotalChats] = useState(0);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch current user
      const userData = await getCurrentUser();
      if (userData) {
        setUser({
          id: userData.id || userData.userId,
          email: userData.email,
          name: userData.name,
        });
      }

      // Fetch folders
      const foldersData = await getFolders();
      setFolders(foldersData);

      // Fetch chats from all folders and build activity
      let allChats = 0;
      const activities: ActivityItem[] = [];

      for (const folder of foldersData) {
        try {
          const chats = await getChats(folder._id);
          allChats += chats.length;

          // Add recent chats to activity
          chats.forEach((chat: any) => {
            activities.push({
              type: "chat",
              title: chat.title,
              time: formatTime(chat.createdAt),
              createdAt: chat.createdAt,
            });
          });
        } catch (err) {
          console.error(`Failed to fetch chats for folder ${folder._id}:`, err);
        }
      }

      setTotalChats(allChats);

      // Add folder creation to activity
      foldersData.forEach((folder: any) => {
        activities.push({
          type: "subject",
          title: `Created: ${folder.name}`,
          time: formatTime(folder.createdAt),
          createdAt: folder.createdAt,
        });
      });

      // Sort by date (newest first) and take top 4
      const sorted = activities.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setRecentActivity(sorted.slice(0, 4));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load dashboard data";
      setError(errorMessage);
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffHours < 1) return "Just now";
      if (diffHours < 24)
        return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return date.toLocaleDateString();
    } catch {
      return "Recently";
    }
  };

  const stats = [
    {
      label: "Subjects",
      value: folders.length.toString(),
      icon: FolderOpen,
      path: "/subjects",
    },
    {
      label: "Chats",
      value: totalChats.toString(),
      icon: MessageSquare,
      path: "/chats",
    },
    {
      label: "Documents",
      value: "0",
      icon: FileText,
      path: "/documents",
    },
    {
      label: "This Week",
      value: recentActivity.length.toString(),
      icon: TrendingUp,
      path: "#",
    },
  ];

  const getUserGreeting = () => {
    if (!user) return "Dashboard";
    const namePart = user.name ? user.name.split(" ")[0] : user.email.split("@")[0];
    return `Welcome back, ${namePart}`;
  };

  if (error) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-semibold text-foreground mb-1">Dashboard</h1>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Error loading dashboard: {error}
        </div>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-semibold text-foreground mb-1">Dashboard</h1>
        <p className="text-text-secondary">
          {loading
            ? "Loading your learning overview..."
            : "Welcome back. Here's your learning overview."}
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.path}>
            <Card variant="hover" className="p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="w-4 h-4 text-text-muted" />
              </div>
              <div className="text-2xl font-semibold text-foreground">
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  stat.value
                )}
              </div>
              <div className="text-sm text-text-secondary">{stat.label}</div>
            </Card>
          </Link>
        ))}
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <h2 className="text-lg font-medium text-foreground mb-4">Recent Activity</h2>
        <Card variant="surface" className="divide-y divide-border">
          {loading ? (
            <div className="p-8 flex items-center justify-center text-text-muted">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading activity...
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              No activity yet. Create a subject or start a chat to get started!
            </div>
          ) : (
            recentActivity.map((activity, index) => (
              <div
                key={index}
                className="p-4 hover:bg-surface-hover transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-foreground">{activity.title}</span>
                  <span className="text-sm text-text-muted">{activity.time}</span>
                </div>
              </div>
            ))
          )}
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Link to="/subjects">
          <Card variant="hover" className="p-6">
            <CardHeader className="p-0">
              <FolderOpen className="w-5 h-5 text-text-secondary mb-3" />
              <CardTitle className="text-base">Create Subject</CardTitle>
              <CardDescription>Organize your learning materials</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link to="/chats"> {/* Remove query params */}
  <Card variant="hover" className="p-6">
    <CardHeader className="p-0">
      <MessageSquare className="w-5 h-5 text-text-secondary mb-3" />
      <CardTitle className="text-base">Start Chat</CardTitle>
      <CardDescription>View all your conversations</CardDescription>
    </CardHeader>
  </Card>
</Link>
        <Link to="/documents">
          <Card variant="hover" className="p-6">
            <CardHeader className="p-0">
              <FileText className="w-5 h-5 text-text-secondary mb-3" />
              <CardTitle className="text-base">Upload Document</CardTitle>
              <CardDescription>Add learning materials</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </motion.div>
    </div>
  );
};

export default Dashboard;