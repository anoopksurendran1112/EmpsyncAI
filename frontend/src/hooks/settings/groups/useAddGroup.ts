import { useAuth } from "@/context/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

   export type GroupPayload = {
      group: string;
      short_name: string;
       company_id: number[];
       member_ids: number[];
   }

   async  function addGroup(payload:GroupPayload) {
      const res = await fetch("/api/settings/groups/add", {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
         },
         body: JSON.stringify(payload),
      });

      if (!res.ok) {
         const error = await res.json().catch(() => ({}));
         throw new Error(error.message || "Failed to add group");
      }

      return res.json();
   }

   export function useAddGroup() {
      const { company } = useAuth();
      const queryClient = useQueryClient();

      return useMutation({
         mutationFn: addGroup,
         onSuccess: () => {
            toast.success("Group created successfully!");
            queryClient.invalidateQueries({ queryKey: ["groups", company?.id] });
         },
         onError: (error) => {
            toast.error(error.message || "Failed to create group.");
         }
      });
   }