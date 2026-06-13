"use client";

import React, { useState } from "react";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, AreaChart, Area, Cell, PieChart, Pie
} from "recharts";
import { 
  TrendingUp, Users, CalendarCheck, Activity, Calendar as CalendarIcon, Download, IndianRupee
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { getAnalytics } from "@/actions/analytics";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function AnalyticsClient({ initialData }: { initialData: any }) {
  const [data, setData] = useState(initialData);
  const [range, setRange] = useState("30d");
  const [loading, setLoading] = useState(false);

  const handleRangeChange = async (newRange: string) => {
    setRange(newRange);
    setLoading(true);
    try {
      const res = await getAnalytics(newRange);
      if (res.error) throw new Error(res.error);
      if (res.data) setData(res.data);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!data?.trends) return;
    const headers = ["Date", "Total", "Confirmed", "Completed", "Cancelled"];
    const csvContent = [
      headers.join(","),
      ...data.trends.map((row: any) => 
        `"${row.date}",${row.total},${row.confirmed},${row.completed},${row.cancelled}`
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prime_health_analytics_${range}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!data || !data.insights || data.insights.totalAppointments === 0) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Detailed insights into your clinic's performance and patient booking trends.
            </p>
          </div>
          <Select 
            value={range}
            onChange={(e) => handleRangeChange(e.target.value)}
            options={[
              { label: "Last 7 Days", value: "7d" },
              { label: "Last 30 Days", value: "30d" },
              { label: "Last 90 Days", value: "90d" }
            ]}
            disabled={loading}
            className="w-full sm:w-40"
          />
        </div>
        <EmptyState 
          icon={Activity}
          title="No analytics data"
          description="There is no booking data available for the selected period. Start by booking some appointments to see insights."
          actionLabel="View Appointments"
          actionHref="/app/appointments"
          className="min-h-[400px]"
        />
      </div>
    );
  }

  const { trends, services, peakHours, insights } = data;
  const COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Detailed insights into your clinic's performance and patient booking trends.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select 
            value={range}
            onChange={(e) => handleRangeChange(e.target.value)}
            options={[
              { label: "Last 7 Days", value: "7d" },
              { label: "Last 30 Days", value: "30d" },
              { label: "Last 90 Days", value: "90d" }
            ]}
            disabled={loading}
            className="w-full sm:w-40"
          />
          <Button variant="outline" onClick={exportCSV} disabled={loading} className="shrink-0 bg-background">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Appointments</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{insights.totalAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">For selected period</p>
          </CardContent>
        </Card>
        
        <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unique Patients</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{insights.uniquePatients}</div>
            <p className="text-xs text-muted-foreground mt-1">Individual bookings</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estimated Revenue</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <IndianRupee className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{insights.estimatedRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Confirmed/Completed only</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Booking Efficiency</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{insights.widgetRatio}%</div>
            <p className="text-xs text-muted-foreground mt-1">Booked via AI Widget</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New Patients</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{insights.newRatio}%</div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-3 overflow-hidden">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: `${insights.newRatio}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Returning Patients</CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600">
              <Activity className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{insights.returningRatio}%</div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-3 overflow-hidden">
              <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${insights.returningRatio}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Trends - Area Chart */}
        <Card className="lg:col-span-2 border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Booking Trends</CardTitle>
            <CardDescription>Daily appointment volume over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorConfirmed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: 'hsl(var(--foreground))', fontSize: '13px' }}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px', fontSize: '12px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  <Area type="monotone" dataKey="confirmed" name="Confirmed" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorConfirmed)" />
                  <Area type="monotone" dataKey="completed" name="Completed" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" />
                  <Line type="monotone" dataKey="cancelled" name="Cancelled" stroke="#EF4444" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Peak Hours - Bar Chart */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Peak Hours</CardTitle>
            <CardDescription>Most popular time slots</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis dataKey="hour" type="category" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} width={60} />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
                  />
                  <Bar dataKey="count" name="Appointments" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                    {peakHours.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Booking Source</CardTitle>
            <CardDescription>Widget vs Dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Widget", value: insights.widgetRatio },
                      { name: "Dashboard", value: insights.dashboardRatio }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#2563EB" />
                    <Cell fill="#8B5CF6" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Language Distribution</CardTitle>
            <CardDescription>Patient language preference</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.languages}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {data.languages.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Performance - Bar Chart */}
      <div className="grid grid-cols-1">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Service Performance</CardTitle>
            <CardDescription>Breakdown of bookings by service</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={services} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    dy={15}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
                  />
                  <Bar dataKey="count" name="Bookings" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {services.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
