import React from "react";
import {
  Plus,
  Edit2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeaveType } from "../types";

interface AdminLeaveTypesSectionProps {
  leaveTypes: LeaveType[];
  isLeaveTypeLoading: boolean;
  onAddType: () => void;
  onEditType: (type: LeaveType) => void;
  onDeleteType: (id: number) => void;
}

export default function AdminLeaveTypesSection({
  leaveTypes,
  isLeaveTypeLoading,
  onAddType,
  onEditType,
  onDeleteType,
}: AdminLeaveTypesSectionProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900">Configured Leave Types</h3>
          <p className="text-xs text-gray-500">Define how many days can be taken for each category</p>
        </div>
        <Button
          onClick={onAddType}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Leave Type
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLeaveTypeLoading ? (
          <div className="col-span-full flex justify-center py-12"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div></div>
        ) : leaveTypes.length === 0 ? (
          <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg bg-gray-50 border-gray-200 p-10">
            <p className="text-gray-500 italic">No leave types configured. Click "Add Leave Type" to get started.</p>
          </div>
        ) : (
          leaveTypes.map((type) => (
            <div key={type.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm group hover:border-blue-200 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold uppercase">
                  {type.short_name}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-600 border-blue-100 bg-blue-50 hover:bg-blue-100"
                    onClick={() => onEditType(type)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 border-red-100 bg-red-50 hover:bg-red-100"
                    onClick={() => onDeleteType(type.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <h4 className="font-bold text-gray-900">{type.leave_type}</h4>

              <div className="mt-2 mb-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${type.policy_mode === "normal"
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700"
                    }`}
                >
                  {type.policy_mode === "normal"
                    ? "Normal Policy"
                    : "Staff Category Policy"}
                </span>
              </div>

              {type.policy_mode === "normal" ? (
                <div className="mt-4 rounded-lg border overflow-hidden">

                      <div className="grid grid-cols-2 bg-gray-100 text-xs font-semibold px-3 py-2">
                        <span>Policy</span>
                        <span className="text-right">Value</span>
                      </div>

                      <div className="grid grid-cols-2 px-3 py-2 border-t text-sm">
                        <span>Monthly</span>
                        <span className="text-right">
                          {type.monthly_limit} {type.monthly_limit === 1 ? "Day" : "Days"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 px-3 py-2 border-t text-sm">
                        <span>Yearly</span>
                        <span className="text-right">
                          {type.yearly_limit} {type.yearly_limit === 1 ? "Day" : "Days"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 px-3 py-2 border-t text-sm">
                        <span>Initial Credit</span>
                        <span className="text-right">
                          {type.initial_credit}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 px-3 py-2 border-t text-sm">
                        <span>Leave Credit</span>
                        <span
                          className={`text-right font-medium ${
                            type.use_credit
                              ? "text-green-600"
                              : "text-red-500"
                          }`}
                        >
                          {type.use_credit ? "Enabled" : "Disabled"}
                        </span>
                      </div>

                    </div>
              ) : (
                <div className="mt-4 rounded-lg border overflow-hidden">

                  <div className="grid grid-cols-4 bg-gray-100 text-xs font-semibold px-3 py-2">
                    <span>Category</span>
                    <span className="text-center">M</span>
                    <span className="text-center">Y</span>
                    <span className="text-center">IC</span>
                  </div>

                  {(type.policies || []).map((policy) => (
                    <div
                      key={policy.staff_category_id}
                      className="grid grid-cols-4 items-center px-3 py-2 border-t text-sm"
                    >
                      <span className="font-medium truncate">
                        {policy.staff_category_name}
                      </span>

                      <span className="text-center">
                        {policy.monthly_limit}
                      </span>

                      <span className="text-center">
                        {policy.yearly_limit}
                      </span>

                      <span className="text-center">
                        {policy.initial_credit}
                      </span>
                    </div>
                  ))}

                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
