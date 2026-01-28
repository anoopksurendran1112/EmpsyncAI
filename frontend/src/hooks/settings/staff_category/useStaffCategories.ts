import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";

async function fetchStaffCategories(companyId: number | string) {
  const res = await fetch(`/api/settings/staff_category/${companyId}`);
  if (!res.ok) throw new Error("Failed to fetch staff categories");
  const data = await res.json();
  return data;
}

export function useStaffCategories() {
  const { company } = useAuth();
  const companyId = company?.id;

  return useQuery({
    queryKey: ["staff_categories", companyId],
    queryFn: async () => {
      if (!companyId) {
        return [];
      }
      const data = await fetchStaffCategories(companyId);
      
      // The API returns { categories: [...] }
      if (data.categories && Array.isArray(data.categories)) {
        return data.categories.map((item: any) => ({
          id: item.id,
          name: item.category_name, // Map category_name to name for UI consistency
          category_name: item.category_name, // Keep original field
        }));
      }
      
      // Fallback if structure is different
      if (Array.isArray(data)) {
        return data.map((item: any) => ({
          id: item.id,
          name: item.category_name || item.name,
          category_name: item.category_name || item.name,
        }));
      }
      
      return [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}