import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <DashboardContent />
    </div>
  );
}

function DashboardContent() {
  return (
    <div className="md:ml-60">
      <TopNav />
      <main className="p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}