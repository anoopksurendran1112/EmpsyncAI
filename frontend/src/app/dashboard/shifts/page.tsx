"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit2, Info, Plus, Search, Trash2, X as RemoveIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useStaffTypes } from "@/hooks/settings/staff_type/useStaffTypes";
import { useEmployees } from "@/hooks/employees/useGetEmployees";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AssignmentMode = "all" | "staff_type" | "specific";

type Shift = {
  id: number;
  shift: string;
  check_in: string | null;
  check_out: string | null;
  late_allowance_minutes: number;
  days_applicable: string;
  applicable_to: string;
  staff_count: number;
  staff_type_id: number | null;
  staff_type_name?: string | null;
  assigned_user_ids: number[];
};

type ShiftForm = {
  shift: string;
  check_in: string;
  check_out: string;
  late_allowance_minutes: number;
  days_applicable: string;
  assignment_mode: AssignmentMode;
  staff_type_id: number | null;
  assigned_user_ids: number[];
};

const emptyForm: ShiftForm = {
  shift: "",
  check_in: "",
  check_out: "",
  late_allowance_minutes: 15,
  days_applicable: "Mon - Sat",
  assignment_mode: "all",
  staff_type_id: null,
  assigned_user_ids: [],
};

const formatTime = (value: string | null) => {
  if (!value) return "-";
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${String(hours % 12 || 12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${suffix}`;
};

export default function ShiftsPage() {
  const { company } = useAuth();
  const companyId = company?.id;
  const { data: staffTypes = [], isLoading: isStaffTypesLoading } = useStaffTypes();
  const { data: employeesData, isLoading: isLoadingEmployees } = useEmployees(companyId || 0, 1, 1000);
  const employees = (employeesData as any)?.employees || [];
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<ShiftForm>(emptyForm);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchShifts = useCallback(async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/shifts?company_id=${companyId}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Failed to load shifts");
      setShifts((result.data || []).map((shift: any) => ({
        ...shift,
        assigned_user_ids: shift.assigned_user_ids || [],
      })));
    } catch (error) {
      console.error("Failed to load shifts", error);
      toast.error("Failed to load shifts");
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const filteredShifts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return shifts;
    return shifts.filter((item) =>
      `${item.shift} ${item.days_applicable} ${item.applicable_to}`.toLowerCase().includes(query),
    );
  }, [search, shifts]);

  const openNewShift = () => {
    setEditingShift(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  };

  const openEditShift = (shift: Shift) => {
    setEditingShift(shift);
    let assignmentMode: AssignmentMode = "all";
    if (shift.staff_type_id) assignmentMode = "staff_type";
    else if (shift.applicable_to === "Specific staff" || (shift.applicable_to && shift.applicable_to !== "All Staff")) assignmentMode = "specific";
    setForm({
      shift: shift.shift,
      check_in: shift.check_in?.slice(0, 5) || "",
      check_out: shift.check_out?.slice(0, 5) || "",
      late_allowance_minutes: shift.late_allowance_minutes,
      days_applicable: shift.days_applicable,
      assignment_mode: assignmentMode,
      staff_type_id: shift.staff_type_id,
      assigned_user_ids: shift.assigned_user_ids || [],
    });
    setIsDialogOpen(true);
  };

  const toggleAssignedStaff = (userId: number) => {
    setForm((prev) => {
      const current = prev.assigned_user_ids;
      const next = current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId];
      return { ...prev, assigned_user_ids: next };
    });
  };

  const selectedAssigned = employees.filter((emp: any) => form.assigned_user_ids.includes(emp.id));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!companyId) return;
    setIsSaving(true);
    try {
      const response = await fetch("/api/shifts", {
        method: editingShift ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ...(editingShift ? { id: editingShift.id } : {}) }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Failed to save shift");
      toast.success(editingShift ? "Shift updated successfully" : "Shift added successfully");
      setIsDialogOpen(false);
      await fetchShifts();
    } catch (error) {
      console.error("Failed to save shift", error);
      toast.error(error instanceof Error ? error.message : "Failed to save shift");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (shift: Shift) => {
    if (!window.confirm(`Remove "${shift.shift}"?`)) return;
    try {
      const response = await fetch("/api/shifts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: shift.id }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Failed to remove shift");
      toast.success("Shift removed successfully");
      await fetchShifts();
    } catch (error) {
      console.error("Failed to remove shift", error);
      toast.error(error instanceof Error ? error.message : "Failed to remove shift");
    }
  };

  return (
    <div className="mx-auto max-w-6xl pb-12">
      <Tabs defaultValue="settings" className="w-full">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shift Management</h1>
            <p className="mt-1 text-sm text-gray-500">Define and manage shift timings for your staff.</p>
          </div>
          <TabsList className="w-fit bg-gray-100 p-1">
            <TabsTrigger value="settings">Shift Settings</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="settings" className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <p><span className="font-bold">Shift configuration.</span> Create reusable timings for attendance, punch validation, and late-entry calculation.</p>
            </div>
            <Button onClick={openNewShift} className="shrink-0 bg-teal-600 text-white hover:bg-teal-700">
              <Plus className="mr-2 h-4 w-4" /> New Shift
            </Button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search shift name or category..." className="pl-10" />
            </div>
            <span className="text-sm text-gray-500">{filteredShifts.length} shift{filteredShifts.length === 1 ? "" : "s"}</span>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="hidden grid-cols-[2fr_1.2fr_1.3fr_1fr_1.4fr_1.2fr] gap-4 border-b bg-gray-50 px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-500 md:grid">
              <span>Shift Name</span><span>Time</span><span>Days</span><span>Grace</span><span>Applicable To</span><span>Actions</span>
            </div>
            {isLoading ? (
              <div className="py-12 text-center text-sm text-gray-500">Loading shifts...</div>
            ) : filteredShifts.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500">No shifts found. Try another search or create a new shift.</div>
            ) : (
              filteredShifts.map((shift) => (
                <div key={shift.id} className="grid gap-3 border-b px-5 py-4 last:border-b-0 hover:bg-gray-50 md:grid-cols-[2fr_1.2fr_1.3fr_1fr_1.4fr_1.2fr] md:items-center md:gap-4">
                  <div><p className="font-bold text-gray-900">{shift.shift}</p><span className="inline-block rounded-full bg-teal-50 px-2 py-1 text-xs font-bold text-teal-700">{shift.staff_count} staff</span></div>
                  <div className="whitespace-nowrap text-sm font-semibold text-teal-700">{formatTime(shift.check_in)} - {formatTime(shift.check_out)}</div>
                  <div className="text-sm text-gray-500">{shift.days_applicable}</div>
                  <div className="text-sm text-gray-500">{shift.late_allowance_minutes} min</div>
                  <div className="text-sm text-gray-500">{shift.staff_type_name || (shift.applicable_to === "Specific staff" ? `${shift.assigned_user_ids?.length ?? 0} staff` : shift.applicable_to)}</div>
                  <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => openEditShift(shift)}><Edit2 className="mr-1 h-3.5 w-3.5" /> Edit</Button><Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleDelete(shift)}><Trash2 className="mr-1 h-3.5 w-3.5" /> Remove</Button></div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>{editingShift ? "Edit Shift" : "New Shift"}</DialogTitle>
            <DialogDescription>Define shift timing and grace window.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 py-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Shift Name *"><Input required value={form.shift} onChange={(event) => setForm({ ...form, shift: event.target.value })} placeholder="e.g. General Shift" /></Field>
              <Field label="Start Time *"><Input required type="time" value={form.check_in} onChange={(event) => setForm({ ...form, check_in: event.target.value })} /></Field>
              <Field label="End Time *"><Input required type="time" value={form.check_out} onChange={(event) => setForm({ ...form, check_out: event.target.value })} /></Field>
              <Field label="Days Applicable"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.days_applicable} onChange={(event) => setForm({ ...form, days_applicable: event.target.value })}><option>Mon - Sat</option><option>Mon - Fri</option><option>Mon, Wed, Fri</option><option>Tue, Thu</option><option>3 Days / Week</option><option>As Scheduled</option><option>Custom</option></select></Field>
              <Field label="Grace (minutes)"><Input type="number" min="0" value={form.late_allowance_minutes} onChange={(event) => setForm({ ...form, late_allowance_minutes: Number(event.target.value) })} /><p className="mt-1 text-xs text-gray-500">Late-entry window before late status is applied.</p></Field>
              <Field label="Applicable To">
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.assignment_mode} onChange={(event) => setForm((prev) => ({ ...prev, assignment_mode: event.target.value as AssignmentMode, staff_type_id: event.target.value === "staff_type" ? prev.staff_type_id : null, assigned_user_ids: event.target.value === "specific" ? prev.assigned_user_ids : [] }))}>
                  <option value="all">All Staff</option>
                  <option value="staff_type">By Staff Type</option>
                  <option value="specific">Specific Staff</option>
                </select>
                {form.assignment_mode === "staff_type" && (
                  <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.staff_type_id ? String(form.staff_type_id) : ""} disabled={isStaffTypesLoading} onChange={(event) => {
                    const id = Number(event.target.value);
                    setForm((prev) => ({ ...prev, staff_type_id: id }));
                  }}>
                    <option value="" disabled>Choose staff type...</option>
                    {staffTypes.map((staffType) => <option key={staffType.id} value={staffType.id}>{staffType.name}</option>)}
                  </select>
                )}
                {form.assignment_mode === "specific" && (
                  <Command className="rounded-lg border">
                    <div className="flex flex-wrap gap-1 p-2">
                      {selectedAssigned.map((employee: any) => (
                        <Badge key={employee.id} variant="secondary">
                          {employee.first_name} {employee.last_name}
                          <button type="button" onClick={() => toggleAssignedStaff(employee.id)} className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                            <RemoveIcon className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      {selectedAssigned.length === 0 && <span className="text-xs text-gray-400">No staff selected</span>}
                    </div>
                    <CommandInput placeholder="Search staff..." />
                    <CommandList>
                      <CommandEmpty>No staff found.</CommandEmpty>
                      <CommandGroup className="max-h-[150px] overflow-y-auto">
                        {isLoadingEmployees ? (
                          <CommandItem>Loading...</CommandItem>
                        ) : (
                          employees?.map((employee: any) => (
                            <CommandItem
                              key={employee.id}
                              onSelect={() => toggleAssignedStaff(employee.id)}
                              className={form.assigned_user_ids.includes(employee.id) ? "bg-accent" : ""}
                            >
                              {employee.first_name} {employee.last_name}
                            </CommandItem>
                          ))
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                )}
              </Field>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button><Button type="submit" disabled={isSaving} className="bg-teal-600 text-white hover:bg-teal-700">{isSaving ? "Saving..." : editingShift ? "Update Shift" : "Save Shift"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

