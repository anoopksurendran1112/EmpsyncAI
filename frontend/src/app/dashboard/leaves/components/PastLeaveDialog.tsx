"use client";

import React, { useRef, useState } from "react";
import { CheckCircle, AlertCircle, CalendarCheck, Upload, FileSpreadsheet, X, User } from "lucide-react";
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
    bulk_year?: string;
    bulk_snapshot_date?: string;
    bulk_expiry_date?: string;
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
      bulk_year?: string;
      bulk_snapshot_date?: string;
      bulk_expiry_date?: string;
    }>
  >;
  employees: ActiveEmployee[];
  isEmployeesLoading: boolean;
  leaveTypes: LeaveType[];
  isRequestSubmitting: boolean;
  pastLeaveMessage: { type: "success" | "error"; text: string } | null;
  onSubmit: (e: React.FormEvent) => void;
}

type Tab = "single" | "bulk";
type BulkStyle = "dates" | "balance";

/** Each bulk style has its own sample template (files live in /public/templates). */
const BULK_TEMPLATES: Record<BulkStyle, string> = {
  dates: "bulk_past_leaves_template.xlsx",
  balance: "bulk_balance_template.xlsx",
};

const ACCEPTED_EXTENSIONS = [".xlsx", ".csv"];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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
  const [activeTab, setActiveTab] = useState<Tab>("single");
  const [bulkStyle, setBulkStyle] = useState<BulkStyle>("dates");
  const [dragOver, setDragOver] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File) => {
    setUploadError(null);
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setUploadError("Only .xlsx or .csv files are accepted.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be under 5 MB.");
      return;
    }
    setUploadFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSetFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
    // Reset input so same file can be re-selected after removal
    e.target.value = "";
  };

  const clearFile = () => {
    setUploadFile(null);
    setUploadError(null);
  };

  const downloadTemplate = async (style: BulkStyle) => {
    setUploadError(null);
    const fileName = BULK_TEMPLATES[style];
    try {
      const res = await fetch(`/api/leave/templates/${style}`);
      if (!res.ok) {
        let message = "Could not download the template. Please try again later.";
        try {
          const body = await res.clone().json();
          if (body?.message) message = body.message;
        } catch {
          // keep the default message
        }
        setUploadError(message);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setUploadError("Could not download the template. Please try again later.");
    }
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      clearFile();
      setActiveTab("single");
      setBulkStyle("dates");
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add Past Leave Record</DialogTitle>
          <DialogDescription>
            Record a past leave for one employee, or import multiple records via Excel.
          </DialogDescription>
        </DialogHeader>

        {/* ── Tab switcher ── */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("single")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
              activeTab === "single"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            Single Entry
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bulk")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
              activeTab === "bulk"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Bulk Upload
          </button>
        </div>

        {/* ── Shared alert banner ── */}
        {pastLeaveMessage && activeTab === "single" && (
          <div
            className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
              pastLeaveMessage.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {pastLeaveMessage.type === "success" ? (
              <CheckCircle className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            {pastLeaveMessage.text}
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB 1 — Single Entry (existing form)
        ══════════════════════════════════════════ */}
        {activeTab === "single" && (
          <form onSubmit={onSubmit} className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="past_user_id">Employee *</Label>
              <Select
                value={pastLeaveForm.user_id}
                onValueChange={(val) => setPastLeaveForm({ ...pastLeaveForm, user_id: val })}
              >
                <SelectTrigger id="past_user_id">
                  <SelectValue
                    placeholder={isEmployeesLoading ? "Loading employees..." : "Select Employee"}
                  />
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
                  onChange={(e) =>
                    setPastLeaveForm({ ...pastLeaveForm, from_date: e.target.value })
                  }
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
                  onChange={(e) =>
                    setPastLeaveForm({ ...pastLeaveForm, to_date: e.target.value })
                  }
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
                  onValueChange={(val) =>
                    setPastLeaveForm({ ...pastLeaveForm, leave_choice: val })
                  }
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
                onChange={(e) =>
                  setPastLeaveForm({ ...pastLeaveForm, custom_reason: e.target.value })
                }
              ></textarea>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 text-white"
                disabled={isRequestSubmitting}
              >
                {isRequestSubmitting ? "Recording..." : "Record Leave"}
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* ══════════════════════════════════════════
            TAB 2 — Bulk Upload
        ══════════════════════════════════════════ */}
        {activeTab === "bulk" && (
          <div className="grid gap-6 py-4">
            {/* Bulk style switcher */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
              <button
                type="button"
                onClick={() => {
                  setBulkStyle("dates");
                  clearFile();
                }}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                  bulkStyle === "dates"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CalendarCheck className="h-3.5 w-3.5" />
                With Dates
              </button>
              <button
                type="button"
                onClick={() => {
                  setBulkStyle("balance");
                  clearFile();
                }}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                  bulkStyle === "balance"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Balance Count
              </button>
            </div>

            {/* Info banner per style */}
            {bulkStyle === "dates" ? (
              <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  Upload <strong>past leave records with dates</strong> for multiple employees.
                  Each row needs the employee&apos;s Staff ID, leave type and From/To dates. The
                  records are saved directly into the leave records — no snapshot or expiry date
                  is needed. Download the <strong>With Dates</strong> template below.
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  Upload <strong>opening balance counts</strong> — one value per employee &amp;
                  leave type. The balance is applied as of the <strong>uploading date</strong> and
                  remains in use through the <strong>expiry date</strong>. Download the{" "}
                  <strong>Balance Count</strong> template below.
                </div>
              </div>
            )}

            {/* Template download for the active style */}
            <div className="flex items-center justify-between rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileSpreadsheet className="h-4 w-4" />
                <span>{BULK_TEMPLATES[bulkStyle]}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="text-xs"
                onClick={() => downloadTemplate(bulkStyle)}
              >
                Download Template
              </Button>
            </div>

            {/* Drop zone */}
            {!uploadFile ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors duration-150 ${
                  dragOver
                    ? "border-blue-400 bg-blue-50"
                    : "border-muted-foreground/25 hover:border-blue-300 hover:bg-muted/40"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Drag &amp; drop your file here, or{" "}
                    <span className="text-blue-600 underline underline-offset-2">browse</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Accepted: .xlsx or .csv — Max 5 MB
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.csv"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>
            ) : (
              /* File preview card */
              <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-green-100">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-green-800">{uploadFile.name}</p>
                  <p className="text-xs text-green-600">{formatBytes(uploadFile.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-green-700 hover:bg-green-100 transition-colors"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Validation error */}
            {uploadError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {uploadError}
              </div>
            )}

            {/* Style-specific fields */}
            {bulkStyle === "dates" ? (
              <div className="rounded-lg border border-muted bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                No extra fields needed — the leave dates and leave types are read from the sheet
                itself.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulk_year">Year *</Label>
                    <Input
                      id="bulk_year"
                      type="number"
                      placeholder="e.g. 2026"
                      required
                      value={pastLeaveForm.bulk_year || new Date().getFullYear().toString()}
                      onChange={(e) =>
                        setPastLeaveForm({ ...pastLeaveForm, bulk_year: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bulk_snapshot_date">Uploading Date *</Label>
                    <Input
                      id="bulk_snapshot_date"
                      type="date"
                      required
                      value={pastLeaveForm.bulk_snapshot_date || ""}
                      onChange={(e) =>
                        setPastLeaveForm({ ...pastLeaveForm, bulk_snapshot_date: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      The opening balances are applied as of this date.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bulk_expiry_date">Expiry Date (Optional)</Label>
                  <Input
                    id="bulk_expiry_date"
                    type="date"
                    value={pastLeaveForm.bulk_expiry_date || ""}
                    min={pastLeaveForm.bulk_snapshot_date || undefined}
                    onChange={(e) =>
                      setPastLeaveForm({ ...pastLeaveForm, bulk_expiry_date: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    The imported balances stay in use through this date (e.g. end of the leave
                    year). If blank, they never expire. Existing rows are kept either way.
                  </p>
                </div>
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-blue-600 text-white"
                disabled={
                  !uploadFile ||
                  (bulkStyle === "balance" &&
                    (!pastLeaveForm.bulk_year || !pastLeaveForm.bulk_snapshot_date)) ||
                  isRequestSubmitting
                }
                onClick={async () => {
                  if (!uploadFile) return;
                  const formData = new FormData();
                  formData.append("file", uploadFile);
                  if (bulkStyle === "balance") {
                    formData.append(
                      "year",
                      pastLeaveForm.bulk_year || new Date().getFullYear().toString()
                    );
                    formData.append("snapshot_date", pastLeaveForm.bulk_snapshot_date || "");
                    if (pastLeaveForm.bulk_expiry_date) {
                      formData.append("expiry_date", pastLeaveForm.bulk_expiry_date);
                    }
                  }

                  const e = {
                    preventDefault: () => {},
                    formData: formData,
                    isBulk: true,
                    uploadStyle: bulkStyle,
                  } as unknown as React.FormEvent;
                  onSubmit(e);
                }}
              >
                {isRequestSubmitting
                  ? "Importing..."
                  : bulkStyle === "dates"
                  ? "Import Leave Records"
                  : "Import Balance Counts"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>

  );
}
