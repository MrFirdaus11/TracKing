"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface DashboardData {
  totalActivities: number;
  categoryBreakdown: Record<string, number>;
  dailyData: Array<{
    date: string;
    day: string;
    [key: string]: string | number;
  }>;
  period: string;
  categories: Array<{ id: string; name: string; emoji: string; color: string; }>;
}

import PushNotificationBanner from "@/components/push-banner";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?period=${period}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getCategoryConfig = (name: string) => {
    return data?.categories?.find(c => c.name === name) || { name, emoji: "🏷️", color: "#ccc" };
  };

  const pieData = data
    ? Object.entries(data.categoryBreakdown)
        .filter(([, count]) => count > 0)
        .map(([category, count]) => {
          const config = getCategoryConfig(category);
          return {
            name: config.name,
            value: count,
            color: config.color,
          };
        })
    : [];

  const totalActivities = data?.totalActivities || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Ringkasan aktivitas harianmu</p>
      </div>

      <PushNotificationBanner />

      {/* Period Tabs */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as "week" | "month")}>
        <TabsList>
          <TabsTrigger value="week" className="cursor-pointer">Minggu Ini</TabsTrigger>
          <TabsTrigger value="month" className="cursor-pointer">Bulan Ini</TabsTrigger>
        </TabsList>

        <TabsContent value={period} className="mt-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {/* Total Card */}
            <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-primary/10 shadow-sm">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm text-muted-foreground font-medium">Total Aktivitas</p>
                    <p className="text-2xl lg:text-3xl font-bold mt-1">
                      {loading ? "—" : totalActivities}
                    </p>
                  </div>
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                    <span className="text-lg lg:text-xl">📊</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category Cards */}
            {data?.categories?.map((cat) => (
              <Card key={cat.name} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs lg:text-sm text-muted-foreground font-medium">{cat.name}</p>
                      <p className="text-2xl lg:text-3xl font-bold mt-1">
                        {loading ? "—" : (data?.categoryBreakdown[cat.name] || 0)}
                      </p>
                    </div>
                    <div
                      className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${cat.color}15` }}
                    >
                      <span className="text-lg lg:text-xl">{cat.emoji}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Bar Chart */}
            <Card className="lg:col-span-2 border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Aktivitas Harian</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : data?.dailyData && data.dailyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "13px",
                        }}
                      />
                      {data?.categories?.map((cat) => (
                        <Bar
                          key={cat.name}
                          dataKey={cat.name}
                          name={cat.name}
                          fill={cat.color}
                          radius={[4, 4, 0, 0]}
                          stackId="stack"
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <span className="text-4xl block mb-3">📭</span>
                      <p className="text-sm">Belum ada aktivitas tercatat periode ini.</p>
                      <p className="text-xs mt-1">Kirim pesan ke WhatsApp Bot untuk mulai mencatat!</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Distribusi Kategori</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                        animationDuration={800}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "13px",
                        }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <span className="text-4xl block mb-3">🎯</span>
                      <p className="text-sm">Belum ada data.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick guide */}
          <Card className="border-border/50 bg-gradient-to-r from-primary/5 via-transparent to-chart-2/5 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="text-lg">💬</span> Cara Mencatat via WhatsApp
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {data?.categories?.map((cat) => (
                  <div key={cat.name} className="flex items-start gap-3 p-3 rounded-lg bg-card/50 border border-border/30">
                    <span className="text-xl">{cat.emoji}</span>
                    <div>
                      <Badge variant="secondary" className="mb-1.5 text-xs">#{cat.name.toLowerCase().replace(/\s+/g, '')}</Badge>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Contoh: &quot;Gym 1 jam #{cat.name}&quot;
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
