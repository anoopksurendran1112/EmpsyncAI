"use client"

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useAddStaffType, type StaffTypePayload } from "@/hooks/settings/staff_type/useAddStaffType"

const addStaffTypeSchema = z.object({
    type_name: z.string().min(1, "Staff type name is required"), // Use type_name
})

type AddStaffTypeFormData = z.infer<typeof addStaffTypeSchema>

export function AddStaffTypeForm({ setOpen }: { setOpen: (open: boolean) => void }) {
    const { company } = useAuth()
    const addStaffTypeMutation = useAddStaffType()
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<AddStaffTypeFormData>({
        resolver: zodResolver(addStaffTypeSchema),
    })

    const onSubmit = (data: AddStaffTypeFormData) => {
        if (!company?.id) {
            toast.error("Company information not available.");
            return;
        }

        const payload: StaffTypePayload = {
            company_id: company.id,
            type_name: data.type_name, // Use type_name
        };

        addStaffTypeMutation.mutate(payload, {
            onSuccess: (response) => {
                toast.success(response.message || "Staff type created successfully!");
                setOpen(false);
            },
            onError: (error) => {
                toast.error(error.message);
            }
        });
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
                <div>
                    <Label htmlFor="type_name" className="mb-2">Staff Type Name</Label>
                    <Input 
                        id="type_name" 
                        {...register("type_name")} 
                        placeholder="e.g. Full-time, Part-time, Contract" 
                        disabled={isSubmitting || addStaffTypeMutation.isPending}
                    />
                    {errors.type_name && <p className="text-red-500 text-sm">{errors.type_name.message}</p>}
                </div>
            </div>
            <DialogFooter className="mt-4">
                <Button 
                    type="submit"
                    disabled={isSubmitting || addStaffTypeMutation.isPending}
                >
                    {addStaffTypeMutation.isPending ? "Saving..." : "Save Staff Type"}
                </Button>
            </DialogFooter>
        </form>
    )
}