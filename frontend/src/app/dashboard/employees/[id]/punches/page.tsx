// // src/app/dashboard/employees/[id]/punches/page.tsx

// "use client";

// import { useEffect, useState, useCallback } from "react";
// import { useAuth } from "@/context/AuthContext";
// import { useParams } from "next/navigation";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import { format, parseISO, differenceInMinutes } from "date-fns";
// import Link from "next/link";
// import { ArrowLeft, UserIcon, Activity, ArrowUpCircle, ArrowDownCircle, ChevronDown, ChevronRight, BugIcon } from "lucide-react";
// import Image from "next/image";
// import { useEmployees } from "@/hooks/employees/useGetEmployees";

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
//           const [hours, minutes] = time.split(':');
          
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
//   const { id } = useParams();
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
//   // const [debugInfo, setDebugInfo] = useState<any>(null); // Commented out debug state
//   // const [showDebug, setShowDebug] = useState(false); // Commented out debug toggle

//   // Use the hook to fetch all employees
//   const { data: employeesData, isLoading: employeesLoading } = useEmployees(company?.id, 1, 1000);

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

//   // Add this new function to format debug information for each row
//   // const formatRowDebugInfo = useCallback((row: any, index: number) => { // Commented out debug function
//   //   return {
//   //     rowIndex: index,
//   //     date: row.dateDisplay,
//   //     punchIn: row.punchIn,
//   //     punchOut: row.punchOut,
//   //     status: row.status,
//   //     workTime: row.workTime,
//   //     hasPunches: row.hasPunches,
//   //     entryCount: row.entryCount,
//   //     rawTimes: row.rawTimes,
//   //     dateKey: row.dateKey,
//   //     debugEntries: row.debugEntries,
//   //     // Add timezone information
//   //     timezoneInfo: {
//   //       localTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
//   //       currentTime: new Date().toLocaleString(),
//   //       currentUTCTime: new Date().toUTCString()
//   //     }
//   //   };
//   // }, []);

//   // Fetch today's punch data
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
//               timeString.includes(' 05:30:00') ||
//               (timeString.includes('05:30') && !timeString.includes('17:30'))) {
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
//           first_check_in: null, 
//           last_check_out: null, 
//         };
//     }
//   }, [company]);

//   // Find employee from the fetched employees data
//   useEffect(() => {
//     if (employeesData?.employees && id) {
//       let foundEmployee = null;
      
//       // Try to find employee by different identifiers
//       foundEmployee = employeesData.employees.find((emp: any) => String(emp.id) === id);
//       if (foundEmployee) {
//         setEmployee(foundEmployee);
//         return;
//       }
      
//       foundEmployee = employeesData.employees.find((emp: any) => String(emp.biometric_id) === id);
//       if (foundEmployee) {
//         setEmployee(foundEmployee);
//         return;
//       }
      
//       foundEmployee = employeesData.employees.find((emp: any) => String(emp.employee_id) === id);
//       if (foundEmployee) {
//         setEmployee(foundEmployee);
//         return;
//       }
      
//       // Set default employee info if not found
//       setEmployee({
//         id: id as string,
//         first_name: "Employee",
//         last_name: "",
//         biometric_id: id as string
//       });
//     }
//   }, [employeesData, id]);

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
//         rawString.includes(' 05:30:00') ||
//         (rawString.includes('05:30') && !rawString.includes('17:30'))) {
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
          
//           if (json.total_pages && currentPage > json.total_pages) {
//             hasMorePages = false;
//           }
//           if (json.last_page && currentPage > json.last_page) {
//             hasMorePages = false;
//           }
//           if (json.page && json.total_pages && currentPage > json.total_pages) {
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

//   // Fetch + process punches with enhanced error handling
//   const fetchPunches = useCallback(async () => {
//     if (!company || !startDate || !endDate || !employee) {
//       setError("Missing required data: company, dates, or employee");
//       return;
//     }

//     setLoading(true);
//     setError(null);
    
//     try {
//       const biometricId = employee?.biometric_id || id;
      
//       const payload = {
//         biometric_id: biometricId,
//         company_id: company.id,
//         start_date: format(startDate, "yyyy-MM-dd"),
//         end_date: format(endDate, "yyyy-MM-dd"),
//       };

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
//               debugEntries: []
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

//           const workTime = calculateWorkTime(punchIn, punchOut);

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
//             debugEntries: sortedEntries.map(entry => ({
//               timeStr: entry.timeStr,
//               type: entry.type,
//               originalTimeString: entry.originalTimeString,
//               localTime: entry.localTime,
//               utcTime: entry.utcTime,
//               rawData: {
//                 id: entry.rawData.id,
//                 punch_time: entry.rawData.punch_time,
//                 status: entry.rawData.status
//               }
//             }))
//           };
//         });

//       // FIX: Update today's row with real-time data from todaypunch API
//       const today = format(new Date(), "yyyy-MM-dd");
//       const todayRowIndex = rows.findIndex(row => {
//         const rowDate = format(new Date(row.dateDisplay), "yyyy-MM-dd");
//         return rowDate === today;
//       });

//       if (todayRowIndex !== -1 && todayPunchData) {
//         const todayCheckIn = todayPunchData.first_check_in ? formatTimeDirect(todayPunchData.first_check_in) : "-";
//         const todayCheckOut = todayPunchData.last_check_out ? formatTimeDirect(todayPunchData.last_check_out) : "-";
        
//         // Calculate work time for today
//         const todayWorkTime = calculateWorkTime(todayCheckIn, todayCheckOut);
        
//         // Determine today's status
//         let todayStatus = "Present";
//         if (todayCheckIn === "-" && todayCheckOut === "-") {
//           todayStatus = "No punches recorded";
//         } else if (todayCheckIn === "-" || todayCheckOut === "-") {
//           todayStatus = "Partial punch recorded";
//         }

//         rows[todayRowIndex] = {
//           ...rows[todayRowIndex],
//           punchIn: todayCheckIn,
//           punchOut: todayCheckOut,
//           workTime: todayWorkTime,
//           status: todayStatus,
//           hasPunches: todayCheckIn !== "-" || todayCheckOut !== "-",
//           debugEntries: [
//             ...(rows[todayRowIndex].debugEntries || []),
//             {
//               source: 'todayPunchAPI',
//               first_check_in: todayPunchData.first_check_in,
//               last_check_out: todayPunchData.last_check_out,
//               formatted: {
//                 checkIn: todayCheckIn,
//                 checkOut: todayCheckOut
//               }
//             }
//           ]
//         };
//       }

//       setPunches(rows);
//       calculateAverageWorkTime(rows);
      
//       // Commented out debug information setting
//       // setDebugInfo({
//       //   employee: {
//       //     id: employee.id,
//       //     biometric_id: employee.biometric_id,
//       //     name: `${employee.first_name} ${employee.last_name}`,
//       //   },
//       //   dateRange: {
//       //     start: format(startDate, "yyyy-MM-dd"),
//       //     end: format(endDate, "yyyy-MM-dd"),
//       //   },
//       //   apiCalls: {
//       //     todayPunch: todayPunchData,
//       //     allPunches: {
//       //       totalRecords: allPunches.length,
//       //       actualPunches: actualPunches.length,
//       //       placeholderRecords: placeholderRecords.length,
//       //       uniquePunches: Array.from(seenPunches).length,
//       //       sampleRecords: allPunches.slice(0, 3),
//       //     },
//       //   },
//       //   processing: {
//       //     groupedEntries: Object.keys(grouped).length,
//       //     allDatesInRange: allDates.length,
//       //     finalRows: rows.length,
//       //     sampleProcessedData: Object.entries(grouped).slice(0, 3).reduce((acc, [date, entries]) => {
//       //       acc[date] = entries.map(e => ({
//       //         time: e.timeStr,
//       //         type: e.type,
//       //         rawId: e.rawData.id,
//       //         originalTimeString: e.originalTimeString,
//       //         localTime: e.localTime,
//       //         utcTime: e.utcTime
//       //       }));
//       //       return acc;
//       //     }, {} as any),
//       //   },
//       //   // Add detailed row debug information
//       //   rowDebugInfo: rows.map((row, index) => formatRowDebugInfo(row, index)),
//       //   // Focus on problematic dates (partial punches)
//       //   problematicDates: rows.filter(row => row.status === "Partial punch recorded").map(row => 
//       //     formatRowDebugInfo(row, rows.indexOf(row))
//       //   ),
//       //   dateGroupingDebug: {
//       //     '2025-11-06': {
//       //       rawRecords: allPunches.filter(p => 
//       //         p.punch_time && p.punch_time.includes('2025-11-06')
//       //       ).map(p => ({
//       //         id: p.id,
//       //         punch_time: p.punch_time,
//       //         status: p.status,
//       //         localDate: p.punch_time ? new Date(p.punch_time).toLocaleString() : null,
//       //         utcDate: p.punch_time ? new Date(p.punch_time).toUTCString() : null
//       //       })),
//       //       groupedEntries: grouped['2025-11-06'] ? grouped['2025-11-06'].map(e => ({
//       //         timeStr: e.timeStr,
//       //         type: e.type,
//       //         rawId: e.rawData.id,
//       //         rawTime: e.rawData.punch_time,
//       //         originalTimeString: e.originalTimeString,
//       //         localTime: e.localTime,
//       //         utcTime: e.utcTime
//       //       })) : 'No entries'
//       //     }
//       //   },
//       //   timestamps: {
//       //     fetchedAt: new Date().toISOString(),
//       //     timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
//       //     localTime: new Date().toLocaleString(),
//       //     utcTime: new Date().toUTCString()
//       //   }
//       // });
      
