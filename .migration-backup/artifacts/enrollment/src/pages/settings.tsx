import { useState, useEffect } from "react";
import {
  useGetSettings, useUpdateSettings, getGetSettingsQueryKey,
  useListUsers, useCreateUser, useUpdateUser, getListUsersQueryKey,
  useListActivityLogs, getListActivityLogsQueryKey,
  useListRoles,
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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
      toast({ title: "Error", description: err?.data?.error ?? "Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>;

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Enrollment Settings</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-1.5">
          <Label>Auto-close Accounts</Label>
          <Select value={form.autoCloseAccounts} onValueChange={(v) => setForm((f) => ({ ...f, autoCloseAccounts: v }))}>
            <SelectTrigger className="w-64" data-testid="select-auto-close"><SelectValue /></SelectTrigger>
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
            <p className="text-xs text-muted-foreground">Only allow enrollment during defined periods</p>
          </div>
          <Switch checked={form.strictEnrollmentWindows} onCheckedChange={(v) => setForm((f) => ({ ...f, strictEnrollmentWindows: v }))} data-testid="switch-strict-windows" />
        </div>
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div>
            <p className="text-sm font-medium">Auto Year-level Progression</p>
            <p className="text-xs text-muted-foreground">Automatically advance student year level at start of academic year</p>
          </div>
          <Switch checked={form.autoProgression} onCheckedChange={(v) => setForm((f) => ({ ...f, autoProgression: v }))} data-testid="switch-auto-progression" />
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-green-900 hover:bg-green-800" data-testid="button-save-settings">
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}

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
      toast({ title: "Error", description: err?.data?.error ?? "Failed", variant: "destructive" });
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} className="bg-green-900 hover:bg-green-800" data-testid="button-add-user"><Plus className="h-4 w-4 mr-2" /> Add User</Button>
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
                  <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                    <TableCell className="font-medium text-sm">{u.fullName}</TableCell>
                    <TableCell className="text-sm font-mono">{u.username}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize text-xs">{u.role}</Badge></TableCell>
                    <TableCell><Badge variant={u.isActive ? "default" : "outline"} className={u.isActive ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-100" : ""}>{u.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.lastLogin ? format(new Date(u.lastLogin), "MMM d, yyyy") : "—"}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => openEdit(u)} data-testid={`button-edit-user-${u.id}`}><Pencil className="h-3.5 w-3.5" /></Button></TableCell>
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
                <Input type={type ?? "text"} value={form[key] ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, [key]: e.target.value }))} data-testid={`input-user-${key}`} />
              </div>
            ))}
            <div>
              <Label>Password {editId && <span className="text-muted-foreground text-xs">(leave blank to keep)</span>}</Label>
              <Input type="password" value={form.password ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, password: e.target.value }))} data-testid="input-user-password" />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f: any) => ({ ...f, role: v }))}>
                <SelectTrigger data-testid="select-user-role"><SelectValue /></SelectTrigger>
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
            <Button onClick={handleSave} disabled={saving} className="bg-green-900 hover:bg-green-800" data-testid="button-save-user">{saving ? "Saving..." : editId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
                <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
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

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">System configuration, user management, and activity logs</p>
        </div>
        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general" data-testid="tab-settings-general">General</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-settings-users">User Management</TabsTrigger>
            <TabsTrigger value="logs" data-testid="tab-settings-logs">Activity Logs</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="mt-4"><SettingsTab /></TabsContent>
          <TabsContent value="users" className="mt-4"><UsersTab /></TabsContent>
          <TabsContent value="logs" className="mt-4"><ActivityLogsTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
