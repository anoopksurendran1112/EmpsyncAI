import { useAuth } from "@/context/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type RolePayload = {
  role: string;
  company_id: number[];
};

// API function
async function addRole(payload: RolePayload) {
  const res = await fetch("/api/settings/roles/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to add role");
  }

  return res.json();
}

// Hook
export function useAddRole() {
    const { company } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", company?.id] });
    },
  });
}
