// // components/FullCalendarView.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Calendar as CalendarIcon, AlertCircle, RefreshCw, Check, X, Clock, PartyPopper, ChevronLeft, ChevronRight } from "lucide-react";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// interface CalendarViewProps {
//   employeeId: string;
//   companyId?: string;
// }

// interface AttendanceEvent {
//   title: string;
//   start: string;
//   status: 'present' | 'absent' | 'half_day' | 'holiday';
//   check_in?: string;
//   check_out?: string;
//   hours_worked?: number;
//   reason?: string;
//   type?: string;
//   source?: 'attendance' | 'holidays'; // Add source to track where event came from
// }

// interface Holiday {
//   id?: string;
//   holiday: string;
//   date: string;
//   is_recurring: boolean;
//   is_full_holiday: boolean;
//   is_global: boolean;
//   role_ids: string[];
//   company_id?: string;
// }

// export default function FullCalendarView({ employeeId, companyId }: CalendarViewProps) {
//   const [events, setEvents] = useState<AttendanceEvent[]>([]);
//   const [holidays, setHolidays] = useState<Holiday[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [currentDate, setCurrentDate] = useState(new Date());

//   const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth());
//   const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

//   useEffect(() => {
//     const newDate = new Date(selectedYear, selectedMonth, 1);
//     setCurrentDate(newDate);
//   }, [selectedMonth, selectedYear]);

//   const monthOptions = [
//     { value: '0', label: 'January' },
//     { value: '1', label: 'February' },
//     { value: '2', label: 'March' },
//     { value: '3', label: 'April' },
//     { value: '4', label: 'May' },
//     { value: '5', label: 'June' },
//     { value: '6', label: 'July' },
//     { value: '7', label: 'August' },
//     { value: '8', label: 'September' },
//     { value: '9', label: 'October' },
//     { value: '10', label: 'November' },
//     { value: '11', label: 'December' },
//   ];

//   const currentYear = new Date().getFullYear();
//   const yearOptions = Array.from({ length: 12 }, (_, i) => currentYear - 5 + i);

//   const fetchHolidays = async (year: number, month: number) => {
//     if (!companyId) return [];

//     try {
//       console.log('🎄 Fetching holidays for:', { companyId, year, month });
      
//       const response = await fetch(`/api/settings/holiday`);
//       const result = await response.json();

//       if (response.ok) {
//         const holidaysData = Array.isArray(result) ? result : (result.data || result);
//         console.log('✅ Received holidays:', holidaysData.length, 'records');
//         setHolidays(holidaysData);
//         return holidaysData;
//       } else {
//         console.error('❌ Failed to fetch holidays:', result.message);
//         return [];
//       }
//     } catch (err) {
//       console.error('❌ Error fetching holidays:', err);
//       return [];
//     }
//   };

//   const transformHolidaysToEvents = (holidaysData: Holiday[]): AttendanceEvent[] => {
//     return holidaysData.map(holiday => ({
//       title: `HOLIDAY - ${holiday.holiday}`,
//       start: holiday.date,
//       status: 'holiday' as const,
//       reason: holiday.holiday,
//       type: 'holiday',
//       source: 'holidays' // Mark as coming from holidays API
//     }));
//   };

//   // Remove duplicate events - prefer attendance data over holidays data
//   const removeDuplicateEvents = (attendanceEvents: AttendanceEvent[], holidayEvents: AttendanceEvent[]): AttendanceEvent[] => {
//     const combinedEvents = [...attendanceEvents];
//     const attendanceDates = new Set(attendanceEvents.map(event => event.start));

//     // Only add holiday events for dates that don't already have attendance events
//     holidayEvents.forEach(holidayEvent => {
//       if (!attendanceDates.has(holidayEvent.start)) {
//         combinedEvents.push(holidayEvent);
//       } else {
//         console.log('🔄 Skipping duplicate holiday (already in attendance):', holidayEvent.start, holidayEvent.reason);
//       }
//     });

//     return combinedEvents;
//   };

//   const fetchAttendanceData = async (year: number, month: number) => {
//     if (!companyId || !employeeId) {
//       setError('Missing company or employee information');
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     setError(null);

