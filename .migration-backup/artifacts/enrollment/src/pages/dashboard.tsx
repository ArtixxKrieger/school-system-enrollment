import { useGetDashboardStats, useGetEnrolleeStats } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, ClipboardList, GraduationCap, TrendingUp, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const YEAR_LABELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const COLORS = ["#02310a", "#0a6901", "#1a8f0a", "#2aaf1a"];

function StatCard({ label, value, icon: Icon, sub, loading }: { label: string; value: number; icon: React.ElementType; sub?: string; loading?: boolean }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            {loading ? <Skeleton className="h-8 w-16 mt-1" /> : <p className="text-3xl font-bold text-gray-900 mt-0.5" data-testid={`text-stat-${label.toLowerCase().replace(/\s/g, "-")}`}>{value.toLocaleString()}</p>}
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
            <Icon className="h-5 w-5 text-green-700" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: enrolleeStats, isLoading: enrolleeLoading } = useGetEnrolleeStats();

  const isLoading = statsLoading || enrolleeLoading;

  const programData = (stats as any)?.programBreakdown?.map((p: any) => ({
    name: p.courseCode,
    students: p.count,
    fullName: p.courseName,
  })) ?? [];

  const yearData = (stats as any)?.yearLevelBreakdown?.map((y: any) => ({
    name: YEAR_LABELS[y.yearLevel - 1] ?? `Year ${y.yearLevel}`,
    count: y.count,
  })) ?? [];

  const pieData = [
    { name: "Pre-registered", value: (enrolleeStats as any)?.preRegistered ?? 0 },
    { name: "Approved", value: (enrolleeStats as any)?.approved ?? 0 },
    { name: "Enrolled", value: (enrolleeStats as any)?.enrolled ?? 0 },
    { name: "Rejected", value: (enrolleeStats as any)?.rejected ?? 0 },
  ].filter((d) => d.value > 0);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Enrollment overview and system statistics</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Students" value={(stats as any)?.totalStudents ?? 0} icon={Users} loading={isLoading} />
          <StatCard label="Active Courses" value={(stats as any)?.activeCourses ?? 0} icon={BookOpen} loading={isLoading} />
          <StatCard label="Pending Enrollees" value={(stats as any)?.pendingEnrollees ?? 0} icon={ClipboardList} sub="Awaiting review" loading={isLoading} />
          <StatCard label="Total Enrolled" value={(stats as any)?.totalEnrolled ?? 0} icon={GraduationCap} loading={isLoading} />
        </div>

        {/* Enrollment snapshot */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Enrollment Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              {enrolleeLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: "Pre-registered", value: (enrolleeStats as any)?.preRegistered ?? 0, color: "bg-yellow-400" },
                    { label: "Approved", value: (enrolleeStats as any)?.approved ?? 0, color: "bg-blue-400" },
                    { label: "Enrolled", value: (enrolleeStats as any)?.enrolled ?? 0, color: "bg-green-600" },
                    { label: "Rejected", value: (enrolleeStats as any)?.rejected ?? 0, color: "bg-red-400" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${row.color}`} />
                      <span className="text-sm text-gray-600 flex-1">{row.label}</span>
                      <span className="font-semibold text-gray-900" data-testid={`text-pipeline-${row.label.toLowerCase()}`}>{row.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Year Level Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : yearData.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={yearData} barSize={32}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0a6901" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No data available</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Program breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Program Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : programData.length > 0 ? (
              <div className="divide-y">
                {programData.map((p: any) => (
                  <div key={p.name} className="flex items-center gap-4 py-3" data-testid={`row-program-${p.name}`}>
                    <Badge variant="outline" className="font-mono text-xs shrink-0 border-green-700 text-green-800">{p.name}</Badge>
                    <span className="text-sm text-gray-700 flex-1 truncate">{p.fullName}</span>
                    <span className="text-sm font-semibold text-gray-900">{p.students} students</span>
                    <TrendingUp className="h-4 w-4 text-green-600 shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">No program data available yet</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
