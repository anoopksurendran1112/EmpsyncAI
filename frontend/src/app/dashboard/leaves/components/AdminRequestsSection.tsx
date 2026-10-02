import React from "react";
import {
  Calendar,
  PlusCircle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LeaveRequest, PaginationState } from "../types";

interface AdminRequestsSectionProps {
  leaveRequests: LeaveRequest[];
  isRequestsLoading: boolean;
  statusMessage: { type: "success" | "error"; text: string } | null;
  pagination: PaginationState;
  onAddPastLeave: () => void;
  onUpdateStatus: (id: number, status: string) => void;
  onPageChange: (page: number) => void;
}

export default function AdminRequestsSection({
  leaveRequests,
  isRequestsLoading,
  statusMessage,
  pagination,
  onAddPastLeave,
  onUpdateStatus,
  onPageChange,
}: AdminRequestsSectionProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900">Manage Leave Requests</h3>
          <p className="text-xs text-gray-500">Approve or reject leave requests</p>
        </div>
        <Button onClick={onAddPastLeave} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
          <PlusCircle className="h-4 w-4 mr-2" /> Add Past Leave
        </Button>
      </div>

      {statusMessage && (
        <div className={`p-3 rounded-lg flex items-center gap-2 text-sm max-w-md mx-auto mb-4 ${statusMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
          {statusMessage.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {statusMessage.text}
        </div>
      )}

      <div className="grid gap-4">
        {isRequestsLoading ? (
          <div className="flex items-center justify-center py-12"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div></div>
        ) : leaveRequests.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg bg-gray-50 border-gray-200">
            <p className="text-gray-500">No leave requests found</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {leaveRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:bg-gray-50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl border-2 border-blue-100 bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-700 font-bold">
                      {req.user?.first_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 leading-tight">{req.user?.first_name} {req.user?.last_name || ""}</h3>
                      <p className="text-sm text-blue-600 font-semibold">{req.leave_type?.leave_type || req.leave_type?.name || "Leave"}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {req.from_date} to {req.to_date}
                      </p>
                      {req.status === 'P' && req.current_approver_detail && (
                        <p className="text-xs text-amber-600 font-medium mt-1">
                          Pending: {req.current_approver_detail.name} {req.hierarchy_total_levels ? `(Level ${(req.current_level || 0) + 1} of ${req.hierarchy_total_levels})` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {req.status === 'P' ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white min-w-[80px] shadow-sm h-8"
                          onClick={() => onUpdateStatus(req.id, "A")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-500 border-red-200 bg-red-50 hover:bg-red-100 min-w-[80px] h-8"
                          onClick={() => onUpdateStatus(req.id, "R")}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <Badge variant={req.status === 'A' ? 'default' : 'destructive'} className={req.status === 'A' ? 'bg-green-500' : ''}>
                          {req.status === 'A' ? 'Approved' : 'Rejected'}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-2 py-4 border-t mt-4">
                <div className="text-xs text-gray-500 font-medium">
                  Showing page {pagination.currentPage} of {pagination.totalPages} • {pagination.totalItems} total requests
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.currentPage === 1}
                    onClick={() => onPageChange(pagination.currentPage - 1)}
                    className="h-8 text-xs"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      // Simple pagination logic for 5 pages around current
                      let pageNum = pagination.currentPage <= 3
                        ? i + 1
                        : Math.min(pagination.currentPage - 2 + i, pagination.totalPages - 4 + i);

                      if (pageNum <= 0) pageNum = i + 1;
                      if (pageNum > pagination.totalPages) return null;

                      return (
                        <Button
                          key={pageNum}
                          variant={pagination.currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => onPageChange(pageNum)}
                          className={`h-8 w-8 text-xs p-0 ${pagination.currentPage === pageNum ? 'bg-blue-600' : ''}`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.currentPage === pagination.totalPages}
                    onClick={() => onPageChange(pagination.currentPage + 1)}
                    className="h-8 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
