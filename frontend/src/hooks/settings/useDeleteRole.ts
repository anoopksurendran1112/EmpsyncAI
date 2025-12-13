// hooks/settings/useDeleteRole.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

export function useDeleteRole() {
  const queryClient = useQueryClient();
  const { company } = useAuth();

  return useMutation({
    mutationFn: async (roleId: number) => {
      if (!company?.id) throw new Error("Company not found");

      const res = await fetch(`/api/settings/roles/${company.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: roleId,
          company_id: company.id, // ✅ Required by backend
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete role");
      }

      return res.json();
    },
    onSuccess: () => {
      // ✅ Refetch roles after deletion
      queryClient.invalidateQueries({ queryKey: ["roles", company?.id] });
    },
  });
}