//     } catch (err) {
//       console.error("Failed to fetch/process punches", err);
//       const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
//       setError(`Failed to load punches: ${errorMessage}`);
//       setPunches([]);
//       setAverageWorkTime("-");
//     } finally {
//       setLoading(false);
//     }
//   }, [company, startDate, endDate, employee, id, fetchTodaysPunch, fetchAllPunches, getRecordDatetime, getNormalizedType, formatTimeWithDetection, calculateWorkTime, calculateAverageWorkTime, getUTCDateKey]); // Removed formatRowDebugInfo from dependencies

//   // Set default dates when company and employee are available
//   useEffect(() => {
//     if (company && employee) {
//       const now = new Date();
//       setStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
//       setEndDate(now);
//     }
//   }, [company, employee]);

//   // Auto-fetch when dates change
//   useEffect(() => {
//     if (startDate && endDate && company && employee) {
//       fetchPunches();
//     }
//   }, [startDate, endDate, company, employee, fetchPunches]);

//   if (employeesLoading || !employee) {
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
//   const todayCheckIn = todaysPunch?.first_check_in ? formatTimeDirect(todaysPunch.first_check_in) : "-";
//   const todayCheckOut = todaysPunch?.last_check_out ? formatTimeDirect(todaysPunch.last_check_out) : "-";

//   return (
//     <div className="p-6">
//       {/* Header with Employee Name and Back Button */}
//       <div className="mb-6">
//         <div className="flex items-center gap-4 mb-4">
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
//               </div>

//               {employee.role && (
//                 <p className="text-lg text-gray-600 mb-2">
//                   {employee.role}
//                 </p>
//               )}

//               <div className="flex items-center gap-4 text-sm text-gray-500">
//                 {employee.biometric_id && (
//                   <span className="flex items-center gap-1">
//                     <Activity className="h-4 w-4" />
//                     ID: {employee.biometric_id}
//                   </span>
//                 )}
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

//         {/* Debug Toggle Button - Commented out */}
//         {/* <button
//           onClick={() => setShowDebug(!showDebug)}
//           className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition mt-6"
//         >
//           <BugIcon className="h-4 w-4" />
//           {showDebug ? "Hide Debug" : "Show Debug"}
//         </button> */}
//       </div>

//       {/* Debug Information Panel - Commented out */}
//       {/* {showDebug && debugInfo && (
//         <div className="mb-6 p-4 bg-gray-900 text-gray-100 rounded-lg border border-gray-700">
//           ... debug content ...
//         </div>
//       )} */}

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
//                     <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
//                       r.status === "Present" 
//                         ? "bg-green-100 text-green-800"
//                         : r.status === "Partial punch recorded"
//                         ? "bg-yellow-100 text-yellow-800"
//                         : r.status === "Leave"
//                         ? "bg-red-100 text-red-800"
//                         : "bg-gray-100 text-gray-800"
//                     }`}>
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


// with debug commented
// // src/app/dashboard/employees/[id]/punches/page.tsx

// "use client";

// import { useEffect, useState, useCallback } from "react";
// import { useAuth } from "@/context/AuthContext";
// import { useParams } from "next/navigation";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import { format, parseISO, differenceInMinutes } from "date-fns";
// import Link from "next/link";
// import { ArrowLeft, UserIcon, Activity, ArrowUpCircle, ArrowDownCircle, ChevronDown, ChevronRight } from "lucide-react"; // Removed BugIcon
// import Image from "next/image";
// import { useEmployees } from "@/hooks/employees/useGetEmployees";

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
//           const [hours, minutes] = time.split(':');
          
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
//   const { id } = useParams();
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
//   // Commented out debug states
//   // const [debugInfo, setDebugInfo] = useState<any>(null);
//   // const [showDebug, setShowDebug] = useState(false);

//   // Use the hook to fetch all employees
//   const { data: employeesData, isLoading: employeesLoading } = useEmployees(company?.id, 1, 5000);

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

//   // Commented out debug function
//   /*
//   // Add this new function to format debug information for each row
//   const formatRowDebugInfo = useCallback((row: any, index: number) => {
//     return {
//       rowIndex: index,
//       date: row.dateDisplay,
//       punchIn: row.punchIn,
//       punchOut: row.punchOut,
//       status: row.status,
//       workTime: row.workTime,
//       hasPunches: row.hasPunches,
//       entryCount: row.entryCount,
//       rawTimes: row.rawTimes,
//       dateKey: row.dateKey,
//       debugEntries: row.debugEntries,
//       // Add timezone information
//       timezoneInfo: {
//         localTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
//         currentTime: new Date().toLocaleString(),
//         currentUTCTime: new Date().toUTCString()
//       }
//     };
//   }, []);
//   */

//   // Fetch today's punch data
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
//               timeString.includes(' 05:30:00') ||
//               (timeString.includes('05:30') && !timeString.includes('17:30'))) {
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
//           first_check_in: null, 
//           last_check_out: null, 
//         };
//     }
//   }, [company]);

//   // Find employee from the fetched employees data
//   useEffect(() => {
//     if (employeesData?.employees && id) {
//       let foundEmployee = null;
      
//       // Try to find employee by different identifiers
//       foundEmployee = employeesData.employees.find((emp: any) => String(emp.id) === id);
//       if (foundEmployee) {
//         setEmployee(foundEmployee);
//         return;
//       }
      
//       foundEmployee = employeesData.employees.find((emp: any) => String(emp.biometric_id) === id);
//       if (foundEmployee) {
//         setEmployee(foundEmployee);
//         return;
//       }
      
//       foundEmployee = employeesData.employees.find((emp: any) => String(emp.employee_id) === id);
//       if (foundEmployee) {
//         setEmployee(foundEmployee);
//         return;
//       }
      
//       // Set default employee info if not found
//       setEmployee({
//         id: id as string,
//         first_name: "Employee",
//         last_name: "",
//         biometric_id: id as string
//       });
//     }
//   }, [employeesData, id]);

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
//         rawString.includes(' 05:30:00') ||
//         (rawString.includes('05:30') && !rawString.includes('17:30'))) {
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
          
//           if (json.total_pages && currentPage > json.total_pages) {
//             hasMorePages = false;
//           }
//           if (json.last_page && currentPage > json.last_page) {
//             hasMorePages = false;
//           }
//           if (json.page && json.total_pages && currentPage > json.total_pages) {
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

//   // Fetch + process punches with enhanced error handling
//   const fetchPunches = useCallback(async () => {
//     if (!company || !startDate || !endDate || !employee) {
//       setError("Missing required data: company, dates, or employee");
//       return;
//     }

//     setLoading(true);
//     setError(null);
    
//     try {
//       const biometricId = employee?.biometric_id || id;
      
//       const payload = {
//         biometric_id: biometricId,
//         company_id: company.id,
//         start_date: format(startDate, "yyyy-MM-dd"),
//         end_date: format(endDate, "yyyy-MM-dd"),
//       };

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
//               // Removed debugEntries
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

//           const workTime = calculateWorkTime(punchIn, punchOut);

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
//             // Removed debugEntries
//           };
//         });

//       // FIXED: Update today's row with real-time data from todaypunch API - MIDNIGHT FIX
//       const today = format(new Date(), "yyyy-MM-dd");
//       const todayRowIndex = rows.findIndex(row => row.dateKey === today);

//       if (todayRowIndex !== -1 && todayPunchData && todayPunchData.first_check_in) {
//         // Check if the todayPunchData actually belongs to today or yesterday
//         const punchDate = format(new Date(todayPunchData.first_check_in), "yyyy-MM-dd");
        
