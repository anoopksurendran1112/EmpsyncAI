// src/app/dashboard/employees/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/context/AuthContext";
import { useEmployees } from "@/hooks/employees/useGetEmployees";
import { useFilterEmployees } from "@/hooks/employees/useFilterEmployees";
import { useCompany } from "@/context/CompanyContext";
import Link from "next/link";
import Image from "next/image";
import { useEmployeeCount } from "@/hooks/employees/useEmployeeCount";
import { useActiveUsersCount } from "@/hooks/active-users/useActiveUsersCount";
import { useGroups } from "@/hooks/settings/groups/useGroups";
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal, 
  Users, 
  UserCheck,
  Clock
} from "lucide-react";
import FilterComponent from "@/components/filter";
import { useDebounce } from "@/hooks/useDebounce"; 
import { useRouter } from "next/navigation";

// Import our new hooks
import { useEmployeeCache } from "@/hooks/useEmployeeCache";
import { useEmployeePrefetch } from "@/hooks/useEmployeePrefetch";

// Define interfaces
interface PunchSession {
  check_in?: string;
  check_out?: string;
  check_in_device?: string;
  check_out_device?: string;
  duration_hours?: number;
}

interface PunchData {
  first_check_in: string | null;
  last_check_out: string | null;
  multi_mode: boolean;
  punch_sessions?: PunchSession[];
  total_sessions?: number;
  check_in_count?: number;
  check_out_count?: number;
  data?: any[];
}

// Employee data with unique identifier
interface EmployeeWithKey extends User {
  uniqueKey: string; // Composite key to prevent duplicates
  predictedPage?: number; // Predicted page number for faster lookup
}

// Helper functions (kept inline as requested)
function extractTime(dateStr: string | null): string {
  if (!dateStr) return "--";
  if (dateStr.includes("T")) return dateStr.split("T")[1]?.slice(0, 5) || "--";
  return dateStr;
}

function calculateCurrentWorkHours(checkIn: string | null): string {
  if (!checkIn || checkIn === "--") return "--";
  
  try {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const [inHours, inMinutes] = checkIn.split(":").map(Number);
    const [currentHours, currentMinutes] = currentTime.split(":").map(Number);
    
    let totalMinutes = (currentHours * 60 + currentMinutes) - (inHours * 60 + inMinutes);
    
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60;
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}.${Math.round((minutes / 60) * 100).toString().padStart(2, '0')}`;
  } catch {
    return "--";
  }
}

function calculateCompletedWorkHours(checkIn: string | null, checkOut: string | null): string {
  if (!checkIn || !checkOut || checkIn === "--" || checkOut === "--") return "--";
  
  try {
    const [inHours, inMinutes] = checkIn.split(":").map(Number);
    const [outHours, outMinutes] = checkOut.split(":").map(Number);
    
    let totalMinutes = (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes);
    
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60;
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}.${Math.round((minutes / 60) * 100).toString().padStart(2, '0')}`;
  } catch {
    return "--";
  }
}

function calculateTotalHours(sessions: PunchSession[]): string {
  if (!sessions || sessions.length === 0) return "--";
  
  let totalMinutes = 0;
  
  sessions.forEach(session => {
    if (session.check_in && session.check_out) {
      const checkInTime = extractTime(session.check_in);
      const checkOutTime = extractTime(session.check_out);
      
      if (checkInTime !== "--" && checkOutTime !== "--") {
        const [inHours, inMinutes] = checkInTime.split(":").map(Number);
        const [outHours, outMinutes] = checkOutTime.split(":").map(Number);
        
        let sessionMinutes = (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes);
        
        if (sessionMinutes < 0) {
          sessionMinutes += 24 * 60;
        }
        
        totalMinutes += sessionMinutes;
      }
    }
  });
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  return `${hours}.${Math.round((minutes / 60) * 100).toString().padStart(2, '0')}`;
}

