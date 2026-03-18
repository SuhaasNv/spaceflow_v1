import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Plus, Edit2, UserX, Loader2, Search, Trash2, Users,
  BrainCircuit, CheckCircle2, XCircle, Clock, Zap, TrendingUp,
  Activity, DollarSign, AlertTriangle, UserCheck, BarChart2,
  ChevronRight, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/animations";
import { api } from "@/lib/api";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "FACILITIES_MANAGER" | "EMPLOYEE";
  isActive: boolean;
  createdAt: string;
  _count: { bookings: number };
}

interface AdminStats {
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

interface ProviderStats {
  calls: number;
  promptTokens: number;
  responseTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  model: string;
}

interface AiStats {
  totalCalls: number;
  callsThisWeek: number;
  callsThisMonth: number;
  successRate: number;
  totalPromptTokens: number;
  totalResponseTokens: number;
  totalTokens: number;
  weekTotalTokens: number;
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  estimatedCostUsd: number;
  configuredProvider: "gemini" | "openai" | "none";
  model: string;
  recentCalls: AiCall[];
  callsByScope: { scope: string | null; _count: { _all: number } }[];
  byProvider?: { gemini: ProviderStats; openai: ProviderStats };
}

interface AiCall {
  id: string;
  scope: string | null;
  provider: string | null;
  promptTokens: number | null;
  responseTokens: number | null;
  latencyMs: number | null;
  success: boolean;
  errorMessage: string | null;
  createdAt: string;
  user?: { name: string; email: string } | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const roleColors: Record<string, string> = {
  ADMIN: "bg-destructive/10 text-destructive border border-destructive/20",
  FACILITIES_MANAGER: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800",
  EMPLOYEE: "bg-primary/10 text-primary border border-primary/20",
};

const roleLabel: Record<string, string> = {
  ADMIN: "Admin",
  FACILITIES_MANAGER: "Facilities Mgr",
  EMPLOYEE: "Employee",
};

const scopeLabel: Record<string, string> = {
  chat: "Chat",
  "chat-booking": "Chat Booking",
  recommendation: "Recommendations",
  "smart-booking": "Smart Booking",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtDate(dt: string) {
  return new Date(dt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtTime(dt: string) {
  return new Date(dt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DeleteConfirmModal({
  user,
  onConfirm,
  onCancel,
  isPending,
}: {
  user: User;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card rounded-xl p-8 shadow-xl border border-border w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <Trash2 className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-display">Delete User</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Permanently delete <span className="font-semibold text-foreground">{user.name}</span>? This removes all their bookings and cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete permanently"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AiUsageContent({
  aiStats,
  aiProviderTab,
  setAiProviderTab,
  fmtNum,
  scopeLabel,
  fmtDate,
  fmtTime,
}: {
  aiStats: AiStats;
  aiProviderTab: "all" | "gemini" | "openai";
  setAiProviderTab: (t: "all" | "gemini" | "openai") => void;
  fmtNum: (n: number) => string;
  scopeLabel: Record<string, string>;
  fmtDate: (dt: string) => string;
  fmtTime: (dt: string) => string;
}) {
  const bp = aiStats.byProvider;
  // Legacy records (provider=null) are attributed to the configured primary
  const isGeminiPrimary = aiStats.configuredProvider === "gemini";
  const isOpenAIPrimary = aiStats.configuredProvider === "openai";
  // Filter by provider: only include records that match the selected provider (case-insensitive)
  // Orphan records (null, "", or unknown) go to the configured primary
  const p = (c: AiCall) => String(c.provider ?? "").toLowerCase();
  const isOrphan = (c: AiCall) => p(c) !== "gemini" && p(c) !== "openai";
  const geminiCalls = aiStats.recentCalls.filter(
    (c) => p(c) === "gemini" || (isGeminiPrimary && isOrphan(c))
  );
  const openaiCalls = aiStats.recentCalls.filter(
    (c) => p(c) === "openai" || (isOpenAIPrimary && isOrphan(c))
  );
  const effective =
    aiProviderTab === "gemini" && bp
      ? {
          totalCalls: bp.gemini.calls,
          totalTokens: bp.gemini.totalTokens,
          totalPromptTokens: bp.gemini.promptTokens,
          totalResponseTokens: bp.gemini.responseTokens,
          estimatedCostUsd: bp.gemini.estimatedCostUsd,
          recentCalls: geminiCalls,
        }
      : aiProviderTab === "openai" && bp
      ? {
          totalCalls: bp.openai.calls,
          totalTokens: bp.openai.totalTokens,
          totalPromptTokens: bp.openai.promptTokens,
          totalResponseTokens: bp.openai.responseTokens,
          estimatedCostUsd: bp.openai.estimatedCostUsd,
          recentCalls: openaiCalls,
        }
      : aiProviderTab === "all"
      ? {
          totalCalls: aiStats.totalCalls,
          totalTokens: aiStats.totalTokens,
          totalPromptTokens: aiStats.totalPromptTokens,
          totalResponseTokens: aiStats.totalResponseTokens,
          estimatedCostUsd: aiStats.estimatedCostUsd,
          recentCalls: aiStats.recentCalls,
        }
      : {
          totalCalls: 0,
          totalTokens: 0,
          totalPromptTokens: 0,
          totalResponseTokens: 0,
          estimatedCostUsd: 0,
          recentCalls: [],
        };

  const scopeData =
    aiProviderTab === "all"
      ? aiStats.callsByScope
      : Object.entries(
          effective.recentCalls.reduce((acc, c) => {
            const s = c.scope ?? "unknown";
            acc[s] = (acc[s] ?? 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).map(([scope, count]) => ({ scope, _count: { _all: count } }));

  return (
    <>
      {/* Provider sub-tabs */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
          {(["all", "gemini", "openai"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setAiProviderTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                aiProviderTab === tab
                  ? tab === "gemini"
                    ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                    : tab === "openai"
                    ? "bg-green-500/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800"
                    : "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "all" ? "All" : tab === "gemini" ? "Google Gemini" : "OpenAI"}
            </button>
          ))}
        </div>
        {aiStats.configuredProvider === "none" && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            Add GEMINI_API_KEY or OPENAI_API_KEY to enable AI features
          </div>
        )}
      </div>

      {/* Stats cards */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total AI Calls", value: fmtNum(effective.totalCalls), sub: aiProviderTab === "all" ? `${aiStats.callsThisWeek} this week` : `${effective.totalCalls} total`, icon: BrainCircuit, color: "text-primary", bg: "bg-primary/10" },
          { label: "Total Tokens", value: fmtNum(effective.totalTokens), sub: aiProviderTab === "all" ? `${fmtNum(aiStats.weekTotalTokens)} this week` : "All time", icon: Zap, color: "text-violet-500", bg: "bg-violet-500/10" },
          { label: "Avg Latency", value: aiStats.avgLatencyMs > 0 ? `${aiStats.avgLatencyMs}ms` : "—", sub: aiStats.maxLatencyMs > 0 ? `Max ${aiStats.maxLatencyMs}ms` : "No data yet", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Success Rate", value: `${aiStats.successRate}%`, sub: `${aiStats.totalCalls} total calls`, icon: CheckCircle2, color: aiStats.successRate >= 95 ? "text-green-500" : "text-amber-500", bg: aiStats.successRate >= 95 ? "bg-green-500/10" : "bg-amber-500/10" },
        ].map((card) => (
          <StaggerItem key={card.label}>
            <Card className="border-border hover-lift">
              <CardContent className="p-5">
                <div className={`h-9 w-9 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
                <div className={`text-2xl font-bold font-display ${card.color}`}>{card.value}</div>
                <div className="text-xs font-medium mt-0.5">{card.label}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{card.sub}</div>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Token breakdown + cost */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card className="border-border lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Token Breakdown (All Time)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Input (Prompt) Tokens", value: effective.totalPromptTokens, total: effective.totalTokens, color: "bg-primary" },
                { label: "Output (Response) Tokens", value: effective.totalResponseTokens, total: effective.totalTokens, color: "bg-violet-500" },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-medium font-mono">{fmtNum(row.value)}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${row.total > 0 ? (row.value / row.total) * 100 : 0}%` }}
                      transition={{ duration: 0.8 }}
                      className={`h-full rounded-full ${row.color}`}
                    />
                  </div>
                </div>
              ))}
              {scopeData.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Calls by type</p>
                  <div className="flex flex-wrap gap-2">
                    {scopeData.map((s) => (
                      <div key={s.scope} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-muted border border-border">
                        <span className="font-medium">{scopeLabel[s.scope ?? ""] ?? s.scope ?? "unknown"}</span>
                        <span className="text-muted-foreground">{s._count._all}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              Cost Estimate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-3xl font-bold font-display text-green-500">${effective.estimatedCostUsd.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {aiProviderTab === "all" ? "All time estimated spend" : `${aiProviderTab === "gemini" ? "Gemini" : "OpenAI"} only`}
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground space-y-1 pt-2 border-t border-border">
                <p>Based on {aiProviderTab === "all" ? "Gemini + OpenAI" : aiProviderTab === "openai" ? "GPT-4o" : "Gemini 2.5 Flash"} pricing</p>
                {aiProviderTab !== "openai" && <p>Gemini: $0.15/1M in, $0.60/1M out</p>}
                {aiProviderTab !== "gemini" && <p>OpenAI: $2.50/1M in, $10/1M out</p>}
                <p className="text-primary/70 italic">Estimate only — actual billing may vary.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent AI calls */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Recent AI Calls
          </CardTitle>
        </CardHeader>
        <CardContent>
          {effective.recentCalls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {aiProviderTab === "all" ? "No AI calls recorded yet. AI usage will appear here once users interact with the assistant." : `No ${aiProviderTab === "gemini" ? "Gemini" : "OpenAI"} calls recorded yet.`}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 pr-3 font-medium">Time</th>
                    <th className="text-left py-2 pr-3 font-medium">User</th>
                    <th className="text-left py-2 pr-3 font-medium">Provider</th>
                    <th className="text-left py-2 pr-3 font-medium">Type</th>
                    <th className="text-left py-2 pr-3 font-medium">Tokens in</th>
                    <th className="text-left py-2 pr-3 font-medium">Tokens out</th>
                    <th className="text-left py-2 pr-3 font-medium">Latency</th>
                    <th className="text-left py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {effective.recentCalls.map((call) => (
                    <tr key={call.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 pr-3 text-muted-foreground font-mono">{fmtDate(call.createdAt)} {fmtTime(call.createdAt)}</td>
                      <td className="py-2.5 pr-3 font-medium">{call.user?.name ?? <span className="text-muted-foreground italic">unknown</span>}</td>
                      <td className="py-2.5 pr-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${p(call) === "gemini" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : p(call) === "openai" ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                          {p(call) === "gemini" ? "Gemini" : p(call) === "openai" ? "OpenAI" : "—"}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{scopeLabel[call.scope ?? ""] ?? call.scope ?? "unknown"}</span>
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-muted-foreground">{call.promptTokens != null ? fmtNum(call.promptTokens) : "—"}</td>
                      <td className="py-2.5 pr-3 font-mono text-muted-foreground">{call.responseTokens != null ? fmtNum(call.responseTokens) : "—"}</td>
                      <td className="py-2.5 pr-3 font-mono text-muted-foreground">{call.latencyMs != null ? `${call.latencyMs}ms` : "—"}</td>
                      <td className="py-2.5">
                        {call.success ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <span title={call.errorMessage ?? ""}><XCircle className="h-3.5 w-3.5 text-destructive" /></span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const Admin = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "EMPLOYEE" as User["role"] });
  const [aiProviderTab, setAiProviderTab] = useState<"all" | "gemini" | "openai">("all");

  // ── Data fetching ──────────────────────────────────────────────────────
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.get<{ users: User[] }>("/api/admin/users"),
  });

  const { data: statsData } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.get<AdminStats>("/api/admin/stats"),
  });

  const { data: aiStats, isLoading: aiLoading } = useQuery({
    queryKey: ["admin-ai-stats"],
    queryFn: () => api.get<AiStats>("/api/admin/ai-stats"),
    staleTime: 30_000,
  });

  const users = usersData?.users ?? [];
  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  // ── Mutations ──────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      api.patch(`/api/admin/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setEditUser(null);
      toast.success("User updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post("/api/admin/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setShowCreate(false);
      setForm({ name: "", email: "", password: "", role: "EMPLOYEE" });
      toast.success("User created");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setDeleteTarget(null);
      toast.success("User deleted permanently");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleActive = (user: User) => {
    updateMutation.mutate({ id: user.id, data: { isActive: !user.isActive } });
  };

  // ── Stats cards ────────────────────────────────────────────────────────
  const statsCards = statsData
    ? [
        { label: "Total Users", value: statsData.totalUsers, icon: Users, color: "text-primary", bg: "bg-primary/10" },
        { label: "Active Users", value: statsData.activeUsers, icon: UserCheck, color: "text-green-500", bg: "bg-green-500/10" },
        { label: "New This Month", value: statsData.newUsersThisMonth, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "Active Spaces", value: statsData.totalSpaces, icon: BarChart2, color: "text-violet-500", bg: "bg-violet-500/10" },
        { label: "Bookings This Week", value: statsData.totalBookingsThisWeek, icon: Activity, color: "text-amber-500", bg: "bg-amber-500/10" },
        { label: "AI Calls This Week", value: statsData.aiCallsThisWeek, icon: BrainCircuit, color: "text-cyan-500", bg: "bg-cyan-500/10" },
      ]
    : [];

  return (
    <PageTransition>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground mt-1">Manage users, monitor AI usage, and oversee the platform.</p>
        </div>
        <Button className="gradient-primary text-primary-foreground" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add user
        </Button>
      </div>

      {/* Top stats */}
      {statsCards.length > 0 && (
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
          {statsCards.map((s) => (
            <StaggerItem key={s.label}>
              <Card className="border-border hover-lift">
                <CardContent className="p-4">
                  <div className={`h-8 w-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <div className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {/* Tabs */}
      <Tabs defaultValue="users">
        <TabsList className="mb-5">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" /> Users
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <BrainCircuit className="h-4 w-4" /> AI Usage
          </TabsTrigger>
        </TabsList>

        {/* ── USERS TAB ─────────────────────────────────────────────────── */}
        <TabsContent value="users">
          {/* Role breakdown */}
          {statsData && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: "Admins", value: statsData.adminCount, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" },
                { label: "Facilities Managers", value: statsData.fmCount, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800" },
                { label: "Employees", value: statsData.employeeCount, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
              ].map((r) => (
                <Card key={r.label} className={`border ${r.bg}`}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`text-2xl font-bold font-display ${r.color}`}>{r.value}</div>
                    <div className="text-sm text-muted-foreground">{r.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* User table */}
          <Card className="border-border">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-base font-display">All Users</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search users…"
                    className="pl-9 w-56"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2 pr-4 font-medium">Name</th>
                        <th className="text-left py-2 pr-4 font-medium">Email</th>
                        <th className="text-left py-2 pr-4 font-medium">Role</th>
                        <th className="text-left py-2 pr-4 font-medium">Joined</th>
                        <th className="text-left py-2 pr-4 font-medium">Bookings</th>
                        <th className="text-left py-2 pr-4 font-medium">Status</th>
                        <th className="text-left py-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-3 pr-4 font-medium">{user.name}</td>
                          <td className="py-3 pr-4 text-muted-foreground text-xs">{user.email}</td>
                          <td className="py-3 pr-4">
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${roleColors[user.role]}`}>
                              {roleLabel[user.role]}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-xs text-muted-foreground">
                            {fmtDate(user.createdAt)}
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">{user._count.bookings}</td>
                          <td className="py-3 pr-4">
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                              user.isActive
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800"
                                : "bg-muted text-muted-foreground border border-border"
                            }`}>
                              {user.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditUser(user)}
                                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
                                title="Edit role"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => toggleActive(user)}
                                className="text-muted-foreground hover:text-amber-500 transition-colors p-1 rounded hover:bg-muted"
                                title={user.isActive ? "Deactivate" : "Activate"}
                              >
                                <UserX size={13} />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(user)}
                                className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-muted"
                                title="Delete permanently"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-muted-foreground text-sm">
                            No users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── AI USAGE TAB ──────────────────────────────────────────────── */}
        <TabsContent value="ai">
          {aiLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : aiStats ? (
            <AiUsageContent
              aiStats={aiStats}
              aiProviderTab={aiProviderTab}
              setAiProviderTab={setAiProviderTab}
              fmtNum={fmtNum}
              scopeLabel={scopeLabel}
              fmtDate={fmtDate}
              fmtTime={fmtTime}
            />
          ) : (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Failed to load AI stats.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Modals ───────────────────────────────────────────────────────── */}

      {/* Create user modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-xl p-8 shadow-xl border border-border w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold font-display mb-6">Create New User</h2>
              <div className="space-y-4">
                {[
                  { label: "Full name", key: "name", placeholder: "Jane Smith" },
                  { label: "Email", key: "email", placeholder: "jane@company.com", type: "email" },
                  { label: "Password", key: "password", placeholder: "Min 8 characters", type: "password" },
                ].map((field) => (
                  <div key={field.key}>
                    <Label className="text-sm">{field.label}</Label>
                    <Input
                      type={field.type ?? "text"}
                      placeholder={field.placeholder}
                      value={form[field.key as keyof typeof form]}
                      onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                ))}
                <div>
                  <Label className="text-sm">Role</Label>
                  <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as User["role"] }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMPLOYEE">Employee</SelectItem>
                      <SelectItem value="FACILITIES_MANAGER">Facilities Manager</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
                  <Button
                    className="flex-1 gradient-primary text-primary-foreground"
                    disabled={createMutation.isPending}
                    onClick={() => createMutation.mutate(form)}
                  >
                    {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create user"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit user modal */}
      <AnimatePresence>
        {editUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4"
            onClick={() => setEditUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-xl p-8 shadow-xl border border-border w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold font-display mb-1">Edit User</h2>
              <p className="text-sm text-muted-foreground mb-6">{editUser.name} · {editUser.email}</p>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Role</Label>
                  <Select
                    value={editUser.role}
                    onValueChange={(v) => setEditUser({ ...editUser, role: v as User["role"] })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMPLOYEE">Employee</SelectItem>
                      <SelectItem value="FACILITIES_MANAGER">Facilities Manager</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setEditUser(null)}>Cancel</Button>
                  <Button
                    className="flex-1 gradient-primary text-primary-foreground"
                    disabled={updateMutation.isPending}
                    onClick={() => updateMutation.mutate({ id: editUser.id, data: { role: editUser.role } })}
                  >
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirmModal
            user={deleteTarget}
            onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
            onCancel={() => setDeleteTarget(null)}
            isPending={deleteMutation.isPending}
          />
        )}
      </AnimatePresence>
    </PageTransition>
  );
};

export default Admin;
