import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, ChevronDown, Loader2, RefreshCw, Info, Zap, MessageSquareWarning, TrendingDown, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/animations";
import { api } from "@/lib/api";

interface Recommendation {
  id: string;
  title: string;
  description: string;
  confidence: number;
  confidenceLabel: "High" | "Medium" | "Low";
  category: string;
  dataSources: string[];
  explanation: string;
  impact: string;
  action: string;
}

interface RecommendationsResponse {
  recommendations: Recommendation[];
  metadata: {
    source: "ai" | "rule-based";
    generatedAt: string;
    latencyMs: number;
    params: { scope: string; timeRange: string; focus: string };
    disclaimer: string;
    responsibleAI: {
      humanInLoop: boolean;
      noAutoWrites: boolean;
      dataPrivacy: string;
      transparency: string;
    };
  };
}

const confidenceColors = {
  High: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Low: "bg-muted text-muted-foreground",
};

const RecommendationCard = ({ rec }: { rec: Recommendation }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border-border hover-lift transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Lightbulb className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm leading-tight">{rec.title}</h3>
              <span className="text-xs text-muted-foreground">{rec.category}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${confidenceColors[rec.confidenceLabel]}`}>
              {rec.confidenceLabel} ({rec.confidence}%)
            </span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{rec.description}</p>

        {/* Confidence bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Confidence</span>
            <span>{rec.confidence}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${rec.confidence}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{
                background: rec.confidence > 75 ? "#22c55e" : rec.confidence > 50 ? "#f59e0b" : "#94a3b8",
              }}
            />
          </div>
        </div>

        {/* Why this? expandable */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium w-full"
        >
          <Info className="h-4 w-4" />
          Why this?
          <ChevronDown className={`h-4 w-4 ml-auto transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-3 border-t border-border mt-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Explanation</p>
                  <p className="text-sm leading-relaxed">{rec.explanation}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Expected impact</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{rec.impact}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Suggested action</p>
                  <p className="text-sm leading-relaxed font-medium">{rec.action}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Data sources</p>
                  <div className="flex flex-wrap gap-1">
                    {rec.dataSources.map((src, i) => (
                      <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                        {src}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

interface CancelTheme {
  label: string;
  percent: number;
  description: string;
  action: string;
}

interface CancellationInsights {
  totalCancellations: number;
  withReasonsCount: number;
  reasonCoveragePercent: number;
  period: string;
  summary?: string;
  themes?: CancelTheme[];
  topConcern?: string;
  confidence?: number;
  provider?: string;
  disclaimer?: string;
}

const Recommendations = () => {
  // Dropdown state — local only, not applied until Refresh is clicked
  const [timeRange, setTimeRange] = useState("30d");
  const [focus, setFocus] = useState("utilization");

  // Applied params — only update when user clicks Refresh
  const [appliedTimeRange, setAppliedTimeRange] = useState("30d");
  const [appliedFocus, setAppliedFocus] = useState("utilization");

  const [showCancelInsights, setShowCancelInsights] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["recommendations", appliedTimeRange, appliedFocus],
    queryFn: () =>
      api.get<RecommendationsResponse>(
        `/api/recommendations?timeRange=${appliedTimeRange}&focus=${appliedFocus}`
      ),
    staleTime: Infinity, // Never auto-refetch on remount — data persists until manual Refresh
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });

  const handleRefresh = () => {
    setAppliedTimeRange(timeRange);
    setAppliedFocus(focus);
    // If params didn't change, force a refetch anyway
    if (timeRange === appliedTimeRange && focus === appliedFocus) {
      refetch();
    }
    // Otherwise the query key change will trigger the fetch automatically
  };

  const { data: cancelData, isLoading: cancelLoading, refetch: refetchCancel } = useQuery({
    queryKey: ["cancellation-insights"],
    queryFn: () => api.get<CancellationInsights>("/api/ai/cancellation-insights"),
    enabled: showCancelInsights,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
  });

  const recommendations = data?.recommendations ?? [];
  const metadata = data?.metadata;

  return (
    <PageTransition>
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight flex items-center gap-2">
              <Lightbulb className="h-7 w-7 text-primary" />
              Recommendations
            </h1>
            <p className="text-muted-foreground mt-1">AI-powered workspace insights — advisory only.</p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isFetching}
            className={`shrink-0 ${(timeRange !== appliedTimeRange || focus !== appliedFocus) ? "border-primary text-primary" : ""}`}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            {(timeRange !== appliedTimeRange || focus !== appliedFocus) ? "Apply & Refresh" : "Refresh"}
          </Button>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mt-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="14d">Last 14 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={focus} onValueChange={setFocus}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="utilization">Utilization</SelectItem>
              <SelectItem value="comfort">Comfort</SelectItem>
              <SelectItem value="cost">Cost savings</SelectItem>
              <SelectItem value="sustainability">Sustainability</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Source badge */}
      {metadata && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs bg-muted px-3 py-1.5 rounded-full">
            <Zap className="h-3 w-3 text-primary" />
            <span>
              {metadata.source === "ai" ? "Powered by AI" : "Rule-based analysis"}
            </span>
            {metadata.latencyMs && (
              <span className="text-muted-foreground">· {metadata.latencyMs}ms</span>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Analyzing your workspace data…</p>
        </div>
      ) : (
        <>
          <StaggerContainer className="grid sm:grid-cols-2 gap-4 mb-8">
            {recommendations.map((rec) => (
              <StaggerItem key={rec.id}>
                <RecommendationCard rec={rec} />
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* ── Cancellation Insights ── */}
          <div className="mb-8">
            <button
              onClick={() => { setShowCancelInsights(true); if (showCancelInsights) refetchCancel(); }}
              className="w-full flex items-center justify-between rounded-xl border border-border bg-muted/30 p-5 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquareWarning className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-display font-bold text-sm">Cancellation Reason Insights</p>
                  <p className="text-xs text-muted-foreground">AI clusters employee cancellation reasons to surface root causes</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-primary font-medium shrink-0">
                {cancelLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <><Sparkles className="h-3.5 w-3.5" /> Analyse</>
                )}
              </div>
            </button>

            <AnimatePresence>
              {showCancelInsights && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="border border-t-0 border-border rounded-b-xl p-5 space-y-5">
                    {cancelLoading ? (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        Analysing cancellation patterns…
                      </div>
                    ) : cancelData ? (
                      <>
                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            { label: "Total cancellations", value: cancelData.totalCancellations },
                            { label: "With reasons", value: cancelData.withReasonsCount },
                            { label: "Coverage", value: `${cancelData.reasonCoveragePercent}%` },
                          ].map((s) => (
                            <div key={s.label} className="text-center">
                              <div className="text-2xl font-bold font-display text-primary">{s.value}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                            </div>
                          ))}
                        </div>

                        {cancelData.summary && (
                          <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-3">
                            {cancelData.summary}
                          </p>
                        )}

                        {cancelData.topConcern && (
                          <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-0.5">Top concern</p>
                              <p className="text-sm">{cancelData.topConcern}</p>
                            </div>
                          </div>
                        )}

                        {cancelData.themes && cancelData.themes.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Themes</p>
                            {cancelData.themes.map((theme, i) => (
                              <div key={i} className="rounded-lg border border-border p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm">{theme.label}</span>
                                  <span className="text-xs font-semibold text-primary">{theme.percent}%</span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${theme.percent}%` }}
                                    transition={{ duration: 0.6, delay: i * 0.1 }}
                                    className="h-full rounded-full bg-primary"
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground">{theme.description}</p>
                                <div className="flex items-start gap-1.5 text-xs">
                                  <TrendingDown className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                                  <span className="font-medium">{theme.action}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {cancelData.provider && (
                          <p className="text-[10px] text-muted-foreground/60">
                            {cancelData.disclaimer} · via {cancelData.provider}
                            {cancelData.confidence ? ` · ${cancelData.confidence}% confidence` : ""}
                          </p>
                        )}
                      </>
                    ) : null}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Responsible AI disclaimer */}
          {metadata && (
            <div className="border border-border rounded-xl p-5 bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Responsible AI Notice
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">{metadata.disclaimer}</p>
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Human-in-loop: </span>
                  {metadata.responsibleAI.humanInLoop ? "✓ Yes — you decide" : "No"}
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">No auto-writes: </span>
                  {metadata.responsibleAI.noAutoWrites ? "✓ Advisory only" : "No"}
                </div>
                <div className="text-xs text-muted-foreground sm:col-span-2">
                  <span className="font-medium text-foreground">Privacy: </span>
                  {metadata.responsibleAI.dataPrivacy}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </PageTransition>
  );
};

export default Recommendations;
