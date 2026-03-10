import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Download, FileBarChart, Trophy, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { apiRequest } from "@/lib/api";
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
import {
  AlertDialog as ConfirmDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Result = {
  _id: string;
  studentId: string;
  subject: string;
  marks: number;
  grade?: string;
  examName?: string;
  status?: string;
};

type StudentOption = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  className?: string;
};

type CreateRow = {
  subject: string;
  marks: string;
  grade: string;
  status: "PASS" | "FAIL";
};

const ExamResults = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [studentId, setStudentId] = useState("");
  const [studentQuery, setStudentQuery] = useState("");
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [studentSearching, setStudentSearching] = useState(false);
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const studentSearchReqIdRef = useRef(0);

  const [examName, setExamName] = useState("");
  const [rows, setRows] = useState<CreateRow[]>([
    { subject: "", marks: "", grade: "", status: "PASS" }
  ]);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<Result | null>(null);

  const [editExamName, setEditExamName] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editMarks, setEditMarks] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editStatus, setEditStatus] = useState<"PASS" | "FAIL">("PASS");

  async function loadResults() {
    try {
      setLoading(true);
      setError(null);
      const res = await apiRequest<any>("/api/results?limit=100");
      const items: Result[] = Array.isArray(res?.data) ? res.data : [];
      setResults(items);
    } catch (e: any) {
      setError(e?.message || "Failed to load results");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResults();
  }, []);

  useEffect(() => {
    const q = studentQuery.trim();
    if (!q) {
      setStudentOptions([]);
      setStudentSearching(false);
      return;
    }

    const myReqId = ++studentSearchReqIdRef.current;
    const t = window.setTimeout(async () => {
      try {
        setStudentSearching(true);
        const res = await apiRequest<any>(`/api/students?limit=10&search=${encodeURIComponent(q)}`);
        const items: StudentOption[] = Array.isArray(res?.data) ? res.data : [];
        if (studentSearchReqIdRef.current !== myReqId) return;
        setStudentOptions(items);
      } catch {
        if (studentSearchReqIdRef.current !== myReqId) return;
        setStudentOptions([]);
      } finally {
        if (studentSearchReqIdRef.current !== myReqId) return;
        setStudentSearching(false);
      }
    }, 300);

    return () => window.clearTimeout(t);
  }, [studentQuery]);

  async function handleCreateResult(e: FormEvent) {
    e.preventDefault();
    const sid = studentId.trim();
    const en = examName.trim();

    const cleanRows = rows
      .map((r) => ({
        subject: r.subject.trim(),
        marks: r.marks.trim(),
        grade: r.grade.trim(),
        status: r.status,
      }))
      .filter((r) => r.subject || r.marks || r.grade);

    if (!sid || !en || cleanRows.length === 0) {
      toast.error("studentId, examName, and at least one subject are required");
      return;
    }

    const items = cleanRows.map((r) => {
      const mk = Number(r.marks);
      return {
        studentId: sid,
        examName: en,
        subject: r.subject,
        marks: mk,
        grade: r.grade || undefined,
        status: r.status,
      };
    });

    const invalid = items.find((it) => !it.subject || !Number.isFinite(it.marks));
    if (invalid) {
      toast.error("Each row must have subject and valid marks");
      return;
    }

    try {
      setCreating(true);

      if (items.length === 1) {
        await apiRequest("/api/results", {
          method: "POST",
          body: items[0],
        });
        toast.success("Result created");
      } else {
        await apiRequest("/api/results/bulk", {
          method: "POST",
          body: { items },
        });
        toast.success("Results created");
      }

      setCreateOpen(false);
      setStudentId("");
      setStudentQuery("");
      setStudentOptions([]);
      setStudentDropdownOpen(false);
      setExamName("");
      setRows([{ subject: "", marks: "", grade: "", status: "PASS" }]);
      await loadResults();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create result");
    } finally {
      setCreating(false);
    }
  }

  function openEdit(r: Result) {
    setSelected(r);
    setEditExamName(r.examName || "");
    setEditSubject(r.subject || "");
    setEditMarks(String(r.marks ?? ""));
    setEditGrade(r.grade || "");
    setEditStatus((r.status as any) === 'FAIL' ? 'FAIL' : 'PASS');
    setEditOpen(true);
  }

  async function handleUpdateResult(e: FormEvent) {
    e.preventDefault();
    if (!selected?._id) return;

    const en = editExamName.trim();
    const sub = editSubject.trim();
    const mk = Number(editMarks);

    if (!en || !sub || !Number.isFinite(mk)) {
      toast.error("examName, subject, marks are required");
      return;
    }

    try {
      setEditing(true);
      await apiRequest(`/api/results/${selected._id}`, {
        method: "PUT",
        body: {
          examName: en,
          subject: sub,
          marks: mk,
          grade: editGrade.trim() || undefined,
          status: editStatus,
        },
      });

      toast.success("Result updated");
      setEditOpen(false);
      setSelected(null);
      await loadResults();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update result");
    } finally {
      setEditing(false);
    }
  }

  async function handleDeleteResult(r: Result) {
    try {
      await apiRequest(`/api/results/${r._id}`, { method: "DELETE" });
      toast.success("Result deleted");
      await loadResults();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete result");
    }
  }

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return results;
    return results.filter((r) => {
      return (
        String(r.studentId || "").toLowerCase().includes(q) ||
        String(r.subject || "").toLowerCase().includes(q) ||
        String(r.examName || "").toLowerCase().includes(q)
      );
    });
  }, [results, searchTerm]);

  function handleExport() {
    const rows = filtered.map((r) => ({
      _id: r._id,
      studentId: r.studentId,
      examName: r.examName || "",
      subject: r.subject,
      marks: r.marks,
      grade: r.grade || "",
      status: r.status || "",
    }));

    const columns = ["_id", "studentId", "examName", "subject", "marks", "grade", "status"];
    const csv = rowsToCsv(rows, columns);
    downloadCsv(`results-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  const avgScore = useMemo(() => {
    if (!results.length) return null;
    const sum = results.reduce((acc, r) => acc + (Number(r.marks) || 0), 0);
    return Math.round((sum / results.length) * 10) / 10;
  }, [results]);

  return (
    <div className="p-6 space-y-6">
      {/* --- HEADER FIX --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exam Results</h1>
          <p className="text-muted-foreground">View and manage student grades.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" className="hidden sm:flex" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
                <FileBarChart className="mr-2 h-4 w-4" /> Create Result
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Result</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateResult} className="space-y-4">
                <div className="space-y-2">
                  <Label>Student ID</Label>
                  <Input
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    onFocus={() => setStudentDropdownOpen(true)}
                    placeholder="Student ID"
                    required
                  />
                  <div className="relative">
                    <Input
                      value={studentQuery}
                      onChange={(e) => {
                        setStudentQuery(e.target.value);
                        setStudentDropdownOpen(true);
                      }}
                      onFocus={() => setStudentDropdownOpen(true)}
                      placeholder="Search student by name/email/class"
                    />
                    {studentDropdownOpen ? (
                      <div className="absolute z-50 mt-1 w-full rounded-md border bg-background shadow">
                        <div className="max-h-60 overflow-auto">
                          {studentSearching ? (
                            <div className="p-2 text-sm text-muted-foreground">Searching...</div>
                          ) : studentQuery.trim() && studentOptions.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground">No students found</div>
                          ) : (
                            studentOptions.map((s) => (
                              <button
                                key={s._id}
                                type="button"
                                className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                                onClick={() => {
                                  setStudentId(s._id);
                                  setStudentQuery(`${s.firstName} ${s.lastName} (${s.email})`);
                                  setStudentDropdownOpen(false);
                                }}
                              >
                                <div className="font-medium">{s.firstName} {s.lastName}</div>
                                <div className="text-xs text-muted-foreground">{s.email}{s.className ? ` • ${s.className}` : ""} • {s._id}</div>
                              </button>
                            ))
                          )}
                        </div>
                        <div className="flex justify-end border-t p-1">
                          <Button type="button" variant="ghost" size="sm" onClick={() => setStudentDropdownOpen(false)}>
                            Close
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Exam Name</Label>
                  <Input value={examName} onChange={(e) => setExamName(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label>Subjects & Marks</Label>
                  <div className="space-y-2">
                    {rows.map((r, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                        <div className="sm:col-span-4 space-y-1">
                          <Label>Subject</Label>
                          <Input
                            value={r.subject}
                            onChange={(e) => {
                              const next = [...rows];
                              next[idx] = { ...next[idx], subject: e.target.value };
                              setRows(next);
                            }}
                            placeholder="Math"
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <Label>Marks</Label>
                          <Input
                            type="number"
                            value={r.marks}
                            onChange={(e) => {
                              const next = [...rows];
                              next[idx] = { ...next[idx], marks: e.target.value };
                              setRows(next);
                            }}
                            placeholder="95"
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <Label>Grade</Label>
                          <Input
                            value={r.grade}
                            onChange={(e) => {
                              const next = [...rows];
                              next[idx] = { ...next[idx], grade: e.target.value };
                              setRows(next);
                            }}
                            placeholder="A+"
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <Label>Status</Label>
                          <Select
                            value={r.status}
                            onValueChange={(v) => {
                              const next = [...rows];
                              next[idx] = { ...next[idx], status: v as any };
                              setRows(next);
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PASS">PASS</SelectItem>
                              <SelectItem value="FAIL">FAIL</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="sm:col-span-2 flex flex-col sm:flex-row gap-2 sm:justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                            onClick={() => {
                              const next = [...rows];
                              next.splice(idx, 1);
                              setRows(next.length ? next : [{ subject: "", marks: "", grade: "", status: "PASS" }]);
                            }}
                            disabled={rows.length === 1}
                          >
                            Remove
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="w-full sm:w-auto"
                            onClick={() => setRows([...rows, { subject: "", marks: "", grade: "", status: "PASS" }])}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
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

      {/* Stats Cards (Grid Layout - Safe on all screens) */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgScore === null ? '-' : `${avgScore}%`}</div>
            <p className="text-xs text-muted-foreground">From loaded results</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Pending student join</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Grading</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Not tracked yet</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Table */}
      <div className="space-y-4">
        <div className="relative md:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by student or subject..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-sm text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-sm text-destructive">{error}</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-sm text-muted-foreground">No results found.</TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r._id}>
                    <TableCell className="font-medium">{r.studentId}</TableCell>
                    <TableCell>{r.subject}</TableCell>
                    <TableCell>{r.marks}/100</TableCell>
                    <TableCell><span className="text-green-600 font-bold">{r.grade || '-'}</span></TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>Edit</Button>
                          <ConfirmDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">Delete</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete result?</AlertDialogTitle>
                                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteResult(r)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </ConfirmDialog>
                        </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Result</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateResult} className="space-y-4">
              <div className="text-sm text-muted-foreground">Student ID: {selected?.studentId || '-'}</div>
              <div className="space-y-2">
                <Label>Exam Name</Label>
                <Input value={editExamName} onChange={(e) => setEditExamName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Marks</Label>
                  <Input type="number" value={editMarks} onChange={(e) => setEditMarks(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Grade (optional)</Label>
                  <Input value={editGrade} onChange={(e) => setEditGrade(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PASS">PASS</SelectItem>
                    <SelectItem value="FAIL">FAIL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={editing}>Cancel</Button>
                <Button type="submit" disabled={editing}>{editing ? 'Saving...' : 'Save'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ExamResults;