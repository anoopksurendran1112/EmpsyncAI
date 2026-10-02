import React from "react";
import { format } from "date-fns";
import { CheckCircle, AlertCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Holiday, CompanyRole } from "../types";
import { calculateDaysCount } from "../helpers";

interface HolidayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingHoliday: Holiday | null;
  setEditingHoliday: React.Dispatch<React.SetStateAction<Holiday | null>>;
  holidayForm: Holiday;
  setHolidayForm: React.Dispatch<React.SetStateAction<Holiday>>;
  roles: CompanyRole[];
  holidayErrors: Record<string, string>;
  isHolidaySubmitting: boolean;
  holidayMessage: { type: "success" | "error"; text: string } | null;
  onSubmit: (e: React.FormEvent) => void;
}

export default function HolidayDialog({
  open,
  onOpenChange,
  editingHoliday,
  setEditingHoliday,
  holidayForm,
  setHolidayForm,
  roles,
  holidayErrors,
  isHolidaySubmitting,
  holidayMessage,
  onSubmit,
}: HolidayDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {editingHoliday ? "Edit Holiday" : "Add Company Holiday"}
          </DialogTitle>
          <DialogDescription>
            {editingHoliday ? "Update holiday details" : "Add a public or company-wide holiday to the calendar"}
          </DialogDescription>
        </DialogHeader>

        {holidayMessage && (
          <div
            className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
              holidayMessage.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {holidayMessage.type === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {holidayMessage.text}
          </div>
        )}

        <form onSubmit={onSubmit} className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="h_name">Holiday Name *</Label>
            <Input
              id="h_name"
              placeholder="e.g. Independence Day"
              value={editingHoliday ? editingHoliday.holiday : holidayForm.holiday}
              onChange={(e) => {
                const val = e.target.value;
                if (editingHoliday) setEditingHoliday({ ...editingHoliday, holiday: val });
                else setHolidayForm({ ...holidayForm, holiday: val });
              }}
            />
            {holidayErrors.holiday && <p className="text-red-500 text-xs">{holidayErrors.holiday}</p>}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="multi_day_toggle" className="text-sm font-medium cursor-pointer">
              Multi-day Holiday
            </Label>
            <Switch
              id="multi_day_toggle"
              checked={editingHoliday ? editingHoliday.is_multi_day : holidayForm.is_multi_day}
              onCheckedChange={(checked) => {
                if (editingHoliday) setEditingHoliday({ ...editingHoliday, is_multi_day: checked });
                else setHolidayForm({ ...holidayForm, is_multi_day: checked });
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="h_date">
                {editingHoliday?.is_multi_day || holidayForm.is_multi_day ? "Start Date" : "Date"} *
              </Label>
              <Input
                id="h_date"
                type="date"
                value={editingHoliday ? editingHoliday.date : holidayForm.date}
                onChange={(e) => {
                  const val = e.target.value;
                  if (editingHoliday) setEditingHoliday({ ...editingHoliday, date: val });
                  else setHolidayForm({ ...holidayForm, date: val });
                }}
              />
              {holidayErrors.date && <p className="text-red-500 text-xs">{holidayErrors.date}</p>}
            </div>

            {(editingHoliday?.is_multi_day || holidayForm.is_multi_day) && (
              <div className="space-y-2">
                <Label htmlFor="h_end_date">End Date *</Label>
                <Input
                  id="h_end_date"
                  type="date"
                  value={editingHoliday ? editingHoliday.end_date : holidayForm.end_date}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (editingHoliday) setEditingHoliday({ ...editingHoliday, end_date: val });
                    else setHolidayForm({ ...holidayForm, end_date: val });
                  }}
                  min={editingHoliday ? editingHoliday.date : holidayForm.date}
                />
                {holidayErrors.end_date && <p className="text-red-500 text-xs">{holidayErrors.end_date}</p>}
                {(editingHoliday?.end_date && editingHoliday?.date) ||
                (holidayForm.end_date && holidayForm.date) ? (
                  <p className="text-[10px] text-green-600 font-semibold uppercase">
                    {calculateDaysCount(
                      editingHoliday ? editingHoliday.date : holidayForm.date,
                      editingHoliday ? editingHoliday.end_date || "" : holidayForm.end_date || ""
                    )}{" "}
                    days holiday
                  </p>
                ) : null}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="h_recurring"
                checked={editingHoliday ? editingHoliday.is_recurring : holidayForm.is_recurring}
                onCheckedChange={(checked) => {
                  if (editingHoliday) setEditingHoliday({ ...editingHoliday, is_recurring: checked });
                  else setHolidayForm({ ...holidayForm, is_recurring: checked });
                }}
              />
              <Label htmlFor="h_recurring" className="text-xs cursor-pointer">
                Recurring
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="h_full"
                checked={editingHoliday ? editingHoliday.is_full_holiday : holidayForm.is_full_holiday}
                onCheckedChange={(checked) => {
                  if (editingHoliday) setEditingHoliday({ ...editingHoliday, is_full_holiday: checked });
                  else setHolidayForm({ ...holidayForm, is_full_holiday: checked });
                }}
              />
              <Label htmlFor="h_full" className="text-xs cursor-pointer">
                Full Day
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="h_global"
                checked={editingHoliday ? editingHoliday.is_global : holidayForm.is_global}
                onCheckedChange={(checked) => {
                  if (editingHoliday) setEditingHoliday({ ...editingHoliday, is_global: checked });
                  else setHolidayForm({ ...holidayForm, is_global: checked });
                }}
              />
              <Label htmlFor="h_global" className="text-xs cursor-pointer">
                Global
              </Label>
            </div>
          </div>

          {!(editingHoliday ? editingHoliday.is_full_holiday : holidayForm.is_full_holiday) &&
            roles.length > 0 && (
              <div className="space-y-2">
                <Label>Applicable Roles</Label>
                <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg max-h-32 overflow-y-auto bg-gray-50">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`role-${role.id}`}
                        checked={
                          editingHoliday
                            ? editingHoliday.role_ids.includes(role.id)
                            : holidayForm.role_ids.includes(role.id)
                        }
                        onChange={(e) => {
                          const isEditing = !!editingHoliday;
                          const currentData = isEditing ? editingHoliday! : holidayForm;
                          const newRoles = e.target.checked
                            ? [...currentData.role_ids, role.id]
                            : currentData.role_ids.filter((id) => id !== role.id);

                          if (isEditing) setEditingHoliday({ ...editingHoliday!, role_ids: newRoles });
                          else setHolidayForm({ ...holidayForm, role_ids: newRoles });
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={`role-${role.id}`} className="text-xs text-gray-700 cursor-pointer">
                        {role.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 text-white min-w-[120px]"
              disabled={isHolidaySubmitting}
            >
              {isHolidaySubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {editingHoliday ? "Updating..." : "Saving..."}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {editingHoliday ? "Update Holiday" : "Add Holiday"}
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
