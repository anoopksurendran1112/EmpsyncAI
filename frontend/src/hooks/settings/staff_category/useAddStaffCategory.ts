import { useAuth } from "@/context/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type StaffCategoryPayload = {
  company_id: number;
  category_name: string; // Use category_name as per API spec
};

async function addStaffCategory(payload: StaffCategoryPayload) {
  const res = await fetch("/api/settings/staff_category/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to add staff category");
  }

  return res.json();
}

export function useAddStaffCategory() {
  const { company } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addStaffCategory,
    onSuccess: (data) => {
      toast.success(data.message || "Staff category created successfully!");
      queryClient.invalidateQueries({ queryKey: ["staff_categories", company?.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create staff category.");
    },
  });
}