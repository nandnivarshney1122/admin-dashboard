import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ClassItem = {
  _id: string;
  name: string;
  section: string;
};

type StudentItem = {
  _id: string;
  firstName: string;
  lastName: string;
  className?: string;
  rollNumber?: string;
  admissionId?: string;
};

type AttendanceItem = {
  _id: string;
  teacherId: string;
  className: string;
  studentId: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE";
};

type ResultItem = {
  _id: string;
  studentId: string;
  examName: string;
  subject: string;
  marks: number;
  grade?: string;
  status: "PASS" | "FAIL";
  createdAt?: string;
};

type AttendanceSummary = {
  total: number;
  present: number;
  absent: number;
  late: number;
  presentPct: number;
  absentPct: number;
  latePct: number;
};

function toIsoDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function classDisplay(c: Pick<ClassItem, "name" | "section">) {
  return `${c.name}-${c.section}`;
}

function calcAttendanceSummary(items: AttendanceItem[]): AttendanceSummary {
  const total = items.length;
  const present = items.filter((x) => x.status === "PRESENT").length;
  const absent = items.filter((x) => x.status === "ABSENT").length;
  const late = items.filter((x) => x.status === "LATE").length;

  const pct = (v: number) => (total === 0 ? 0 : Math.round((v / total) * 1000) / 10);

  return {
    total,
    present,
    absent,
    late,
    presentPct: pct(present),
    absentPct: pct(absent),
    latePct: pct(late),
  };
}

function mean(nums: number[]) {
  if (!nums.length) return 0;
  const sum = nums.reduce((a, b) => a + b, 0);
  return Math.round((sum / nums.length) * 10) / 10;
}

