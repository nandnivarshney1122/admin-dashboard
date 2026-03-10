import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { apiRequest } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import TimetableGeneratorForm, {
  type GeneratorFormValue,
} from "@/components/timetable-generator/TimetableGeneratorForm";
import TimetablePreviewGrid from "@/components/timetable-generator/TimetablePreviewGrid";

export type TimetableEntry = {
  _id?: string;
  classId: string;
  day: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY";
  period: number;
  subject: string;
  teacherId: string;
  room?: string;
  startTime?: string;
  endTime?: string;
};

type Teacher = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

const DEFAULT_DAYS: GeneratorFormValue["days"] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
];

const AITimetableGenerator = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);

  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);

  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<TimetableEntry[]>([]);

  const teacherById = useMemo(() => {
    const m = new Map<string, Teacher>();
    for (const t of teachers) m.set(String(t._id), t);
    return m;
  }, [teachers]);

  useEffect(() => {
    let mounted = true;

    async function loadTeachers() {
      try {
        setLoadingTeachers(true);
        const res = await apiRequest<any>("/api/teachers?limit=200");
        const items: Teacher[] = Array.isArray(res?.data) ? res.data : [];
        if (mounted) setTeachers(items);
      } catch (e: any) {
        toast.error(e?.message || "Failed to load teachers");
      } finally {
        if (mounted) setLoadingTeachers(false);
      }
    }

    async function loadClassesAndSubjects() {
      try {
        const [classesRes, subjectsRes] = await Promise.all([
          apiRequest<any>("/api/classes"),
          apiRequest<any>("/api/subjects"),
        ]);

        const classes = Array.isArray(classesRes?.data) ? classesRes.data : [];
        const subjects = Array.isArray(subjectsRes?.data) ? subjectsRes.data : [];

        const cls = classes
          .map((c: any) => `${String(c?.name || "").trim()}-${String(c?.section || "").trim()}`)
          .filter((v: string) => v && v !== "-");

        const subs = subjects
          .map((s: any) => String(s?.name || "").trim())
          .filter(Boolean);

        if (mounted) {
          setClassOptions(cls);
          setSubjectOptions(subs);
        }
      } catch (e: any) {
        toast.error(e?.message || "Failed to load classes/subjects");
        if (mounted) {
          setClassOptions([]);
          setSubjectOptions([]);
        }
      }
    }

    loadTeachers();
    loadClassesAndSubjects();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleGenerate(value: GeneratorFormValue) {
    setGenerating(true);
    try {
      const res = await apiRequest<any>("/api/timetable/generate", {
        method: "POST",
        body: {
          classId: value.classId,
          days: value.days,
          periodsPerDay: value.periodsPerDay,
          subjects: value.subjects.map((s) => ({
            name: s.name,
            teacherId: s.teacherId,
            weeklyHours: s.weeklyHours,
            room: s.room || undefined,
          })),
        },
      });

      const items: TimetableEntry[] = Array.isArray(res?.data) ? res.data : [];
      setGenerated(items);
      toast.success("Timetable generated and saved");
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate timetable");
    } finally {
      setGenerating(false);
    }
  }

  const initialForm: GeneratorFormValue = {
    classId: classOptions[0] || "10-A",
    days: DEFAULT_DAYS,
    periodsPerDay: 6,
    subjects: [
      { name: subjectOptions[0] || "", teacherId: "", weeklyHours: 5, room: "" },
      { name: subjectOptions[1] || "", teacherId: "", weeklyHours: 4, room: "" },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl lg:text-3xl font-display font-bold">AI Timetable Generator</h1>
        <p className="text-muted-foreground">
          Generate a weekly timetable while avoiding teacher/room conflicts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <TimetableGeneratorForm
            initialValue={initialForm}
            classOptions={classOptions.length > 0 ? classOptions : ["10-A", "10-B", "9-A", "9-B", "8-A", "8-B"]}
            subjectOptions={subjectOptions}
            teachers={teachers}
            loadingTeachers={loadingTeachers}
            generating={generating}
            onGenerate={handleGenerate}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <TimetablePreviewGrid
            entries={generated}
            teacherById={teacherById}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AITimetableGenerator;
