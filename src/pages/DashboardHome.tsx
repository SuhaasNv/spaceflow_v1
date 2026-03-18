import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { CalendarCheck, Users, TrendingUp, Clock } from "lucide-react";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/animations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const weeklyData = [
  { day: "Mon", utilization: 72, bookings: 34 },
  { day: "Tue", utilization: 85, bookings: 41 },
  { day: "Wed", utilization: 91, bookings: 48 },
  { day: "Thu", utilization: 78, bookings: 38 },
  { day: "Fri", utilization: 65, bookings: 29 },
  { day: "Sat", utilization: 30, bookings: 12 },
  { day: "Sun", utilization: 15, bookings: 5 },
];

const monthlyTrend = [
  { week: "W1", rate: 68 }, { week: "W2", rate: 72 }, { week: "W3", rate: 78 },
  { week: "W4", rate: 74 }, { week: "W5", rate: 81 }, { week: "W6", rate: 85 },
];

const stats = [
  { label: "Utilization Rate", value: "76%", icon: TrendingUp, change: "+4.2%" },
  { label: "Active Bookings", value: "124", icon: CalendarCheck, change: "+12" },
  { label: "Team Members", value: "48", icon: Users, change: "+3" },
  { label: "Avg. Duration", value: "2.4h", icon: Clock, change: "-0.3h" },
];

const recentBookings = [
  { space: "Meeting Room A", user: "Sarah Chen", time: "10:00 – 11:30", status: "Active" },
  { space: "Hot Desk #7", user: "Marcus Rivera", time: "09:00 – 17:00", status: "Active" },
  { space: "Conference Hall", user: "Priya Patel", time: "14:00 – 15:00", status: "Upcoming" },
  { space: "Phone Booth #2", user: "Alex Kim", time: "11:00 – 11:30", status: "Completed" },
];

const DashboardHome = () => {
  return (
    <PageTransition>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your workspace at a glance.</p>
      </div>

      {/* Stats */}
      <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <StaggerItem key={stat.label}>
            <Card className="hover-lift border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-primary">{stat.change}</span>
                </div>
                <div className="text-2xl font-bold font-display">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-display text-lg">Weekly Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                />
                <Bar dataKey="utilization" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-display text-lg">Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                />
                <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} animationDuration={1200} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg">Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 text-muted-foreground font-medium">Space</th>
                  <th className="text-left py-3 text-muted-foreground font-medium">User</th>
                  <th className="text-left py-3 text-muted-foreground font-medium">Time</th>
                  <th className="text-left py-3 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/50 transition-colors duration-150">
                    <td className="py-3 font-medium">{b.space}</td>
                    <td className="py-3 text-muted-foreground">{b.user}</td>
                    <td className="py-3 text-muted-foreground">{b.time}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        b.status === "Active" ? "bg-primary/10 text-primary" :
                        b.status === "Upcoming" ? "bg-accent/10 text-accent" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  );
};

export default DashboardHome;