//         if (punchDate === today) {
//           // Only apply if the data is from today (normal case during the day)
//           const todayCheckIn = formatTimeDirect(todayPunchData.first_check_in);
//           const todayCheckOut = todayPunchData.last_check_out ? formatTimeDirect(todayPunchData.last_check_out) : "-";
          
//           const todayWorkTime = calculateWorkTime(todayCheckIn, todayCheckOut);
          
//           let todayStatus = "Present";
//           if (todayCheckIn === "-" && todayCheckOut === "-") {
//             todayStatus = "No punches recorded";
//           } else if (todayCheckIn === "-" || todayCheckOut === "-") {
//             todayStatus = "Partial punch recorded";
//           }

//           rows[todayRowIndex] = {
//             ...rows[todayRowIndex],
//             punchIn: todayCheckIn,
//             punchOut: todayCheckOut,
//             workTime: todayWorkTime,
//             status: todayStatus,
//             hasPunches: todayCheckIn !== "-" || todayCheckOut !== "-",
//             // Removed debugEntries
//           };
//         } else {
//           // Data is from yesterday (midnight case) - apply to yesterday's row instead
//           const yesterdayRowIndex = rows.findIndex(row => row.dateKey === punchDate);
          
//           if (yesterdayRowIndex !== -1) {
//             const yesterdayCheckIn = formatTimeDirect(todayPunchData.first_check_in);
//             const yesterdayCheckOut = todayPunchData.last_check_out ? formatTimeDirect(todayPunchData.last_check_out) : "-";
            
//             const yesterdayWorkTime = calculateWorkTime(yesterdayCheckIn, yesterdayCheckOut);
            
//             let yesterdayStatus = "Present";
//             if (yesterdayCheckIn === "-" && yesterdayCheckOut === "-") {
//               yesterdayStatus = "No punches recorded";
//             } else if (yesterdayCheckIn === "-" || yesterdayCheckOut === "-") {
//               yesterdayStatus = "Partial punch recorded";
//             }

//             rows[yesterdayRowIndex] = {
//               ...rows[yesterdayRowIndex],
//               punchIn: yesterdayCheckIn,
//               punchOut: yesterdayCheckOut,
//               workTime: yesterdayWorkTime,
//               status: yesterdayStatus,
//               hasPunches: yesterdayCheckIn !== "-" || yesterdayCheckOut !== "-",
//               // Removed debugEntries
//             };
//           }
//         }
//       }

//       setPunches(rows);
//       calculateAverageWorkTime(rows);
      
//       // Commented out debug information setting
//       /*
//       // Set debug information with detailed row info
//       setDebugInfo({
//         employee: {
//           id: employee.id,
//           biometric_id: employee.biometric_id,
//           name: `${employee.first_name} ${employee.last_name}`,
//         },
//         dateRange: {
//           start: format(startDate, "yyyy-MM-dd"),
//           end: format(endDate, "yyyy-MM-dd"),
//         },
//         apiCalls: {
//           todayPunch: todayPunchData,
//           allPunches: {
//             totalRecords: allPunches.length,
//             actualPunches: actualPunches.length,
//             placeholderRecords: placeholderRecords.length,
//             uniquePunches: Array.from(seenPunches).length,
//             sampleRecords: allPunches.slice(0, 3),
//           },
//         },
//         processing: {
//           groupedEntries: Object.keys(grouped).length,
//           allDatesInRange: allDates.length,
//           finalRows: rows.length,
//           sampleProcessedData: Object.entries(grouped).slice(0, 3).reduce((acc, [date, entries]) => {
//             acc[date] = entries.map(e => ({
//               time: e.timeStr,
//               type: e.type,
//               rawId: e.rawData.id,
//               originalTimeString: e.originalTimeString,
//               localTime: e.localTime,
//               utcTime: e.utcTime
//             }));
//             return acc;
//           }, {} as any),
//         },
//         // Add detailed row debug information
//         rowDebugInfo: rows.map((row, index) => formatRowDebugInfo(row, index)),
//         // Focus on problematic dates (partial punches)
//         problematicDates: rows.filter(row => row.status === "Partial punch recorded").map(row => 
//           formatRowDebugInfo(row, rows.indexOf(row))
//         ),
//         dateGroupingDebug: {
//           '2025-11-06': {
//             rawRecords: allPunches.filter(p => 
//               p.punch_time && p.punch_time.includes('2025-11-06')
//             ).map(p => ({
//               id: p.id,
//               punch_time: p.punch_time,
//               status: p.status,
//               localDate: p.punch_time ? new Date(p.punch_time).toLocaleString() : null,
//               utcDate: p.punch_time ? new Date(p.punch_time).toUTCString() : null
//             })),
//             groupedEntries: grouped['2025-11-06'] ? grouped['2025-11-06'].map(e => ({
//               timeStr: e.timeStr,
//               type: e.type,
//               rawId: e.rawData.id,
//               rawTime: e.rawData.punch_time,
//               originalTimeString: e.originalTimeString,
//               localTime: e.localTime,
//               utcTime: e.utcTime
//             })) : 'No entries'
//           }
//         },
//         timestamps: {
//           fetchedAt: new Date().toISOString(),
//           timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
//           localTime: new Date().toLocaleString(),
//           utcTime: new Date().toUTCString()
//         }
//       });
//       */
      
//     } catch (err) {
//       console.error("Failed to fetch/process punches", err);
//       const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
//       setError(`Failed to load punches: ${errorMessage}`);
//       setPunches([]);
//       setAverageWorkTime("-");
//     } finally {
//       setLoading(false);
//     }
//   }, [company, startDate, endDate, employee, id, fetchTodaysPunch, fetchAllPunches, getRecordDatetime, getNormalizedType, formatTimeWithDetection, calculateWorkTime, calculateAverageWorkTime, getUTCDateKey]); // Removed formatRowDebugInfo from dependencies

//   // Set default dates when company and employee are available
//   useEffect(() => {
//     if (company && employee) {
//       const now = new Date();
//       setStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
//       setEndDate(now);
//     }
//   }, [company, employee]);

//   // Auto-fetch when dates change
//   useEffect(() => {
//     if (startDate && endDate && company && employee) {
//       fetchPunches();
//     }
//   }, [startDate, endDate, company, employee, fetchPunches]);

//   if (employeesLoading || !employee) {
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
//   const todayCheckIn = todaysPunch?.first_check_in ? formatTimeDirect(todaysPunch.first_check_in) : "-";
//   const todayCheckOut = todaysPunch?.last_check_out ? formatTimeDirect(todaysPunch.last_check_out) : "-";

//   return (
//     <div className="p-6">
//       {/* Header with Employee Name and Back Button */}
//       <div className="mb-6">
//         <div className="flex items-center gap-4 mb-4">
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
//               </div>

//               {employee.role && (
//                 <p className="text-lg text-gray-600 mb-2">
//                   {employee.role}
//                 </p>
//               )}

//               <div className="flex items-center gap-4 text-sm text-gray-500">
//                 {employee.biometric_id && (
//                   <span className="flex items-center gap-1">
//                     <Activity className="h-4 w-4" />
//                     ID: {employee.biometric_id}
//                   </span>
//                 )}
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

//         {/* Commented out Debug Toggle Button */}
//         {/*
//         <button
//           onClick={() => setShowDebug(!showDebug)}
//           className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition mt-6"
//         >
//           <BugIcon className="h-4 w-4" />
//           {showDebug ? "Hide Debug" : "Show Debug"}
//         </button>
//         */}
//       </div>

//       {/* Commented out Debug Information Panel */}
//       {/*
//       {showDebug && debugInfo && (
//         <div className="mb-6 p-4 bg-gray-900 text-gray-100 rounded-lg border border-gray-700">
//           <div className="flex items-center gap-2 mb-4">
//             <BugIcon className="h-5 w-5 text-yellow-400" />
//             <h3 className="text-lg font-bold text-white">Debug Information</h3>
//           </div>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {/* Employee Info * /}
//             <div>
//               <h4 className="font-semibold text-blue-300 mb-2">Employee Details</h4>
//               <pre className="text-sm bg-gray-800 p-3 rounded overflow-auto max-h-40">
//                 {JSON.stringify(debugInfo.employee, null, 2)}
//               </pre>
//             </div>

