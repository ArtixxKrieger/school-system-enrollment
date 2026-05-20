import { useState } from "react";
import { useListCourses, useCreateCourse, useUpdateCourse, useDeleteCourse, getListCoursesQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const EMPTY_FORM = { courseCode: "", courseName: "", description: "", isActive: true, displayOrder: 0 };

export default function CoursesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: courses, isLoading } = useListCourses();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(c: any) {
    setEditId(c.id);
    setForm({ courseCode: c.courseCode, courseName: c.courseName, description: c.description ?? "", isActive: c.isActive, displayOrder: c.displayOrder ?? 0 });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editId) {
        await updateCourse.mutateAsync({ id: editId, data: form });
      } else {
        await createCourse.mutateAsync({ data: form });
      }
      await qc.invalidateQueries({ queryKey: getListCoursesQueryKey() });
      toast({ title: editId ? "Course updated" : "Course created" });
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
      await deleteCourse.mutateAsync({ id: deleteId });
      await qc.invalidateQueries({ queryKey: getListCoursesQueryKey() });
      toast({ title: "Course deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.error ?? "Failed to delete", variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage academic programs and courses</p>
          </div>
          <Button onClick={openCreate} className="bg-green-900 hover:bg-green-800" data-testid="button-add-course">
            <Plus className="h-4 w-4 mr-2" /> Add Course
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>
                  ))
                ) : ((courses as any[]) ?? []).length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No courses found</TableCell></TableRow>
                ) : (
                  ((courses as any[]) ?? []).map((c: any) => (
                    <TableRow key={c.id} data-testid={`row-course-${c.id}`}>
                      <TableCell><Badge variant="outline" className="font-mono border-green-600 text-green-800">{c.courseCode}</Badge></TableCell>
                      <TableCell className="font-medium text-sm">{c.courseName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{c.description ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{c.studentCount ?? 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.isActive ? "default" : "outline"} className={c.isActive ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-100" : ""}>
                          {c.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(c)} data-testid={`button-edit-course-${c.id}`}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)} className="text-red-500 hover:text-red-700" data-testid={`button-delete-course-${c.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
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
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? "Edit Course" : "Add Course"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Course Code</Label>
              <Input value={form.courseCode} onChange={(e) => setForm((f) => ({ ...f, courseCode: e.target.value }))} placeholder="e.g. BSIT" data-testid="input-course-code" />
            </div>
            <div>
              <Label>Course Name</Label>
              <Input value={form.courseName} onChange={(e) => setForm((f) => ({ ...f, courseName: e.target.value }))} placeholder="Full course name" data-testid="input-course-name" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional description" data-testid="input-course-description" />
            </div>
            <div>
              <Label>Display Order</Label>
              <Input type="number" value={form.displayOrder} onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))} data-testid="input-course-order" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} data-testid="switch-course-active" />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-green-900 hover:bg-green-800" data-testid="button-save-course">
              {saving ? "Saving..." : editId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this course? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" data-testid="button-confirm-delete-course">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
