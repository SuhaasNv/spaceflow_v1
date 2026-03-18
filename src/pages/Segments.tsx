import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition, ScrollReveal } from "@/components/animations";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface SegmentsData {
  byFloor: { floor: string; count: number }[];
  byBuilding: { building: string; count: number }[];
  byType: { type: string; count: number }[];
}

const typeLabel: Record<string, string> = {
  MEETING_ROOM: "Meeting Room",
  DESK: "Desk",
  PHONE_BOOTH: "Phone Booth",
  COLLABORATION_AREA: "Collab Area",
  OFFICE: "Office",
};

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const Segments = () => {
  const [range, setRange] = useState("30");

  const now = new Date();
  const from = new Date(now.getTime() - parseInt(range) * 24 * 60 * 60 * 1000).toISOString();

  const { data, isLoading } = useQuery({
    queryKey: ["segments", range],
    queryFn: () =>
      api.get<SegmentsData>(`/api/analytics/segments?from=${from}&to=${now.toISOString()}`),
  });

  const byFloor = data?.byFloor ?? [];
  const byBuilding = data?.byBuilding ?? [];
  const byType = (data?.byType ?? []).map((t) => ({
    ...t,
    name: typeLabel[t.type] ?? t.type,
  }));

  return (
    <PageTransition>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">Segments</h1>
          <p className="text-muted-foreground mt-1">Compare bookings by floor, building, and type.</p>
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
        <div className="grid lg:grid-cols-2 gap-6">
          <ScrollReveal>
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base font-display">By Floor</CardTitle>
              </CardHeader>
              <CardContent>
                {byFloor.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">No data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={byFloor} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="floor" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" name="Bookings" fill="var(--color-primary, #6366f1)" radius={[4,4,0,0]} isAnimationActive animationDuration={800} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </ScrollReveal>

          <ScrollReveal>
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base font-display">By Building</CardTitle>
              </CardHeader>
              <CardContent>
                {byBuilding.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">No data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={byBuilding} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="building" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" name="Bookings" fill="#22c55e" radius={[4,4,0,0]} isAnimationActive animationDuration={800} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </ScrollReveal>

          <ScrollReveal>
            <Card className="border-border lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-display">By Space Type</CardTitle>
              </CardHeader>
              <CardContent>
                {byType.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">No data</p>
                ) : (
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={byType}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine
                          isAnimationActive
                          animationDuration={800}
                        >
                          {byType.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>
      )}
    </PageTransition>
  );
};

export default Segments;
