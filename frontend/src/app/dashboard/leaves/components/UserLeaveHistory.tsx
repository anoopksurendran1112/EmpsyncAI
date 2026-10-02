import React from "react";
import { format } from "date-fns";
import {
  History,
  Settings,
  CalendarCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LeaveRequest } from "../types";

interface UserLeaveHistoryProps {
  myLeaves: LeaveRequest[];
  isAdmin: boolean | null;
  viewMode: "user" | "admin";
  onToggleViewMode: () => void;
}

export default function UserLeaveHistory({
  myLeaves,
  isAdmin,
  viewMode,
  onToggleViewMode,
}: UserLeaveHistoryProps) {
  return (
    <>
      {/* Recent Leave History */}
      <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-1">
              <History className="h-5 w-5 text-gray-600" />
              Recent Leave History
            </h1>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
              {isAdmin && (
                <Button
                  variant="outline"
                  className="border-gray-200 hover:bg-gray-50 bg-white shadow-sm"
                  onClick={onToggleViewMode}
                >
                  {viewMode === "user" ? (
                    <>
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Leaves
                    </>
                  ) : (
                    <>
                      <CalendarCheck className="h-4 w-4 mr-2" />
                      My Leaves
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-4">
            {myLeaves.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                <History className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No leave history found</p>
              </div>
            ) : (
              myLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:bg-gray-50 cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                    <div className="h-14 w-14 rounded-xl border-2 border-blue-100 bg-blue-50 flex flex-col items-center justify-center flex-shrink-0 text-blue-700">
                      <span className="text-xl font-bold leading-none">
                        {new Date(leave.from_date).getDate()}
                      </span>
                      <span className="text-xs font-semibold uppercase mt-1">
                        {format(new Date(leave.from_date), "MMM")}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 leading-tight">
                        {leave.leave_type?.leave_type || leave.leave_type?.name || "Leave"}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                        {leave.from_date} to {leave.to_date}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 italic line-clamp-1">"{leave.custom_reason || "No reason provided"}"</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge variant={
                      leave.status === 'A' ? 'default' :
                        leave.status === 'P' ? 'secondary' :
                          'destructive'
                    } className={
                      leave.status === 'A' ? 'bg-green-500' :
                        leave.status === 'P' ? 'bg-amber-500 text-white border-none' :
                          ''
                    }>
                      {leave.status === 'A' ? 'Approved' : leave.status === 'P' ? 'Pending' : 'Rejected'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
    </>
  );
}
