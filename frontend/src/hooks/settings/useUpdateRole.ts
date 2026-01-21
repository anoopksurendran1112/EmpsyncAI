// hooks/settings/useUpdateRole.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

interface UpdateRoleData {
  id: number; // Role ID
  new_role: string;
  working_hour?: number;
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  const { company } = useAuth();

  return useMutation({
    mutationFn: async (data: UpdateRoleData) => {
      if (!company?.id) throw new Error("Company not found");

      // Send company ID in URL (from route param), role data in body
      const res = await fetch(`/api/settings/roles/${company.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data), // Send role ID in body
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update role");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", company?.id] });
    },
  });
}