import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Building2, CalendarCheck, Users, TrendingUp, Clock, Loader2,
  AlertTriangle, UserX, BarChart2, Lightbulb, Plus, ClipboardList,
  CheckCircle2, XCircle, Circle, ArrowRight, Activity, Shield,
  BrainCircuit, Zap, UserCheck, Settings2, FileText, ChevronRight,
  Sparkles,
} from "lucide-react";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/animations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

// ── Types ──────────────────────────────────────────────────────────────────────

interface FMStats {
  totalSpaces: number;
  bookingsToday: number;
  totalBookingsThisWeek: number;
  cancellationsThisWeek: number;
  noShowsThisWeek: number;
  noShowRate: number;
}

interface TodayBooking {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  purpose?: string;
  space: { id: string; name: string; type: string; floor: string | null; building: string | null };
  user: { id: string; name: string };
  occupancyRecords: { id: string; checkIn: string; checkOut: string | null }[];
}

interface CancellationEntry {
  id: string;
  startTime: string;
  cancellationReason?: string;
  space: { name: string; type: string };
  user: { name: string };
}

interface TopSpace {
  id: string;
  name: string;
  type: string;
  capacity: number;
  bookingCount: number;
}

interface FMDashboardData {
  role: "FM";
  stats: FMStats;
  todayBookings: TodayBooking[];
  recentCancellations: CancellationEntry[];
  topSpaces: TopSpace[];
}

// Employee types
interface EmployeeStats {
  totalSpaces: number;
  myBookingsThisWeek: number;
  activeBookings: number;
  totalBookingsThisMonth: number;
}

interface RecentBooking {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  space: { name: string; type: string; floor: string | null };
  user: { name: string };
}

interface EmployeeDashboardData {
  role: "EMPLOYEE";
  stats: EmployeeStats;
  recentBookings: RecentBooking[];
}

