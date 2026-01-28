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
import { AddStaffCategoryForm } from "./add-staff-category-form";
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
import LoadingPage from "@/app/dashboard/loading";
import { useAuth } from "@/context/AuthContext";
import { useStaffCategories } from "@/hooks/settings/staff_category/useStaffCategories";
import { useUpdateStaffCategory } from "@/hooks/settings/staff_category/useUpdateStaffCategory";
import { useDeleteStaffCategory } from "@/hooks/settings/staff_category/useDeleteStaffCategory";
import { toast } from "sonner";

export default function StaffCategoriesPage() {
  const { company } = useAuth();
  const { data: staffCategoriesData, isLoading, isError } = useStaffCategories();
  const updateStaffCategoryMutation = useUpdateStaffCategory();
  const deleteStaffCategoryMutation = useDeleteStaffCategory();

  const [editingCategoryId, setEditingCategoryId] = useState<number | string | null>(null);
  const [editedName, setEditedName] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Extract staff categories from the response data
  const staffCategories = staffCategoriesData?.categories || staffCategoriesData?.data || staffCategoriesData || [];

  const handleEdit = (staffCategory: any) => {
    setEditingCategoryId(staffCategory.id);
    setEditedName(staffCategory.name || staffCategory.category);
  };

  const handleUpdate = (id: number | string) => {
    if (!editedName.trim()) {
      toast.error("Staff category name is required");
      return;
    }

    if (!company?.id) {
      toast.error("Company information not available");
      return;
    }

    updateStaffCategoryMutation.mutate({
      companyId: company.id,
      id: id,
      category_name: editedName.trim(),
    }, {
      onSuccess: (response) => {
        toast.success(response.message || "Staff category updated successfully!");
        setEditingCategoryId(null);
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

    deleteStaffCategoryMutation.mutate({
      companyId: company.id,
      id: id,
    }, {
      onError: (error) => {
        toast.error(error.message);
      }
    });
  };

  if (isLoading) return <LoadingPage />;
  if (isError) return <p className="text-red-500 p-4">Failed to load Staff Categories</p>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Staff Categories</h1>
          <p className="text-gray-500 text-sm mt-1">Manage different categories of staff in your organization</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Add Staff Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Staff Category</DialogTitle>
            </DialogHeader>
            <AddStaffCategoryForm setOpen={setIsAddOpen} />
          </DialogContent>
        </Dialog>
      </div>

      
        {staffCategories.length > 0 ? (
          <div className="space-y-2">
            {staffCategories.map((staffCategory: any) => (
              <div
                key={staffCategory.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
              >
                {editingCategoryId === staffCategory.id ? (
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-2">
                        <Input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="h-10"
                          placeholder="Staff Category name"
                          disabled={updateStaffCategoryMutation.isPending}
                        />
                      </div>
                      <div className="ml-4 flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(staffCategory.id)}
                          disabled={updateStaffCategoryMutation.isPending || !editedName.trim()}
                          className="bg-green-600 hover:bg-green-700 h-9 w-9 p-0"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setEditingCategoryId(null)}
                          variant="ghost"
                          disabled={updateStaffCategoryMutation.isPending}
                          className="h-9 w-9 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {updateStaffCategoryMutation.isPending && (
                      <p className="text-sm text-gray-500">Updating...</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{staffCategory.name || staffCategory.category}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(staffCategory)}
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
                            <AlertDialogTitle>Delete Staff Category</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{staffCategory.name || staffCategory.category}"?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={deleteStaffCategoryMutation.isPending}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(staffCategory.id)}
                              disabled={deleteStaffCategoryMutation.isPending}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {deleteStaffCategoryMutation.isPending ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <Plus className="h-12 w-12 mx-auto opacity-50" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No staff categories found</h3>
            <p className="text-gray-500 mb-4">
              Get started by creating your first staff category.
            </p>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> Add Staff Category
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Staff Category</DialogTitle>
                </DialogHeader>
                <AddStaffCategoryForm setOpen={setIsAddOpen} />
              </DialogContent>
            </Dialog>
          </div>
        )}

    </div>
  );
}