"use client";

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
  const { company } = useAuth();
  const [data, setData] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<{ start_date: Date | null; end_date: Date | null }>({
    start_date: null,
    end_date: null,
  });

  // ✅ Format date for API (yyyy-MM-dd)
  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    try {
      return format(new Date(date), "yyyy-MM-dd");
    } catch {
      return String(date);
    }
  };

  // ✅ Format for display (dd-MMM-yyyy)
  const formatDisplayDate = (date: string) => {
    try {
      return format(new Date(date), "dd-MMM-yyyy");
    } catch {
      return date;
    }
  };

  // ✅ UPDATED: Format time in 12-hour format (HH:mm AM/PM) - Same as punches page
  const formatTime = (datetime: string) => {
    if (!datetime) return "-";
    
    try {
      // If we have the original string, extract time directly from it
      const timePart = datetime.split('T')[1]?.replace('Z', '');
      if (timePart) {
        const [hours, minutes, seconds] = timePart.split(':');
        const hourNum = parseInt(hours);
        const minuteNum = parseInt(minutes);
        
        // Convert to 12-hour format
        const period = hourNum >= 12 ? 'PM' : 'AM';
        const hour12 = hourNum % 12 || 12;
        
        return `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
      }
    } catch (e) {
      console.log("Failed to parse time from string:", e);
    }
    
    // Fallback: use the Date object with UTC methods
    try {
      const d = new Date(datetime);
      const hours = d.getUTCHours();
      const minutes = d.getUTCMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12;
      
      return `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch {
      return datetime.replace("+00:00", "").split("T")[1] || datetime;
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
          company_id: company.id,
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

  // ✅ Fixed: Automatically fetch report when company OR date filters change
  useEffect(() => {
    if (company && filters.start_date && filters.end_date) {
      fetchReport();
    }
  }, [company, filters.start_date, filters.end_date]); // ✅ Added proper dependencies

  // ✅ Clear data when company changes but dates aren't set
  useEffect(() => {
    if (company && (!filters.start_date || !filters.end_date)) {
      setData([]);
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
      `From: ${formatDisplayDate(String(filters.start_date))}  To: ${formatDisplayDate(
        String(filters.end_date)
      )}`,
      14,
      25
    );

    autoTable(doc, {
      startY: 35,
      head: [["User", "Date", "Check-Ins", "Check-Outs", "Working Hours"]],
      body: data.flatMap(user =>
        (user.daily_logs || []).map(log => [
          user.name || "N/A",
          formatDisplayDate(log.date) || "-",
          (log.check_ins || []).map(formatTime).join(", "),
          (log.check_outs || []).map(formatTime).join(", "),
          log.working_hours || "-",
        ])
      ),
    });

    doc.save(`punch_report_${company?.name || "unknown"}.pdf`);
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

      {!loading && data.length === 0 && filters.start_date && filters.end_date && (
        <p className="text-gray-500">No records found for the selected period and company</p>
      )}

      {!filters.start_date || !filters.end_date ? (
        <p className="text-gray-500">Please select both From Date and To Date</p>
      ) : null}

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
                    <td className="border p-2">{formatDisplayDate(log.date)}</td>
                    <td className="border p-2">
                      {(log.check_ins || []).map(formatTime).join(", ")}
                    </td>
                    <td className="border p-2">
                      {(log.check_outs || []).map(formatTime).join(", ")}
                    </td>
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



