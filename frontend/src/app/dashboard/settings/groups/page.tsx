"use client"

import { useGroups } from "@/hooks/settings/groups/useGroups"
import Loading from "../loading"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useState } from "react"
import { AddGroupForm } from "./add-group-form"
import { useAuth } from "@/context/AuthContext";
import { useDeleteGroup } from "@/hooks/settings/groups/useDeleteGroup";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function GroupsPage() {
  const { data, isLoading, isError } = useGroups()
  const { company } = useAuth()
  const [open, setOpen] = useState(false)
  const deleteGroupMutation = useDeleteGroup()

  const handleDelete = (groupId: number) => {
    if (!company?.id) {
      toast.error("Company information not available.");
      return;
    }
    deleteGroupMutation.mutate({ 
        groupId, 
        body: { company_id: [company.id],id: groupId } 
    })
  }

  if (isLoading) return <Loading />
  if (isError) return <p>Failed to load groups</p>

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Groups</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add Group</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Group</DialogTitle>
              <DialogDescription>
                Create a new group and add members.
              </DialogDescription>
            </DialogHeader>
            <AddGroupForm setOpen={setOpen} />
          </DialogContent>
        </Dialog>
      </div>

      <ul className="space-y-2">
        {data?.data?.map((group: any) => (
          <li
            key={group.id}
            className="flex items-center justify-between border p-2 rounded-md bg-gray-50 hover:bg-gray-100"
          >
            <div>
              <p>{group.id}</p>
              <p className="font-medium">{group.group}</p>
              <p className="text-sm text-gray-500">{group.short_name}</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the group.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(group.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </li>
        ))}
      </ul>
    </div>
  )
}
