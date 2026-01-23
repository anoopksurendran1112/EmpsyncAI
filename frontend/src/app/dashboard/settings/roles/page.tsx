"use client";

import { useState } from "react";
import { useRoles } from "@/hooks/settings/useRoles";
import { useUpdateRole } from "@/hooks/settings/useUpdateRole";
import { useDeleteRole } from "@/hooks/settings/useDeleteRole";
import LoadingPage from "../../loading";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddRoleForm } from "./add-role-form";
import { Input } from "@/components/ui/input";
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

export default function RolesPage() {
  const { data, isLoading, isError } = useRoles();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();

  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [editedRole, setEditedRole] = useState("");
  const [editedHours, setEditedHours] = useState<number | undefined>(undefined);
  const [isAddOpen, setIsAddOpen] = useState(false);

  if (isLoading) return <LoadingPage />;
  if (isError) return <p>Failed to load Roles</p>;

  const handleEdit = (role: any) => {
    setEditingRoleId(role.id);
    setEditedRole(role.role);
    setEditedHours(role.working_hour);
  };

  const handleUpdate = (id: number) => {
    if (!editedRole.trim()) return;

    updateRoleMutation.mutate(
      {
        id,
        new_role: editedRole.trim(),
        working_hour: editedHours,
      },
      {
        onSuccess: () => {
          setEditingRoleId(null);
          setEditedRole("");
          setEditedHours(undefined);
        },
      }
    );
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
            </DialogHeader>
            <AddRoleForm setOpen={setIsAddOpen} />
          </DialogContent>
        </Dialog>
      </div>

      <ul className="space-y-2">
        {data && data.length > 0 ? (
          data.map((role: any) => (
            <li
              key={role.id}
              className="flex items-center justify-between border p-2 rounded-md bg-gray-50 hover:bg-gray-100 min-h-[60px]"
            >
              {editingRoleId === role.id ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
                  <Input
                    type="text"
                    value={editedRole}
                    onChange={(e) => setEditedRole(e.target.value)}
                    className="flex-1 h-9"
                    placeholder="Role name"
                  />
                  <Input
                    type="number"
                    value={editedHours ?? ""}
                    onChange={(e) => setEditedHours(Number(e.target.value))}
                    placeholder="Hours"
                    className="w-24 h-9"
                    min="0"
                    max="24"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUpdate(role.id)}
                      disabled={updateRoleMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 h-9 w-9 p-0"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setEditingRoleId(null)}
                      variant="ghost"
                      className="h-9 w-9 p-0 bg-gray-200 hover:bg-gray-300 text-black"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <p className="font-medium">{role.role}</p>
                    <p className="text-sm text-gray-500">
                      Working Hours: {role.working_hour || "Not set"}
                    </p>
                  </div>
                  <div className="flex gap-2">
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
                            This action cannot be undone. This will permanently delete the role.
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
                </>
              )}
            </li>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">No roles found</p>
        )}
      </ul>
    </div>
  );
}