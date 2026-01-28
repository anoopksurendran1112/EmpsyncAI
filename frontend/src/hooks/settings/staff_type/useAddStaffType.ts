import { useAuth } from "@/context/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type StaffTypePayload = {
  company_id: number;
  type_name: string; // Use type_name as per API spec
};

async function addStaffType(payload: StaffTypePayload) {
  const res = await fetch("/api/settings/staff_type/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to add staff type");
  }

  return res.json();
}

export function useAddStaffType() {
  const { company } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addStaffType,
    onSuccess: (data) => {
      toast.success(data.message || "Staff type created successfully!");
      queryClient.invalidateQueries({ queryKey: ["staff_types", company?.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create staff type.");
    },
  });
}