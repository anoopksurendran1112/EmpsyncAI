import React from "react";
import {
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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
import {
  LeaveTypeFormData,
  EditableLeaveType,
  LeavePolicy,
  CarryForwardExpiry,
  CustomExpiryUnit,
} from "../types";
import {
  monthNames,
  getMonthDayFromDate,
  getMaxDaysForMonth,
  createYearlessDateString,
} from "../helpers";

interface AddLeaveTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingLeaveType: EditableLeaveType | null;
  setEditingLeaveType: React.Dispatch<React.SetStateAction<EditableLeaveType | null>>;
  leaveTypeForm: LeaveTypeFormData;
  setLeaveTypeForm: React.Dispatch<React.SetStateAction<LeaveTypeFormData>>;
  activePolicyTab: number;
  setActivePolicyTab: (tab: number) => void;
  leaveTypeSections: Record<string, boolean>;
  toggleLeaveTypeSection: (key: string) => void;
  updateLeaveTypeField: <T extends keyof LeaveTypeFormData>(field: T, value: LeaveTypeFormData[T]) => void;
  updateLeaveTypeFields: (updates: Partial<LeaveTypeFormData>) => void;
  isLeaveTypeSubmitting: boolean;
  leaveTypeMessage: { type: "success" | "error"; text: string } | null;
  onSubmit: (e: React.FormEvent) => void;
}

