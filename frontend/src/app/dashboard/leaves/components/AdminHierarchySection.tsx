import React from "react";
import {
  Plus,
  Trash2,
  GripVertical,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HierarchyEmployee } from "../types";

interface AdminHierarchySectionProps {
  hierarchySelectionType: "user" | "role";
  setHierarchySelectionType: (value: "user" | "role") => void;
  hierarchySearch: string;
  setHierarchySearch: (value: string) => void;
  selectedHierarchyEmployeeId: string;
  setSelectedHierarchyEmployeeId: (value: string) => void;
  selectedHierarchyRole: string;
  setSelectedHierarchyRole: (value: string) => void;
  filteredHierarchyEmployees: HierarchyEmployee[];
  isHierarchyEmployeesLoading: boolean;
  handleSelectHierarchyEmployee: (employee: HierarchyEmployee) => void;
  handleAddEmployeeToHierarchy: () => void;
  leaveHierarchy: HierarchyEmployee[];
  setLeaveHierarchy: React.Dispatch<React.SetStateAction<HierarchyEmployee[]>>;
  hierarchyEmployees: HierarchyEmployee[];
  draggedHierarchyIndex: number | null;
  setDraggedHierarchyIndex: (index: number | null) => void;
  handleHierarchyDrop: (dropIndex: number) => void;
  isHierarchySaving: boolean;
  handleSaveHierarchy: () => void;
  fetchLeaveHierarchy: () => Promise<void>;
  companyRoles: any[];
}

