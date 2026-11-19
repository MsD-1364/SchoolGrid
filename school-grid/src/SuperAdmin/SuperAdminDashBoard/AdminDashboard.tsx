import type { ComponentType, ReactNode } from "react";
import {
  Users,
  GraduationCap,
  BookOpen,
  Trophy,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/* -------------------------------------------------------------------------- */
/*  Placeholder data (replace with your Supabase data)                        */
/* -------------------------------------------------------------------------- */

type Icon = ComponentType<{ className?: string }>;
type Tone = "default" | "green" | "orange" | "blue" | "purple";

interface StatCardProps {
  title: string;
  value: string;
  caption: string;
  icon: Icon;
  delta?: { value: string; suffix: string };
  tone?: Tone;
}

interface ActivityItem {
  id: string;
  initials: string;
  avatarClass: string;
  content: ReactNode;
  time: string;
  badge: { label: string; variant: "primary" | "muted" | "outline" };
}

const PRIMARY_STATS: StatCardProps[] = [
  { title: "Total Students", value: "1,247", caption: "Active enrolled students", icon: Users, delta: { value: "+5.2%", suffix: "from last month" } },
  { title: "Teachers & Staff", value: "89", caption: "Active faculty members", icon: GraduationCap, delta: { value: "+2.1%", suffix: "from last month" } },
  { title: "Classes", value: "156", caption: "Active class sessions", icon: BookOpen },
  { title: "Attendance Rate", value: "94.2%", caption: "This week's average", icon: TrendingUp, delta: { value: "+1.8%", suffix: "from last week" } },
];

const SECONDARY_STATS: StatCardProps[] = [
  { title: "Today's Attendance", value: "285", caption: "Students present today", icon: CheckCircle2, tone: "green" },
  { title: "Absent Students", value: "15", caption: "Students absent today", icon: AlertCircle, tone: "orange" },
  { title: "Active Classes", value: "12", caption: "Classes in session now", icon: CalendarDays, tone: "blue" },
  { title: "Recent Grades", value: "47", caption: "Assignments graded today", icon: Trophy, tone: "purple" },
];

const WEEKLY_ATTENDANCE = [
  { day: "Mon", present: 282, absent: 20 },
  { day: "Tue", present: 275, absent: 25 },
  { day: "Wed", present: 293, absent: 9 },
  { day: "Thu", present: 287, absent: 14 },
  { day: "Fri", present: 271, absent: 30 },
  { day: "Sat", present: 198, absent: 5 },
  { day: "Sun", present: 0, absent: 0 },
];

const ACTIVITIES: ActivityItem[] = [
  {
    id: "1",
    initials: "EJ",
    avatarClass: "bg-blue-500",
    content: (
      <>
        <span className="font-medium text-slate-900">Emily Johnson</span>{" "}
        <span className="text-slate-500">enrolled in</span>{" "}
        <span className="font-medium text-slate-900">Grade 10 Mathematics</span>
      </>
    ),
    time: "2 minutes ago",
    badge: { label: "New", variant: "primary" },
  },
  {
    id: "2",
    initials: "MSC",
    avatarClass: "bg-green-500",
    content: (
      <>
        <span className="font-medium text-slate-900">Mrs. Sarah Chen</span>{" "}
        <span className="text-slate-500">marked attendance for</span>{" "}
        <span className="font-medium text-slate-900">Biology Class (Period 3)</span>
      </>
    ),
    time: "15 minutes ago",
    badge: { label: "Present: 28/30", variant: "muted" },
  },
  {
    id: "3",
    initials: "MDW",
    avatarClass: "bg-purple-500",
    content: (
      <>
        <span className="font-medium text-slate-900">Mr. David Wilson</span>{" "}
        <span className="text-slate-500">submitted grades for</span>{" "}
        <span className="font-medium text-slate-900">Chemistry Quiz #3</span>
      </>
    ),
    time: "about 1 hour ago",
    badge: { label: "Completed", variant: "outline" },
  },
];

/* -------------------------------------------------------------------------- */
/*  Building blocks                                                           */
/* -------------------------------------------------------------------------- */

const TONES: Record<Tone, string> = {
  default: "bg-white border-slate-200",
  green: "bg-green-50/60 border-green-200",
  orange: "bg-orange-50/60 border-orange-200",
  blue: "bg-blue-50/60 border-blue-200",
  purple: "bg-violet-50/60 border-violet-200",
};

function StatCard({ title, value, caption, icon: IconComp, delta, tone = "default" }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5 ${TONES[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          <p className="mt-0.5 text-xs text-slate-500">{caption}</p>
          {delta && (
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="rounded-md bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                {delta.value}
              </span>
              <span className="text-xs text-slate-500">{delta.suffix}</span>
            </div>
          )}
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 sm:h-11 sm:w-11">
          <IconComp className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
    </div>
  );
}

function Badge({ variant, children }: { variant: ActivityItem["badge"]["variant"]; children: ReactNode }) {
  const styles = {
    primary: "bg-blue-600 text-white",
    muted: "bg-slate-100 text-slate-700",
    outline: "border border-slate-300 bg-white text-slate-700",
  } as const;
  return (
    <span className={`shrink-0 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold ${styles[variant]}`}>
      {children}
    </span>
  );
}

function WeeklyAttendanceCard() {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">Weekly Attendance</h2>
      <p className="mt-1 text-sm text-slate-500">Student attendance trends for this week</p>

      <div className="mt-4 h-60 w-full sm:mt-6 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={WEEKLY_ATTENDANCE} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#475569" }} axisLine={{ stroke: "#94a3b8" }} tickLine={false} />
            <YAxis
              domain={[0, 300]}
              ticks={[0, 75, 150, 225, 300]}
              tick={{ fontSize: 11, fill: "#475569" }}
              axisLine={{ stroke: "#94a3b8" }}
              tickLine={false}
            />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
            <Legend iconType="plainline" wrapperStyle={{ fontSize: 13, paddingTop: 8 }} />
            <Line type="monotone" dataKey="present" name="Present" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: "#3b82f6" }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="absent" name="Absent" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: "#ef4444" }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function RecentActivityCard() {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>
      <p className="mt-1 text-sm text-slate-500">Latest updates from across the school</p>

      <ul className="mt-4 space-y-5 sm:mt-6">
        {ACTIVITIES.map((a) => (
          <li key={a.id} className="flex items-start gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white ${a.avatarClass}`}>
              {a.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug">{a.content}</p>
              <p className="mt-1 text-xs text-slate-500">{a.time}</p>
            </div>
            <Badge variant={a.badge.variant}>{a.badge.label}</Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page – renders inside the layout's <Outlet />                             */
/* -------------------------------------------------------------------------- */

export default function AdminDashboard() {
  return (
    <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Welcome back! Here's what's happening at your school today.
        </p>
      </div>

      {/* phones: 1 col · big phones / tablets: 2 cols · wide desktop: 4 cols */}
      <div className="mt-5 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 sm:mt-6 sm:gap-5 xl:grid-cols-4">
        {PRIMARY_STATS.map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:gap-5 xl:grid-cols-4">
        {SECONDARY_STATS.map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:mt-6 sm:gap-5 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <WeeklyAttendanceCard />
        </div>
        <RecentActivityCard />
      </div>
    </div>
  );
}