export default function AddLeaveTypeDialog({
  open,
  onOpenChange,
  editingLeaveType,
  setEditingLeaveType,
  leaveTypeForm,
  setLeaveTypeForm,
  activePolicyTab,
  setActivePolicyTab,
  leaveTypeSections,
  toggleLeaveTypeSection,
  updateLeaveTypeField,
  updateLeaveTypeFields,
  isLeaveTypeSubmitting,
  leaveTypeMessage,
  onSubmit,
}: AddLeaveTypeDialogProps) {
  const activeLeaveType = editingLeaveType ?? leaveTypeForm;

  const renderLeaveTypeSection = ({
    key,
    title,
    children,
  }: {
    key: string;
    title: string;
    children: React.ReactNode;
  }) => {
    const isOpen = !leaveTypeSections[key];

    return (
      <div className="rounded-xl border bg-card overflow-hidden">
        <button
          type="button"
          onClick={() => toggleLeaveTypeSection(key)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
        >
          <span className="text-sm font-semibold text-foreground">{title}</span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {isOpen && <div className="border-t px-4 pb-4 pt-4 space-y-4">{children}</div>}
      </div>
    );
  };

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingLeaveType ? "Edit Leave Type" : "Add Leave Type"}
            </DialogTitle>
            <DialogDescription>Define a new leave category and its limits</DialogDescription>
          </DialogHeader>

          {leaveTypeMessage && (
            <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${leaveTypeMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700 text-left'
              }`}>
              {leaveTypeMessage.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {leaveTypeMessage.text}
            </div>
          )}

          <form onSubmit={onSubmit} className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label>Type Name *</Label>
              <Input
                placeholder="e.g. Sick Leave"
                value={editingLeaveType ? editingLeaveType.leave_type : leaveTypeForm.leave_type}
                onChange={(e) => {
                  const val = e.target.value;
                  if (editingLeaveType) setEditingLeaveType({ ...editingLeaveType, leave_type: val });
                  else setLeaveTypeForm({ ...leaveTypeForm, leave_type: val });
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Short Name *</Label>
              <Input
                placeholder="e.g. SL"
                value={editingLeaveType ? editingLeaveType.short_name : leaveTypeForm.short_name}
                onChange={(e) => {
                  const val = e.target.value;
                  if (editingLeaveType) setEditingLeaveType({ ...editingLeaveType, short_name: val });
                  else setLeaveTypeForm({ ...leaveTypeForm, short_name: val });
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Policy Type</Label>

              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="normal"
                    checked={
                      (editingLeaveType
                        ? editingLeaveType.policy_mode
                        : leaveTypeForm.policy_mode) === "normal"
                    }
                    onChange={() => {
                      if (editingLeaveType) {
                        setEditingLeaveType({
                          ...editingLeaveType,
                          policy_mode: "normal",
                        });
                      } else {
                        setLeaveTypeForm({
                          ...leaveTypeForm,
                          policy_mode: "normal",
                        });
                      }
                    }}
                  />
                  Normal
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="staff_category"
                    checked={
                      (editingLeaveType
                        ? editingLeaveType.policy_mode
                        : leaveTypeForm.policy_mode) === "staff_category"
                    }
                    onChange={() => {
                      if (editingLeaveType) {
                        setEditingLeaveType({
                          ...editingLeaveType,
                          policy_mode: "staff_category",
                        });
                      } else {
                        setLeaveTypeForm({
                          ...leaveTypeForm,
                          policy_mode: "staff_category",
                        });
                      }
                    }}
                  />
                  Staff Category Policy
                </label>
              </div>
            </div>

            {/* NORMAL POLICY MODE */}
            {(editingLeaveType ? editingLeaveType.policy_mode : leaveTypeForm.policy_mode) === "normal" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Monthly Limit</Label>
                    <Input
                      type="number"
                      value={
                        editingLeaveType
                          ? editingLeaveType.monthly_limit
                          : leaveTypeForm.monthly_limit
                      }
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        if (editingLeaveType)
                          setEditingLeaveType({
                            ...editingLeaveType,
                            monthly_limit: val,
                          });
                        else
                          setLeaveTypeForm({
                            ...leaveTypeForm,
                            monthly_limit: val,
                          });
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Yearly Limit</Label>
                    <Input
                      type="number"
                      value={
                        editingLeaveType
                          ? editingLeaveType.yearly_limit
                          : leaveTypeForm.yearly_limit
                      }
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        if (editingLeaveType)
                          setEditingLeaveType({
                            ...editingLeaveType,
                            yearly_limit: val,
                          });
                        else
                          setLeaveTypeForm({
                            ...leaveTypeForm,
                            yearly_limit: val,
                          });
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Initial Credit</Label>
                  <Input
                    type="number"
                    value={
                      editingLeaveType
                        ? editingLeaveType.initial_credit
                        : leaveTypeForm.initial_credit
                    }
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      if (editingLeaveType)
                        setEditingLeaveType({
                          ...editingLeaveType,
                          initial_credit: val,
                        });
                      else
                        setLeaveTypeForm({
                          ...leaveTypeForm,
                          initial_credit: val,
                        });
                    }}
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    id="use_credit"
                    checked={
                      editingLeaveType
                        ? editingLeaveType.use_credit
                        : leaveTypeForm.use_credit
                    }
                    onCheckedChange={(checked) => {
                      if (editingLeaveType)
                        setEditingLeaveType({
                          ...editingLeaveType,
                          use_credit: checked,
                        });
                      else
                        setLeaveTypeForm({
                          ...leaveTypeForm,
                          use_credit: checked,
                        });
                    }}
                  />
                  <Label htmlFor="use_credit">Enable Leave Credit</Label>
                </div>
              </>
            )}

            {/* STAFF CATEGORY POLICY MODE */}
            {(editingLeaveType ? editingLeaveType.policy_mode : leaveTypeForm.policy_mode) === "staff_category" && (
              <>
                <hr className="my-2" />

                <div className="space-y-5">
                  <h3 className="font-semibold text-sm border-b pb-2">
                    Staff Category Policies
                  </h3>

                  {(() => {
                    const policies = editingLeaveType
                      ? editingLeaveType.policies || []
                      : leaveTypeForm.policies || [];

                    const policy = policies[activePolicyTab];

                    if (!policy) return null;

                    return (
                      <>
                        {/* Tabs */}
                        <div className="flex flex-wrap gap-2">
                          {policies.map((p, index) => (
                            <Button
                              key={p.staff_category_id}
                              type="button"
                              size="sm"
                              variant={activePolicyTab === index ? "default" : "outline"}
                              onClick={() => setActivePolicyTab(index)}
                            >
                              {p.staff_category_name}
                            </Button>
                          ))}
                        </div>

                        {/* Active Policy */}
                        <div className="rounded-lg border p-4 mt-3 space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label>Monthly</Label>
                              <Input
                                type="number"
                                value={policy.monthly_limit}
                                onChange={(e) => {
                                  const updated = [...policies];
                                  updated[activePolicyTab].monthly_limit = Number(e.target.value);

                                  if (editingLeaveType) {
                                    setEditingLeaveType({
                                      ...editingLeaveType,
                                      policies: updated,
                                    });
                                  } else {
                                    setLeaveTypeForm({
                                      ...leaveTypeForm,
                                      policies: updated,
                                    });
                                  }
                                }}
                              />
                            </div>

                            <div>
                              <Label>Yearly</Label>
                              <Input
                                type="number"
                                value={policy.yearly_limit}
                                onChange={(e) => {
                                  const updated = [...policies];
                                  updated[activePolicyTab].yearly_limit = Number(e.target.value);

                                  if (editingLeaveType) {
                                    setEditingLeaveType({
                                      ...editingLeaveType,
                                      policies: updated,
                                    });
                                  } else {
                                    setLeaveTypeForm({
                                      ...leaveTypeForm,
                                      policies: updated,
                                    });
                                  }
                                }}
                              />
                            </div>

                            <div>
                              <Label>Initial Credit</Label>
                              <Input
                                type="number"
                                value={policy.initial_credit}
                                onChange={(e) => {
                                  const updated = [...policies];
                                  updated[activePolicyTab].initial_credit = Number(e.target.value);

                                  if (editingLeaveType) {
                                    setEditingLeaveType({
                                      ...editingLeaveType,
                                      policies: updated,
                                    });
                                  } else {
                                    setLeaveTypeForm({
                                      ...leaveTypeForm,
                                      policies: updated,
                                    });
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </>
            )}

            {renderLeaveTypeSection({
              key: "description",
              title: "Description and Eligibility",
              children: (
                <>
                  <textarea
                    className="w-full min-h-[90px] rounded-md border px-3 py-2 text-sm"
                    placeholder="Describe this leave policy"
                    value={activeLeaveType.description}
                    onChange={(e) => updateLeaveTypeField("description", e.target.value)}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Employee Type</Label>
                      <select className="w-full rounded-md border px-3 py-2 text-sm" value={activeLeaveType.employee_type} onChange={(e) => updateLeaveTypeField("employee_type", e.target.value)}>
                        <option>All Employee Types</option>
                        <option>Permanent</option>
                        <option>Contract</option>
                        <option>Temporary</option>
                        <option>Visiting</option>
                        <option>Probationary</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <select className="w-full rounded-md border px-3 py-2 text-sm" value={activeLeaveType.department} onChange={(e) => updateLeaveTypeField("department", e.target.value)}>
                        <option>All Departments</option>
                        <option>Administration</option>
                        <option>Teaching</option>
                        <option>Technical</option>
                        <option>Finance</option>
                        <option>HR</option>
                        <option>IT</option>
                        <option>Operations</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Employment Status</Label>
                      <select className="w-full rounded-md border px-3 py-2 text-sm" value={activeLeaveType.employment_status} onChange={(e) => updateLeaveTypeField("employment_status", e.target.value)}>
                        <option>Active</option>
                        <option>Probation</option>
                        <option>On Notice Period</option>
                        <option>All</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Designation</Label>
                      <Input value={activeLeaveType.designation} onChange={(e) => updateLeaveTypeField("designation", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Work Location / Branch</Label>
                      <Input value={activeLeaveType.work_location} onChange={(e) => updateLeaveTypeField("work_location", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Minimum Service</Label>
                      <div className="flex gap-2">
                        <Input type="number" min="0" value={activeLeaveType.service_period_value} onChange={(e) => updateLeaveTypeField("service_period_value", e.target.value)} />
                        <select className="rounded-md border px-2 text-sm" value={activeLeaveType.service_period_unit} onChange={(e) => updateLeaveTypeField("service_period_unit", e.target.value as LeaveTypeFormData["service_period_unit"])}>
                          <option value="months">Months</option>
                          <option value="days">Days</option>
                          <option value="years">Years</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Waiting Period Rule</Label>
                      <select className="w-full rounded-md border px-3 py-2 text-sm" value={activeLeaveType.waiting_rule} onChange={(e) => updateLeaveTypeField("waiting_rule", e.target.value)}>
                        <option>LOP only</option>
                        <option>No leave allowed</option>
                        <option>Selected leave types allowed</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Entitlement Period</Label>
                      <select className="w-full rounded-md border px-3 py-2 text-sm" value={activeLeaveType.entitlement_period} onChange={(e) => updateLeaveTypeField("entitlement_period", e.target.value)}>
                        <option>Monthly</option>
                        <option>Yearly</option>
                        <option>Academic Year</option>
                        <option>Financial Year</option>
                        <option>One Time</option>
                        <option>Unlimited</option>
                      </select>
                    </div>
                  </div>
                </>
              ),
            })}

            {renderLeaveTypeSection({
              key: "entitlement",
              title: "Entitlement and Usage Rules",
              children: (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Limit Measured In</Label>
                      <select className="w-full rounded-md border px-3 py-2 text-sm" value={activeLeaveType.limit_unit} onChange={(e) => updateLeaveTypeField("limit_unit", e.target.value)}>
                        <option>Days</option>
                        <option>Hours</option>
                        <option>Occurrences</option>
                        <option>Applications</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Limit</Label>
                      <Input type="number" min="0" step="0.5" value={activeLeaveType.limit_value} onChange={(e) => updateLeaveTypeField("limit_value", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Credit Method</Label>
                      <select className="w-full rounded-md border px-3 py-2 text-sm" value={activeLeaveType.credit_method} onChange={(e) => updateLeaveTypeField("credit_method", e.target.value)}>
                        <option>Monthly</option>
                        <option>At Joining</option>
                        <option>Yearly</option>
                        <option>After Completing Service</option>
                        <option>Manual</option>
                        <option>No Credit Required</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Allowed Duration</Label>
                      <select className="w-full rounded-md border px-3 py-2 text-sm" value={activeLeaveType.allowed_duration} onChange={(e) => updateLeaveTypeField("allowed_duration", e.target.value)}>
                        <option>Full Day &amp; Half Day</option>
                        <option>Full Day Only</option>
                        <option>Hours</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Minimum Duration</Label>
                      <Input type="number" min="0" step="0.5" value={activeLeaveType.minimum_duration} onChange={(e) => updateLeaveTypeField("minimum_duration", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Maximum per Application</Label>
                      <Input type="number" min="0" step="0.5" value={activeLeaveType.maximum_per_application ?? ""} onChange={(e) => updateLeaveTypeField("maximum_per_application", e.target.value || null)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Maximum Consecutive Days</Label>
                    <Input type="number" min="0" step="0.5" value={activeLeaveType.maximum_consecutive_days ?? ""} onChange={(e) => updateLeaveTypeField("maximum_consecutive_days", e.target.value || null)} />
                  </div>
                </>
              ),
            })}

            {renderLeaveTypeSection({
              key: "availability",
              title: "Availability and Carry Forward",
              children: (
                <>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={activeLeaveType.restrict_availability_period} onChange={(e) => updateLeaveTypeField("restrict_availability_period", e.target.checked)} />
                    Restrict leave to a specific period
                  </label>
                  {activeLeaveType.restrict_availability_period && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-md border p-4">
                      <Input type="date" value={activeLeaveType.availability_start_date} onChange={(e) => updateLeaveTypeField("availability_start_date", e.target.value)} />
                      <Input type="date" value={activeLeaveType.availability_end_date} onChange={(e) => updateLeaveTypeField("availability_end_date", e.target.value)} />
                      <select className="rounded-md border px-2 text-sm" value={activeLeaveType.availability_repeat} onChange={(e) => updateLeaveTypeField("availability_repeat", e.target.value)}>
                        <option>Every Year</option>
                        <option>Once</option>
                        <option>Every Academic Year</option>
                        <option>Every Financial Year</option>
                        <option>Custom</option>
                      </select>
                    </div>
                  )}
                  <div className="flex gap-4">
                    <label className="flex-1 rounded-md border p-3">
                      <input type="radio" name="allow_carry_forward" checked={!activeLeaveType.allow_carry_forward} onChange={() => updateLeaveTypeFields({ allow_carry_forward: false, maximum_carry_forward: null })} /> Not Allowed
                    </label>
                    <label className="flex-1 rounded-md border p-3">
                      <input type="radio" name="allow_carry_forward" checked={activeLeaveType.allow_carry_forward} onChange={() => updateLeaveTypeField("allow_carry_forward", true)} /> Allowed
                    </label>
                  </div>
                  {activeLeaveType.allow_carry_forward && (
                    <div className="space-y-4 rounded-md border p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input type="number" min="0" step="0.5" placeholder="Maximum carry forward" value={activeLeaveType.maximum_carry_forward ?? ""} onChange={(e) => updateLeaveTypeField("maximum_carry_forward", e.target.value || null)} />
                        <select className="rounded-md border px-2 text-sm" value={activeLeaveType.carry_forward_expiry} onChange={(e) => {
                          const value = e.target.value as CarryForwardExpiry;
                          updateLeaveTypeFields({
                            carry_forward_expiry: value,
                            leave_year_start: value === "end_of_year" ? activeLeaveType.leave_year_start : "",
                            custom_expiry_value: value === "custom_period" ? activeLeaveType.custom_expiry_value : null,
                            custom_expiry_unit: value === "custom_period" ? activeLeaveType.custom_expiry_unit : "months",
                          });
                        }}>
                          <option value="end_of_year">End of Year</option>
                          <option value="no_expiry">No Expiry</option>
                          <option value="custom_period">After Custom Period</option>
                        </select>
                      </div>
                      {activeLeaveType.carry_forward_expiry === "end_of_year" && (() => {
                        const { month, day } = getMonthDayFromDate(activeLeaveType.leave_year_start || createYearlessDateString(11, 31));
                        const maxDays = getMaxDaysForMonth(month);

                        return (
                          <div className="space-y-3 rounded-md border p-4">
                            <Label className="text-sm font-medium">Expiry day (repeats every year)</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <select
                                className="rounded-md border px-2 py-2 text-sm"
                                value={month}
                                onChange={(e) => {
                                  const nextMonth = Number(e.target.value);
                                  const nextMaxDays = getMaxDaysForMonth(nextMonth);
                                  const nextDay = Math.min(day, nextMaxDays);
                                  updateLeaveTypeField("leave_year_start", createYearlessDateString(nextMonth, nextDay));
                                }}
                              >
                                {monthNames.map((name, index) => (
                                  <option key={name} value={index}>{name}</option>
                                ))}
                              </select>

                              <select
                                className="rounded-md border px-2 py-2 text-sm"
                                value={day}
                                onChange={(e) => {
                                  const nextDay = Number(e.target.value);
                                  updateLeaveTypeField("leave_year_start", createYearlessDateString(month, nextDay));
                                }}
                              >
                                {Array.from({ length: maxDays }, (_, index) => index + 1).map((dateNumber) => (
                                  <option key={dateNumber} value={dateNumber}>{dateNumber}</option>
                                ))}
                              </select>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Selected: {day} {monthNames[month]}
                            </p>
                          </div>
                        );
                      })()}
                      {activeLeaveType.carry_forward_expiry === "custom_period" && <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Input type="number" min="1" step="1" placeholder="Expiry duration" value={activeLeaveType.custom_expiry_value ?? ""} onChange={(e) => updateLeaveTypeField("custom_expiry_value", e.target.value || null)} /><select className="rounded-md border px-2 text-sm" value={activeLeaveType.custom_expiry_unit} onChange={(e) => updateLeaveTypeField("custom_expiry_unit", e.target.value as CustomExpiryUnit)}><option value="days">Days</option><option value="months">Months</option><option value="quarters">Quarters</option><option value="years">Years</option></select></div>}
                    </div>
                  )}
                </>
              ),
            })}

            {renderLeaveTypeSection({
              key: "requirements",
              title: "Application Requirements and Effective Period",
              children: (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label><input type="checkbox" checked={activeLeaveType.replacement_required} onChange={(e) => updateLeaveTypeField("replacement_required", e.target.checked)} /> Replacement required</label>
                    <label><input type="checkbox" checked={activeLeaveType.supporting_document} onChange={(e) => updateLeaveTypeField("supporting_document", e.target.checked)} /> Supporting document</label>
                    <label><input type="checkbox" checked={activeLeaveType.ta_da_applicable} onChange={(e) => updateLeaveTypeField("ta_da_applicable", e.target.checked)} /> TA/DA applicable</label>
                    <label><input type="checkbox" checked={activeLeaveType.manager_approval} onChange={(e) => updateLeaveTypeField("manager_approval", e.target.checked)} /> Manager approval</label>
                    <label><input type="checkbox" checked={activeLeaveType.hr_approval} onChange={(e) => updateLeaveTypeField("hr_approval", e.target.checked)} /> HR approval</label>
                    <label><input type="checkbox" checked={activeLeaveType.multi_level_approval} onChange={(e) => updateLeaveTypeField("multi_level_approval", e.target.checked)} /> Multi-level approval</label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Effective From *</Label><Input type="date" required value={activeLeaveType.effective_from} onChange={(e) => updateLeaveTypeField("effective_from", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Effective Until</Label><Input type="date" value={activeLeaveType.effective_until} onChange={(e) => updateLeaveTypeField("effective_until", e.target.value)} /></div>
                  </div>
                </>
              ),
            })}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                className="bg-blue-600 text-white"
                disabled={isLeaveTypeSubmitting}
              >
                {isLeaveTypeSubmitting
                  ? "Saving..."
                  : editingLeaveType
                    ? "Update Type"
                    : "Save Type"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
  );
}
