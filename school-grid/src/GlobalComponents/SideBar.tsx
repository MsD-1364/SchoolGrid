import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen, LogOut, School, Loader2, type LucideIcon } from "lucide-react";
import { SupaBaseClientFunction } from "../lib/SupaBaseClient/SupaBaseClientFunction";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

interface SidebarProps {
  navItems: NavItem[]; // sent from the Dashboard
  collapsed: boolean;
  onToggle: () => void;
  loginPath?: string; // where to go after logout
  title?: string;
  subtitle?: string;
}

export default function Sidebar({
  navItems,
  collapsed,
  onToggle,
  loginPath = "/login",
  title = "EduCloud",
  subtitle = "School Management",
}: SidebarProps) {
  const navigate = useNavigate();
  const supabase = useMemo(() => SupaBaseClientFunction(), []);
  const [email, setEmail] = useState<string>("");
  const [loggingOut, setLoggingOut] = useState<boolean>(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, [supabase]);

  const handleLogout = async (): Promise<void> => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await supabase.auth.signOut({ scope: "local" }); // removes the session
    } catch (err) {
      console.error("Sign out failed:", err);
    } finally {
      [localStorage, sessionStorage].forEach((store) => {
        Object.keys(store)
          .filter((k) => k.startsWith("sb-") || k.includes("supabase"))
          .forEach((k) => store.removeItem(k));
      });
      navigate(loginPath, { replace: true });
    }
  };

  const initial = (email[0] ?? "A").toUpperCase();
  const homePath = navItems[0]?.to; // first item is the "Dashboard" home

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Brand + toggle */}
      <div
        className={`flex border-b border-slate-200 ${
          collapsed ? "flex-col items-center gap-3 py-4" : "items-center gap-3 px-5 py-5"
        }`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
          <School className="h-5 w-5" />
        </div>

        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-tight text-slate-900">{title}</p>
            <p className="text-[11px] leading-tight text-slate-500">{subtitle}</p>
          </div>
        )}

        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className="rounded p-1 text-slate-500 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav buttons (from props) */}
      <nav className="flex-1 space-y-1 px-2.5 py-4" aria-label="Main">
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === homePath}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex w-full items-center rounded-lg py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                collapsed ? "justify-center px-0" : "gap-3 px-3"
              } ${isActive ? "bg-slate-100 font-medium text-slate-900" : "text-slate-700 hover:bg-slate-50"}`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div
        className={`border-t border-slate-200 ${
          collapsed ? "flex flex-col items-center gap-3 py-4" : "flex items-center gap-3 px-4 py-4"
        }`}
      >
        <div
          title={collapsed ? email || "Admin User" : undefined}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white"
        >
          {initial}
        </div>

        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">Admin User</p>
            <p className="truncate text-[11px] text-slate-500">{email || "—"}</p>
          </div>
        )}

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          aria-label="Log out"
          title="Log out"
          className="rounded p-1 text-slate-600 hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-60"
        >
          {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}