const Reports = () => {
  const [tab, setTab] = useState<"attendance" | "student" | "subject">("attendance");

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loadingRef, setLoadingRef] = useState(true);
  const [refError, setRefError] = useState<string | null>(null);

  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  const today = useMemo(() => toIsoDate(new Date()), []);
  const [fromDate, setFromDate] = useState<string>(today);
  const [toDate, setToDate] = useState<string>(today);

  const selectedClass = useMemo(() => {
    return classes.find((c) => c._id === selectedClassId) || null;
  }, [classes, selectedClassId]);

  const classNameForAttendance = useMemo(() => {
    if (!selectedClass) return "";
    return classDisplay(selectedClass);
  }, [selectedClass]);

  const classNameFilterStudents = useMemo(() => {
    return classNameForAttendance;
  }, [classNameForAttendance]);

  const filteredStudents = useMemo(() => {
    const cn = classNameFilterStudents.trim();
    if (!cn) return students;
    return students.filter((s) => String(s.className || "").trim() === cn);
  }, [students, classNameFilterStudents]);

  const selectedStudent = useMemo(() => {
    return students.find((s) => s._id === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  async function loadReferences() {
    setLoadingRef(true);
    setRefError(null);
    try {
      const [classesRes, studentsRes] = await Promise.all([
        apiRequest<any>("/api/classes"),
        apiRequest<any>("/api/students?limit=100"),
      ]);

      const cls: ClassItem[] = Array.isArray(classesRes?.data) ? classesRes.data : [];
      const studs: StudentItem[] = Array.isArray(studentsRes?.data) ? studentsRes.data : [];

      setClasses(cls);
      setStudents(studs);

      if (!selectedClassId && cls.length > 0) {
        setSelectedClassId(cls[0]._id);
      }
      if (!selectedStudentId && studs.length > 0) {
        setSelectedStudentId(studs[0]._id);
      }
    } catch (e: any) {
      setRefError(e?.message || "Failed to load reference data");
    } finally {
      setLoadingRef(false);
    }
  }

  useEffect(() => {
    loadReferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attendance per class
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [attendanceItems, setAttendanceItems] = useState<AttendanceItem[]>([]);

  async function runAttendanceReport() {
    if (!classNameForAttendance) {
      toast.error("Select a class");
      return;
    }

    const q = new URLSearchParams();
    if (fromDate.trim()) q.set("date", fromDate.trim());
    q.set("limit", "200");

    setAttendanceLoading(true);
    setAttendanceError(null);

    try {
      const res = await apiRequest<any>(`/api/teacher/attendance/class/${encodeURIComponent(classNameForAttendance)}?${q.toString()}`);
      const data: AttendanceItem[] = Array.isArray(res?.data) ? res.data : [];
      setAttendanceItems(data);
    } catch (e: any) {
      setAttendanceError(e?.message || "Failed to load attendance");
    } finally {
      setAttendanceLoading(false);
    }
  }

  const attendanceSummary = useMemo(() => calcAttendanceSummary(attendanceItems), [attendanceItems]);

  // Student performance
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentError, setStudentError] = useState<string | null>(null);
  const [studentResults, setStudentResults] = useState<ResultItem[]>([]);

  async function runStudentPerformance() {
    if (!selectedStudentId) {
      toast.error("Select a student");
      return;
    }

    setStudentLoading(true);
    setStudentError(null);

    try {
      const res = await apiRequest<any>(`/api/results?studentId=${encodeURIComponent(selectedStudentId)}&limit=100`);
      const data: ResultItem[] = Array.isArray(res?.data) ? res.data : [];
      setStudentResults(data);
    } catch (e: any) {
      setStudentError(e?.message || "Failed to load results");
    } finally {
      setStudentLoading(false);
    }
  }

  const studentPerformanceSummary = useMemo(() => {
    const marks = studentResults.map((r) => Number(r.marks) || 0);
    const avg = mean(marks);
    const passed = studentResults.filter((r) => r.status === "PASS").length;
    const failed = studentResults.filter((r) => r.status === "FAIL").length;

    const bySubject: Record<string, { marks: number[]; pass: number; fail: number }> = {};
    for (const r of studentResults) {
      const key = String(r.subject || "").trim() || "(unknown)";
      if (!bySubject[key]) bySubject[key] = { marks: [], pass: 0, fail: 0 };
      bySubject[key].marks.push(Number(r.marks) || 0);
      if (r.status === "PASS") bySubject[key].pass += 1;
      if (r.status === "FAIL") bySubject[key].fail += 1;
    }

    const subjects = Object.entries(bySubject)
      .map(([subject, v]) => ({
        subject,
        avgMarks: mean(v.marks),
        attempts: v.marks.length,
        pass: v.pass,
        fail: v.fail,
      }))
      .sort((a, b) => a.subject.localeCompare(b.subject));

    return {
      total: studentResults.length,
      avgMarks: avg,
      pass: passed,
      fail: failed,
      bySubject: subjects,
    };
  }, [studentResults]);

  // Subject analytics
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [subjectError, setSubjectError] = useState<string | null>(null);
  const [subjectResults, setSubjectResults] = useState<ResultItem[]>([]);

  const [subjectName, setSubjectName] = useState<string>("");

  async function runSubjectAnalytics() {
    const subj = subjectName.trim();
    if (!subj) {
      toast.error("Enter a subject name");
      return;
    }

    setSubjectLoading(true);
    setSubjectError(null);

    try {
      const res = await apiRequest<any>(`/api/results?subject=${encodeURIComponent(subj)}&limit=100`);
      const data: ResultItem[] = Array.isArray(res?.data) ? res.data : [];
      setSubjectResults(data);
    } catch (e: any) {
      setSubjectError(e?.message || "Failed to load results");
    } finally {
      setSubjectLoading(false);
    }
  }

  const subjectAnalyticsSummary = useMemo(() => {
    const marks = subjectResults.map((r) => Number(r.marks) || 0);
    const avg = mean(marks);
    const pass = subjectResults.filter((r) => r.status === "PASS").length;
    const fail = subjectResults.filter((r) => r.status === "FAIL").length;

    const byExam: Record<string, { marks: number[]; pass: number; fail: number }> = {};
    for (const r of subjectResults) {
      const key = String(r.examName || "").trim() || "(unknown)";
      if (!byExam[key]) byExam[key] = { marks: [], pass: 0, fail: 0 };
      byExam[key].marks.push(Number(r.marks) || 0);
      if (r.status === "PASS") byExam[key].pass += 1;
      if (r.status === "FAIL") byExam[key].fail += 1;
    }

    const exams = Object.entries(byExam)
      .map(([examName, v]) => ({
        examName,
        avgMarks: mean(v.marks),
        attempts: v.marks.length,
        pass: v.pass,
        fail: v.fail,
      }))
      .sort((a, b) => a.examName.localeCompare(b.examName));

    return {
      total: subjectResults.length,
      avgMarks: avg,
      pass,
      fail,
      byExam: exams,
    };
  }, [subjectResults]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Attendance and performance analytics.</p>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Button variant={tab === "attendance" ? "default" : "outline"} onClick={() => setTab("attendance")}>Attendance</Button>
            <Button variant={tab === "student" ? "default" : "outline"} onClick={() => setTab("student")}>Student Performance</Button>
            <Button variant={tab === "subject" ? "default" : "outline"} onClick={() => setTab("subject")}>Subject Analytics</Button>
          </div>

          <Button variant="outline" onClick={loadReferences} disabled={loadingRef}>
            {loadingRef ? "Refreshing..." : "Refresh Data"}
          </Button>
        </CardContent>
      </Card>

      {loadingRef ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">Loading reference data...</CardContent>
        </Card>
      ) : refError ? (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">{refError}</CardContent>
        </Card>
      ) : null}

      {tab === "attendance" ? (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {classDisplay(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>

              <div className="flex items-end">
                <Button onClick={runAttendanceReport} disabled={attendanceLoading} className="w-full">
                  {attendanceLoading ? "Loading..." : "Run Report"}
                </Button>
              </div>
            </div>

            {attendanceError ? (
              <div className="text-sm text-destructive">{attendanceError}</div>
            ) : null}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-3">
                  <div className="text-xs text-muted-foreground">Total records</div>
                  <div className="text-lg font-semibold">{attendanceSummary.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-xs text-muted-foreground">Present</div>
                  <div className="text-lg font-semibold">{attendanceSummary.present} ({attendanceSummary.presentPct}%)</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-xs text-muted-foreground">Absent</div>
                  <div className="text-lg font-semibold">{attendanceSummary.absent} ({attendanceSummary.absentPct}%)</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-xs text-muted-foreground">Late</div>
                  <div className="text-lg font-semibold">{attendanceSummary.late} ({attendanceSummary.latePct}%)</div>
                </CardContent>
              </Card>
            </div>

            <div className="text-sm text-muted-foreground">
              Note: the underlying API currently supports a single date filter for class attendance (`date`).
            </div>
          </CardContent>
        </Card>
      ) : tab === "student" ? (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Class (filter students)</Label>
                <Select value={selectedClassId} onValueChange={(v) => {
                  setSelectedClassId(v);
                  setSelectedStudentId("");
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {classDisplay(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Student</Label>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStudents.map((s) => (
                      <SelectItem key={s._id} value={s._id}>
                        {s.firstName} {s.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={runStudentPerformance} disabled={studentLoading} className="w-full">
                  {studentLoading ? "Loading..." : "Run Report"}
                </Button>
              </div>
            </div>

            {studentError ? (
              <div className="text-sm text-destructive">{studentError}</div>
            ) : null}

            <div className="text-sm text-muted-foreground">
              {selectedStudent ? `Selected: ${selectedStudent.firstName} ${selectedStudent.lastName}` : ""}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-3">
                  <div className="text-xs text-muted-foreground">Attempts</div>
                  <div className="text-lg font-semibold">{studentPerformanceSummary.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-xs text-muted-foreground">Avg marks</div>
                  <div className="text-lg font-semibold">{studentPerformanceSummary.avgMarks}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-xs text-muted-foreground">Pass</div>
                  <div className="text-lg font-semibold">{studentPerformanceSummary.pass}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-xs text-muted-foreground">Fail</div>
                  <div className="text-lg font-semibold">{studentPerformanceSummary.fail}</div>
                </CardContent>
              </Card>
            </div>

            {studentPerformanceSummary.bySubject.length > 0 ? (
              <div className="space-y-2">
                <div className="font-semibold">By Subject</div>
                <div className="grid gap-2">
                  {studentPerformanceSummary.bySubject.map((row) => (
                    <Card key={row.subject}>
                      <CardContent className="p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div className="font-medium">{row.subject}</div>
                        <div className="text-sm text-muted-foreground">
                          Attempts: {row.attempts} • Avg: {row.avgMarks} • Pass: {row.pass} • Fail: {row.fail}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Subject name</Label>
                <Input value={subjectName} onChange={(e) => setSubjectName(e.target.value)} placeholder="Mathematics" />
              </div>

              <div className="flex items-end">
                <Button onClick={runSubjectAnalytics} disabled={subjectLoading} className="w-full">
                  {subjectLoading ? "Loading..." : "Run Report"}
                </Button>
              </div>
            </div>

            {subjectError ? (
              <div className="text-sm text-destructive">{subjectError}</div>
            ) : null}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-3">
                  <div className="text-xs text-muted-foreground">Attempts</div>
                  <div className="text-lg font-semibold">{subjectAnalyticsSummary.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-xs text-muted-foreground">Avg marks</div>
                  <div className="text-lg font-semibold">{subjectAnalyticsSummary.avgMarks}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-xs text-muted-foreground">Pass</div>
                  <div className="text-lg font-semibold">{subjectAnalyticsSummary.pass}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-xs text-muted-foreground">Fail</div>
                  <div className="text-lg font-semibold">{subjectAnalyticsSummary.fail}</div>
                </CardContent>
              </Card>
            </div>

            {subjectAnalyticsSummary.byExam.length > 0 ? (
              <div className="space-y-2">
                <div className="font-semibold">By Exam</div>
                <div className="grid gap-2">
                  {subjectAnalyticsSummary.byExam.map((row) => (
                    <Card key={row.examName}>
                      <CardContent className="p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div className="font-medium">{row.examName}</div>
                        <div className="text-sm text-muted-foreground">
                          Attempts: {row.attempts} • Avg: {row.avgMarks} • Pass: {row.pass} • Fail: {row.fail}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Reports;
