import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

type UpdateStaffCategoryPayload = {
  companyId: number | string;
  id: number | string; // Staff category ID
  category_name: string; // Use category_name as per API spec
};

async function updateStaffCategory({
  companyId,
  id,
  category_name,
}: UpdateStaffCategoryPayload) {
  const res = await fetch(`/api/settings/staff_category/${companyId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id,
      category_name, // Send category_name to backend
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to update staff category");
  }

  return res.json();
}

export function useUpdateStaffCategory() {
  const queryClient = useQueryClient();
  const { company } = useAuth();

  return useMutation({
    mutationFn: updateStaffCategory,
    onSuccess: (data) => {
      toast.success(data.message || "Staff category updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["staff_categories", company?.id] });
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Failed to update staff category.";
      toast.error(errorMessage);
    },
  });
}