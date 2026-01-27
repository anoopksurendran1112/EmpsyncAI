"use client";

import { useState } from "react";
import { useRoles } from "@/hooks/settings/useRoles";
import { useUpdateRole } from "@/hooks/settings/useUpdateRole";
import { useDeleteRole } from "@/hooks/settings/useDeleteRole";
import LoadingPage from "../../loading";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { AddRoleForm } from "./add-role-form";
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
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/AuthContext";

// Add this form component for editing roles
function EditRoleForm({
  role,
  setOpen,
}: {
  role: any;
  setOpen: (open: boolean) => void;
}) {
  const [roleName, setRoleName] = useState(role.role || "");
  const [workingHours, setWorkingHours] = useState<number | undefined>(
    role.working_hour
  );
  const updateRoleMutation = useUpdateRole();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!roleName.trim()) {
      toast.error("Role name is required");
      return;
    }

    updateRoleMutation.mutate(
      {
        id: role.id,
        new_role: roleName.trim(),
        working_hour: workingHours,
      },
      {
        onSuccess: () => {
          setOpen(false);
          toast.success("Role updated successfully");
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="roleName" className="text-sm font-medium">
          Role Name *
        </label>
        <input
          id="roleName"
          type="text"
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Enter role name"
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="workingHours" className="text-sm font-medium">
          Working Hours
        </label>
        <input
          id="workingHours"
          type="number"
          value={workingHours ?? ""}
          onChange={(e) => setWorkingHours(Number(e.target.value))}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Enter working hours"
          min="0"
          max="24"
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(false)}
          disabled={updateRoleMutation.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={updateRoleMutation.isPending}>
          {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
        </Button>
      </div>
    </form>
  );
}

export default function RolesPage() {
  const { data, isLoading, isError } = useRoles();
  const deleteRoleMutation = useDeleteRole();
  const { company } = useAuth();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);

  if (isLoading) return <LoadingPage />;
  if (isError) return <p>Failed to load Roles</p>;

  const handleEdit = (role: any) => {
    setSelectedRole(role);
    setEditOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteRoleMutation.mutate(id);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Roles</h1>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> Add Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Role</DialogTitle>
              <DialogDescription>
                Create a new role and set permissions.
              </DialogDescription>
            </DialogHeader>
            <AddRoleForm setOpen={setIsAddOpen} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Update the role information.</DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <EditRoleForm role={selectedRole} setOpen={setEditOpen} />
          )}
        </DialogContent>
      </Dialog>

      <ul className="space-y-2">
        {data && data.length > 0 ? (
          data.map((role: any) => (
            <li
              key={role.id}
              className="flex items-center justify-between border p-2 rounded-md bg-gray-50 hover:bg-gray-100 min-h-[60px]"
            >
              <div className="flex-1">
                <p className="font-medium">{role.role}</p>
                <p className="text-sm text-gray-500">
                  Working Hours: {role.working_hour || "Not set"}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(role)}
                  className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Pencil className="h-4 w-4" />
                </Button>

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
                        This action cannot be undone. This will permanently
                        delete the role.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(role.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </li>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">No roles found</p>
        )}
      </ul>
    </div>
  );
}