//             {/* Date Range * /}
//             <div>
//               <h4 className="font-semibold text-blue-300 mb-2">Date Range</h4>
//               <pre className="text-sm bg-gray-800 p-3 rounded overflow-auto max-h-40">
//                 {JSON.stringify(debugInfo.dateRange, null, 2)}
//               </pre>
//             </div>

//             {/* API Calls * /}
//             <div>
//               <h4 className="font-semibold text-green-300 mb-2">API Response Summary</h4>
//               <pre className="text-sm bg-gray-800 p-3 rounded overflow-auto max-h-40">
//                 {JSON.stringify({
//                   todayPunch: debugInfo.apiCalls.todayPunch ? {
//                     hasData: true,
//                     first_check_in: debugInfo.apiCalls.todayPunch.first_check_in,
//                     last_check_out: debugInfo.apiCalls.todayPunch.last_check_out,
//                     total_sessions: debugInfo.apiCalls.todayPunch.total_sessions
//                   } : { hasData: false },
//                   allPunches: debugInfo.apiCalls.allPunches
//                 }, null, 2)}
//               </pre>
//             </div>

//             {/* Processing Info * /}
//             <div>
//               <h4 className="font-semibold text-purple-300 mb-2">Processing Info</h4>
//               <pre className="text-sm bg-gray-800 p-3 rounded overflow-auto max-h-40">
//                 {JSON.stringify(debugInfo.processing, null, 2)}
//               </pre>
//             </div>

//             {/* Problematic Dates (Partial Punches) * /}
//             <div className="md:col-span-2">
//               <h4 className="font-semibold text-orange-300 mb-2">Problematic Dates (Partial Punches)</h4>
//               <pre className="text-sm bg-gray-800 p-3 rounded overflow-auto max-h-60">
//                 {JSON.stringify(debugInfo.problematicDates, null, 2)}
//               </pre>
//             </div>

//             {/* All Row Debug Info * /}
//             <div className="md:col-span-2">
//               <h4 className="font-semibold text-yellow-300 mb-2">All Dates Debug Info</h4>
//               <div className="max-h-60 overflow-auto">
//                 {debugInfo.rowDebugInfo.map((row: any, index: number) => (
//                   <details key={index} className="mb-2">
//                     <summary className="cursor-pointer hover:text-white font-mono text-sm">
//                       {row.date} - {row.status} (In: {row.punchIn}, Out: {row.punchOut})
//                     </summary>
//                     <pre className="text-sm bg-gray-800 p-2 mt-1 rounded overflow-auto">
//                       {JSON.stringify(row, null, 2)}
//                     </pre>
//                   </details>
//                 ))}
//               </div>
//             </div>

//             {/* Date Grouping Debug * /}
//             <div>
//               <h4 className="font-semibold text-orange-300 mb-2">Date Grouping Debug (2025-11-06)</h4>
//               <pre className="text-sm bg-gray-800 p-3 rounded overflow-auto max-h-40">
//                 {JSON.stringify(debugInfo.dateGroupingDebug, null, 2)}
//               </pre>
//             </div>

//             {/* Raw Sample Data * /}
//             <div className="md:col-span-2">
//               <h4 className="font-semibold text-yellow-300 mb-2">Raw API Sample (First 3 Records)</h4>
//               <pre className="text-sm bg-gray-800 p-3 rounded overflow-auto max-h-60">
//                 {JSON.stringify(debugInfo.apiCalls.allPunches.sampleRecords, null, 2)}
//               </pre>
//             </div>

//             {/* Grouped Data Sample * /}
//             <div className="md:col-span-2">
//               <h4 className="font-semibold text-orange-300 mb-2">Grouped Data Sample (First 3 Dates)</h4>
//               <pre className="text-sm bg-gray-800 p-3 rounded overflow-auto max-h-60">
//                 {JSON.stringify(debugInfo.processing.sampleProcessedData, null, 2)}
//               </pre>
//             </div>

//             {/* Timezone Info * /}
//             <div>
//               <h4 className="font-semibold text-blue-300 mb-2">Timezone Information</h4>
//               <pre className="text-sm bg-gray-800 p-3 rounded overflow-auto max-h-40">
//                 {JSON.stringify(debugInfo.timestamps, null, 2)}
//               </pre>
//             </div>
//           </div>

//           <div className="mt-4 pt-4 border-t border-gray-700">
//             <div className="flex justify-between items-center text-sm">
//               <span className="text-gray-400">
//                 Fetched at: {new Date(debugInfo.timestamps.fetchedAt).toLocaleString()}
//               </span>
//               <button
//                 onClick={() => {
//                   navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
//                   alert('Debug info copied to clipboard!');
//                 }}
//                 className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
//               >
//                 Copy Debug Info
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//       */}

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
//                     <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
//                       r.status === "Present" 
//                         ? "bg-green-100 text-green-800"
//                         : r.status === "Partial punch recorded"
//                         ? "bg-yellow-100 text-yellow-800"
//                         : r.status === "Leave"
//                         ? "bg-red-100 text-red-800"
//                         : "bg-gray-100 text-gray-800"
//                     }`}>
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

