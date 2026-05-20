import { useState } from "react";
import { useListStudents, useListCourses, getListStudentsQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronLeft, ChevronRight, GraduationCap } from "lucide-react";

const PAGE_SIZE = 10;

export default function EnrollmentPage() {
  const [search, setSearch] = useState("");
  const [courseId, setCourseId] = useState<number | undefined>();
  const [yearLevel, setYearLevel] = useState<number | undefined>();
  const [page, setPage] = useState(1);

  const params = { search: search || undefined, courseId, yearLevel, status: "active", page, limit: PAGE_SIZE };
  const { data, isLoading } = useListStudents(params, { query: { queryKey: getListStudentsQueryKey(params) } });
  const { data: courses } = useListCourses();

  const students = (data as any)?.data ?? [];
  const total = (data as any)?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-green-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Enrolled Students</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Currently active enrolled students — {total.toLocaleString()} total</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, ID..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" data-testid="input-search-enrolled" />
          </div>
          <Select onValueChange={(v) => { setCourseId(v === "all" ? undefined : Number(v)); setPage(1); }}>
            <SelectTrigger className="w-44" data-testid="select-enrolled-course"><SelectValue placeholder="All courses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {((courses as any[]) ?? []).map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.courseCode}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select onValueChange={(v) => { setYearLevel(v === "all" ? undefined : Number(v)); setPage(1); }}>
            <SelectTrigger className="w-36" data-testid="select-enrolled-year"><SelectValue placeholder="All years" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All years</SelectItem>
              {[1, 2, 3, 4].map((y) => <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Year Level</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Finance Status</TableHead>
                  <TableHead>Flag Group</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>
                  ))
                ) : students.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No enrolled students found</TableCell></TableRow>
                ) : (
                  students.map((s: any) => (
                    <TableRow key={s.id} data-testid={`row-enrolled-${s.id}`}>
                      <TableCell className="font-mono text-sm">{s.studentId}</TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{s.lastName}, {s.firstName} {s.middleName ? s.middleName[0] + "." : ""}</p>
                        <p className="text-xs text-muted-foreground">{s.email}</p>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="font-mono text-xs border-green-600 text-green-800">{s.courseCode ?? "N/A"}</Badge></TableCell>
                      <TableCell className="text-sm">Year {s.yearLevel}</TableCell>
                      <TableCell className="text-sm capitalize">{s.studentType}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.financeStatus === "fully_paid" ? "bg-green-50 text-green-700" : s.financeStatus === "down_payment" ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"}`}>
                          {s.financeStatus?.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm capitalize text-muted-foreground">{s.flagGroup ?? "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-muted-foreground">{((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
