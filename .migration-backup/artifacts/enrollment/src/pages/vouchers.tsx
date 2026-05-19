import { useState } from "react";
import { useListVouchers, useGenerateVouchers, useDeleteVoucher } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Ticket, Plus, Trash2, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { AppLayout } from "@/components/layout/app-layout";

export default function VouchersPage() {
  const { toast } = useToast();
  const { data: vouchers, isLoading, refetch } = useListVouchers();
  const generateVouchers = useGenerateVouchers();
  const deleteVoucher = useDeleteVoucher();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [count, setCount] = useState(1);
  const [notes, setNotes] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    try {
      await generateVouchers.mutateAsync({
        data: {
          count,
          notes: notes.trim() || undefined,
          expiresAt: expiresAt || undefined,
        },
      });
      toast({ title: `${count} voucher${count > 1 ? "s" : ""} generated successfully` });
      setDialogOpen(false);
      setCount(1);
      setNotes("");
      setExpiresAt("");
      refetch();
    } catch {
      toast({ title: "Failed to generate vouchers", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Revoke this voucher? This cannot be undone.")) return;
    try {
      await deleteVoucher.mutateAsync({ id });
      toast({ title: "Voucher revoked" });
      refetch();
    } catch {
      toast({ title: "Failed to revoke voucher", variant: "destructive" });
    }
  }

  function copyCode(id: number, code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  const voucherList = (vouchers as any[]) ?? [];
  const unusedCount = voucherList.filter((v) => !v.isUsed).length;
  const usedCount = voucherList.filter((v) => v.isUsed).length;

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Ticket className="h-6 w-6" /> Vouchers
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Generate and manage pre-registration voucher codes
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-900 hover:bg-green-800 gap-2">
                <Plus className="h-4 w-4" /> Generate Vouchers
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Voucher Codes</DialogTitle>
                <DialogDescription>
                  Create one or more voucher codes to distribute to students for pre-registration.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label>Number of codes to generate</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={count}
                    onChange={(e) => setCount(Math.min(50, Math.max(1, Number(e.target.value))))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Max 50 at a time</p>
                </div>
                <div>
                  <Label>Notes (optional)</Label>
                  <Input
                    placeholder="e.g. Batch 2026 — Scholarship"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Expiry date (optional)</Label>
                  <Input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleGenerate} disabled={generating} className="bg-green-900 hover:bg-green-800">
                  {generating ? "Generating..." : `Generate ${count} code${count > 1 ? "s" : ""}`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Vouchers</CardDescription>
              <CardTitle className="text-3xl">{voucherList.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Available</CardDescription>
              <CardTitle className="text-3xl text-green-700">{unusedCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Used</CardDescription>
              <CardTitle className="text-3xl text-gray-500">{usedCount}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : voucherList.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Ticket className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No vouchers yet. Generate some to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {voucherList.map((v: any) => (
                    <TableRow key={v.id} className={v.isUsed ? "opacity-50" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm font-semibold tracking-widest">{v.code}</code>
                          {!v.isUsed && (
                            <button
                              onClick={() => copyCode(v.id, v.code)}
                              className="text-muted-foreground hover:text-gray-900 transition-colors"
                              title="Copy code"
                            >
                              {copiedId === v.id ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {v.isUsed
                          ? <Badge variant="secondary">Used</Badge>
                          : v.expiresAt && new Date() > new Date(v.expiresAt)
                            ? <Badge variant="destructive">Expired</Badge>
                            : <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Available</Badge>
                        }
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{v.notes ?? "—"}</TableCell>
                      <TableCell className="text-sm">{v.expiresAt ? format(new Date(v.expiresAt), "MMM d, yyyy") : "—"}</TableCell>
                      <TableCell className="text-sm">{v.createdByName ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(v.createdAt), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        {!v.isUsed && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                            onClick={() => handleDelete(v.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
