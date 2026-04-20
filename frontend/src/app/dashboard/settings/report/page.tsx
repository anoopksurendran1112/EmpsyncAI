"use client";

import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader, UserIcon, Phone, Home, MapPin, AlertTriangle, Eye } from "lucide-react";

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
  const [data, setData] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [filters, setFilters] = useState<{ start_date: string; end_date: string }>({
    start_date: "",
    end_date: "",
  });

  const [profileData, setProfileData] = useState<EmployeeFullProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const formatDisplayDate = (date: string) => {
    try {
      return format(new Date(date), "dd-MMM-yyyy");
    } catch {
      return date;
    }
  };

  const formatTime = (datetime: string) => {
    if (!datetime) return "-";
    try {
      const d = new Date(datetime);
      const hours = d.getUTCHours();
      const minutes = d.getUTCMinutes();
      const period = hours >= 12 ? "PM" : "AM";
      const hour12 = hours % 12 || 12;
      return `${hour12.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
    } catch {
      return datetime.split("T")[1]?.slice(0, 5) || datetime;
    }
  };

  // Fetch ALL employees using the employee-report endpoint (no pagination)
  const fetchEmployees = async () => {
    if (!company) return;
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

      if (!res.ok) throw new Error("Failed to fetch employees");
      const data = await res.json(); // data is an array of all employees

      const employeeList = data.map((emp: any) => ({
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`.trim(),
      }));

      setEmployees(employeeList);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setEmployees([]);
    }
  };

  // Fetch punch report (backend filters by employee)
  const fetchReport = async () => {
    if (!filters.start_date || !filters.end_date) {
      toast.error("Please select From Date and To Date");
      return;
    }
    if (!company) {
      toast.error("No company selected");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        company_id: company.id,
        report_type: "punch",
        start_date: filters.start_date,
        end_date: filters.end_date,
        employee: selectedEmployee === "all" ? "all" : Number(selectedEmployee),
      };

      const res = await fetch("/api/employee-report", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to fetch report");
      const result = await res.json();

      // Expected response: { records: [...] }
      const records = result.records || [];
      const normalizedRecords: UserRecord[] = records.map((emp: any) => ({
        name: emp.name,
        daily_logs: (emp.daily_logs || []).map((log: any) => ({
          date: log.date,
          check_ins: log.check_ins || [],
          check_outs: log.check_outs || [],
          working_hours: log.working_hours || 0,
        })),
      }));

      setData(normalizedRecords);
      if (normalizedRecords.length === 0 && selectedEmployee !== "all") {
        toast.info("No punch records for this employee in the selected date range.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not load report");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch employee profile
  const fetchEmployeeProfile = async () => {
    if (!company || selectedEmployee === "all") return;
    setProfileLoading(true);
    try {
      const res = await fetch(
        `/api/employee-profile?employee_id=${selectedEmployee}&company_id=${company.id}`,
        { credentials: "include", cache: "no-store" }
      );
      if (res.status === 404) {
        toast.info("No detailed profile found for this employee.");
        setProfileData(null);
        setShowProfileModal(true);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch profile");
      const result = await res.json();
      if (result.success && result.data) {
        setProfileData(result.data);
        setShowProfileModal(true);
      } else {
        throw new Error("Invalid profile data");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not load employee profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    if (company) fetchEmployees();
    else setEmployees([]);
  }, [company]);

  useEffect(() => {
    if (company && filters.start_date && filters.end_date) fetchReport();
  }, [company, filters.start_date, filters.end_date, selectedEmployee]);

  useEffect(() => {
    if (company && (!filters.start_date || !filters.end_date)) setData([]);
  }, [company, filters.start_date, filters.end_date]);

  const downloadPDF = () => {
    if (!data.length) {
      toast.error("No data to download");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Punch Report", 14, 15);
    doc.setFontSize(12);
    doc.text(
      `From: ${formatDisplayDate(filters.start_date)}  To: ${formatDisplayDate(filters.end_date)}`,
      14,
      25
    );
    if (selectedEmployee !== "all") {
      const empName = employees.find((e) => String(e.id) === selectedEmployee)?.name || selectedEmployee;
      doc.text(`Employee: ${empName}`, 14, 33);
    }

    autoTable(doc, {
      startY: selectedEmployee !== "all" ? 40 : 35,
      head: [["User", "Date", "Check-Ins", "Check-Outs", "Working Hours"]],
      body: data.flatMap((user) =>
        (user.daily_logs || []).map((log) => [
          user.name || "N/A",
          formatDisplayDate(log.date) || "-",
          (log.check_ins || []).map(formatTime).join(", "),
          (log.check_outs || []).map(formatTime).join(", "),
          log.working_hours || "-",
        ])
      ),
    });

    const companyName = (company as any)?.company_name || (company as any)?.name || "unknown";
    doc.save(`punch_report_${companyName}.pdf`);
  };

  const selectedEmployeeName = selectedEmployee !== "all"
    ? employees.find((e) => String(e.id) === selectedEmployee)?.name
    : null;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Punch Report</h1>

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          className="border p-2 rounded bg-white text-black"
        >
          <option value="all">All Employees</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filters.start_date}
          onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={filters.end_date}
          onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
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

        {selectedEmployee !== "all" && (
          <button
            onClick={fetchEmployeeProfile}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition flex items-center gap-2"
            disabled={profileLoading}
          >
            {profileLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            {profileLoading ? "Loading..." : "View Profile"}
          </button>
        )}
      </div>

      {!loading && data.length === 0 && filters.start_date && filters.end_date && (
        <p className="text-gray-500">No records found for the selected period and employee</p>
      )}

      {(!filters.start_date || !filters.end_date) && (
        <p className="text-gray-500">Please select both From Date and To Date</p>
      )}

      {data.length > 0 && (
        <div className="overflow-auto max-h-[60vh] border">
          <table className="border-collapse border border-gray-400 w-full min-w-[700px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 w-1/4">User</th>
                <th className="border p-2">Punch Records</th>
              </tr>
            </thead>
            <tbody>
              {data.map((user, idx) => (
                <tr key={idx} className="align-top">
                  <td className="border p-2 font-semibold">{user.name}</td>
                  <td className="border p-0">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-sm">
                          <th className="border-b border-r p-2 text-left">Date</th>
                          <th className="border-b border-r p-2 text-left">Check-Ins</th>
                          <th className="border-b border-r p-2 text-left">Check-Outs</th>
                          <th className="border-b p-2 text-left">Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {user.daily_logs.map((log, logIdx) => (
                          <tr key={`${idx}-${logIdx}`} className="hover:bg-gray-50 align-top">
                            <td className="border-b border-r p-2">{formatDisplayDate(log.date)}</td>
                            <td className="border-b border-r p-2 text-sm">
                              {log.check_ins.length > 0
                                ? log.check_ins.map((t, i) => <div key={i}>{formatTime(t)}</div>)
                                : <span className="text-gray-400">-</span>}
                            </td>
                            <td className="border-b border-r p-2 text-sm">
                              {log.check_outs.length > 0
                                ? log.check_outs.map((t, i) => <div key={i}>{formatTime(t)}</div>)
                                : <span className="text-gray-400">-</span>}
                            </td>
                            <td className="border-b p-2 text-center">{log.working_hours || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Employee Profile Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Employee Profile</DialogTitle>
            <DialogDescription>
              Detailed information for {selectedEmployeeName || "Employee"}
            </DialogDescription>
          </DialogHeader>

          {profileLoading ? (
            <div className="flex justify-center py-12">
              <Loader className="animate-spin h-6 w-6 text-blue-500" />
              <span className="ml-2">Loading profile...</span>
            </div>
          ) : !profileData ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg border">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-muted-foreground">No detailed profile found for this employee.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Personal Details */}
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-green-600" />
                    Personal Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Date of Birth</p>
                      <p className="text-sm font-medium">{profileData.dob || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Guardian Name</p>
                      <p className="text-sm font-medium">{profileData.guardian_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Guardian Phone</p>
                      <p className="text-sm font-medium">{profileData.guardian_phone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Blood Group</p>
                      <p className="text-sm font-medium">{profileData.blood_group || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Religion</p>
                      <p className="text-sm font-medium">{profileData.religion_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Caste</p>
                      <p className="text-sm font-medium">{profileData.caste_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Staff Type</p>
                      <p className="text-sm font-medium">{profileData.staff_type || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Staff Category</p>
                      <p className="text-sm font-medium">{profileData.staff_category || "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency & IDs */}
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-purple-600" />
                    Emergency & IDs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Alternate Mobile</p>
                      <p className="text-sm font-medium">{profileData.alternate_mobile || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Alternate Email</p>
                      <p className="text-sm font-medium">{profileData.alternate_email || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">PAN</p>
                      <p className="text-sm font-medium">{profileData.pan_no || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Aadhaar</p>
                      <p className="text-sm font-medium">{profileData.aadhar_no || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">KTU ID</p>
                      <p className="text-sm font-medium">{profileData.ktu_id || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">AICTE ID</p>
                      <p className="text-sm font-medium">{profileData.aicte_id || "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Present Address */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-blue-600" />
                    Present Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profileData.present_address_details ? (
                    <div className="text-sm">
                      {profileData.present_address_details.address_line_1}
                      <br />
                      {profileData.present_address_details.city}, {profileData.present_address_details.state}
                      <br />
                      Pincode: {profileData.present_address_details.pincode}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not provided</p>
                  )}
                </CardContent>
              </Card>

              {/* Permanent Address */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    Permanent Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profileData.permanent_address_details ? (
                    <div className="text-sm">
                      {profileData.permanent_address_details.address_line_1}
                      <br />
                      {profileData.permanent_address_details.city}, {profileData.permanent_address_details.state}
                      <br />
                      Pincode: {profileData.permanent_address_details.pincode}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not provided</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProfileModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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



