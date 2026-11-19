
import type { ReactNode } from "react";
import { Bell, Menu, Search } from "lucide-react";

interface TopBarProps {
  onMenuClick: () => void; // opens the drawer on phones / tablets
  extra?: ReactNode; // optional chips, shown on large screens only
  notifications?: number;
  initial?: string;
}

export default function TopBar({ onMenuClick, extra, notifications = 0, initial = "A" }: TopBarProps) {
  return (
    <header className="z-30 flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:gap-4 sm:px-6 sm:py-3">
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        aria-controls="app-sidebar"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* text-base on phones stops iOS from zooming the page on focus */}
      <div className="relative min-w-0 max-w-sm flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          placeholder="Search students, classes, teachers..."
          className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-base text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:h-9 sm:text-sm"
        />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2 text-sm text-slate-600 sm:gap-4">
        {extra && <div className="hidden items-center gap-4 lg:flex">{extra}</div>}

        <button
          aria-label={`Notifications${notifications ? ` (${notifications} unread)` : ""}`}
          className="relative grid h-10 w-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 sm:h-9 sm:w-9"
        >
          <Bell className="h-4 w-4" />
          {notifications > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {notifications}
            </span>
          )}
        </button>

        <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-800 min-[400px]:flex">
          {initial}
        </div>
      </div>
    </header>
  );
}