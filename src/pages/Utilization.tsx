import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition } from "@/components/animations";
import { ScrollReveal } from "@/components/animations";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const dailyData = [
  { hour: "8am", desks: 45, rooms: 60, lounges: 20 },
  { hour: "9am", desks: 72, rooms: 80, lounges: 35 },
  { hour: "10am", desks: 88, rooms: 95, lounges: 50 },
  { hour: "11am", desks: 91, rooms: 85, lounges: 60 },
  { hour: "12pm", desks: 65, rooms: 40, lounges: 90 },
  { hour: "1pm", desks: 70, rooms: 55, lounges: 85 },
  { hour: "2pm", desks: 85, rooms: 90, lounges: 45 },
  { hour: "3pm", desks: 82, rooms: 75, lounges: 40 },
  { hour: "4pm", desks: 68, rooms: 60, lounges: 30 },
  { hour: "5pm", desks: 40, rooms: 30, lounges: 15 },
];

const weeklyComparison = [
  { day: "Mon", booked: 82, used: 68 },
  { day: "Tue", booked: 90, used: 75 },
  { day: "Wed", booked: 95, used: 88 },
  { day: "Thu", booked: 85, used: 70 },
  { day: "Fri", booked: 70, used: 55 },
];

const Utilization = () => {
  const [range, setRange] = useState("week");

  return (
    <PageTransition>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">Utilization</h1>
          <p className="text-muted-foreground mt-1">How your spaces are performing.</p>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <ScrollReveal>
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="font-display text-lg">Booked vs Used</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={weeklyComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "13px" }} />
                  <Bar dataKey="booked" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} animationDuration={1000} name="Booked" />
                  <Bar dataKey="used" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} animationDuration={1200} name="Used" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="font-display text-lg">Hourly Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "13px" }} />
                  <Area type="monotone" dataKey="desks" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" animationDuration={1000} name="Desks" />
                  <Area type="monotone" dataKey="rooms" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2) / 0.15)" animationDuration={1100} name="Rooms" />
                  <Area type="monotone" dataKey="lounges" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3) / 0.15)" animationDuration={1200} name="Lounges" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </ScrollReveal>
      </div>
    </PageTransition>
  );
};

export default Utilization;
