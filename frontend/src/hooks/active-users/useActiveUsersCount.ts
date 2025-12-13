// hooks/active-users/useActiveUsersCount.ts
import { useQuery } from "@tanstack/react-query";

interface ActiveUsersCountResponse {
  total: number;
  male_count: number;
  female_count: number;
  others_count: number;
  success: boolean;
  message: string;
  fallback?: boolean;
}

async function fetchActiveUsersCount(companyId: number): Promise<ActiveUsersCountResponse> {
  try {
    const res = await fetch("/api/active-users/count", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        company_id: companyId,
        date: new Date().toISOString().split('T')[0]
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    
    return {
      total: data.total || 0,
      male_count: data.male_count || 0,
      female_count: data.female_count || 0,
      others_count: data.others_count || 0,
      success: data.success !== false,
      message: data.message || "Success",
      fallback: data.fallback || false
    };
  } catch (error) {
    console.error("Error fetching active users count:", error);
    return {
      total: 0,
      male_count: 0,
      female_count: 0,
      others_count: 0,
      success: false,
      message: "Failed to fetch active users count",
      fallback: true
    };
  }
}

export function useActiveUsersCount(companyId: number) {
  return useQuery<ActiveUsersCountResponse, Error>({
    queryKey: ["active-users-count", companyId],
    queryFn: () => fetchActiveUsersCount(companyId),
    enabled: !!companyId && companyId > 0,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 1,
  });
}