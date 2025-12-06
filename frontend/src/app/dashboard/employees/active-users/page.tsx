// // app/dashboard/employees/active-users/page.tsx
// "use client";

// import { useState, useEffect, useMemo } from "react";
// import { useAuth } from "@/context/AuthContext";
// import { User } from "@/context/AuthContext";
// import { useCompany } from "@/context/CompanyContext";
// import Link from "next/link";
// import Image from "next/image";
// import { 
//   ArrowUpCircle, 
//   ArrowDownCircle, 
//   ChevronLeft, 
//   ChevronRight, 
//   MoreHorizontal, 
//   UserCheck,
//   Clock,
//   Calendar
// } from "lucide-react";
// import { useActiveUsers } from "@/hooks/active-users/useGetActiveUsers";

// // Reuse the same interfaces from your employees page
// interface PunchSession {
//   check_in?: string;
//   check_out?: string;
//   check_in_device?: string;
//   check_out_device?: string;
//   duration_hours?: number;
// }

// interface PunchData {
//   first_check_in: string | null;
//   last_check_out: string | null;
//   multi_mode: boolean;
//   punch_sessions?: PunchSession[];
//   total_sessions?: number;
//   check_in_count?: number;
//   check_out_count?: number;
//   data?: any[];
// }

// interface EmployeeWithKey extends User {
//   uniqueKey: string;
// }

// // Reuse the utility functions from your employees page
// function extractTime(dateStr: string | null): string {
//   if (!dateStr) return "--";
//   if (dateStr.includes("T")) return dateStr.split("T")[1]?.slice(0, 5) || "--";
//   return dateStr;
// }

// function calculateCurrentWorkHours(checkIn: string | null): string {
//   if (!checkIn || checkIn === "--") return "--";
  
//   try {
//     const now = new Date();
//     const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
//     const [inHours, inMinutes] = checkIn.split(":").map(Number);
//     const [currentHours, currentMinutes] = currentTime.split(":").map(Number);
    
//     let totalMinutes = (currentHours * 60 + currentMinutes) - (inHours * 60 + inMinutes);
    
//     if (totalMinutes < 0) {
//       totalMinutes += 24 * 60;
//     }
    
//     const hours = Math.floor(totalMinutes / 60);
//     const minutes = totalMinutes % 60;
    
//     return `${hours}.${Math.round((minutes / 60) * 100).toString().padStart(2, '0')}`;
//   } catch {
//     return "--";
//   }
// }

// function calculateCompletedWorkHours(checkIn: string | null, checkOut: string | null): string {
//   if (!checkIn || !checkOut || checkIn === "--" || checkOut === "--") return "--";
  
//   try {
//     const [inHours, inMinutes] = checkIn.split(":").map(Number);
//     const [outHours, outMinutes] = checkOut.split(":").map(Number);
    
//     let totalMinutes = (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes);
    
//     if (totalMinutes < 0) {
//       totalMinutes += 24 * 60;
//     }
    
//     const hours = Math.floor(totalMinutes / 60);
//     const minutes = totalMinutes % 60;
    
//     return `${hours}.${Math.round((minutes / 60) * 100).toString().padStart(2, '0')}`;
//   } catch {
//     return "--";
//   }
// }

// function calculateTotalHours(sessions: PunchSession[]): string {
//   if (!sessions || sessions.length === 0) return "--";
  
//   let totalMinutes = 0;
  
//   sessions.forEach(session => {
//     if (session.check_in && session.check_out) {
//       const checkInTime = extractTime(session.check_in);
//       const checkOutTime = extractTime(session.check_out);
      
//       if (checkInTime !== "--" && checkOutTime !== "--") {
//         const [inHours, inMinutes] = checkInTime.split(":").map(Number);
//         const [outHours, outMinutes] = checkOutTime.split(":").map(Number);
        
//         let sessionMinutes = (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes);
        
//         if (sessionMinutes < 0) {
//           sessionMinutes += 24 * 60;
//         }
        
//         totalMinutes += sessionMinutes;
//       }
//     }
//   });
  
//   const hours = Math.floor(totalMinutes / 60);
//   const minutes = totalMinutes % 60;
  
//   return `${hours}.${Math.round((minutes / 60) * 100).toString().padStart(2, '0')}`;
// }

