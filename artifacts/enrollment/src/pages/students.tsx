import { useState } from "react";
import { useListStudents, useListCourses, useUpdateStudent, useUpdateStudentStatus, getListStudentsQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ChevronLeft, ChevronRight, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const PAGE_SIZE = 10;

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-200",
  inactive: "bg-gray-100 text-gray-700 border-gray-200",
  graduated: "bg-blue-100 text-blue-800 border-blue-200",
  transferred: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

const FINANCE_COLORS: Record<string, string> = {
  fully_paid: "bg-green-50 text-green-700",
  down_payment: "bg-yellow-50 text-yellow-700",
  promisory: "bg-red-50 text-red-700",
};

export default function StudentsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [courseId, setCourseId] = useState<number | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [editStudent, setEditStudent] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const params = { search: search || undefined, courseId, status, page, limit: PAGE_SIZE };
  const { data, isLoading } = useListStudents(params, { query: { queryKey: getListStudentsQueryKey(params) } });
  const { data: courses } = useListCourses();
  const updateStudent = useUpdateStudent();
  const updateStatus = useUpdateStudentStatus();

  const students = (data as any)?.data ?? [];
  const total = (data as any)?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function openEdit(s: any) {
    setEditStudent(s);
    setEditForm({
      firstName: s.firstName,
      lastName: s.lastName,
      middleName: s.middleName ?? "",
      email: s.email,
      phone: s.phone ?? "",
      guardianContact: s.guardianContact ?? "",
      address: s.address ?? "",
      birthDate: s.birthDate ?? "",
      gender: s.gender ?? "",
      courseId: s.courseId,
      yearLevel: s.yearLevel,
      studentType: s.studentType,
      financeStatus: s.financeStatus,
      flagGroup: s.flagGroup ?? "",
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateStudent.mutateAsync({ id: editStudent.id, data: editForm });
      await qc.invalidateQueries({ queryKey: getListStudentsQueryKey(params) });
      toast({ title: "Student updated" });
      setEditStudent(null);
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.error ?? "Failed to update", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(s: any) {
    try {
      const newStatus = s.status === "active" ? "inactive" : "active";
      await updateStatus.mutateAsync({ id: s.id, data: { status: newStatus, isAccountActive: newStatus === "active" } });
      await qc.invalidateQueries({ queryKey: getListStudentsQueryKey(params) });
      toast({ title: `Student ${newStatus === "active" ? "activated" : "deactivated"}` });
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.error ?? "Failed", variant: "destructive" });
    }
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Master List</h1>
          <p className="text-sm text-muted-foreground mt-0.5">View and manage all enrolled students</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  data-testid="input-search-students"
                  placeholder="Search by name, ID, email..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>
              <Select onValueChange={(v) => { setCourseId(v === "all" ? undefined : Number(v)); setPage(1); }}>
                <SelectTrigger className="w-44" data-testid="select-course-filter">
                  <SelectValue placeholder="All courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All courses</SelectItem>
                  {((courses as any[]) ?? []).map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.courseCode}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select onValueChange={(v) => { setStatus(v === "all" ? undefined : v); setPage(1); }}>
                <SelectTrigger className="w-36" data-testid="select-status-filter">
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="graduated">Graduated</SelectItem>
                  <SelectItem value="transferred">Transferred</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Finance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      No students found
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((s: any) => (
                    <TableRow key={s.id} data-testid={`row-student-${s.id}`} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm">{s.studentId}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{s.lastName}, {s.firstName}</p>
                          <p className="text-xs text-muted-foreground">{s.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs border-green-600 text-green-800">{s.courseCode ?? "N/A"}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">Year {s.yearLevel}</TableCell>
                      <TableCell className="text-sm capitalize">{s.studentType}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${FINANCE_COLORS[s.financeStatus] ?? ""}`}>
                          {s.financeStatus.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs capitalize ${STATUS_COLORS[s.status] ?? ""}`} variant="outline">{s.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(s)} data-testid={`button-edit-student-${s.id}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => toggleStatus(s)} data-testid={`button-toggle-status-${s.id}`}>
                            {s.status === "active" ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4 text-gray-400" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} data-testid="button-prev-page">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">{page} / {totalPages}</span>
                  <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} data-testid="button-next-page">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editStudent} onOpenChange={(o) => !o && setEditStudent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Student — {editStudent?.studentId}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            {[
              { key: "firstName", label: "First Name" },
              { key: "lastName", label: "Last Name" },
              { key: "middleName", label: "Middle Name" },
              { key: "email", label: "Email", type: "email" },
              { key: "phone", label: "Phone" },
              { key: "guardianContact", label: "Guardian Contact" },
              { key: "birthDate", label: "Birth Date", type: "date" },
              { key: "address", label: "Address" },
            ].map(({ key, label, type }) => (
              <div key={key} className={key === "address" ? "col-span-2" : ""}>
                <Label htmlFor={`edit-${key}`}>{label}</Label>
                <Input id={`edit-${key}`} type={type ?? "text"} value={editForm[key] ?? ""} onChange={(e) => setEditForm((f: any) => ({ ...f, [key]: e.target.value }))} data-testid={`input-edit-${key}`} />
              </div>
            ))}
            <div>
              <Label>Gender</Label>
              <Select value={editForm.gender} onValueChange={(v) => setEditForm((f: any) => ({ ...f, gender: v }))}>
                <SelectTrigger data-testid="select-edit-gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Student Type</Label>
              <Select value={editForm.studentType} onValueChange={(v) => setEditForm((f: any) => ({ ...f, studentType: v }))}>
                <SelectTrigger data-testid="select-edit-student-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="irregular">Irregular</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Finance Status</Label>
              <Select value={editForm.financeStatus} onValueChange={(v) => setEditForm((f: any) => ({ ...f, financeStatus: v }))}>
                <SelectTrigger data-testid="select-edit-finance-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fully_paid">Fully Paid</SelectItem>
                  <SelectItem value="down_payment">Down Payment</SelectItem>
                  <SelectItem value="promisory">Promisory</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Flag Group</Label>
              <Select value={editForm.flagGroup} onValueChange={(v) => setEditForm((f: any) => ({ ...f, flagGroup: v }))}>
                <SelectTrigger data-testid="select-edit-flag-group"><SelectValue placeholder="Select group" /></SelectTrigger>
                <SelectContent>
                  {["faithfulness", "kindness", "peace", "love", "self_control", "joy", "greatfulness", "gentleness"].map((g) => (
                    <SelectItem key={g} value={g} className="capitalize">{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStudent(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-green-900 hover:bg-green-800" data-testid="button-save-student">
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
