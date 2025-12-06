"use client";

import { useState } from "react";
import { useRoles } from "@/hooks/settings/useRoles";
import { useAddRole } from "@/hooks/settings/useAddRole";
import { useUpdateRole } from "@/hooks/settings/useUpdateRole";
import { useDeleteRole } from "@/hooks/settings/useDeleteRole";
import LoadingPage from "../../loading";
import { useAuth } from "@/context/AuthContext";

export default function RolesPage() {
  const { data, isLoading, isError } = useRoles();
  const { company } = useAuth();
  const addRoleMutation = useAddRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();

  const [newRole, setNewRole] = useState("");
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [editedRole, setEditedRole] = useState("");
  const [editedHours, setEditedHours] = useState<number | undefined>(undefined);

  if (isLoading) return <LoadingPage />;
  if (isError) return <p>Failed to load Roles</p>;

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole.trim() || !company?.id) return;

    addRoleMutation.mutate(
      {
        role: newRole.trim(),
        company_id: [company.id],
      },
      {
        onSuccess: () => {
          setNewRole("");
        },
      }
    );
  };

  const handleEdit = (role: any) => {
    setEditingRoleId(role.id);
    setEditedRole(role.role);
    setEditedHours(role.working_hour || 0);
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
    if (!confirm("Are you sure you want to delete this role?")) return;

    deleteRoleMutation.mutate(id);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Roles</h1>

      {/* Add Role Form */}
      <form onSubmit={handleAddRole} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
          placeholder="Enter new role"
          className="flex-1 border rounded-md p-2"
        />
        <button
          type="submit"
          disabled={addRoleMutation.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          {addRoleMutation.isPending ? "Adding..." : "Add"}
        </button>
      </form>

      {/* Roles List */}
      <ul className="space-y-2">
        {data && data.length > 0 ? (
          data.map((role: any) => (
            <li
              key={role.id}
              className="border p-4 rounded-md bg-gray-50 hover:bg-gray-100"
            >
              {editingRoleId === role.id ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <input
                    type="text"
                    value={editedRole}
                    onChange={(e) => setEditedRole(e.target.value)}
                    className="border p-2 rounded-md flex-1"
                    placeholder="Role name"
                  />
                  <input
                    type="number"
                    value={editedHours ?? ""}
                    onChange={(e) => setEditedHours(Number(e.target.value))}
                    placeholder="Working hours"
                    className="border p-2 rounded-md w-28"
                    min="0"
                    max="24"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(role.id)}
                      disabled={updateRoleMutation.isPending}
                      className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                      title="Save"
                    >
                      <CheckIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingRoleId(null)}
                      className="p-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 flex items-center gap-1"
                      title="Cancel"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <div className="flex-1">
                    <p className="font-medium text-lg">{role.role}</p>
                    <p className="text-sm text-gray-500">
                      Working Hours: {role.working_hour || "Not set"}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-3 sm:mt-0">
                    <button
                      onClick={() => handleEdit(role)}
                      className="p-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
                      title="Edit role"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(role.id)}
                      disabled={deleteRoleMutation.isPending}
                      className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                      title="Delete role"
                    >
                      {deleteRoleMutation.isPending ? (
                        <SpinnerIcon className="w-4 h-4" />
                      ) : (
                        <TrashIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">No roles found</p>
        )}
      </ul>

      {/* Feedback */}
      {addRoleMutation.isError && (
        <p className="text-red-500 mt-2">
          {(addRoleMutation.error as Error).message}
        </p>
      )}
      {updateRoleMutation.isError && (
        <p className="text-red-500 mt-2">
          {(updateRoleMutation.error as Error).message}
        </p>
      )}
      {deleteRoleMutation.isError && (
        <p className="text-red-500 mt-2">
          {(deleteRoleMutation.error as Error).message}
        </p>
      )}
    </div>
  );
}

// Icon Components
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
      />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 2v4m0 12v4m8-10h-4M6 12H2m15.364-7.364l-2.828 2.828M7.464 17.536l-2.828 2.828M17.536 7.464l2.828 2.828M6.344 17.656l-2.828 2.828"
      />
    </svg>
  );
}