// // Time Circle Component (reused from employees page)
// function TimeCircle({ sessions, checkIn, checkOut, size = 70 }: { 
//   sessions?: PunchSession[]; 
//   checkIn: string; 
//   checkOut: string; 
//   size?: number 
// }) {
//   const totalHours = sessions && sessions.length > 1 
//     ? calculateTotalHours(sessions)
//     : checkOut === "--" 
//       ? calculateCurrentWorkHours(checkIn)
//       : calculateCompletedWorkHours(checkIn, checkOut);
  
//   const hasValidData = totalHours !== "--" && !totalHours.includes("NaN");
  
//   const calculateProgress = () => {
//     if (!hasValidData) return 0;
    
//     try {
//       const hours = parseFloat(totalHours);
//       const progress = Math.min((hours / 8) * 100, 100);
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
//           <circle
//             cx={size / 2}
//             cy={size / 2}
//             r={radius}
//             stroke="#e5e7eb"
//             strokeWidth={strokeWidth}
//             fill="none"
//           />
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

// // Punch Sessions Component (reused from employees page)
// function PunchSessions({ sessions, multiMode }: { sessions?: PunchSession[]; multiMode: boolean }) {
//   if (!multiMode || !sessions || sessions.length <= 1) {
//     return null;
//   }

//   return (
//     <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
//       <div className="flex items-center justify-between mb-2">
//         <span className="text-xs font-medium text-blue-800">Multiple Sessions ({sessions.length})</span>
//         <MoreHorizontal className="h-3 w-3 text-blue-600" />
//       </div>
//       <div className="space-y-2 max-h-32 overflow-y-auto">
//         {sessions.map((session, index) => (
//           <div key={index} className="flex items-center justify-between text-xs">
//             <div className="flex items-center gap-2">
//               <span className="font-medium text-blue-700">Session {index + 1}:</span>
//               {session.check_in && (
//                 <span className="text-green-600">
//                   IN: {extractTime(session.check_in)}
//                 </span>
//               )}
//               {session.check_out && (
//                 <span className="text-red-600">
//                   OUT: {extractTime(session.check_out)}
//                 </span>
//               )}
//             </div>
//             {session.duration_hours && (
//               <span className="text-blue-600 font-medium">
//                 {session.duration_hours.toFixed(2)}h
//               </span>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default function ActiveUsersPage() {
//   const { company } = useAuth();
//   const { currentCompany } = useCompany();
//   const [page, setPage] = useState(1);
//   const pageSize = 50;
//   const [punches, setPunches] = useState<Record<string, PunchData>>({});
//   const [loadingPunches, setLoadingPunches] = useState(true);
//   const [currentTime, setCurrentTime] = useState(new Date());

//   const { data: activeUsersData, isLoading, isError } = useActiveUsers(company?.id || 0, page, pageSize);

//   // Update current time every minute for real-time work hours
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setCurrentTime(new Date());
//     }, 60000);
//     return () => clearInterval(interval);
//   }, []);

//   // Process active users data
//   const activeUsers: EmployeeWithKey[] = useMemo(() => {
//     if (!activeUsersData?.activeUsers) return [];
    
//     const uniqueUsers = new Map<string, EmployeeWithKey>();
    
//     activeUsersData.activeUsers.forEach((user) => {
//       if (!user || !user.id) return;
      
//       const uniqueKey = `${user.id}-${user.biometric_id || ''}-${user.employee_id || ''}`;
      
//       if (!uniqueUsers.has(uniqueKey)) {
//         uniqueUsers.set(uniqueKey, {
//           ...user,
//           uniqueKey
//         });
//       }
//     });
    
//     return Array.from(uniqueUsers.values());
//   }, [activeUsersData]);

//   // Fetch punch data for active users
//   useEffect(() => {
//     if (!activeUsers.length || !company?.id) {
//       setLoadingPunches(false);
//       setPunches({});
//       return;
//     }

//     let cancelled = false;

//     async function fetchPunches() {
//       setLoadingPunches(true);
//       const punchesData: Record<string, PunchData> = {};

//       try {
//         const batchSize = 10;
//         for (let i = 0; i < activeUsers.length; i += batchSize) {
//           if (cancelled) break;
          