//     try {
//       const date = `${year}-${String(month + 1).padStart(2, '0')}`;
      
//       console.log('🔄 Fetching attendance data for:', {
//         employeeId,
//         companyId,
//         date
//       });

//       const [attendanceResponse, holidaysData] = await Promise.all([
//         fetch(`/api/calendar/${employeeId}`, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({
//             date: date,
//             company_id: companyId
//           }),
//         }),
//         fetchHolidays(year, month)
//       ]);

//       console.log('🔍 Attendance API Response status:', attendanceResponse.status);

//       if (!attendanceResponse.ok) {
//         throw new Error(`API returned ${attendanceResponse.status}: ${attendanceResponse.statusText}`);
//       }

//       const attendanceResult = await attendanceResponse.json();
//       console.log('🔍 Attendance API Response data:', attendanceResult);

// if (attendanceResult && (attendanceResult.success !== false)) {
//   const attendanceData = attendanceResult.attendance || attendanceResult.data || [];

//         console.log('✅ Received attendance data:', attendanceData.length, 'records');
//         console.log('✅ Received holidays data:', holidaysData.length, 'records');

//         const attendanceEvents: AttendanceEvent[] = attendanceData.map((record: any) => {
//           let title = '';
          
//           switch (record.status) {
//             case 'present':
//               title = `PRESENT ${record.hours_worked ? `(${record.hours_worked}h)` : ''}`;
//               break;
//             case 'absent':
//               title = 'ABSENT';
//               break;
//             case 'half_day':
//               title = `HALF DAY ${record.hours_worked ? `(${record.hours_worked}h)` : ''}`;
//               break;
//             case 'holiday':
//               title = `HOLIDAY - ${record.reason || ''}`;
//               break;
//             default:
//               title = record.type?.toUpperCase() || 'UNKNOWN';
//           }

//           return {
//             title: title,
//             start: record.date,
//             status: record.status,
//             check_in: record.check_in,
//             check_out: record.check_out,
//             hours_worked: record.hours_worked,
//             reason: record.reason,
//             type: 'attendance',
//             source: 'attendance' // Mark as coming from attendance API
//           };
//         });

//         const holidayEvents = transformHolidaysToEvents(holidaysData);
        
//         // Remove duplicates before setting events
//         const allEvents = removeDuplicateEvents(attendanceEvents, holidayEvents);
        
//         console.log('✅ Combined calendar events:', {
//           total: allEvents.length,
//           fromAttendance: attendanceEvents.length,
//           fromHolidays: holidayEvents.length,
//           afterDeduplication: allEvents.length
//         });
        
//         setEvents(allEvents);

//         if (allEvents.length === 0) {
//           setError('No attendance records or holidays found for this period');
//         }
//       } else {
//         throw new Error(attendanceResult.message || 'Failed to fetch attendance data');
//       }
//     } catch (err: any) {
//       console.error('❌ Error fetching calendar data:', err);
//       setError(err.message || 'Failed to load calendar data. Please try again.');
//       setEvents([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     const year = currentDate.getFullYear();
//     const month = currentDate.getMonth();
//     fetchAttendanceData(year, month);
//   }, [employeeId, companyId, currentDate]);

//   const getStatusIcon = (status: string) => {
//     switch (status) {
//       case 'present':
//         return <Check className="h-4 w-4 text-green-600" />;
//       case 'absent':
//         return <X className="h-4 w-4 text-red-600" />;
//       case 'half_day':
//         return <Clock className="h-4 w-4 text-yellow-600" />;
//       case 'holiday':
//         return <PartyPopper className="h-4 w-4 text-blue-600" />;
//       default:
//         return <AlertCircle className="h-4 w-4 text-gray-600" />;
//     }
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'present':
//         return 'bg-green-100 text-green-800 border-green-200';
//       case 'absent':
//         return 'bg-red-100 text-red-800 border-red-200';
//       case 'half_day':
//         return 'bg-yellow-100 text-yellow-800 border-yellow-200';
//       case 'holiday':
//         return 'bg-blue-100 text-blue-800 border-blue-200';
//       default:
//         return 'bg-gray-100 text-gray-800 border-gray-200';
//     }
//   };

