import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const Settings = () => {
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john@example.com",
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    autoSave: true,
    compactMode: false,
  });

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const handleProfileSave = () => {
    toast.success("Profile updated");
  };

  const handlePasswordChange = () => {
    if (passwords.new !== passwords.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (passwords.new.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    toast.success("Password changed");
    setPasswords({ current: "", new: "", confirm: "" });
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-semibold text-foreground mb-1">Settings</h1>
        <p className="text-text-secondary">Manage your account and preferences</p>
      </motion.div>

      {/* Profile Settings */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <h2 className="text-lg font-medium text-foreground mb-4">Profile</h2>
        <Card variant="surface" className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-text-secondary">Name</label>
            <Input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-text-secondary">Email</label>
            <Input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
          </div>
          <Button variant="hero-primary" onClick={handleProfileSave}>
            Save Changes
          </Button>
        </Card>
      </motion.section>

      {/* Preferences */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <h2 className="text-lg font-medium text-foreground mb-4">Preferences</h2>
        <Card variant="surface" className="divide-y divide-border">
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-foreground">Email Notifications</p>
              <p className="text-sm text-text-muted">
                Receive updates about your learning progress
              </p>
            </div>
            <Switch
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, emailNotifications: checked })
              }
            />
          </div>
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-foreground">Auto-save Chats</p>
              <p className="text-sm text-text-muted">
                Automatically save your chat conversations
              </p>
            </div>
            <Switch
              checked={preferences.autoSave}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, autoSave: checked })
              }
            />
          </div>
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-foreground">Compact Mode</p>
              <p className="text-sm text-text-muted">
                Reduce spacing for more content
              </p>
            </div>
            <Switch
              checked={preferences.compactMode}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, compactMode: checked })
              }
            />
          </div>
        </Card>
      </motion.section>

      {/* Security */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <h2 className="text-lg font-medium text-foreground mb-4">Security</h2>
        <Card variant="surface" className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-text-secondary">Current Password</label>
            <Input
              type="password"
              value={passwords.current}
              onChange={(e) =>
                setPasswords({ ...passwords, current: e.target.value })
              }
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-text-secondary">New Password</label>
            <Input
              type="password"
              value={passwords.new}
              onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-text-secondary">Confirm New Password</label>
            <Input
              type="password"
              value={passwords.confirm}
              onChange={(e) =>
                setPasswords({ ...passwords, confirm: e.target.value })
              }
              placeholder="••••••••"
            />
          </div>
          <Button variant="outline" onClick={handlePasswordChange}>
            Change Password
          </Button>
        </Card>
      </motion.section>

      {/* Danger Zone */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <h2 className="text-lg font-medium text-foreground mb-4">Danger Zone</h2>
        <Card variant="surface" className="p-6 border-destructive/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground">Delete Account</p>
              <p className="text-sm text-text-muted">
                Permanently delete your account and all data
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => toast.error("Account deletion is disabled in demo")}
            >
              Delete
            </Button>
          </div>
        </Card>
      </motion.section>
    </div>
  );
};

export default Settings;
