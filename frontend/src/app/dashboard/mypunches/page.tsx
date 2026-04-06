"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  History,
  Clock,
  Briefcase,
  CalendarOff,
  RefreshCw,
} from "lucide-react";
import DatePicker from "react-datepicker";
import { format, differenceInMinutes, startOfMonth } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import "react-datepicker/dist/react-datepicker.css";

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



// Circular Progress Component (adapted from employees/page.tsx)
// Circular Progress Component
function TimeCircle({
  totalHours,
  size = 70,
  isTodayPartial = false,
  isOldPartial = false,
}: {
  totalHours: string;
  size?: number;
  isTodayPartial?: boolean;
  isOldPartial?: boolean;
}) {
  const hasValidData = totalHours !== "--" && !totalHours.includes("NaN") && !isOldPartial;

  const calculateProgress = () => {
    if (isOldPartial) return 100;
    if (!hasValidData) return 0;
    try {
      const hours = parseFloat(totalHours);
      return Math.min((hours / 8) * 100, 100);
    } catch {
      return 0;
    }
  };

  const progress = calculateProgress();
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  let strokeColor = "#3b82f6"; // Default Blue
  if (isOldPartial) {
    strokeColor = "#eab308"; // Yellow-600
  } else if (isTodayPartial) {
    strokeColor = "#9333ea"; // Purple-600
  } else if (parseFloat(totalHours) >= 8) {
    strokeColor = "#10b981"; // Green-500
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isOldPartial ? "#fef08a" : "#e5e7eb"} // Lighter yellow for bg if partial
            strokeWidth={strokeWidth}
            fill="none"
          />
          {(hasValidData || isOldPartial) && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={strokeColor}
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
            {isOldPartial ? (
              <Clock className="h-5 w-5 text-yellow-600 mx-auto" aria-hidden="true" />
            ) : (
              <>
                <div className="text-sm font-bold text-gray-900">
                  {hasValidData ? totalHours : "--"}
                </div>
                <div className="text-[10px] text-gray-500 font-medium">HRS</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyPunchesPage() {
  const { user, company } = useAuth();
  
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState(false);
  const [punches, setPunches] = useState<any[]>([]);
  const [multiMode, setMultiMode] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    workingDays: 0,
    activeDays: 0,
    avgWorkingHours: "0.0",
    partialDays: 0,
  });

  const formatTimeDirect = useCallback((originalTimeString?: string | null): string => {
    if (!originalTimeString) return "-";

    if (originalTimeString === "null" || originalTimeString === "undefined" || originalTimeString.trim() === "") {
      return "-";
    }

    if (originalTimeString.includes('05:30:00') || originalTimeString.includes('T05:30:00Z')) {
      return "-";
    }

    // Handle time-only strings like "09:43:02"
    if (originalTimeString.includes(':') && !originalTimeString.includes('T') && !originalTimeString.includes(' ') && !originalTimeString.includes('AM') && !originalTimeString.includes('PM')) {
      try {
        const [hours, minutes] = originalTimeString.split(':');
        const hourNum = parseInt(hours);
        
        if (isNaN(hourNum)) return originalTimeString;
        
        const period = hourNum >= 12 ? 'PM' : 'AM';
        const hour12 = hourNum % 12 || 12;
        
        return `${hour12.toString().padStart(2, '0')}:${minutes} ${period}`;
      } catch {
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
      } catch {}
    }

    // Handle ISO format like "2025-12-12T09:23:25Z" (single-mode)
    if (originalTimeString.includes('T') && originalTimeString.includes('Z')) {
      try {
        const date = new Date(originalTimeString);
        if (!isNaN(date.getTime())) {
          const hours = date.getUTCHours();
          const minutes = date.getUTCMinutes();
          
          if (hours === 5 && minutes === 30) {
            return "-";
          }
          
          const period = hours >= 12 ? 'PM' : 'AM';
          const hour12 = hours % 12 || 12;
          
          return `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
        }
      } catch {}
    }

    if (originalTimeString.includes('AM') || originalTimeString.includes('PM')) {
      return originalTimeString;
    }

    return originalTimeString;
  }, []);

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
    } catch {
      return 0;
    }
  }, []);

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

        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const apiData = await res.json();
        const pagePunches = apiData.data || (Array.isArray(apiData) ? apiData : []);
        
        if (apiData.multi_mode !== undefined) {
          detectedMultiMode = apiData.multi_mode === true;
        }
        
        if (pagePunches.length === 0) {
          hasMorePages = false;
        } else {
          allPunches = [...allPunches, ...pagePunches];
          currentPage++;

          if (apiData.total_page && currentPage > apiData.total_page) hasMorePages = false;
          if (apiData.last_page && currentPage > apiData.last_page) hasMorePages = false;
        }
      } catch (error) {
        console.error(`Error fetching page ${currentPage}:`, error);
        throw error;
      }
    }

    return { punches: allPunches, isMultiMode: detectedMultiMode };
  }, []);

  const fetchPunches = useCallback(async () => {
    if (!company || !user?.biometric_id || !startDate || !endDate) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        biometric_id: user.biometric_id,
        company_id: company.id,
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
      };

      const { punches: allPunches, isMultiMode } = await fetchAllPunches(payload);
      setMultiMode(isMultiMode);

      // Create empty rows for all dates in range
      const allDates: string[] = [];
      const currentDate = new Date(startDate);
      const finalEndDate = new Date(endDate);
      
      while (currentDate <= finalEndDate) {
        allDates.push(format(currentDate, "yyyy-MM-dd"));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Group punches by date
      const punchesByDate: Record<string, any[]> = {};
      allPunches.forEach((punch) => {
        let dateKey = "";
        if (punch.date) dateKey = punch.date;
        else if (punch.punch_time) {
          dateKey = punch.punch_time.split(punch.punch_time.includes('T') ? 'T' : ' ')[0];
        }
        if (dateKey) {
          if (!punchesByDate[dateKey]) punchesByDate[dateKey] = [];
          punchesByDate[dateKey].push(punch);
        }
      });

      const rows = allDates
        .sort((a, b) => (a < b ? 1 : -1))
        .map((dateKey) => {
          const dateObj = new Date(dateKey);
          const dayPunches = punchesByDate[dateKey] || [];
          const hasPunches = dayPunches.length > 0;
          
          let punchIn = "-";
          let punchOut = "-";
          let totalWorkTime = 0;
          const sessions: any[] = [];
          
          let isTodayPartial = false;
          let isOldPartial = false;
          let isAbsent = false;

          const todayStr = format(new Date(), "yyyy-MM-dd");
          const isToday = dateKey === todayStr;

          const partialPunchFound = dayPunches.some(p => p.message === "Partial punch recorded" || p.status === "pending" || (p.status === "absent" && p.punch_time));

          if (isMultiMode) {
            // Processing multi-mode sessions (simplified for integration)
            let sessionStart: any = null;
            dayPunches.forEach((p) => {
              if (p.status === "Check-In" || p.status === "pending") {
                sessionStart = p;
              } else if (p.status === "Check-Out" && sessionStart) {
                const sIn = formatTimeDirect(sessionStart.punch_time);
                const sOut = formatTimeDirect(p.punch_time);
                const durationMins = calculateWorkTime(sIn, sOut);
                const durationHrs = (durationMins / 60).toFixed(2);
                
                sessions.push({ checkIn: sIn, checkOut: sOut, duration: durationHrs });
                totalWorkTime += durationMins;
                sessionStart = null;
              }
            });
            
            if (sessions.length > 0) {
              punchIn = sessions[0].checkIn;
              punchOut = sessions[sessions.length - 1].checkOut;
            } else if (partialPunchFound) {
              const checkInRecord = dayPunches.find(p => p.punch_time) || dayPunches[0];
              punchIn = formatTimeDirect(checkInRecord?.punch_time);
              if (isToday) {
                isTodayPartial = true;
                totalWorkTime = calculateWorkTime(punchIn, format(new Date(), "HH:mm"));
              } else {
                isOldPartial = true;
              }
            }
          } else if (hasPunches) {
            const checkInRecord = dayPunches.find(p => p.status === "Check-In" || p.status === "In" || p.status === "pending" || p.status === "absent");
            const checkOutRecord = dayPunches.find(p => p.status === "Check-Out" || p.status === "Out");
            
            punchIn = checkInRecord ? formatTimeDirect(checkInRecord.punch_time) : "-";
            punchOut = checkOutRecord ? formatTimeDirect(checkOutRecord.punch_time) : "-";

            if (punchIn !== "-" && punchOut !== "-") {
              totalWorkTime = calculateWorkTime(punchIn, punchOut);
            } else if (punchIn !== "-" && punchOut === "-") {
              if (isToday) {
                isTodayPartial = true;
                // For today, calculate time from In to Now
                const nowTime = format(new Date(), "HH:mm");
                totalWorkTime = calculateWorkTime(punchIn, nowTime);
              } else {
                isOldPartial = true;
              }
            }
          }

          const dayOfWeek = format(dateObj, "EEEE");
          const isOff = dayOfWeek === "Sunday" || (dayOfWeek === "Saturday" && !hasPunches);
          
          if (!hasPunches && !isOff && !isToday) {
            isAbsent = true;
          }

          return {
            id: dateKey,
            date: dateKey,
            day: dayOfWeek,
            checkIn: punchIn,
            checkOut: punchOut,
            totalHours: (totalWorkTime / 60).toFixed(2),
            multiMode: isMultiMode && sessions.length > 1,
            sessions,
            isOff,
            hasPunches: hasPunches && !isAbsent,
            isTodayPartial,
            isOldPartial,
            isAbsent
          };
        });

      setPunches(rows);

      // Calculate Stats
      const activeDays = rows.filter(r => r.checkIn !== "-" && r.checkOut !== "-").length;
      const partialDaysCount = rows.filter(r => r.isTodayPartial || r.isOldPartial).length;
      const totalMinutes = rows.reduce((acc, r) => acc + (parseFloat(r.totalHours) * 60 || 0), 0);
      const avgMinutes = activeDays > 0 ? totalMinutes / activeDays : 0;
      
      const diffInDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      setStats({
        workingDays: diffInDays,
        activeDays,
        avgWorkingHours: (avgMinutes / 60).toFixed(1),
        partialDays: partialDaysCount,
      });

    } catch (err) {
      console.error("Failed to fetch punches:", err);
      setError("Failed to load punch data");
    } finally {
      setLoading(false);
    }
  }, [company, user?.biometric_id, startDate, endDate, fetchAllPunches, formatTimeDirect, calculateWorkTime]);

  useEffect(() => {
    fetchPunches();
  }, [fetchPunches]);

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Punch Stats
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of your attendance and daily punch records
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">
              Working Days
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {stats.workingDays}
            </p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">
              Active Days
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {stats.activeDays}
            </p>
          </div>
          <div className="p-3 bg-green-100 rounded-full">
            <Calendar className="h-6 w-6 text-green-600" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">
              Partial Days
            </h3>
            <p className="text-3xl font-bold text-yellow-600">
              {stats.partialDays}
            </p>
          </div>
          <div className="p-3 bg-yellow-100 rounded-full">
            <Calendar className="h-6 w-6 text-yellow-600" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">
              Avg. Hours
            </h3>
            <p className="text-3xl font-bold text-purple-600">
              {stats.avgWorkingHours}
              <span className="text-lg text-purple-400">h</span>
            </p>
          </div>
          <div className="p-3 bg-purple-100 rounded-full">
            <Clock className="h-6 w-6 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Daily Punches List */}
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-1">
          <History className="h-5 w-5 text-gray-600" />Daily Punch Records</h1>

        {/* Date Range Selector - with grouped buttons */}
        <div className="flex flex-wrap items-end gap-5 mb-4">
          {/* Start Date */}
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <DatePicker
              selected={startDate}
              onChange={(d: Date | null) => setStartDate(d)}
              dateFormat="dd-MMM-yyyy"
              placeholderText="Select start date"
              className="border border-gray-300 px-3 py-2 rounded-md w-full md:w-44 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              maxDate={new Date()}
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <DatePicker
              selected={endDate}
              onChange={(d: Date | null) => setEndDate(d)}
              dateFormat="dd-MMM-yyyy"
              placeholderText="Select end date"
              className="border border-gray-300 px-3 py-2 rounded-md w-full md:w-44 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              maxDate={new Date()}
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchPunches}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-[9px] bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-70 font-medium text-sm h-[42px]"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <ul className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 text-center">
              {error}
            </div>
          )}
          {!loading && punches.length === 0 && !error && (
            <div className="p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
              No punch records found for the selected period.
            </div>
          )}
          {punches.map((record) => (
            <li
              key={record.id}
              className={`border border-gray-200 p-4 rounded-lg transition-colors shadow-sm group relative ${
                record.isOff && !record.hasPunches
                  ? "bg-gray-50 opacity-80"
                  : "bg-white hover:bg-gray-50 cursor-pointer"
              }`}
              onMouseEnter={() => setHoveredId(record.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                {/* Left Section - Date Details */}
                <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                  {/* Custom Date Icon Container */}
                  <div className="h-14 w-14 rounded-xl border-2 border-blue-100 bg-blue-50 flex flex-col items-center justify-center flex-shrink-0 text-blue-700">
                    <span className="text-xl font-bold leading-none">
                      {record.date.split("-")[2]}
                    </span>
                    <span className="text-xs font-semibold uppercase mt-1">
                      {new Date(record.date).toLocaleString("default", {
                        month: "short",
                      })}
                    </span>
                  </div>

                  {/* Day specifics */}
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`font-semibold text-lg truncate ${record.isOff && !record.hasPunches ? "text-gray-600" : "text-gray-900"}`}
                      >
                        {record.day}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {format(new Date(record.date), "dd-MMM-yyyy")}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mt-1">
                      {record.isOff && !record.hasPunches && !record.isTodayPartial && !record.isOldPartial && (
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full font-medium">
                          Weekend / Day Off
                        </span>
                      )}
                      {record.isAbsent && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                          Absent / No Data
                        </span>
                      )}
                      {record.isTodayPartial && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                          Active Now
                        </span>
                      )}
                      {record.isOldPartial && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                          Forgot Checkout
                        </span>
                      )}
                      {record.multiMode && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                          Multiple Sessions
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle Section - Punch Times */}
                <div className="flex items-center gap-8 mx-4 sm:mx-8">
                  {/* Check-in */}
                  <div className="flex flex-col items-center min-w-[60px]">
                    <div className="flex items-center gap-2 mb-1">
                      <ArrowUpCircle
                        className={`h-4 w-4 ${record.isOff && !record.hasPunches ? "text-gray-400" : "text-green-500"}`}
                      />
                      <span className="text-xs font-medium text-gray-500">
                        IN
                      </span>
                    </div>
                    <span
                      className={`text-lg font-bold ${record.isOff && !record.hasPunches ? "text-gray-400" : "text-gray-900"}`}
                    >
                      {record.checkIn}
                    </span>
                  </div>

                  {/* Check-out */}
                  <div className="flex flex-col items-center min-w-[60px]">
                    <div className="flex items-center gap-2 mb-1">
                      <ArrowDownCircle
                        className={`h-4 w-4 ${record.isOff && !record.hasPunches ? "text-gray-400" : "text-red-500"}`}
                      />
                      <span className="text-xs font-medium text-gray-500">
                        OUT
                      </span>
                    </div>
                    <span
                      className={`text-lg font-bold ${record.isOff && !record.hasPunches ? "text-gray-400" : "text-gray-900"}`}
                    >
                      {record.checkOut}
                    </span>
                  </div>
                </div>

                {/* Right Section - Total Work Hours */}
                <div className="flex items-center justify-end flex-shrink-0">
                  <TimeCircle 
                    totalHours={record.totalHours} 
                    isTodayPartial={record.isTodayPartial}
                    isOldPartial={record.isOldPartial}
                  />
                </div>
              </div>

              {/* Multiple Sessions Viewer directly embedded */}
              {record.multiMode &&
                record.sessions.length > 0 &&
                hoveredId === record.id && (
                  <div className="mt-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center mb-3">
                      <Clock className="w-4 h-4 text-blue-600 mr-2" />
                      <span className="text-sm font-semibold text-blue-800">
                        Punch Sessions Breakdown
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {record.sessions.map((session: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-white p-3 rounded-md border border-blue-100 flex flex-col justify-center text-sm shadow-sm"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500 font-medium">
                              Session {idx + 1}
                            </span>
                            <span className="font-bold text-blue-600">
                              {session.duration}h
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700 font-medium">
                            <span>{session.checkIn}</span>
                            <span className="text-gray-300">-</span>
                            <span>{session.checkOut}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
