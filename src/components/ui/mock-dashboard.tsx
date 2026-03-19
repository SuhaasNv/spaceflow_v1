import React from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  BarChart3,
  Sparkles,
  Settings,
  Bell,
  AlertTriangle,
  TrendingDown,
  Zap,
  CheckCircle2,
  Clock,
  Building2,
} from "lucide-react";

const HOURS = [
  { h: "8A", v: 20 },
  { h: "9A", v: 46 },
  { h: "10A", v: 74 },
  { h: "11A", v: 89 },
  { h: "12P", v: 63 },
  { h: "1P",  v: 50 },
  { h: "2P",  v: 94 },
  { h: "3P",  v: 79 },
  { h: "4P",  v: 62 },
  { h: "5P",  v: 38 },
  { h: "6P",  v: 21 },
];

const AI_INSIGHTS = [
  {
    icon: AlertTriangle,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    title: "3 ghost bookings auto-cancelled",
    sub: "$480 recovered today",
  },
  {
    icon: TrendingDown,
    color: "hsl(172,66%,50%)",
    bg: "hsl(172 66% 45% / 0.12)",
    title: "Floor 2 underutilized — 23% avg",
    sub: "Consolidation layout ready",
  },
  {
    icon: Zap,
    color: "#818cf8",
    bg: "rgba(129,140,248,0.12)",
    title: "Peak demand shifts to 2 PM",
    sub: "Pre-allocate 3 overflow rooms",
  },
];

const BOOKINGS: { space: string; time: string; user: string; status: "checked-in" | "active" | "upcoming" | "flagged" }[] = [
  { space: "Conference A",  time: "10:00–11:00", user: "Sarah K.",   status: "checked-in" },
  { space: "Hot Desk 4B",   time: "09:00–18:00", user: "Marcus L.",  status: "active"     },
  { space: "Meeting Pod 2", time: "14:00–15:30", user: "Team Alpha", status: "upcoming"   },
  { space: "Boardroom",     time: "15:00–16:00", user: "Priya S.",   status: "flagged"    },
];

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  "checked-in": { label: "Checked In",  color: "#22c55e",              bg: "rgba(34,197,94,0.12)"    },
  "active":     { label: "Active",       color: "hsl(172,66%,50%)",    bg: "hsl(172 66% 45% / 0.12)" },
  "upcoming":   { label: "Upcoming",     color: "#94a3b8",              bg: "rgba(148,163,184,0.1)"   },
  "flagged":    { label: "AI Flagged",   color: "#f59e0b",              bg: "rgba(245,158,11,0.12)"   },
};

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard",  active: true  },
  { icon: CalendarDays,    label: "Spaces",     active: false },
  { icon: BarChart3,       label: "Analytics",  active: false },
  { icon: Sparkles,        label: "AI Insights",active: false },
  { icon: Settings,        label: "Settings",   active: false },
];

const TEAL = "hsl(172,66%,50%)";

