"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddStaffTypeForm } from "./add-staff-type-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // ADD THIS IMPORT
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
import LoadingPage from "@/app/dashboard/loading";
import { useAuth } from "@/context/AuthContext";
import { useStaffTypes } from "@/hooks/settings/staff_type/useStaffTypes";
import { useUpdateStaffType } from "@/hooks/settings/staff_type/useUpdateStaffType";
import { useDeleteStaffType } from "@/hooks/settings/staff_type/useDeleteStaffType";
import { toast } from "sonner";

export default function StaffTypesPage() {
  const { company } = useAuth();
  const { data: staffTypesData, isLoading, isError } = useStaffTypes();
  const updateStaffTypeMutation = useUpdateStaffType();
  const deleteStaffTypeMutation = useDeleteStaffType();

  const [editingTypeId, setEditingTypeId] = useState<number | string | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Extract staff types from the response data
  // Your API might return data.types, data.data, or directly an array
  const staffTypes = staffTypesData?.types || staffTypesData?.data || staffTypesData || [];

  const handleEdit = (staffType: any) => {
    setEditingTypeId(staffType.id);
    setEditedName(staffType.name || staffType.type);
    setEditedDescription(staffType.description || "");
  };

  const handleUpdate = (id: number | string) => {
    if (!editedName.trim()) {
      toast.error("Staff type name is required");
      return;
    }

    if (!company?.id) {
      toast.error("Company information not available");
      return;
    }

    updateStaffTypeMutation.mutate({
      companyId: company.id,
      id: id,
      type_name: editedName.trim(), // Use type_name
    }, {
      onSuccess: (response) => {
        toast.success(response.message || "Staff type updated successfully!");
        setEditingTypeId(null);
        setEditedName("");
      },
      onError: (error) => {
        toast.error(error.message);
      }
    });
  };

  const handleDelete = (id: number | string) => {
    if (!company?.id) {
      toast.error("Company information not available");
      return;
    }

    deleteStaffTypeMutation.mutate({
      companyId: company.id,
      id: id,
    }, {
      onError: (error) => {
        toast.error(error.message);
      }
    });
  };

  if (isLoading) return <LoadingPage />;
  if (isError) return <p className="text-red-500 p-4">Failed to load Staff Types</p>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Staff Types</h1>
          <p className="text-gray-500 text-sm mt-1">Manage different types of staff in your organization</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Add Staff Type
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Staff Type</DialogTitle>
            </DialogHeader>
            <AddStaffTypeForm setOpen={setIsAddOpen} />
          </DialogContent>
        </Dialog>
      </div>

      
        {staffTypes.length > 0 ? (
          <ul className="space-y-2">
            {staffTypes.map((staffType: any) => (
              <li
                key={staffType.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
              >
                {editingTypeId === staffType.id ? (
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-2">
                        <Input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="h-10"
                          placeholder="Staff Type name"
                          disabled={updateStaffTypeMutation.isPending}
                        />
                        {/* <Textarea
                          value={editedDescription}
                          onChange={(e) => setEditedDescription(e.target.value)}
                          placeholder="Description (optional)"
                          className="min-h-[60px]"
                          disabled={updateStaffTypeMutation.isPending}
                        /> */}
                      </div>
                      <div className="ml-4 flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(staffType.id)}
                          disabled={updateStaffTypeMutation.isPending || !editedName.trim()}
                          className="bg-green-600 hover:bg-green-700 h-9 w-9 p-0"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setEditingTypeId(null)}
                          variant="ghost"
                          disabled={updateStaffTypeMutation.isPending}
                          className="h-9 w-9 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {updateStaffTypeMutation.isPending && (
                      <p className="text-sm text-gray-500">Updating...</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{staffType.name || staffType.type}</p>
                        {staffType.description && (
                          <span className="text-sm text-gray-500">- {staffType.description}</span>
                        )}
                      </div>
                      {/* <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          ID: {staffType.id}
                        </span>
                        <span className="text-xs text-gray-500">
                          • Created: {new Date(staffType.created_at || Date.now()).toLocaleDateString()}
                        </span>
                      </div> */}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(staffType)}
                        className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Staff Type</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{staffType.name || staffType.type}"?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={deleteStaffTypeMutation.isPending}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(staffType.id)}
                              disabled={deleteStaffTypeMutation.isPending}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {deleteStaffTypeMutation.isPending ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <Plus className="h-12 w-12 mx-auto opacity-50" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No staff types found</h3>
            <p className="text-gray-500 mb-4">
              Get started by creating your first staff type.
            </p>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> Add Staff Type
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Staff Type</DialogTitle>
                </DialogHeader>
                <AddStaffTypeForm setOpen={setIsAddOpen} />
              </DialogContent>
            </Dialog>
          </div>
        )}
      
    </div>
  );
}