//           const batch = activeUsers.slice(i, i + batchSize);
//           await Promise.all(
//             batch.map(async (user) => {
//               try {
//                 const res = await fetch("/api/punch/todaypunch", {
//                   method: "POST",
//                   headers: { "Content-Type": "application/json" },
//                   body: JSON.stringify({
//                     biometric_id: user.biometric_id,
//                     company_id: company.id,
//                     start_date: new Date().toISOString().split("T")[0],
//                     end_date: new Date().toISOString().split("T")[0],
//                     user_id: user.biometric_id,
//                   }),
//                 });
                
//                 if (res.ok) {
//                   const punchData = await res.json();
//                   punchesData[user.uniqueKey] = punchData;
//                 } else {
//                   punchesData[user.uniqueKey] = { 
//                     first_check_in: null, 
//                     last_check_out: null,
//                     multi_mode: false 
//                   };
//                 }
//               } catch (error) {
//                 console.error(`Error fetching punch data for user ${user.id}:`, error);
//                 punchesData[user.uniqueKey] = { 
//                   first_check_in: null, 
//                   last_check_out: null,
//                   multi_mode: false 
//                 };
//               }
//             })
//           );
          
//           if (i + batchSize < activeUsers.length) {
//             await new Promise(resolve => setTimeout(resolve, 100));
//           }
//         }
//       } catch (error) {
//         console.error('Error in fetchPunches:', error);
//       }

//       if (!cancelled) {
//         setPunches(punchesData);
//         setLoadingPunches(false);
//       }
//     }

//     fetchPunches();
//     return () => {
//       cancelled = true;
//     };
//   }, [activeUsers, company?.id]);

//   // Generate page numbers
//   const generatePageNumbers = () => {
//     const totalPages = activeUsersData?.totalPages || 1;
//     const currentPage = activeUsersData?.currentPage || page;
    
//     const pages = [];
//     pages.push(1);
    
//     let startPage = Math.max(2, currentPage - 1);
//     let endPage = Math.min(totalPages - 1, currentPage + 1);
    
//     if (startPage > 2) {
//       pages.push("...");
//     }
    
//     for (let i = startPage; i <= endPage; i++) {
//       pages.push(i);
//     }
    
//     if (endPage < totalPages - 1) {
//       pages.push("...");
//     }
    
//     if (totalPages > 1) {
//       pages.push(totalPages);
//     }
    
//     return pages;
//   };

//   const getProfileImageUrl = (user: User) =>
//     user.prof_img ? (user.prof_img.startsWith("http") ? user.prof_img : `${currentCompany?.mediaBaseUrl}${user.prof_img}`) : null;

//   if (!company) return <p>No company selected</p>;

//   if (isLoading) return (
//     <div className="flex justify-center items-center py-8">
//       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
//       <span className="ml-2">Loading active users...</span>
//     </div>
//   );
  
//   if (isError) return (
//     <div className="text-center py-8 text-red-600">
//       Failed to load active users. Please try again.
//     </div>
//   );

//   const pageNumbers = generatePageNumbers();
//   const currentPage = activeUsersData?.currentPage || page;
//   const totalPages = activeUsersData?.totalPages || 1;
//   const totalCount = activeUsersData?.totalCount || 0;

//   return (
//     <div>
//       {/* Header with Navigation */}
//       <div className="mb-6">
//         <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
//           <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
//             Dashboard
//           </Link>
//           <span>/</span>
//           <Link href="/dashboard/employees" className="hover:text-blue-600 transition-colors">
//             Employees
//           </Link>
//           <span>/</span>
//           <span className="text-gray-900 font-medium">Active Today</span>
//         </div>
        
//         <div className="flex justify-between items-center">
//           <h1 className="text-2xl font-bold text-gray-900">Active Users Today</h1>
//           <div className="flex items-center gap-2 text-sm text-gray-600">
//             <Calendar className="h-4 w-4" />
//             {new Date().toLocaleDateString('en-US', { 
//               weekday: 'long', 
//               year: 'numeric', 
//               month: 'long', 
//               day: 'numeric' 
//             })}
//           </div>
//         </div>
//       </div>

