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
  Clock,
  Search,
  RefreshCw,
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// Import our new hooks
import { useEmployeeCache } from "@/hooks/useEmployeeCache";
import { useEmployeePrefetch } from "@/hooks/useEmployeePrefetch";

// import BulkDownloadButton from '@/components/BulkDownloadButton';
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

function calculateCompletedWorkHours(
  checkIn: string | null,
  checkOut: string | null,
): string {
  if (!checkIn || !checkOut || checkIn === "--" || checkOut === "--")
    return "--";

  try {
    const [inHours, inMinutes] = checkIn.split(":").map(Number);
    const [outHours, outMinutes] = checkOut.split(":").map(Number);

    // Calculate total minutes
    let totalMinutes = outHours * 60 + outMinutes - (inHours * 60 + inMinutes);

    // Handle negative (overnight shift)
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60;
    }

    // Calculate hours with decimal
    const hoursDecimal = totalMinutes / 60;

    // Format to 2 decimal places
    return hoursDecimal.toFixed(2);
  } catch {
    return "--";
  }
}

function calculateCurrentWorkHours(checkIn: string | null): string {
  if (!checkIn || checkIn === "--") return "--";

  try {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    const [inHours, inMinutes] = checkIn.split(":").map(Number);

    // Calculate total minutes
    let totalMinutes =
      currentHours * 60 + currentMinutes - (inHours * 60 + inMinutes);

    // Handle negative (overnight shift)
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60;
    }

    // Calculate hours with decimal
    const hoursDecimal = totalMinutes / 60;

    // Format to 2 decimal places
    return hoursDecimal.toFixed(2);
  } catch {
    return "--";
  }
}

function calculateTotalHours(sessions: PunchSession[]): string {
  if (!sessions || sessions.length === 0) return "--";

  let totalMinutes = 0;

  sessions.forEach((session) => {
    if (session.check_in && session.check_out) {
      const checkInTime = extractTime(session.check_in);
      const checkOutTime = extractTime(session.check_out);

      if (checkInTime !== "--" && checkOutTime !== "--") {
        const [inHours, inMinutes] = checkInTime.split(":").map(Number);
        const [outHours, outMinutes] = checkOutTime.split(":").map(Number);

        let sessionMinutes =
          outHours * 60 + outMinutes - (inHours * 60 + inMinutes);

        if (sessionMinutes < 0) {
          sessionMinutes += 24 * 60;
        }

        totalMinutes += sessionMinutes;
      }
    }
  });

  // Calculate total hours with decimal
  const totalHours = totalMinutes / 60;

  // Format to 2 decimal places
  return totalHours.toFixed(2);
}

