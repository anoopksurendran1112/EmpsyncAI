import React from "react";
import { format } from "date-fns";
import { CalendarCheck } from "lucide-react";
import { LeaveBalanceResponse } from "../types";

interface UserLeaveBalanceProps {
  leaveBalance: LeaveBalanceResponse | null;
  isLeaveBalanceLoading: boolean;
}

export default function UserLeaveBalance({
  leaveBalance,
  isLeaveBalanceLoading,
}: UserLeaveBalanceProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Leave Balance
          </h2>

          {leaveBalance && (
            <p className="text-sm text-gray-500 mt-1">
              {leaveBalance.user_name} • {leaveBalance.staff_category_name}
            </p>
          )}
        </div>

        {leaveBalance && (
          <p className="text-sm text-gray-500">
            {format(
              new Date(leaveBalance.year, leaveBalance.month - 1),
              "MMMM yyyy"
            )}
          </p>
        )}
      </div>

      {isLeaveBalanceLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full" />
        </div>
      ) : !leaveBalance || leaveBalance.balances.length === 0 ? (
        <div className="text-center py-10">
          <CalendarCheck className="h-10 w-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">
            No leave balance available
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leaveBalance.balances.map((balance) => (
            <div
              key={balance.leave_type_id}
              className="border border-gray-200 rounded-lg p-5 hover:border-blue-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                  {balance.short_name}
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900">
                    {balance.leave_type}
                  </h3>

                  <p className="text-xs text-gray-500">
                    {balance.short_name}
                  </p>
                </div>
              </div>

              <div className="text-center bg-gray-50 rounded-lg py-4 mb-4">
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Available
                </p>

                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {balance.available_balance}
                </p>

                <p className="text-xs text-gray-500">
                  days
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">
                    Monthly Limit
                  </p>
                  <p className="font-semibold text-gray-800">
                    {balance.monthly_limit}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Yearly Limit
                  </p>
                  <p className="font-semibold text-gray-800">
                    {balance.yearly_limit}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Monthly Taken
                  </p>
                  <p className="font-semibold text-gray-800">
                    {balance.monthly_taken.total}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Yearly Taken
                  </p>
                  <p className="font-semibold text-gray-800">
                    {balance.yearly_taken.total}
                  </p>
                </div>
              </div>

              {balance.use_credit && (
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Credit Balance
                  </span>

                  <span className="text-sm font-semibold text-green-600">
                    {balance.credit_balance ?? 0}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
