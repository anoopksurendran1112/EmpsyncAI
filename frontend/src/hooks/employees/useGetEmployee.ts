// hooks/employees/useGetEmployee.ts
import { useQuery } from "@tanstack/react-query";
import { User } from "@/context/AuthContext";

interface EmployeeResponse {
  success: boolean;
  data?: User;
  error?: string;
}

async function fetchEmployee(companyId: number, employeeId: string): Promise<User> {
  const res = await fetch("/api/employees", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ 
      company_id: companyId,
      employee_id: employeeId
    }),
  });

  const responseData: EmployeeResponse = await res.json();

  if (!res.ok) {
    throw new Error(responseData.error || "Failed to fetch employee");
  }

  if (!responseData.success || !responseData.data) {
    throw new Error(responseData.error || "Employee not found");
  }

  console.log('✅ Employee data received:', {
    id: responseData.data.id,
    name: `${responseData.data.first_name} ${responseData.data.last_name}`,
    is_active: responseData.data.is_active
  });

  return responseData.data;
}

export function useEmployee(companyId: number | undefined, employeeId: string | undefined) {
  return useQuery<User>({
    queryKey: ["employee", companyId, employeeId],
    queryFn: () => fetchEmployee(companyId!, employeeId!),
    enabled: !!companyId && !!employeeId,
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}