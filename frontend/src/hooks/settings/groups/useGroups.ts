import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";

async function fetchGroups(companyId: number) {
  const res = await fetch(`/api/settings/groups/${companyId}`);
  if (!res.ok) throw new Error("Failed to fetch groups");
  return res.json();
}

export function useGroups() {
  const { company } = useAuth();
  const companyId = company?.id;

  return useQuery({
    queryKey: ["groups", companyId],
    queryFn: async () => {
      if (!companyId) {
        // Return an empty array or handle as you see fit when companyId is not available
        return [];
      }
      return fetchGroups(companyId);
    },
    enabled: !!companyId, // Only fetch if company ID is available
    staleTime: 5 * 60 * 1000,
  });
}