//   const getDaysInMonth = (date: Date) => {
//     return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
//   };

//   const getFirstDayOfMonth = (date: Date) => {
//     return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
//   };

//   const navigateMonth = (direction: 'prev' | 'next') => {
//     setCurrentDate(prev => {
//       const newDate = new Date(prev);
//       if (direction === 'prev') {
//         newDate.setMonth(prev.getMonth() - 1);
//       } else {
//         newDate.setMonth(prev.getMonth() + 1);
//       }
//       setSelectedMonth(newDate.getMonth());
//       setSelectedYear(newDate.getFullYear());
//       return newDate;
//     });
//   };

//   const handleMonthChange = (monthValue: string) => {
//     const month = parseInt(monthValue);
//     setSelectedMonth(month);
//   };

//   const handleYearChange = (yearValue: string) => {
//     const year = parseInt(yearValue);
//     setSelectedYear(year);
//   };

//   const getEventsForDate = (date: string) => {
//     return events.filter(event => event.start === date);
//   };

//   const formatDate = (date: Date) => {
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const day = String(date.getDate()).padStart(2, '0');
//     return `${year}-${month}-${day}`;
//   };

//   const renderStatusBadges = (eventsForDate: AttendanceEvent[]) => {
//     return (
//       <div className="flex flex-wrap gap-1">
//         {eventsForDate.map((event, index) => (
//           <Badge 
//             key={index} 
//             variant="secondary" 
//             className={`text-xs ${getStatusColor(event.status)}`}
//           >
//             {getStatusIcon(event.status)}
//           </Badge>
//         ))}
//       </div>
//     );
//   };

//   const renderEventDetails = (eventsForDate: AttendanceEvent[]) => {
//     return (
//       <div className="mt-1 space-y-1">
//         {eventsForDate.map((event, index) => (
//           <div key={index} className="text-xs">
//             <div className={`font-medium ${
//               event.status === 'holiday' ? 'text-blue-700' : 
//               event.status === 'present' ? 'text-green-700' :
//               event.status === 'absent' ? 'text-red-700' :
//               event.status === 'half_day' ? 'text-yellow-700' : 'text-gray-700'
//             }`}>
//               {event.title.split(' - ')[0]}
//             </div>
            
//             {event.check_in && (
//               <div className="text-gray-600 pl-1">In: {event.check_in}</div>
//             )}
//             {event.check_out && (
//               <div className="text-gray-600 pl-1">Out: {event.check_out}</div>
//             )}
            
//             {event.reason && (
//               <div className={`pl-1 ${
//                 event.status === 'holiday' ? 'text-blue-600' : 'text-gray-600'
//               }`}>
//                 {event.reason}
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     );
//   };

//   const renderCalendar = () => {
//     const daysInMonth = getDaysInMonth(currentDate);
//     const firstDay = getFirstDayOfMonth(currentDate);
//     const year = currentDate.getFullYear();
//     const month = currentDate.getMonth();
    
//     const days = [];
    
//     for (let i = 0; i < firstDay; i++) {
//       days.push(<div key={`empty-${i}`} className="h-24 border p-1 bg-gray-50"></div>);
//     }
    
//     for (let day = 1; day <= daysInMonth; day++) {
//       const dateStr = formatDate(new Date(year, month, day));
//       const eventsForDate = getEventsForDate(dateStr);
//       const isToday = formatDate(new Date()) === dateStr;
      
//       let backgroundColor = '';
//       if (eventsForDate.some(event => event.status === 'holiday')) {
//         backgroundColor = 'bg-blue-50';
//       } else if (isToday) {
//         backgroundColor = 'bg-blue-50 border-blue-200';
//       }
      
