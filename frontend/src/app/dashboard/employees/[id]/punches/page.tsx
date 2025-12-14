// src/app/dashboard/employees/[id]/punches/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useParams, useSearchParams } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parseISO, differenceInMinutes } from "date-fns";
import Link from "next/link";
import { ArrowLeft, UserIcon, Activity, ArrowUpCircle, ArrowDownCircle, Clock } from "lucide-react";
import Image from "next/image";
import { useEmployee } from "@/hooks/employees/useGetEmployee";
import FixPunch from "@/components/fix-punch";

// TimeCircle component
function TimeCircle({ checkIn, checkOut, size = 70 }: {
  checkIn: string;
  checkOut: string;
  size?: number
}) {
  const calculateWorkHours = (checkIn: string, checkOut: string): string => {
    if (checkIn === "-" || checkOut === "-" || checkIn === "--" || checkOut === "--") return "--";

    try {
      const parseTime = (timeStr: string): Date => {
        if (timeStr.includes('AM') || timeStr.includes('PM')) {
          const [time, period] = timeStr.split(' ');
          const [hours, minutes] = time.split(':');

          let hour = parseInt(hours);
          const minute = parseInt(minutes);

          if (period === 'PM' && hour !== 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;

          const date = new Date();
          date.setUTCHours(hour, minute, 0, 0);
          return date;
        } else {
          const [hours, minutes] = timeStr.split(':');
          const hour = parseInt(hours);
          const minute = parseInt(minutes);

          const date = new Date();
          date.setUTCHours(hour, minute, 0, 0);
          return date;
        }
      };

      const inTime = parseTime(checkIn);
      const outTime = parseTime(checkOut);

      let adjustedOutTime = new Date(outTime);
      if (adjustedOutTime < inTime) {
        adjustedOutTime.setUTCDate(adjustedOutTime.getUTCDate() + 1);
      }

      const totalMinutes = differenceInMinutes(adjustedOutTime, inTime);

      if (totalMinutes <= 0) return "--";

      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;

      const decimalHours = hours + (mins / 60);
      return decimalHours.toFixed(2);
    } catch {
      return "--";
    }
  };

  const calculateCurrentWorkHours = (checkIn: string): string => {
    if (checkIn === "-" || checkIn === "--") return "--";

    try {
      const now = new Date();
      const parseTime = (timeStr: string): Date => {
        if (timeStr.includes('AM') || timeStr.includes('PM')) {
          const [time, period] = timeStr.split(' ');
          const [hours, minutes] = timeStr.split(':');

          let hour = parseInt(hours);
          const minute = parseInt(minutes);

          if (period === 'PM' && hour !== 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;

          const date = new Date();
          date.setUTCHours(hour, minute, 0, 0);
          return date;
        } else {
          const [hours, minutes] = timeStr.split(':');
          const hour = parseInt(hours);
          const minute = parseInt(minutes);

          const date = new Date();
          date.setUTCHours(hour, minute, 0, 0);
          return date;
        }
      };

      const inTime = parseTime(checkIn);
      const totalMinutes = differenceInMinutes(now, inTime);

      if (totalMinutes <= 0) return "--";

      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;

      const decimalHours = hours + (mins / 60);
      return decimalHours.toFixed(2);
    } catch {
      return "--";
    }
  };

  const totalHours = checkOut === "-" || checkOut === "--"
    ? calculateCurrentWorkHours(checkIn)
    : calculateWorkHours(checkIn, checkOut);

  const hasValidData = totalHours !== "--" && !isNaN(parseFloat(totalHours));

  const calculateProgress = () => {
    if (!hasValidData) return 0;

    try {
      const hours = parseFloat(totalHours);
      const progress = Math.min((hours / 8) * 100, 100);
      return progress;
    } catch {
      return 0;
    }
  };

  const progress = calculateProgress();
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {hasValidData && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={progress >= 100 ? "#10b981" : "#3b82f6"}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500 ease-in-out"
            />
          )}
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-sm font-bold text-gray-900">
              {hasValidData ? totalHours : "--"}
            </div>
            <div className="text-[10px] text-gray-500 font-medium">
              HRS
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to extract time from datetime string
const extractTime = (datetime: string | null): string => {
  if (!datetime) return "-";
  
  try {
    // Handle format like "2025-12-13 06:36:57" (multi-mode)
    if (datetime.includes(' ') && datetime.includes(':')) {
      const parts = datetime.split(' ');
      if (parts.length >= 2) {
        const timePart = parts[1];
        const [hours, minutes] = timePart.split(':');
        const hourNum = parseInt(hours);
        
        // Convert to 12-hour format
        const period = hourNum >= 12 ? 'PM' : 'AM';
        const hour12 = hourNum % 12 || 12;
        
        return `${hour12.toString().padStart(2, '0')}:${minutes} ${period}`;
      }
    }
    
    // Handle ISO format like "2025-12-12T09:23:25Z" (single-mode)
    if (datetime.includes('T') && datetime.includes('Z')) {
      const date = new Date(datetime);
      if (!isNaN(date.getTime())) {
        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        
        return `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
      }
    }
    
    // Handle ISO format without Z
    if (datetime.includes('T') && datetime.includes(':')) {
      const date = new Date(datetime);
      if (!isNaN(date.getTime())) {
        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        
        return `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
      }
    }
    
    return datetime;
  } catch {
    return "-";
  }
};

// Helper to calculate session duration
const calculateSessionDuration = (start: string, end: string): string => {
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  } catch {
    return "-";
  }
};

// Helper to calculate total work time for a day
const calculateTotalWorkTimeForDay = (punches: any[]): number => {
  try {
    let totalMinutes = 0;
    
    // Group into sessions and calculate each session duration
    let sessionStart: Date | null = null;
    
    punches.forEach((punch) => {
      if (punch.status === "Check-In" || punch.status === "pending") {
        sessionStart = new Date(punch.punch_time);
      } else if (punch.status === "Check-Out" && sessionStart) {
        const sessionEnd = new Date(punch.punch_time);
        const diffMs = sessionEnd.getTime() - sessionStart.getTime();
        totalMinutes += Math.floor(diffMs / 60000);
        sessionStart = null;
      }
    });
    
    return totalMinutes;
  } catch {
    return 0;
  }
};

// Helper to format duration
const formatDuration = (minutes: number): string => {
  if (!minutes || minutes <= 0) return "-";
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
};

// Component to display multiple punch sessions in table format
const MultiPunchTableDisplay = ({ punches, dateKey, totalWorkTime }: { punches: any[], dateKey: string, totalWorkTime: number }) => {
  if (!punches || punches.length === 0) {
    return (
      <>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
      </>
    );
  }

  // Group punches into sessions (check-in followed by check-out)
  const sessions = [];
  let currentSession: any[] = [];
  
  for (let i = 0; i < punches.length; i++) {
    const punch = punches[i];
    
    if (punch.status === "Check-In" || punch.status === "pending") {
      // Start new session
      if (currentSession.length > 0) {
        sessions.push([...currentSession]);
        currentSession = [];
      }
      currentSession.push(punch);
    } else if (punch.status === "Check-Out" && currentSession.length > 0) {
      // Add check-out to current session
      currentSession.push(punch);
      sessions.push([...currentSession]);
      currentSession = [];
    }
  }
  
  // Handle any remaining session (pending check-out)
  if (currentSession.length > 0) {
    sessions.push(currentSession);
  }

  return (
    <>
      <td className="px-6 py-4">
        <div className="space-y-1">
          {sessions.map((session, sessionIndex) => (
            <div key={sessionIndex} className="text-sm text-gray-900">
              {session[0]?.punch_time ? extractTime(session[0].punch_time) : "-"}
            </div>
          ))}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-1">
          {sessions.map((session, sessionIndex) => (
            <div key={sessionIndex} className="text-sm text-gray-900">
              {session[1]?.punch_time ? extractTime(session[1].punch_time) : "-"}
            </div>
          ))}
        </div>
      </td>
    </>
  );
};

export default function EmployeePunchPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const { company } = useAuth();

  const [punches, setPunches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [employee, setEmployee] = useState<any>(null);
  const [averageWorkTime, setAverageWorkTime] = useState<string>("-");
  const [imageError, setImageError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todaysPunch, setTodaysPunch] = useState<any>(null);
  const [multiMode, setMultiMode] = useState<boolean>(false);
  const [todaysStatus, setTodaysStatus] = useState<string>("No punches recorded");

  const biometricIdFromQuery = searchParams.get('biometric_id');
  const { data: employeeData, isLoading: employeeLoading } = useEmployee(company?.id, id as string);

  useEffect(() => {
    if (employeeData) {
      setEmployee(employeeData);
    } else if (!employeeLoading && id) {
      setEmployee({
        id: id as string,
        first_name: "Employee",
        last_name: "",
        biometric_id: id as string
      });
    }
  }, [employeeData, employeeLoading, id, biometricIdFromQuery]);

  const getProfileImageUrl = (emp: any) => {
    if (!emp?.prof_img) return null;

    if (emp.prof_img.startsWith("http")) {
      return emp.prof_img;
    }

    return company?.mediaBaseUrl
      ? `${company.mediaBaseUrl}${emp.prof_img}`
      : emp.prof_img;
  };

const formatTimeDirect = useCallback((originalTimeString?: string | null): string => {
  if (!originalTimeString) return "-";

  if (originalTimeString === "null" || originalTimeString === "undefined" || originalTimeString.trim() === "") {
    return "-";
  }

  if (originalTimeString.includes('05:30:00') || originalTimeString.includes('T05:30:00Z')) {
    return "-";
  }

  // Handle time-only strings like "08:20:51" (from partial punch records)
  if (originalTimeString.includes(':') && !originalTimeString.includes('T') && !originalTimeString.includes(' ') && !originalTimeString.includes('AM') && !originalTimeString.includes('PM')) {
    try {
      const [hours, minutes, seconds] = originalTimeString.split(':');
      const hourNum = parseInt(hours);
      
      if (isNaN(hourNum)) return originalTimeString;
      
      const period = hourNum >= 12 ? 'PM' : 'AM';
      const hour12 = hourNum % 12 || 12;
      
      return `${hour12.toString().padStart(2, '0')}:${minutes} ${period}`;
    } catch (e) {
      console.log("Failed to parse time-only string:", e);
      return originalTimeString;
    }
  }

  // Handle format like "2025-12-13 06:36:57" (multi-mode)
  if (originalTimeString.includes(' ') && originalTimeString.includes(':')) {
    try {
      const parts = originalTimeString.split(' ');
      if (parts.length >= 2) {
        const timePart = parts[1];
        const [hours, minutes] = timePart.split(':');
        const hourNum = parseInt(hours);

        const period = hourNum >= 12 ? 'PM' : 'AM';
        const hour12 = hourNum % 12 || 12;

        return `${hour12.toString().padStart(2, '0')}:${minutes} ${period}`;
      }
    } catch (e) {
      console.log("Failed to parse datetime string:", e);
    }
  }

  // Handle ISO format like "2025-12-12T09:23:25Z" (single-mode)
  if (originalTimeString.includes('T') && originalTimeString.includes('Z')) {
    try {
      const date = new Date(originalTimeString);
      if (!isNaN(date.getTime())) {
        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        
        // Check for placeholder time
        if (hours === 5 && minutes === 30) {
          return "-";
        }
        
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        
        return `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
      }
    } catch (e) {
      console.log("Failed to parse ISO string:", e);
    }
  }

  // Handle ISO format without Z
  if (originalTimeString.includes('T') && originalTimeString.includes(':')) {
    try {
      const date = new Date(originalTimeString);
      if (!isNaN(date.getTime())) {
        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        
        return `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
      }
    } catch (e) {
      console.log("Failed to parse ISO string:", e);
    }
  }

  // If it's already in the correct format (has AM/PM), return as is
  if (originalTimeString.includes('AM') || originalTimeString.includes('PM')) {
    return originalTimeString;
  }

  return originalTimeString;
}, []);

  const fetchTodaysPunch = useCallback(async (biometricId: string) => {
    if (!company) return null;

    try {
      const today = format(new Date(), "yyyy-MM-dd");

      const res = await fetch("/api/punch/todaypunch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          biometric_id: biometricId,
          company_id: company.id,
          start_date: today,
          end_date: today,
          user_id: biometricId,
        }),
      });

      if (res.ok) {
        const todayData = await res.json();
        console.log("📅 Today's punch data:", todayData);

        const filterPlaceholderTimes = (timeString: string | null) => {
          if (!timeString) return null;

          if (timeString.includes('T05:30:00Z') ||
            timeString.includes(' 05:30:00') ||
            (timeString.includes('05:30') && !timeString.includes('17:30'))) {
            return null;
          }

          return timeString;
        };

        const processedTodayData = {
          ...todayData,
          first_check_in: filterPlaceholderTimes(todayData.first_check_in),
          last_check_out: filterPlaceholderTimes(todayData.last_check_out),
          punch_sessions: todayData.punch_sessions?.filter((session: any) => {
            const checkInTime = session.check_in || session.in_time;
            const checkOutTime = session.check_out || session.out_time;

            const hasValidCheckIn = checkInTime && !checkInTime.includes('T05:30:00Z');
            const hasValidCheckOut = checkOutTime && !checkOutTime.includes('T05:30:00Z');

            return hasValidCheckIn || hasValidCheckOut;
          }) || []
        };

        return processedTodayData;
      } else {
        console.log("❌ Today's punch API failed with status:", res.status);
        return {
          first_check_in: null,
          last_check_out: null,
        };
      }
    } catch (error) {
      console.error("Error fetching today's punch:", error);
      return {
        first_check_in: null,
        last_check_out: null,
      };
    }
  }, [company]);

  const formatMinutesToTime = useCallback((minutes: number): string => {
    if (minutes <= 0) return "-";

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins}m`;
    }

    return `${hours}h ${mins}m`;
  }, []);

  // Fetch all pages of punches with pagination
  const fetchAllPunches = useCallback(async (payload: any): Promise<{punches: any[], isMultiMode: boolean}> => {
    let allPunches: any[] = [];
    let currentPage = 1;
    let hasMorePages = true;
    const maxPages = 10;
    let detectedMultiMode = false;

    while (hasMorePages && currentPage <= maxPages) {
      try {
        const pagePayload = { ...payload, page: currentPage };

        const res = await fetch("/api/punch/page", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pagePayload),
        });

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        const apiData = await res.json();
        
        let pagePunches: any[] = [];
        
        if (apiData.data && Array.isArray(apiData.data)) {
          pagePunches = apiData.data;
        } else if (Array.isArray(apiData)) {
          pagePunches = apiData;
        }
        
        // Check multi_mode from API response
        if (apiData.multi_mode !== undefined) {
          detectedMultiMode = apiData.multi_mode === true;
        }
        
        if (pagePunches.length === 0) {
          hasMorePages = false;
        } else {
          allPunches = [...allPunches, ...pagePunches];
          currentPage++;

          // Check if there are more pages
          if (apiData.total_page && currentPage > apiData.total_page) {
            hasMorePages = false;
          }
          if (apiData.last_page && currentPage > apiData.last_page) {
            hasMorePages = false;
          }
          if (apiData.page && apiData.total_page && currentPage > apiData.total_page) {
            hasMorePages = false;
          }
        }
      } catch (error) {
        console.error(`Error fetching page ${currentPage}:`, error);
        throw error;
      }
    }

    console.log(`📊 Fetched ${allPunches.length} punches from ${currentPage - 1} pages, multi_mode: ${detectedMultiMode}`);
    return { punches: allPunches, isMultiMode: detectedMultiMode };
  }, []);

  // Calculate work time in minutes for single mode
  const calculateWorkTime = useCallback((punchIn: string, punchOut: string): number => {
    if (punchIn === "-" || punchOut === "-") return 0;

    try {
      const parseUTCTime = (timeStr: string): Date => {
        if (timeStr.includes('AM') || timeStr.includes('PM')) {
          const [time, period] = timeStr.split(' ');
          const [hours, minutes] = time.split(':');

          let hour = parseInt(hours);
          const minute = parseInt(minutes);

          if (period === 'PM' && hour !== 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;

          const date = new Date();
          date.setUTCHours(hour, minute, 0, 0);
          return date;
        } else {
          const [hours, minutes] = timeStr.split(':');
          const hour = parseInt(hours);
          const minute = parseInt(minutes);

          const date = new Date();
          date.setUTCHours(hour, minute, 0, 0);
          return date;
        }
      };

      const inTime = parseUTCTime(punchIn);
      const outTime = parseUTCTime(punchOut);

      let adjustedOutTime = new Date(outTime);
      if (adjustedOutTime < inTime) {
        adjustedOutTime.setUTCDate(adjustedOutTime.getUTCDate() + 1);
      }

      return differenceInMinutes(adjustedOutTime, inTime);
    } catch (error) {
      console.error("Error calculating work time:", error);
      return 0;
    }
  }, []);

  // Fetch punches with proper handling for both multi-mode and single-mode
  const fetchPunches = useCallback(async () => {
    if (!company || !startDate || !endDate) {
      setError("Missing required data: company or dates");
      return;
    }

    setLoading(true);
    setError(null);
    setMultiMode(false);

    try {
      let biometricId;
      
      if (biometricIdFromQuery) {
        biometricId = biometricIdFromQuery;
      } else if (employee?.biometric_id) {
        biometricId = employee.biometric_id;
      } else {
        biometricId = id as string;
      }

      if (!biometricId) {
        setError("Unable to determine biometric ID for fetching punches");
        setLoading(false);
        return;
      }

      const payload = {
        biometric_id: biometricId,
        company_id: company.id,
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
      };

      console.log("📊 Fetching punches with payload:", payload);

      // Fetch today's punch data
      const todayPunchData = await fetchTodaysPunch(biometricId);
      setTodaysPunch(todayPunchData);

      // Fetch all pages of punches
      const { punches: allPunches, isMultiMode } = await fetchAllPunches(payload);
      
      setMultiMode(isMultiMode);
      
      if (allPunches.length === 0) {
        console.log("No punches found");
        // Create empty rows for all dates
        const allDates: string[] = [];
        const currentDate = new Date(startDate);
        const finalEndDate = new Date(endDate);
        
        while (currentDate <= finalEndDate) {
          const dateKey = format(currentDate, "yyyy-MM-dd");
          allDates.push(dateKey);
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        const rows = allDates
          .sort((a, b) => (a < b ? 1 : -1))
          .map((dateKey) => ({
            dateDisplay: format(new Date(dateKey), "dd-MMM-yyyy"),
            dateKey,
            punches: [],
            totalWorkTime: 0,
            status: "No punches recorded",
            hasPunches: false,
            isMultiMode,
            punchIn: "-",
            punchOut: "-",
          }));
        
        setPunches(rows);
        setAverageWorkTime("-");
        setLoading(false);
        return;
      }
      
      // Group punches by date
      const punchesByDate: Record<string, any[]> = {};
      
      allPunches.forEach((punch) => {
        let dateKey = "";
        
        if (punch.date) {
          dateKey = punch.date;
        } else if (punch.punch_time) {
          // Extract date from punch_time
          try {
            if (punch.punch_time.includes('T')) {
              // ISO format: "2025-12-12T09:23:25Z"
              dateKey = punch.punch_time.split('T')[0];
            } else if (punch.punch_time.includes(' ')) {
              // "2025-12-13 06:36:57" format
              dateKey = punch.punch_time.split(' ')[0];
            }
          } catch {
            // If we can't parse, skip
          }
        }
        
        if (!dateKey) {
          // For placeholder records
          if (punch.message && (punch.message.includes("No punches") || punch.status === "leave")) {
            dateKey = punch.date || format(new Date(), "yyyy-MM-dd");
          } else {
            return;
          }
        }
        
        if (!punchesByDate[dateKey]) {
          punchesByDate[dateKey] = [];
        }
        punchesByDate[dateKey].push(punch);
      });
      
      // Generate all dates in range
      const allDates: string[] = [];
      const currentDate = new Date(startDate);
      const finalEndDate = new Date(endDate);
      
      while (currentDate <= finalEndDate) {
        const dateKey = format(currentDate, "yyyy-MM-dd");
        allDates.push(dateKey);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Create rows for display
 // Create rows for display
const rows = allDates
  .sort((a, b) => (a < b ? 1 : -1))
  .map((dateKey) => {
    const punches = punchesByDate[dateKey] || [];
    
    // For display purposes, filter out placeholder "No punches recorded" records
    const displayPunches = punches.filter(p => 
      !(p.punch_time === null && p.message && p.message.includes("No punches recorded"))
    );
    
    const hasActualPunches = displayPunches.length > 0;
    
    // Calculate total work time
    let totalWorkTime = 0;
    let punchIn = "-";
    let punchOut = "-";
    
    if (isMultiMode) {
      // Multi-mode: calculate from all punches
      totalWorkTime = calculateTotalWorkTimeForDay(displayPunches);
      
      // For multi-mode, find first check-in and last check-out
      const checkIns = displayPunches.filter(p => p.status === "Check-In" || p.status === "pending");
      const checkOuts = displayPunches.filter(p => p.status === "Check-Out");
      
      punchIn = checkIns[0] ? extractTime(checkIns[0].punch_time) : "-";
      punchOut = checkOuts[checkOuts.length - 1] ? extractTime(checkOuts[checkOuts.length - 1].punch_time) : "-";
    } else {
      // Single mode: calculate based on first check-in and last check-out
      const checkIns = displayPunches.filter(p => p.status === "Check-In");
      const checkOuts = displayPunches.filter(p => p.status === "Check-Out");
      
      // Check for partial punch records (status: "absent" with punch_time)
      const partialPunches = displayPunches.filter(p => 
        p.status === "absent" && p.message && p.message.includes("Partial punch recorded")
      );
      
      // For partial punches, show the punch time
      if (partialPunches.length > 0) {
        const partialPunch = partialPunches[0];
        if (partialPunch.punch_time) {
          // Use formatTimeDirect to properly format time-only strings like "08:20:51"
          punchIn = formatTimeDirect(partialPunch.punch_time);
          // For partial punches in single mode, punchOut remains "-"
        }
      } else {
        // Normal check-in/check-out logic
        punchIn = checkIns[0] ? formatTimeDirect(checkIns[0].punch_time || checkIns[0].raw_time) : "-";
        punchOut = checkOuts[checkOuts.length - 1] ? formatTimeDirect(checkOuts[checkOuts.length - 1].punch_time || checkOuts[checkOuts.length - 1].raw_time) : "-";
      }
      
      if (punchIn !== "-" && punchOut !== "-") {
        totalWorkTime = calculateWorkTime(punchIn, punchOut);
      }
    }
    
    // Determine status - UPDATED LOGIC for single mode partial punches
    let status = "No punches recorded";
    
    // Check for placeholder records first
    const hasLeavePlaceholder = punches.some(p => p.status === "leave");
    const hasPendingNoPunches = punches.some(p => 
      p.status === "pending" && p.message && p.message.includes("No punches recorded")
    );
    
    // Check for partial punch records specifically
    const hasPartialPunchRecord = displayPunches.some(p => 
      p.status === "absent" && p.message && p.message.includes("Partial punch recorded")
    );
    
    if (hasLeavePlaceholder) {
      status = "Leave";
    } else if (hasPendingNoPunches && !hasPartialPunchRecord) {
      // Today or days with pending status but no actual punches
      status = "No punches recorded";
    } else if (hasPartialPunchRecord) {
      // This is the key fix - handle partial punches in single mode
      status = "Partial punch recorded";
    } else if (hasActualPunches) {
      // We have actual punch records
      if (isMultiMode) {
        // For multi-mode, check if any punches are pending
        const hasPending = displayPunches.some(p => p.status === "pending");
        const hasCheckIn = displayPunches.some(p => p.status === "Check-In");
        const hasCheckOut = displayPunches.some(p => p.status === "Check-Out");
        
        if (hasPending) {
          status = "Partial punch recorded";
        } else if (hasCheckIn || hasCheckOut) {
          status = "Present";
        }
      } else {
        // Single mode logic
        const checkIns = displayPunches.filter(p => p.status === "Check-In");
        const checkOuts = displayPunches.filter(p => p.status === "Check-Out");
        
        if (checkIns.length > 0 && checkOuts.length > 0) {
          status = "Present";
        } else if (checkIns.length > 0 || checkOuts.length > 0) {
          status = "Partial punch recorded";
        }
      }
    }
    
    return {
      dateDisplay: format(new Date(dateKey), "dd-MMM-yyyy"),
      dateKey,
      punches: displayPunches,
      totalWorkTime,
      status,
      hasPunches: hasActualPunches || hasPartialPunchRecord, // Include partial punches
      isMultiMode,
      punchIn,
      punchOut,
    };
  });
      
      // Calculate average work time
      const validDays = rows.filter(day => day.status === "Present" && day.totalWorkTime > 0);
      if (validDays.length > 0) {
        const totalMinutes = validDays.reduce((total, day) => total + day.totalWorkTime, 0);
        const averageMinutes = Math.round(totalMinutes / validDays.length);
        setAverageWorkTime(formatMinutesToTime(averageMinutes));
      } else {
        setAverageWorkTime("-");
      }
      
      // Set today's status
      const today = format(new Date(), "yyyy-MM-dd");
      const todayRow = rows.find(row => row.dateKey === today);
      if (todayRow) {
        setTodaysStatus(todayRow.status);
      }
      
      console.log(`✅ Created ${rows.length} rows from ${Object.keys(punchesByDate).length} dates, mode: ${isMultiMode ? 'multi' : 'single'}`);
      setPunches(rows);
      
    } catch (err) {
      console.error("Failed to fetch/process punches", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to load punches: ${errorMessage}`);
      setPunches([]);
      setAverageWorkTime("-");
    } finally {
      setLoading(false);
    }
  }, [company, startDate, endDate, employee, id, biometricIdFromQuery, fetchTodaysPunch, fetchAllPunches, formatTimeDirect, formatMinutesToTime, calculateWorkTime]);

  // Set default dates
  useEffect(() => {
    if (company && !startDate && !endDate) {
      const now = new Date();
      setStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
      setEndDate(now);
    }
  }, [company, startDate, endDate]);

  // Auto-fetch when dates change
  useEffect(() => {
    if (startDate && endDate && company) {
      fetchPunches();
    }
  }, [startDate, endDate, company, fetchPunches]);

  if (employeeLoading || !employee) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin h-8 w-8 text-blue-500">⟳</div>
          <p className="text-lg text-foreground">Loading employee details...</p>
        </div>
      </div>
    );
  }

  const profileImageUrl = getProfileImageUrl(employee);
  const initials = `${employee.first_name?.[0] || ""}${employee.last_name?.[0] || ""}`;
  const biometricIdForToday = biometricIdFromQuery || employee?.biometric_id || id;
  
  // Get today's punch info
  let todayCheckIn = "-";
  let todayCheckOut = "-";
  let todaySessions = 0;

  if (todaysPunch) {
    todayCheckIn = todaysPunch?.first_check_in ? formatTimeDirect(todaysPunch.first_check_in) : "-";
    todayCheckOut = todaysPunch?.last_check_out ? formatTimeDirect(todaysPunch.last_check_out) : "-";
    todaySessions = todaysPunch?.total_sessions || 0;
  }

  return (
    <div className="p-6">
      {/* Header with Employee Name and Back Button */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <Link
            href="/dashboard/employees"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Employees
          </Link>
        </div>

        {/* Employee Banner */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-blue-500">
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full overflow-hidden border bg-gray-100 flex items-center justify-center">
                {profileImageUrl ? (
                  <Image
                    src={profileImageUrl}
                    alt={`${employee.first_name} ${employee.last_name}`}
                    width={64}
                    height={64}
                    className="object-cover h-16 w-16"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-700 font-bold text-lg">
                    {initials}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {employee.first_name} {employee.last_name}
                </h1>
              </div>

              {employee.role && (
                <p className="text-lg text-gray-600 mb-2">
                  {employee.role}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <UserIcon className="h-4 w-4" />
                  ID: {employee.id}
                </span>
                <span className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  Biometric ID: {employee.biometric_id || "N/A"}
                </span>
              </div>

              {/* Today's Punch Info */}
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-blue-900 mb-3">Today's Status</div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-1">
                          <ArrowUpCircle className="h-4 w-4 text-green-500" />
                          <span className="text-xs font-medium text-gray-500">CHECK IN</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900">
                          {todayCheckIn}
                        </span>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-1">
                          <ArrowDownCircle className="h-4 w-4 text-red-500" />
                          <span className="text-xs font-medium text-gray-500">CHECK OUT</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900">
                          {todayCheckOut}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <TimeCircle
                      checkIn={todayCheckIn}
                      checkOut={todayCheckOut}
                      size={80}
                    />
                    <div className="mt-2 text-xs text-gray-500 text-center">
                      Today's Hours
                    </div>
                  </div>
                </div>
              </div>

              {/* Work Time Summary */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm font-medium text-blue-900 mb-2">Work Summary</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-sm font-medium text-blue-900">Total Days</div>
                    <div className="text-lg font-bold text-blue-700">{punches.length}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-blue-900">Work Days</div>
                    <div className="text-lg font-bold text-blue-700">
                      {punches.filter(p => p.status === "Present").length}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-blue-900">Partial Days</div>
                    <div className="text-lg font-bold text-yellow-600">
                      {punches.filter(p => p.status === "Partial punch recorded").length}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-blue-900">Avg. Hours</div>
                    <div className="text-lg font-bold text-blue-700">
                      {punches.filter(p => p.status === "Present").length >= 3 ? averageWorkTime : "Need more data"}
                    </div>
                  </div>
                </div>
                {punches.filter(p => p.status === "Present").length < 3 && (
                  <div className="mt-2 text-xs text-orange-600 text-center">
                    * Reliable average requires at least 3 complete work days
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Error Loading Data</span>
          </div>
          <p className="mt-1 text-sm text-red-700">{error}</p>
          <button
            onClick={fetchPunches}
            className="mt-2 px-3 py-1 bg-red-100 text-red-800 text-sm rounded hover:bg-red-200 transition"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Date Range Selector */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium mb-1">Start Date:</label>
          <DatePicker
            selected={startDate}
            onChange={(d: Date) => setStartDate(d)}
            dateFormat="dd-MMM-yyyy"
            placeholderText="Select start date"
            className="border px-3 py-2 rounded w-40"
            maxDate={new Date()}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">End Date:</label>
          <DatePicker
            selected={endDate}
            onChange={(d: Date) => setEndDate(d)}
            dateFormat="dd-MMM-yyyy"
            placeholderText="Select end date"
            className="border px-3 py-2 rounded w-40"
            maxDate={new Date()}
          />
        </div>

        <button
          onClick={fetchPunches}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:opacity-50 mt-6"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
        {company && (
          <FixPunch
            companyId={company.id}
            disabled={loading || !company}
            className="mt-6 px-4 py-2"
            onComplete={(result) => {
              if (result.success && (result.fixed > 0 || result.updated > 0)) {
                setTimeout(() => {
                  fetchPunches()
                }, 1000)
              }
            }}
          />
        )}
      </div>

      {/* Punch Records Table */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-lg">Loading punches...</p>
        </div>
      ) : punches.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg text-gray-500">No punches found for the selected date range</p>
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Punch In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Punch Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {punches.map((r, idx) => (
                <tr key={idx} className={r.hasPunches ? "bg-white hover:bg-gray-50" : "bg-gray-50"}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {r.dateDisplay}
                  </td>
                  
                  {multiMode && r.punches.length > 0 ? (
                    <MultiPunchTableDisplay 
                      punches={r.punches} 
                      dateKey={r.dateKey}
                      totalWorkTime={r.totalWorkTime}
                    />
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {r.punchIn}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {r.punchOut}
                      </td>
                    </>
                  )}
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {r.totalWorkTime > 0 ? formatMinutesToTime(r.totalWorkTime) : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${r.status === "Present"
                      ? "bg-green-100 text-green-800"
                      : r.status === "Partial punch recorded"
                        ? "bg-yellow-100 text-yellow-800"
                        : r.status === "Leave"
                          ? "bg-red-100 text-red-800"
                          : r.status === "No punches recorded"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-blue-100 text-blue-800"
                      }`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
// // src/app/dashboard/employees/[id]/punches/page.tsx

// "use client";

// import { useEffect, useState, useCallback } from "react";
// import { useAuth } from "@/context/AuthContext";
// import { useParams, useSearchParams } from "next/navigation"; // Added useSearchParams
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import { format, parseISO, differenceInMinutes } from "date-fns";
// import Link from "next/link";
// import { ArrowLeft, UserIcon, Activity, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
// import Image from "next/image";
// import { useEmployee } from "@/hooks/employees/useGetEmployee";
// import FixPunch from "@/components/fix-punch";

// // Fixed TimeCircle component
// function TimeCircle({ checkIn, checkOut, size = 70 }: {
//   checkIn: string;
//   checkOut: string;
//   size?: number
// }) {
//   // Calculate work hours between two times
//   const calculateWorkHours = (checkIn: string, checkOut: string): string => {
//     if (checkIn === "-" || checkOut === "-" || checkIn === "--" || checkOut === "--") return "--";

//     try {
//       const parseTime = (timeStr: string): Date => {
//         // Handle UTC times in 12-hour format
//         if (timeStr.includes('AM') || timeStr.includes('PM')) {
//           const [time, period] = timeStr.split(' ');
//           const [hours, minutes] = time.split(':');

//           let hour = parseInt(hours);
//           const minute = parseInt(minutes);

//           if (period === 'PM' && hour !== 12) hour += 12;
//           if (period === 'AM' && hour === 12) hour = 0;

//           const date = new Date();
//           date.setUTCHours(hour, minute, 0, 0);
//           return date;
//         } else {
//           // Handle 24-hour format
//           const [hours, minutes] = timeStr.split(':');
//           const hour = parseInt(hours);
//           const minute = parseInt(minutes);

//           const date = new Date();
//           date.setUTCHours(hour, minute, 0, 0);
//           return date;
//         }
//       };

//       const inTime = parseTime(checkIn);
//       const outTime = parseTime(checkOut);

//       // Handle next day check-out
//       let adjustedOutTime = new Date(outTime);
//       if (adjustedOutTime < inTime) {
//         adjustedOutTime.setUTCDate(adjustedOutTime.getUTCDate() + 1);
//       }

//       const totalMinutes = differenceInMinutes(adjustedOutTime, inTime);

//       if (totalMinutes <= 0) return "--";

//       const hours = Math.floor(totalMinutes / 60);
//       const mins = totalMinutes % 60;

//       // Format hours with proper decimal places
//       const decimalHours = hours + (mins / 60);
//       return decimalHours.toFixed(2);
//     } catch {
//       return "--";
//     }
//   };

//   // Calculate current work hours if still working
//   const calculateCurrentWorkHours = (checkIn: string): string => {
//     if (checkIn === "-" || checkIn === "--") return "--";

//     try {
//       const now = new Date();
//       const parseTime = (timeStr: string): Date => {
//         if (timeStr.includes('AM') || timeStr.includes('PM')) {
//           const [time, period] = timeStr.split(' ');
//           const [hours, minutes] = timeStr.split(':');

//           let hour = parseInt(hours);
//           const minute = parseInt(minutes);

//           if (period === 'PM' && hour !== 12) hour += 12;
//           if (period === 'AM' && hour === 12) hour = 0;

//           const date = new Date();
//           date.setUTCHours(hour, minute, 0, 0);
//           return date;
//         } else {
//           const [hours, minutes] = timeStr.split(':');
//           const hour = parseInt(hours);
//           const minute = parseInt(minutes);

//           const date = new Date();
//           date.setUTCHours(hour, minute, 0, 0);
//           return date;
//         }
//       };

//       const inTime = parseTime(checkIn);
//       const totalMinutes = differenceInMinutes(now, inTime);

//       if (totalMinutes <= 0) return "--";

//       const hours = Math.floor(totalMinutes / 60);
//       const mins = totalMinutes % 60;

//       // Format hours with proper decimal places
//       const decimalHours = hours + (mins / 60);
//       return decimalHours.toFixed(2);
//     } catch {
//       return "--";
//     }
//   };

//   const totalHours = checkOut === "-" || checkOut === "--"
//     ? calculateCurrentWorkHours(checkIn)
//     : calculateWorkHours(checkIn, checkOut);

//   const hasValidData = totalHours !== "--" && !isNaN(parseFloat(totalHours));

//   // Calculate progress for the circle (assuming 8-hour work day)
//   const calculateProgress = () => {
//     if (!hasValidData) return 0;

//     try {
//       const hours = parseFloat(totalHours);
//       const progress = Math.min((hours / 8) * 100, 100); // Cap at 100%
//       return progress;
//     } catch {
//       return 0;
//     }
//   };

//   const progress = calculateProgress();
//   const strokeWidth = 4;
//   const radius = (size - strokeWidth) / 2;
//   const circumference = 2 * Math.PI * radius;
//   const strokeDashoffset = circumference - (progress / 100) * circumference;

//   return (
//     <div className="flex flex-col items-center justify-center">
//       <div className="relative" style={{ width: size, height: size }}>
//         <svg width={size} height={size} className="transform -rotate-90">
//           {/* Background circle */}
//           <circle
//             cx={size / 2}
//             cy={size / 2}
//             r={radius}
//             stroke="#e5e7eb"
//             strokeWidth={strokeWidth}
//             fill="none"
//           />
//           {/* Progress circle */}
//           {hasValidData && (
//             <circle
//               cx={size / 2}
//               cy={size / 2}
//               r={radius}
//               stroke={progress >= 100 ? "#10b981" : "#3b82f6"}
//               strokeWidth={strokeWidth}
//               fill="none"
//               strokeDasharray={circumference}
//               strokeDashoffset={strokeDashoffset}
//               strokeLinecap="round"
//               className="transition-all duration-500 ease-in-out"
//             />
//           )}
//         </svg>

//         {/* Center text */}
//         <div className="absolute inset-0 flex items-center justify-center">
//           <div className="text-center">
//             <div className="text-sm font-bold text-gray-900">
//               {hasValidData ? totalHours : "--"}
//             </div>
//             <div className="text-[10px] text-gray-500 font-medium">
//               HRS
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // Helper functions for UTC time detection
// const isMorningTime = (timeStr: string): boolean => {
//   if (!timeStr || timeStr === "-") return false;

//   try {
//     if (timeStr.includes('AM')) return true;
//     if (timeStr.includes('PM')) return false;

//     // For 24-hour format
//     const [hours] = timeStr.split(':');
//     const hour = parseInt(hours);
//     return hour < 12;
//   } catch {
//     return false;
//   }
// };

// const isAfternoonTime = (timeStr: string): boolean => {
//   if (!timeStr || timeStr === "-") return false;

//   try {
//     if (timeStr.includes('PM')) return true;
//     if (timeStr.includes('AM')) return false;

//     // For 24-hour format
//     const [hours] = timeStr.split(':');
//     const hour = parseInt(hours);
//     return hour >= 12;
//   } catch {
//     return false;
//   }
// };

// export default function EmployeePunchPage() {
//   const { id } = useParams(); // This is the employee_id (user_id) from URL - e.g., 91
//   const searchParams = useSearchParams(); // Get query params
//   const { company } = useAuth();

//   const [punches, setPunches] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [startDate, setStartDate] = useState<Date | null>(null);
//   const [endDate, setEndDate] = useState<Date | null>(null);
//   const [employee, setEmployee] = useState<any>(null);
//   const [averageWorkTime, setAverageWorkTime] = useState<string>("-");
//   const [imageError, setImageError] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [todaysPunch, setTodaysPunch] = useState<any>(null);

//   // Get biometric_id from query params if provided, otherwise will use from employee data
//   const biometricIdFromQuery = searchParams.get('biometric_id');

//   // Use the hook to fetch specific employee by user_id (91)
//   const { data: employeeData, isLoading: employeeLoading } = useEmployee(company?.id, id as string);

//   // Set employee state when data is available
//   useEffect(() => {
//     if (employeeData) {
//       setEmployee(employeeData);
//       console.log("✅ Employee data loaded:", {
//         user_id: employeeData.id,
//         biometric_id: employeeData.biometric_id,
//         biometric_id_from_query: biometricIdFromQuery
//       });
//     } else if (!employeeLoading && id) {
//       // Set default employee info if not found after loading
//       setEmployee({
//         id: id as string,
//         first_name: "Employee",
//         last_name: "",
//         biometric_id: id as string
//       });
//     }
//   }, [employeeData, employeeLoading, id, biometricIdFromQuery]);

//   // Helper to get profile image URL
//   const getProfileImageUrl = (emp: any) => {
//     if (!emp?.prof_img) return null;

//     if (emp.prof_img.startsWith("http")) {
//       return emp.prof_img;
//     }

//     return company?.mediaBaseUrl
//       ? `${company.mediaBaseUrl}${emp.prof_img}`
//       : emp.prof_img;
//   };

//   // Updated formatTimeDirect to display raw times correctly for all formats
//   const formatTimeDirect = useCallback((originalTimeString?: string): string => {
//     if (!originalTimeString) return "-";

//     // Handle null, undefined, or empty strings
//     if (originalTimeString === "null" || originalTimeString === "undefined" || originalTimeString.trim() === "") {
//       return "-";
//     }

//     // Check for placeholder times first
//     if (originalTimeString.includes('05:30:00') || originalTimeString.includes('T05:30:00Z')) {
//       return "-";
//     }

//     // For UTC strings (with or without Z) - Enhanced detection
//     if (originalTimeString.includes('T') && originalTimeString.includes(':')) {
//       try {
//         // Extract time part from formats like:
//         // "2025-11-10T08:59:09Z" 
//         // "2025-11-03T08:59:55"
//         // "2025-11-06T08:59:24Z"
//         const timePart = originalTimeString.split('T')[1].replace('Z', '');
//         const [hours, minutes, seconds] = timePart.split(':');

//         const hourNum = parseInt(hours);
//         const minuteNum = parseInt(minutes);

//         // Check if this is a default/placeholder time (like 05:30:00)
//         if (hourNum === 5 && minuteNum === 30 && parseInt(seconds) === 0) {
//           return "-";
//         }

//         // Convert UTC hour to 12-hour format for display
//         // This will show the original UTC time as stored in the string
//         const period = hourNum >= 12 ? 'PM' : 'AM';
//         const hour12 = hourNum % 12 || 12;

//         return `${hour12.toString().padStart(2, '0')}:${minuteNum.toString().padStart(2, '0')} ${period}`;
//       } catch (e) {
//         console.log("Failed to extract time from UTC string:", e);
//         return "-";
//       }
//     }

//     // For time-only strings (like "08:59:15")
//     if (originalTimeString.includes(':') && !originalTimeString.includes('T') && !originalTimeString.includes(' ')) {
//       try {
//         const [hours, minutes, seconds] = originalTimeString.split(':');
//         const hourNum = parseInt(hours);
//         const minuteNum = parseInt(minutes);

//         // Check if this is a default/placeholder time (like 05:30:00)
//         if (hourNum === 5 && minuteNum === 30 && parseInt(seconds || '0') === 0) {
//           return "-";
//         }

//         const period = hourNum >= 12 ? 'PM' : 'AM';
//         const hour12 = hourNum % 12 || 12;

//         return `${hour12.toString().padStart(2, '0')}:${minuteNum.toString().padStart(2, '0')} ${period}`;
//       } catch (e) {
//         console.log("Failed to parse time-only string:", e);
//         return "-";
//       }
//     }

//     // For 12-hour format strings (like "10:59 AM")
//     if ((originalTimeString.includes('AM') || originalTimeString.includes('PM')) && originalTimeString.includes(':')) {
//       try {
//         const [timePart, period] = originalTimeString.split(' ');
//         const [hours, minutes] = timePart.split(':');

//         const hourNum = parseInt(hours);
//         const minuteNum = parseInt(minutes);

//         return `${hourNum.toString().padStart(2, '0')}:${minuteNum.toString().padStart(2, '0')} ${period}`;
//       } catch (e) {
//         console.log("Failed to parse 12-hour format string:", e);
//         return "-";
//       }
//     }

//     // For other date strings, try to parse and extract time
//     try {
//       const date = new Date(originalTimeString);

//       if (isNaN(date.getTime())) {
//         return "-";
//       }

//       // Check if this is a default/placeholder time (like 05:30:00)
//       if (date.getUTCHours() === 5 && date.getUTCMinutes() === 30 && date.getUTCSeconds() === 0) {
//         return "-";
//       }

//       // Use UTC hours for display to show raw times consistently
//       const utcHours = date.getUTCHours();
//       const utcMinutes = date.getUTCMinutes();
//       const period = utcHours >= 12 ? 'PM' : 'AM';
//       const hour12 = utcHours % 12 || 12;

//       return `${hour12.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')} ${period}`;
//     } catch (e) {
//       console.log("Failed to parse time:", e, "Original:", originalTimeString);
//       return "-";
//     }
//   }, []);

//   // Enhanced time formatting with placeholder detection
//   const formatTimeWithDetection = useCallback((date: Date, originalTimeString?: string): string => {
//     return formatTimeDirect(originalTimeString);
//   }, [formatTimeDirect]);

//   // Fetch today's punch data - UPDATED to accept biometricId parameter
//   const fetchTodaysPunch = useCallback(async (biometricId: string) => {
//     if (!company) return null;

//     try {
//       const today = format(new Date(), "yyyy-MM-dd");

//       const res = await fetch("/api/punch/todaypunch", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           biometric_id: biometricId,
//           company_id: company.id,
//           start_date: today,
//           end_date: today,
//           user_id: biometricId,
//         }),
//       });

//       if (res.ok) {
//         const todayData = await res.json();
//         console.log("📅 Today's punch API RAW response:", todayData);

//         // Filter out placeholder 05:30 times
//         const filterPlaceholderTimes = (timeString: string | null) => {
//           if (!timeString) return null;

//           // Check if this is a 05:30 placeholder time
//           if (timeString.includes('T05:30:00Z') ||
//             timeString.includes(' 05:30:00') ||
//             (timeString.includes('05:30') && !timeString.includes('17:30'))) {
//             return null;
//           }

//           return timeString;
//         };

//         // Process today's data to filter out placeholder times
//         const processedTodayData = {
//           ...todayData,
//           first_check_in: filterPlaceholderTimes(todayData.first_check_in),
//           last_check_out: filterPlaceholderTimes(todayData.last_check_out),
//           // Process punch sessions to remove placeholder entries
//           punch_sessions: todayData.punch_sessions?.filter((session: any) => {
//             const checkInTime = session.check_in || session.in_time;
//             const checkOutTime = session.check_out || session.out_time;

//             // Filter out sessions that only have placeholder times
//             const hasValidCheckIn = checkInTime && !checkInTime.includes('T05:30:00Z');
//             const hasValidCheckOut = checkOutTime && !checkOutTime.includes('T05:30:00Z');

//             return hasValidCheckIn || hasValidCheckOut;
//           }) || []
//         };

//         console.log("✅ Processed today's data:", processedTodayData);

//         return processedTodayData;
//       } else {
//         console.log("❌ Today's punch API failed with status:", res.status);
//         return {
//           first_check_in: null,
//           last_check_out: null,
//         };
//       }
//     } catch (error) {
//       console.error("Error fetching today's punch:", error);
//       return {
//         first_check_in: null,
//         last_check_out: null,
//       };
//     }
//   }, [company]);

//   // Helper to format date
//   const formatDate = (date: Date, formatStr: string): string => {
//     return format(date, formatStr);
//   };

//   // Calculate work time in minutes for a day (using UTC times)
//   const calculateWorkTime = useCallback((punchIn: string, punchOut: string): number => {
//     if (punchIn === "-" || punchOut === "-") return 0;

//     try {
//       // Parse UTC times (assuming format "HH:MM AM/PM")
//       const parseUTCTime = (timeStr: string): Date => {
//         // Handle UTC times in 12-hour format with AM/PM
//         if (timeStr.includes('AM') || timeStr.includes('PM')) {
//           const [time, period] = timeStr.split(' ');
//           const [hours, minutes] = time.split(':');

//           let hour = parseInt(hours);
//           const minute = parseInt(minutes);

//           if (period === 'PM' && hour !== 12) hour += 12;
//           if (period === 'AM' && hour === 12) hour = 0;

//           // Create date with UTC time
//           const date = new Date();
//           date.setUTCHours(hour, minute, 0, 0);
//           return date;
//         } else {
//           // If it's in 24-hour format "HH:MM"
//           const [hours, minutes] = timeStr.split(':');
//           const hour = parseInt(hours);
//           const minute = parseInt(minutes);

//           const date = new Date();
//           date.setUTCHours(hour, minute, 0, 0);
//           return date;
//         }
//       };

//       const inTime = parseUTCTime(punchIn);
//       const outTime = parseUTCTime(punchOut);

//       // Handle case where check-out is next day (like 01:02 AM after 03:47 PM)
//       let adjustedOutTime = new Date(outTime);
//       if (adjustedOutTime < inTime) {
//         adjustedOutTime.setUTCDate(adjustedOutTime.getUTCDate() + 1);
//       }

//       return differenceInMinutes(adjustedOutTime, inTime);
//     } catch (error) {
//       console.error("Error calculating work time:", error);
//       return 0;
//     }
//   }, []);

//   // Format minutes to HH:MM format
//   const formatMinutesToTime = useCallback((minutes: number): string => {
//     if (minutes <= 0) return "-";

//     const hours = Math.floor(minutes / 60);
//     const mins = minutes % 60;

//     return `${hours}h ${mins}m`;
//   }, []);

//   // Enhanced date parsing - filter out placeholder times
//   const tryParseDate = useCallback((raw: any, record: any): { date: Date; originalString?: string } | null => {
//     if (!raw) {
//       return null;
//     }

//     // Check if this is a placeholder 05:30 time
//     const rawString = String(raw);
//     if (rawString.includes('T05:30:00Z') ||
//       rawString.includes(' 05:30:00') ||
//       (rawString.includes('05:30') && !rawString.includes('17:30'))) {
//       return null;
//     }

//     if (raw instanceof Date && !isNaN(raw.getTime())) {
//       return { date: raw };
//     }

//     try {
//       // For UTC strings, parse and keep as UTC but the display will convert to local
//       if (typeof raw === "string" && raw.includes('T') && raw.endsWith('Z')) {
//         const dt = new Date(raw);
//         if (!isNaN(dt.getTime())) {
//           return { date: dt, originalString: raw };
//         }
//       }

//       const iso = typeof raw === "string" ? raw.trim() : "";
//       if (iso) {
//         const dt = new Date(iso);
//         if (!isNaN(dt.getTime())) {
//           return { date: dt, originalString: iso };
//         }
//       }
//     } catch (e) {
//       console.log("Failed to parse as ISO:", e);
//     }

//     try {
//       const dt = new Date(raw);
//       if (!isNaN(dt.getTime())) {
//         return { date: dt };
//       }
//     } catch (e) {
//       console.log("Failed to parse directly:", e);
//     }

//     return null;
//   }, []);

//   // Helper function to get UTC date key for grouping
//   const getUTCDateKey = useCallback((date: Date): string => {
//     const utcYear = date.getUTCFullYear();
//     const utcMonth = date.getUTCMonth();
//     const utcDate = date.getUTCDate();
//     return format(new Date(Date.UTC(utcYear, utcMonth, utcDate)), "yyyy-MM-dd");
//   }, []);

//   const getRecordDatetime = useCallback((r: any): { date: Date; originalString?: string; dateKey: string } | null => {
//     if (r.punch_time === null && r.message && r.status === "leave") {
//       return null;
//     }

//     // Handle summary records that have date + time separately
//     if (r.date && r.punch_time && typeof r.punch_time === 'string' && r.punch_time.includes(':') && !r.punch_time.includes('T')) {
//       try {
//         // Combine date and time: "2025-10-31T08:59:15"
//         const combinedDateTime = `${r.date}T${r.punch_time}`;
//         const dt = new Date(combinedDateTime);
//         if (!isNaN(dt.getTime())) {
//           const dateKey = getUTCDateKey(dt);
//           return { date: dt, originalString: combinedDateTime, dateKey };
//         }
//       } catch (e) {
//         console.log("Failed to parse combined date-time:", e);
//       }
//     }

//     const possibleFields = [
//       'punch_time', 'punchTime', 'timestamp', 'time',
//       'created_at', 'created', 'date', 'punch_date',
//       'check_in', 'check_out', 'in_time', 'out_time',
//       'punch_in', 'punch_out', 'entry_time', 'exit_time'
//     ];

//     for (const field of possibleFields) {
//       if (r[field] !== undefined && r[field] !== null) {
//         const result = tryParseDate(r[field], r);
//         if (result) {
//           const dateKey = getUTCDateKey(result.date);
//           return { ...result, dateKey };
//         }
//       }
//     }

//     return null;
//   }, [tryParseDate, getUTCDateKey]);

//   const getNormalizedType = useCallback((r: any): string => {
//     if (r.punch_time === null && r.message && r.status === "leave") {
//       return "Placeholder";
//     }

//     // For summary records, determine type based on context
//     if (r.date && r.punch_time && typeof r.punch_time === 'string' && r.punch_time.includes(':') && !r.punch_time.includes('T')) {
//       // If it's a summary record with only one time, we can't definitively know if it's check-in or check-out
//       // But we can make an educated guess based on common patterns
//       const time = r.punch_time;
//       const hour = parseInt(time.split(':')[0]);

//       // Morning times (before 12) are likely check-ins, afternoon times are likely check-outs
//       if (hour < 12) return "Check-In";
//       if (hour >= 12) return "Check-Out";

//       return "Unknown";
//     }

//     const possibleTypeFields = ['status', 'type', 'punch_type', 'event_type', 'punch_status', 'direction'];

//     for (const field of possibleTypeFields) {
//       if (r[field] !== undefined && r[field] !== null) {
//         const s = r[field].toString().toLowerCase();

//         if (s.includes('checkin') || s.includes('check-in') || s.includes('in') || s === '0' || s === 'in' || s === 'entry')
//           return "Check-In";
//         if (s.includes('checkout') || s.includes('check-out') || s.includes('out') || s === '1' || s === 'out' || s === 'exit')
//           return "Check-Out";
//       }
//     }

//     if (r.check_in || r.in_time || r.punch_in || r.entry_time) return "Check-In";
//     if (r.check_out || r.out_time || r.punch_out || r.exit_time) return "Check-Out";

//     return "Unknown";
//   }, []);

//   // Helper function to extract raw list from API response
//   const getRawListFromResponse = useCallback((json: any): any[] => {
//     if (Array.isArray(json)) {
//       return json;
//     } else if (json && Array.isArray(json.punches)) {
//       return json.punches;
//     } else if (json && Array.isArray(json.data)) {
//       return json.data;
//     } else if (json && Array.isArray(json.results)) {
//       return json.results;
//     } else if (json && Array.isArray(json.records)) {
//       return json.records;
//     }
//     return [];
//   }, []);

//   // Fetch all pages of punches
//   const fetchAllPunches = useCallback(async (payload: any): Promise<any[]> => {
//     let allPunches: any[] = [];
//     let currentPage = 1;
//     let hasMorePages = true;
//     const maxPages = 10;

//     while (hasMorePages && currentPage <= maxPages) {
//       try {
//         const pagePayload = { ...payload, page: currentPage };

//         const res = await fetch("/api/punch/page", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(pagePayload),
//         });

//         if (!res.ok) {
//           throw new Error(`API error: ${res.status}`);
//         }

//         const json = await res.json();
//         const rawList = getRawListFromResponse(json);

//         // Filter out placeholder records with 05:30 times
//         const filteredList = rawList.filter((record: any) => {
//           // Check all time fields for placeholder 05:30 times
//           const timeFields = ['punch_time', 'check_in', 'check_out', 'in_time', 'out_time'];

//           for (const field of timeFields) {
//             if (record[field] && String(record[field]).includes('05:30:00')) {
//               return false; // Exclude this record
//             }
//           }

//           return true; // Include this record
//         });

//         if (filteredList.length === 0) {
//           hasMorePages = false;
//         } else {
//           allPunches = [...allPunches, ...filteredList];
//           currentPage++;

//           if (json.total_page && currentPage > json.total_page) {
//             hasMorePages = false;
//           }
//           if (json.last_page && currentPage > json.last_page) {
//             hasMorePages = false;
//           }
//           if (json.page && json.total_page && currentPage > json.total_page) {
//             hasMorePages = false;
//           }
//         }
//       } catch (error) {
//         console.error(`Error fetching page ${currentPage}:`, error);
//         throw error;
//       }
//     }

//     return allPunches;
//   }, [getRawListFromResponse]);

//   // Calculate average work time
//   const calculateAverageWorkTime = useCallback((punchesData: any[]): void => {
//     const validDays = punchesData.filter(day =>
//       day.hasPunches && day.punchIn !== "-" && day.punchOut !== "-"
//     );

//     if (validDays.length === 0) {
//       setAverageWorkTime("-");
//       return;
//     }

//     const totalMinutes = validDays.reduce((total, day) => {
//       return total + calculateWorkTime(day.punchIn, day.punchOut);
//     }, 0);

//     const averageMinutes = Math.round(totalMinutes / validDays.length);
//     setAverageWorkTime(formatMinutesToTime(averageMinutes));
//   }, [calculateWorkTime, formatMinutesToTime]);

//   // Fetch + process punches with enhanced error handling - UPDATED to use biometric_id from query or employee
//   const fetchPunches = useCallback(async () => {
//     if (!company || !startDate || !endDate) {
//       setError("Missing required data: company or dates");
//       return;
//     }

//     setLoading(true);
//     setError(null);

//     try {
//       // Get biometric_id: Priority 1. From query params, 2. From employee data, 3. Fallback to URL id
//       let biometricId;
      
//       if (biometricIdFromQuery) {
//         // Use biometric_id from query params (most reliable)
//         biometricId = biometricIdFromQuery;
//         console.log("🔍 Using biometric_id from query params:", biometricId);
//       } else if (employee?.biometric_id) {
//         // Use biometric_id from employee data
//         biometricId = employee.biometric_id;
//         console.log("🔍 Using biometric_id from employee data:", biometricId);
//       } else {
//         // Fallback to URL id
//         biometricId = id as string;
//         console.log("🔍 Using URL id as fallback biometric_id:", biometricId);
//       }

//       if (!biometricId) {
//         setError("Unable to determine biometric ID for fetching punches");
//         setLoading(false);
//         return;
//       }

//       const payload = {
//         biometric_id: biometricId,
//         company_id: company.id,
//         start_date: format(startDate, "yyyy-MM-dd"),
//         end_date: format(endDate, "yyyy-MM-dd"),
//       };

//       console.log("📊 Fetching punches with payload:", payload);

//       // Fetch today's punch data
//       const todayPunchData = await fetchTodaysPunch(biometricId);
//       setTodaysPunch(todayPunchData);

//       // Fetch all pages
//       const allPunches = await fetchAllPunches(payload);

//       const actualPunches: any[] = [];
//       const placeholderRecords: any[] = [];

//       allPunches.forEach(record => {
//         if (record.punch_time === null && record.message && record.status === "leave") {
//           placeholderRecords.push(record);
//         } else {
//           actualPunches.push(record);
//         }
//       });

//       const grouped: Record<string, any[]> = {};

//       // Process only actual punches (ignore placeholders) with proper date grouping
//       const seenPunches = new Set();
//       for (const rec of actualPunches) {
//         const punchKey = `${rec.id || rec.punch_time}_${rec.status}`;
//         if (seenPunches.has(punchKey)) {
//           continue;
//         }
//         seenPunches.add(punchKey);

//         const result = getRecordDatetime(rec);
//         if (!result) {
//           continue;
//         }

//         const { date: dt, originalString, dateKey } = result;
//         const punchType = getNormalizedType(rec);
//         const displayTime = formatTimeWithDetection(dt, originalString);

//         if (!grouped[dateKey]) grouped[dateKey] = [];

//         grouped[dateKey].push({
//           datetime: dt,
//           timeStr: displayTime,
//           type: punchType,
//           rawData: rec,
//           originalTimeString: originalString,
//           localTime: dt.toLocaleString(),
//           utcTime: dt.toUTCString()
//         });
//       }

//       // Also add placeholder dates to grouped data so we know which dates have no punches
//       placeholderRecords.forEach(record => {
//         if (record.date) {
//           const dateKey = record.date;
//           if (!grouped[dateKey]) {
//             grouped[dateKey] = [];
//           }
//         }
//       });

//       // Generate rows for ALL dates in the range
//       const allDates: string[] = [];
//       const currentDate = new Date(startDate);
//       const finalEndDate = new Date(endDate);

//       while (currentDate <= finalEndDate) {
//         allDates.push(format(currentDate, "yyyy-MM-dd"));
//         currentDate.setDate(currentDate.getDate() + 1);
//       }

//       let rows = allDates
//         .sort((a, b) => (a < b ? 1 : -1))
//         .map((dateKey) => {
//           const entries = grouped[dateKey] || [];

//           // Filter out duplicate entries by unique punch id/time
//           const uniqueEntries = entries.filter((entry, index, self) =>
//             index === self.findIndex(e =>
//               e.rawData.id === entry.rawData.id &&
//               e.timeStr === entry.timeStr
//             )
//           );

//           const entryCount = uniqueEntries.length;

//           if (entryCount === 0) {
//             const isLeaveDay = placeholderRecords.some(record => record.date === dateKey);
//             return {
//               dateDisplay: format(new Date(dateKey), "dd-MMM-yyyy"),
//               punchIn: "-",
//               punchOut: "-",
//               status: isLeaveDay ? "Leave" : "No punches recorded",
//               rawTimes: "",
//               hasPunches: false,
//               entryCount: 0,
//               workTime: 0,
//               dateKey: dateKey,
//             };
//           }

//           const sortedEntries = uniqueEntries.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());

//           // Separate check-ins and check-outs more accurately
//           const checkIns = sortedEntries.filter((e) => e.type === "Check-In");
//           const checkOuts = sortedEntries.filter((e) => e.type === "Check-Out");

//           let punchIn = "-";
//           let punchOut = "-";

//           // Simple logic: first check-in and last check-out of the day
//           if (checkIns.length > 0) {
//             punchIn = checkIns[0].timeStr;
//           }

//           if (checkOuts.length > 0) {
//             punchOut = checkOuts[checkOuts.length - 1].timeStr;
//           }

//           // If we have entries but couldn't determine types, use first and last
//           if (punchIn === "-" && punchOut === "-" && sortedEntries.length > 0) {
//             // Try to infer based on time of day
//             const morningEntries = sortedEntries.filter(e => isMorningTime(e.timeStr));
//             const afternoonEntries = sortedEntries.filter(e => isAfternoonTime(e.timeStr));

//             if (morningEntries.length > 0) punchIn = morningEntries[0].timeStr;
//             if (afternoonEntries.length > 0) punchOut = afternoonEntries[afternoonEntries.length - 1].timeStr;

//             // If still not determined, use first as check-in and last as check-out
//             if (punchIn === "-" && punchOut === "-") {
//               punchIn = sortedEntries[0].timeStr;
//               punchOut = sortedEntries[sortedEntries.length - 1].timeStr;
//             }
//           }

//           let workTime = calculateWorkTime(punchIn, punchOut);

//           // Determine status
//           let status = "No punches recorded";

//           if (punchIn !== "-" && punchOut !== "-") {
//             status = "Present";
//           } else if (punchIn !== "-" || punchOut !== "-") {
//             status = "Partial punch recorded";
//           }

//           // Override for leave days
//           const isLeaveDay = placeholderRecords.some(record => record.date === dateKey);
//           if (isLeaveDay) {
//             status = "Leave";
//           }
//           const rawTimes = sortedEntries.map((e) => `${e.type}: ${e.timeStr}`).join(", ");

//           return {
//             dateDisplay: format(new Date(dateKey), "dd-MMM-yyyy"),
//             punchIn,
//             punchOut,
//             status,
//             rawTimes,
//             hasPunches: punchIn !== "-" || punchOut !== "-",
//             entryCount,
//             workTime,
//             dateKey: dateKey,
//           };
//         });

//       // FIXED: Update today's row with real-time data from todaypunch API - MIDNIGHT FIX
//       const today = format(new Date(), "yyyy-MM-dd");
//       const todayRowIndex = rows.findIndex(row => row.dateKey === today);

//       if (todayRowIndex !== -1) {
//         // Check if we actually have valid punch data for today
//         const hasValidTodayData = todayPunchData?.first_check_in && 
//                                 !String(todayPunchData.first_check_in).includes('T05:30:00Z') &&
//                                 !String(todayPunchData.first_check_in).includes(' 05:30:00');

//         if (hasValidTodayData) {
//           // Check if the todayPunchData actually belongs to today or yesterday
//           const punchDate = format(new Date(todayPunchData.first_check_in), "yyyy-MM-dd");

//           if (punchDate === today) {
//             // Only apply if the data is from today (normal case during the day)
//             const todayCheckIn = formatTimeDirect(todayPunchData.first_check_in);
//             const todayCheckOut = todayPunchData.last_check_out ? formatTimeDirect(todayPunchData.last_check_out) : "-";

//             const todayWorkTime = calculateWorkTime(todayCheckIn, todayCheckOut);

//             let todayStatus = "Present";
//             if (todayCheckIn === "-" && todayCheckOut === "-") {
//               todayStatus = "No punches recorded";
//             } else if (todayCheckIn === "-" || todayCheckOut === "-") {
//               todayStatus = "Partial punch recorded";
//             }

//             rows[todayRowIndex] = {
//               ...rows[todayRowIndex],
//               punchIn: todayCheckIn,
//               punchOut: todayCheckOut,
//               workTime: todayWorkTime,
//               status: todayStatus,
//               hasPunches: todayCheckIn !== "-" || todayCheckOut !== "-",
//             };
//           } else {
//             // Data is from yesterday (midnight case) - apply to yesterday's row instead
//             const yesterdayRowIndex = rows.findIndex(row => row.dateKey === punchDate);

//             if (yesterdayRowIndex !== -1) {
//               const yesterdayCheckIn = formatTimeDirect(todayPunchData.first_check_in);
//               const yesterdayCheckOut = todayPunchData.last_check_out ? formatTimeDirect(todayPunchData.last_check_out) : "-";

//               const yesterdayWorkTime = calculateWorkTime(yesterdayCheckIn, yesterdayCheckOut);

//               let yesterdayStatus = "Present";
//               if (yesterdayCheckIn === "-" && yesterdayCheckOut === "-") {
//                 yesterdayStatus = "No punches recorded";
//               } else if (yesterdayCheckIn === "-" || yesterdayCheckOut === "-") {
//                 yesterdayStatus = "Partial punch recorded";
//               }

//               rows[yesterdayRowIndex] = {
//                 ...rows[yesterdayRowIndex],
//                 punchIn: yesterdayCheckIn,
//                 punchOut: yesterdayCheckOut,
//                 workTime: yesterdayWorkTime,
//                 status: yesterdayStatus,
//                 hasPunches: yesterdayCheckIn !== "-" || yesterdayCheckOut !== "-",
//               };
//             }
//           }
//         } else {
//           // No valid punch data for today - ensure it shows "No punches recorded"
//           rows[todayRowIndex] = {
//             ...rows[todayRowIndex],
//             punchIn: "-",
//             punchOut: "-",
//             workTime: 0,
//             status: "No punches recorded",
//             hasPunches: false,
//           };
//         }
//       }

//       setPunches(rows);
//       calculateAverageWorkTime(rows);

//     } catch (err) {
//       console.error("Failed to fetch/process punches", err);
//       const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
//       setError(`Failed to load punches: ${errorMessage}`);
//       setPunches([]);
//       setAverageWorkTime("-");
//     } finally {
//       setLoading(false);
//     }
//   }, [company, startDate, endDate, employee, id, biometricIdFromQuery, fetchTodaysPunch, fetchAllPunches, getRecordDatetime, getNormalizedType, formatTimeWithDetection, calculateWorkTime, calculateAverageWorkTime, getUTCDateKey]);

//   // Set default dates when company and employee are available
//   useEffect(() => {
//     if (company && !startDate && !endDate) {
//       const now = new Date();
//       setStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
//       setEndDate(now);
//     }
//   }, [company, startDate, endDate]);

//   // Auto-fetch when dates change
//   useEffect(() => {
//     if (startDate && endDate && company) {
//       fetchPunches();
//     }
//   }, [startDate, endDate, company, fetchPunches]);

//   if (employeeLoading || !employee) {
//     return (
//       <div className="min-h-screen bg-background flex items-center justify-center">
//         <div className="flex items-center gap-3">
//           <div className="animate-spin h-8 w-8 text-blue-500">⟳</div>
//           <p className="text-lg text-foreground">Loading employee details...</p>
//         </div>
//       </div>
//     );
//   }

//   const profileImageUrl = getProfileImageUrl(employee);
//   const initials = `${employee.first_name?.[0] || ""}${employee.last_name?.[0] || ""}`;
  
//   // Get today's punch info - use biometric_id from query or employee
//   const biometricIdForToday = biometricIdFromQuery || employee?.biometric_id || id;
//   const todayCheckIn = todaysPunch?.first_check_in ? formatTimeDirect(todaysPunch.first_check_in) : "-";
//   const todayCheckOut = todaysPunch?.last_check_out ? formatTimeDirect(todaysPunch.last_check_out) : "-";

//   return (
//     <div className="p-6">
//       {/* Header with Employee Name and Back Button */}
//       <div className="mb-6">
//         <div className="flex items-center justify-between gap-4 mb-4">
//           <Link
//             href="/dashboard/employees"
//             className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
//           >
//             <ArrowLeft className="h-4 w-4" />
//             Back to Employees
//           </Link>
//         </div>

//         {/* Employee Banner with Photo and Details */}
//         <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-blue-500">
//           <div className="flex items-start gap-4">
//             {/* Profile Image */}
//             <div className="relative">
//               <div className="h-16 w-16 rounded-full overflow-hidden border bg-gray-100 flex items-center justify-center">
//                 {profileImageUrl ? (
//                   <Image
//                     src={profileImageUrl}
//                     alt={`${employee.first_name} ${employee.last_name}`}
//                     width={64}
//                     height={64}
//                     className="object-cover h-16 w-16"
//                     onError={() => setImageError(true)}
//                   />
//                 ) : (
//                   <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-700 font-bold text-lg">
//                     {initials}
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Employee Details */}
//             <div className="flex-1">
//               <div className="flex items-center gap-3 mb-1">
//                 <h1 className="text-2xl font-bold text-gray-900">
//                   {employee.first_name} {employee.last_name}
//                 </h1>
//                 {/* {biometricIdFromQuery && (
//                   <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
//                     Query ID: {biometricIdFromQuery}
//                   </span>
//                 )} */}
//               </div>

//               {employee.role && (
//                 <p className="text-lg text-gray-600 mb-2">
//                   {employee.role}
//                 </p>
//               )}

//               <div className="flex items-center gap-4 text-sm text-muted-foreground">
//                 <span className="flex items-center gap-1">
//                   <UserIcon className="h-4 w-4" />
//                   ID: {employee.id}
//                 </span>
//                 <span className="flex items-center gap-1">
//                   <Activity className="h-4 w-4" />
//                   Biometric ID: {employee.biometric_id || "N/A"}
//                 </span>
//                 {/* {biometricIdForToday && biometricIdForToday !== employee.id && (
//                   <span className="flex items-center gap-1 text-green-600">
//                     <Activity className="h-4 w-4" />
//                     Fetching punches with: {biometricIdForToday}
//                   </span>
//                 )} */}
//               </div>

//               {/* Today's Punch Info */}
//               <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
//                 <div className="flex items-center justify-between">
//                   <div className="flex-1">
//                     <div className="text-sm font-medium text-blue-900 mb-3">Today's Status</div>
//                     <div className="grid grid-cols-2 gap-6">
//                       {/* Check-in */}
//                       <div className="flex flex-col items-center">
//                         <div className="flex items-center gap-2 mb-1">
//                           <ArrowUpCircle className="h-4 w-4 text-green-500" />
//                           <span className="text-xs font-medium text-gray-500">CHECK IN</span>
//                         </div>
//                         <span className="text-lg font-bold text-gray-900">
//                           {todayCheckIn}
//                         </span>
//                       </div>

//                       {/* Check-out */}
//                       <div className="flex flex-col items-center">
//                         <div className="flex items-center gap-2 mb-1">
//                           <ArrowDownCircle className="h-4 w-4 text-red-500" />
//                           <span className="text-xs font-medium text-gray-500">CHECK OUT</span>
//                         </div>
//                         <span className="text-lg font-bold text-gray-900">
//                           {todayCheckOut}
//                         </span>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Work Hours Circle */}
//                   <div className="flex flex-col items-center justify-center">
//                     <TimeCircle
//                       checkIn={todayCheckIn}
//                       checkOut={todayCheckOut}
//                       size={80}
//                     />
//                     <div className="mt-2 text-xs text-gray-500 text-center">
//                       Today's Hours
//                     </div>
//                   </div>
//                 </div>

//                 {/* Additional Today's Info */}
//                 {todaysPunch && (
//                   <div className="mt-3 pt-3 border-t border-blue-200">
//                     <div className="flex justify-between text-xs text-gray-600">
//                       {todaysPunch.total_sessions > 1 && (
//                         <span>Sessions: {todaysPunch.total_sessions}</span>
//                       )}
//                       {todaysPunch.total_hours > 0 && (
//                         <span>Total Hours: {todaysPunch.total_hours}h</span>
//                       )}
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Work Time Summary */}
//               <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
//                 <div className="text-sm font-medium text-blue-900 mb-2">Work Summary</div>
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
//                   <div>
//                     <div className="text-sm font-medium text-blue-900">Total Days</div>
//                     <div className="text-lg font-bold text-blue-700">{punches.length}</div>
//                   </div>
//                   <div>
//                     <div className="text-sm font-medium text-blue-900">Work Days</div>
//                     <div className="text-lg font-bold text-blue-700">
//                       {punches.filter(p => p.hasPunches && p.status === "Present").length}
//                     </div>
//                   </div>
//                   <div>
//                     <div className="text-sm font-medium text-blue-900">Partial Days</div>
//                     <div className="text-lg font-bold text-yellow-600">
//                       {punches.filter(p => p.status === "Partial punch recorded").length}
//                     </div>
//                   </div>

//                   <div>
//                     <div className="text-sm font-medium text-blue-900">Avg. Hours</div>
//                     <div className="text-lg font-bold text-blue-700">
//                       {punches.filter(p => p.workTime > 0).length >= 5 ? averageWorkTime : "Need more data"}
//                     </div>
//                   </div>
//                 </div>
//                 {punches.filter(p => p.workTime > 0).length < 5 && (
//                   <div className="mt-2 text-xs text-orange-600 text-center">
//                     * Reliable average requires at least 5 complete work days
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Error Display */}
//       {error && (
//         <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
//           <div className="flex items-center gap-2 text-red-800">
//             <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//               <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//             </svg>
//             <span className="font-medium">Error Loading Data</span>
//           </div>
//           <p className="mt-1 text-sm text-red-700">{error}</p>
//           <button
//             onClick={fetchPunches}
//             className="mt-2 px-3 py-1 bg-red-100 text-red-800 text-sm rounded hover:bg-red-200 transition"
//           >
//             Try Again
//           </button>
//         </div>
//       )}

//       {/* Date Range Selector */}
//       <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
//         <div>
//           <label className="block text-sm font-medium mb-1">Start Date:</label>
//           <DatePicker
//             selected={startDate}
//             onChange={(d: Date) => setStartDate(d)}
//             dateFormat="dd-MMM-yyyy"
//             placeholderText="Select start date"
//             className="border px-3 py-2 rounded w-40"
//             maxDate={new Date()}
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium mb-1">End Date:</label>
//           <DatePicker
//             selected={endDate}
//             onChange={(d: Date) => setEndDate(d)}
//             dateFormat="dd-MMM-yyyy"
//             placeholderText="Select end date"
//             className="border px-3 py-2 rounded w-40"
//             maxDate={new Date()}
//           />
//         </div>

//         <button
//           onClick={fetchPunches}
//           disabled={loading}
//           className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:opacity-50 mt-6"
//         >
//           {loading ? "Loading..." : "Refresh"}
//         </button>
//         {company && (
//           <FixPunch
//             companyId={company.id}
//             disabled={loading || !company}
//             className="mt-6 px-4 py-2"
//             onComplete={(result) => {
//               if (result.success && (result.fixed > 0 || result.updated > 0)) {
//                 setTimeout(() => {
//                   fetchPunches()
//                 }, 1000)
//               }
//             }}
//           />
//         )}
//       </div>

//       {/* Punch Records Table */}
//       {loading ? (
//         <div className="text-center py-8">
//           <p className="text-lg">Loading punches...</p>
//         </div>
//       ) : punches.length === 0 ? (
//         <div className="text-center py-8">
//           <p className="text-lg text-gray-500">No punches found for the selected date range</p>
//         </div>
//       ) : (
//         <div className="overflow-x-auto border rounded-lg">
//           <table className="min-w-full bg-white">
//             <thead className="bg-gray-100 border-b">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Punch In</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Punch Out</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Time</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-200">
//               {punches.map((r, idx) => (
//                 <tr key={idx} className={r.hasPunches ? "bg-white hover:bg-gray-50" : "bg-gray-50"}>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                     {r.dateDisplay}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                     {r.punchIn}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                     {r.punchOut}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                     {r.workTime > 0 ? formatMinutesToTime(r.workTime) : "-"}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm">
//                     <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${r.status === "Present"
//                       ? "bg-green-100 text-green-800"
//                       : r.status === "Partial punch recorded"
//                         ? "bg-yellow-100 text-yellow-800"
//                         : r.status === "Leave"
//                           ? "bg-red-100 text-red-800"
//                           : "bg-gray-100 text-gray-800"
//                       }`}>
//                       {r.status}
//                     </span>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }


