import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition, ScrollReveal } from "@/components/animations";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface PatternsData {
  byHour: { hour: number; count: number }[];
  byDay: { day: string; count: number }[];
  byType: { type: string; count: number }[];
  peakHour: number;
  peakDay: string;
}

const typeLabel: Record<string, string> = {
  MEETING_ROOM: "Meeting Room",
  DESK: "Desk",
  PHONE_BOOTH: "Phone Booth",
  COLLABORATION_AREA: "Collab Area",
  OFFICE: "Office",
};

const Patterns = () => {
  const [range, setRange] = useState("30");

  const now = new Date();
  const from = new Date(now.getTime() - parseInt(range) * 24 * 60 * 60 * 1000).toISOString();

  const { data, isLoading } = useQuery({
    queryKey: ["patterns", range],
    queryFn: () =>
      api.get<PatternsData>(`/api/analytics/patterns?from=${from}&to=${now.toISOString()}`),
  });

  const byHour = (data?.byHour ?? []).map((h) => ({
    ...h,
    label: `${h.hour}:00`,
  }));
  const byDay = data?.byDay ?? [];
  const byType = (data?.byType ?? []).map((t) => ({
    ...t,
    name: typeLabel[t.type] ?? t.type,
  }));

  return (
    <PageTransition>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">Usage Patterns</h1>
          <p className="text-muted-foreground mt-1">When and how spaces are used.</p>
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
          {data && (
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold font-display">{data.peakDay}</div>
                  <div className="text-sm text-muted-foreground mt-1">Peak day of the week</div>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold font-display">{data.peakHour}:00</div>
                  <div className="text-sm text-muted-foreground mt-1">Peak hour of day</div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            <ScrollReveal>
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base font-display">Bookings by Hour</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={byHour} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="count" name="Bookings" fill="var(--color-primary, #6366f1)" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={800} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </ScrollReveal>

            <ScrollReveal>
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base font-display">Bookings by Day of Week</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <RadarChart data={byDay}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="day" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis tick={{ fontSize: 10 }} />
                      <Radar name="Bookings" dataKey="count" stroke="var(--color-primary, #6366f1)" fill="var(--color-primary, #6366f1)" fillOpacity={0.3} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </ScrollReveal>

            <ScrollReveal>
              <Card className="border-border lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base font-display">Bookings by Space Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={byType} layout="vertical" margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                      <Tooltip />
                      <Bar dataKey="count" name="Bookings" fill="var(--color-primary, #6366f1)" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={800} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>

          {byHour.length === 0 && (
            <Card className="border-border mt-4">
              <CardContent className="text-center py-16 text-muted-foreground">
                <p>No pattern data for this period.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </PageTransition>
  );
};

export default Patterns;
