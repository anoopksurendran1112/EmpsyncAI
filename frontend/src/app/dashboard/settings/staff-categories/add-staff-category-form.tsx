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
import { useAddStaffCategory, type StaffCategoryPayload } from "@/hooks/settings/staff_category/useAddStaffCategory"

const addStaffCategorySchema = z.object({
    category_name: z.string().min(1, "Staff category name is required"), // Use category_name
})

type AddStaffCategoryFormData = z.infer<typeof addStaffCategorySchema>

export function AddStaffCategoryForm({ setOpen }: { setOpen: (open: boolean) => void }) {
    const { company } = useAuth()
    const addStaffCategoryMutation = useAddStaffCategory()
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<AddStaffCategoryFormData>({
        resolver: zodResolver(addStaffCategorySchema),
    })

    const onSubmit = (data: AddStaffCategoryFormData) => {
        if (!company?.id) {
            toast.error("Company information not available.");
            return;
        }

        const payload: StaffCategoryPayload = {
            company_id: company.id,
            category_name: data.category_name, // Use category_name
        };

        addStaffCategoryMutation.mutate(payload, {
            onSuccess: (response) => {
                toast.success(response.message || "Staff category created successfully!");
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
                    <Label htmlFor="category_name" className="mb-2">Staff Category Name</Label>
                    <Input 
                        id="category_name" 
                        {...register("category_name")} 
                        placeholder="e.g. Permanent, Contract, Part-Time" 
                        disabled={isSubmitting || addStaffCategoryMutation.isPending}
                    />
                    {errors.category_name && <p className="text-red-500 text-sm">{errors.category_name.message}</p>}
                </div>
            </div>
            <DialogFooter className="mt-4">
                <Button 
                    type="submit"
                    disabled={isSubmitting || addStaffCategoryMutation.isPending}
                >
                    {addStaffCategoryMutation.isPending ? "Saving..." : "Save Staff Category"}
                </Button>
            </DialogFooter>
        </form>
    )
}