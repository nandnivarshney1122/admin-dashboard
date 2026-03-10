import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Upload, Plus, Search, Mail, Phone, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { apiRequest } from "@/lib/api";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { downloadCsv, parseCsvToObjects, rowsToCsv } from "@/lib/csv";

type Teacher = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subjects?: string[];
  status?: string;
};

const Teachers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subjectsText, setSubjectsText] = useState("");

  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<Teacher | null>(null);

  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSubjectsText, setEditSubjectsText] = useState("");

  async function loadTeachers() {
    setLoading(true);
    setError(null);

    try {
      const res = await apiRequest<any>("/api/teachers?limit=100");
      const items: Teacher[] = Array.isArray(res?.data) ? res.data : [];
      setTeachers(items);
    } catch (e: any) {
      setError(e?.message || "Failed to load teachers");
    } finally {
      setLoading(false);
    }

  }

  function openView(t: Teacher) {
    setSelected(t);
    setViewOpen(true);
  }

  function openEdit(t: Teacher) {
    setSelected(t);
    setEditFirstName(t.firstName || "");
    setEditLastName(t.lastName || "");
    setEditEmail(t.email || "");
    setEditPhone(t.phone || "");
    setEditSubjectsText(Array.isArray(t.subjects) ? t.subjects.join(", ") : "");
    setEditOpen(true);
  }

  async function handleUpdateTeacher(e: FormEvent) {
    e.preventDefault();
    if (!selected?._id) return;

    const fn = editFirstName.trim();
    const ln = editLastName.trim();
    const em = editEmail.trim();

    if (!fn || !ln || !em) {
      toast.error("firstName, lastName, email are required");
      return;
    }

    const subjects = editSubjectsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      setEditing(true);
      await apiRequest(`/api/teachers/${selected._id}`, {
        method: "PUT",
        body: {
          firstName: fn,
          lastName: ln,
          email: em,
          phone: editPhone.trim() || undefined,
          subjects: subjects.length ? subjects : undefined,
        }
      });

      toast.success("Teacher updated");
      setEditOpen(false);
      setSelected(null);
      await loadTeachers();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update teacher");
    } finally {
      setEditing(false);
    }
  }

  async function handleDeleteTeacher(t: Teacher) {
    try {
      await apiRequest(`/api/teachers/${t._id}`, { method: "DELETE" });
      toast.success("Teacher deleted");
      await loadTeachers();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete teacher");
    }
  }

  useEffect(() => {
    loadTeachers();
  }, []);

  async function handleCreateTeacher(e: FormEvent) {
    e.preventDefault();

    const fn = firstName.trim();
    const ln = lastName.trim();
    const em = email.trim();

    if (!fn || !ln || !em) {
      toast.error("firstName, lastName, email are required");
      return;
    }

    const subjects = subjectsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      setCreating(true);
      await apiRequest("/api/teachers", {
        method: "POST",
        body: {
          firstName: fn,
          lastName: ln,
          email: em,
          phone: phone.trim() || undefined,
          subjects: subjects.length ? subjects : undefined,
          status: "ACTIVE"
        }
      });

      toast.success("Teacher created");
      setCreateOpen(false);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setSubjectsText("");
      await loadTeachers();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create teacher");
    } finally {
      setCreating(false);
    }
  }

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((t) => {
      const name = `${t.firstName} ${t.lastName}`.toLowerCase();
      const subjects = Array.isArray(t.subjects) ? t.subjects.join(", ").toLowerCase() : "";
      return (
        name.includes(q) ||
        String(t.email || "").toLowerCase().includes(q) ||
        subjects.includes(q)
      );
    });
  }, [teachers, searchTerm]);

  function handleExport() {
    const rows = filtered.map((t) => ({
      _id: t._id,
      firstName: t.firstName,
      lastName: t.lastName,
      email: t.email,
      phone: t.phone || "",
      subjects: Array.isArray(t.subjects) ? t.subjects.join(", ") : "",
      status: t.status || "",
    }));

    const columns = ["_id", "firstName", "lastName", "email", "phone", "subjects", "status"];
    const csv = rowsToCsv(rows, columns);
    downloadCsv(`teachers-${new Date().toISOString().slice(0, 10)}.csv`, csv);
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
      phone: String(r.phone || "").trim() || undefined,
      subjects: String(r.subjects || r.subject || "")
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      status: "ACTIVE",
    }));

    const valid = payloads.filter((p) => p.firstName && p.lastName && p.email);
    if (!valid.length) {
      toast.error("CSV must include firstName,lastName,email");
      return;
    }

    let created = 0;
    let failed = 0;

    for (const p of valid) {
      try {
        await apiRequest("/api/teachers", {
          method: "POST",
          body: {
            ...p,
            subjects: p.subjects.length ? p.subjects : undefined,
          },
        });
        created++;
      } catch {
        failed++;
      }
    }

    if (created) toast.success(`Imported ${created} teachers`);
    if (failed) toast.error(`${failed} teachers failed to import`);
    await loadTeachers();
  }

  return (
    <div className="p-6 space-y-6">
      {/* --- HEADER SECTION (Fixed Layout) --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teachers</h1>
          <p className="text-muted-foreground">Manage faculty members and assignments.</p>
        </div>

        {/* Buttons Group - Always Visible on Laptop */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" className="hidden sm:flex" onClick={openImportPicker}>
            <Upload className="mr-2 h-4 w-4" /> Import
          </Button>
          
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

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" /> Add Teacher
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Teacher</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreateTeacher} className="space-y-4">
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
                  <Label>Phone (optional)</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Subjects (comma-separated)</Label>
                  <Textarea value={subjectsText} onChange={(e) => setSubjectsText(e.target.value)} placeholder="Math, Physics, English" />
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

      {/* --- SEARCH BAR --- */}
      <div className="flex items-center gap-2 bg-background/95 p-1 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search teachers..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Mobile-only Icons (so you can still export on phone if needed) */}
        <div className="flex sm:hidden gap-1">
             <Button variant="ghost" size="icon" onClick={openImportPicker}><Upload className="h-4 w-4"/></Button>
             <Button variant="ghost" size="icon" onClick={handleExport}><Download className="h-4 w-4"/></Button>
        </div>
      </div>

      {/* --- TEACHERS LIST --- */}
      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">Loading teachers...</CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">No teachers found.</CardContent>
          </Card>
        ) : (
          filtered.map((teacher) => (
          <Card key={teacher._id}>
            <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              
              {/* Teacher Info */}
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold">
                    {String(teacher.firstName || "?").charAt(0)}
                </div>
                <div>
                    <div className="font-semibold">{teacher.firstName} {teacher.lastName}</div>
                    <div className="text-sm text-muted-foreground">{Array.isArray(teacher.subjects) && teacher.subjects.length ? teacher.subjects.join(", ") : "-"}</div>
                </div>
              </div>

              {/* Contact Info (Hidden on small phones, visible on laptop) */}
              <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" /> {teacher.email || "-"}
                </div>
                <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" /> {teacher.phone || "-"}
                </div>
              </div>

              {/* Status & Actions */}
              <div className="flex items-center justify-between w-full md:w-auto gap-4">
                 <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                     teacher.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                 }`}>
                    {teacher.status || 'UNKNOWN'}
                 </span>

                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openView(teacher)}>View Profile</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(teacher)}>Edit Details</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onSelect={(e) => e.preventDefault()}>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <span className="w-full">Delete</span>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete teacher?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the teacher.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteTeacher(teacher)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
              </div>

            </CardContent>
          </Card>
        ))
        )}
      </div>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Teacher Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div><span className="text-muted-foreground">Name:</span> {selected ? `${selected.firstName} ${selected.lastName}` : '-'}</div>
            <div><span className="text-muted-foreground">Email:</span> {selected?.email || '-'}</div>
            <div><span className="text-muted-foreground">Phone:</span> {selected?.phone || '-'}</div>
            <div><span className="text-muted-foreground">Subjects:</span> {Array.isArray(selected?.subjects) && selected?.subjects?.length ? selected?.subjects?.join(', ') : '-'}</div>
            <div><span className="text-muted-foreground">Status:</span> {selected?.status || '-'}</div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdateTeacher} className="space-y-4">
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
              <Label>Phone (optional)</Label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Subjects (comma-separated)</Label>
              <Textarea value={editSubjectsText} onChange={(e) => setEditSubjectsText(e.target.value)} placeholder="Math, Physics, English" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={editing}>Cancel</Button>
              <Button type="submit" disabled={editing}>{editing ? 'Saving...' : 'Save'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Teachers;