//       {/* Active Users Stats */}
//       <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
//         <div className="flex justify-between items-center">
//           <div className="flex items-center gap-3">
//             <div className="p-2 bg-green-100 rounded-lg">
//               <UserCheck className="h-6 w-6 text-green-600" />
//             </div>
//             <div>
//               <h2 className="text-lg font-semibold text-green-900">Active Today</h2>
//               <p className="text-sm text-green-700">
//                 Employees who have checked in today
//               </p>
//             </div>
//           </div>
//           <div className="text-right">
//             <div className="text-2xl font-bold text-green-900">{totalCount}</div>
//             <div className="text-sm text-green-700">Total Active</div>
//           </div>
//         </div>
        
//         {/* Gender Stats */}
//         {(activeUsersData?.maleCount || activeUsersData?.femaleCount || activeUsersData?.othersCount) && (
//           <div className="flex gap-6 mt-4 pt-4 border-t border-green-200">
//             {activeUsersData.maleCount > 0 && (
//               <div className="text-center">
//                 <div className="text-lg font-semibold text-blue-600">{activeUsersData.maleCount}</div>
//                 <div className="text-xs text-gray-600">Male</div>
//               </div>
//             )}
//             {activeUsersData.femaleCount > 0 && (
//               <div className="text-center">
//                 <div className="text-lg font-semibold text-pink-600">{activeUsersData.femaleCount}</div>
//                 <div className="text-xs text-gray-600">Female</div>
//               </div>
//             )}
//             {activeUsersData.othersCount > 0 && (
//               <div className="text-center">
//                 <div className="text-lg font-semibold text-purple-600">{activeUsersData.othersCount}</div>
//                 <div className="text-xs text-gray-600">Others</div>
//               </div>
//             )}
//           </div>
//         )}
//       </div>

//       {loadingPunches && (
//         <div className="flex justify-center items-center py-4">
//           <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
//           <span className="ml-2 text-sm text-gray-500">Loading punch data...</span>
//         </div>
//       )}

//       {activeUsers.length === 0 ? (
//         <div className="text-center py-12">
//           <UserCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
//           <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Users Today</h3>
//           <p className="text-gray-500 max-w-md mx-auto">
//             No employees have checked in today. Active users will appear here once they punch in.
//           </p>
//         </div>
//       ) : (
//         <>
//           <ul className="space-y-3">
//             {activeUsers.map((user) => {
//               const profileUrl = getProfileImageUrl(user);
//               const initials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`;
//               const punch = punches[user.uniqueKey];
//               const checkInTime = extractTime(punch?.first_check_in);
//               const checkOutTime = extractTime(punch?.last_check_out);
//               const multiMode = punch?.multi_mode || false;
//               const sessions = punch?.punch_sessions || [];
//               const totalSessions = punch?.total_sessions || 0;

//               return (
//                 <li
//                   key={user.uniqueKey}
//                   className="border border-green-200 p-4 rounded-lg cursor-pointer hover:bg-green-50 transition-colors shadow-sm bg-white"
//                 >
//                   <Link
//                     href={`/dashboard/employees/${user.id}`}
//                     className="block"
//                   >
//                     <div className="flex items-center justify-between">
//                       {/* Left Section - Profile and User Details */}
//                       <div className="flex items-center gap-4 flex-1">
//                         {/* Profile with active indicator */}
//                         <div className="relative">
//                           <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-green-200 bg-green-100 flex items-center justify-center flex-shrink-0">
//                             {profileUrl ? (
//                               <Image
//                                 src={profileUrl}
//                                 alt={`${user.first_name} ${user.last_name}`}
//                                 width={56}
//                                 height={56}
//                                 className="object-cover h-14 w-14"
//                                 onError={(e) => {
//                                   const target = e.target as HTMLImageElement;
//                                   target.style.display = "none";
//                                 }}
//                               />
//                             ) : (
//                               <div className="flex items-center justify-center h-14 w-14 rounded-full bg-green-100 text-green-700 font-bold text-lg">
//                                 {initials}
//                               </div>
//                             )}
//                           </div>
//                           <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
//                         </div>

