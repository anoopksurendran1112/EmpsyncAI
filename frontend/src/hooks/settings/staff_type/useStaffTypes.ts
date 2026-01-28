// hooks/settings/staff_type/useStaffTypes.ts
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";

async function fetchStaffTypes(companyId: number | string) {
  const res = await fetch(`/api/settings/staff_type/${companyId}`);
  if (!res.ok) throw new Error("Failed to fetch staff types");
  const data = await res.json();
  return data;
}

export function useStaffTypes() {
  const { company } = useAuth();
  const companyId = company?.id;

  return useQuery({
    queryKey: ["staff_types", companyId],
    queryFn: async () => {
      if (!companyId) {
        throw new Error("Company ID is required");
      }
      const data = await fetchStaffTypes(companyId);
      
      // Your API returns { types: [...] }
      if (data.types && Array.isArray(data.types)) {
        return data.types.map((item: any) => ({
          id: item.id,
          name: item.type_name, // Map type_name to name for UI consistency
          type_name: item.type_name, // Keep original
        }));
      }
      
      // Fallback if structure is different
      if (Array.isArray(data)) {
        return data.map((item: any) => ({
          id: item.id,
          name: item.type_name || item.name,
          type_name: item.type_name || item.name,
        }));
      }
      
      return [];
    },
    enabled: !!companyId, // Only run query when companyId exists
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}