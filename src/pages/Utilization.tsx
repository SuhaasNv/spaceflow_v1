import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition, ScrollReveal } from "@/components/animations";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface UtilizationItem {
  spaceId: string;
  name: string;
  type: string;
  floor: string | null;
  building: string | null;
  plannedUtilization: number;
  actualUtilization: number;
  bookedMinutes: number;
  usedMinutes: number;
}

const typeLabel: Record<string, string> = {
  MEETING_ROOM: "Meeting Room",
  DESK: "Desk",
  PHONE_BOOTH: "Phone Booth",
  COLLABORATION_AREA: "Collab Area",
  OFFICE: "Office",
};

const Utilization = () => {
  const [range, setRange] = useState("30d");

  const now = new Date();
  const days = parseInt(range);
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, isLoading } = useQuery({
    queryKey: ["utilization", range],
    queryFn: () =>
      api.get<{ utilization: UtilizationItem[] }>(`/api/analytics/utilization?from=${from}&to=${now.toISOString()}`),
  });

  const items = data?.utilization ?? [];
  const avgPlanned = items.length
    ? Math.round(items.reduce((s, i) => s + i.plannedUtilization, 0) / items.length)
    : 0;
  const avgActual = items.length
    ? Math.round(items.reduce((s, i) => s + i.actualUtilization, 0) / items.length)
    : 0;

  const chartData = items
    .slice(0, 10)
    .map((i) => ({ name: i.name.length > 16 ? i.name.slice(0, 14) + "…" : i.name, Planned: i.plannedUtilization, Actual: i.actualUtilization }));

  return (
    <PageTransition>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">Utilization</h1>
          <p className="text-muted-foreground mt-1">Planned vs actual space usage.</p>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="text-3xl font-bold font-display">{avgPlanned}%</div>
                <div className="text-sm text-muted-foreground mt-1">Avg. planned utilization</div>
                <div className="h-2 bg-muted rounded-full mt-3">
                  <div className="h-2 bg-primary rounded-full transition-all duration-700" style={{ width: `${avgPlanned}%` }} />
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="text-3xl font-bold font-display">{avgActual}%</div>
                <div className="text-sm text-muted-foreground mt-1">Avg. actual utilization</div>
                <div className="h-2 bg-muted rounded-full mt-3">
                  <div className="h-2 bg-green-500 rounded-full transition-all duration-700" style={{ width: `${avgActual}%` }} />
                </div>
                {avgPlanned > 0 && avgActual < avgPlanned * 0.7 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    ⚠ Actual usage is significantly lower than planned (ghost bookings likely)
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {chartData.length > 0 && (
            <ScrollReveal>
              <Card className="border-border mb-6">
                <CardHeader>
                  <CardTitle className="text-base font-display">Planned vs Actual by Space (Top 10)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" />
                      <YAxis tick={{ fontSize: 11 }} unit="%" />
                      <Tooltip formatter={(v: number) => `${v}%`} />
                      <Bar dataKey="Planned" fill="var(--color-primary, #6366f1)" opacity={0.6} radius={[4, 4, 0, 0]} isAnimationActive animationDuration={800} />
                      <Bar dataKey="Actual" fill="#22c55e" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={800} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </ScrollReveal>
          )}

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base font-display">Space Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2 pr-4 font-medium">Space</th>
                      <th className="text-left py-2 pr-4 font-medium">Type</th>
                      <th className="text-left py-2 pr-4 font-medium">Floor</th>
                      <th className="text-left py-2 pr-4 font-medium">Planned</th>
                      <th className="text-left py-2 font-medium">Actual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.spaceId} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 pr-4 font-medium">{item.name}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground">{typeLabel[item.type] ?? item.type}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground">{item.floor ?? "—"}</td>
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary/70 rounded-full" style={{ width: `${item.plannedUtilization}%` }} />
                            </div>
                            <span>{item.plannedUtilization}%</span>
                          </div>
                        </td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full" style={{ width: `${item.actualUtilization}%` }} />
                            </div>
                            <span>{item.actualUtilization}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {items.length === 0 && (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    No data for this period. Add spaces and make bookings to see utilization.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </PageTransition>
  );
};

export default Utilization;