// src/app/dashboard/employees/[id]/punches/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useParams, useSearchParams } from "next/navigation"; // Added useSearchParams
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parseISO, differenceInMinutes } from "date-fns";
import Link from "next/link";
import { ArrowLeft, UserIcon, Activity, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import Image from "next/image";
import { useEmployee } from "@/hooks/employees/useGetEmployee";
import FixPunch from "@/components/fix-punch";

// Fixed TimeCircle component
function TimeCircle({ checkIn, checkOut, size = 70 }: {
  checkIn: string;
  checkOut: string;
  size?: number
}) {
  // Calculate work hours between two times
  const calculateWorkHours = (checkIn: string, checkOut: string): string => {
    if (checkIn === "-" || checkOut === "-" || checkIn === "--" || checkOut === "--") return "--";

    try {
      const parseTime = (timeStr: string): Date => {
        // Handle UTC times in 12-hour format
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
          // Handle 24-hour format
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

      // Handle next day check-out
      let adjustedOutTime = new Date(outTime);
      if (adjustedOutTime < inTime) {
        adjustedOutTime.setUTCDate(adjustedOutTime.getUTCDate() + 1);
      }

      const totalMinutes = differenceInMinutes(adjustedOutTime, inTime);

      if (totalMinutes <= 0) return "--";

      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;

      // Format hours with proper decimal places
      const decimalHours = hours + (mins / 60);
      return decimalHours.toFixed(2);
    } catch {
      return "--";
    }
  };

  // Calculate current work hours if still working
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

      // Format hours with proper decimal places
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

  // Calculate progress for the circle (assuming 8-hour work day)
  const calculateProgress = () => {
    if (!hasValidData) return 0;

    try {
      const hours = parseFloat(totalHours);
      const progress = Math.min((hours / 8) * 100, 100); // Cap at 100%
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
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
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

        {/* Center text */}
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

// Helper functions for UTC time detection
const isMorningTime = (timeStr: string): boolean => {
  if (!timeStr || timeStr === "-") return false;

  try {
    if (timeStr.includes('AM')) return true;
    if (timeStr.includes('PM')) return false;

    // For 24-hour format
    const [hours] = timeStr.split(':');
    const hour = parseInt(hours);
    return hour < 12;
  } catch {
    return false;
  }
};

const isAfternoonTime = (timeStr: string): boolean => {
  if (!timeStr || timeStr === "-") return false;

  try {
    if (timeStr.includes('PM')) return true;
    if (timeStr.includes('AM')) return false;

    // For 24-hour format
    const [hours] = timeStr.split(':');
    const hour = parseInt(hours);
    return hour >= 12;
  } catch {
    return false;
  }
};

export default function EmployeePunchPage() {
  const { id } = useParams(); // This is the employee_id (user_id) from URL - e.g., 91
  const searchParams = useSearchParams(); // Get query params
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

  // Get biometric_id from query params if provided, otherwise will use from employee data
  const biometricIdFromQuery = searchParams.get('biometric_id');

  // Use the hook to fetch specific employee by user_id (91)
  const { data: employeeData, isLoading: employeeLoading } = useEmployee(company?.id, id as string);

  // Set employee state when data is available
  useEffect(() => {
    if (employeeData) {
      setEmployee(employeeData);
      console.log("✅ Employee data loaded:", {
        user_id: employeeData.id,
        biometric_id: employeeData.biometric_id,
        biometric_id_from_query: biometricIdFromQuery
      });
    } else if (!employeeLoading && id) {
      // Set default employee info if not found after loading
      setEmployee({
        id: id as string,
        first_name: "Employee",
        last_name: "",
        biometric_id: id as string
      });
    }
  }, [employeeData, employeeLoading, id, biometricIdFromQuery]);

  // Helper to get profile image URL
  const getProfileImageUrl = (emp: any) => {
    if (!emp?.prof_img) return null;

    if (emp.prof_img.startsWith("http")) {
      return emp.prof_img;
    }

    return company?.mediaBaseUrl
      ? `${company.mediaBaseUrl}${emp.prof_img}`
      : emp.prof_img;
  };

  // Updated formatTimeDirect to display raw times correctly for all formats
  const formatTimeDirect = useCallback((originalTimeString?: string): string => {
    if (!originalTimeString) return "-";

    // Handle null, undefined, or empty strings
    if (originalTimeString === "null" || originalTimeString === "undefined" || originalTimeString.trim() === "") {
      return "-";
    }

    // Check for placeholder times first
    if (originalTimeString.includes('05:30:00') || originalTimeString.includes('T05:30:00Z')) {
      return "-";
    }

    // For UTC strings (with or without Z) - Enhanced detection
    if (originalTimeString.includes('T') && originalTimeString.includes(':')) {
      try {
        // Extract time part from formats like:
        // "2025-11-10T08:59:09Z" 
        // "2025-11-03T08:59:55"
        // "2025-11-06T08:59:24Z"
        const timePart = originalTimeString.split('T')[1].replace('Z', '');
        const [hours, minutes, seconds] = timePart.split(':');

        const hourNum = parseInt(hours);
        const minuteNum = parseInt(minutes);

        // Check if this is a default/placeholder time (like 05:30:00)
        if (hourNum === 5 && minuteNum === 30 && parseInt(seconds) === 0) {
          return "-";
        }

        // Convert UTC hour to 12-hour format for display
        // This will show the original UTC time as stored in the string
        const period = hourNum >= 12 ? 'PM' : 'AM';
        const hour12 = hourNum % 12 || 12;

        return `${hour12.toString().padStart(2, '0')}:${minuteNum.toString().padStart(2, '0')} ${period}`;
      } catch (e) {
        console.log("Failed to extract time from UTC string:", e);
        return "-";
      }
    }

    // For time-only strings (like "08:59:15")
    if (originalTimeString.includes(':') && !originalTimeString.includes('T') && !originalTimeString.includes(' ')) {
      try {
        const [hours, minutes, seconds] = originalTimeString.split(':');
        const hourNum = parseInt(hours);
        const minuteNum = parseInt(minutes);

        // Check if this is a default/placeholder time (like 05:30:00)
        if (hourNum === 5 && minuteNum === 30 && parseInt(seconds || '0') === 0) {
          return "-";
        }

        const period = hourNum >= 12 ? 'PM' : 'AM';
        const hour12 = hourNum % 12 || 12;

        return `${hour12.toString().padStart(2, '0')}:${minuteNum.toString().padStart(2, '0')} ${period}`;
      } catch (e) {
        console.log("Failed to parse time-only string:", e);
        return "-";
      }
    }

    // For 12-hour format strings (like "10:59 AM")
    if ((originalTimeString.includes('AM') || originalTimeString.includes('PM')) && originalTimeString.includes(':')) {
      try {
        const [timePart, period] = originalTimeString.split(' ');
        const [hours, minutes] = timePart.split(':');

        const hourNum = parseInt(hours);
        const minuteNum = parseInt(minutes);

        return `${hourNum.toString().padStart(2, '0')}:${minuteNum.toString().padStart(2, '0')} ${period}`;
      } catch (e) {
        console.log("Failed to parse 12-hour format string:", e);
        return "-";
      }
    }

    // For other date strings, try to parse and extract time
    try {
      const date = new Date(originalTimeString);

      if (isNaN(date.getTime())) {
        return "-";
      }

      // Check if this is a default/placeholder time (like 05:30:00)
      if (date.getUTCHours() === 5 && date.getUTCMinutes() === 30 && date.getUTCSeconds() === 0) {
        return "-";
      }

      // Use UTC hours for display to show raw times consistently
      const utcHours = date.getUTCHours();
      const utcMinutes = date.getUTCMinutes();
      const period = utcHours >= 12 ? 'PM' : 'AM';
      const hour12 = utcHours % 12 || 12;

      return `${hour12.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')} ${period}`;
    } catch (e) {
      console.log("Failed to parse time:", e, "Original:", originalTimeString);
      return "-";
    }
  }, []);

  // Enhanced time formatting with placeholder detection
  const formatTimeWithDetection = useCallback((date: Date, originalTimeString?: string): string => {
    return formatTimeDirect(originalTimeString);
  }, [formatTimeDirect]);

  // Fetch today's punch data - UPDATED to accept biometricId parameter
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
        console.log("📅 Today's punch API RAW response:", todayData);

        // Filter out placeholder 05:30 times
        const filterPlaceholderTimes = (timeString: string | null) => {
          if (!timeString) return null;

          // Check if this is a 05:30 placeholder time
          if (timeString.includes('T05:30:00Z') ||
            timeString.includes(' 05:30:00') ||
            (timeString.includes('05:30') && !timeString.includes('17:30'))) {
            return null;
          }

          return timeString;
        };

        // Process today's data to filter out placeholder times
        const processedTodayData = {
          ...todayData,
          first_check_in: filterPlaceholderTimes(todayData.first_check_in),
          last_check_out: filterPlaceholderTimes(todayData.last_check_out),
          // Process punch sessions to remove placeholder entries
          punch_sessions: todayData.punch_sessions?.filter((session: any) => {
            const checkInTime = session.check_in || session.in_time;
            const checkOutTime = session.check_out || session.out_time;

            // Filter out sessions that only have placeholder times
            const hasValidCheckIn = checkInTime && !checkInTime.includes('T05:30:00Z');
            const hasValidCheckOut = checkOutTime && !checkOutTime.includes('T05:30:00Z');

            return hasValidCheckIn || hasValidCheckOut;
          }) || []
        };

        console.log("✅ Processed today's data:", processedTodayData);

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

  // Helper to format date
  const formatDate = (date: Date, formatStr: string): string => {
    return format(date, formatStr);
  };

  // Calculate work time in minutes for a day (using UTC times)
  const calculateWorkTime = useCallback((punchIn: string, punchOut: string): number => {
    if (punchIn === "-" || punchOut === "-") return 0;

    try {
      // Parse UTC times (assuming format "HH:MM AM/PM")
      const parseUTCTime = (timeStr: string): Date => {
        // Handle UTC times in 12-hour format with AM/PM
        if (timeStr.includes('AM') || timeStr.includes('PM')) {
          const [time, period] = timeStr.split(' ');
          const [hours, minutes] = time.split(':');

          let hour = parseInt(hours);
          const minute = parseInt(minutes);

          if (period === 'PM' && hour !== 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;

          // Create date with UTC time
          const date = new Date();
          date.setUTCHours(hour, minute, 0, 0);
          return date;
        } else {
          // If it's in 24-hour format "HH:MM"
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

      // Handle case where check-out is next day (like 01:02 AM after 03:47 PM)
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

  // Format minutes to HH:MM format
  const formatMinutesToTime = useCallback((minutes: number): string => {
    if (minutes <= 0) return "-";

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return `${hours}h ${mins}m`;
  }, []);

  // Enhanced date parsing - filter out placeholder times
  const tryParseDate = useCallback((raw: any, record: any): { date: Date; originalString?: string } | null => {
    if (!raw) {
      return null;
    }

    // Check if this is a placeholder 05:30 time
    const rawString = String(raw);
    if (rawString.includes('T05:30:00Z') ||
      rawString.includes(' 05:30:00') ||
      (rawString.includes('05:30') && !rawString.includes('17:30'))) {
      return null;
    }

    if (raw instanceof Date && !isNaN(raw.getTime())) {
      return { date: raw };
    }

    try {
      // For UTC strings, parse and keep as UTC but the display will convert to local
      if (typeof raw === "string" && raw.includes('T') && raw.endsWith('Z')) {
        const dt = new Date(raw);
        if (!isNaN(dt.getTime())) {
          return { date: dt, originalString: raw };
        }
      }

      const iso = typeof raw === "string" ? raw.trim() : "";
      if (iso) {
        const dt = new Date(iso);
        if (!isNaN(dt.getTime())) {
          return { date: dt, originalString: iso };
        }
      }
    } catch (e) {
      console.log("Failed to parse as ISO:", e);
    }

    try {
      const dt = new Date(raw);
      if (!isNaN(dt.getTime())) {
        return { date: dt };
      }
    } catch (e) {
      console.log("Failed to parse directly:", e);
    }

    return null;
  }, []);

  // Helper function to get UTC date key for grouping
  const getUTCDateKey = useCallback((date: Date): string => {
    const utcYear = date.getUTCFullYear();
    const utcMonth = date.getUTCMonth();
    const utcDate = date.getUTCDate();
    return format(new Date(Date.UTC(utcYear, utcMonth, utcDate)), "yyyy-MM-dd");
  }, []);

  const getRecordDatetime = useCallback((r: any): { date: Date; originalString?: string; dateKey: string } | null => {
    if (r.punch_time === null && r.message && r.status === "leave") {
      return null;
    }

    // Handle summary records that have date + time separately
    if (r.date && r.punch_time && typeof r.punch_time === 'string' && r.punch_time.includes(':') && !r.punch_time.includes('T')) {
      try {
        // Combine date and time: "2025-10-31T08:59:15"
        const combinedDateTime = `${r.date}T${r.punch_time}`;
        const dt = new Date(combinedDateTime);
        if (!isNaN(dt.getTime())) {
          const dateKey = getUTCDateKey(dt);
          return { date: dt, originalString: combinedDateTime, dateKey };
        }
      } catch (e) {
        console.log("Failed to parse combined date-time:", e);
      }
    }

    const possibleFields = [
      'punch_time', 'punchTime', 'timestamp', 'time',
      'created_at', 'created', 'date', 'punch_date',
      'check_in', 'check_out', 'in_time', 'out_time',
      'punch_in', 'punch_out', 'entry_time', 'exit_time'
    ];

    for (const field of possibleFields) {
      if (r[field] !== undefined && r[field] !== null) {
        const result = tryParseDate(r[field], r);
        if (result) {
          const dateKey = getUTCDateKey(result.date);
          return { ...result, dateKey };
        }
      }
    }

    return null;
  }, [tryParseDate, getUTCDateKey]);

  const getNormalizedType = useCallback((r: any): string => {
    if (r.punch_time === null && r.message && r.status === "leave") {
      return "Placeholder";
    }

    // For summary records, determine type based on context
    if (r.date && r.punch_time && typeof r.punch_time === 'string' && r.punch_time.includes(':') && !r.punch_time.includes('T')) {
      // If it's a summary record with only one time, we can't definitively know if it's check-in or check-out
      // But we can make an educated guess based on common patterns
      const time = r.punch_time;
      const hour = parseInt(time.split(':')[0]);

      // Morning times (before 12) are likely check-ins, afternoon times are likely check-outs
      if (hour < 12) return "Check-In";
      if (hour >= 12) return "Check-Out";

      return "Unknown";
    }

    const possibleTypeFields = ['status', 'type', 'punch_type', 'event_type', 'punch_status', 'direction'];

    for (const field of possibleTypeFields) {
      if (r[field] !== undefined && r[field] !== null) {
        const s = r[field].toString().toLowerCase();

        if (s.includes('checkin') || s.includes('check-in') || s.includes('in') || s === '0' || s === 'in' || s === 'entry')
          return "Check-In";
        if (s.includes('checkout') || s.includes('check-out') || s.includes('out') || s === '1' || s === 'out' || s === 'exit')
          return "Check-Out";
      }
    }

    if (r.check_in || r.in_time || r.punch_in || r.entry_time) return "Check-In";
    if (r.check_out || r.out_time || r.punch_out || r.exit_time) return "Check-Out";

    return "Unknown";
  }, []);

  // Helper function to extract raw list from API response
  const getRawListFromResponse = useCallback((json: any): any[] => {
    if (Array.isArray(json)) {
      return json;
    } else if (json && Array.isArray(json.punches)) {
      return json.punches;
    } else if (json && Array.isArray(json.data)) {
      return json.data;
    } else if (json && Array.isArray(json.results)) {
      return json.results;
    } else if (json && Array.isArray(json.records)) {
      return json.records;
    }
    return [];
  }, []);

  // Fetch all pages of punches
  const fetchAllPunches = useCallback(async (payload: any): Promise<any[]> => {
    let allPunches: any[] = [];
    let currentPage = 1;
    let hasMorePages = true;
    const maxPages = 10;

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

        const json = await res.json();
        const rawList = getRawListFromResponse(json);

        // Filter out placeholder records with 05:30 times
        const filteredList = rawList.filter((record: any) => {
          // Check all time fields for placeholder 05:30 times
          const timeFields = ['punch_time', 'check_in', 'check_out', 'in_time', 'out_time'];

          for (const field of timeFields) {
            if (record[field] && String(record[field]).includes('05:30:00')) {
              return false; // Exclude this record
            }
          }

          return true; // Include this record
        });

        if (filteredList.length === 0) {
          hasMorePages = false;
        } else {
          allPunches = [...allPunches, ...filteredList];
          currentPage++;

          if (json.total_page && currentPage > json.total_page) {
            hasMorePages = false;
          }
          if (json.last_page && currentPage > json.last_page) {
            hasMorePages = false;
          }
          if (json.page && json.total_page && currentPage > json.total_page) {
            hasMorePages = false;
          }
        }
      } catch (error) {
        console.error(`Error fetching page ${currentPage}:`, error);
        throw error;
      }
    }

    return allPunches;
  }, [getRawListFromResponse]);

  // Calculate average work time
  const calculateAverageWorkTime = useCallback((punchesData: any[]): void => {
    const validDays = punchesData.filter(day =>
      day.hasPunches && day.punchIn !== "-" && day.punchOut !== "-"
    );

    if (validDays.length === 0) {
      setAverageWorkTime("-");
      return;
    }

    const totalMinutes = validDays.reduce((total, day) => {
      return total + calculateWorkTime(day.punchIn, day.punchOut);
    }, 0);

    const averageMinutes = Math.round(totalMinutes / validDays.length);
    setAverageWorkTime(formatMinutesToTime(averageMinutes));
  }, [calculateWorkTime, formatMinutesToTime]);

  // Fetch + process punches with enhanced error handling - UPDATED to use biometric_id from query or employee
  const fetchPunches = useCallback(async () => {
    if (!company || !startDate || !endDate) {
      setError("Missing required data: company or dates");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get biometric_id: Priority 1. From query params, 2. From employee data, 3. Fallback to URL id
      let biometricId;
      
      if (biometricIdFromQuery) {
        // Use biometric_id from query params (most reliable)
        biometricId = biometricIdFromQuery;
        console.log("🔍 Using biometric_id from query params:", biometricId);
      } else if (employee?.biometric_id) {
        // Use biometric_id from employee data
        biometricId = employee.biometric_id;
        console.log("🔍 Using biometric_id from employee data:", biometricId);
      } else {
        // Fallback to URL id
        biometricId = id as string;
        console.log("🔍 Using URL id as fallback biometric_id:", biometricId);
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

      // Fetch all pages
      const allPunches = await fetchAllPunches(payload);

      const actualPunches: any[] = [];
      const placeholderRecords: any[] = [];

      allPunches.forEach(record => {
        if (record.punch_time === null && record.message && record.status === "leave") {
          placeholderRecords.push(record);
        } else {
          actualPunches.push(record);
        }
      });

      const grouped: Record<string, any[]> = {};

      // Process only actual punches (ignore placeholders) with proper date grouping
      const seenPunches = new Set();
      for (const rec of actualPunches) {
        const punchKey = `${rec.id || rec.punch_time}_${rec.status}`;
        if (seenPunches.has(punchKey)) {
          continue;
        }
        seenPunches.add(punchKey);

        const result = getRecordDatetime(rec);
        if (!result) {
          continue;
        }

        const { date: dt, originalString, dateKey } = result;
        const punchType = getNormalizedType(rec);
        const displayTime = formatTimeWithDetection(dt, originalString);

        if (!grouped[dateKey]) grouped[dateKey] = [];

        grouped[dateKey].push({
          datetime: dt,
          timeStr: displayTime,
          type: punchType,
          rawData: rec,
          originalTimeString: originalString,
          localTime: dt.toLocaleString(),
          utcTime: dt.toUTCString()
        });
      }

      // Also add placeholder dates to grouped data so we know which dates have no punches
      placeholderRecords.forEach(record => {
        if (record.date) {
          const dateKey = record.date;
          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }
        }
      });

      // Generate rows for ALL dates in the range
      const allDates: string[] = [];
      const currentDate = new Date(startDate);
      const finalEndDate = new Date(endDate);

      while (currentDate <= finalEndDate) {
        allDates.push(format(currentDate, "yyyy-MM-dd"));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      let rows = allDates
        .sort((a, b) => (a < b ? 1 : -1))
        .map((dateKey) => {
          const entries = grouped[dateKey] || [];

          // Filter out duplicate entries by unique punch id/time
          const uniqueEntries = entries.filter((entry, index, self) =>
            index === self.findIndex(e =>
              e.rawData.id === entry.rawData.id &&
              e.timeStr === entry.timeStr
            )
          );

          const entryCount = uniqueEntries.length;

          if (entryCount === 0) {
            const isLeaveDay = placeholderRecords.some(record => record.date === dateKey);
            return {
              dateDisplay: format(new Date(dateKey), "dd-MMM-yyyy"),
              punchIn: "-",
              punchOut: "-",
              status: isLeaveDay ? "Leave" : "No punches recorded",
              rawTimes: "",
              hasPunches: false,
              entryCount: 0,
              workTime: 0,
              dateKey: dateKey,
            };
          }

          const sortedEntries = uniqueEntries.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());

          // Separate check-ins and check-outs more accurately
          const checkIns = sortedEntries.filter((e) => e.type === "Check-In");
          const checkOuts = sortedEntries.filter((e) => e.type === "Check-Out");

          let punchIn = "-";
          let punchOut = "-";

          // Simple logic: first check-in and last check-out of the day
          if (checkIns.length > 0) {
            punchIn = checkIns[0].timeStr;
          }

          if (checkOuts.length > 0) {
            punchOut = checkOuts[checkOuts.length - 1].timeStr;
          }

          // If we have entries but couldn't determine types, use first and last
          if (punchIn === "-" && punchOut === "-" && sortedEntries.length > 0) {
            // Try to infer based on time of day
            const morningEntries = sortedEntries.filter(e => isMorningTime(e.timeStr));
            const afternoonEntries = sortedEntries.filter(e => isAfternoonTime(e.timeStr));

            if (morningEntries.length > 0) punchIn = morningEntries[0].timeStr;
            if (afternoonEntries.length > 0) punchOut = afternoonEntries[afternoonEntries.length - 1].timeStr;

            // If still not determined, use first as check-in and last as check-out
            if (punchIn === "-" && punchOut === "-") {
              punchIn = sortedEntries[0].timeStr;
              punchOut = sortedEntries[sortedEntries.length - 1].timeStr;
            }
          }

          let workTime = calculateWorkTime(punchIn, punchOut);

          // Determine status
          let status = "No punches recorded";

          if (punchIn !== "-" && punchOut !== "-") {
            status = "Present";
          } else if (punchIn !== "-" || punchOut !== "-") {
            status = "Partial punch recorded";
          }

          // Override for leave days
          const isLeaveDay = placeholderRecords.some(record => record.date === dateKey);
          if (isLeaveDay) {
            status = "Leave";
          }
          const rawTimes = sortedEntries.map((e) => `${e.type}: ${e.timeStr}`).join(", ");

          return {
            dateDisplay: format(new Date(dateKey), "dd-MMM-yyyy"),
            punchIn,
            punchOut,
            status,
            rawTimes,
            hasPunches: punchIn !== "-" || punchOut !== "-",
            entryCount,
            workTime,
            dateKey: dateKey,
          };
        });

      // FIXED: Update today's row with real-time data from todaypunch API - MIDNIGHT FIX
      const today = format(new Date(), "yyyy-MM-dd");
      const todayRowIndex = rows.findIndex(row => row.dateKey === today);

      if (todayRowIndex !== -1) {
        // Check if we actually have valid punch data for today
        const hasValidTodayData = todayPunchData?.first_check_in && 
                                !String(todayPunchData.first_check_in).includes('T05:30:00Z') &&
                                !String(todayPunchData.first_check_in).includes(' 05:30:00');

        if (hasValidTodayData) {
          // Check if the todayPunchData actually belongs to today or yesterday
          const punchDate = format(new Date(todayPunchData.first_check_in), "yyyy-MM-dd");

          if (punchDate === today) {
            // Only apply if the data is from today (normal case during the day)
            const todayCheckIn = formatTimeDirect(todayPunchData.first_check_in);
            const todayCheckOut = todayPunchData.last_check_out ? formatTimeDirect(todayPunchData.last_check_out) : "-";

            const todayWorkTime = calculateWorkTime(todayCheckIn, todayCheckOut);

            let todayStatus = "Present";
            if (todayCheckIn === "-" && todayCheckOut === "-") {
              todayStatus = "No punches recorded";
            } else if (todayCheckIn === "-" || todayCheckOut === "-") {
              todayStatus = "Partial punch recorded";
            }

            rows[todayRowIndex] = {
              ...rows[todayRowIndex],
              punchIn: todayCheckIn,
              punchOut: todayCheckOut,
              workTime: todayWorkTime,
              status: todayStatus,
              hasPunches: todayCheckIn !== "-" || todayCheckOut !== "-",
            };
          } else {
            // Data is from yesterday (midnight case) - apply to yesterday's row instead
            const yesterdayRowIndex = rows.findIndex(row => row.dateKey === punchDate);

            if (yesterdayRowIndex !== -1) {
              const yesterdayCheckIn = formatTimeDirect(todayPunchData.first_check_in);
              const yesterdayCheckOut = todayPunchData.last_check_out ? formatTimeDirect(todayPunchData.last_check_out) : "-";

              const yesterdayWorkTime = calculateWorkTime(yesterdayCheckIn, yesterdayCheckOut);

              let yesterdayStatus = "Present";
              if (yesterdayCheckIn === "-" && yesterdayCheckOut === "-") {
                yesterdayStatus = "No punches recorded";
              } else if (yesterdayCheckIn === "-" || yesterdayCheckOut === "-") {
                yesterdayStatus = "Partial punch recorded";
              }

              rows[yesterdayRowIndex] = {
                ...rows[yesterdayRowIndex],
                punchIn: yesterdayCheckIn,
                punchOut: yesterdayCheckOut,
                workTime: yesterdayWorkTime,
                status: yesterdayStatus,
                hasPunches: yesterdayCheckIn !== "-" || yesterdayCheckOut !== "-",
              };
            }
          }
        } else {
          // No valid punch data for today - ensure it shows "No punches recorded"
          rows[todayRowIndex] = {
            ...rows[todayRowIndex],
            punchIn: "-",
            punchOut: "-",
            workTime: 0,
            status: "No punches recorded",
            hasPunches: false,
          };
        }
      }

      setPunches(rows);
      calculateAverageWorkTime(rows);

    } catch (err) {
      console.error("Failed to fetch/process punches", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to load punches: ${errorMessage}`);
      setPunches([]);
      setAverageWorkTime("-");
    } finally {
      setLoading(false);
    }
  }, [company, startDate, endDate, employee, id, biometricIdFromQuery, fetchTodaysPunch, fetchAllPunches, getRecordDatetime, getNormalizedType, formatTimeWithDetection, calculateWorkTime, calculateAverageWorkTime, getUTCDateKey]);

  // Set default dates when company and employee are available
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
  
  // Get today's punch info - use biometric_id from query or employee
  const biometricIdForToday = biometricIdFromQuery || employee?.biometric_id || id;
  const todayCheckIn = todaysPunch?.first_check_in ? formatTimeDirect(todaysPunch.first_check_in) : "-";
  const todayCheckOut = todaysPunch?.last_check_out ? formatTimeDirect(todaysPunch.last_check_out) : "-";

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

        {/* Employee Banner with Photo and Details */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-blue-500">
          <div className="flex items-start gap-4">
            {/* Profile Image */}
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

            {/* Employee Details */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {employee.first_name} {employee.last_name}
                </h1>
                {/* {biometricIdFromQuery && (
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Query ID: {biometricIdFromQuery}
                  </span>
                )} */}
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
                {/* {biometricIdForToday && biometricIdForToday !== employee.id && (
                  <span className="flex items-center gap-1 text-green-600">
                    <Activity className="h-4 w-4" />
                    Fetching punches with: {biometricIdForToday}
                  </span>
                )} */}
              </div>

              {/* Today's Punch Info */}
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-blue-900 mb-3">Today's Status</div>
                    <div className="grid grid-cols-2 gap-6">
                      {/* Check-in */}
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-1">
                          <ArrowUpCircle className="h-4 w-4 text-green-500" />
                          <span className="text-xs font-medium text-gray-500">CHECK IN</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900">
                          {todayCheckIn}
                        </span>
                      </div>

                      {/* Check-out */}
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

                  {/* Work Hours Circle */}
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

                {/* Additional Today's Info */}
                {todaysPunch && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="flex justify-between text-xs text-gray-600">
                      {todaysPunch.total_sessions > 1 && (
                        <span>Sessions: {todaysPunch.total_sessions}</span>
                      )}
                      {todaysPunch.total_hours > 0 && (
                        <span>Total Hours: {todaysPunch.total_hours}h</span>
                      )}
                    </div>
                  </div>
                )}
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
                      {punches.filter(p => p.hasPunches && p.status === "Present").length}
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
                      {punches.filter(p => p.workTime > 0).length >= 5 ? averageWorkTime : "Need more data"}
                    </div>
                  </div>
                </div>
                {punches.filter(p => p.workTime > 0).length < 5 && (
                  <div className="mt-2 text-xs text-orange-600 text-center">
                    * Reliable average requires at least 5 complete work days
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {r.punchIn}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {r.punchOut}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {r.workTime > 0 ? formatMinutesToTime(r.workTime) : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${r.status === "Present"
                      ? "bg-green-100 text-green-800"
                      : r.status === "Partial punch recorded"
                        ? "bg-yellow-100 text-yellow-800"
                        : r.status === "Leave"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
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
// import { useParams } from "next/navigation";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import { format, parseISO, differenceInMinutes } from "date-fns";
// import Link from "next/link";
// import { ArrowLeft, UserIcon, Activity, ArrowUpCircle, ArrowDownCircle, ChevronDown, ChevronRight } from "lucide-react"; // Removed BugIcon
// import Image from "next/image";
// import { useEmployee } from "@/hooks/employees/useGetEmployee";

// // Add the FixPunch component import
// import FixPunch from "@/components/fix-punch"; // You'll need to create this file or adjust the path

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
//   const { id } = useParams();
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
//   // Commented out debug states
//   // const [debugInfo, setDebugInfo] = useState<any>(null);
//   // const [showDebug, setShowDebug] = useState(false);

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

//   // Commented out debug function
//   /*
//   // Add this new function to format debug information for each row
//   const formatRowDebugInfo = useCallback((row: any, index: number) => {
//     return {
//       rowIndex: index,
//       date: row.dateDisplay,
//       punchIn: row.punchIn,
//       punchOut: row.punchOut,
//       status: row.status,
//       workTime: row.workTime,
//       hasPunches: row.hasPunches,
//       entryCount: row.entryCount,
//       rawTimes: row.rawTimes,
//       dateKey: row.dateKey,
//       debugEntries: row.debugEntries,
//       // Add timezone information
//       timezoneInfo: {
//         localTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
//         currentTime: new Date().toLocaleString(),
//         currentUTCTime: new Date().toUTCString()
//       }
//     };
//   }, []);
//   */

//   // Fetch today's punch data
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

//   // Use the hook to fetch specific employee
//   const { data: employeeData, isLoading: employeeLoading } = useEmployee(company?.id, id as string);

//   // Set employee state when data is available
//   useEffect(() => {
//     if (employeeData) {
//       setEmployee(employeeData);
//     } else if (!employeeLoading && id) {
//       // Set default employee info if not found after loading
//       setEmployee({
//         id: id as string,
//         first_name: "Employee",
//         last_name: "",
//         biometric_id: id as string
//       });
//     }
//   }, [employeeData, employeeLoading, id]);

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

//           if (json.total_pages && currentPage > json.total_pages) {
//             hasMorePages = false;
//           }
//           if (json.last_page && currentPage > json.last_page) {
//             hasMorePages = false;
//           }
//           if (json.page && json.total_pages && currentPage > json.total_pages) {
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

//   // Fetch + process punches with enhanced error handling
//   const fetchPunches = useCallback(async () => {
//     if (!company || !startDate || !endDate || !employee) {
//       setError("Missing required data: company, dates, or employee");
//       return;
//     }

//     setLoading(true);
//     setError(null);

//     try {
//       const biometricId = employee?.biometric_id || id;

//       const payload = {
//         biometric_id: biometricId,
//         company_id: company.id,
//         start_date: format(startDate, "yyyy-MM-dd"),
//         end_date: format(endDate, "yyyy-MM-dd"),
//       };

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
//               // Removed debugEntries
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

//           const workTime = calculateWorkTime(punchIn, punchOut);

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
//             // Removed debugEntries
//           };
//         });

//       // FIXED: Update today's row with real-time data from todaypunch API - MIDNIGHT FIX
//       const today = format(new Date(), "yyyy-MM-dd");
//       const todayRowIndex = rows.findIndex(row => row.dateKey === today);

//       if (todayRowIndex !== -1 && todayPunchData && todayPunchData.first_check_in) {
//         // Check if the todayPunchData actually belongs to today or yesterday
//         const punchDate = format(new Date(todayPunchData.first_check_in), "yyyy-MM-dd");

//         if (punchDate === today) {
//           // Only apply if the data is from today (normal case during the day)
//           const todayCheckIn = formatTimeDirect(todayPunchData.first_check_in);
//           const todayCheckOut = todayPunchData.last_check_out ? formatTimeDirect(todayPunchData.last_check_out) : "-";

//           const todayWorkTime = calculateWorkTime(todayCheckIn, todayCheckOut);

//           let todayStatus = "Present";
//           if (todayCheckIn === "-" && todayCheckOut === "-") {
//             todayStatus = "No punches recorded";
//           } else if (todayCheckIn === "-" || todayCheckOut === "-") {
//             todayStatus = "Partial punch recorded";
//           }

//           rows[todayRowIndex] = {
//             ...rows[todayRowIndex],
//             punchIn: todayCheckIn,
//             punchOut: todayCheckOut,
//             workTime: todayWorkTime,
//             status: todayStatus,
//             hasPunches: todayCheckIn !== "-" || todayCheckOut !== "-",
//             // Removed debugEntries
//           };
//         } else {
//           // Data is from yesterday (midnight case) - apply to yesterday's row instead
//           const yesterdayRowIndex = rows.findIndex(row => row.dateKey === punchDate);

//           if (yesterdayRowIndex !== -1) {
//             const yesterdayCheckIn = formatTimeDirect(todayPunchData.first_check_in);
//             const yesterdayCheckOut = todayPunchData.last_check_out ? formatTimeDirect(todayPunchData.last_check_out) : "-";

//             const yesterdayWorkTime = calculateWorkTime(yesterdayCheckIn, yesterdayCheckOut);

//             let yesterdayStatus = "Present";
//             if (yesterdayCheckIn === "-" && yesterdayCheckOut === "-") {
//               yesterdayStatus = "No punches recorded";
//             } else if (yesterdayCheckIn === "-" || yesterdayCheckOut === "-") {
//               yesterdayStatus = "Partial punch recorded";
//             }

//             rows[yesterdayRowIndex] = {
//               ...rows[yesterdayRowIndex],
//               punchIn: yesterdayCheckIn,
//               punchOut: yesterdayCheckOut,
//               workTime: yesterdayWorkTime,
//               status: yesterdayStatus,
//               hasPunches: yesterdayCheckIn !== "-" || yesterdayCheckOut !== "-",
//               // Removed debugEntries
//             };
//           }
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
//   }, [company, startDate, endDate, employee, id, fetchTodaysPunch, fetchAllPunches, getRecordDatetime, getNormalizedType, formatTimeWithDetection, calculateWorkTime, calculateAverageWorkTime, getUTCDateKey]);

//   // Set default dates when company and employee are available
//   useEffect(() => {
//     if (company && employee && !startDate && !endDate) {
//       const now = new Date();
//       setStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
//       setEndDate(now);
//     }
//   }, [company, employee, startDate, endDate]);

//   // Auto-fetch when dates change
//   useEffect(() => {
//     if (startDate && endDate && company && employee) {
//       fetchPunches();
//     }
//   }, [startDate, endDate, company, employee, fetchPunches]);

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

//           {/* {company && (
//               <div className="flex items-center gap-2">
//                 <span className="text-sm text-gray-500 hidden md:inline">Fix punch data issues:</span>
//                 <FixPunch 
//                   companyId={company.id} 
//                   disabled={loading || !company}
//                 />
//               </div>
//             )} */}
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
//                   {employee.biometric_id}
//                 </span>
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
//         <FixPunch
//           companyId={company.id}
//           disabled={loading || !company}
//           className="mt-6 px-4 py-2" // Add padding to match refresh button
//           onComplete={(result) => {
//             // Optional: You can trigger a refetch of punches here
//             if (result.success && (result.fixed > 0 || result.updated > 0)) {
//               // Refetch punches after a delay
//               setTimeout(() => {
//                 fetchPunches()
//               }, 1000)
//             }
//           }}
//         />
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