export default function MockDashboard() {
  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden"
      style={{ background: "#0f1117", fontFamily: "inherit", fontSize: 11, color: "#e4e4e7" }}
    >
      {/* ── TOP NAV ── */}
      <div
        className="flex items-center justify-between shrink-0"
        style={{ padding: "7px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}
      >
        <div className="flex items-center gap-3">
          <span style={{ fontWeight: 700, fontSize: 13 }}>
            Space<span style={{ color: TEAL }}>Flow</span>
          </span>
          <div className="flex items-center gap-0.5">
            {["Dashboard", "Spaces", "Analytics", "AI Insights"].map((item, i) => (
              <button
                key={item}
                style={{
                  padding: "3px 9px",
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 500,
                  color: i === 0 ? "#fff" : "#71717a",
                  background: i === 0 ? "hsl(172 66% 45% / 0.15)" : "transparent",
                  border: "none",
                  cursor: "default",
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div style={{ position: "relative" }}>
            <Bell style={{ width: 13, height: 13, color: "#71717a" }} />
            <span style={{ position: "absolute", top: -2, right: -2, width: 6, height: 6, borderRadius: "50%", background: "#f59e0b" }} />
          </div>
          <div className="flex items-center gap-1.5" style={{ paddingLeft: 10, borderLeft: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: TEAL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#0f1117" }}>S</div>
            <span style={{ fontSize: 10, color: "#71717a" }}>Sarah K.</span>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <div
          className="flex flex-col shrink-0 gap-0.5"
          style={{ width: 110, padding: "10px 8px", borderRight: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}
        >
          {NAV.map(({ icon: Icon, label, active }) => (
            <div
              key={label}
              className="flex items-center gap-2"
              style={{
                padding: "5px 8px",
                borderRadius: 7,
                cursor: "default",
                color: active ? "#fff" : "#52525b",
                background: active ? "hsl(172 66% 45% / 0.15)" : "transparent",
              }}
            >
              <Icon style={{ width: 11, height: 11, flexShrink: 0, color: active ? TEAL : undefined }} />
              <span style={{ fontSize: 10, fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Main */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Greeting row */}
          <div className="flex items-center justify-between">
            <div>
              <div style={{ fontWeight: 600, fontSize: 12, color: "#fff" }}>Good morning, Sarah 👋</div>
              <div style={{ fontSize: 9.5, color: "#52525b", marginTop: 2 }}>Thursday, Mar 19 · 14 spaces available right now</div>
            </div>
            <button style={{ padding: "5px 11px", borderRadius: 7, background: TEAL, color: "#0f1117", fontSize: 10, fontWeight: 700, border: "none", cursor: "default" }}>
              + Book Space
            </button>
          </div>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {[
              { label: "Total Spaces",  value: "24",    sub: "9 available",    color: TEAL },
              { label: "Booked Today",  value: "18",    sub: "3 in progress",  color: TEAL },
              { label: "No-Show Rate",  value: "4.2%",  sub: "↓ from 32%",    color: "#22c55e" },
              { label: "AI Savings",    value: "$2.4k", sub: "this month",     color: "#818cf8" },
            ].map((card, i) => (
              <div
                key={i}
                style={{ borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.04)", padding: "9px 10px" }}
              >
                <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em", color: "#52525b", marginBottom: 4 }}>{card.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: card.color, lineHeight: 1, marginBottom: 3 }}>{card.value}</div>
                <div style={{ fontSize: 9, color: "#52525b" }}>{card.sub}</div>
              </div>
            ))}
          </div>

          {/* Chart + AI row */}
          <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 8 }}>

            {/* Occupancy bar chart */}
            <div style={{ borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.04)", padding: "10px 10px 8px" }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#fff" }}>Occupancy Today</span>
                <div className="flex items-center gap-2">
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: "#52525b" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: TEAL, display: "inline-block" }} /> Peak
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: "#52525b" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(255,255,255,0.08)", display: "inline-block" }} /> Low
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 60 }}>
                {HOURS.map(({ h, v }, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, height: "100%" }}>
                    <div style={{ width: "100%", flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                      <motion.div
                        style={{
                          width: "100%",
                          borderRadius: 3,
                          background: v > 85 ? TEAL : v > 60 ? "hsl(172,66%,28%)" : "rgba(255,255,255,0.08)",
                          boxShadow: v > 85 ? `0 0 6px ${TEAL}55` : "none",
                        }}
                        initial={{ height: 0 }}
                        animate={{ height: `${v}%` }}
                        transition={{ delay: i * 0.04 + 0.2, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                    <span style={{ fontSize: 8, color: "#3f3f46" }}>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Insights */}
            <div style={{ borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.04)", padding: "10px" }}>
              <div className="flex items-center gap-1.5" style={{ marginBottom: 9 }}>
                <Sparkles style={{ width: 10, height: 10, color: TEAL }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: "#fff" }}>AI Insights</span>
                <span style={{ marginLeft: "auto", fontSize: 9, color: "#52525b" }}>Live</span>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {AI_INSIGHTS.map(({ icon: Icon, color, bg, title, sub }, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <div style={{ width: 20, height: 20, borderRadius: 5, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <Icon style={{ width: 10, height: 10, color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 9.5, fontWeight: 500, color: "#d4d4d8", lineHeight: 1.3 }}>{title}</div>
                      <div style={{ fontSize: 8.5, color: "#52525b", marginTop: 1 }}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bookings table */}
          <div style={{ borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
            <div className="flex items-center justify-between" style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#fff" }}>Recent Bookings</span>
              <span style={{ fontSize: 9, color: "#52525b", cursor: "default" }}>View all →</span>
            </div>
            {BOOKINGS.map(({ space, time, user, status }, i) => {
              const sc = STATUS[status];
              return (
                <div
                  key={i}
                  className="flex items-center justify-between"
                  style={{ padding: "7px 12px", borderBottom: i < BOOKINGS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                >
                  <div className="flex items-center gap-2">
                    <Building2 style={{ width: 10, height: 10, color: "#3f3f46", flexShrink: 0 }} />
                    <span style={{ fontSize: 10, fontWeight: 500, color: "#d4d4d8" }}>{space}</span>
                  </div>
                  <span style={{ fontSize: 9, color: "#52525b" }}>{time}</span>
                  <span style={{ fontSize: 9, color: "#71717a" }}>{user}</span>
                  <span style={{ fontSize: 9, fontWeight: 500, padding: "2px 7px", borderRadius: 4, color: sc.color, background: sc.bg }}>
                    {sc.label}
                  </span>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
