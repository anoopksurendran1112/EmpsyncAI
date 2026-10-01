import React from "react";
import { format } from "date-fns";
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Holiday } from "../types";

interface AdminHolidaySectionProps {
  holidays: Holiday[];
  isHolidayLoading: boolean;
  onAddHoliday: () => void;
  onEditHoliday: (holiday: Holiday) => void;
  onDeleteHoliday: (id: string) => void;
}

export default function AdminHolidaySection({
  holidays,
  isHolidayLoading,
  onAddHoliday,
  onEditHoliday,
  onDeleteHoliday,
}: AdminHolidaySectionProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900">Holiday Calendar 2026</h3>
          <p className="text-xs text-gray-500">Public and company-wide holidays</p>
        </div>
        <Button
          onClick={onAddHoliday}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Holiday
        </Button>
      </div>

      <div className="grid gap-4">
        {isHolidayLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : holidays.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg bg-gray-50 border-gray-200">
            <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No holidays scheduled</p>
          </div>
        ) : (
          holidays.map((holiday) => (
            <div key={holiday.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:border-blue-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl border-2 border-red-100 bg-red-50 flex items-center justify-center flex-shrink-0 text-red-600">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-lg text-gray-900 leading-tight">{holiday.holiday}</h3>
                    <div className="flex gap-1">
                      {holiday.is_recurring && (
                        <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-600 border-none px-1.5 py-0">Recurring</Badge>
                      )}
                      {holiday.is_full_holiday && (
                        <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-600 border-none px-1.5 py-0">Full Day</Badge>
                      )}
                      {holiday.is_global && (
                        <Badge variant="secondary" className="text-[10px] bg-purple-50 text-purple-600 border-none px-1.5 py-0">Global</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-wider text-[11px]">
                    {holiday.end_date
                      ? `${format(new Date(holiday.date), "PPP")} - ${format(new Date(holiday.end_date), "PPP")}`
                      : format(new Date(holiday.date), "PPPP")
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-none pt-3 sm:pt-0">
                <div className="text-right hidden md:block">
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Applies To</p>
                  <p className="text-xs font-semibold text-gray-700">
                    {holiday.is_full_holiday ? "All Employees" : `${holiday.role_ids?.length || 0} Role(s)`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-blue-600 border-blue-100 bg-blue-50 hover:bg-blue-100"
                    onClick={() => onEditHoliday(holiday)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-red-600 border-red-100 bg-red-50 hover:bg-red-100"
                    onClick={() => holiday.id && onDeleteHoliday(holiday.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
