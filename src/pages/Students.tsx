import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Upload, Plus, Search, Eye, Edit } from "lucide-react";
import { toast } from "sonner";

import { apiRequest } from "@/lib/api";
import { downloadCsv, parseCsvToObjects, rowsToCsv } from "@/lib/csv";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Student = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  className?: string;
  phone?: string;
  rollNumber?: string;
  admissionId?: string;
  status?: string;
};

const Students = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [className, setClassName] = useState("");
  const [phone, setPhone] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [admissionId, setAdmissionId] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<Student | null>(null);

  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editClassName, setEditClassName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRollNumber, setEditRollNumber] = useState("");
  const [editAdmissionId, setEditAdmissionId] = useState("");

  async function loadStudents() {
    setLoading(true);
    setError(null);

    try {
      const res = await apiRequest<any>("/api/students?limit=100");
      const items: Student[] = Array.isArray(res?.data) ? res.data : [];
      setStudents(items);
    } catch (e: any) {
      setError(e?.message || "Failed to load students");
    } finally {
      setLoading(false);
    }

  }

  function openEdit(student: Student) {
    setSelected(student);
    setEditFirstName(student.firstName || "");
    setEditLastName(student.lastName || "");
    setEditEmail(student.email || "");
    setEditClassName(student.className || "");
    setEditPhone(student.phone || "");
    setEditRollNumber(student.rollNumber || "");
    setEditAdmissionId(student.admissionId || "");
    setEditOpen(true);
  }

  async function handleUpdateStudent(e: FormEvent) {
    e.preventDefault();
    if (!selected?._id) return;

    const payload: any = {
      firstName: editFirstName.trim(),
      lastName: editLastName.trim(),
      email: editEmail.trim(),
      className: editClassName.trim(),
      phone: editPhone.trim() || undefined,
      rollNumber: editRollNumber.trim() || undefined,
      admissionId: editAdmissionId.trim() || undefined,
    };

    if (!payload.firstName || !payload.lastName || !payload.email || !payload.className) {
      toast.error("firstName, lastName, email, className are required");
      return;
    }

    try {
      setEditing(true);
      await apiRequest(`/api/students/${selected._id}`, {
        method: "PUT",
        body: payload,
      });

      toast.success("Student updated");
      setEditOpen(false);
      setSelected(null);
      await loadStudents();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update student");
    } finally {
      setEditing(false);
    }
  }

  async function handleDeleteStudent(student: Student) {
    try {
      await apiRequest(`/api/students/${student._id}`, { method: "DELETE" });
      toast.success("Student deleted");
      await loadStudents();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete student");
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  async function handleCreateStudent(e: FormEvent) {
    e.preventDefault();

    const fn = firstName.trim();
    const ln = lastName.trim();
    const em = email.trim();
    const cn = className.trim();

    if (!fn || !ln || !em || !cn) {
      toast.error("firstName, lastName, email, className are required");
      return;
    }

    try {
      setCreating(true);
      await apiRequest("/api/students", {
        method: "POST",
        body: {
          firstName: fn,
          lastName: ln,
          email: em,
          className: cn,
          phone: phone.trim() || undefined,
          rollNumber: rollNumber.trim() || undefined,
          admissionId: admissionId.trim() || undefined,
          status: "ACTIVE",
        },
      });

      toast.success("Student created");
      setCreateOpen(false);
      setFirstName("");
      setLastName("");
      setEmail("");
      setClassName("");
      setPhone("");
      setRollNumber("");
      setAdmissionId("");
      await loadStudents();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create student");
    } finally {
      setCreating(false);
    }
  }

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const name = `${s.firstName} ${s.lastName}`.toLowerCase();
      return name.includes(q) || String(s.email || "").toLowerCase().includes(q) || String(s.className || "").toLowerCase().includes(q);
    });
  }, [students, searchTerm]);

  function handleExport() {
    const rows = filtered.map((s) => ({
      _id: s._id,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      className: s.className || "",
      phone: s.phone || "",
      rollNumber: s.rollNumber || "",
      admissionId: s.admissionId || "",
      status: s.status || "",
    }));

    const columns = [
      "_id",
      "firstName",
      "lastName",
      "email",
      "className",
      "phone",
      "rollNumber",
      "admissionId",
      "status",
    ];

    const csv = rowsToCsv(rows, columns);
    downloadCsv(`students-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  function openImportPicker() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(file: File) {
    const text = await file.text();
    const rows = parseCsvToObjects(text);
    if (!rows.length) {
      toast.error("No rows found in CSV");
      return;
    }

    const payloads = rows.map((r) => ({
      firstName: String(r.firstName || r.firstname || r["first name"] || "").trim(),
      lastName: String(r.lastName || r.lastname || r["last name"] || "").trim(),
      email: String(r.email || "").trim(),
      className: String(r.className || r.class || r["class name"] || "").trim(),
      phone: String(r.phone || "").trim() || undefined,
      rollNumber: String(r.rollNumber || r.roll || r["roll number"] || "").trim() || undefined,
      admissionId: String(r.admissionId || r.admission || r["admission id"] || "").trim() || undefined,
      status: "ACTIVE",
    }));

    const valid = payloads.filter((p) => p.firstName && p.lastName && p.email && p.className);
    if (!valid.length) {
      toast.error("CSV must include firstName,lastName,email,className");
      return;
    }

    let created = 0;
    let failed = 0;

    for (const p of valid) {
      try {
        await apiRequest("/api/students", { method: "POST", body: p });
        created++;
      } catch {
        failed++;
      }
    }

    if (created) toast.success(`Imported ${created} students`);
    if (failed) toast.error(`${failed} students failed to import`);
    await loadStudents();
  }

  return (
    <div className="p-6 space-y-6">
      {/* --- HEADER SECTION (Fixed Layout) --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground">Manage student records and admissions.</p>
        </div>

        {/* Buttons Group - Always Visible */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Import Button */}
          <Button variant="outline" size="sm" className="hidden sm:flex" onClick={openImportPicker}>
            <Upload className="mr-2 h-4 w-4" /> Import
          </Button>
          
          {/* Export Button */}
          <Button variant="outline" size="sm" className="hidden sm:flex" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              try {
                await handleImportFile(f);
              } catch (err: any) {
                toast.error(err?.message || "Import failed");
              }
            }}
          />

          {/* Add Student (Primary Action) */}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Add Student
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Student</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreateStudent} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First name</Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Last name</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label>Class</Label>
                  <Input value={className} onChange={(e) => setClassName(e.target.value)} required />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone (optional)</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Roll no. (optional)</Label>
                    <Input value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Admission ID (optional)</Label>
                  <Input value={admissionId} onChange={(e) => setAdmissionId(e.target.value)} />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* --- SEARCH & FILTER BAR --- */}
      <div className="flex items-center gap-2 bg-background/95 p-1 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search students..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Mobile-only Export/Import icons (Optional, if you want them on tiny screens) */}
        <div className="flex sm:hidden gap-1">
             <Button variant="ghost" size="icon" onClick={openImportPicker}><Upload className="h-4 w-4"/></Button>
             <Button variant="ghost" size="icon" onClick={handleExport}><Download className="h-4 w-4"/></Button>
        </div>
      </div>

      {/* --- STUDENTS LIST --- */}
      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">Loading students...</CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">No students found.</CardContent>
          </Card>
        ) : (
          filtered.map((student) => (
            <Card key={student._id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="grid gap-1">
                  <div className="font-semibold flex items-center gap-2">
                    {student.firstName} {student.lastName}
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-muted-foreground">
                      {student.className || "-"}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">{student.email}</div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-sm hidden md:block text-right mr-4">
                    <div className="text-xs text-muted-foreground">Status</div>
                    <div className={student.status === "ACTIVE" ? "text-green-600 font-medium" : "text-orange-600"}>
                      {student.status || "-"}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(student)}>
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/students/${student._id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">Delete</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete student?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the student.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteStudent(student)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdateStudent} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First name</Label>
                <Input value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Last name</Label>
                <Input value={editLastName} onChange={(e) => setEditLastName(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label>Class</Label>
              <Input value={editClassName} onChange={(e) => setEditClassName(e.target.value)} required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone (optional)</Label>
                <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Roll no. (optional)</Label>
                <Input value={editRollNumber} onChange={(e) => setEditRollNumber(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Admission ID (optional)</Label>
              <Input value={editAdmissionId} onChange={(e) => setEditAdmissionId(e.target.value)} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={editing}>
                Cancel
              </Button>
              <Button type="submit" disabled={editing}>
                {editing ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Students;