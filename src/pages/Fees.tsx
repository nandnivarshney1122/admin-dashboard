import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, DollarSign, CreditCard, Download, AlertCircle } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { downloadCsv, rowsToCsv } from "@/lib/csv";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Fee = {
  _id: string;
  studentId: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: "PAID" | "PARTIAL" | "PENDING";
  createdAt?: string;
};

const Fees = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [fees, setFees] = useState<Fee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<any>(null);

    const [createOpen, setCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [studentId, setStudentId] = useState("");
    const [totalAmount, setTotalAmount] = useState("");
    const [paidAmount, setPaidAmount] = useState("");

    const [payOpen, setPayOpen] = useState(false);
    const [paying, setPaying] = useState(false);
    const [payAmount, setPayAmount] = useState("");
    const [selectedFee, setSelectedFee] = useState<Fee | null>(null);

    useEffect(() => {
      let mounted = true;

      async function load() {
        try {
          setLoading(true);
          setError(null);

          const [feesRes, summaryRes] = await Promise.all([
            apiRequest<any>("/api/fees?limit=100"),
            apiRequest<any>("/api/fees/summary")
          ]);

          const items: Fee[] = Array.isArray(feesRes?.data) ? feesRes.data : [];

          if (mounted) {
            setFees(items);
            setSummary(summaryRes?.data || null);
          }
        } catch (e: any) {
          if (mounted) setError(e?.message || "Failed to load fees");
        } finally {
          if (mounted) setLoading(false);
        }
      }

      load();
      return () => {
        mounted = false;
      };
    }, []);

    async function handleCreateFee(e: FormEvent) {
      e.preventDefault();

      const sid = studentId.trim();
      const total = Number(totalAmount);
      const paid = paidAmount.trim() ? Number(paidAmount) : 0;

      if (!sid || !Number.isFinite(total)) {
        toast.error("studentId and totalAmount are required");
        return;
      }

      try {
        setCreating(true);
        await apiRequest("/api/fees", {
          method: "POST",
          body: {
            studentId: sid,
            totalAmount: total,
            paidAmount: paid,
          },
        });

        toast.success("Fee record created");
        setCreateOpen(false);
        setStudentId("");
        setTotalAmount("");
        setPaidAmount("");

        const [feesRes, summaryRes] = await Promise.all([
          apiRequest<any>("/api/fees?limit=100"),
          apiRequest<any>("/api/fees/summary")
        ]);

        setFees(Array.isArray(feesRes?.data) ? feesRes.data : []);
        setSummary(summaryRes?.data || null);
      } catch (err: any) {
        toast.error(err?.message || "Failed to create fee record");
      } finally {
        setCreating(false);
      }
    }

    async function handleApplyPayment(e: FormEvent) {
      e.preventDefault();
      if (!selectedFee?._id) return;

      const amt = Number(payAmount);
      if (!Number.isFinite(amt) || amt <= 0) {
        toast.error("Enter a valid payment amount");
        return;
      }

      try {
        setPaying(true);
        await apiRequest(`/api/fees/${selectedFee._id}/pay`, {
          method: "PATCH",
          body: { amount: amt },
        });

        toast.success("Payment applied");
        setPayOpen(false);
        setPayAmount("");
        setSelectedFee(null);

        const [feesRes, summaryRes] = await Promise.all([
          apiRequest<any>("/api/fees?limit=100"),
          apiRequest<any>("/api/fees/summary")
        ]);

        setFees(Array.isArray(feesRes?.data) ? feesRes.data : []);
        setSummary(summaryRes?.data || null);
      } catch (err: any) {
        toast.error(err?.message || "Failed to apply payment");
      } finally {
        setPaying(false);
      }
    }

    const filtered = useMemo(() => {
      const q = searchTerm.trim().toLowerCase();
      if (!q) return fees;
      return fees.filter((f) => {
        return (
          String(f.studentId || "").toLowerCase().includes(q) ||
          String(f.status || "").toLowerCase().includes(q)
        );
      });
    }, [fees, searchTerm]);

    function handleExport() {
      const rows = filtered.map((f) => ({
        _id: f._id,
        studentId: f.studentId,
        totalAmount: f.totalAmount,
        paidAmount: f.paidAmount,
        balanceAmount: f.balanceAmount,
        status: f.status,
        createdAt: f.createdAt || "",
      }));

      const columns = [
        "_id",
        "studentId",
        "totalAmount",
        "paidAmount",
        "balanceAmount",
        "status",
        "createdAt",
      ];

      const csv = rowsToCsv(rows, columns);
      downloadCsv(`fees-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    }

    return (
        <div className="p-6 space-y-6">
            {/* --- HEADER FIX --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Fee Management</h1>
                    <p className="text-muted-foreground">Track payments and outstanding dues.</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <Button variant="outline" size="sm" className="hidden sm:flex" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" /> Export Report
                    </Button>
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                          <DollarSign className="mr-2 h-4 w-4" /> Create Fee
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Fee Record</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateFee} className="space-y-4">
                          <div className="space-y-2">
                            <Label>Student ID</Label>
                            <Input value={studentId} onChange={(e) => setStudentId(e.target.value)} required />
                          </div>
                          <div className="space-y-2">
                            <Label>Total Amount</Label>
                            <Input type="number" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} required />
                          </div>
                          <div className="space-y-2">
                            <Label>Paid Amount (optional)</Label>
                            <Input type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} />
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>Cancel</Button>
                            <Button type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create'}</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary?.totals?.paidAmount ?? "-"}</div>
                        <p className="text-xs text-muted-foreground">Summary</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Dues</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary?.totals?.balanceAmount ?? "-"}</div>
                        <p className="text-xs text-muted-foreground">Summary</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary?.totals?.count ?? filtered.length}</div>
                        <p className="text-xs text-muted-foreground">Loaded</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative md:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by studentId or status..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Fee Table */}
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-sm text-muted-foreground">Loading...</TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-sm text-destructive">{error}</TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-sm text-muted-foreground">No fee records found.</TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((f) => (
                      <TableRow key={f._id}>
                        <TableCell className="font-medium">{f.studentId}</TableCell>
                        <TableCell>{f._id}</TableCell>
                        <TableCell>{f.totalAmount}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              f.status === 'PAID'
                                ? 'bg-green-100 text-green-700'
                                : f.status === 'PARTIAL'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {f.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{f.createdAt ? new Date(f.createdAt).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedFee(f);
                              setPayOpen(true);
                            }}
                            disabled={f.status === 'PAID'}
                          >
                            Pay
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

                <Dialog open={payOpen} onOpenChange={setPayOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Apply Payment</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleApplyPayment} className="space-y-4">
                      <div className="text-sm text-muted-foreground">Fee ID: {selectedFee?._id || '-'}</div>
                      <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required />
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setPayOpen(false)} disabled={paying}>Cancel</Button>
                        <Button type="submit" disabled={paying}>{paying ? 'Applying...' : 'Apply'}</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
            </div>
        );
};
export default Fees;