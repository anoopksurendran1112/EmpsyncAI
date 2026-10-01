import React from "react";
import {
  CheckCircle,
  AlertCircle,
} from "lucide-react";
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
import { LeaveType, LeavePolicy } from "../types";

interface ApplyLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestForm: {
    from_date: string;
    to_date: string;
    leave_id: string;
    custom_reason: string;
    leave_choice: string;
    replacement_user_id: string;
  };
  setRequestForm: (form: any) => void;
  leaveTypes: LeaveType[];
  selectedPolicy: LeavePolicy | undefined;
  replacementEmployees: { id: number; name: string; email: string }[];
  isReplacementEmployeesLoading: boolean;
  isRequestSubmitting: boolean;
  requestMessage: { type: "success" | "error"; text: string } | null;
  onSubmit: (e: React.FormEvent) => void;
}

export default function ApplyLeaveDialog({
  open,
  onOpenChange,
  requestForm,
  setRequestForm,
  leaveTypes,
  selectedPolicy,
  replacementEmployees,
  isReplacementEmployeesLoading,
  isRequestSubmitting,
  requestMessage,
  onSubmit,
}: ApplyLeaveDialogProps) {
  return (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">Apply for Leave</DialogTitle>
        <DialogDescription>Submit your leave application for approval</DialogDescription>
      </DialogHeader>

      {requestMessage && (
        <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
          requestMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700 text-left'
        }`}>
          {requestMessage.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{requestMessage.text}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="grid gap-6 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="from_date">From Date</Label>
            <Input
              id="from_date"
              type="date"
              required
              value={requestForm.from_date}
              onChange={(e) => setRequestForm({ ...requestForm, from_date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to_date">To Date</Label>
            <Input
              id="to_date"
              type="date"
              required
              value={requestForm.to_date}
              onChange={(e) => setRequestForm({ ...requestForm, to_date: e.target.value })}
              min={requestForm.from_date}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="leave_id">Leave Type</Label>
            <Select
              value={requestForm.leave_id}
              onValueChange={(val) => setRequestForm({ ...requestForm, leave_id: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map(lt => (
                  <SelectItem key={lt.id} value={lt.id.toString()}>{lt.leave_type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="leave_choice">Duration</Label>
            <Select
              value={requestForm.leave_choice}
              onValueChange={(val) => setRequestForm({ ...requestForm, leave_choice: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full_day">Full Day</SelectItem>
                <SelectItem value="half_day">Half Day</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedPolicy?.requires_replacement && (
          <div className="space-y-2">
            <Label htmlFor="replacement_user_id">
              Replacement Employee
            </Label>
            <Select
              value={requestForm.replacement_user_id}
              onValueChange={(val) =>
                setRequestForm({
                  ...requestForm,
                  replacement_user_id: val,
                })
              }
            >
              <SelectTrigger id="replacement_user_id">
                <SelectValue
                  placeholder={
                    isReplacementEmployeesLoading
                      ? "Loading employees..."
                      : "Select Replacement Employee"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {replacementEmployees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id.toString()}>
                    {emp.name}
                  </SelectItem>
                ))}

                {replacementEmployees.length === 0 &&
                  !isReplacementEmployeesLoading && (
                    <SelectItem value="none" disabled>
                      No eligible replacement employees found
                    </SelectItem>
                  )}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="reason">Reason for Leave</Label>
          <textarea
            id="reason"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Enter short details..."
            value={requestForm.custom_reason}
            onChange={(e) => setRequestForm({ ...requestForm, custom_reason: e.target.value })}
            required
          ></textarea>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            type="submit" 
            className="bg-blue-600 text-white" 
            disabled={isRequestSubmitting}
          >
            {isRequestSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
  );
}
