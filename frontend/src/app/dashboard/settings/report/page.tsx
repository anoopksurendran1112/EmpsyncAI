"use client";

import { useState, useEffect, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  FileText,
  Clock,
  User as UserIcon,
  Download,
  Search,
  Calendar,
  Filter,
  Users,
  Activity,
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

interface DailyLog {
  date: string;
  check_ins: string[];
  check_outs: string[];
  working_hours: number;
}

interface UserRecord {
  name: string;
  daily_logs: DailyLog[];
}

interface Employee {
  id: string | number;
  name: string;
}

interface AddressDetails {
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
}

interface EmployeeFullProfile {
  id: number;
  user: number;
  dob?: string | null;
  guardian_name?: string | null;
  guardian_phone?: string | null;
  religion_name?: string | null;
  caste_name?: string | null;
  staff_type?: string | null;
  staff_category?: string | null;
  ktu_id?: string | null;
  aicte_id?: string | null;
  pan_no?: string | null;
  aadhar_no?: string | null;
  blood_group?: string | null;
  alternate_mobile?: string | null;
  alternate_email?: string | null;
  present_address_details?: AddressDetails;
  permanent_address_details?: AddressDetails;
}

export default function ReportPage() {
  const { company } = useAuth();
  
  // State Management
  const [reportType, setReportType] = useState<"punch" | "profile">("punch");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd")
  });
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingEmployees, setFetchingEmployees] = useState(false);

  // Helper: Format Dates for Display (using raw UTC string, no local conversion)
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "--";
    try {
      // Extract YYYY-MM-DD part (ignore time and timezone)
      const datePart = dateStr.split('T')[0];
      const [year, month, day] = datePart.split('-');
      // Create UTC date to avoid timezone shift when formatting
      const utcDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
      return format(utcDate, "dd MMM yyyy");
    } catch {
      return dateStr;
    }
  };

  // Helper: Format Time for Display (extract time from UTC string, no conversion)
  const formatTime = (datetime: string) => {
    if (!datetime) return "--";
    try {
      // Extract the time part (supports both "T" and space separator)
      let timePart = datetime.includes('T') 
        ? datetime.split('T')[1] 
        : datetime.split(' ')[1];
      if (!timePart) return datetime;
      
      // Remove timezone offset (e.g., "+00:00", "Z", "-05:00")
      timePart = timePart.split('+')[0].split('Z')[0].split('-')[0];
      const [hours, minutes] = timePart.split(':');
      const hour = parseInt(hours, 10);
      const minute = minutes || '00';
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minute.padStart(2, '0')} ${ampm}`;
    } catch {
      return datetime;
    }
  };

  // Fetch Employees List
  const fetchEmployees = async () => {
    if (!company) return;
    setFetchingEmployees(true);
    try {
      const res = await fetch("/api/employee-report", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: company.id,
          report_type: "employee",
          employee: "all",
        }),
      });

      if (!res.ok) throw new Error("Failed to fetch staff");
      const list = await res.json();
      setEmployees(list.map((emp: any) => ({
        id: String(emp.id),
        name: `${emp.first_name} ${emp.last_name}`,
        email: emp.email,
        role: emp.role
      })));
    } catch (err) {
      console.error(err);
      toast.error("Could not load employee list");
    } finally {
      setFetchingEmployees(false);
    }
  };

  // Main Data Fetcher
  const fetchReport = async () => {
    if (!company) return;
    if (reportType === "punch" && (!dateRange.start || !dateRange.end)) {
      toast.error("Please select a valid date range");
      return;
    }

    setLoading(true);
    setData([]);
    try {
      const payload: any = {
        company_id: company.id,
        report_type: reportType === "profile" ? "employee" : "punch",
        employee: selectedEmployee
      };

      if (reportType === "punch") {
        payload.start_date = dateRange.start;
        payload.end_date = dateRange.end;
      }

      const res = await fetch("/api/employee-report", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to fetch report data");
      const result = await res.json();
      
      if (reportType === "punch") {
        setData(result.records || []);
      } else {
        setData(result || []);
      }
      
      toast.success(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report fetched`);
    } catch (err) {
      console.error(err);
      toast.error("Error generating report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [company]);

  // PDF Generation Logic (uses same formatTime/formatDisplayDate helpers)
  const downloadPDF = () => {
    if (!data.length) {
      toast.error("No data available for export");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const timestamp = format(new Date(), "dd MMM yyyy, hh:mm a");

    const drawHeader = (title: string) => {
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42);
      doc.text(title, 14, 22);
      
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Company: ${company?.name || "EmpSync Platform"}`, 14, 28);
      doc.text(`Generated: ${timestamp}`, 14, 33);
      
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 38, pageWidth - 14, 38);
    };

    if (reportType === "punch") {
      drawHeader("Punch & Attendance Report");
      doc.setFontSize(10);
      doc.text(`Range: ${formatDisplayDate(dateRange.start)} - ${formatDisplayDate(dateRange.end)}`, 14, 45);

      const tableData = data.flatMap((user) =>
        (user.daily_logs || []).map((log: any) => [
          user.name || "N/A",
          formatDisplayDate(log.date),
          (log.check_ins || []).map(formatTime).join("\n"),
          (log.check_outs || []).map(formatTime).join("\n"),
          log.working_hours || "0.0"
        ])
      );

      autoTable(doc, {
        startY: 50,
        head: [["Employee", "Date", "Check-Ins", "Check-Outs", "Hours"]],
        body: tableData,
        headStyles: { fillColor: [245, 245, 245], textColor: 50, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 },
        alternateRowStyles: { fillColor: [250, 250, 250] },
      });
    } else {
      if (selectedEmployee !== "all") {
        const emp = data[0];
        const profile = emp?.profile || {};
        const present = profile.present_address_details || {};
        const permanent = profile.permanent_address_details || {};

        drawHeader(`Employee Profile: ${emp.first_name} ${emp.last_name}`);

        let y = 45;
        const addSection = (title: string, rows: [string, string][]) => {
          doc.setFontSize(14);
          doc.setTextColor(15, 23, 42);
          doc.text(title, 14, y);
          y += 6;
          autoTable(doc, {
            startY: y,
            body: rows.map(([k, v]) => [k, v]),
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 2 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
            margin: { left: 14 },
          });
          y = (doc as any).lastAutoTable.finalY + 8;
        };

        addSection("Personal Details", [
          ["Date of Birth", profile.dob || "—"],
          ["Guardian Name", profile.guardian_name || "—"],
          ["Guardian Phone", profile.guardian_phone || "—"],
          ["Blood Group", profile.blood_group || "—"],
          ["Religion", profile.religion_name || "—"],
          ["Caste", profile.caste_name || "—"],
          ["Staff Type", profile.staff_type || "—"],
          ["Staff Category", profile.staff_category || "—"],
        ]);

        addSection("IDs & Contact", [
          ["KTU ID", profile.ktu_id || "—"],
          ["AICTE ID", profile.aicte_id || "—"],
          ["PAN Number", profile.pan_no || "—"],
          ["Aadhaar Number", profile.aadhar_no || "—"],
          ["Alternate Mobile", profile.alternate_mobile || "—"],
          ["Alternate Email", profile.alternate_email || "—"],
        ]);

        addSection("Present Address", [
          ["Address Line 1", present.address_line_1 || "—"],
          ["Address Line 2", present.address_line_2 || "—"],
          ["City", present.city || "—"],
          ["District", present.district || "—"],
          ["State", present.state || "—"],
          ["Country", present.country || "—"],
          ["Pincode", present.pincode || "—"],
        ]);

        addSection("Permanent Address", [
          ["Address Line 1", permanent.address_line_1 || "—"],
          ["Address Line 2", permanent.address_line_2 || "—"],
          ["City", permanent.city || "—"],
          ["District", permanent.district || "—"],
          ["State", permanent.state || "—"],
          ["Country", permanent.country || "—"],
          ["Pincode", permanent.pincode || "—"],
        ]);

      } else {
        drawHeader("Staff Profile Summary");
        const tableBody = data.map(emp => [
          emp.id,
          `${emp.first_name} ${emp.last_name}`,
          emp.role || "N/A",
          emp.group || "N/A",
          emp.mobile || "N/A",
          emp.profile?.aadhar_no || "N/A",
          emp.profile?.blood_group || "N/A",
          emp.profile?.dob || "N/A",
        ]);
        autoTable(doc, {
          startY: 45,
          head: [["ID", "Name", "Role", "Group", "Mobile", "Aadhaar", "Blood", "DOB"]],
          body: tableBody,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [245, 245, 245], textColor: 50 },
        });
      }
    }

    doc.save(`${reportType}_report_${company?.name || "export"}.pdf`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen bg-slate-50/30">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Employee Reports</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={downloadPDF}
            className="rounded-xl font-bold bg-green-500 hover:bg-green-600 text-white shadow-lg"
            disabled={data.length === 0}
          >
            <Download className="h-4 w-4 mr-2" /> Export PDF
          </Button>
        </div>
      </div>

      <Separator className="bg-slate-200" />

      <div className="space-y-8">
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-200">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Filter className="h-4 w-4 text-blue-600" /> Filter Dataset
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
              
              <div className="md:col-span-2 space-y-2">
                <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest flex items-center gap-2">
                  <Users className="h-3 w-3" /> Staff
                </Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger className="rounded-xl border-slate-200 h-10">
                    <SelectValue placeholder="Identify Staff" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all" className="font-bold">All Active Staff</SelectItem>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-4 space-y-2">
                <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest flex items-center gap-2">
                  <Activity className="h-3 w-3" /> Report Type
                </Label>
                <RadioGroup value={reportType} onValueChange={(v: any) => setReportType(v)} className="flex gap-2">
                  <div className={`flex-1 p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${reportType === "punch" ? "border-blue-200 bg-blue-50/30" : "border-slate-100 bg-white"}`}>
                     <RadioGroupItem value="punch" id="rp-punch" className="h-4 w-4" />
                     <Label htmlFor="rp-punch" className="font-bold text-xs cursor-pointer">Punch Data</Label>
                  </div>
                  <div className={`flex-1 p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${reportType === "profile" ? "border-purple-200 bg-purple-50/30" : "border-slate-100 bg-white"}`}>
                     <RadioGroupItem value="profile" id="rp-profile" className="h-4 w-4" />
                     <Label htmlFor="rp-profile" className="font-bold text-xs cursor-pointer">Profile</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className={`md:col-span-4 space-y-2 transition-opacity duration-300 ${reportType === "punch" ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest flex items-center gap-2">
                  <Calendar className="h-3 w-3" /> Date Range
                </Label>
                <div className="flex gap-2">
                   <Input 
                      type="date" 
                      value={dateRange.start}
                      onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                      className="rounded-xl border-slate-200 h-10 text-xs"
                    />
                   <Input 
                      type="date" 
                      value={dateRange.end}
                      onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                      className="rounded-xl border-slate-200 h-10 text-xs"
                    />
                </div>
              </div>

              <div className="md:col-span-2">
                <Button 
                  className="w-full h-10 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all" 
                  onClick={fetchReport}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                  Generate
                </Button>
              </div>

            </div>
          </CardContent>
        </Card>

        <Card className="w-full border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white min-h-[500px]">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Result</CardTitle>
            </div>
            {data.length > 0 && <Badge className="bg-green-50 text-green-700 border border-green-100">{data.length} Records</Badge>}
          </CardHeader>
          <CardContent className="p-0">
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-blue-50 border-t-blue-600 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-slate-500 font-bold animate-pulse">Processing temporal datasets...</p>
              </div>
            ) : data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center px-8">
                <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                   <FileText className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-slate-800 font-bold text-lg">No Results Prepared</h3>
                <p className="text-slate-500 max-w-xs mt-2 text-sm font-medium">Configure your matrix settings and click "Fetch Report" to generate the workforce dataset.</p>
              </div>
            ) : (
              <div className="overflow-auto max-h-[70vh]">
                {reportType === "punch" ? (
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-slate-50 z-10">
                      <tr>
                        <th className="p-4 text-left text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">Employee</th>
                        <th className="p-4 text-left text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">Audit Logs</th>
                        <th className="p-4 text-center text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">Total Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((user, idx) => (
                        <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 border-b border-slate-200 align-top">
                             <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100">
                                  {user.name?.charAt(0)}
                                </div>
                                <span className="font-bold text-slate-800 text-sm">{user.name}</span>
                             </div>
                           </td>
                          <td className="p-0 border-b border-slate-200">
                             <table className="w-full border-collapse">
                                <tbody>
                                  {user.daily_logs.map((log: any, logIdx: number) => (
                                    <tr key={`${idx}-${logIdx}`} className="">
                                      <td className="p-3 text-[11px] font-bold text-slate-600 w-32 border-b border-r border-l border-slate-200 last:border-b-0 hover:bg-blue-50/20">{formatDisplayDate(log.date)}</td>
                                      <td className="p-3 border-b border-r border-l border-slate-200 last:border-b-0 hover:bg-blue-50/20">
                                        <div className="flex flex-wrap gap-1.5">
                                          {(log.check_ins || []).map((t: any, i: number) => <Badge key={i} variant="outline" className="text-[10px] bg-green-50/50 text-green-700 border-green-100">IN: {formatTime(t)}</Badge>)}
                                          {(log.check_outs || []).map((t: any, i: number) => <Badge key={i} variant="outline" className="text-[10px] bg-rose-50/50 text-rose-700 border-rose-100">OUT: {formatTime(t)}</Badge>)}
                                        </div>
                                       </td>
                                      <td className="p-3 text-right text-[11px] font-bold text-slate-400 w-24 border-b border-r border-l border-slate-200 last:border-b-0 hover:bg-blue-50/20">
                                        {log.working_hours || "0.0"} <span className="text-[9px]">HRS</span>
                                       </td>
                                     </tr>
                                  ))}
                                </tbody>
                               </table>
                            </td>
                          <td className="p-4 border-b border-slate-200 text-center align-top">
                             <span className="text-sm font-bold text-blue-600">
                               {user.daily_logs.reduce((acc: number, log: any) => acc + (parseFloat(log.working_hours) || 0), 0).toFixed(1)}
                             </span>
                            </td>
                         </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  /* Profile Logic */
                  <div className="p-6">
                    {selectedEmployee !== "all" ? (
                      // Single employee – full detailed profile in one page, colored headings
                      data.map((emp, idx) => {
                        const profile = emp.profile || {};
                        const present = profile.present_address_details || {};
                        const permanent = profile.permanent_address_details || {};
                        return (
                          <div key={idx} className="space-y-6">
                            {/* Header */}
                            <div className="flex items-center gap-4 pb-4 border-b">
                              <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
                                <UserIcon className="h-8 w-8 text-purple-700" />
                              </div>
                              <div>
                                <h2 className="text-2xl font-bold">{emp.first_name} {emp.last_name}</h2>
                                <div className="flex gap-3 text-sm text-muted-foreground">
                                  <span>{emp.email}</span>
                                  <span>•</span>
                                  <span>{emp.mobile || "—"}</span>
                                </div>
                              </div>
                            </div>

                            {/* Personal Details - Green heading */}
                            <div>
                              <h3 className="text-xl font-semibold text-emerald-700 border-l-4 border-emerald-500 pl-3 mb-4">Personal Details</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 rounded-lg p-4">
                                <div><Label className="text-slate-500">Date of Birth</Label><p className="font-medium">{profile.dob || "—"}</p></div>
                                <div><Label className="text-slate-500">Blood Group</Label><p className="font-medium">{profile.blood_group || "—"}</p></div>
                                <div><Label className="text-slate-500">Guardian Name</Label><p className="font-medium">{profile.guardian_name || "—"}</p></div>
                                <div><Label className="text-slate-500">Guardian Phone</Label><p className="font-medium">{profile.guardian_phone || "—"}</p></div>
                                <div><Label className="text-slate-500">Religion</Label><p className="font-medium">{profile.religion_name || "—"}</p></div>
                                <div><Label className="text-slate-500">Caste</Label><p className="font-medium">{profile.caste_name || "—"}</p></div>
                                <div><Label className="text-slate-500">Staff Type</Label><p className="font-medium">{profile.staff_type || "—"}</p></div>
                                <div><Label className="text-slate-500">Staff Category</Label><p className="font-medium">{profile.staff_category || "—"}</p></div>
                              </div>
                            </div>

                            {/* IDs & Contact - Blue heading */}
                            <div>
                              <h3 className="text-xl font-semibold text-blue-700 border-l-4 border-blue-500 pl-3 mb-4">IDs & Contact</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 rounded-lg p-4">
                                <div><Label className="text-slate-500">KTU ID</Label><p className="font-medium">{profile.ktu_id || "—"}</p></div>
                                <div><Label className="text-slate-500">AICTE ID</Label><p className="font-medium">{profile.aicte_id || "—"}</p></div>
                                <div><Label className="text-slate-500">PAN Number</Label><p className="font-medium">{profile.pan_no || "—"}</p></div>
                                <div><Label className="text-slate-500">Aadhaar Number</Label><p className="font-medium">{profile.aadhar_no || "—"}</p></div>
                                <div><Label className="text-slate-500">Alternate Mobile</Label><p className="font-medium">{profile.alternate_mobile || "—"}</p></div>
                                <div><Label className="text-slate-500">Alternate Email</Label><p className="font-medium">{profile.alternate_email || "—"}</p></div>
                              </div>
                            </div>

                            {/* Present Address - Amber heading */}
                            <div>
                              <h3 className="text-xl font-semibold text-amber-700 border-l-4 border-amber-500 pl-3 mb-4">Present Address</h3>
                              <div className="bg-slate-50/50 rounded-lg p-4">
                                <div className="space-y-1">
                                  <p>{present.address_line_1 || "—"}</p>
                                  {present.address_line_2 && <p>{present.address_line_2}</p>}
                                  <p>{present.city}, {present.district}</p>
                                  <p>{present.state}, {present.country}</p>
                                  <p>Pincode: {present.pincode}</p>
                                </div>
                              </div>
                            </div>

                            {/* Permanent Address - Purple heading */}
                            <div>
                              <h3 className="text-xl font-semibold text-purple-700 border-l-4 border-purple-500 pl-3 mb-4">Permanent Address</h3>
                              <div className="bg-slate-50/50 rounded-lg p-4">
                                <div className="space-y-1">
                                  <p>{permanent.address_line_1 || "—"}</p>
                                  {permanent.address_line_2 && <p>{permanent.address_line_2}</p>}
                                  <p>{permanent.city}, {permanent.district}</p>
                                  <p>{permanent.state}, {permanent.country}</p>
                                  <p>Pincode: {permanent.pincode}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      // Multiple employees – summary cards with more fields
                      <div className="grid grid-cols-1 gap-6">
                        {data.map((emp, idx) => (
                          <div key={idx} className="bg-slate-50/50 rounded-xl p-6 border">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-bold text-lg">{emp.first_name} {emp.last_name}</h3>
                                <p className="text-sm text-muted-foreground">{emp.role || "—"} • {emp.email}</p>
                              </div>
                              <Badge>ID: {emp.id}</Badge>
                            </div>
                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              <div><span className="font-semibold">Mobile:</span> {emp.mobile || "—"}</div>
                              <div><span className="font-semibold">DOB:</span> {emp.profile?.dob || "—"}</div>
                              <div><span className="font-semibold">Blood:</span> {emp.profile?.blood_group || "—"}</div>
                              <div><span className="font-semibold">Aadhaar:</span> {emp.profile?.aadhar_no || "—"}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
/*"use client";

import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from "@/context/AuthContext";

interface DailyLog {
  date: string;
  check_ins: string[];
  check_outs: string[];
  working_hours: number;
}

interface UserRecord {
  name: string;
  daily_logs: DailyLog[];
}

export default function ReportPage() {
  const { company } = useAuth(); // ✅ get selected company
  const [data, setData] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<{ start_date: Date | null; end_date: Date | null }>({
    start_date: null,
    end_date: null,
  });

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    try {
      return format(new Date(date), "yyyy-MM-dd");
    } catch {
      return String(date);
    }
  };

  // Fetch Punch Report
  const fetchReport = async () => {
    if (!filters.start_date || !filters.end_date) {
      alert("Please select From Date and To Date");
      return;
    }

    if (!company) {
      alert("No company selected");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/report/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_date: formatDate(filters.start_date),
          to_date: formatDate(filters.end_date),
          company_id: company.id, // ✅ send selected company
        }),
      });

      if (!res.ok) throw new Error("Failed to fetch report");

      const result = await res.json();
      setData(result.records || []);
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Automatically fetch report whenever company changes
  useEffect(() => {
    if (company && filters.start_date && filters.end_date) {
      fetchReport();
    }
  }, [company]);

  // Download PDF
  const downloadPDF = () => {
    if (!data.length) {
      alert("No data to download");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Punch Report", 14, 15);
    doc.setFontSize(12);
    doc.text(
      `From: ${formatDate(filters.start_date)}  To: ${formatDate(filters.end_date)}`,
      14,
      25
    );

    autoTable(doc, {
      startY: 35,
      head: [["User", "Date", "Check-Ins", "Check-Outs", "Working Hours"]],
      body: data.flatMap(user =>
        (user.daily_logs || []).map(log => [
          user.name || "N/A",
          log.date || "-",
          (log.check_ins || []).join(", "),
          (log.check_outs || []).join(", "),
          log.working_hours || "-",
        ])
      ),
    });

    doc.save("punch_report.pdf");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Punch Report</h1>

      <div className="flex gap-2 mb-4 items-center">
        <DatePicker
          selected={filters.start_date}
          onChange={(date) => setFilters({ ...filters, start_date: date })}
          dateFormat="yyyy-MM-dd"
          placeholderText="From Date"
          className="border p-2 rounded"
        />
        <DatePicker
          selected={filters.end_date}
          onChange={(date) => setFilters({ ...filters, end_date: date })}
          dateFormat="yyyy-MM-dd"
          placeholderText="To Date"
          className="border p-2 rounded"
        />
        <button
          onClick={fetchReport}
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? "Fetching..." : "Fetch Report"}
        </button>
        <button
          onClick={downloadPDF}
          className="bg-green-500 text-white px-4 py-2 rounded"
          disabled={data.length === 0}
        >
          Download PDF
        </button>
      </div>

      {!loading && data.length === 0 && (
        <p className="text-gray-500">No records found</p>
      )}

      {data.length > 0 && (
        <div className="overflow-auto max-h-[60vh] border">
          <table className="border-collapse border border-gray-400 w-full min-w-[700px]">
            <thead>
              <tr>
                <th className="border p-2">User</th>
                <th className="border p-2">Date</th>
                <th className="border p-2">Check-Ins</th>
                <th className="border p-2">Check-Outs</th>
                <th className="border p-2">Working Hours</th>
              </tr>
            </thead>
            <tbody>
              {data.flatMap((user, idx) =>
                user.daily_logs.map((log, logIdx) => (
                  <tr key={`${idx}-${logIdx}`}>
                    <td className="border p-2">{user.name}</td>
                    <td className="border p-2">{log.date}</td>
                    <td className="border p-2">{(log.check_ins || []).join(", ")}</td>
                    <td className="border p-2">{(log.check_outs || []).join(", ")}</td>
                    <td className="border p-2">{log.working_hours || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}*/