//                         {/* User Details */}
//                         <div className="flex flex-col min-w-0">
//                           <p className="font-semibold text-gray-900 truncate">
//                             {user.first_name} {user.last_name}
//                           </p>
//                           <p className="text-sm text-gray-500 truncate">{user.email}</p>
//                           <div className="flex flex-wrap gap-2 mt-1">
//                             {user.group && (
//                               <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
//                                 {user.group}
//                               </span>
//                             )}
//                             {user.is_wfh !== undefined && (
//                               <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
//                                 {user.is_wfh ? "WFH" : "Office"}
//                               </span>
//                             )}
//                             <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
//                               Active Now
//                             </span>
//                             {multiMode && totalSessions > 1 && (
//                               <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
//                                 {totalSessions} Sessions
//                               </span>
//                             )}
//                           </div>
//                         </div>
//                       </div>

//                       {/* Middle Section - Punch Times */}
//                       <div className="flex items-center gap-8 mx-8">
//                         {/* Check-in */}
//                         <div className="flex flex-col items-center">
//                           <div className="flex items-center gap-2 mb-1">
//                             <ArrowUpCircle className="h-4 w-4 text-green-500" />
//                             <span className="text-xs font-medium text-gray-500">IN</span>
//                           </div>
//                           <span className="text-lg font-bold text-gray-900">
//                             {checkInTime}
//                           </span>
//                           {multiMode && punch?.check_in_count > 1 && (
//                             <span className="text-xs text-green-600 font-medium">
//                               +{punch.check_in_count - 1}
//                             </span>
//                           )}
//                         </div>
                        
//                         {/* Check-out */}
//                         <div className="flex flex-col items-center">
//                           <div className="flex items-center gap-2 mb-1">
//                             <ArrowDownCircle className="h-4 w-4 text-red-500" />
//                             <span className="text-xs font-medium text-gray-500">OUT</span>
//                           </div>
//                           <span className="text-lg font-bold text-gray-900">
//                             {checkOutTime}
//                           </span>
//                           {multiMode && punch?.check_out_count > 1 && (
//                             <span className="text-xs text-red-600 font-medium">
//                               +{punch.check_out_count - 1}
//                             </span>
//                           )}
//                         </div>
//                       </div>

//                       {/* Right Section - Work Hours */}
//                       <div className="flex items-center justify-end flex-shrink-0">
//                         <TimeCircle 
//                           sessions={sessions} 
//                           checkIn={checkInTime} 
//                           checkOut={checkOutTime} 
//                         />
//                       </div>
//                     </div>

//                     {/* Multiple Sessions Display */}
//                     <PunchSessions sessions={sessions} multiMode={multiMode} />
//                   </Link>
//                 </li>
//               );
//             })}
//           </ul>

//           {/* Pagination */}
//           {totalPages > 1 && (
//             <>
//               <div className="flex justify-center items-center mt-8 space-x-2">
//                 {/* Previous Button */}
//                 <button
//                   onClick={() => setPage((p) => Math.max(p - 1, 1))}
//                   disabled={currentPage === 1}
//                   className="flex items-center justify-center h-10 w-10 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                 >
//                   <ChevronLeft className="h-4 w-4" />
//                 </button>

//                 {/* Page Numbers */}
//                 {pageNumbers.map((pageNum, index) => (
//                   <button
//                     key={index}
//                     onClick={() => typeof pageNum === "number" && setPage(pageNum)}
//                     disabled={pageNum === "..."}
//                     className={`flex items-center justify-center h-10 w-10 rounded-lg border transition-colors ${
//                       pageNum === currentPage
//                         ? "bg-green-600 text-white border-green-600"
//                         : pageNum === "..."
//                         ? "border-transparent cursor-default"
//                         : "border-gray-300 hover:bg-gray-50 text-gray-700"
//                     }`}
//                   >
//                     {pageNum}
//                   </button>
//                 ))}

//                 {/* Next Button */}
//                 <button
//                   onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
//                   disabled={currentPage === totalPages}
//                   className="flex items-center justify-center h-10 w-10 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                 >
//                   <ChevronRight className="h-4 w-4" />
//                 </button>
//               </div>

//               {/* Page Info */}
//               <div className="text-center mt-4 text-sm text-gray-500">
//                 Page {currentPage} of {totalPages} • 
//                 Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalCount)} of {totalCount} active users
//               </div>
//             </>
//           )}
//         </>
//       )}
//     </div>
//   );
// }