// Circular Progress Component
function TimeCircle({
  sessions,
  checkIn,
  checkOut,
  size = 70,
}: {
  sessions?: PunchSession[];
  checkIn: string;
  checkOut: string;
  size?: number;
}) {
  const totalHours =
    sessions && sessions.length > 1
      ? calculateTotalHours(sessions)
      : checkOut === "--"
        ? calculateCurrentWorkHours(checkIn)
        : calculateCompletedWorkHours(checkIn, checkOut);

  const hasValidData = totalHours !== "--" && !totalHours.includes("NaN");

  const calculateProgress = () => {
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
            <div className="text-[10px] text-gray-500 font-medium">HRS</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Punch Sessions Display Component
function PunchSessions({
  sessions,
  multiMode,
}: {
  sessions?: PunchSession[];
  multiMode: boolean;
}) {
  if (!multiMode || !sessions || sessions.length <= 1) {
    return null;
  }

  return (
    <div className="mt-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center mb-3">
        <Clock className="w-4 h-4 text-blue-600 mr-2" />
        <span className="text-sm font-semibold text-blue-800">
          Punch Sessions Breakdown
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sessions.map((session, idx) => {
          const checkInTime = extractTime(session.check_in || null);
          const checkOutTime = extractTime(session.check_out || null);
          const duration = session.duration_hours?.toFixed(2) || "0.00";

          return (
            <div
              key={idx}
              className="bg-white p-3 rounded-md border border-blue-100 flex flex-col justify-center text-sm shadow-sm"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 font-medium">
                  Session {idx + 1}
                </span>
                <span className="font-bold text-blue-600">
                  {duration}h
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 font-medium">
                <span>{checkInTime}</span>
                <span className="text-gray-300">-</span>
                <span>{checkOutTime}</span>
              </div>
            </div>
          );
        })}
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
  const [hoveredId, setHoveredId] = useState<string | null>(null);


  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const effectiveSearchQuery =
    debouncedSearchQuery.length >= 2 ? debouncedSearchQuery : "";
  const hasActiveFilters = selectedGroupId !== 0 || effectiveSearchQuery !== "";

  // Employee caching and prefetching hooks
  const { getEmployee, setEmployee } = useEmployeeCache();
  const { onHoverStart, onHoverEnd } = useEmployeePrefetch(companyId);

  // Use both hooks conditionally
  const {
    data: regularEmployeesData,
    isLoading: regularLoading,
    isError: regularError,
  } = useEmployees(companyId, page, pageSize);

  const {
    data: filteredEmployeesData,
    isLoading: filteredLoading,
    isError: filteredError,
  } = useFilterEmployees({
    companyId,
    page,
    groupId: selectedGroupId !== 0 ? selectedGroupId : undefined,
    searchQuery: effectiveSearchQuery,
  });

  const {
    data: groupsData,
    isLoading: groupsLoading,
    error: groupsError,
  } = useGroups();

  // Get groups for display
  const allGroups = useMemo(() => {
    if (!groupsData) return [];

    const groupsArray = groupsData.data || [];

    const extractedGroups = groupsArray
      .map((groupItem: any) => ({
        id: Number(groupItem.id),
        name: groupItem.group || groupItem.name || "Unnamed Group",
      }))
      .filter(
        (group: { id: number; name: string }) =>
          group.id && group.name.trim() !== "",
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

  const { count: totalCompanyEmployees, isLoading: countLoading } =
    useEmployeeCount(companyId);
  const { currentCompany } = useCompany();
  const [punches, setPunches] = useState<Record<string, PunchData>>({});
  const [loadingPunches, setLoadingPunches] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data: activeUsersData, isLoading: activeUsersLoading } =
    useActiveUsersCount(companyId);

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

      const uniqueKey = `${emp.id}-${emp.biometric_id || ""}-${emp.employee_id || ""}`;

      if (!uniqueEmployees.has(uniqueKey)) {
        // Calculate predicted page based on ID for faster future lookups
        let predictedPage = 1;
        if (typeof emp.id === "number" && pageSize > 0) {
          predictedPage = Math.max(1, Math.ceil(emp.id / pageSize));
        }

        uniqueEmployees.set(uniqueKey, {
          ...emp,
          uniqueKey,
          predictedPage,
        });
      }
    });

    return Array.from(uniqueEmployees.values());
  }, [employeesData, pageSize]);

  const filteredEmployees = useMemo(() => {
    return employees;
  }, [employees]);

  // Find lines 415-444 (the startSerialNumber calculation) and REPLACE it with:

  // Calculate starting serial number - SIMPLIFIED VERSION
  const startSerialNumber = useMemo(() => {
    if (hasActiveFilters) {
      // For filtered results, start from 1 on each page
      return 1;
    }

    // For regular pagination, calculate based on page number
    return (currentPage - 1) * pageSize + 1;
  }, [hasActiveFilters, currentPage, pageSize]);

  // Total count calculation - MOVE THIS BEFORE startSerialNumber if it's used elsewhere
  const displayTotalCount = useMemo(() => {
    if (hasActiveFilters && filteredEmployeesData) {
      return filteredEmployeesData.totalEmployees || 0;
    }

    if (
      typeof totalCompanyEmployees === "number" &&
      totalCompanyEmployees > 0
    ) {
      return totalCompanyEmployees;
    }

    if (
      employeesData &&
      typeof employeesData.totalEmployees === "number" &&
      employeesData.totalEmployees > 0
    ) {
      return employeesData.totalEmployees;
    }

    if (
      employeesData &&
      typeof employeesData.totalCount === "number" &&
      employeesData.totalCount > 0
    ) {
      return employeesData.totalCount;
    }

    return employees.length || 0;
  }, [
    employeesData,
    totalCompanyEmployees,
    employees.length,
    hasActiveFilters,
    filteredEmployeesData,
  ]);

  const currentPageEmployeesCount = filteredEmployees.length;

  // Calculate range for display
  const { start, end } = useMemo(() => {
    const totalEmployees = displayTotalCount;
    const currentPageCount = filteredEmployees.length;

    if (totalEmployees === 0 || currentPageCount === 0) {
      return { start: 0, end: 0 };
    }

    if (hasActiveFilters) {
      const start = (currentPage - 1) * pageSize + 1;
      const end = Math.min(start + currentPageCount - 1, totalEmployees);
      return { start, end };
    }

    if (currentPage === 1) {
      return {
        start: 1,
        end: currentPageCount,
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
  }, [
    displayTotalCount,
    filteredEmployees.length,
    hasActiveFilters,
    currentPage,
    pageSize,
  ]);

  // ADJUSTED startSerialNumber that uses the calculated start value
  const adjustedStartSerialNumber = useMemo(() => {
    if (hasActiveFilters) {
      return 1;
    }
    // Use the calculated start value which is already correct
    return start;
  }, [hasActiveFilters, start]);

  // ⚡ OPTIMIZED: Employee click handler with fast lookup
  const handleEmployeeClick = useCallback(
    async (employee: EmployeeWithKey, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const employeeId = employee.id.toString();
      setClickLoading(employeeId);

      console.log(
        `🔍 Clicking employee: ${employeeId} (Predicted page: ${employee.predictedPage})`,
      );

      try {
        // 1. INSTANT: Check cache first
        const cachedEmployee = getEmployee(employeeId, companyId);
        if (cachedEmployee) {
          console.log("⚡ Instant from cache!");
          router.push(`/dashboard/employees/${employeeId}`);
          return;
        }

        // 2. FAST: Try direct API lookup
        const startTime = Date.now();
        const response = await fetch("/api/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company_id: companyId,
            employee_id: employeeId,
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
          console.error("Employee not found via API");
          // Fallback to regular navigation
          router.push(`/dashboard/employees/${employeeId}`);
        }
      } catch (error) {
        console.error("Failed to fetch employee:", error);
        // Fallback to regular navigation
        router.push(`/dashboard/employees/${employeeId}`);
      } finally {
        setClickLoading(null);
      }
    },
    [companyId, getEmployee, setEmployee, router],
  );

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
                    multi_mode: false,
                  };
                }
              } catch (error) {
                console.error(
                  `Error fetching punch data for employee ${emp.id}:`,
                  error,
                );
                punchesData[emp.uniqueKey] = {
                  first_check_in: null,
                  last_check_out: null,
                  multi_mode: false,
                };
              }
            }),
          );

          if (i + batchSize < filteredEmployees.length) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
      } catch (error) {
        console.error("Error in fetchPunches:", error);
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


  // Clear all filters
  const clearFilters = () => {
    setSelectedGroupId(0);
    setSearchQuery("");
    setPage(1);
  };

  const getProfileImageUrl = (emp: User) =>
    emp.prof_img
      ? emp.prof_img.startsWith("http")
        ? emp.prof_img
        : `${currentCompany?.mediaBaseUrl}${emp.prof_img}`
      : null;


  if (isLoading)
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading employees...</span>
      </div>
    );

  if (isError)
    return (
      <div className="text-center py-8 text-red-600">
        Failed to load employees. Please try again.
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Employees</h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of your workforce and their daily activity
        </p>
      </div>

      <div className="pb-4">


      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Employees Card */}
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">
              Total Employees
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {countLoading ? (
                <span className="text-gray-400">Loading...</span>
              ) : (
                displayTotalCount.toLocaleString()
              )}
            </p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        {/* Active Today Card */}
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">
              Active Today
            </h3>
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

        {/* Male Staff Card */}
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">
              Male Staff
            </h3>
            <p className="text-3xl font-bold text-purple-600">
              {activeUsersLoading ? (
                <span className="text-gray-400">--</span>
              ) : (
                activeUsersData?.male_count || 0
              )}
            </p>
          </div>
          <div className="p-3 bg-purple-100 rounded-full">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
        </div>

        {/* Female Staff Card */}
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">
              Female Staff
            </h3>
            <p className="text-3xl font-bold text-red-600">
              {activeUsersLoading ? (
                <span className="text-gray-400">--</span>
              ) : (
                activeUsersData?.female_count || 0
              )}
            </p>
          </div>
          <div className="p-3 bg-red-100 rounded-full">
            <Users className="h-6 w-6 text-red-600" />
          </div>
        </div>
      </div>


      <div className="pt-6 mt-2">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Employee Records</h2>

        {/* Filter Bar - mimicking mypunches */}
        <div className="flex flex-wrap items-end gap-5 mb-8">
          {/* Search Box */}
          <div className="flex flex-col flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Employees
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search name, email, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border border-gray-300 pl-10 pr-4 py-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              />
            </div>
          </div>

          {/* Group Selector */}
          <div className="flex flex-col w-full md:w-56">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(Number(e.target.value))}
              className="border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow bg-white h-[42px]"
            >
              <option value={0}>All Groups</option>
              {allGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {(selectedGroupId !== 0 || searchQuery) && (
              <button
                onClick={clearFilters}
                className="flex items-center justify-center gap-2 px-6 py-[9px] bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition font-medium text-sm h-[42px]"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 px-6 py-[9px] bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium text-sm h-[42px]"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {loadingPunches && (
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-500">
              Loading punch data...
            </span>
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
            <ul className="space-y-4">
              {filteredEmployees.map((emp, index) => {
                const serialNumber = adjustedStartSerialNumber + index;
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
                    className="bg-white border border-gray-200 p-4 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors shadow-sm group relative"
                    onMouseEnter={() => {
                      onHoverStart(emp.id.toString());
                      setHoveredId(emp.uniqueKey);
                    }}
                    onMouseLeave={() => {
                      onHoverEnd(emp.id.toString());
                      setHoveredId(null);
                    }}
                    onClick={(e) => handleEmployeeClick(emp, e)}
                  >
                    {/* New Serial Number Badge - Placed at the top-left of the LI */}
                    <div className="absolute top-0 left-0 bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-tl-lg rounded-br-lg z-10 shadow-sm">
                      #{serialNumber}
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-4">
                      {/* Left Section - Profile and Employee Details */}
                      <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                        {/* Profile Image Container - Cleaned up */}
                        <div className="h-14 w-14 rounded-xl border-2 border-blue-100 bg-blue-50 flex flex-col items-center justify-center flex-shrink-0 relative overflow-hidden">
                          {profileUrl ? (
                            <Image
                              src={profileUrl}
                              alt={`${emp.first_name} ${emp.last_name}`}
                              width={56}
                              height={56}
                              className="object-cover h-full w-full"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-blue-700">
                              <span className="text-xl font-bold leading-none">{initials}</span>
                              <span className="text-[10px] font-semibold uppercase mt-1">EMP</span>
                            </div>
                          )}
                        </div>

                        {/* Employee Details */}
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-lg text-gray-900 truncate">
                              {emp.first_name} {emp.last_name}
                            </p>
                            {clickLoading === emp.id.toString() && (
                              <Clock className="h-4 w-4 text-blue-600 animate-spin" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {/* <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              ID: {emp.employee_id || emp.biometric_id}
                            </span> */}
                            <p className="text-sm text-gray-500 truncate">
                              {emp.email}
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-1">
                            {emp.group && (
                              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full font-medium">
                                {emp.group}
                              </span>
                            )}
                            {emp.is_wfh !== undefined && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                                {emp.is_wfh ? "WFH" : "On-Site"}
                              </span>
                            )}
                            {multiMode && totalSessions > 1 && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">
                                {totalSessions} SESSIONS
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
                            <ArrowUpCircle className="h-4 w-4 text-green-500" />
                            <span className="text-[10px] font-bold text-gray-400">IN</span>
                          </div>
                          <span className="text-lg font-bold text-gray-900 leading-none">
                            {checkInTime}
                          </span>
                          {multiMode && punch?.check_in_count > 1 && (
                            <span className="text-[10px] text-green-600 font-bold mt-0.5">
                              +{punch.check_in_count - 1} MORE
                            </span>
                          )}
                        </div>

                        {/* Check-out */}
                        <div className="flex flex-col items-center min-w-[60px]">
                          <div className="flex items-center gap-2 mb-1">
                            <ArrowDownCircle className="h-4 w-4 text-red-500" />
                            <span className="text-[10px] font-bold text-gray-400">OUT</span>
                          </div>
                          <span className="text-lg font-bold text-gray-900 leading-none">
                            {checkOutTime}
                          </span>
                          {multiMode && punch?.check_out_count > 1 && (
                            <span className="text-[10px] text-red-600 font-bold mt-0.5">
                              +{punch.check_out_count - 1} MORE
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

                    {/* Multiple Sessions Breakdown on Hover */}
                    {hoveredId === emp.uniqueKey && multiMode && (
                      <PunchSessions sessions={sessions} multiMode={multiMode} />
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Standardized Pagination like Leaves Dashboard */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 py-4 border-t mt-8">
                <div className="text-xs text-gray-500 font-medium">
                  Showing {start}-{end} of {displayTotalCount.toLocaleString()} employees
                  {selectedGroupId !== 0 && (
                    <span className="ml-2 text-blue-600">
                      • Group: {allGroups.find((g: { id: number; name: string }) => g.id === selectedGroupId)?.name || `Group ${selectedGroupId}`}
                    </span>
                  )}
                  {searchQuery && (
                    <span className="ml-2 text-green-600">
                      • Searching: "{searchQuery}"
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="h-8 text-xs"
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Standard 5-page window logic from leaves dashboard
                      let pageNum = currentPage <= 3 
                        ? i + 1 
                        : Math.min(currentPage - 2 + i, totalPages - 4 + i);
                      
                      if (pageNum <= 0) pageNum = i + 1;
                      if (pageNum > totalPages) return null;

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className={`h-8 w-8 text-xs p-0 ${currentPage === pageNum ? 'bg-blue-600' : ''}`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="h-8 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  </div>
  );
}

export default function EmployeesPage() {
  const { company } = useAuth();

  if (!company) return <p>No company selected</p>;

  return <EmployeesList companyId={company.id} />;
}
