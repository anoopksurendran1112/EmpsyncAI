// hooks/settings/groups/useUpdateGroup.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

type UpdateGroupPayload = {
  companyId: number | string;
  groupId: number | string;
  new_group: string;
  short_name?: string;
};

async function updateGroup({ companyId, groupId, new_group, short_name }: UpdateGroupPayload) {
  const res = await fetch(`/api/settings/groups/${companyId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      groupId,
      new_group,
      short_name: short_name || ""
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to update group");
  }

  return res.json();
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();
  const { company } = useAuth();

  return useMutation({
    mutationFn: updateGroup,
    onSuccess: () => {
      toast.success("Group updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["groups", company?.id] });
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Failed to update group.";
      toast.error(errorMessage);
    },
  });
}