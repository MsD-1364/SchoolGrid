import { useState } from "react";
import { Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Trophy,
  BarChart3,
  Settings,
} from "lucide-react";
import Sidebar, { type NavItem } from "../../GlobalComponents/SideBar";

const COLLAPSE_KEY = "sidebar-collapsed";

/* Nav options live here and are sent to the Sidebar.
   The first item is treated as the dashboard home. */
const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Students", to: "/dashboard/students", icon: Users },
  { label: "Teachers", to: "/dashboard/teachers", icon: GraduationCap },
  { label: "Classes", to: "/dashboard/classes", icon: BookOpen },
  { label: "Attendance", to: "/dashboard/attendance", icon: CalendarCheck },
  { label: "Grades", to: "/dashboard/grades", icon: Trophy },
  { label: "Reports", to: "/dashboard/reports", icon: BarChart3 },
  { label: "Settings", to: "/dashboard/settings", icon: Settings },
];

export default function SuperAdminDashBoard() {
  const [collapsed, setCollapsed] = useState<boolean>(
    () => localStorage.getItem(COLLAPSE_KEY) === "1"
  );

  const toggle = (): void =>
    setCollapsed((prev) => {
      localStorage.setItem(COLLAPSE_KEY, prev ? "0" : "1");
      return !prev;
    });

  return (
    <div className="flex h-screen bg-white">
      {/* Left: Sidebar gets its nav options from this Dashboard */}
      <Sidebar
        navItems={NAV_ITEMS}
        collapsed={collapsed}
        onToggle={toggle}
        loginPath="/login"
      />

      {/* Right: selected page renders here */}
      <main className="min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}