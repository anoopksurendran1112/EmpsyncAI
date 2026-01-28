import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

type UpdateStaffTypePayload = {
  companyId: number | string;
  id: number | string; // Staff type ID
  type_name: string; // Use type_name as per API spec
};

async function updateStaffType({
  companyId,
  id,
  type_name,
}: UpdateStaffTypePayload) {
  const res = await fetch(`/api/settings/staff_type/${companyId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id,
      type_name, // Send type_name to backend
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to update staff type");
  }

  return res.json();
}

export function useUpdateStaffType() {
  const queryClient = useQueryClient();
  const { company } = useAuth();

  return useMutation({
    mutationFn: updateStaffType,
    onSuccess: (data) => {
      toast.success(data.message || "Staff type updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["staff_types", company?.id] });
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Failed to update staff type.";
      toast.error(errorMessage);
    },
  });
}