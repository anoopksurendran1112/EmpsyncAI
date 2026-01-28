import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

type DeleteStaffTypePayload = {
  companyId: number | string;
  id: number | string; // Staff type ID
};

async function deleteStaffType({ companyId, id }: DeleteStaffTypePayload) {
  const res = await fetch(`/api/settings/staff_type/${companyId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to delete staff type");
  }

  return res.json();
}

export function useDeleteStaffType() {
  const queryClient = useQueryClient();
  const { company } = useAuth();

  return useMutation({
    mutationFn: deleteStaffType,
    onSuccess: (data) => {
      toast.success(data.message || "Staff type deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["staff_types", company?.id] });
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Failed to delete staff type.";
      toast.error(errorMessage);
    },
  });
}