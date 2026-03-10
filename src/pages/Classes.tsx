import { type FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import TeacherSelect from "@/components/timetable/TeacherSelect";
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

type ClassItem = {
  _id: string;
  name: string;
  section: string;
  classTeacherId?: string;
  subjects?: string[];
  room?: string;
};

type Teacher = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

type SubjectItem = {
  _id: string;
  name: string;
};

function displayName(c: Pick<ClassItem, "name" | "section">) {
  return `${c.name}-${c.section}`;
}

const Classes = () => {
  const [items, setItems] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [section, setSection] = useState("");
  const [classTeacherId, setClassTeacherId] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [room, setRoom] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<ClassItem | null>(null);

  const [editName, setEditName] = useState("");
  const [editSection, setEditSection] = useState("");
  const [editClassTeacherId, setEditClassTeacherId] = useState("");
  const [editSubjects, setEditSubjects] = useState<string[]>([]);
  const [editRoom, setEditRoom] = useState("");

  function toggleInList(list: string[], value: string) {
    const v = String(value || "").trim();
    if (!v) return list;
    return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<any>("/api/classes");
      const data: ClassItem[] = Array.isArray(res?.data) ? res.data : [];
      setItems(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load classes");
    } finally {
      setLoading(false);
    }
  }

  async function loadTeachers() {
    try {
      const res = await apiRequest<any>("/api/teachers?limit=200");
      const data: Teacher[] = Array.isArray(res?.data) ? res.data : [];
      setTeachers(data);
    } catch {
      setTeachers([]);
    }
  }

  async function loadSubjects() {
    try {
      const res = await apiRequest<any>("/api/subjects");
      const data: SubjectItem[] = Array.isArray(res?.data) ? res.data : [];
      setSubjectOptions(
        data
          .map((s) => String(s?.name || "").trim())
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b))
      );
    } catch {
      setSubjectOptions([]);
    }
  }

  useEffect(() => {
    load();
    loadTeachers();
    loadSubjects();
  }, []);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const ax = `${a.name}-${a.section}`.toLowerCase();
      const bx = `${b.name}-${b.section}`.toLowerCase();
      return ax.localeCompare(bx);
    });
  }, [items]);

  function openEdit(c: ClassItem) {
    setSelected(c);
    setEditName(c.name || "");
    setEditSection(c.section || "");
    setEditClassTeacherId(c.classTeacherId || "");
    setEditSubjects(Array.isArray(c.subjects) ? c.subjects : []);
    setEditRoom(c.room || "");
    setEditOpen(true);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();

    const n = name.trim();
    const s = section.trim();

    if (!n || !s) {
      toast.error("name and section are required");
      return;
    }

    try {
      setCreating(true);
      await apiRequest("/api/classes", {
        method: "POST",
        body: {
          name: n,
          section: s,
          classTeacherId: classTeacherId.trim() || undefined,
          subjects,
          room: room.trim() || undefined,
        },
      });
      toast.success("Class created");
      setCreateOpen(false);
      setName("");
      setSection("");
      setClassTeacherId("");
      setSubjects([]);
      setRoom("");
      await load();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create class");
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    if (!selected?._id) return;

    const n = editName.trim();
    const s = editSection.trim();

    if (!n || !s) {
      toast.error("name and section are required");
      return;
    }

    try {
      setEditing(true);
      await apiRequest(`/api/classes/${selected._id}`, {
        method: "PUT",
        body: {
          name: n,
          section: s,
          classTeacherId: editClassTeacherId.trim(),
          subjects: editSubjects,
          room: editRoom.trim(),
        },
      });

      toast.success("Class updated");
      setEditOpen(false);
      setSelected(null);
      await load();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update class");
    } finally {
      setEditing(false);
    }
  }

  async function handleDelete(c: ClassItem) {
    try {
      await apiRequest(`/api/classes/${c._id}`, { method: "DELETE" });
      toast.success("Class deleted");
      await load();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete class");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Classes</h1>
          <p className="text-muted-foreground">Manage classes and sections.</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto">Add Class</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Class</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="10" required />
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Input value={section} onChange={(e) => setSection(e.target.value)} placeholder="A" required />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Class Teacher (optional)</Label>
                  <TeacherSelect value={classTeacherId} onChange={setClassTeacherId} teachers={teachers} />
                </div>
                <div className="space-y-2">
                  <Label>Room (optional)</Label>
                  <Input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Room 101" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Subjects</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-between">
                      {subjects.length ? `${subjects.length} selected` : "Select subjects"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-2 max-h-64 overflow-auto">
                      {subjectOptions.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No subjects found.</div>
                      ) : (
                        subjectOptions.map((sub) => {
                          const checked = subjects.includes(sub);
                          return (
                            <label key={sub} className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() => setSubjects((prev) => toggleInList(prev, sub))}
                              />
                              <span>{sub}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
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

      {loading ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">Loading classes...</CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">No classes found.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sorted.map((c) => (
            <Card key={c._id}>
              <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-semibold">{displayName(c)}</div>
                  <div className="text-sm text-muted-foreground">
                    {c.room ? `Room: ${c.room}` : "Room: -"}
                    {c.classTeacherId ? ` • Class Teacher: ${c.classTeacherId}` : " • Class Teacher: -"}
                    {Array.isArray(c.subjects) && c.subjects.length
                      ? ` • Subjects: ${c.subjects.slice(0, 3).join(", ")}${c.subjects.length > 3 ? "..." : ""}`
                      : " • Subjects: -"}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => openEdit(c)}>
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete class?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete {displayName(c)}.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(c)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Section</Label>
                <Input value={editSection} onChange={(e) => setEditSection(e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class Teacher (optional)</Label>
                <TeacherSelect value={editClassTeacherId} onChange={setEditClassTeacherId} teachers={teachers} />
              </div>
              <div className="space-y-2">
                <Label>Room (optional)</Label>
                <Input value={editRoom} onChange={(e) => setEditRoom(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Subjects</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-between">
                    {editSubjects.length ? `${editSubjects.length} selected` : "Select subjects"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {subjectOptions.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No subjects found.</div>
                    ) : (
                      subjectOptions.map((sub) => {
                        const checked = editSubjects.includes(sub);
                        return (
                          <label key={sub} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => setEditSubjects((prev) => toggleInList(prev, sub))}
                            />
                            <span>{sub}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </PopoverContent>
              </Popover>
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

export default Classes;