// Circular Progress Component
function TimeCircle({ sessions, checkIn, checkOut, size = 70 }: { 
  sessions?: PunchSession[]; 
  checkIn: string; 
  checkOut: string; 
  size?: number 
}) {
  const totalHours = sessions && sessions.length > 1 
    ? calculateTotalHours(sessions)
    : checkOut === "--" 
      ? calculateCurrentWorkHours(checkIn)
      : calculateCompletedWorkHours(checkIn, checkOut);
  
  const hasValidData = totalHours !== "--" && !totalHours.includes("NaN");
  
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

// Punch Sessions Display Component
function PunchSessions({ sessions, multiMode }: { sessions?: PunchSession[]; multiMode: boolean }) {
  if (!multiMode || !sessions || sessions.length <= 1) {
    return null;
  }

  return (
    <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-blue-800">Multiple Sessions ({sessions.length})</span>
        <MoreHorizontal className="h-3 w-3 text-blue-600" />
      </div>
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {sessions.map((session, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium text-blue-700">Session {index + 1}:</span>
              {session.check_in && (
                <span className="text-green-600">
                  IN: {extractTime(session.check_in)}
                </span>
              )}
              {session.check_out && (
                <span className="text-red-600">
                  OUT: {extractTime(session.check_out)}
                </span>
              )}
            </div>
            {session.duration_hours && (
              <span className="text-blue-600 font-medium">
                {session.duration_hours.toFixed(2)}h
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmployeesList({ companyId }: { companyId: number }) {
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const router = useRouter();
  
  // State for filters
  const [selectedGroupId, setSelectedGroupId] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [clickLoading, setClickLoading] = useState<string | null>(null); // Track loading employee

  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const effectiveSearchQuery = debouncedSearchQuery.length >= 2 ? debouncedSearchQuery : "";
  const hasActiveFilters = selectedGroupId !== 0 || effectiveSearchQuery !== "";

  // Employee caching and prefetching hooks
  const { getEmployee, setEmployee } = useEmployeeCache();
  const { onHoverStart, onHoverEnd } = useEmployeePrefetch(companyId);

  // Use both hooks conditionally
  const { 
    data: regularEmployeesData, 
    isLoading: regularLoading, 
    isError: regularError 
  } = useEmployees(companyId, page, pageSize);

  const { 
    data: filteredEmployeesData, 
    isLoading: filteredLoading, 
    isError: filteredError 
  } = useFilterEmployees({
    companyId,
    page,
    groupId: selectedGroupId !== 0 ? selectedGroupId : undefined,
    searchQuery: effectiveSearchQuery
  });

  const { data: groupsData, isLoading: groupsLoading, error: groupsError } = useGroups();

  // Get groups for display
  const allGroups = useMemo(() => {
    if (!groupsData) return [];
    
    const groupsArray = groupsData.data || [];
    
    const extractedGroups = groupsArray
      .map((groupItem: any) => ({
        id: Number(groupItem.id),
        name: groupItem.group || groupItem.name || "Unnamed Group"
      }))
      .filter((group: { id: number; name: string }) => 
        group.id && group.name.trim() !== ""
      )
      .sort((a, b) => a.name.localeCompare(b.name));
      
    return extractedGroups;
  }, [groupsData]);

  // Determine which data to use
  const employeesData = useMemo(() => {
    if (hasActiveFilters && filteredEmployeesData) {
      return filteredEmployeesData;
    }
    return regularEmployeesData;
  }, [hasActiveFilters, regularEmployeesData, filteredEmployeesData]);

  const isLoading = hasActiveFilters ? filteredLoading : regularLoading;
  const isError = hasActiveFilters ? filteredError : regularError;

  const { count: totalCompanyEmployees, isLoading: countLoading } = useEmployeeCount(companyId);
  const { currentCompany } = useCompany();
  const [punches, setPunches] = useState<Record<string, PunchData>>({});
  const [loadingPunches, setLoadingPunches] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data: activeUsersData, isLoading: activeUsersLoading } = useActiveUsersCount(companyId);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedGroupId, searchQuery]);

  // Get pagination data
  const currentPage = useMemo(() => {
    if (hasActiveFilters && filteredEmployeesData) {
      return filteredEmployeesData.page || page;
    }
    return employeesData?.currentPage || employeesData?.page || page;
  }, [hasActiveFilters, filteredEmployeesData, employeesData, page]);

  const totalPages = useMemo(() => {
    if (hasActiveFilters && filteredEmployeesData) {
      return filteredEmployeesData.totalPages || 1;
    }
    return employeesData?.totalPages || employeesData?.last_page || 1;
  }, [hasActiveFilters, filteredEmployeesData, employeesData]);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Employee data processing with prediction
  const employees: EmployeeWithKey[] = useMemo(() => {
    if (!employeesData) return [];
    
    let rawEmployees: User[] = [];
    
    if (Array.isArray(employeesData)) {
      rawEmployees = employeesData;
    } else if (Array.isArray(employeesData?.employees)) {
      rawEmployees = employeesData.employees;
    } else if (Array.isArray(employeesData?.results)) {
      rawEmployees = employeesData.results;
    } else if (Array.isArray(employeesData?.data)) {
      rawEmployees = employeesData.data;
    }
    
    const uniqueEmployees = new Map<string, EmployeeWithKey>();
    
    rawEmployees.forEach((emp) => {
      if (!emp || !emp.id) return;
      
      const uniqueKey = `${emp.id}-${emp.biometric_id || ''}-${emp.employee_id || ''}`;
      
      if (!uniqueEmployees.has(uniqueKey)) {
        // Calculate predicted page based on ID for faster future lookups
        let predictedPage = 1;
        if (typeof emp.id === 'number' && pageSize > 0) {
          predictedPage = Math.max(1, Math.ceil(emp.id / pageSize));
        }
        
        uniqueEmployees.set(uniqueKey, {
          ...emp,
          uniqueKey,
          predictedPage
        });
      }
    });
    
    return Array.from(uniqueEmployees.values());
  }, [employeesData, pageSize]);

  const filteredEmployees = useMemo(() => {
    return employees;
  }, [employees]);

  // Total count calculation
  const displayTotalCount = useMemo(() => {
    if (hasActiveFilters && filteredEmployeesData) {
      return filteredEmployeesData.totalEmployees || 0;
    }
    
    if (typeof totalCompanyEmployees === 'number' && totalCompanyEmployees > 0) {
      return totalCompanyEmployees;
    }
    
    if (employeesData && typeof employeesData.totalEmployees === 'number' && employeesData.totalEmployees > 0) {
      return employeesData.totalEmployees;
    }
    
    if (employeesData && typeof employeesData.totalCount === 'number' && employeesData.totalCount > 0) {
      return employeesData.totalCount;
    }
    
    return employees.length || 0;
  }, [employeesData, totalCompanyEmployees, employees.length, hasActiveFilters, filteredEmployeesData]);

  const currentPageEmployeesCount = filteredEmployees.length;

  // Calculate range for display
  const calculateRange = () => {
    const totalEmployees = displayTotalCount;
    const currentPageCount = filteredEmployees.length;
    
    if (totalEmployees === 0 || currentPageCount === 0) {
      return { start: 0, end: 0 };
    }
    
    if (hasActiveFilters) {
      const start = ((currentPage - 1) * pageSize) + 1;
      const end = Math.min(start + currentPageCount - 1, totalEmployees);
      return { start, end };
    }
    
    if (currentPage === 1) {
      return {
        start: 1,
        end: currentPageCount
      };
    }
    
    const previousPagesCount = (currentPage - 1) * pageSize;
    let start = previousPagesCount + 1;
    let end = start + currentPageCount - 1;
    
    if (end > totalEmployees) {
      end = totalEmployees;
    }
    
    if (start > totalEmployees) {
      start = Math.max(1, totalEmployees - currentPageCount + 1);
    }
    
    return { start, end };
  };

  const { start, end } = calculateRange();

  // ⚡ OPTIMIZED: Employee click handler with fast lookup
  const handleEmployeeClick = useCallback(async (employee: EmployeeWithKey, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const employeeId = employee.id.toString();
    setClickLoading(employeeId);
    
    console.log(`🔍 Clicking employee: ${employeeId} (Predicted page: ${employee.predictedPage})`);
    
    try {
      // 1. INSTANT: Check cache first
      const cachedEmployee = getEmployee(employeeId, companyId);
      if (cachedEmployee) {
        console.log('⚡ Instant from cache!');
        router.push(`/dashboard/employees/${employeeId}`);
        return;
      }
      
      // 2. FAST: Try direct API lookup
      const startTime = Date.now();
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          company_id: companyId,
          employee_id: employeeId 
        }),
      });
      
      const data = await response.json();
      const searchTime = Date.now() - startTime;
      
      if (data.success && data.data) {
        console.log(`✅ Found in ${searchTime}ms`);
        
        // Cache for future clicks
        setEmployee(employeeId, data.data, companyId);
        router.push(`/dashboard/employees/${employeeId}`);
      } else {
        console.error('Employee not found via API');
        // Fallback to regular navigation
        router.push(`/dashboard/employees/${employeeId}`);
      }
    } catch (error) {
      console.error('Failed to fetch employee:', error);
      // Fallback to regular navigation
      router.push(`/dashboard/employees/${employeeId}`);
    } finally {
      setClickLoading(null);
    }
  }, [companyId, getEmployee, setEmployee, router]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch punches
  useEffect(() => {
    if (!filteredEmployees.length) {
      setLoadingPunches(false);
      setPunches({});
      return;
    }

    let cancelled = false;

    async function fetchPunches() {
      setLoadingPunches(true);
      const punchesData: Record<string, PunchData> = {};

      try {
        const batchSize = 10;
        for (let i = 0; i < filteredEmployees.length; i += batchSize) {
          if (cancelled) break;
          
          const batch = filteredEmployees.slice(i, i + batchSize);
          await Promise.all(
            batch.map(async (emp) => {
              try {
                const res = await fetch("/api/punch/todaypunch", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    biometric_id: emp.biometric_id,
                    company_id: companyId,
                    start_date: new Date().toISOString().split("T")[0],
                    end_date: new Date().toISOString().split("T")[0],
                    user_id: emp.biometric_id,
                  }),
                });
                
                if (res.ok) {
                  const punchData = await res.json();
                  punchesData[emp.uniqueKey] = punchData;
                } else {
                  punchesData[emp.uniqueKey] = { 
                    first_check_in: null, 
                    last_check_out: null,
                    multi_mode: false 
                  };
                }
              } catch (error) {
                console.error(`Error fetching punch data for employee ${emp.id}:`, error);
                punchesData[emp.uniqueKey] = { 
                  first_check_in: null, 
                  last_check_out: null,
                  multi_mode: false 
                };
              }
            })
          );
          
          if (i + batchSize < filteredEmployees.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      } catch (error) {
        console.error('Error in fetchPunches:', error);
      }

      if (!cancelled) {
        setPunches(punchesData);
        setLoadingPunches(false);
      }
    }

    fetchPunches();
    return () => {
      cancelled = true;
    };
  }, [filteredEmployees, companyId]);

  // Generate page numbers
  const generatePageNumbers = () => {
    if (totalPages <= 1) return [];
    
    const pages = [];
    pages.push(1);
    
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);
    
    if (startPage > 2) {
      pages.push("...");
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    if (endPage < totalPages - 1) {
      pages.push("...");
    }
    
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedGroupId(0);
    setSearchQuery("");
    setPage(1);
  };

  const getProfileImageUrl = (emp: User) =>
    emp.prof_img ? (emp.prof_img.startsWith("http") ? emp.prof_img : `${currentCompany?.mediaBaseUrl}${emp.prof_img}`) : null;

  const pageNumbers = generatePageNumbers();

  if (isLoading) return (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2">Loading employees...</span>
    </div>
  );
  
  if (isError) return (
    <div className="text-center py-8 text-red-600">
      Failed to load employees. Please try again.
    </div>
  );

  return (
    <div>
      {/* Enhanced Header with Active Users Count */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Employees</span>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Employees</h1>
            <p className="text-sm text-gray-600 mt-1">
              {selectedGroupId !== 0 ? (
                <>Filtered by: <span className="font-semibold text-blue-600">{allGroups.find(g => g.id === selectedGroupId)?.name || `Group ${selectedGroupId}`}</span></>
              ) : (
                <>Showing all employees</>
              )}
            </p>
          </div>
          
          <FilterComponent
            selectedGroupId={selectedGroupId}
            setSelectedGroupId={setSelectedGroupId}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            groupsData={groupsData}
            groupsLoading={groupsLoading}
            groupsError={groupsError}
            filteredLoading={filteredLoading}
          />
        </div>
      </div>
      
      {/* Enhanced Employees Count Card with Active Users */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Employees Card */}
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Employees</h3>
              <p className="text-3xl font-bold text-blue-600">
                {countLoading ? (
                  <span className="text-gray-400">Loading...</span>
                ) : (
                  displayTotalCount.toLocaleString()
                )}
              </p>
              {hasActiveFilters && (
                <p className="text-sm text-gray-500 mt-1">
                  Showing {filteredEmployees.length} of {employees.length} on this page
                </p>
              )}
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Page {currentPage} of {totalPages}
          </p>
        </div>

        {/* Active Today Card */}
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Today</h3>
              <p className="text-3xl font-bold text-green-600">
                {activeUsersLoading ? (
                  <span className="text-gray-400">Loading...</span>
                ) : (
                  activeUsersData?.total.toLocaleString() || "0"
                )}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
          </div>
          
          {!activeUsersLoading && activeUsersData && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-gray-500">Male</p>
                  <p className="text-sm font-semibold text-blue-600">
                    {activeUsersData.male_count || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Female</p>
                  <p className="text-sm font-semibold text-pink-600">
                    {activeUsersData.female_count || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Others</p>
                  <p className="text-sm font-semibold text-purple-600">
                    {activeUsersData.others_count || 0}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {loadingPunches && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-500">Loading punch data...</span>
        </div>
      )}

      {filteredEmployees.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {employees.length === 0 ? (
            "No employees found for this company."
          ) : (
            <div>
              <p className="text-lg mb-2">No employees match your filters</p>
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {filteredEmployees.map((emp) => {
              const profileUrl = getProfileImageUrl(emp);
              const initials = `${emp.first_name?.[0] || ""}${emp.last_name?.[0] || ""}`;
              const punch = punches[emp.uniqueKey];
              const checkInTime = extractTime(punch?.first_check_in);
              const checkOutTime = extractTime(punch?.last_check_out);
              const multiMode = punch?.multi_mode || false;
              const sessions = punch?.punch_sessions || [];
              const totalSessions = punch?.total_sessions || 0;

              return (
                <li
                  key={emp.uniqueKey}
                  className="border border-gray-200 p-4 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors shadow-sm group"
                  onMouseEnter={() => onHoverStart(emp.id.toString())}
                  onMouseLeave={() => onHoverEnd(emp.id.toString())}
                  onClick={(e) => handleEmployeeClick(emp, e)}
                >
                  <div className="flex items-center justify-between">
                    {/* Left Section - Profile and Employee Details */}
                    <div className="flex items-center gap-4 flex-1">
                      {/* Profile */}
                      <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {profileUrl ? (
                          <Image
                            src={profileUrl}
                            alt={`${emp.first_name} ${emp.last_name}`}
                            width={56}
                            height={56}
                            className="object-cover h-14 w-14"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-14 w-14 rounded-full bg-blue-100 text-blue-700 font-bold text-lg">
                            {initials}
                          </div>
                        )}
                      </div>

                      {/* Employee Details with loading indicator */}
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 truncate">
                            {emp.first_name} {emp.last_name}
                          </p>
                          {clickLoading === emp.id.toString() && (
                            <Clock className="h-4 w-4 text-blue-600 animate-spin" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">{emp.email}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {emp.group && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                              {emp.group}
                            </span>
                          )}
                          {emp.is_wfh !== undefined && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              {emp.is_wfh ? "WFH" : "Office"}
                            </span>
                          )}
                          {multiMode && totalSessions > 1 && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                              {totalSessions} Sessions
                            </span>
                          )}
                          {/* {emp.predictedPage && emp.predictedPage > 1 && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              Page {emp.predictedPage}
                            </span>
                          )} */}
                        </div>
                      </div>
                    </div>

                    {/* Middle Section - Punch Times */}
                    <div className="flex items-center gap-8 mx-8">
                      {/* Check-in */}
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-1">
                          <ArrowUpCircle className="h-4 w-4 text-green-500" />
                          <span className="text-xs font-medium text-gray-500">IN</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900">
                          {checkInTime}
                        </span>
                        {multiMode && punch?.check_in_count > 1 && (
                          <span className="text-xs text-green-600 font-medium">
                            +{punch.check_in_count - 1}
                          </span>
                        )}
                      </div>
                      
                      {/* Check-out */}
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-1">
                          <ArrowDownCircle className="h-4 w-4 text-red-500" />
                          <span className="text-xs font-medium text-gray-500">OUT</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900">
                          {checkOutTime}
                        </span>
                        {multiMode && punch?.check_out_count > 1 && (
                          <span className="text-xs text-red-600 font-medium">
                            +{punch.check_out_count - 1}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Section - Average Work Hours */}
                    <div className="flex items-center justify-end flex-shrink-0">
                      <TimeCircle 
                        sessions={sessions} 
                        checkIn={checkInTime} 
                        checkOut={checkOutTime} 
                      />
                    </div>
                  </div>

                  {/* Multiple Sessions Display */}
                  <PunchSessions sessions={sessions} multiMode={multiMode} />
                </li>
              );
            })}
          </ul>

          {/* Enhanced Pagination like Flipkart */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-8 space-x-2">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center justify-center h-10 w-10 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Page Numbers */}
              {pageNumbers.map((pageNum, index) => (
                <button
                  key={index}
                  onClick={() => typeof pageNum === "number" && handlePageChange(pageNum)}
                  disabled={pageNum === "..."}
                  className={`flex items-center justify-center h-10 w-10 rounded-lg border transition-colors ${
                    pageNum === currentPage
                      ? "bg-blue-600 text-white border-blue-600"
                      : pageNum === "..."
                      ? "border-transparent cursor-default"
                      : "border-gray-300 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center h-10 w-10 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
          
          {/* Page Info */}
          <div className="text-center mt-4 text-sm text-gray-500">
            Page {currentPage} of {totalPages} • 
            {displayTotalCount > 0 ? (
              <> Showing {start}-{end} of {displayTotalCount.toLocaleString()} employees</>
            ) : (
              <> Showing {currentPageEmployeesCount} employees</>
            )}
            {selectedGroupId !== 0 && (
              <span className="ml-2 text-blue-600">
                • Filtered by: {allGroups.find(g => g.id === selectedGroupId)?.name || `Group ${selectedGroupId}`}
              </span>
            )}
            {searchQuery && (
              <span className="ml-2 text-green-600">
                • Searching: "{searchQuery}"
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function EmployeesPage() {
  const { company } = useAuth();

  if (!company) return <p>No company selected</p>;

  return <EmployeesList companyId={company.id} />;
}
// "use client";

// import { useState, useEffect, useMemo } from "react";
// import { useAuth } from "@/context/AuthContext";
// import { User } from "@/context/AuthContext";
// import { useEmployees } from "@/hooks/employees/useGetEmployees";
// import { useCompany } from "@/context/CompanyContext";
// import Link from "next/link";
// import Image from "next/image";
// import { useEmployeeCount } from "@/hooks/employees/useEmployeeCount";
// import { useActiveUsersCount } from "@/hooks/active-users/useActiveUsersCount";
// import { useGroups } from "@/hooks/settings/groups/useGroups"; // ✅ Import your useGroups hook
// import { 
//   ArrowUpCircle, 
//   ArrowDownCircle, 
//   ChevronLeft, 
//   ChevronRight, 
//   MoreHorizontal, 
//   Users, 
//   UserCheck, 
//   Filter,
//   Search,
//   X
// } from "lucide-react";

// // Define PunchData interface with multiple sessions
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

// // Employee data with unique identifier
// interface EmployeeWithKey extends User {
//   uniqueKey: string; // Composite key to prevent duplicates
// }

// // Extract HH:mm from timestamp
// function extractTime(dateStr: string | null): string {
//   if (!dateStr) return "--";
//   if (dateStr.includes("T")) return dateStr.split("T")[1]?.slice(0, 5) || "--";
//   return dateStr;
// }

// // Calculate current work hours based on check-in time and current time
// function calculateCurrentWorkHours(checkIn: string | null): string {
//   if (!checkIn || checkIn === "--") return "--";
  
//   try {
//     const now = new Date();
//     const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
//     const [inHours, inMinutes] = checkIn.split(":").map(Number);
//     const [currentHours, currentMinutes] = currentTime.split(":").map(Number);
    
//     let totalMinutes = (currentHours * 60 + currentMinutes) - (inHours * 60 + inMinutes);
    
//     // Handle overnight shifts
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

// // Calculate work hours between two times (for completed sessions)
// function calculateCompletedWorkHours(checkIn: string | null, checkOut: string | null): string {
//   if (!checkIn || !checkOut || checkIn === "--" || checkOut === "--") return "--";
  
//   try {
//     const [inHours, inMinutes] = checkIn.split(":").map(Number);
//     const [outHours, outMinutes] = checkOut.split(":").map(Number);
    
//     let totalMinutes = (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes);
    
//     // Handle overnight shifts
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

// // Calculate total hours from multiple sessions
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
        
//         // Handle overnight shifts
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

// // Circular Progress Component
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

// // Punch Sessions Display Component
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

// function EmployeesList({ companyId }: { companyId: number }) {
//   const [page, setPage] = useState(1);
//   const pageSize = 50;
  
//   // ✅ State for filters
//   const [selectedGroup, setSelectedGroup] = useState<string>("all");
//   const [searchQuery, setSearchQuery] = useState<string>("");
//   const [showFilters, setShowFilters] = useState(false);

//   // ✅ Use employees hook with group filter - will refetch when group changes
//   const { data, isLoading, isError } = useEmployees(
//     companyId, 
//     page, 
//     pageSize,
//     selectedGroup !== "all" ? selectedGroup : undefined // Pass group filter to API
//   );

//   const { count: totalCompanyEmployees, isLoading: countLoading } = useEmployeeCount(companyId);
//   const { currentCompany } = useCompany();
//   const [punches, setPunches] = useState<Record<string, PunchData>>({});
//   const [loadingPunches, setLoadingPunches] = useState(true);
//   const [currentTime, setCurrentTime] = useState(new Date());

//   // ✅ Use the active users count hook
//   const { data: activeUsersData, isLoading: activeUsersLoading } = useActiveUsersCount(companyId);

//   // ✅ Use your existing useGroups hook
//   const { data: groupsData, isLoading: groupsLoading, error: groupsError } = useGroups();

//   // Debug: Check what's being returned
//   useEffect(() => {
//     console.log("🔍 Groups Data:", groupsData);
//     console.log("🔍 Selected Group:", selectedGroup);
//     console.log("🔍 Employees Data:", data);
//   }, [groupsData, selectedGroup, data]);

//   // Extract groups from the hook response
//   const allGroups = useMemo(() => {
//     if (!groupsData) {
//       console.log("❌ No groups data");
//       return [];
//     }
    
//     console.log("📊 Raw groups data:", groupsData);

//     let groupsArray: any[] = [];

//     if (groupsData.data && Array.isArray(groupsData.data)) {
//       groupsArray = groupsData.data;
//       console.log("✅ Found groups in data.data:", groupsArray);
//     }
//     else if (Array.isArray(groupsData)) {
//       groupsArray = groupsData;
//       console.log("✅ Found groups as direct array:", groupsArray);
//     }

//     console.log("📋 Processed groups array:", groupsArray);

//     const extractedGroups = groupsArray
//       .map((groupItem: any) => {
//         return groupItem.group || groupItem.name || groupItem.group_name || groupItem.groupName || groupItem.title || "";
//       })
//       .filter((groupName: string) => groupName && groupName.trim() !== "")
//       .sort();

//     console.log("🎯 Final extracted groups:", extractedGroups);
//     return extractedGroups;

//   }, [groupsData]);

//   // ✅ Reset to page 1 when group filter changes
//   useEffect(() => {
//     setPage(1);
//   }, [selectedGroup]);

//   // Update current time every minute for real-time work hours
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setCurrentTime(new Date());
//     }, 60000);
//     return () => clearInterval(interval);
//   }, []);

//   // FIXED: Proper employee data processing with deduplication
//   const employees: EmployeeWithKey[] = useMemo(() => {
//     if (!data) return [];
    
//     let rawEmployees: User[] = [];
    
//     // Handle different API response structures
//     if (Array.isArray(data)) {
//       rawEmployees = data;
//     } else if (Array.isArray(data?.employees)) {
//       rawEmployees = data.employees;
//     } else if (Array.isArray(data?.results)) {
//       rawEmployees = data.results;
//     } else if (Array.isArray(data?.data)) {
//       rawEmployees = data.data;
//     }
    
//     // Deduplicate employees using multiple identifiers
//     const uniqueEmployees = new Map<string, EmployeeWithKey>();
    
//     rawEmployees.forEach((emp) => {
//       if (!emp || !emp.id) return;
      
//       const uniqueKey = `${emp.id}-${emp.biometric_id || ''}-${emp.employee_id || ''}`;
      
//       if (!uniqueEmployees.has(uniqueKey)) {
//         uniqueEmployees.set(uniqueKey, {
//           ...emp,
//           uniqueKey
//         });
//       }
//     });
    
//     return Array.from(uniqueEmployees.values());
//   }, [data]);

//   // ✅ Filter employees based on search query only (group filtering is now server-side)
//   const filteredEmployees = useMemo(() => {
//     if (searchQuery === "") return employees;
    
//     return employees.filter(emp => {
//       // Only apply search filter (group filter is handled by API)
//       const searchMatch = 
//         `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         emp.employee_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         emp.biometric_id?.toString().includes(searchQuery);
      
//       return searchMatch;
//     });
//   }, [employees, searchQuery]);

//   // SIMPLIFIED: Get total count
//   const displayTotalCount = useMemo(() => {
//     // Priority 1: Use count from dedicated API if available and valid
//     if (typeof totalCompanyEmployees === 'number' && totalCompanyEmployees > 0) {
//       return totalCompanyEmployees;
//     }
    
//     // Priority 2: Use totalEmployees from main employees API
//     if (data && typeof data.totalEmployees === 'number' && data.totalEmployees > 0) {
//       return data.totalEmployees;
//     }
    
//     // Priority 3: Use totalCount from main employees API
//     if (data && typeof data.totalCount === 'number' && data.totalCount > 0) {
//       return data.totalCount;
//     }
    
//     // Priority 4: Final fallback - use actual employee count
//     return employees.length || 0;
//   }, [data, totalCompanyEmployees, employees.length]);

//   const currentPageEmployeesCount = filteredEmployees.length;
//   const currentPage = data?.currentPage || data?.page || 1;
//   const totalPages = data?.totalPages || data?.last_page || 1;

//   // FIXED: Calculate range for display - CORRECTED VERSION
//   const calculateRange = () => {
//     const totalEmployees = displayTotalCount;
//     const currentPageCount = filteredEmployees.length;
    
//     if (totalEmployees === 0 || currentPageCount === 0) {
//       return { start: 0, end: 0 };
//     }
    
//     // Page 1 is simple
//     if (currentPage === 1) {
//       return {
//         start: 1,
//         end: currentPageCount
//       };
//     }
    
//     // For page 2+, calculate the cumulative count
//     // Each previous page had 'pageSize' employees (theoretical maximum)
//     const previousPagesCount = (currentPage - 1) * pageSize;
    
//     let start = previousPagesCount + 1;
//     let end = start + currentPageCount - 1;
    
//     // Ensure we don't exceed total employees
//     if (end > totalEmployees) {
//       end = totalEmployees;
//     }
    
//     // Ensure start makes sense (shouldn't be greater than total)
//     if (start > totalEmployees) {
//       start = Math.max(1, totalEmployees - currentPageCount + 1);
//     }
    
//     return { start, end };
//   };

//   const { start, end } = calculateRange();

//   // Fetch punches with better error handling and cancellation
//   useEffect(() => {
//     if (!filteredEmployees.length) {
//       setLoadingPunches(false);
//       setPunches({});
//       return;
//     }

//     let cancelled = false;

//     async function fetchPunches() {
//       setLoadingPunches(true);
//       const punchesData: Record<string, PunchData> = {};

//       try {
//         // Process employees in batches to avoid overwhelming the API
//         const batchSize = 10;
//         for (let i = 0; i < filteredEmployees.length; i += batchSize) {
//           if (cancelled) break;
          
//           const batch = filteredEmployees.slice(i, i + batchSize);
//           await Promise.all(
//             batch.map(async (emp) => {
//               try {
//                 const res = await fetch("/api/punch/todaypunch", {
//                   method: "POST",
//                   headers: { "Content-Type": "application/json" },
//                   body: JSON.stringify({
//                     biometric_id: emp.biometric_id,
//                     company_id: companyId,
//                     start_date: new Date().toISOString().split("T")[0],
//                     end_date: new Date().toISOString().split("T")[0],
//                     user_id: emp.biometric_id,
//                   }),
//                 });
                
//                 if (res.ok) {
//                   const punchData = await res.json();
//                   punchesData[emp.uniqueKey] = punchData;
//                 } else {
//                   punchesData[emp.uniqueKey] = { 
//                     first_check_in: null, 
//                     last_check_out: null,
//                     multi_mode: false 
//                   };
//                 }
//               } catch (error) {
//                 console.error(`Error fetching punch data for employee ${emp.id}:`, error);
//                 punchesData[emp.uniqueKey] = { 
//                   first_check_in: null, 
//                   last_check_out: null,
//                   multi_mode: false 
//                 };
//               }
//             })
//           );
          
//           // Small delay between batches to avoid rate limiting
//           if (i + batchSize < filteredEmployees.length) {
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
//   }, [filteredEmployees, companyId]);

//   // Generate page numbers like Flipkart
//   const generatePageNumbers = () => {
//     const pages = [];
    
//     // Always show first page
//     pages.push(1);
    
//     // Calculate range around current page
//     let startPage = Math.max(2, currentPage - 1);
//     let endPage = Math.min(totalPages - 1, currentPage + 1);
    
//     // Add ellipsis after first page if needed
//     if (startPage > 2) {
//       pages.push("...");
//     }
    
//     // Add pages around current page
//     for (let i = startPage; i <= endPage; i++) {
//       pages.push(i);
//     }
    
//     // Add ellipsis before last page if needed
//     if (endPage < totalPages - 1) {
//       pages.push("...");
//     }
    
//     // Always show last page if there is more than one page
//     if (totalPages > 1) {
//       pages.push(totalPages);
//     }
    
//     return pages;
//   };

//   // ✅ Clear all filters
//   const clearFilters = () => {
//     setSelectedGroup("all");
//     setSearchQuery("");
//     setPage(1);
//   };

//   // ✅ Check if any filter is active
//   const hasActiveFilters = selectedGroup !== "all" || searchQuery !== "";

//   if (isLoading) return (
//     <div className="flex justify-center items-center py-8">
//       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//       <span className="ml-2">Loading employees...</span>
//     </div>
//   );
  
//   if (isError) return (
//     <div className="text-center py-8 text-red-600">
//       Failed to load employees. Please try again.
//     </div>
//   );

//   const getProfileImageUrl = (emp: User) =>
//     emp.prof_img ? (emp.prof_img.startsWith("http") ? emp.prof_img : `${currentCompany?.mediaBaseUrl}${emp.prof_img}`) : null;

//   const pageNumbers = generatePageNumbers();

//   return (
//     <div>
//       {/* Enhanced Header with Active Users Count */}
//       <div className="mb-6">
//         <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
//           <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
//             Dashboard
//           </Link>
//           <span>/</span>
//           <span className="text-gray-900 font-medium">Employees</span>
//         </div>
        
//         <div className="flex justify-between items-center mb-6">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">All Employees</h1>
//             {/* <p className="text-sm text-gray-600 mt-1">
//               Page {currentPage} of {totalPages} • {displayTotalCount.toLocaleString()} total employees
//               {selectedGroup !== "all" && ` • Filtered by: ${selectedGroup}`}
//             </p> */}
//           </div>
//           <div className="flex items-center gap-3">
//             {/* Filter Toggle Button */}
//             <button
//               onClick={() => setShowFilters(!showFilters)}
//               className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
//                 showFilters || hasActiveFilters
//                   ? "bg-blue-100 text-blue-700 border-blue-300"
//                   : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
//               }`}
//             >
//               <Filter className="h-4 w-4" />
//               Filters
//               {hasActiveFilters && (
//                 <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
//                   !
//                 </span>
//               )}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* ✅ Filter Section */}
//       {showFilters && (
//         <div className="mb-6 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
//           <div className="flex items-center justify-between mb-4">
//             <h3 className="text-lg font-semibold text-gray-900">Filter Employees</h3>
//             <div className="flex items-center gap-2">
//               {hasActiveFilters && (
//                 <button
//                   onClick={clearFilters}
//                   className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
//                 >
//                   <X className="h-3 w-3" />
//                   Clear All
//                 </button>
//               )}
//               <button
//                 onClick={() => setShowFilters(false)}
//                 className="p-1 hover:bg-gray-100 rounded transition-colors"
//               >
//                 <X className="h-4 w-4" />
//               </button>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {/* Search Input */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Search Employees
//               </label>
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//                 <input
//                   type="text"
//                   placeholder="Search by name, email, or ID..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//                 />
//                 {searchQuery && (
//                   <button
//                     onClick={() => setSearchQuery("")}
//                     className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                   >
//                     <X className="h-4 w-4" />
//                   </button>
//                 )}
//               </div>
//               <p className="text-xs text-gray-500 mt-1">
//                 Searches current page only
//               </p>
//             </div>

//             {/* Group Filter */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Filter by Group
//               </label>
//               <select
//                 value={selectedGroup}
//                 onChange={(e) => setSelectedGroup(e.target.value)}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//                 disabled={groupsLoading}
//               >
//                 <option value="all">
//                   {groupsLoading ? "Loading groups..." : `All Groups (${allGroups.length})`}
//                 </option>
//                 {allGroups.map((group) => (
//                   <option key={group} value={group}>
//                     {group}
//                   </option>
//                 ))}
//               </select>
//               <p className="text-xs text-gray-500 mt-1">
//                 Filters employees from all pages
//               </p>
//               {groupsError && (
//                 <p className="text-xs text-red-500 mt-1">
//                   Failed to load groups: {groupsError.message}
//                 </p>
//               )}
//               {!groupsLoading && allGroups.length === 0 && (
//                 <p className="text-xs text-yellow-500 mt-1">
//                   No groups found for this company
//                 </p>
//               )}
//             </div>
//           </div>

//           {/* Active Filters Display */}
//           {hasActiveFilters && (
//             <div className="mt-4 pt-4 border-t border-gray-200">
//               <div className="flex items-center gap-2 flex-wrap">
//                 <span className="text-sm text-gray-600">Active filters:</span>
//                 {selectedGroup !== "all" && (
//                   <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
//                     Group: {selectedGroup}
//                     <button
//                       onClick={() => setSelectedGroup("all")}
//                       className="hover:text-blue-600"
//                     >
//                       <X className="h-3 w-3" />
//                     </button>
//                   </span>
//                 )}
//                 {searchQuery && (
//                   <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
//                     Search: "{searchQuery}"
//                     <button
//                       onClick={() => setSearchQuery("")}
//                       className="hover:text-green-600"
//                     >
//                       <X className="h-3 w-3" />
//                     </button>
//                   </span>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>
//       )}
//       {/* Enhanced Employees Count Card with Active Users */}
//       <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
//         {/* Total Employees Card */}
//         <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
//           <div className="flex items-center justify-between">
//             <div>
//               <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Employees</h3>
//               <p className="text-3xl font-bold text-blue-600">
//                 {countLoading ? (
//                   <span className="text-gray-400">Loading...</span>
//                 ) : (
//                   displayTotalCount.toLocaleString()
//                 )}
//               </p>
//               {hasActiveFilters && (
//                 <p className="text-sm text-gray-500 mt-1">
//                   Showing {filteredEmployees.length} of {employees.length} on this page
//                 </p>
//               )}
//             </div>
//             <div className="p-3 bg-blue-100 rounded-full">
//               <Users className="h-6 w-6 text-blue-600" />
//             </div>
//           </div>
//           <p className="text-sm text-gray-500 mt-2">
//             Page {currentPage} of {totalPages}
//           </p>
//         </div>

//         {/* Active Today Card */}
//         <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
//           <div className="flex items-center justify-between">
//             <div>
//               <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Today</h3>
//               <p className="text-3xl font-bold text-green-600">
//                 {activeUsersLoading ? (
//                   <span className="text-gray-400">Loading...</span>
//                 ) : (
//                   activeUsersData?.total.toLocaleString() || "0"
//                 )}
//               </p>
//             </div>
//             <div className="p-3 bg-green-100 rounded-full">
//               <UserCheck className="h-6 w-6 text-green-600" />
//             </div>
//           </div>
          
//           {/* Gender Breakdown */}
//           {!activeUsersLoading && activeUsersData && (
//             <div className="mt-4 pt-4 border-t border-gray-100">
//               <div className="grid grid-cols-3 gap-2 text-center">
//                 <div>
//                   <p className="text-xs text-gray-500">Male</p>
//                   <p className="text-sm font-semibold text-blue-600">
//                     {activeUsersData.male_count || 0}
//                   </p>
//                 </div>
//                 <div>
//                   <p className="text-xs text-gray-500">Female</p>
//                   <p className="text-sm font-semibold text-pink-600">
//                     {activeUsersData.female_count || 0}
//                   </p>
//                 </div>
//                 <div>
//                   <p className="text-xs text-gray-500">Others</p>
//                   <p className="text-sm font-semibold text-purple-600">
//                     {activeUsersData.others_count || 0}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Groups Summary Card
//         <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
//           <div className="flex items-center justify-between">
//             <div>
//               <h3 className="text-lg font-semibold text-gray-900 mb-2">Employee Groups</h3>
//               <p className="text-3xl font-bold text-purple-600">
//                 {groupsLoading ? (
//                   <span className="text-gray-400">...</span>
//                 ) : (
//                   allGroups.length
//                 )}
//               </p>
//               <p className="text-sm text-gray-500 mt-1">
//                 Available groups in company
//               </p>
//             </div>
//             <div className="p-3 bg-purple-100 rounded-full">
//               <Filter className="h-6 w-6 text-purple-600" />
//             </div>
//           </div>
//           {!groupsLoading && allGroups.length > 0 && (
//             <div className="mt-3 pt-3 border-t border-gray-100">
//               <p className="text-xs text-gray-500 mb-2">Sample groups:</p>
//               <div className="flex flex-wrap gap-1">
//                 {allGroups.slice(0, 3).map(group => (
//                   <span key={group} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
//                     {group}
//                   </span>
//                 ))}
//                 {allGroups.length > 3 && (
//                   <span className="text-xs text-gray-500">
//                     +{allGroups.length - 3} more
//                   </span>
//                 )}
//               </div>
//             </div>
//           )}
//           {groupsError && (
//             <div className="mt-3 pt-3 border-t border-gray-100">
//               <p className="text-xs text-red-500">
//                 Error loading groups
//               </p>
//             </div>
//           )}
//         </div> */}
//       </div>

//       {loadingPunches && (
//         <div className="flex justify-center items-center py-4">
//           <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
//           <span className="ml-2 text-sm text-gray-500">Loading punch data...</span>
//         </div>
//       )}

//       {filteredEmployees.length === 0 ? (
//         <div className="text-center py-8 text-gray-500">
//           {employees.length === 0 ? (
//             "No employees found for this company."
//           ) : (
//             <div>
//               <p className="text-lg mb-2">No employees match your filters</p>
//               <button
//                 onClick={clearFilters}
//                 className="text-blue-600 hover:text-blue-800 underline"
//               >
//                 Clear all filters
//               </button>
//             </div>
//           )}
//         </div>
//       ) : (
//         <>
//           <ul className="space-y-3">
//             {filteredEmployees.map((emp) => {
//               const profileUrl = getProfileImageUrl(emp);
//               const initials = `${emp.first_name?.[0] || ""}${emp.last_name?.[0] || ""}`;
//               const punch = punches[emp.uniqueKey];
//               const checkInTime = extractTime(punch?.first_check_in);
//               const checkOutTime = extractTime(punch?.last_check_out);
//               const multiMode = punch?.multi_mode || false;
//               const sessions = punch?.punch_sessions || [];
//               const totalSessions = punch?.total_sessions || 0;

//               return (
//                 <li
//                   key={emp.uniqueKey}
//                   className="border border-gray-200 p-4 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
//                 >
//                   <Link
//                     href={`/dashboard/employees/${emp.id}`}
//                     className="block"
//                   >
//                     <div className="flex items-center justify-between">
//                       {/* Left Section - Profile and Employee Details */}
//                       <div className="flex items-center gap-4 flex-1">
//                         {/* Profile */}
//                         <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center flex-shrink-0">
//                           {profileUrl ? (
//                             <Image
//                               src={profileUrl}
//                               alt={`${emp.first_name} ${emp.last_name}`}
//                               width={56}
//                               height={56}
//                               className="object-cover h-14 w-14"
//                               onError={(e) => {
//                                 const target = e.target as HTMLImageElement;
//                                 target.style.display = "none";
//                               }}
//                             />
//                           ) : (
//                             <div className="flex items-center justify-center h-14 w-14 rounded-full bg-blue-100 text-blue-700 font-bold text-lg">
//                               {initials}
//                             </div>
//                           )}
//                         </div>

//                         {/* Employee Details */}
//                         <div className="flex flex-col min-w-0">
//                           <p className="font-semibold text-gray-900 truncate">
//                             {emp.first_name} {emp.last_name}
//                           </p>
//                           <p className="text-sm text-gray-500 truncate">{emp.email}</p>
//                           <div className="flex flex-wrap gap-2 mt-1">
//                             {emp.group && (
//                               <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
//                                 {emp.group}
//                               </span>
//                             )}
//                             {emp.is_wfh !== undefined && (
//                               <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
//                                 {emp.is_wfh ? "WFH" : "Office"}
//                               </span>
//                             )}
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

//                       {/* Right Section - Average Work Hours */}
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

//           {/* Enhanced Pagination like Flipkart */}
//           {totalPages > 1 && (
//             <div className="flex justify-center items-center mt-8 space-x-2">
//               {/* Previous Button */}
//               <button
//                 onClick={() => setPage((p) => Math.max(p - 1, 1))}
//                 disabled={currentPage === 1}
//                 className="flex items-center justify-center h-10 w-10 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//               >
//                 <ChevronLeft className="h-4 w-4" />
//               </button>

//               {/* Page Numbers */}
//               {pageNumbers.map((pageNum, index) => (
//                 <button
//                   key={index}
//                   onClick={() => typeof pageNum === "number" && setPage(pageNum)}
//                   disabled={pageNum === "..."}
//                   className={`flex items-center justify-center h-10 w-10 rounded-lg border transition-colors ${
//                     pageNum === currentPage
//                       ? "bg-blue-600 text-white border-blue-600"
//                       : pageNum === "..."
//                       ? "border-transparent cursor-default"
//                       : "border-gray-300 hover:bg-gray-50 text-gray-700"
//                   }`}
//                 >
//                   {pageNum}
//                 </button>
//               ))}

//               {/* Next Button */}
//               <button
//                 onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
//                 disabled={currentPage === totalPages}
//                 className="flex items-center justify-center h-10 w-10 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//               >
//                 <ChevronRight className="h-4 w-4" />
//               </button>
//             </div>
//           )}
          
//           {/* Page Info - Fixed display */}
//           <div className="text-center mt-4 text-sm text-gray-500">
//             Page {currentPage} of {totalPages} • 
//             {displayTotalCount > 0 ? (
//               <> Showing {start}-{end} of {displayTotalCount.toLocaleString()} employees</>
//             ) : (
//               <> Showing {currentPageEmployeesCount} employees</>
//             )}
//             {hasActiveFilters && (
//               <span className="ml-2 text-blue-600">
//                 (Filtered from {employees.length} on this page)
//               </span>
//             )}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// export default function EmployeesPage() {
//   const { company } = useAuth();

//   if (!company) return <p>No company selected</p>;

//   return <EmployeesList companyId={company.id} />;
// }


// "use client";

// import { useState, useEffect, useMemo } from "react";
// import { useAuth } from "@/context/AuthContext";
// import { User } from "@/context/AuthContext";
// import { useEmployees } from "@/hooks/employees/useGetEmployees";
// import { useCompany } from "@/context/CompanyContext";
// import Link from "next/link";
// import Image from "next/image";
// import { useEmployeeCount } from "@/hooks/employees/useEmployeeCount";
// import { useActiveUsersCount } from "@/hooks/active-users/useActiveUsersCount";
// import { ArrowUpCircle, ArrowDownCircle, ChevronLeft, ChevronRight, MoreHorizontal, Users, UserCheck } from "lucide-react";

// // Define PunchData interface with multiple sessions
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

// // Employee data with unique identifier
// interface EmployeeWithKey extends User {
//   uniqueKey: string; // Composite key to prevent duplicates
// }

// // Extract HH:mm from timestamp
// function extractTime(dateStr: string | null): string {
//   if (!dateStr) return "--";
//   if (dateStr.includes("T")) return dateStr.split("T")[1]?.slice(0, 5) || "--";
//   return dateStr;
// }

// // Calculate current work hours based on check-in time and current time
// function calculateCurrentWorkHours(checkIn: string | null): string {
//   if (!checkIn || checkIn === "--") return "--";
  
//   try {
//     const now = new Date();
//     const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
//     const [inHours, inMinutes] = checkIn.split(":").map(Number);
//     const [currentHours, currentMinutes] = currentTime.split(":").map(Number);
    
//     let totalMinutes = (currentHours * 60 + currentMinutes) - (inHours * 60 + inMinutes);
    
//     // Handle overnight shifts
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

// // Calculate work hours between two times (for completed sessions)
// function calculateCompletedWorkHours(checkIn: string | null, checkOut: string | null): string {
//   if (!checkIn || !checkOut || checkIn === "--" || checkOut === "--") return "--";
  
//   try {
//     const [inHours, inMinutes] = checkIn.split(":").map(Number);
//     const [outHours, outMinutes] = checkOut.split(":").map(Number);
    
//     let totalMinutes = (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes);
    
//     // Handle overnight shifts
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

// // Calculate total hours from multiple sessions
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
        
//         // Handle overnight shifts
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

// // Circular Progress Component
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

// // Punch Sessions Display Component
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

// function EmployeesList({ companyId }: { companyId: number }) {
//   const [page, setPage] = useState(1);
//   const pageSize = 50;
//   const { data, isLoading, isError } = useEmployees(companyId, page, pageSize);
//   const { count: totalCompanyEmployees, isLoading: countLoading } = useEmployeeCount(companyId);
//   const { currentCompany } = useCompany();
//   const [punches, setPunches] = useState<Record<string, PunchData>>({});
//   const [loadingPunches, setLoadingPunches] = useState(true);
//   const [currentTime, setCurrentTime] = useState(new Date());

//   // ✅ Use the active users count hook
//   const { data: activeUsersData, isLoading: activeUsersLoading } = useActiveUsersCount(companyId);

//   // Update current time every minute for real-time work hours
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setCurrentTime(new Date());
//     }, 60000);
//     return () => clearInterval(interval);
//   }, []);

//   // FIXED: Proper employee data processing with deduplication
//   const employees: EmployeeWithKey[] = useMemo(() => {
//     if (!data) return [];
    
//     let rawEmployees: User[] = [];
    
//     // Handle different API response structures
//     if (Array.isArray(data)) {
//       rawEmployees = data;
//     } else if (Array.isArray(data?.employees)) {
//       rawEmployees = data.employees;
//     } else if (Array.isArray(data?.results)) {
//       rawEmployees = data.results;
//     } else if (Array.isArray(data?.data)) {
//       rawEmployees = data.data;
//     }
    
//     // Deduplicate employees using multiple identifiers
//     const uniqueEmployees = new Map<string, EmployeeWithKey>();
    
//     rawEmployees.forEach((emp) => {
//       if (!emp || !emp.id) return;
      
//       const uniqueKey = `${emp.id}-${emp.biometric_id || ''}-${emp.employee_id || ''}`;
      
//       if (!uniqueEmployees.has(uniqueKey)) {
//         uniqueEmployees.set(uniqueKey, {
//           ...emp,
//           uniqueKey
//         });
//       }
//     });
    
//     return Array.from(uniqueEmployees.values());
//   }, [data]);

//   // SIMPLIFIED: Get total count - let's debug what's actually in the response
//   const displayTotalCount = useMemo(() => {
//     console.log('🔍 Debug count data:', { 
//       totalCompanyEmployees, 
//       mainAPITotal: data?.totalCount,
//       mainAPITotalEmployees: data?.totalEmployees,
//       employeesLength: employees.length 
//     });

//     // Priority 1: Use count from dedicated API if available and valid
//     if (typeof totalCompanyEmployees === 'number' && totalCompanyEmployees > 0) {
//       return totalCompanyEmployees;
//     }
    
//     // Priority 2: Use totalEmployees from main employees API
//     if (data && typeof data.totalEmployees === 'number' && data.totalEmployees > 0) {
//       return data.totalEmployees;
//     }
    
//     // Priority 3: Use totalCount from main employees API
//     if (data && typeof data.totalCount === 'number' && data.totalCount > 0) {
//       return data.totalCount;
//     }
    
//     // Priority 4: Final fallback - use actual employee count
//     return employees.length || 0;
//   }, [data, totalCompanyEmployees, employees.length]);

//   // Calculate active users percentage
//   const activeUsersPercentage = useMemo(() => {
//     if (!activeUsersData?.total || !displayTotalCount || displayTotalCount === 0) return 0;
//     return (activeUsersData.total / displayTotalCount) * 100;
//   }, [activeUsersData?.total, displayTotalCount]);

//   const currentPageEmployeesCount = employees.length;
//   const currentPage = data?.currentPage || data?.page || 1;
//   const totalPages = data?.totalPages || data?.last_page || 1;

//   // FIXED: Calculate range for display - CORRECTED VERSION
//   const calculateRange = () => {
//     const totalEmployees = displayTotalCount;
//     const currentPageCount = employees.length;
    
//     if (totalEmployees === 0 || currentPageCount === 0) {
//       return { start: 0, end: 0 };
//     }
    
//     // Page 1 is simple
//     if (currentPage === 1) {
//       return {
//         start: 1,
//         end: currentPageCount
//       };
//     }
    
//     // For page 2+, calculate the cumulative count
//     // Each previous page had 'pageSize' employees (theoretical maximum)
//     const previousPagesCount = (currentPage - 1) * pageSize;
    
//     let start = previousPagesCount + 1;
//     let end = start + currentPageCount - 1;
    
//     // Ensure we don't exceed total employees
//     if (end > totalEmployees) {
//       end = totalEmployees;
//     }
    
//     // Ensure start makes sense (shouldn't be greater than total)
//     if (start > totalEmployees) {
//       start = Math.max(1, totalEmployees - currentPageCount + 1);
//     }
    
//     console.log('🔢 Corrected Range:', {
//       currentPage,
//       totalEmployees,
//       currentPageCount,
//       calculatedStart: start,
//       calculatedEnd: end
//     });
    
//     return { start, end };
//   };

//   // ✅ ADD THIS LINE - ACTUALLY CALL THE FUNCTION
//   const { start, end } = calculateRange();

//   // Fetch punches with better error handling and cancellation
//   useEffect(() => {
//     if (!employees.length) {
//       setLoadingPunches(false);
//       setPunches({});
//       return;
//     }

//     let cancelled = false;

//     async function fetchPunches() {
//       setLoadingPunches(true);
//       const punchesData: Record<string, PunchData> = {};

//       try {
//         // Process employees in batches to avoid overwhelming the API
//         const batchSize = 10;
//         for (let i = 0; i < employees.length; i += batchSize) {
//           if (cancelled) break;
          
//           const batch = employees.slice(i, i + batchSize);
//           await Promise.all(
//             batch.map(async (emp) => {
//               try {
//                 const res = await fetch("/api/punch/todaypunch", {
//                   method: "POST",
//                   headers: { "Content-Type": "application/json" },
//                   body: JSON.stringify({
//                     biometric_id: emp.biometric_id,
//                     company_id: companyId,
//                     start_date: new Date().toISOString().split("T")[0],
//                     end_date: new Date().toISOString().split("T")[0],
//                     user_id: emp.biometric_id,
//                   }),
//                 });
                
//                 if (res.ok) {
//                   const punchData = await res.json();
//                   punchesData[emp.uniqueKey] = punchData;
//                 } else {
//                   punchesData[emp.uniqueKey] = { 
//                     first_check_in: null, 
//                     last_check_out: null,
//                     multi_mode: false 
//                   };
//                 }
//               } catch (error) {
//                 console.error(`Error fetching punch data for employee ${emp.id}:`, error);
//                 punchesData[emp.uniqueKey] = { 
//                   first_check_in: null, 
//                   last_check_out: null,
//                   multi_mode: false 
//                 };
//               }
//             })
//           );
          
//           // Small delay between batches to avoid rate limiting
//           if (i + batchSize < employees.length) {
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
//   }, [employees, companyId]);

//   // Generate page numbers like Flipkart
//   const generatePageNumbers = () => {
//     const pages = [];
    
//     // Always show first page
//     pages.push(1);
    
//     // Calculate range around current page
//     let startPage = Math.max(2, currentPage - 1);
//     let endPage = Math.min(totalPages - 1, currentPage + 1);
    
//     // Add ellipsis after first page if needed
//     if (startPage > 2) {
//       pages.push("...");
//     }
    
//     // Add pages around current page
//     for (let i = startPage; i <= endPage; i++) {
//       pages.push(i);
//     }
    
//     // Add ellipsis before last page if needed
//     if (endPage < totalPages - 1) {
//       pages.push("...");
//     }
    
//     // Always show last page if there is more than one page
//     if (totalPages > 1) {
//       pages.push(totalPages);
//     }
    
//     return pages;
//   };

//   if (isLoading) return (
//     <div className="flex justify-center items-center py-8">
//       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//       <span className="ml-2">Loading employees...</span>
//     </div>
//   );
  
//   if (isError) return (
//     <div className="text-center py-8 text-red-600">
//       Failed to load employees. Please try again.
//     </div>
//   );

//   const getProfileImageUrl = (emp: User) =>
//     emp.prof_img ? (emp.prof_img.startsWith("http") ? emp.prof_img : `${currentCompany?.mediaBaseUrl}${emp.prof_img}`) : null;

//   const pageNumbers = generatePageNumbers();

//   return (
//     <div>
//       {/* Enhanced Header with Active Users Count */}
//       <div className="mb-6">
//         <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
//           <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
//             Dashboard
//           </Link>
//           <span>/</span>
//           <span className="text-gray-900 font-medium">Employees</span>
//         </div>
        
//         <div className="flex justify-between items-center mb-6">
//           <h1 className="text-2xl font-bold text-gray-900">All Employees</h1>
//           {/* <Link
//             href="/dashboard/employees/active-users"
//             className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
//           >
//             <UserCheck className="h-4 w-4" />
//             View Active Today
//           </Link> */}
//         </div>
//       </div>

//       {/* Enhanced Employees Count Card with Active Users */}
//       <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
//         {/* Total Employees Card */}
//         <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
//           <div className="flex items-center justify-between">
//             <div>
//               <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Employees</h3>
//               <p className="text-3xl font-bold text-blue-600">
//                 {countLoading ? (
//                   <span className="text-gray-400">Loading...</span>
//                 ) : (
//                   displayTotalCount.toLocaleString()
//                 )}
//               </p>
//             </div>
//             <div className="p-3 bg-blue-100 rounded-full">
//               <Users className="h-6 w-6 text-blue-600" />
//             </div>
//           </div>
//           <p className="text-sm text-gray-500 mt-2">
//             All registered employees in the system
//           </p>
//         </div>

//         {/* Active Today Card */}
//         <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
//           <div className="flex items-center justify-between">
//             <div>
//               <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Today</h3>
//               <p className="text-3xl font-bold text-green-600">
//                 {activeUsersLoading ? (
//                   <span className="text-gray-400">Loading...</span>
//                 ) : (
//                   activeUsersData?.total.toLocaleString() || "0"
//                 )}
//               </p>
//               {/* {!activeUsersLoading && activeUsersData?.total !== undefined && (
//                 <p className="text-sm text-gray-500 mt-1">
//                   {activeUsersPercentage.toFixed(1)}% of total employees
//                 </p>
//               )} */}
//             </div>
//             <div className="p-3 bg-green-100 rounded-full">
//               <UserCheck className="h-6 w-6 text-green-600" />
//             </div>
//           </div>
          
//           {/* Gender Breakdown */}
//           {!activeUsersLoading && activeUsersData && (
//             <div className="mt-4 pt-4 border-t border-gray-100">
//               <div className="grid grid-cols-3 gap-2 text-center">
//                 <div>
//                   <p className="text-xs text-gray-500">Male</p>
//                   <p className="text-sm font-semibold text-blue-600">
//                     {activeUsersData.male_count || 0}
//                   </p>
//                 </div>
//                 <div>
//                   <p className="text-xs text-gray-500">Female</p>
//                   <p className="text-sm font-semibold text-pink-600">
//                     {activeUsersData.female_count || 0}
//                   </p>
//                 </div>
//                 <div>
//                   <p className="text-xs text-gray-500">Others</p>
//                   <p className="text-sm font-semibold text-purple-600">
//                     {activeUsersData.others_count || 0}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {loadingPunches && (
//         <div className="flex justify-center items-center py-4">
//           <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
//           <span className="ml-2 text-sm text-gray-500">Loading punch data...</span>
//         </div>
//       )}

//       {employees.length === 0 ? (
//         <div className="text-center py-8 text-gray-500">
//           No employees found for this company.
//         </div>
//       ) : (
//         <>
//           <ul className="space-y-3">
//             {employees.map((emp) => {
//               const profileUrl = getProfileImageUrl(emp);
//               const initials = `${emp.first_name?.[0] || ""}${emp.last_name?.[0] || ""}`;
//               const punch = punches[emp.uniqueKey];
//               const checkInTime = extractTime(punch?.first_check_in);
//               const checkOutTime = extractTime(punch?.last_check_out);
//               const multiMode = punch?.multi_mode || false;
//               const sessions = punch?.punch_sessions || [];
//               const totalSessions = punch?.total_sessions || 0;

//               return (
//                 <li
//                   key={emp.uniqueKey}
//                   className="border border-gray-200 p-4 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
//                 >
//                   <Link
//                     href={`/dashboard/employees/${emp.id}`}
//                     className="block"
//                   >
//                     <div className="flex items-center justify-between">
//                       {/* Left Section - Profile and Employee Details */}
//                       <div className="flex items-center gap-4 flex-1">
//                         {/* Profile */}
//                         <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center flex-shrink-0">
//                           {profileUrl ? (
//                             <Image
//                               src={profileUrl}
//                               alt={`${emp.first_name} ${emp.last_name}`}
//                               width={56}
//                               height={56}
//                               className="object-cover h-14 w-14"
//                               onError={(e) => {
//                                 const target = e.target as HTMLImageElement;
//                                 target.style.display = "none";
//                               }}
//                             />
//                           ) : (
//                             <div className="flex items-center justify-center h-14 w-14 rounded-full bg-blue-100 text-blue-700 font-bold text-lg">
//                               {initials}
//                             </div>
//                           )}
//                         </div>

//                         {/* Employee Details */}
//                         <div className="flex flex-col min-w-0">
//                           <p className="font-semibold text-gray-900 truncate">
//                             {emp.first_name} {emp.last_name}
//                           </p>
//                           <p className="text-sm text-gray-500 truncate">{emp.email}</p>
//                           <div className="flex flex-wrap gap-2 mt-1">
//                             {emp.group && (
//                               <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
//                                 {emp.group}
//                               </span>
//                             )}
//                             {emp.is_wfh !== undefined && (
//                               <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
//                                 {emp.is_wfh ? "WFH" : "Office"}
//                               </span>
//                             )}
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

//                       {/* Right Section - Average Work Hours */}
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

//           {/* Enhanced Pagination like Flipkart */}
//           {totalPages > 1 && (
//             <div className="flex justify-center items-center mt-8 space-x-2">
//               {/* Previous Button */}
//               <button
//                 onClick={() => setPage((p) => Math.max(p - 1, 1))}
//                 disabled={currentPage === 1}
//                 className="flex items-center justify-center h-10 w-10 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//               >
//                 <ChevronLeft className="h-4 w-4" />
//               </button>

//               {/* Page Numbers */}
//               {pageNumbers.map((pageNum, index) => (
//                 <button
//                   key={index}
//                   onClick={() => typeof pageNum === "number" && setPage(pageNum)}
//                   disabled={pageNum === "..."}
//                   className={`flex items-center justify-center h-10 w-10 rounded-lg border transition-colors ${
//                     pageNum === currentPage
//                       ? "bg-blue-600 text-white border-blue-600"
//                       : pageNum === "..."
//                       ? "border-transparent cursor-default"
//                       : "border-gray-300 hover:bg-gray-50 text-gray-700"
//                   }`}
//                 >
//                   {pageNum}
//                 </button>
//               ))}

//               {/* Next Button */}
//               <button
//                 onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
//                 disabled={currentPage === totalPages}
//                 className="flex items-center justify-center h-10 w-10 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//               >
//                 <ChevronRight className="h-4 w-4" />
//               </button>
//             </div>
//           )}
          
//           {/* Page Info - Fixed display */}
//           <div className="text-center mt-4 text-sm text-gray-500">
//             Page {currentPage} of {totalPages} • 
//             {displayTotalCount > 0 ? (
//               <> Showing {start}-{end} of {displayTotalCount.toLocaleString()} employees</>
//             ) : (
//               <> Showing {currentPageEmployeesCount} employees</>
//             )}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// export default function EmployeesPage() {
//   const { company } = useAuth();

//   if (!company) return <p>No company selected</p>;

//   return <EmployeesList companyId={company.id} />;
// }



/*"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/context/AuthContext";
import { useEmployees } from "@/hooks/employees/useGetEmployees";
import { useCompany } from "@/context/CompanyContext";
import Link from "next/link";
import Image from "next/image";

interface PunchData {
  first_check_in: string | null;
  last_check_out: string | null;
}

// Function to extract and convert time to IST
function getISTTime(dateStr: string | null) {
  if (!dateStr) return "--";
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "--";
    
    return date.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch (error) {
    return "--";
  }
}

// Hook for paginated punch data
function usePaginatedPunchData(employees: User[], companyId: number, currentPageEmployees: User[]) {
  const [punches, setPunches] = useState<Record<number, PunchData>>({});
  const [loadingPunches, setLoadingPunches] = useState(false);

  // Load punch data only for current page employees
  useEffect(() => {
    if (!currentPageEmployees || currentPageEmployees.length === 0) {
      return;
    }

    async function fetchPunchData() {
      setLoadingPunches(true);
      const punchesData: Record<number, PunchData> = {};

      try {
        // Only fetch for current page employees
        const promises = currentPageEmployees.map(async (emp) => {
          try {
            const res = await fetch("/api/punch/todaypunch", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                biometric_id: emp.biometric_id,
                company_id: companyId,
                start_date: new Date().toISOString().split("T")[0],
                end_date: new Date().toISOString().split("T")[0],
                user_id: emp.biometric_id,
              }),
            });

            if (res.ok) {
              const punchData = await res.json();
              punchesData[emp.id] = {
                first_check_in: punchData.first_check_in,
                last_check_out: punchData.last_check_out,
              };
            }
          } catch (err) {
            console.error(`Error fetching punch for ${emp.id}`, err);
          }
        });

        await Promise.all(promises);
        setPunches(prev => ({ ...prev, ...punchesData }));
      } catch (error) {
        console.error("Error fetching punch data:", error);
      } finally {
        setLoadingPunches(false);
      }
    }

    fetchPunchData();
  }, [currentPageEmployees, companyId]);

  return { punches, loadingPunches };
}

function EmployeesList({ companyId }: { companyId: number }) {
  const {
    employees, // All loaded employees
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    loadMoreRef,
  } = useEmployees(companyId, 20); // Load 20 employees per page

  const { currentCompany } = useCompany();
  
  // Track which page's punch data we've loaded
  const [loadedPunchPages, setLoadedPunchPages] = useState<Set<number>>(new Set([1]));
  const [currentPunchPage, setCurrentPunchPage] = useState(1);
  
  // Calculate employees for current punch page
  const employeesPerPunchPage = 20;
  const startIndex = (currentPunchPage - 1) * employeesPerPunchPage;
  const endIndex = startIndex + employeesPerPunchPage;
  const currentPageEmployees = employees.slice(startIndex, endIndex);

  const { punches, loadingPunches } = usePaginatedPunchData(
    employees, 
    companyId, 
    currentPageEmployees
  );

  // Load punch data when page changes
  useEffect(() => {
    if (!loadedPunchPages.has(currentPunchPage) && currentPageEmployees.length > 0) {
      setLoadedPunchPages(prev => new Set(prev).add(currentPunchPage));
    }
  }, [currentPunchPage, currentPageEmployees, loadedPunchPages]);

  // Calculate pagination info
  const totalPunchPages = Math.ceil(employees.length / employeesPerPunchPage);

  if (isLoading) return <p className="text-center py-4">Loading employees...</p>;
  if (isError) return <p className="text-center py-4 text-red-500">Failed to load employees</p>;

  const getProfileImageUrl = (emp: User) => {
    if (emp.prof_img) {
      return emp.prof_img.startsWith("http")
        ? emp.prof_img
        : `${currentCompany?.mediaBaseUrl}${emp.prof_img}`;
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Header with pagination info }
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing {currentPageEmployees.length} of {employees.length} employees
          {isFetchingNextPage && " (loading more...)"}
        </div>
        
        {/* Punch Data Pagination Controls }
        {totalPunchPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPunchPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPunchPage === 1}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              ← Prev
            </button>
            
            <span className="text-sm text-gray-600">
              Page {currentPunchPage} of {totalPunchPages}
            </span>
            
            <button
              onClick={() => setCurrentPunchPage(prev => Math.min(prev + 1, totalPunchPages))}
              disabled={currentPunchPage === totalPunchPages}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Loading indicator for punch data }
      {loadingPunches && (
        <div className="text-center text-sm text-blue-600 bg-blue-50 py-2 rounded">
          Loading attendance data...
        </div>
      )}

      {/* Employees List }
      <ul className="space-y-2">
        {currentPageEmployees.map((emp: User) => {
          const profileUrl = getProfileImageUrl(emp);
          const initials = `${emp.first_name?.[0] || ""}${emp.last_name?.[0] || ""}`;
          const punch = punches[emp.id];

          return (
            <li
              key={emp.id}
              className="border p-3 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Link
                href={`/dashboard/employees/${emp.id}`}
                className="flex items-center gap-4"
                prefetch={true}
              >
                {/* Profile Image }
                <div className="h-12 w-12 rounded-full overflow-hidden border bg-gray-100 flex items-center justify-center flex-shrink-0">
                  {profileUrl ? (
                    <Image
                      src={profileUrl}
                      alt={`${emp.first_name} ${emp.last_name}`}
                      width={48}
                      height={48}
                      className="object-cover h-12 w-12"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-700 font-bold">
                      {initials}
                    </div>
                  )}
                </div>

                {/* Employee Details }
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {emp.first_name} {emp.last_name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">{emp.email}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-1">
                    {emp.group && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {emp.group}
                      </span>
                    )}
                    {emp.is_wfh !== undefined && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {emp.is_wfh ? "WFH" : "Office"}
                      </span>
                    )}
                  </div>

                  {/* Punch Times }
                  <div className="flex gap-4 mt-2 text-sm">
                    <div className="text-gray-600">
                      <span className="font-medium">In:</span> {getISTTime(punch?.first_check_in)}
                    </div>
                    <div className="text-gray-600">
                      <span className="font-medium">Out:</span> {getISTTime(punch?.last_check_out)}
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Infinite Scroll Load More }
      {hasNextPage && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {isFetchingNextPage ? (
            <div className="flex items-center gap-2 text-gray-600">
              <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              Loading more employees...
            </div>
          ) : (
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
              Load More Employees
            </button>
          )}
        </div>
      )}

      {/* No more employees to load }
      {!hasNextPage && employees.length > 0 && (
        <div className="text-center py-4 text-gray-500 border-t">
          All {employees.length} employees loaded
        </div>
      )}
    </div>
  );
}

export default function EmployeesPage() {
  const { company } = useAuth();

  if (!company) {
    return <p className="text-center py-8">No company selected</p>;
  }

  return <EmployeesList companyId={company.id} />;
}


*/

/*
"use client";

import { useAuth } from "@/context/AuthContext";
import { User } from "@/context/AuthContext";
import { useEmployees } from "@/hooks/employees/useGetEmployees";
import Link from "next/link";
import { useCompany } from "@/context/CompanyContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";

function EmployeesList({ companyId }: { companyId: number }) {
  const { data, isLoading, isError } = useEmployees(companyId);
  const { currentCompany } = useCompany();

  if (isLoading) return <p>Loading employees...</p>;
  if (isError) return <p>Failed to load employees</p>;

   const employees = Array.isArray(data?.users) ? data.users : [];

  const getProfileImageUrl = (emp: User) => {
    if (emp.prof_img) {
      return emp.prof_img.startsWith("http")
        ? emp.prof_img
        : `${currentCompany?.mediaBaseUrl}${emp.prof_img}`;
    }
    return `${currentCompany?.mediaBaseUrl}/media/default_profile.png`;
  };

  return (
    <ul className="space-y-2">
      {data?.map((emp: User, index: number) => {
        const showInitials = !emp.prof_img;
        return (
          <Link href={`/dashboard/employees/${emp.id}`} key={`${emp.id}-${index}`}>
            <li className="border p-2 rounded-md cursor-pointer hover:bg-gray-100 flex items-center gap-3">
              {/* Profile Avatar }
              <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                {showInitials ? (
                  <AvatarFallback className="text-lg font-bold bg-blue-100 text-blue-700 flex items-center justify-center">
                    {emp.first_name?.[0]}
                    {emp.last_name?.[0]}
                  </AvatarFallback>
                ) : (
                  <div className="relative h-12 w-12 rounded-full overflow-hidden">
                    <Image
                      src={getProfileImageUrl(emp)}
                      alt={`${emp.first_name} ${emp.last_name}`}
                      fill
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
              </Avatar>

              {/* Employee info }
              <div className="flex-1">
                <p className="font-medium">{emp.first_name} {emp.last_name}</p>
                <p className="text-sm text-gray-500">{emp.email}</p>
                {emp.group && (
                  <p className="text-sm text-gray-400">{emp.group}</p>
                )}
                {emp.is_wfh !== undefined && (
                  <p className="text-sm text-gray-400">
                    {emp.is_wfh ? "WFH" : "Office"}
                  </p>
                )}
              </div>
            </li>
          </Link>
        );
      })}
    </ul>
  );
}

export default function EmployeesPage() {
  const { company } = useAuth();

  if (!company) {
    return <p>No company selected</p>;
  }

  return <EmployeesList companyId={company.id} />;
}
*/






/*"use client"

import { useAuth } from "@/context/AuthContext";
import { User } from "@/context/AuthContext"
import { useEmployees } from "@/hooks/employees/useGetEmployees"
import Link from "next/link";

function EmployeesList({ companyId }: { companyId: number }) {
  const { data, isLoading, isError } = useEmployees(companyId)

  if (isLoading) return <p>Loading employees...</p>
  if (isError) return <p>Failed to load employees</p>

  

  return (
    <ul className="space-y-2">
      {data?.map((emp: User, index: number) => (
        <Link href={`/dashboard/employees/${emp.id}`} key={`${emp.id}-${index}`}>
          <li className="border p-2 rounded-md cursor-pointer hover:bg-gray-100">
            <p className="font-medium">{emp.first_name} {emp.last_name}</p>
            <p className="text-sm text-gray-500">{emp.email}</p>
                            {emp.group && (
                  <p className="text-sm text-gray-400">
                   {emp.group}
                  </p>
                )}  
                  {emp.is_wfh !== undefined && (
                    <p className="text-sm text-gray-400">
                      {emp.is_wfh ? "WFH" : "Office"}
                    </p>
                )}
          </li>
        </Link>
      ))}
    </ul>
  )
}

export default function EmployeesPage() {
  const { company } = useAuth();

  if (!company) {
    return <p>No company selected</p>;
  }

  return <EmployeesList companyId={company.id} />;
}*/
/*"use client"

import { useAuth } from "@/context/AuthContext";
import { User } from "@/context/AuthContext"
import { useEmployees } from "@/hooks/employees/useGetEmployees"
import Link from "next/link"
import { useState, useEffect } from "react"

function EmployeesList({ companyId }: { companyId: number }) {
  const { data, isLoading, isError } = useEmployees(companyId)

  if (isLoading) return <p>Loading employees...</p>
  if (isError) return <p>Failed to load employees</p>

  return (
    <ul className="space-y-2">
      {data?.map((emp: User) => (
        <Link href={`/dashboard/employees/${emp.id}`} key={emp.id}>
          <li className="border p-2 rounded-md cursor-pointer hover:bg-gray-100">
            <p className="font-medium">{emp.first_name} {emp.last_name}</p>
            <p className="text-sm text-gray-500">{emp.email}</p>
          </li>
        </Link>
      ))}
    </ul>
  )
}

export default function EmployeesPage() {
  const { company } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Render nothing on server, show loading initially
  if (!mounted) return null
  if (!company) return <p>No company selected</p>

  return <EmployeesList companyId={company.id} />
}

*/