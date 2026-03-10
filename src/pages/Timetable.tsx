import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import ClassSelect from "@/components/timetable/ClassSelect";
import TimetableGrid, { type GridCellKey } from "@/components/timetable/TimetableGrid";
import TimetableForm, { type TimetableFormValue } from "@/components/timetable/TimetableForm";

export type TimetableEntry = {
  _id: string;
  schoolId: string;
  classId: string;
  day: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY";
  period: number;
  subject: string;
  teacherId: string;
  room?: string;
  startTime?: string;
  endTime?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Teacher = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

const DEFAULT_PERIODS = 8;

type ClassItem = {
  _id: string;
  name: string;
  section: string;
};

type SubjectItem = {
  _id: string;
  name: string;
};

function classDisplay(c: Pick<ClassItem, "name" | "section">) {
  return `${c.name}-${c.section}`;
}

const Timetable = () => {
  const [classId, setClassId] = useState<string>("10-A");
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<GridCellKey | null>(null);
  const [saving, setSaving] = useState(false);

  const teacherById = useMemo(() => {
    const m = new Map<string, Teacher>();
    for (const t of teachers) m.set(String(t._id), t);
    return m;
  }, [teachers]);

  const entryByKey = useMemo(() => {
    const m = new Map<string, TimetableEntry>();
    for (const e of entries) {
      m.set(`${e.day}::${e.period}`, e);
    }
    return m;
  }, [entries]);

  async function loadClassesAndSubjects() {
    try {
      const [classesRes, subjectsRes] = await Promise.all([
        apiRequest<any>("/api/classes"),
        apiRequest<any>("/api/subjects"),
      ]);

      const classes: ClassItem[] = Array.isArray(classesRes?.data) ? classesRes.data : [];
      const subjects: SubjectItem[] = Array.isArray(subjectsRes?.data) ? subjectsRes.data : [];

      const cls = classes.map(classDisplay).filter(Boolean);
      const subs = subjects.map((s) => String(s.name || "").trim()).filter(Boolean);

      setClassOptions(cls);
      setSubjectOptions(subs);

      if (!cls.includes(classId) && cls.length > 0) {
        setClassId(cls[0]);
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to load classes/subjects");
      setClassOptions([]);
      setSubjectOptions([]);
    }
  }

  async function loadTeachers() {
    try {
      const res = await apiRequest<any>("/api/teachers?limit=200");
      const items: Teacher[] = Array.isArray(res?.data) ? res.data : [];
      setTeachers(items);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load teachers");
    }
  }

  async function loadClassTimetable(targetClassId: string) {
    setLoading(true);
    try {
      const res = await apiRequest<any>(`/api/timetable/class/${encodeURIComponent(targetClassId)}`);
      const items: TimetableEntry[] = Array.isArray(res?.data) ? res.data : [];
      setEntries(items);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load timetable");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeachers();
    loadClassesAndSubjects();
  }, []);

  useEffect(() => {
    loadClassTimetable(classId);
  }, [classId]);

  function openCell(key: GridCellKey) {
    setSelectedKey(key);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setSelectedKey(null);
  }

  async function handleSave(value: TimetableFormValue) {
    if (!selectedKey) return;

    const existing = entryByKey.get(`${selectedKey.day}::${selectedKey.period}`);

    setSaving(true);
    try {
      if (existing?._id) {
        await apiRequest(`/api/timetable/${encodeURIComponent(existing._id)}`, {
          method: "PUT",
          body: {
            classId,
            day: selectedKey.day,
            period: selectedKey.period,
            subject: value.subject,
            teacherId: value.teacherId,
            room: value.room || undefined,
            startTime: value.startTime || undefined,
            endTime: value.endTime || undefined,
          },
        });
        toast.success("Timetable updated");
      } else {
        await apiRequest(`/api/timetable`, {
          method: "POST",
          body: {
            classId,
            day: selectedKey.day,
            period: selectedKey.period,
            subject: value.subject,
            teacherId: value.teacherId,
            room: value.room || undefined,
            startTime: value.startTime || undefined,
            endTime: value.endTime || undefined,
          },
        });
        toast.success("Timetable entry created");
      }

      await loadClassTimetable(classId);
      closeDialog();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save entry");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedKey) return;

    const existing = entryByKey.get(`${selectedKey.day}::${selectedKey.period}`);
    if (!existing?._id) return;

    setSaving(true);
    try {
      await apiRequest(`/api/timetable/${encodeURIComponent(existing._id)}`, {
        method: "DELETE",
      });
      toast.success("Timetable entry deleted");
      await loadClassTimetable(classId);
      closeDialog();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete entry");
    } finally {
      setSaving(false);
    }
  }

  const selectedExisting = selectedKey
    ? entryByKey.get(`${selectedKey.day}::${selectedKey.period}`) || null
    : null;

  const initialForm: TimetableFormValue = {
    subject: selectedExisting?.subject || "",
    teacherId: selectedExisting?.teacherId || "",
    room: selectedExisting?.room || "",
    startTime: selectedExisting?.startTime || "",
    endTime: selectedExisting?.endTime || "",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl lg:text-3xl font-display font-bold">Timetable Management</h1>
        <p className="text-muted-foreground">Manage weekly timetable for each class.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Weekly Timetable</CardTitle>
          <div className="w-full sm:w-64">
            <ClassSelect value={classId} onChange={setClassId} options={classOptions} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <TimetableGrid
            periods={DEFAULT_PERIODS}
            entries={entries}
            teacherById={teacherById}
            onCellClick={openCell}
            loading={loading}
          />

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => loadClassTimetable(classId)} disabled={loading}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <TimetableForm
        open={dialogOpen}
        onOpenChange={(v) => (v ? setDialogOpen(true) : closeDialog())}
        title={
          selectedKey ? `${selectedKey.day} - Period ${selectedKey.period}` : "Timetable Entry"
        }
        teachers={teachers}
        subjectOptions={subjectOptions}
        initialValue={initialForm}
        onSave={handleSave}
        onDelete={selectedExisting?._id ? handleDelete : undefined}
        saving={saving}
      />
    </div>
  );
};

export default Timetable;
