// hooks/employees/useGetEmployees.ts
import { useQuery } from "@tanstack/react-query";
import { User } from "@/context/AuthContext";

interface PaginatedResponse {
  employees: User[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  totalEmployees?: number;
  total?: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

async function fetchEmployees(companyId: number, page: number, limit: number, group?: string): Promise<PaginatedResponse> {
  const res = await fetch("/api/employees", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ 
      company_id: companyId,
      page,
      limit,
      group: group || undefined // Pass group to API
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch employees");
  }

  const responseData = await res.json();
  
  console.log('🔍 API Response:', responseData);
  
  return {
    employees: responseData.employees || [],
    currentPage: responseData.currentPage || page,
    totalPages: responseData.totalPages || 1,
    // Map totalEmployees to totalCount
    totalCount: responseData.totalEmployees || 0,
    hasNextPage: responseData.hasNextPage || false,
    hasPrevPage: responseData.hasPrevPage || false,
  };
}

export function useEmployees(companyId: number, page: number, limit: number = 50, group?: string) {
  return useQuery<PaginatedResponse>({
    queryKey: ["employees", companyId, page, limit, group], // Add group to query key
    queryFn: () => fetchEmployees(companyId, page, limit, group),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    keepPreviousData: true,
  });
}

/*"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/context/AuthContext";

async function fetchEmployees(companyId: number) {
  const res = await fetch("/api/employees", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ company_id: companyId }),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch employees");
  }

  return res.json();
}

export function useEmployees() {
  const { company } = useAuth(); // get company from AuthContext

  return useQuery<User[]>({
    queryKey: ["employees", company?.id],
    queryFn: () => fetchEmployees(company!.id),
    enabled: !!company?.id, // only run if company exists
    staleTime: 5 * 60 * 1000, // 5 minutes caching
  });
}
*/