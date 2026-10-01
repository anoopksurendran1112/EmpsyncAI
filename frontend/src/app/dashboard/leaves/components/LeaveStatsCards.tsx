import React from "react";
import {
  History,
  Clock,
  CalendarCheck,
  TrendingUp,
} from "lucide-react";
import { LeaveStats } from "../types";

interface LeaveStatsCardsProps {
  viewMode: "user" | "admin";
  leaveStats: LeaveStats;
}

export default function LeaveStatsCards({
  viewMode,
  leaveStats,
}: LeaveStatsCardsProps) {
  return (
    <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-1">
            {viewMode === "user"
              ? "Leaves Taken"
              : "Leaves Approved"}
          </h3>
          <p className="text-3xl font-bold text-blue-600">{leaveStats.leavesTaken}</p>
        </div>
        <div className="p-3 bg-blue-100 rounded-full">
          <History className="h-6 w-6 text-blue-600" />
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-1">Full Day</h3>
          <p className="text-3xl font-bold text-green-600">{leaveStats.fullDayLeaves}</p>
        </div>
        <div className="p-3 bg-green-100 rounded-full">
          <CalendarCheck className="h-6 w-6 text-green-600" />
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-1">Half Day</h3>
          <p className="text-3xl font-bold text-purple-600">{leaveStats.halfDayLeaves}</p>
        </div>
        <div className="p-3 bg-purple-100 rounded-full">
          <Clock className="h-6 w-6 text-purple-600" />
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-1">
            {viewMode === "user"
              ? "Pending"
              : "Pending Approvals"}
          </h3>
          <p className="text-3xl font-bold text-amber-600">{leaveStats.pendingRequests}</p>
        </div>
        <div className="p-3 bg-amber-100 rounded-full">
          <TrendingUp className="h-6 w-6 text-amber-600" />
        </div>
      </div>
    </div>
  );
}
