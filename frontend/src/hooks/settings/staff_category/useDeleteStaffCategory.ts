import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

type DeleteStaffCategoryPayload = {
  companyId: number | string;
  id: number | string; // Staff category ID
};

async function deleteStaffCategory({ companyId, id }: DeleteStaffCategoryPayload) {
  const res = await fetch(`/api/settings/staff_category/${companyId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to delete staff category");
  }

  return res.json();
}

export function useDeleteStaffCategory() {
  const queryClient = useQueryClient();
  const { company } = useAuth();

  return useMutation({
    mutationFn: deleteStaffCategory,
    onSuccess: (data) => {
      toast.success(data.message || "Staff category deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["staff_categories", company?.id] });
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Failed to delete staff category.";
      toast.error(errorMessage);
    },
  });
}