//       days.push(
//         <div 
//           key={day} 
//           className={`h-24 border p-1 ${backgroundColor}`}
//         >
//           <div className="flex justify-between items-start">
//             <span className={`text-sm font-medium ${
//               isToday ? 'text-blue-600' : 
//               eventsForDate.some(event => event.status === 'holiday') ? 'text-blue-700' : ''
//             }`}>
//               {day}
//             </span>
//             {eventsForDate.length > 0 && renderStatusBadges(eventsForDate)}
//           </div>
//           {eventsForDate.length > 0 && renderEventDetails(eventsForDate)}
//         </div>
//       );
//     }
    
//     return days;
//   };

//   const handleRefresh = () => {
//     const year = currentDate.getFullYear();
//     const month = currentDate.getMonth();
//     fetchAttendanceData(year, month);
//   };

//   if (loading) {
//     return (
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2 text-foreground text-lg">
//             <CalendarIcon className="h-5 w-5 text-blue-600" />
//             Attendance Calendar
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="flex justify-center items-center h-64">
//             <RefreshCw className="animate-spin h-8 w-8 text-blue-500" />
//             <span className="ml-3">Loading calendar data...</span>
//           </div>
//         </CardContent>
//       </Card>
//     );
//   }

//   return (
//     <Card>
//       <CardHeader className="flex flex-row items-center justify-between">
//         <CardTitle className="flex items-center gap-2 text-foreground text-lg">
//           <CalendarIcon className="h-5 w-5 text-blue-600" />
//           Attendance Calendar
//         </CardTitle>
//         <div className="flex items-center gap-2">
//           <div className="flex items-center gap-2 mr-4">
//             <Select value={selectedMonth.toString()} onValueChange={handleMonthChange}>
//               <SelectTrigger className="w-32">
//                 <SelectValue placeholder="Month" />
//               </SelectTrigger>
//               <SelectContent>
//                 {monthOptions.map(month => (
//                   <SelectItem key={month.value} value={month.value}>
//                     {month.label}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
            
//             <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
//               <SelectTrigger className="w-24">
//                 <SelectValue placeholder="Year" />
//               </SelectTrigger>
//               <SelectContent>
//                 {yearOptions.map(year => (
//                   <SelectItem key={year} value={year.toString()}>
//                     {year}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           <Button 
//             variant="outline" 
//             size="sm" 
//             onClick={() => navigateMonth('prev')}
//             disabled={loading}
//             className="flex items-center gap-1"
//           >
//             <ChevronLeft className="h-4 w-4" />
//             Prev
//           </Button>
          
//           <Button 
//             variant="outline" 
//             size="sm" 
//             onClick={() => navigateMonth('next')}
//             disabled={loading}
//             className="flex items-center gap-1"
//           >
//             Next
//             <ChevronRight className="h-4 w-4" />
//           </Button>
          
//           <Button 
//             variant="outline" 
//             size="sm" 
//             onClick={handleRefresh}
//             className="flex items-center gap-2"
//             disabled={loading}
//           >
//             <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
//             Refresh
//           </Button>
//         </div>
//       </CardHeader>
      
//       <CardContent>
//         {error && (
//           <Alert variant="destructive" className="mb-4">
//             <AlertCircle className="h-4 w-4" />
//             <AlertDescription>{error}</AlertDescription>
//           </Alert>
//         )}

//         {/* Legend */}
//         <div className="flex flex-wrap gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
//           <div className="flex items-center gap-2">
//             <Check className="h-4 w-4 text-green-600" />
//             <span className="text-sm">Present</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <Clock className="h-4 w-4 text-yellow-600" />
//             <span className="text-sm">Half Day</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <X className="h-4 w-4 text-red-600" />
//             <span className="text-sm">Absent</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <PartyPopper className="h-4 w-4 text-blue-600" />
//             <span className="text-sm">Holiday</span>
//           </div>
//         </div>

//         {/* Calendar Grid */}
//         <div className="border rounded-lg overflow-hidden">
//           <div className="grid grid-cols-7 bg-gray-100 border-b">
//             {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
//               <div key={day} className="p-3 text-center font-medium text-gray-700 border-r last:border-r-0">
//                 {day}
//               </div>
//             ))}
//           </div>
          
//           <div className="grid grid-cols-7">
//             {renderCalendar()}
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

