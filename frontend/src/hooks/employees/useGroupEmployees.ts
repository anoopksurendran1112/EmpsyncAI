// hooks/employees/useGroupEmployees.ts
import { useQuery } from "@tanstack/react-query";
import { User } from "@/context/AuthContext";

interface GroupEmployeesResponse {
  success: boolean;
  data?: {
    employees?: User[];
    data?: User[];
    total?: number;
    totalCount?: number;
    last_page?: number;
    current_page?: number;
  };
  company_id?: number;
  group_id?: number; // Changed from string to number
  page?: number;
  error?: string;
}

interface GroupEmployeesData {
  employees: User[];
  totalEmployees: number;
  currentPage: number;
  totalPages: number;
}

async function fetchGroupEmployees(
  companyId: number, 
  page: number, 
  groupId: number // Changed from string to number
): Promise<GroupEmployeesData> {
  const res = await fetch("/api/employees/group_filter", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ 
      company_id: companyId,
      group_id: groupId, // Now sending number instead of string
      page: page
    }),
  });

  const responseData: GroupEmployeesResponse = await res.json();

  if (!res.ok) {
    throw new Error(responseData.error || "Failed to fetch group employees");
  }

  if (!responseData.success) {
    throw new Error(responseData.error || "Group filter failed");
  }

  console.log('✅ Group employees data received:', {
    companyId: responseData.company_id,
    groupId: responseData.group_id,
    page: responseData.page,
    data: responseData.data
  });

  // Transform the response to match your expected structure
  const employees = responseData.data?.employees || responseData.data?.data || [];
  const totalEmployees = responseData.data?.total || responseData.data?.totalCount || 0;
  const currentPage = responseData.page || page;
  const totalPages = responseData.data?.last_page || Math.ceil(totalEmployees / 50) || 1;

  return {
    employees,
    totalEmployees,
    currentPage,
    totalPages
  };
}

export function useGroupEmployees(
  companyId: number | undefined, 
  page: number, 
  groupId: number | undefined // Changed from string to number
) {
  return useQuery<GroupEmployeesData>({
    queryKey: ["groupEmployees", companyId, groupId, page],
    queryFn: () => fetchGroupEmployees(companyId!, page, groupId!),
    enabled: !!companyId && !!groupId && groupId !== 0, // Changed from "all" to 0
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}