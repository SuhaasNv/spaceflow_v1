import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition, ScrollReveal } from "@/components/animations";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";

interface BookingUsageData {
  summary: { total: number; cancelled: number; used: number; noShows: number; noShowRate: number };
  daily: { date: string; booked: number; used: number; noShows: number }[];
}

const BookingUsage = () => {
  const [range, setRange] = useState("30");

  const now = new Date();
  const from = new Date(now.getTime() - parseInt(range) * 24 * 60 * 60 * 1000).toISOString();

  const { data, isLoading } = useQuery({
    queryKey: ["booking-usage", range],
    queryFn: () =>
      api.get<BookingUsageData>(`/api/analytics/booking-usage?from=${from}&to=${now.toISOString()}`),
  });

  const summary = data?.summary;
  const daily = data?.daily ?? [];

  const summaryCards = summary
    ? [
        { label: "Total bookings", value: summary.total, color: "text-foreground" },
        { label: "Checked in (used)", value: summary.used, color: "text-green-600 dark:text-green-400" },
        { label: "No-shows", value: summary.noShows, color: "text-amber-600 dark:text-amber-400" },
        { label: "No-show rate", value: `${summary.noShowRate}%`, color: summary.noShowRate > 20 ? "text-destructive" : "text-foreground" },
      ]
    : [];

  return (
    <PageTransition>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">Booking Usage</h1>
          <p className="text-muted-foreground mt-1">Booked vs actually used — find ghost bookings.</p>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-36">
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
          {summary && summary.noShowRate > 20 && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 mb-6">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">High no-show rate detected</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  {summary.noShowRate}% of bookings had no check-in. Consider enabling auto-release in Admin Config.
                </p>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {summaryCards.map((s) => (
              <Card key={s.label} className="border-border">
                <CardContent className="p-5">
                  <div className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {daily.length > 0 && (
            <ScrollReveal>
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base font-display">Daily Booking vs Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={daily} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="booked" name="Booked" fill="var(--color-primary, #6366f1)" opacity={0.7} radius={[4,4,0,0]} isAnimationActive animationDuration={800} />
                      <Bar dataKey="used" name="Checked in" fill="#22c55e" radius={[4,4,0,0]} isAnimationActive animationDuration={800} />
                      <Bar dataKey="noShows" name="No-shows" fill="#f59e0b" radius={[4,4,0,0]} isAnimationActive animationDuration={800} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </ScrollReveal>
          )}

          {daily.length === 0 && (
            <Card className="border-border">
              <CardContent className="text-center py-16 text-muted-foreground">
                <p>No booking data for this period.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </PageTransition>
  );
};

export default BookingUsage;
