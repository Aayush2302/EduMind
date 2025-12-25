import { NavLink, useLocation } from "react-router-dom";
import { Home, FolderOpen, MessageSquare, FileText, Settings, Menu, X, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: FolderOpen, label: "Subjects", path: "/subjects" },
  { icon: MessageSquare, label: "Chats", path: "/chats" },
  { icon: FileText, label: "Documents", path: "/documents" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border z-50 transition-transform duration-200 w-60 md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between border-b border-sidebar-border p-6">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-2 text-foreground"
            onClick={() => setIsOpen(false)}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-xl font-semibold">EduMind</span>
          </NavLink>
        </div>

        <nav className="p-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors duration-200",
                  isActive
                    ? "bg-sidebar-accent text-foreground border-l-2 border-foreground"
                    : "text-text-secondary hover:text-foreground hover:bg-sidebar-accent"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}