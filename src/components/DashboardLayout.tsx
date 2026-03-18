import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  CalendarPlus,
  CalendarCheck,
  BarChart3,
  Lightbulb,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Sun,
  Moon,
  Activity,
  TrendingUp,
  PieChart,
  Building2,
  Settings,
  FileText,
  Sliders,
  User,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AIChatWidget } from "@/components/AIChatWidget";
import { ErrorBoundary } from "@/components/ErrorBoundary";

type Role = "ADMIN" | "FACILITIES_MANAGER" | "EMPLOYEE";

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Only show for these roles. Omit = show to all. */
  roles?: Role[];
  /** Only HIDE for these roles (inverse filter). */
  hideFor?: Role[];
  /** Visual group divider rendered above this item */
  dividerLabel?: string;
}

const navItems: NavItem[] = [
  // ── Overview ──────────────────────────────────────────────────────────────
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },

  // ── Space booking (employees / FM only — not admin) ───────────────────────
  { label: "Book Space",   path: "/dashboard/book",     icon: CalendarPlus,  hideFor: ["ADMIN"] },
  { label: "My Bookings",  path: "/dashboard/bookings", icon: CalendarCheck, roles: ["EMPLOYEE"] },

  // ── Analytics — FM + Admin ─────────────────────────────────────────────────
  { label: "All Bookings",   path: "/dashboard/all-bookings",  icon: ClipboardList, roles: ["ADMIN", "FACILITIES_MANAGER"] },
  { label: "Utilization",    path: "/dashboard/utilization",   icon: BarChart3,     roles: ["ADMIN", "FACILITIES_MANAGER"] },
  { label: "Booking Usage",  path: "/dashboard/booking-usage", icon: Activity,      roles: ["ADMIN", "FACILITIES_MANAGER"] },
  { label: "Patterns",       path: "/dashboard/patterns",      icon: TrendingUp,    roles: ["ADMIN", "FACILITIES_MANAGER"] },
  { label: "Segments",       path: "/dashboard/segments",      icon: PieChart,      roles: ["ADMIN", "FACILITIES_MANAGER"] },
  { label: "Recommendations",path: "/dashboard/recommendations",icon: Lightbulb,    roles: ["ADMIN", "FACILITIES_MANAGER"] },
  { label: "Spaces",         path: "/dashboard/spaces",        icon: Building2,     roles: ["ADMIN", "FACILITIES_MANAGER"] },

  // ── Admin-only platform management ────────────────────────────────────────
  {
    label: "Users & AI",
    path: "/dashboard/admin",
    icon: ShieldCheck,
    roles: ["ADMIN"],
    dividerLabel: "Platform",
  },
  { label: "Config",     path: "/dashboard/admin/config", icon: Sliders,  roles: ["ADMIN"] },
  { label: "Audit Log",  path: "/dashboard/admin/audit",  icon: FileText, roles: ["ADMIN"] },

  // ── Bottom items ──────────────────────────────────────────────────────────
  { label: "Settings", path: "/dashboard/settings", icon: Settings },
];

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("sf-theme");
    // Default to dark unless user explicitly chose light
    return stored ? stored === "dark" : true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("sf-theme", dark ? "dark" : "light");
  }, [dark]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    toast.success("Logged out successfully");
  };

  const visibleNavItems = navItems.filter((item) => {
    if (!user) return false;
    if (item.hideFor && item.hideFor.includes(user.role as Role)) return false;
    if (item.roles && !item.roles.includes(user.role as Role)) return false;
    return true;
  });

  const SidebarNav = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className={mobile ? "p-4 space-y-0.5" : "flex-1 py-3 space-y-0.5 px-2 overflow-y-auto"}>
      {visibleNavItems.map((item) => {
        const active = location.pathname === item.path ||
          // sub-pages: e.g. /dashboard/admin/config should also highlight "Config"
          (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
        return (
          <div key={item.path}>
            {/* Section divider */}
            {item.dividerLabel && !collapsed && !mobile && (
              <div className="pt-4 pb-1 px-3">
                <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
                  {item.dividerLabel}
                </p>
              </div>
            )}
            {item.dividerLabel && (collapsed || mobile) && (
              <div className="mx-2 my-2 border-t border-border/60" />
            )}
            <Link
              to={item.path}
              onClick={() => mobile && setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-primary/10 rounded-lg"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <item.icon className={`h-5 w-5 shrink-0 relative z-10 ${active ? "text-primary" : ""}`} />
              {(!collapsed || mobile) && <span className="relative z-10">{item.label}</span>}
            </Link>
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 sticky top-0 h-screen shrink-0 ${
          collapsed ? "w-[68px]" : "w-60"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!collapsed && (
            <Link to="/" className="font-display text-lg font-bold">
              Space<span className="text-primary">Flow</span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-muted-foreground hover:text-foreground transition-colors ml-auto"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft
              className={`h-5 w-5 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        <SidebarNav />

        {/* User info */}
        {!collapsed && user && (
          <div className="px-4 py-3 border-t border-border">
            <div className="flex items-center gap-2">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                user.role === "ADMIN"
                  ? "bg-destructive/15"
                  : user.role === "FACILITIES_MANAGER"
                  ? "bg-orange-500/15"
                  : "gradient-primary"
              }`}>
                <User className={`h-3.5 w-3.5 ${
                  user.role === "ADMIN"
                    ? "text-destructive"
                    : user.role === "FACILITIES_MANAGER"
                    ? "text-orange-500"
                    : "text-primary-foreground"
                }`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{user.name}</p>
                <p className={`text-[10px] font-semibold uppercase tracking-wide ${
                  user.role === "ADMIN"
                    ? "text-destructive/70"
                    : user.role === "FACILITIES_MANAGER"
                    ? "text-orange-500/70"
                    : "text-muted-foreground"
                }`}>
                  {user.role === "ADMIN"
                    ? "Administrator"
                    : user.role === "FACILITIES_MANAGER"
                    ? "Facilities Mgr"
                    : "Employee"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-border space-y-1">
          <button
            onClick={() => setDark(!dark)}
            className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors w-full px-3 py-2 rounded-lg hover:bg-muted"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
            {!collapsed && <span>{dark ? "Light mode" : "Dark mode"}</span>}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-sm text-muted-foreground hover:text-destructive transition-colors w-full px-3 py-2 rounded-lg hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between border-b border-border bg-card px-4 h-14">
          <Link to="/" className="font-display text-lg font-bold">
            Space<span className="text-primary">Flow</span>
          </Link>
          <button onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </header>

        {/* Mobile nav */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-card border-b border-border overflow-hidden"
          >
            <SidebarNav mobile />
            <div className="px-4 pb-3 space-y-1">
              <button
                onClick={() => setDark(!dark)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground w-full"
              >
                {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                {dark ? "Light mode" : "Dark mode"}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-destructive w-full"
              >
                <LogOut className="h-5 w-5" /> Log out
              </button>
            </div>
          </motion.div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* Floating AI Chat Widget — visible to all roles */}
      <AIChatWidget />
    </div>
  );
};

export default DashboardLayout;
