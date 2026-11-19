import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
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
import TopBar from "../../GlobalComponents/TopBar";
import { DASHBOARD_PATHS } from "../../lib/auth/roles";

const COLLAPSE_KEY = "sidebar-collapsed";
const BASE = DASHBOARD_PATHS.SUPER_ADMIN;

/* Nav options live here and are sent to the Sidebar. First item = home. */
const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: BASE, icon: LayoutDashboard },
  { label: "Students", to: `${BASE}/students`, icon: Users },
  { label: "Teachers", to: `${BASE}/teachers`, icon: GraduationCap },
  { label: "Classes", to: `${BASE}/classes`, icon: BookOpen },
  { label: "Attendance", to: `${BASE}/attendance`, icon: CalendarCheck },
  { label: "Grades", to: `${BASE}/grades`, icon: Trophy },
  { label: "Reports", to: `${BASE}/reports`, icon: BarChart3 },
  { label: "Settings", to: `${BASE}/settings`, icon: Settings },
];

const readCollapsed = (): boolean => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
};

export default function SuperAdminDashBoard() {
  const [collapsed, setCollapsed] = useState<boolean>(readCollapsed);
  const { pathname } = useLocation();

  // The drawer is "open" only for the route it was opened on,
  // so it closes by itself after any navigation (links, back button...).
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const mobileOpen = openedAt === pathname;
  const openMenu = (): void => setOpenedAt(pathname);
  const closeMenu = (): void => setOpenedAt(null);

  // Esc closes the drawer
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setOpenedAt(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const toggleCollapsed = (): void =>
    setCollapsed((prev) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, prev ? "0" : "1");
      } catch {
        /* storage blocked – ignore */
      }
      return !prev;
    });

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-50">
      {/* Backdrop behind the drawer (phones + tablets) */}
      <div
        aria-hidden="true"
        onClick={closeMenu}
        className={`fixed inset-0 z-40 bg-slate-900/50 transition-opacity duration-200 motion-reduce:transition-none lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Left: Sidebar gets its nav options from this Dashboard */}
      <Sidebar
        navItems={NAV_ITEMS}
        collapsed={collapsed}
        onToggle={toggleCollapsed}
        mobileOpen={mobileOpen}
        onClose={closeMenu}
        loginPath="/login"
      />

      {/* Right: top bar + selected page */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          onMenuClick={openMenu}
          notifications={3}
          extra={
            <>
              <span className="flex items-center gap-1.5">
                Today:
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">
                  285 Present
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                Classes:
                <span className="rounded-md border border-slate-300 px-2 py-0.5 text-xs font-semibold text-slate-800">
                  12 Active
                </span>
              </span>
            </>
          }
        />
        <main className="flex-1 overflow-y-auto overscroll-contain">
          <Outlet />
        </main>
      </div>
    </div>
  );
}