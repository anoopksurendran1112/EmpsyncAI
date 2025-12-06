// hooks/active-users/useGetActiveUsers.ts
import { useQuery } from "@tanstack/react-query";
import { User } from "@/context/AuthContext";

interface ActiveUsersResponse {
  status: number;
  total: number;
  page: number;
  male_count: number;
  female_count: number;
  others_count: number;
  total_page: number;
  success: boolean;
  message: string;
  data: User[];
  users?: User[];
  employees?: User[];
}

interface PaginatedActiveUsersResponse {
  activeUsers: User[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  maleCount: number;
  femaleCount: number;
  othersCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  status: number;
  success: boolean;
  message: string;
}

async function fetchActiveUsers(
  companyId: number, 
  page: number, 
  limit: number
): Promise<PaginatedActiveUsersResponse> {
  const res = await fetch("/api/active_users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ 
      company_id: companyId,
      page,
      limit,
      date: new Date().toISOString().split('T')[0] // Today's date
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch active users");
  }

  const responseData: ActiveUsersResponse = await res.json();
  
  console.log('🔍 Active Users API Response:', responseData);
  
  // Handle different response structures
  const usersArray = responseData.data || responseData.users || responseData.employees || [];
  
  return {
    activeUsers: usersArray,
    currentPage: responseData.page || page,
    totalPages: responseData.total_page || 1,
    totalCount: responseData.total || 0,
    maleCount: responseData.male_count || 0,
    femaleCount: responseData.female_count || 0,
    othersCount: responseData.others_count || 0,
    hasNextPage: (responseData.page || page) < (responseData.total_page || 1),
    hasPrevPage: (responseData.page || page) > 1,
    status: responseData.status || 200,
    success: responseData.success !== undefined ? responseData.success : true,
    message: responseData.message || "",
  };
}

export function useActiveUsers(companyId: number, page: number, limit: number = 50) {
  return useQuery<PaginatedActiveUsersResponse>({
    queryKey: ["active-users", companyId, page, limit],
    queryFn: () => fetchActiveUsers(companyId, page, limit),
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000, // 2 minutes stale time for active users
    keepPreviousData: true,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes for real-time updates
  });
}