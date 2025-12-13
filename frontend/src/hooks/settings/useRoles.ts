import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";

async function fetchRoles(companyId: number) {
  const res = await fetch(`/api/settings/roles/${companyId}`);
  if (!res.ok) throw new Error("Failed to fetch Roles");
  return res.json();
}

export function useRoles() {
  const { company } = useAuth();
  const companyId = company?.id;

  return useQuery({
    queryKey: ["roles", companyId],
    queryFn: async () => {
      if (!companyId) {
        // Return an empty array or handle as you see fit when companyId is not available
        return [];
      }
      return fetchRoles(companyId);
    },
    enabled: !!companyId, // Only fetch if company ID is available
    staleTime: 5 * 60 * 1000,
  });
}