type DashboardData = FMDashboardData | EmployeeDashboardData;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(dt: string) {
  return new Date(dt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(dt: string) {
  return new Date(dt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

const spaceTypeLabel: Record<string, string> = {
  MEETING_ROOM: "Meeting Room",
  DESK: "Hot Desk",
  PHONE_BOOTH: "Phone Booth",
  COLLABORATION_AREA: "Collab Area",
  OFFICE: "Office",
};

// ── FM Dashboard ──────────────────────────────────────────────────────────────

function FMDashboard({ data, userName }: { data: FMDashboardData; userName: string }) {
  const { stats, todayBookings, recentCancellations, topSpaces } = data;
  const now = new Date();
  const maxBookings = Math.max(...topSpaces.map((s) => s.bookingCount), 1);
  const highNoShows = stats.noShowRate > 25;

  const statCards = [
    {
      label: "Active Spaces",
      value: stats.totalSpaces,
      sub: "Available for booking",
      icon: Building2,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Bookings Today",
      value: stats.bookingsToday,
      sub: "Across all spaces",
      icon: CalendarCheck,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "This Week",
      value: stats.totalBookingsThisWeek,
      sub: "Total bookings",
      icon: Activity,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      label: "No-Shows",
      value: stats.noShowsThisWeek,
      sub: "This week",
      icon: UserX,
      color: highNoShows ? "text-amber-500" : "text-muted-foreground",
      bg: highNoShows ? "bg-amber-500/10" : "bg-muted",
    },
    {
      label: "No-Show Rate",
      value: `${stats.noShowRate}%`,
      sub: "Of all bookings",
      icon: TrendingUp,
      color: highNoShows ? "text-amber-500" : "text-green-500",
      bg: highNoShows ? "bg-amber-500/10" : "bg-green-500/10",
    },
    {
      label: "Cancellations",
      value: stats.cancellationsThisWeek,
      sub: "This week",
      icon: XCircle,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
  ];

  return (
    <PageTransition>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
          Welcome back, {userName.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's your facilities overview for today,{" "}
          {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}.
        </p>
      </div>

      {/* No-show alert banner */}
      {highNoShows && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4"
        >
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              High no-show rate detected — {stats.noShowRate}% this week
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Consider enabling auto-release or reviewing booking policies.{" "}
              <Link to="/dashboard/recommendations" className="text-amber-600 dark:text-amber-400 hover:underline font-medium">
                View AI recommendations →
              </Link>
            </p>
          </div>
        </motion.div>
      )}

      {/* Stats grid */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        {statCards.map((s) => (
          <StaggerItem key={s.label}>
            <Card className="border-border hover-lift">
              <CardContent className="p-4">
                <div className={`h-9 w-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</div>
                <div className="text-xs font-medium mt-0.5">{s.label}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</div>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-5 mb-5">

        {/* Today's Schedule — takes 2/3 width */}
        <Card className="border-border lg:col-span-2">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-primary" />
              Today's Schedule
            </CardTitle>
            <Link
              to="/dashboard/all-bookings"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              All bookings <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {todayBookings.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <CalendarCheck className="h-8 w-8 mx-auto mb-2 opacity-25" />
                <p className="text-sm">No bookings scheduled for today.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayBookings.map((b) => {
                  const isPast = new Date(b.endTime) < now;
                  const isNow = new Date(b.startTime) <= now && new Date(b.endTime) >= now;
                  const checkedIn = b.occupancyRecords.length > 0;

                  return (
                    <div
                      key={b.id}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-colors ${
                        isNow
                          ? "border-primary/30 bg-primary/5"
                          : isPast
                          ? "border-border bg-muted/20 opacity-60"
                          : "border-border bg-muted/5 hover:bg-muted/20"
                      }`}
                    >
                      {/* Status dot */}
                      <div className="shrink-0">
                        {checkedIn ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : isPast ? (
                          <XCircle className="h-4 w-4 text-rose-400" />
                        ) : (
                          <Circle className={`h-4 w-4 ${isNow ? "text-primary" : "text-muted-foreground/40"}`} />
                        )}
                      </div>

                      {/* Time */}
                      <div className="w-24 shrink-0 text-xs font-mono text-muted-foreground">
                        {fmtTime(b.startTime)}–{fmtTime(b.endTime)}
                      </div>

                      {/* Space + user */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{b.space.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {b.user.name}
                          {b.space.floor && ` · ${b.space.floor}`}
                          {b.purpose && ` · ${b.purpose}`}
                        </p>
                      </div>

                      {/* Type pill */}
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0 hidden sm:block">
                        {spaceTypeLabel[b.space.type] ?? b.space.type}
                      </span>

                      {/* Live badge */}
                      {isNow && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/20 text-primary shrink-0 animate-pulse">
                          LIVE
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Spaces this week */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-primary" />
              Top Spaces This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topSpaces.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {topSpaces.map((s, i) => (
                  <div key={s.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium truncate max-w-[140px]">{s.name}</span>
                      <span className="text-muted-foreground shrink-0 ml-2">{s.bookingCount} bookings</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(s.bookingCount / maxBookings) * 100}%` }}
                        transition={{ duration: 0.6, delay: i * 0.08 }}
                        className="h-full rounded-full bg-primary"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {spaceTypeLabel[s.type] ?? s.type} · cap {s.capacity}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second row */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Recent Cancellations */}
        <Card className="border-border lg:col-span-2">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <XCircle className="h-4 w-4 text-rose-400" />
              Recent Cancellations
            </CardTitle>
            <span className="text-xs text-muted-foreground">Last 7 days</span>
          </CardHeader>
          <CardContent>
            {recentCancellations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500 opacity-50" />
                <p className="text-sm">No cancellations this week.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentCancellations.map((c) => (
                  <div key={c.id} className="flex items-start gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-muted/20 transition-colors">
                    <XCircle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{c.space.name}</span>
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {spaceTypeLabel[c.space.type] ?? c.space.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {c.user.name} · {fmtDate(c.startTime)} at {fmtTime(c.startTime)}
                      </p>
                      {c.cancellationReason && (
                        <p className="text-xs text-muted-foreground/80 italic mt-0.5 truncate">
                          "{c.cancellationReason}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              {
                to: "/dashboard/spaces",
                icon: Plus,
                label: "Add a Space",
                sub: "Create a new facility or room",
                primary: true,
              },
              {
                to: "/dashboard/all-bookings",
                icon: ClipboardList,
                label: "Manage Bookings",
                sub: "View and cancel any booking",
                primary: false,
              },
              {
                to: "/dashboard/utilization",
                icon: BarChart2,
                label: "Utilization Report",
                sub: "Space usage vs actual check-ins",
                primary: false,
              },
              {
                to: "/dashboard/booking-usage",
                icon: Activity,
                label: "Booking Usage",
                sub: "No-shows and check-in trends",
                primary: false,
              },
              {
                to: "/dashboard/recommendations",
                icon: Lightbulb,
                label: "AI Recommendations",
                sub: "Actionable insights powered by AI",
                primary: false,
              },
            ].map((action) => (
              <Link to={action.to} key={action.to}>
                <button
                  className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors group ${
                    action.primary
                      ? "bg-primary/5 hover:bg-primary/10 border-primary/20"
                      : "bg-muted/30 hover:bg-muted/60 border-border"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <action.icon className={`h-3.5 w-3.5 shrink-0 ${action.primary ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                    <p className={`text-sm font-medium ${action.primary ? "group-hover:text-primary" : ""} transition-colors`}>
                      {action.label}
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 pl-5">{action.sub}</p>
                </button>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}

// ── Employee Dashboard ────────────────────────────────────────────────────────

function EmployeeDashboard({ data, userName, isAdmin, isFM }: { data: EmployeeDashboardData; userName: string; isAdmin: boolean; isFM: boolean }) {
  const { stats, recentBookings = [] } = data;

  const statCards = [
    { label: "Total Spaces", value: stats.totalSpaces, icon: Users, sub: "Active spaces" },
    { label: "Active Bookings", value: stats.activeBookings, icon: CalendarCheck, sub: "Upcoming" },
    { label: "My Bookings", value: stats.myBookingsThisWeek, icon: TrendingUp, sub: "This week" },
    { label: "Total Bookings", value: stats.totalBookingsThisMonth, icon: Clock, sub: "This month" },
  ];

  return (
    <PageTransition>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
          Welcome back{userName ? `, ${userName.split(" ")[0]}` : ""}
        </h1>
        <p className="text-muted-foreground mt-1">Your workspace at a glance.</p>
      </div>

      <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <StaggerItem key={stat.label}>
            <Card className="hover-lift border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-display">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{stat.label}</div>
                <div className="text-xs text-muted-foreground/70 mt-0.5">{stat.sub}</div>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">Upcoming Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No upcoming bookings.</p>
                <Link to="/dashboard/book" className="text-primary text-sm hover:underline mt-1 inline-block">
                  Book a space →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{b.space.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmtTime(b.startTime)} – {fmtTime(b.endTime)}
                        {b.space.floor && ` · ${b.space.floor}`}
                      </p>
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {b.status.toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link to="/dashboard/book">
                <button className="w-full text-left px-4 py-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors border border-primary/20 group">
                  <p className="text-sm font-medium group-hover:text-primary transition-colors">Book a Space →</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Reserve a meeting room, desk, or office</p>
                </button>
              </Link>
              <Link to="/dashboard/bookings">
                <button className="w-full text-left px-4 py-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border group">
                  <p className="text-sm font-medium">My Bookings →</p>
                  <p className="text-xs text-muted-foreground mt-0.5">View and manage your reservations</p>
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}

// ── Admin Dashboard ───────────────────────────────────────────────────────────

interface AdminStatsData {
  totalUsers: number;
  activeUsers: number;
  totalBookingsThisWeek: number;
  totalSpaces: number;
  aiCallsThisWeek: number;
  newUsersThisMonth: number;
  adminCount: number;
  fmCount: number;
  employeeCount: number;
}

interface AdminAiStats {
  totalCalls: number;
  callsThisWeek: number;
  totalTokens: number;
  weekTotalTokens: number;
  successRate: number;
  avgLatencyMs: number;
  estimatedCostUsd: number;
  configuredProvider: "gemini" | "openai" | "none";
  model: string;
}

function AdminDashboard({ userName, data }: { userName: string; data: FMDashboardData }) {
  const now = new Date();
  const { stats: fmStats, topSpaces } = data;
  const maxBookings = Math.max(...topSpaces.map((s) => s.bookingCount), 1);

  const { data: adminStats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.get<AdminStatsData>("/api/admin/stats"),
    staleTime: 60_000,
  });

  const { data: aiStats } = useQuery({
    queryKey: ["admin-ai-stats"],
    queryFn: () => api.get<AdminAiStats>("/api/admin/ai-stats"),
    staleTime: 60_000,
  });

  const platformCards = adminStats
    ? [
        { label: "Total Users", value: adminStats.totalUsers, sub: `${adminStats.activeUsers} active`, icon: Users, color: "text-primary", bg: "bg-primary/10" },
        { label: "New This Month", value: adminStats.newUsersThisMonth, sub: "User sign-ups", icon: UserCheck, color: "text-green-500", bg: "bg-green-500/10" },
        { label: "Bookings (Week)", value: adminStats.totalBookingsThisWeek, sub: "Active bookings", icon: CalendarCheck, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "Active Spaces", value: adminStats.totalSpaces, sub: "Available now", icon: Building2, color: "text-violet-500", bg: "bg-violet-500/10" },
      ]
    : [];

  const aiCards = aiStats
    ? [
        { label: "AI Calls (Week)", value: aiStats.callsThisWeek, sub: `${aiStats.totalCalls} total`, icon: BrainCircuit, color: "text-cyan-500", bg: "bg-cyan-500/10" },
        { label: "Tokens (Week)", value: aiStats.weekTotalTokens > 0 ? `${(aiStats.weekTotalTokens / 1000).toFixed(1)}K` : "0", sub: "Input + output", icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
        { label: "Success Rate", value: `${aiStats.successRate}%`, sub: "AI reliability", icon: CheckCircle2, color: aiStats.successRate >= 95 ? "text-green-500" : "text-amber-500", bg: aiStats.successRate >= 95 ? "bg-green-500/10" : "bg-amber-500/10" },
        { label: "Est. Cost", value: `$${aiStats.estimatedCostUsd.toFixed(2)}`, sub: "All-time spend", icon: TrendingUp, color: "text-muted-foreground", bg: "bg-muted" },
      ]
    : [];

  const adminLinks = [
    { to: "/dashboard/admin", icon: Shield, label: "User Management", sub: "Create, edit, delete users", primary: true },
    { to: "/dashboard/admin", icon: BrainCircuit, label: "AI Usage & Logs", sub: "LLM calls, tokens, cost", primary: false },
    { to: "/dashboard/admin/audit", icon: FileText, label: "Audit Log", sub: "All API activity", primary: false },
    { to: "/dashboard/admin/config", icon: Settings2, label: "Platform Config", sub: "Booking policies and settings", primary: false },
    { to: "/dashboard/all-bookings", icon: ClipboardList, label: "All Bookings", sub: "View and manage any booking", primary: false },
    { to: "/dashboard/recommendations", icon: Lightbulb, label: "AI Recommendations", sub: "Actionable space insights", primary: false },
  ];

  return (
    <PageTransition>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-xs font-medium text-primary uppercase tracking-wide">Admin Dashboard</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
          Welcome back, {userName.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground mt-1">
          Platform overview for {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}.
        </p>
      </div>

      {/* Platform stats */}
      {platformCards.length > 0 && (
        <>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Platform Health</p>
          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {platformCards.map((s) => (
              <StaggerItem key={s.label}>
                <Card className="border-border hover-lift">
                  <CardContent className="p-4">
                    <div className={`h-8 w-8 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                      <s.icon className={`h-4 w-4 ${s.color}`} />
                    </div>
                    <div className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</div>
                    <div className="text-xs font-medium mt-0.5">{s.label}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</div>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </>
      )}

      {/* AI Usage stats */}
      {aiCards.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Usage</p>
            {aiStats && (
              <div className={`flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border ${
                aiStats.configuredProvider === "gemini"
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                  : aiStats.configuredProvider === "openai"
                  ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800"
                  : "bg-muted text-muted-foreground border-border"
              }`}>
                <Sparkles className="h-3 w-3" />
                {aiStats.configuredProvider !== "none" ? aiStats.model : "No provider"}
              </div>
            )}
          </div>
          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {aiCards.map((s) => (
              <StaggerItem key={s.label}>
                <Card className="border-border hover-lift">
                  <CardContent className="p-4">
                    <div className={`h-8 w-8 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                      <s.icon className={`h-4 w-4 ${s.color}`} />
                    </div>
                    <div className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</div>
                    <div className="text-xs font-medium mt-0.5">{s.label}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</div>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </>
      )}

      {/* Bottom grid: Facilities overview + Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Top spaces this week — reused FM data */}
        <Card className="border-border lg:col-span-2">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-primary" />
              Facilities Overview
            </CardTitle>
            <Link to="/dashboard/utilization" className="text-xs text-primary hover:underline flex items-center gap-1">
              Full report <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { label: "Today's Bookings", value: fmStats.bookingsToday, color: "text-primary" },
                { label: "This Week", value: fmStats.totalBookingsThisWeek, color: "text-blue-500" },
                { label: "No-Show Rate", value: `${fmStats.noShowRate}%`, color: fmStats.noShowRate > 25 ? "text-amber-500" : "text-green-500" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className={`text-xl font-bold font-display ${item.color}`}>{item.value}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2.5 pt-3 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground">Top spaces this week</p>
              {topSpaces.slice(0, 4).map((s, i) => (
                <div key={s.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium truncate max-w-[160px]">{s.name}</span>
                    <span className="text-muted-foreground shrink-0 ml-2">{s.bookingCount}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(s.bookingCount / maxBookings) * 100}%` }}
                      transition={{ duration: 0.6, delay: i * 0.08 }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Admin quick actions */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">Admin Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {adminLinks.map((action) => (
              <Link to={action.to} key={action.label}>
                <button className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors group ${
                  action.primary
                    ? "bg-primary/5 hover:bg-primary/10 border-primary/20"
                    : "bg-muted/30 hover:bg-muted/60 border-border"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <action.icon className={`h-3.5 w-3.5 shrink-0 ${action.primary ? "text-primary" : "text-muted-foreground group-hover:text-foreground"} transition-colors`} />
                      <p className={`text-sm font-medium ${action.primary ? "group-hover:text-primary" : ""} transition-colors`}>
                        {action.label}
                      </p>
                    </div>
                    <ChevronRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 pl-5">{action.sub}</p>
                </button>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

const DashboardHome = () => {
  const { user, isAdmin, isFM } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: () => api.get<DashboardData>("/api/analytics/dashboard"),
    staleTime: 0, // Always fetch fresh on every visit — lightweight endpoint
  });

  if (isLoading) {
    return (
      <PageTransition>
        <div className="mb-8">
          <div className="h-8 w-48 bg-muted animate-pulse rounded-lg mb-2" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 h-80 rounded-xl bg-muted animate-pulse" />
          <div className="h-80 rounded-xl bg-muted animate-pulse" />
        </div>
      </PageTransition>
    );
  }

  if (!data) return null;

  const userName = user?.name ?? "";

  // Admins see the admin dashboard (built on top of FM data)
  if (isAdmin && data.role === "FM") {
    return <AdminDashboard data={data as FMDashboardData} userName={userName} />;
  }

  // FM users see the FM facilities dashboard
  if (data.role === "FM") {
    return <FMDashboard data={data as FMDashboardData} userName={userName} />;
  }

  return (
    <EmployeeDashboard
      data={data as EmployeeDashboardData}
      userName={userName}
      isAdmin={isAdmin}
      isFM={isFM}
    />
  );
};

export default DashboardHome;