// components/FullCalendarView.tsx - UPDATED WITH COOKIE SYNC
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, AlertCircle, RefreshCw, Check, X, Clock, PartyPopper, ChevronLeft, ChevronRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";

interface CalendarViewProps {
  employeeId: string;
}

interface AttendanceEvent {
  title: string;
  start: string;
  status: 'present' | 'absent' | 'half_day' | 'holiday';
  check_in?: string;
  check_out?: string;
  hours_worked?: number;
  reason?: string;
  type?: string;
  source?: 'attendance' | 'holidays';
}

interface Holiday {
  id?: string;
  holiday: string;
  date: string;
  is_recurring: boolean;
  is_full_holiday: boolean;
  is_global: boolean;
  role_ids: string[];
  company_id?: string;
}

export default function FullCalendarView({ employeeId }: CalendarViewProps) {
  const { company } = useAuth();
  const companyId = company?.id;
  
  const [events, setEvents] = useState<AttendanceEvent[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [cookieSynced, setCookieSynced] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  // Sync company cookie with AuthContext on page load - SAME AS HOLIDAY PAGE
  useEffect(() => {
    const syncCompanyCookie = async () => {
      if (companyId && !cookieSynced) {
        try {
          console.log('🔄 Syncing company cookie with AuthContext:', companyId);
          const res = await fetch('/api/update-company-cookie', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company_id: companyId }),
          });
          
          const data = await res.json();
          if (data.success) {
            console.log('✅ Company cookie synced successfully for calendar');
            setCookieSynced(true);
          } else {
            console.error('❌ Failed to sync company cookie for calendar');
          }
        } catch (error) {
          console.error('Error syncing company cookie for calendar:', error);
        }
      }
    };

    syncCompanyCookie();
  }, [companyId, cookieSynced]);

  useEffect(() => {
    const newDate = new Date(selectedYear, selectedMonth, 1);
    setCurrentDate(newDate);
  }, [selectedMonth, selectedYear]);

  const monthOptions = [
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' },
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 12 }, (_, i) => currentYear - 5 + i);

  const fetchHolidays = async (year: number, month: number) => {
    if (!companyId) {
      console.log('❌ No company ID available for fetching holidays');
      return [];
    }

    try {
      console.log('🎄 Fetching holidays for company:', companyId);
      
      // Use query parameter to ensure correct company ID is used
      const response = await fetch(`/api/settings/holiday?company_id=${companyId}`);
      const result = await response.json();

      console.log('📡 Holidays API Response:', {
        status: response.status,
        companyIdRequested: companyId,
        data: result
      });

      if (response.ok) {
        const holidaysData = Array.isArray(result) ? result : (result.data || result);
        console.log('✅ Received holidays for company:', companyId, 'count:', holidaysData.length);
        
        setHolidays(holidaysData);
        return holidaysData;
      } else {
        console.error('❌ Failed to fetch holidays:', result.message);
        return [];
      }
    } catch (err) {
      console.error('❌ Error fetching holidays:', err);
      return [];
    }
  };

  const transformHolidaysToEvents = (holidaysData: Holiday[]): AttendanceEvent[] => {
    return holidaysData.map(holiday => ({
      title: `HOLIDAY - ${holiday.holiday}`,
      start: holiday.date,
      status: 'holiday' as const,
      reason: holiday.holiday,
      type: 'holiday',
      source: 'holidays'
    }));
  };

  // Remove duplicate events - prefer attendance data over holidays data
  const removeDuplicateEvents = (attendanceEvents: AttendanceEvent[], holidayEvents: AttendanceEvent[]): AttendanceEvent[] => {
    const combinedEvents = [...attendanceEvents];
    const attendanceDates = new Set(attendanceEvents.map(event => event.start));

    // Only add holiday events for dates that don't already have attendance events
    holidayEvents.forEach(holidayEvent => {
      if (!attendanceDates.has(holidayEvent.start)) {
        combinedEvents.push(holidayEvent);
      } else {
        console.log('🔄 Skipping duplicate holiday (already in attendance):', holidayEvent.start, holidayEvent.reason);
      }
    });

    return combinedEvents;
  };

  const fetchAttendanceData = async (year: number, month: number) => {
    // Check if we have both companyId and employeeId
    if (!companyId) {
      setError('Company information not available. Please check your authentication.');
      setLoading(false);
      return;
    }

    if (!employeeId) {
      setError('Employee information is required');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const date = `${year}-${String(month + 1).padStart(2, '0')}`;
      
      console.log('🔄 Fetching calendar data for:', {
        employeeId,
        companyId,
        date,
        cookieSynced
      });

      const [attendanceResponse, holidaysData] = await Promise.all([
        fetch(`/api/calendar/${employeeId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            date: date,
            company_id: companyId
          }),
        }),
        fetchHolidays(year, month)
      ]);

      console.log('🔍 Calendar API Response status:', attendanceResponse.status);

      if (!attendanceResponse.ok) {
        throw new Error(`API returned ${attendanceResponse.status}: ${attendanceResponse.statusText}`);
      }

      const attendanceResult = await attendanceResponse.json();
      console.log('🔍 Calendar API Response data:', attendanceResult);

      if (attendanceResult && (attendanceResult.success !== false)) {
        const attendanceData = attendanceResult.attendance || attendanceResult.data || [];

        console.log('✅ Received attendance data:', attendanceData.length, 'records');
        console.log('✅ Received holidays data:', holidaysData.length, 'records');

        const attendanceEvents: AttendanceEvent[] = attendanceData.map((record: any) => {
          let title = '';
          
          switch (record.status) {
            case 'present':
              title = `PRESENT ${record.hours_worked ? `(${record.hours_worked}h)` : ''}`;
              break;
            case 'absent':
              title = 'ABSENT';
              break;
            case 'half_day':
              title = `HALF DAY ${record.hours_worked ? `(${record.hours_worked}h)` : ''}`;
              break;
            case 'holiday':
              title = `HOLIDAY - ${record.reason || ''}`;
              break;
            default:
              title = record.type?.toUpperCase() || 'UNKNOWN';
          }

          return {
            title: title,
            start: record.date,
            status: record.status,
            check_in: record.check_in,
            check_out: record.check_out,
            hours_worked: record.hours_worked,
            reason: record.reason,
            type: 'attendance',
            source: 'attendance'
          };
        });

        const holidayEvents = transformHolidaysToEvents(holidaysData);
        
        // Remove duplicates before setting events
        const allEvents = removeDuplicateEvents(attendanceEvents, holidayEvents);
        
        console.log('✅ Combined calendar events:', {
          total: allEvents.length,
          fromAttendance: attendanceEvents.length,
          fromHolidays: holidayEvents.length,
          afterDeduplication: allEvents.length
        });
        
        setEvents(allEvents);

        if (allEvents.length === 0) {
          setError('No attendance records or holidays found for this period');
        }
      } else {
        throw new Error(attendanceResult.message || 'Failed to fetch attendance data');
      }
    } catch (err: any) {
      console.error('❌ Error fetching calendar data:', err);
      setError(err.message || 'Failed to load calendar data. Please try again.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Only fetch data if we have companyId and cookie is synced
    if (companyId && cookieSynced) {
      console.log('🎯 Starting data fetch with company ID:', companyId, 'Cookie synced:', cookieSynced);
      fetchAttendanceData(year, month);
    } else if (companyId && !cookieSynced) {
      setLoading(false);
      setError('Syncing company settings...');
    } else {
      setLoading(false);
      setError('Waiting for company information...');
    }
  }, [employeeId, companyId, currentDate, cookieSynced]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'absent':
        return <X className="h-4 w-4 text-red-600" />;
      case 'half_day':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'holiday':
        return <PartyPopper className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'half_day':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'holiday':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      setSelectedMonth(newDate.getMonth());
      setSelectedYear(newDate.getFullYear());
      return newDate;
    });
  };

  const handleMonthChange = (monthValue: string) => {
    const month = parseInt(monthValue);
    setSelectedMonth(month);
  };

  const handleYearChange = (yearValue: string) => {
    const year = parseInt(yearValue);
    setSelectedYear(year);
  };

  const getEventsForDate = (date: string) => {
    return events.filter(event => event.start === date);
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const renderStatusBadges = (eventsForDate: AttendanceEvent[]) => {
    return (
      <div className="flex flex-wrap gap-1">
        {eventsForDate.map((event, index) => (
          <Badge 
            key={index} 
            variant="secondary" 
            className={`text-xs ${getStatusColor(event.status)}`}
          >
            {getStatusIcon(event.status)}
          </Badge>
        ))}
      </div>
    );
  };

  const renderEventDetails = (eventsForDate: AttendanceEvent[]) => {
    return (
      <div className="mt-1 space-y-1">
        {eventsForDate.map((event, index) => (
          <div key={index} className="text-xs">
            <div className={`font-medium ${
              event.status === 'holiday' ? 'text-blue-700' : 
              event.status === 'present' ? 'text-green-700' :
              event.status === 'absent' ? 'text-red-700' :
              event.status === 'half_day' ? 'text-yellow-700' : 'text-gray-700'
            }`}>
              {event.title.split(' - ')[0]}
            </div>
            
            {event.check_in && (
              <div className="text-gray-600 pl-1">In: {event.check_in}</div>
            )}
            {event.check_out && (
              <div className="text-gray-600 pl-1">Out: {event.check_out}</div>
            )}
            
            {event.reason && (
              <div className={`pl-1 ${
                event.status === 'holiday' ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {event.reason}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border p-1 bg-gray-50"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(new Date(year, month, day));
      const eventsForDate = getEventsForDate(dateStr);
      const isToday = formatDate(new Date()) === dateStr;
      
      let backgroundColor = '';
      if (eventsForDate.some(event => event.status === 'holiday')) {
        backgroundColor = 'bg-blue-50';
      } else if (isToday) {
        backgroundColor = 'bg-blue-50 border-blue-200';
      }
      
      days.push(
        <div 
          key={day} 
          className={`h-24 border p-1 ${backgroundColor}`}
        >
          <div className="flex justify-between items-start">
            <span className={`text-sm font-medium ${
              isToday ? 'text-blue-600' : 
              eventsForDate.some(event => event.status === 'holiday') ? 'text-blue-700' : ''
            }`}>
              {day}
            </span>
            {eventsForDate.length > 0 && renderStatusBadges(eventsForDate)}
          </div>
          {eventsForDate.length > 0 && renderEventDetails(eventsForDate)}
        </div>
      );
    }
    
    return days;
  };

  const handleRefresh = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    if (companyId && cookieSynced) {
      fetchAttendanceData(year, month);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground text-lg">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            Attendance Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="animate-spin h-8 w-8 text-blue-500" />
            <span className="ml-3">Loading calendar data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-foreground text-lg">
          <CalendarIcon className="h-5 w-5 text-blue-600" />
          Attendance Calendar
        </CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-4">
            <Select value={selectedMonth.toString()} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(month => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigateMonth('prev')}
            disabled={loading}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigateMonth('next')}
            disabled={loading}
            className="flex items-center gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="flex items-center gap-2"
            disabled={loading || !companyId || !cookieSynced}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {!companyId && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Company information not available. Please check your authentication.</AlertDescription>
          </Alert>
        )}

        {!cookieSynced && companyId && (
          <Alert variant="default" className="mb-4 bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              Syncing company settings... Please wait a moment.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Company Info Debug
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Company:</span>
              <span>{company?.name || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">ID:</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {companyId || 'Not set'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Employee:</span>
              <Badge variant="secondary">{employeeId}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Cookie Sync:</span>
              <Badge variant="secondary" className={cookieSynced ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                {cookieSynced ? '✅ Synced' : '🔄 Syncing'}
              </Badge>
            </div>
          </div>
        </div> */}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <span className="text-sm">Half Day</span>
          </div>
          <div className="flex items-center gap-2">
            <X className="h-4 w-4 text-red-600" />
            <span className="text-sm">Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <PartyPopper className="h-4 w-4 text-blue-600" />
            <span className="text-sm">Holiday</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-7 bg-gray-100 border-b">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center font-medium text-gray-700 border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7">
            {renderCalendar()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}