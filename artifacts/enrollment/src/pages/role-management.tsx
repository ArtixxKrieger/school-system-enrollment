import { useState } from "react";
import { useListRoles, useCreateRole, useUpdateRole, useDeleteRole, getListRolesQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Shield } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const MODULES = [
  { slug: "students", name: "Students" },
  { slug: "enrollment", name: "Enrollment" },
  { slug: "courses", name: "Courses" },
  { slug: "curriculum", name: "Curriculum" },
  { slug: "users", name: "Users" },
  { slug: "settings", name: "Settings" },
  { slug: "reports", name: "Reports" },
];

const ACTIONS = ["view", "create", "edit", "delete", "approve"];

function PermissionsGrid({ value, onChange }: { value: { module: string; action: string }[]; onChange: (v: { module: string; action: string }[]) => void }) {
  function isChecked(module: string, action: string) {
    return value.some((p) => p.module === module && p.action === action);
  }

  function toggle(module: string, action: string) {
    if (isChecked(module, action)) {
      onChange(value.filter((p) => !(p.module === module && p.action === action)));
    } else {
      onChange([...value, { module, action }]);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left font-medium py-2 pr-4 text-muted-foreground">Module</th>
            {ACTIONS.map((a) => <th key={a} className="text-center font-medium py-2 px-2 capitalize text-muted-foreground">{a}</th>)}
          </tr>
        </thead>
        <tbody>
          {MODULES.map((m) => (
            <tr key={m.slug} className="border-t">
              <td className="py-2 pr-4 font-medium">{m.name}</td>
              {ACTIONS.map((a) => (
                <td key={a} className="text-center py-2 px-2">
                  <Checkbox
                    checked={isChecked(m.slug, a)}
                    onCheckedChange={() => toggle(m.slug, a)}
                    data-testid={`perm-${m.slug}-${a}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RoleManagementPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: roles, isLoading } = useListRoles();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<{ module: string; action: string }[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditId(null); setName(""); setDescription(""); setPermissions([]); setDialogOpen(true);
  }

  function openEdit(r: any) {
    setEditId(r.id);
    setName(r.name);
    setDescription(r.description ?? "");
    setPermissions(r.permissions?.map((p: any) => ({ module: p.module, action: p.action })) ?? []);
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const data = { name, description, permissions } as any;
      if (editId) { await updateRole.mutateAsync({ id: editId, data }); }
      else { await createRole.mutateAsync({ data }); }
      await qc.invalidateQueries({ queryKey: getListRolesQueryKey() });
      toast({ title: editId ? "Role updated" : "Role created" });
      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.error ?? "Failed", variant: "destructive" });
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteRole.mutateAsync({ id: deleteId });
      await qc.invalidateQueries({ queryKey: getListRolesQueryKey() });
      toast({ title: "Role deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.error ?? "Cannot delete this role", variant: "destructive" });
    } finally { setDeleteId(null); }
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Configure access roles and module permissions</p>
          </div>
          <Button onClick={openCreate} className="bg-green-900 hover:bg-green-800" data-testid="button-add-role">
            <Plus className="h-4 w-4 mr-2" /> Add Role
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
        ) : (
          <div className="grid gap-4">
            {((roles as any[]) ?? []).map((r: any) => (
              <Card key={r.id} data-testid={`card-role-${r.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                        <Shield className="h-4 w-4 text-green-700" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold capitalize">{r.name}</h3>
                          {r.isSystem && <Badge variant="outline" className="text-xs">System</Badge>}
                          {!r.isActive && <Badge variant="outline" className="text-xs text-red-600 border-red-200">Inactive</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{r.description ?? "No description"}</p>
                        {r.permissions?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {r.permissions.slice(0, 6).map((p: any, i: number) => (
                              <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{p.module}:{p.action}</span>
                            ))}
                            {r.permissions.length > 6 && <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">+{r.permissions.length - 6} more</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    {!r.isSystem && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(r)} data-testid={`button-edit-role-${r.id}`}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => setDeleteId(r.id)} data-testid={`button-delete-role-${r.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit Role" : "Create Role"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Role Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. registrar" data-testid="input-role-name" />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" data-testid="input-role-description" />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Permissions</Label>
              <div className="border rounded-lg p-4">
                <PermissionsGrid value={permissions} onChange={setPermissions} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-green-900 hover:bg-green-800" data-testid="button-save-role">
              {saving ? "Saving..." : editId ? "Update Role" : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? Users assigned to this role may lose access.</AlertDialogDescription>
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
