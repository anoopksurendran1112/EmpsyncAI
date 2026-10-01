import React from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActiveEmployee, LeaveType } from "../types";

interface PastLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pastLeaveForm: {
    user_id: string;
    from_date: string;
    to_date: string;
    leave_id: string;
    custom_reason: string;
    leave_choice: string;
    status: string;
  };
  setPastLeaveForm: React.Dispatch<
    React.SetStateAction<{
      user_id: string;
      from_date: string;
      to_date: string;
      leave_id: string;
      custom_reason: string;
      leave_choice: string;
      status: string;
    }>
  >;
  employees: ActiveEmployee[];
  isEmployeesLoading: boolean;
  leaveTypes: LeaveType[];
  isRequestSubmitting: boolean;
  pastLeaveMessage: { type: "success" | "error"; text: string } | null;
  onSubmit: (e: React.FormEvent) => void;
}

export default function PastLeaveDialog({
  open,
  onOpenChange,
  pastLeaveForm,
  setPastLeaveForm,
  employees,
  isEmployeesLoading,
  leaveTypes,
  isRequestSubmitting,
  pastLeaveMessage,
  onSubmit,
}: PastLeaveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add Past Leave Record</DialogTitle>
          <DialogDescription>Record a past leave for an employee (Past dates only)</DialogDescription>
        </DialogHeader>

        {pastLeaveMessage && (
          <div
            className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
              pastLeaveMessage.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {pastLeaveMessage.type === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {pastLeaveMessage.text}
          </div>
        )}

        <form onSubmit={onSubmit} className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="past_user_id">Employee *</Label>
            <Select
              value={pastLeaveForm.user_id}
              onValueChange={(val) => setPastLeaveForm({ ...pastLeaveForm, user_id: val })}
            >
              <SelectTrigger id="past_user_id">
                <SelectValue placeholder={isEmployeesLoading ? "Loading employees..." : "Select Employee"} />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id.toString()}>
                    {emp.first_name} {emp.last_name || ""}
                  </SelectItem>
                ))}
                {employees.length === 0 && !isEmployeesLoading && (
                  <SelectItem value="none" disabled>
                    No employees found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="past_from_date">From Date *</Label>
              <Input
                id="past_from_date"
                type="date"
                required
                value={pastLeaveForm.from_date}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setPastLeaveForm({ ...pastLeaveForm, from_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="past_to_date">To Date *</Label>
              <Input
                id="past_to_date"
                type="date"
                required
                value={pastLeaveForm.to_date}
                min={pastLeaveForm.from_date}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setPastLeaveForm({ ...pastLeaveForm, to_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="past_leave_id">Leave Type *</Label>
            <Select
              value={pastLeaveForm.leave_id}
              onValueChange={(val) => setPastLeaveForm({ ...pastLeaveForm, leave_id: val })}
            >
              <SelectTrigger id="past_leave_id">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((lt) => (
                  <SelectItem key={lt.id} value={lt.id.toString()}>
                    {lt.leave_type || lt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="past_leave_choice">Duration</Label>
              <Select
                value={pastLeaveForm.leave_choice}
                onValueChange={(val) => setPastLeaveForm({ ...pastLeaveForm, leave_choice: val })}
              >
                <SelectTrigger id="past_leave_choice">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_day">Full Day</SelectItem>
                  <SelectItem value="half_day">Half Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="past_status">Status</Label>
              <Select
                value={pastLeaveForm.status}
                onValueChange={(val) => setPastLeaveForm({ ...pastLeaveForm, status: val })}
              >
                <SelectTrigger id="past_status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Approved</SelectItem>
                  <SelectItem value="P">Pending</SelectItem>
                  <SelectItem value="R">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="past_reason">Reason (Optional)</Label>
            <textarea
              id="past_reason"
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter details..."
              value={pastLeaveForm.custom_reason}
              onChange={(e) => setPastLeaveForm({ ...pastLeaveForm, custom_reason: e.target.value })}
            ></textarea>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 text-white" disabled={isRequestSubmitting}>
              {isRequestSubmitting ? "Recording..." : "Record Leave"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
