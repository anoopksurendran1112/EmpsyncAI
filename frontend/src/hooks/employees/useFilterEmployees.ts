// hooks/employees/useFilterEmployees.ts
import { useQuery } from "@tanstack/react-query";
import { User } from "@/context/AuthContext";

interface FilterEmployeesResponse {
  success: boolean;
  company_id: number;
  group_id?: number;
  search?: string;
  page: number;
  totalPages: number;
  totalEmployees: number;
  maleCount: number;
  femaleCount: number;
  othersCount: number;
  data: User[];
  message: string;
}

interface FilterEmployeesData {
  employees: User[];
  totalEmployees: number;
  currentPage: number;
  totalPages: number;
  maleCount: number;
  femaleCount: number;
  othersCount: number;
}

async function fetchFilterEmployees({
  companyId,
  page = 1,
  groupId,
  searchQuery,
  gender,
  isActive,
  groups,
  avgHourFilter
}: {
  companyId: number;
  page?: number;
  groupId?: number;
  searchQuery?: string;
  gender?: string;
  isActive?: boolean;
  groups?: number[];
  avgHourFilter?: string;
}): Promise<FilterEmployeesData> {
  const res = await fetch("/api/employees/group_filter", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ 
      company_id: companyId,
      page: page,
      group_id: groupId,
      search: searchQuery,
      gender: gender,
      is_active: isActive,
      groups: groups,
      avg_hour_filter: avgHourFilter
    }),
  });

  const responseData: FilterEmployeesResponse = await res.json();

  if (!res.ok) {
    throw new Error(responseData.error || "Failed to fetch filtered employees");
  }

  if (!responseData.success) {
    throw new Error(responseData.error || "Filter failed");
  }

  console.log('✅ Filtered employees data received:', {
    companyId: responseData.company_id,
    groupId: responseData.group_id,
    search: responseData.search,
    page: responseData.page,
    totalEmployees: responseData.totalEmployees,
    totalPages: responseData.totalPages
  });

  return {
    employees: responseData.data || [],
    totalEmployees: responseData.totalEmployees || 0,
    currentPage: responseData.page || page,
    totalPages: responseData.totalPages || 1,
    maleCount: responseData.maleCount || 0,
    femaleCount: responseData.femaleCount || 0,
    othersCount: responseData.othersCount || 0
  };
}

export function useFilterEmployees({
  companyId,
  page = 1,
  groupId,
  searchQuery,
  gender,
  isActive,
  groups,
  avgHourFilter
}: {
  companyId: number;
  page?: number;
  groupId?: number;
  searchQuery?: string;
  gender?: string;
  isActive?: boolean;
  groups?: number[];
  avgHourFilter?: string;
}) {
  return useQuery<FilterEmployeesData>({
    queryKey: ["filteredEmployees", companyId, groupId, searchQuery, page],
    queryFn: () => fetchFilterEmployees({
      companyId,
      page,
      groupId,
      searchQuery,
      gender,
      isActive,
      groups,
      avgHourFilter
    }),
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}