export default function AdminHierarchySection({
  hierarchySelectionType,
  setHierarchySelectionType,
  hierarchySearch,
  setHierarchySearch,
  selectedHierarchyEmployeeId,
  setSelectedHierarchyEmployeeId,
  selectedHierarchyRole,
  setSelectedHierarchyRole,
  filteredHierarchyEmployees,
  isHierarchyEmployeesLoading,
  handleSelectHierarchyEmployee,
  handleAddEmployeeToHierarchy,
  leaveHierarchy,
  setLeaveHierarchy,
  hierarchyEmployees,
  draggedHierarchyIndex,
  setDraggedHierarchyIndex,
  handleHierarchyDrop,
  isHierarchySaving,
  handleSaveHierarchy,
  fetchLeaveHierarchy,
  companyRoles,
}: AdminHierarchySectionProps) {
  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-center gap-2 w-[220px]">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Select By
          </label>

          <Select
            value={hierarchySelectionType}
            onValueChange={(value: "user" | "role") => {
              setHierarchySelectionType(value);
              setHierarchySearch("");
              setSelectedHierarchyEmployeeId("");
              setSelectedHierarchyRole("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="role">Role</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hierarchySelectionType === "user" && (
          <div className="relative flex-1 -ml-20">
            <Input
              placeholder="Search employee..."
              value={hierarchySearch}
              onChange={(e) => {
                setHierarchySearch(e.target.value);
                setSelectedHierarchyEmployeeId("");
              }}
            />


            {hierarchySearch && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border bg-white shadow-lg">
                {isHierarchyEmployeesLoading ? (
                  <p className="px-3 py-2 text-sm text-gray-500">
                    Loading employees...
                  </p>
                ) : filteredHierarchyEmployees.length > 0 ? (
                  filteredHierarchyEmployees.map((employee) => (
                    <button
                      key={employee.id}
                      type="button"
                      onClick={() => handleSelectHierarchyEmployee(employee)}
                      className="block w-full px-3 py-2 text-left hover:bg-gray-50"
                    >
                      <p className="text-sm font-medium">{employee.name}</p>

                      <p className="text-xs text-gray-500">
                        {employee.role} • {employee.email}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-sm text-gray-500">
                    No employees found
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {hierarchySelectionType === "role" && (
          <div className="relative flex-1 -ml-20">
            <Select
              value={selectedHierarchyRole}
              onValueChange={setSelectedHierarchyRole}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select employee role" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="Company Head">
                  Company Head
                </SelectItem>

                <SelectItem value="Team Lead">
                  Team Lead
                </SelectItem>

                <div className="my-1 h-0.5 bg-gray-300" />

                {/* Combined dynamic roles from both companyRoles and hierarchyEmployees */}
                {companyRoles.map((role: any) => (
                  <SelectItem key={role.id} value={role.role}>
                    {role.role}
                  </SelectItem>
                ))}

                {Array.from(
                  new Set(hierarchyEmployees.map((employee) => employee.role))
                )
                  .filter((role) => !companyRoles.some((cr: any) => cr.role === role)) // Avoids duplicates
                  .map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button onClick={handleAddEmployeeToHierarchy}>
          <Plus className="h-4 w-4 mr-2" />
          Add to Flow
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-visible">
        <div className="grid grid-cols-[48px_120px_150px_1.2fr_1fr_80px] items-center gap-4 bg-gray-50 border-b border-gray-200 px-4 py-3">
          <div></div>

          <p className="text-xs font-semibold text-gray-600 uppercase -ml-4">
            Approval Levels
          </p>

          <p className="text-xs font-semibold text-gray-600 uppercase -ml-4">
            Selection Type
          </p>

          <p className="text-xs font-semibold text-gray-600 uppercase -ml-9">
            Hierarchy Name
          </p>

          <p className="text-xs font-semibold text-gray-600 uppercase -mr-4">
            Details
          </p>

          <p className="text-xs font-semibold text-gray-600 uppercase text-right">
            Actions
          </p>
        </div>

        {leaveHierarchy.map((employee, index) => (
          <div
            key={employee.id}
            draggable
            onDragStart={() => setDraggedHierarchyIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              handleHierarchyDrop(index);
              setDraggedHierarchyIndex(null);
            }}
            onDragEnd={() => setDraggedHierarchyIndex(null)}
            className={`group grid grid-cols-[48px_120px_150px_1.2fr_1fr_80px] items-center min-h-[84px] px-4 border-b border-gray-100 transition-all duration-200 ${draggedHierarchyIndex === index
              ? "bg-blue-200/70 ring-1 ring-inset ring-blue-400 shadow-md"
              : "bg-white hover:bg-blue-100/70 hover:shadow-sm"
              }`}
          >
            <div className="flex items-center">
              <GripVertical
                className={`h-4 w-4 cursor-grab transition-colors active:cursor-grabbing ${draggedHierarchyIndex === index
                  ? "text-blue-700"
                  : "text-gray-400 group-hover:text-blue-600"
                  }`}
              />
            </div>

            <div className="flex items-center">
              <Badge
                variant="secondary"
                className="bg-blue-50 text-blue-600 border-none"
              >
                Level {index + 1}
              </Badge>
            </div>
            <p className="text-sm font-medium text-gray-700 ml-5">
              {employee.id.startsWith("role-") ? "Role" : "User"}
            </p>

            <div>
              <p className="text-sm font-semibold text-gray-900 ml-3">
                {employee.name}
              </p>
              {!employee.id.startsWith("role-") && (
                <p className="text-xs text-gray-500 ml-3">
                  {employee.email}
                </p>
              )}
            </div>

            <p className="text-sm text-gray-700">
              {employee.id.startsWith("role-")
                ? `${hierarchyEmployees.filter(
                  (item) => item.role === employee.name
                ).length} employee(s)`
                : employee.role}
            </p>

            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-red-600 bg-red-50 hover:bg-red-100"
                onClick={() =>
                  setLeaveHierarchy((prev) =>
                    prev.filter((item) => item.id !== employee.id)
                  )
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button
          variant="outline"
          disabled={isHierarchySaving}
          onClick={async () => {
            await fetchLeaveHierarchy();
            const { toast } = await import("sonner");
            toast.success("Changes discarded");
          }}
        >
          Discard Changes
        </Button>

        <Button
          className="bg-blue-600 text-white"
          disabled={isHierarchySaving}
          onClick={handleSaveHierarchy}
        >
          {isHierarchySaving ? "Saving..." : "Save Hierarchy"}
        </Button>
      </div>
    </>
  );
}
