import { type FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

type SubjectItem = {
  _id: string;
  name: string;
  code?: string;
  description?: string;
};

const Subjects = () => {
  const [items, setItems] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<SubjectItem | null>(null);

  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editDescription, setEditDescription] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<any>("/api/subjects");
      const data: SubjectItem[] = Array.isArray(res?.data) ? res.data : [];
      setItems(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load subjects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const ax = (a.name || "").toLowerCase();
      const bx = (b.name || "").toLowerCase();
      return ax.localeCompare(bx);
    });
  }, [items]);

  function openEdit(s: SubjectItem) {
    setSelected(s);
    setEditName(s.name || "");
    setEditCode(s.code || "");
    setEditDescription(s.description || "");
    setEditOpen(true);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();

    const n = name.trim();
    if (!n) {
      toast.error("name is required");
      return;
    }

    try {
      setCreating(true);
      await apiRequest("/api/subjects", {
        method: "POST",
        body: {
          name: n,
          code: code.trim() || undefined,
          description: description.trim() || undefined,
        },
      });
      toast.success("Subject created");
      setCreateOpen(false);
      setName("");
      setCode("");
      setDescription("");
      await load();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create subject");
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    if (!selected?._id) return;

    const n = editName.trim();
    if (!n) {
      toast.error("name is required");
      return;
    }

    try {
      setEditing(true);
      await apiRequest(`/api/subjects/${selected._id}`, {
        method: "PUT",
        body: {
          name: n,
          code: editCode.trim(),
          description: editDescription.trim(),
        },
      });

      toast.success("Subject updated");
      setEditOpen(false);
      setSelected(null);
      await load();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update subject");
    } finally {
      setEditing(false);
    }
  }

  async function handleDelete(s: SubjectItem) {
    try {
      await apiRequest(`/api/subjects/${s._id}`, { method: "DELETE" });
      toast.success("Subject deleted");
      await load();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete subject");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subjects</h1>
          <p className="text-muted-foreground">Manage subjects offered by the school.</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto">Add Subject</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Subject</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mathematics" required />
              </div>

              <div className="space-y-2">
                <Label>Code (optional)</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="MATH" />
              </div>

              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Basic algebra and geometry" />
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
          <CardContent className="p-4 text-sm text-muted-foreground">Loading subjects...</CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">No subjects found.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sorted.map((s) => (
            <Card key={s._id}>
              <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {s.code ? `Code: ${s.code}` : "Code: -"}
                    {s.description ? ` • ${s.description}` : " • Description: -"}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => openEdit(s)}>
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete subject?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete {s.name}.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(s)}>Delete</AlertDialogAction>
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
            <DialogTitle>Edit Subject</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label>Code (optional)</Label>
              <Input value={editCode} onChange={(e) => setEditCode(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
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

export default Subjects;
