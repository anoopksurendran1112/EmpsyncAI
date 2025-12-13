import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

type DeleteGroupPayload = {
  groupId: number | string;
  body: any; 
};

async function deleteGroup({ groupId, body }: DeleteGroupPayload) {
  const res = await fetch(`/api/settings/groups/${groupId}`,
   {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to delete group");
  }

  return res.json();
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  const { company } = useAuth();

  return useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => {
      toast.success("Group deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["groups", company?.id] });
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Failed to delete group.";
      
    },
  });
}
