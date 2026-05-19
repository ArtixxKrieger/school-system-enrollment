import { useState } from "react";
import { useListCurriculum, useListCourses, useCreateCurriculumSubject, useUpdateCurriculumSubject, useDeleteCurriculumSubject, getListCurriculumQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const EMPTY_FORM = { courseId: 0, subjectCode: "", subjectName: "", yearLevel: 1, semester: 1, units: 3, description: "", prerequisites: "" };

export default function CurriculumPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [filterCourseId, setFilterCourseId] = useState<string | undefined>();
  const [filterYear, setFilterYear] = useState<string | undefined>();
  const [filterSem, setFilterSem] = useState<string | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const params = { course_id: filterCourseId, year_level: filterYear, semester: filterSem };
  const { data: subjects, isLoading } = useListCurriculum(params, { query: { queryKey: getListCurriculumQueryKey(params) } });
  const { data: courses } = useListCourses();
  const create = useCreateCurriculumSubject();
  const update = useUpdateCurriculumSubject();
  const del = useDeleteCurriculumSubject();

  function openCreate() {
    setEditId(null);
    setForm({ ...EMPTY_FORM, courseId: filterCourseId ? Number(filterCourseId) : 0 });
    setDialogOpen(true);
  }

  function openEdit(s: any) {
    setEditId(s.id);
    setForm({ courseId: s.courseId, subjectCode: s.subjectCode, subjectName: s.subjectName, yearLevel: s.yearLevel, semester: s.semester, units: s.units, description: s.description ?? "", prerequisites: s.prerequisites ?? "" });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.courseId || !form.subjectCode || !form.subjectName) {
      toast({ title: "Validation error", description: "Please fill in required fields", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await update.mutateAsync({ id: editId, data: form });
      } else {
        await create.mutateAsync({ data: form });
      }
      await qc.invalidateQueries({ queryKey: getListCurriculumQueryKey(params) });
      toast({ title: editId ? "Subject updated" : "Subject added" });
      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.error ?? "Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await del.mutateAsync({ id: deleteId });
      await qc.invalidateQueries({ queryKey: getListCurriculumQueryKey(params) });
      toast({ title: "Subject deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.error ?? "Failed", variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  }

  const courseList = (courses as any[]) ?? [];

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Curriculum</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage subjects and academic curriculum</p>
          </div>
          <Button onClick={openCreate} className="bg-green-900 hover:bg-green-800" data-testid="button-add-subject">
            <Plus className="h-4 w-4 mr-2" /> Add Subject
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <Select onValueChange={(v) => setFilterCourseId(v === "all" ? undefined : v)}>
            <SelectTrigger className="w-44" data-testid="select-filter-course"><SelectValue placeholder="All courses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {courseList.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.courseCode}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select onValueChange={(v) => setFilterYear(v === "all" ? undefined : v)}>
            <SelectTrigger className="w-32" data-testid="select-filter-year"><SelectValue placeholder="All years" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All years</SelectItem>
              {[1, 2, 3, 4].map((y) => <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select onValueChange={(v) => setFilterSem(v === "all" ? undefined : v)}>
            <SelectTrigger className="w-36" data-testid="select-filter-semester"><SelectValue placeholder="All semesters" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All semesters</SelectItem>
              <SelectItem value="1">1st Semester</SelectItem>
              <SelectItem value="2">2nd Semester</SelectItem>
              <SelectItem value="3">Summer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Subject Name</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Sem</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Prerequisites</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>
                  ))
                ) : ((subjects as any[]) ?? []).length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No subjects found. Select a course or add subjects.</TableCell></TableRow>
                ) : (
                  ((subjects as any[]) ?? []).map((s: any) => (
                    <TableRow key={s.id} data-testid={`row-subject-${s.id}`}>
                      <TableCell><Badge variant="outline" className="font-mono text-xs">{s.subjectCode}</Badge></TableCell>
                      <TableCell className="font-medium text-sm">{s.subjectName}</TableCell>
                      <TableCell className="text-sm"><span className="text-green-700 font-medium">{s.courseCode ?? "—"}</span></TableCell>
                      <TableCell className="text-sm">Year {s.yearLevel}</TableCell>
                      <TableCell className="text-sm">{s.semester === 1 ? "1st" : s.semester === 2 ? "2nd" : "Summer"}</TableCell>
                      <TableCell className="text-sm font-medium">{s.units}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.prerequisites ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(s)} data-testid={`button-edit-subject-${s.id}`}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => setDeleteId(s.id)} data-testid={`button-delete-subject-${s.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Edit Subject" : "Add Subject"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label>Course</Label>
              <Select value={form.courseId ? String(form.courseId) : ""} onValueChange={(v) => setForm((f) => ({ ...f, courseId: Number(v) }))}>
                <SelectTrigger data-testid="select-subject-course"><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>{courseList.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.courseCode} — {c.courseName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject Code</Label>
              <Input value={form.subjectCode} onChange={(e) => setForm((f) => ({ ...f, subjectCode: e.target.value }))} placeholder="e.g. IT101" data-testid="input-subject-code" />
            </div>
            <div className="col-span-2">
              <Label>Subject Name</Label>
              <Input value={form.subjectName} onChange={(e) => setForm((f) => ({ ...f, subjectName: e.target.value }))} placeholder="Full subject name" data-testid="input-subject-name" />
            </div>
            <div>
              <Label>Year Level</Label>
              <Select value={String(form.yearLevel)} onValueChange={(v) => setForm((f) => ({ ...f, yearLevel: Number(v) }))}>
                <SelectTrigger data-testid="select-subject-year"><SelectValue /></SelectTrigger>
                <SelectContent>{[1, 2, 3, 4].map((y) => <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Semester</Label>
              <Select value={String(form.semester)} onValueChange={(v) => setForm((f) => ({ ...f, semester: Number(v) }))}>
                <SelectTrigger data-testid="select-subject-semester"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st Semester</SelectItem>
                  <SelectItem value="2">2nd Semester</SelectItem>
                  <SelectItem value="3">Summer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Units</Label>
              <Input type="number" min={1} max={10} value={form.units} onChange={(e) => setForm((f) => ({ ...f, units: Number(e.target.value) }))} data-testid="input-subject-units" />
            </div>
            <div>
              <Label>Prerequisites</Label>
              <Input value={form.prerequisites} onChange={(e) => setForm((f) => ({ ...f, prerequisites: e.target.value }))} placeholder="e.g. IT101" data-testid="input-subject-prerequisites" />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional description" data-testid="input-subject-description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-green-900 hover:bg-green-800" data-testid="button-save-subject">
              {saving ? "Saving..." : editId ? "Update" : "Add Subject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subject</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
