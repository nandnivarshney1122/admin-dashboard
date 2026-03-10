import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

import { apiRequest } from "@/lib/api";

type FeeRow = {
  _id: string;
  studentId: string;
  totalAmount?: number;
  paidAmount?: number;
  balanceAmount?: number;
  status?: string;
  createdAt?: string;
};

type ResultRow = {
  _id: string;
  studentId: string;
  examName: string;
  subject: string;
  marks: number;
  grade?: string;
  status: "PASS" | "FAIL";
  createdAt?: string;
};

const StudentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [fees, setFees] = useState<FeeRow[]>([]);
  const [feesLoading, setFeesLoading] = useState(true);
  const [feesError, setFeesError] = useState<string | null>(null);

  const [results, setResults] = useState<ResultRow[]>([]);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [resultsError, setResultsError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [className, setClassName] = useState("");
  const [phone, setPhone] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [admissionId, setAdmissionId] = useState("");

  const fullName = useMemo(() => `${firstName} ${lastName}`.trim(), [firstName, lastName]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const res = await apiRequest<any>(`/api/students/${id}`);
        const s = res?.data;

        if (mounted) {
          setStudent(s);
          setFirstName(s?.firstName || "");
          setLastName(s?.lastName || "");
          setEmail(s?.email || "");
          setClassName(s?.className || "");
          setPhone(s?.phone || "");
          setRollNumber(s?.rollNumber || "");
          setAdmissionId(s?.admissionId || "");
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load student");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    let mounted = true;

    async function loadStudentRelated() {
      if (!id) return;

      try {
        setFeesLoading(true);
        setFeesError(null);
        const feesRes = await apiRequest<any>(`/api/fees/student/${encodeURIComponent(id)}?limit=200`);
        const feeItems: FeeRow[] = Array.isArray(feesRes?.data) ? feesRes.data : [];
        if (mounted) setFees(feeItems);
      } catch (e: any) {
        if (mounted) setFeesError(e?.message || "Failed to load fees");
      } finally {
        if (mounted) setFeesLoading(false);
      }

      try {
        setResultsLoading(true);
        setResultsError(null);
        const res = await apiRequest<any>(`/api/results/student/${encodeURIComponent(id)}?limit=200`);
        const items: ResultRow[] = Array.isArray(res?.data) ? res.data : [];
        if (mounted) setResults(items);
      } catch (e: any) {
        if (mounted) setResultsError(e?.message || "Failed to load results");
      } finally {
        if (mounted) setResultsLoading(false);
      }
    }

    loadStudentRelated();

    return () => {
      mounted = false;
    };
  }, [id]);

  const handleSaveProfile = async () => {
    if (!id) return;
    const fn = firstName.trim();
    const ln = lastName.trim();
    const em = email.trim();
    const cn = className.trim();

    if (!fn || !ln || !em || !cn) {
      toast.error("firstName, lastName, email, className are required");
      return;
    }

    try {
      setSaving(true);
      const res = await apiRequest<any>(`/api/students/${id}`, {
        method: "PUT",
        body: {
          firstName: fn,
          lastName: ln,
          email: em,
          className: cn,
          phone: phone.trim() || undefined,
          rollNumber: rollNumber.trim() || undefined,
          admissionId: admissionId.trim() || undefined,
        },
      });

      setStudent(res?.data || null);
      toast.success("Student updated");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update student");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
            <h1 className="text-2xl font-bold font-display">Student Profile</h1>
            <p className="text-muted-foreground">ID: {id} • {loading ? 'Loading...' : fullName || '-'}</p>
        </div>
      </div>

      {error ? (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="marks">Marks</TabsTrigger>
        </TabsList>

        {/* --- Profile Tab --- */}
        <TabsContent value="profile" className="mt-6 space-y-4">
            <Card>
                <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1"><Label>First Name</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
                    <div className="space-y-1"><Label>Last Name</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
                    <div className="space-y-1"><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                    <div className="space-y-1"><Label>Class</Label><Input value={className} onChange={(e) => setClassName(e.target.value)} /></div>
                    <div className="space-y-1"><Label>Roll Number</Label><Input value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} /></div>
                    <div className="space-y-1"><Label>Admission ID</Label><Input value={admissionId} onChange={(e) => setAdmissionId(e.target.value)} /></div>
                    <div className="space-y-1"><Label>Residence</Label>
                        <Select defaultValue="Day Scholar"><SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent><SelectItem value="Hostel">Hostel</SelectItem><SelectItem value="Day Scholar">Day Scholar</SelectItem></SelectContent></Select>
                    </div>
                    <div className="space-y-1"><Label>Status</Label><Input value={student?.status || ''} disabled /></div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1"><Label>Primary Contact</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                    <div className="space-y-1"><Label>Secondary Contact</Label><Input placeholder="Secondary Number" /></div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={saving || loading}>
                <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
        </TabsContent>

        {/* --- Fees Tab --- */}
        <TabsContent value="fees" className="mt-6">
             <Card>
                <CardHeader><CardTitle>Fee Structure</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {feesLoading ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
                    ) : feesError ? (
                      <p className="text-sm text-destructive text-center py-4">{feesError}</p>
                    ) : fees.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No fee records found.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Paid</TableHead>
                            <TableHead>Balance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fees.map((f) => (
                            <TableRow key={f._id}>
                              <TableCell>{String(f.status || "-")}</TableCell>
                              <TableCell>{Number(f.totalAmount ?? 0).toLocaleString()}</TableCell>
                              <TableCell>{Number(f.paidAmount ?? 0).toLocaleString()}</TableCell>
                              <TableCell>{Number(f.balanceAmount ?? 0).toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                </CardContent>
             </Card>
        </TabsContent>

        {/* --- Marks Tab --- */}
        <TabsContent value="marks" className="mt-6 space-y-6">
          <Card>
            <CardHeader><CardTitle>Results</CardTitle></CardHeader>
            <CardContent>
              {resultsLoading ? (
                <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
              ) : resultsError ? (
                <p className="text-sm text-destructive text-center py-4">{resultsError}</p>
              ) : results.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No results found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exam</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((r) => (
                      <TableRow key={r._id}>
                        <TableCell>{r.examName}</TableCell>
                        <TableCell>{r.subject}</TableCell>
                        <TableCell>{Number(r.marks ?? 0)}</TableCell>
                        <TableCell>{r.grade || "-"}</TableCell>
                        <TableCell>{r.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentDetails;