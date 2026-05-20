import { useState } from "react";
import { useListEnrollees, useApproveEnrollee, useRejectEnrollee, useBulkApproveEnrollees, useListCourses, getListEnrolleesQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Check, X, CheckCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const PAGE_SIZE = 10;

const STATUS_STYLES: Record<string, string> = {
  "pre-registered": "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-blue-100 text-blue-800 border-blue-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  enrolled: "bg-green-100 text-green-800 border-green-200",
};

function EnrolleeTable({ status }: { status: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);
  const [actionId, setActionId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const params = { search: search || undefined, status, page, limit: PAGE_SIZE };
  const { data, isLoading } = useListEnrollees(params, { query: { queryKey: getListEnrolleesQueryKey(params) } });
  const { data: courses } = useListCourses();
  const approve = useApproveEnrollee();
  const reject = useRejectEnrollee();
  const bulkApprove = useBulkApproveEnrollees();

  const enrollees = (data as any)?.data ?? [];
  const total = (data as any)?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function toggleSelect(id: number) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function handleAction() {
    if (!actionId || !actionType) return;
    setSaving(true);
    try {
      if (actionType === "approve") {
        await approve.mutateAsync({ id: actionId, data: { notes: notes || undefined } });
        toast({ title: "Enrollee approved" });
      } else {
        await reject.mutateAsync({ id: actionId, data: { notes: notes || undefined } });
        toast({ title: "Enrollee rejected" });
      }
      await qc.invalidateQueries({ queryKey: getListEnrolleesQueryKey(params) });
      setActionId(null);
      setActionType(null);
      setNotes("");
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.error ?? "Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleBulkApprove() {
    if (!selected.length) return;
    try {
      const res = await bulkApprove.mutateAsync({ data: { enrolleeIds: selected } });
      await qc.invalidateQueries({ queryKey: getListEnrolleesQueryKey(params) });
      toast({ title: `Approved ${(res as any).approved} enrollees` });
      setSelected([]);
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.error ?? "Failed", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name, pre-reg #..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" data-testid={`input-search-enrollees-${status}`} />
        </div>
        {status === "pre-registered" && selected.length > 0 && (
          <Button onClick={handleBulkApprove} className="bg-green-900 hover:bg-green-800" data-testid="button-bulk-approve">
            <CheckCheck className="h-4 w-4 mr-2" /> Approve {selected.length}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {status === "pre-registered" && <TableHead className="w-10"></TableHead>}
                <TableHead>Pre-Reg #</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Status</TableHead>
                {status === "pre-registered" && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 9 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>
                ))
              ) : enrollees.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">No {status} enrollees</TableCell></TableRow>
              ) : (
                enrollees.map((e: any) => (
                  <TableRow key={e.id} data-testid={`row-enrollee-${e.id}`}>
                    {status === "pre-registered" && (
                      <TableCell>
                        <Checkbox checked={selected.includes(e.id)} onCheckedChange={() => toggleSelect(e.id)} data-testid={`checkbox-enrollee-${e.id}`} />
                      </TableCell>
                    )}
                    <TableCell className="font-mono text-xs">{e.preRegNumber}</TableCell>
                    <TableCell className="font-medium text-sm">{e.lastName}, {e.firstName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{e.email}</TableCell>
                    <TableCell><Badge variant="outline" className="font-mono text-xs border-green-600 text-green-800">{e.courseCode ?? "N/A"}</Badge></TableCell>
                    <TableCell className="text-sm">Year {e.yearLevel}</TableCell>
                    <TableCell className="text-sm capitalize">{e.enrollmentType}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {e.applicationDate ? format(new Date(e.applicationDate), "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs capitalize ${STATUS_STYLES[e.status] ?? ""}`}>{e.status}</Badge>
                    </TableCell>
                    {status === "pre-registered" && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="text-green-700 hover:text-green-900" onClick={() => { setActionId(e.id); setActionType("approve"); }} data-testid={`button-approve-${e.id}`}><Check className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => { setActionId(e.id); setActionType("reject"); }} data-testid={`button-reject-${e.id}`}><X className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
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

      <Dialog open={!!actionId} onOpenChange={(o) => !o && (setActionId(null), setActionType(null), setNotes(""))}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{actionType === "approve" ? "Approve Enrollee" : "Reject Enrollee"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Notes (optional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes..." rows={3} data-testid="textarea-action-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionId(null); setActionType(null); }}>Cancel</Button>
            <Button onClick={handleAction} disabled={saving} className={actionType === "approve" ? "bg-green-900 hover:bg-green-800" : "bg-red-600 hover:bg-red-700"} data-testid="button-confirm-action">
              {saving ? "Processing..." : actionType === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function EnrolleesPage() {
  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enrollees</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage enrollment applications and approvals</p>
        </div>
        <Tabs defaultValue="pre-registered">
          <TabsList>
            <TabsTrigger value="pre-registered" data-testid="tab-pre-registered">Pre-registered</TabsTrigger>
            <TabsTrigger value="approved" data-testid="tab-approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected" data-testid="tab-rejected">Rejected</TabsTrigger>
          </TabsList>
          <TabsContent value="pre-registered" className="mt-4"><EnrolleeTable status="pre-registered" /></TabsContent>
          <TabsContent value="approved" className="mt-4"><EnrolleeTable status="approved" /></TabsContent>
          <TabsContent value="rejected" className="mt-4"><EnrolleeTable status="rejected" /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
