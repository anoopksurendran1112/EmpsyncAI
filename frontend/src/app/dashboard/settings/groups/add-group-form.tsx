"use client"

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/context/AuthContext"
import { useEmployees } from "@/hooks/employees/useGetEmployees"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { X as RemoveIcon } from "lucide-react"
import { DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useAddGroup } from "@/hooks/settings/groups/useAddGroup"
import { add } from "date-fns"

const addGroupSchema = z.object({
  groupType: z.string().min(1, "Group type is required"),
  shortName: z.string().min(1, "Short name is required"),
  members: z.array(z.number()).optional(), // array of user ids
})

type AddGroupFormData = z.infer<typeof addGroupSchema>

export function AddGroupForm({ setOpen }: { setOpen: (open: boolean) => void }) {
  const { company } = useAuth()
  const { data: employees, isLoading: isLoadingEmployees } = useEmployees(company?.id)
  const addGroupMutation = useAddGroup()
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AddGroupFormData>({
    resolver: zodResolver(addGroupSchema),
    defaultValues: {
      members: [],
    },
  })

  const selectedMemberIds = watch("members") || []

  const onSubmit = (data: AddGroupFormData) => {
    if (!company?.id) {
      toast.error("Company information not available.");
      return;
    }
    addGroupMutation.mutate(
      {
        group: data.groupType,
        short_name: data.shortName,
        company_id: [company.id],
        member_ids: data.members || [],
      },
      {
        onSuccess: () => {
          setOpen(false);
        },
      }
    );
  }

  const toggleMember = (memberId: number) => {
    const currentMembers = selectedMemberIds
    const newMembers = currentMembers.includes(memberId)
      ? currentMembers.filter((id) => id !== memberId)
      : [...currentMembers, memberId]
    setValue("members", newMembers, { shouldValidate: true })
  }
  
  const selectedEmployees = employees?.filter(emp => selectedMemberIds.includes(emp.id)) || [];

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 py-4">
        <div>
          <Label htmlFor="groupType">Group Type</Label>
          <Input id="groupType" {...register("groupType")} />
          {errors.groupType && <p className="text-red-500 text-sm">{errors.groupType.message}</p>}
        </div>
        <div>
          <Label htmlFor="shortName">Short Name</Label>
          <Input id="shortName" {...register("shortName")} />
          {errors.shortName && <p className="text-red-500 text-sm">{errors.shortName.message}</p>}
        </div>
        <div>
          <Label>Add Members</Label>
          <Command className="border rounded-lg">
            <div className="p-2 flex flex-wrap gap-1">
                {selectedEmployees.map(employee => (
                    <Badge key={employee.id} variant="secondary">
                        {employee.first_name} {employee.last_name}
                        <button type="button" onClick={() => toggleMember(employee.id)} className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                            <RemoveIcon className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
            </div>
            <CommandInput placeholder="Search employees..." />
            <CommandList>
              <CommandEmpty>No employees found.</CommandEmpty>
              <CommandGroup>
                {isLoadingEmployees ? (
                  <CommandItem>Loading...</CommandItem>
                ) : (
                  employees?.map((employee) => (
                    <CommandItem
                      key={employee.id}
                      onSelect={() => toggleMember(employee.id)}
                      className={selectedMemberIds.includes(employee.id) ? "bg-accent" : ""}
                    >
                      {employee.first_name} {employee.last_name}
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      </div>
      <DialogFooter>
        <Button type="submit">Save Group</Button>
      </DialogFooter>
    </form>
  )
}
