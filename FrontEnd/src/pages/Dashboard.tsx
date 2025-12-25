import { motion } from "framer-motion";
import { FolderOpen, MessageSquare, FileText, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "react-router-dom";

const stats = [
  { label: "Subjects", value: "5", icon: FolderOpen, path: "/subjects" },
  { label: "Chats", value: "23", icon: MessageSquare, path: "/chats" },
  { label: "Documents", value: "12", icon: FileText, path: "/documents" },
  { label: "This Week", value: "+8", icon: TrendingUp, path: "#" },
];

const recentActivity = [
  { type: "chat", title: "Data Structures: Binary Trees", time: "2 hours ago" },
  { type: "document", title: "Uploaded: Algorithms Notes.pdf", time: "5 hours ago" },
  { type: "chat", title: "Machine Learning: Neural Networks", time: "Yesterday" },
  { type: "subject", title: "Created: Web Development", time: "2 days ago" },
];

const Dashboard = () => {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-semibold text-foreground mb-1">Dashboard</h1>
        <p className="text-text-secondary">Welcome back. Here's your learning overview.</p>
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
              <div className="text-2xl font-semibold text-foreground">{stat.value}</div>
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
          {recentActivity.map((activity, index) => (
            <div
              key={index}
              className="p-4 hover:bg-surface-hover transition-colors duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-foreground">{activity.title}</span>
                <span className="text-sm text-text-muted">{activity.time}</span>
              </div>
            </div>
          ))}
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
        <Link to="/chats">
          <Card variant="hover" className="p-6">
            <CardHeader className="p-0">
              <MessageSquare className="w-5 h-5 text-text-secondary mb-3" />
              <CardTitle className="text-base">Start Chat</CardTitle>
              <CardDescription>Begin a new AI conversation</CardDescription>
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
