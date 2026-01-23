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
import { useUpdateGroup } from "@/hooks/settings/groups/useUpdateGroup"; // Import the new hook
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

// Add this form component for editing groups
function EditGroupForm({ 
  group, 
  setOpen,
  companyId 
}: { 
  group: any, 
  setOpen: (open: boolean) => void,
  companyId: number | string 
}) {
  const [groupName, setGroupName] = useState(group.group || "");
  const [shortName, setShortName] = useState(group.short_name || "");
  const updateGroupMutation = useUpdateGroup();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }

    updateGroupMutation.mutate({
      companyId,
      groupId: group.id,
      new_group: groupName,
      short_name: shortName
    }, {
      onSuccess: () => {
        setOpen(false);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="groupName" className="text-sm font-medium">
          Group Name *
        </label>
        <input
          id="groupName"
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Enter group name"
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="shortName" className="text-sm font-medium">
          Short Name
        </label>
        <input
          id="shortName"
          type="text"
          value={shortName}
          onChange={(e) => setShortName(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Enter short name (optional)"
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(false)}
          disabled={updateGroupMutation.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={updateGroupMutation.isPending}>
          {updateGroupMutation.isPending ? "Updating..." : "Update Group"}
        </Button>
      </div>
    </form>
  );
}

export default function GroupsPage() {
  const { data, isLoading, isError } = useGroups()
  const { company } = useAuth()
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<any>(null)
  const deleteGroupMutation = useDeleteGroup()

  const handleDelete = (groupId: number) => {
    if (!company?.id) {
      toast.error("Company information not available.");
      return;
    }
    deleteGroupMutation.mutate({
      groupId,
      body: { company_id: [company.id], id: groupId }
    })
  }

  const handleEdit = (group: any) => {
    setSelectedGroup(group);
    setEditOpen(true);
  }

  if (isLoading) return <Loading />
  if (isError) return <p>Failed to load groups</p>

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Groups</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />Add Group
            </Button>
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

      {/* Edit Group Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>
              Update the group information.
            </DialogDescription>
          </DialogHeader>
          {selectedGroup && company?.id && (
            <EditGroupForm 
              group={selectedGroup} 
              setOpen={setEditOpen}
              companyId={company.id}
            />
          )}
        </DialogContent>
      </Dialog>

      <ul className="space-y-2">
        {data?.data?.map((group: any) => (
          <li
            key={group.id}
            className="flex items-center justify-between border p-2 rounded-md bg-gray-50 hover:bg-gray-100 min-h-[60px]"
          >
            <div className="flex-1">
              <p className="font-medium">{group.group}</p>
              <p className="text-sm text-gray-500">{group.short_name}</p>
            </div>
            <div className="flex items-center space-x-2">
              {/* Edit Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(group)}
                className="text-blue-500 hover:text-blue-700"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              
              {/* Delete Button */}
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
                    <AlertDialogAction
                      onClick={() => handleDelete(group.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}