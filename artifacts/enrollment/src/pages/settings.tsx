import { useState, useEffect } from "react";
import {
  useGetSettings, useUpdateSettings, getGetSettingsQueryKey,
  useListUsers, useCreateUser, useUpdateUser, getListUsersQueryKey,
  useListActivityLogs, getListActivityLogsQueryKey,
  useListRoles,
  useGetProfile, useUpdateProfile,
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, ChevronLeft, ChevronRight, GraduationCap, AlertTriangle, ArchiveRestore, Archive, User, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Simple fetch wrapper for endpoints not in the generated client
async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`/api${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "Request failed");
  return data;
}

// ─── General Settings Tab ────────────────────────────────────────────────────

function SettingsTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: settings, isLoading } = useGetSettings();
  const update = useUpdateSettings();
  const [form, setForm] = useState({ autoCloseAccounts: "never", strictEnrollmentWindows: false, autoProgression: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        autoCloseAccounts: (settings as any).autoCloseAccounts ?? "never",
        strictEnrollmentWindows: (settings as any).strictEnrollmentWindows ?? false,
        autoProgression: (settings as any).autoProgression ?? true,
      });
    }
  }, [settings]);

  async function handleSave() {
    setSaving(true);
    try {
      await update.mutateAsync({ data: form });
      await qc.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
      toast({ title: "Settings saved" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Failed", variant: "destructive" });
    } finally { setSaving(false); }
  }

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>;

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Enrollment Settings</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-1.5">
          <Label>Auto-close Accounts</Label>
          <Select value={form.autoCloseAccounts} onValueChange={(v) => setForm((f) => ({ ...f, autoCloseAccounts: v }))}>
            <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="never">Never</SelectItem>
              <SelectItem value="end_of_semester">End of semester</SelectItem>
              <SelectItem value="end_of_year">End of academic year</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Automatically deactivate student accounts at the specified period</p>
        </div>
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div>
            <p className="text-sm font-medium">Strict Enrollment Windows</p>
            <p className="text-xs text-muted-foreground">Only allow enrollment during defined date periods per course</p>
          </div>
          <Switch checked={form.strictEnrollmentWindows} onCheckedChange={(v) => setForm((f) => ({ ...f, strictEnrollmentWindows: v }))} />
        </div>
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div>
            <p className="text-sm font-medium">Auto Year-level Progression</p>
            <p className="text-xs text-muted-foreground">Automatically advance student year level at the start of a new academic year</p>
          </div>
          <Switch checked={form.autoProgression} onCheckedChange={(v) => setForm((f) => ({ ...f, autoProgression: v }))} />
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-green-900 hover:bg-green-800">
          {saving ? "Saving…" : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Progression Control Tab ──────────────────────────────────────────────────

function ProgressionTab() {
  const { toast } = useToast();
  const [preview, setPreview] = useState<{ sem1Eligible: number; sem2Eligible: number; graduatingCount: number } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [confirm, setConfirm] = useState<{ semester: 1 | 2 } | null>(null);
  const [running, setRunning] = useState(false);
  const [academicYear, setAcademicYear] = useState("");

  async function loadPreview() {
    setLoadingPreview(true);
    try {
      const data = await apiFetch("/settings/progression-preview");
      setPreview(data);
    } catch (err: any) {
      toast({ title: "Error loading preview", description: err.message, variant: "destructive" });
    } finally { setLoadingPreview(false); }
  }

  useEffect(() => { loadPreview(); }, []);

  async function runProgression(semester: 1 | 2) {
    setRunning(true);
    try {
      const data = await apiFetch("/settings/end-semester", {
        method: "POST",
        body: JSON.stringify({ semester, ...(academicYear ? { academicYear } : {}) }),
      });
      toast({ title: `Semester ${semester} ended`, description: data.message });
      setConfirm(null);
      loadPreview();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setRunning(false); }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Semester Progression</CardTitle>
          <CardDescription>
            End a semester to advance students. Pre-registration closes automatically — late enrollees
            must be manually created by an admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preview stats */}
          <div className="grid grid-cols-3 gap-4">
            {loadingPreview ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />) : (
              <>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold text-green-800">{preview?.sem1Eligible ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Active in 1st Semester</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold text-blue-800">{preview?.sem2Eligible ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Active in 2nd Semester</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold text-amber-700">{preview?.graduatingCount ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Will Graduate (4th Yr)</p>
                </div>
              </>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={loadPreview} disabled={loadingPreview} className="text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh counts
          </Button>

          {/* Academic year (optional, for sem 2 progression) */}
          <div className="space-y-1.5">
            <Label>Next Academic Year <span className="text-muted-foreground text-xs">(optional, e.g. 2026-2027)</span></Label>
            <Input
              className="w-48"
              placeholder="2026-2027"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Applied when advancing year level at end of 2nd semester</p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 pt-2 border-t">
            <Button
              variant="outline"
              className="border-blue-200 text-blue-800 hover:bg-blue-50"
              onClick={() => setConfirm({ semester: 1 })}
              disabled={(preview?.sem1Eligible ?? 0) === 0}
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              End 1st Semester
              {preview?.sem1Eligible ? <Badge variant="secondary" className="ml-2">{preview.sem1Eligible}</Badge> : null}
            </Button>
            <Button
              variant="outline"
              className="border-amber-200 text-amber-800 hover:bg-amber-50"
              onClick={() => setConfirm({ semester: 2 })}
              disabled={(preview?.sem2Eligible ?? 0) === 0}
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              End 2nd Semester
              {preview?.sem2Eligible ? <Badge variant="secondary" className="ml-2">{preview.sem2Eligible}</Badge> : null}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            <AlertTriangle className="inline h-3 w-3 mr-1 text-amber-500" />
            This action is irreversible. Students will be moved to re-enrollment queue.
          </p>
        </CardContent>
      </Card>

      {/* Confirm dialog */}
      <AlertDialog open={!!confirm} onOpenChange={(v) => !v && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Semester {confirm?.semester}?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.semester === 1
                ? `${preview?.sem1Eligible ?? 0} active students will be moved to 2nd semester and their pre-registration queue closed.`
                : `${preview?.sem2Eligible ?? 0} active students will be processed. ${preview?.graduatingCount ?? 0} 4th-year student(s) will be marked as graduated.`}
              {" "}This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-900 hover:bg-green-800"
              onClick={() => confirm && runProgression(confirm.semester)}
              disabled={running}
            >
              {running ? "Processing…" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Records Management Tab ───────────────────────────────────────────────────

type RecordStudent = {
  id: number; studentId: string; firstName: string; lastName: string; middleName?: string | null;
  email: string; status: string; yearLevel: number; courseCode?: string | null; courseName?: string | null;
  archivedAt?: string | null; archiveReason?: string | null; graduatedAt?: string | null;
};

function RecordsTab() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState<RecordStudent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [archiveDialog, setArchiveDialog] = useState<RecordStudent | null>(null);
  const [archiveReason, setArchiveReason] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const PAGE_SIZE = 15;

  async function fetchRecords() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const data = await apiFetch(`/records?${params}`);
      setRecords(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchRecords(); }, [statusFilter, page, search]);

  async function doArchive() {
    if (!archiveDialog) return;
    setActionLoading(archiveDialog.id);
    try {
      await apiFetch(`/records/${archiveDialog.id}/archive`, {
        method: "POST",
        body: JSON.stringify({ reason: archiveReason || undefined }),
      });
      toast({ title: "Student archived" });
      setArchiveDialog(null);
      setArchiveReason("");
      fetchRecords();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setActionLoading(null); }
  }

  async function doRestore(student: RecordStudent) {
    setActionLoading(student.id);
    try {
      await apiFetch(`/records/${student.id}/restore`, { method: "POST" });
      toast({ title: "Student restored", description: `${student.firstName} ${student.lastName} is now active again` });
      fetchRecords();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setActionLoading(null); }
  }

  const statusColor: Record<string, string> = {
    dropped: "bg-red-100 text-red-800 border-red-200",
    inactive: "bg-gray-100 text-gray-700 border-gray-200",
    graduated: "bg-purple-100 text-purple-800 border-purple-200",
    active: "bg-green-100 text-green-800 border-green-200",
  };
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Student Records Archive</CardTitle>
          <CardDescription>
            Manage dropped, inactive, and graduated students. Archived records can be restored if a student returns.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="Search by name or ID…"
              className="w-56"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="dropped">Dropped</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="graduated">Graduated</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Archive Reason</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>
                )) : records.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No records found</TableCell></TableRow>
                ) : records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="font-medium text-sm">{r.lastName}, {r.firstName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{r.studentId}</p>
                    </TableCell>
                    <TableCell className="text-sm">{r.courseCode ?? "—"}</TableCell>
                    <TableCell className="text-sm">{r.yearLevel}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline" className={`text-xs ${statusColor[r.status] ?? ""}`}>{r.status}</Badge>
                        {r.archivedAt && <p className="text-[10px] text-muted-foreground">Archived {format(new Date(r.archivedAt), "MMM d, yyyy")}</p>}
                        {r.graduatedAt && <p className="text-[10px] text-muted-foreground">Graduated {format(new Date(r.graduatedAt), "MMM d, yyyy")}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{r.archiveReason ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {!r.archivedAt && r.status !== "graduated" && (
                          <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-red-700 hover:bg-red-50"
                            onClick={() => { setArchiveDialog(r); setArchiveReason(""); }}
                            disabled={actionLoading === r.id}
                          >
                            <Archive className="h-3.5 w-3.5 mr-1" /> Archive
                          </Button>
                        )}
                        {(r.archivedAt || r.status === "dropped" || r.status === "inactive") && (
                          <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-green-800 hover:bg-green-50"
                            onClick={() => doRestore(r)}
                            disabled={actionLoading === r.id}
                          >
                            <ArchiveRestore className="h-3.5 w-3.5 mr-1" />
                            {actionLoading === r.id ? "…" : "Restore"}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{total} records · Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Archive reason dialog */}
      <Dialog open={!!archiveDialog} onOpenChange={(v) => !v && setArchiveDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Archive Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Archiving <strong>{archiveDialog?.firstName} {archiveDialog?.lastName}</strong> ({archiveDialog?.studentId}).
              They can be restored later if they return.
            </p>
            <div>
              <Label>Reason <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                placeholder="e.g. Student dropped out"
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveDialog(null)}>Cancel</Button>
            <Button onClick={doArchive} disabled={actionLoading !== null} className="bg-red-700 hover:bg-red-600 text-white">
              {actionLoading !== null ? "Archiving…" : "Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Profile Management Tab ───────────────────────────────────────────────────

function ProfileTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: profile, isLoading } = useGetProfile();
  const updateProfile = useUpdateProfile();
  const [form, setForm] = useState({ fullName: "", phone: "", address: "", birthDate: "", gender: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      const p = profile as any;
      setForm({
        fullName: p.fullName ?? "",
        phone: p.phone ?? "",
        address: p.address ?? "",
        birthDate: p.birthDate ?? "",
        gender: p.gender ?? "",
      });
    }
  }, [profile]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile.mutateAsync({ data: form });
      toast({ title: "Profile updated" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Failed", variant: "destructive" });
    } finally { setSaving(false); }
  }

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>;

  const p = profile as any;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">My Profile</CardTitle>
          <CardDescription>
            Personal information synced across the system. Superadmins can view this from the user list.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Account info (read-only) */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-900 text-white text-lg font-bold shrink-0">
              {p?.fullName?.[0]?.toUpperCase() ?? <User className="h-5 w-5" />}
            </div>
            <div>
              <p className="font-semibold">{p?.fullName}</p>
              <p className="text-sm text-muted-foreground">{p?.username} · <span className="capitalize">{p?.role}</span></p>
              <p className="text-sm text-muted-foreground">{p?.email}</p>
            </div>
          </div>

          {/* Editable fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Full Name</Label>
              <Input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="e.g. 09123456789" />
            </div>
            <div>
              <Label>Birth Date</Label>
              <Input type="date" value={form.birthDate} onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))} />
            </div>
            <div>
              <Label>Gender</Label>
              <Select value={form.gender || "not_specified"} onValueChange={(v) => setForm((f) => ({ ...f, gender: v === "not_specified" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_specified">Prefer not to say</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Complete address" />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="mt-6 bg-green-900 hover:bg-green-800">
            {saving ? "Saving…" : "Save Profile"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

const EMPTY_USER_FORM = { username: "", email: "", fullName: "", phone: "", role: "staff", isActive: true, password: "" };

function UsersTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: users, isLoading } = useListUsers();
  const { data: roles } = useListRoles();
  const create = useCreateUser();
  const update = useUpdateUser();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(EMPTY_USER_FORM);
  const [saving, setSaving] = useState(false);

  function openCreate() { setEditId(null); setForm(EMPTY_USER_FORM); setDialogOpen(true); }
  function openEdit(u: any) {
    setEditId(u.id);
    setForm({ username: u.username, email: u.email, fullName: u.fullName, phone: u.phone ?? "", role: u.role, isActive: u.isActive, password: "" });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const data = { ...form };
      if (!data.password) delete data.password;
      if (editId) { await update.mutateAsync({ id: editId, data }); }
      else { await create.mutateAsync({ data }); }
      await qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
      toast({ title: editId ? "User updated" : "User created" });
      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Failed", variant: "destructive" });
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} className="bg-green-900 hover:bg-green-800"><Plus className="h-4 w-4 mr-2" /> Add User</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? Array.from({ length: 4 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>) :
                ((users as any[]) ?? []).map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-sm">{u.fullName}</TableCell>
                    <TableCell className="text-sm font-mono">{u.username}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize text-xs">{u.role}</Badge></TableCell>
                    <TableCell><Badge variant={u.isActive ? "default" : "outline"} className={u.isActive ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-100" : ""}>{u.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.lastLogin ? format(new Date(u.lastLogin), "MMM d, yyyy") : "—"}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => openEdit(u)}><Pencil className="h-3.5 w-3.5" /></Button></TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? "Edit User" : "Add User"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {[{ key: "fullName", label: "Full Name" }, { key: "username", label: "Username" }, { key: "email", label: "Email", type: "email" }, { key: "phone", label: "Phone" }].map(({ key, label, type }) => (
              <div key={key}>
                <Label>{label}</Label>
                <Input type={type ?? "text"} value={form[key] ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div>
              <Label>Password {editId && <span className="text-muted-foreground text-xs">(leave blank to keep)</span>}</Label>
              <Input type="password" value={form.password ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, password: e.target.value }))} />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f: any) => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["superadmin", "admin", "staff", "professor", "student"].map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f: any) => ({ ...f, isActive: v }))} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-green-900 hover:bg-green-800">{saving ? "Saving…" : editId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Activity Logs Tab ────────────────────────────────────────────────────────

function ActivityLogsTab() {
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const params = { page, limit: PAGE_SIZE };
  const { data, isLoading } = useListActivityLogs(params, { query: { queryKey: getListActivityLogsQueryKey(params) } });
  const logs = (data as any)?.data ?? [];
  const total = (data as any)?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>) :
              logs.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No activity logs yet</TableCell></TableRow> :
              logs.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell><Badge variant="outline" className="text-xs font-mono">{log.action}</Badge></TableCell>
                  <TableCell className="text-sm">{log.description ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{log.userFullName ?? log.username ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{log.entityType ?? "—"} {log.entityId ? `#${log.entityId}` : ""}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{log.createdAt ? format(new Date(log.createdAt), "MMM d, yyyy HH:mm") : "—"}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">System configuration, progression, records, and user management</p>
        </div>
        <Tabs defaultValue="general">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="progression">Progression</TabsTrigger>
            <TabsTrigger value="records">Records</TabsTrigger>
            <TabsTrigger value="profile">My Profile</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="mt-4"><SettingsTab /></TabsContent>
          <TabsContent value="progression" className="mt-4"><ProgressionTab /></TabsContent>
          <TabsContent value="records" className="mt-4"><RecordsTab /></TabsContent>
          <TabsContent value="profile" className="mt-4"><ProfileTab /></TabsContent>
          <TabsContent value="users" className="mt-4"><UsersTab /></TabsContent>
          <TabsContent value="logs" className="mt-4"><ActivityLogsTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
