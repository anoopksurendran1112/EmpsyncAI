"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Download,
  Eye,
  Search,
  RefreshCw,
  Calendar,
  Building2,
  Users,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  type DynamicRosterResponse,
  type DynamicRosterEmployee,
  type DynamicEmployeeLeave,
} from "./leave-roster-data";

interface LeaveRosterProps {
  companyId?: number | string;
}

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const formatAmount = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "-";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
};

export default function LeaveRoster({ companyId }: LeaveRosterProps) {
  const { company } = useAuth();
  const activeCompanyId = companyId || company?.id;

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const [rosterData, setRosterData] = useState<DynamicRosterResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<DynamicRosterEmployee | null>(null);

  const availableYears = useMemo(() => {
    const cur = new Date().getFullYear();
    return [cur - 1, cur, cur + 1];
  }, []);

  const fetchRoster = useCallback(async () => {
    if (!activeCompanyId) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        company_id: String(activeCompanyId),
        year: String(selectedYear),
        month: String(selectedMonth),
      });

      if (departmentFilter !== "all") {
        params.append("department_id", departmentFilter);
      }

      const res = await fetch(`/api/leave/roster?${params.toString()}`);
      const json = await res.json();

      if (res.ok && json.success) {
        setRosterData(json.data);
      } else {
        toast.error(json.message || "Failed to load leave roster");
      }
    } catch (err) {
      console.error("Failed to load leave roster", err);
      toast.error("Network error while loading leave roster");
    } finally {
      setIsLoading(false);
    }
  }, [activeCompanyId, selectedYear, selectedMonth, departmentFilter]);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  const filteredEmployees = useMemo(() => {
    if (!rosterData) return [];
    const query = search.trim().toLowerCase();

    return rosterData.employees.filter((emp) => {
      const matchesSearch =
        !query ||
        emp.name.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        emp.department.toLowerCase().includes(query) ||
        emp.category.toLowerCase().includes(query) ||
        (emp.staff_id && emp.staff_id.toLowerCase().includes(query));

      return matchesSearch;
    });
  }, [rosterData, search]);

  const leaveTypesList = rosterData?.leave_types || [];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">Leave Roster</h2>
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
              Live Balance
            </Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Real-time leave balance and utilization roster across all employees for {rosterData?.period || "the selected period"}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <Select
            value={String(selectedMonth)}
            onValueChange={(val) => setSelectedMonth(Number(val))}
          >
            <SelectTrigger className="w-[130px] bg-white">
              <Calendar className="mr-1.5 h-3.5 w-3.5 text-gray-400" />
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={String(m.value)}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Year Selector */}
          <Select
            value={String(selectedYear)}
            onValueChange={(val) => setSelectedYear(Number(val))}
          >
            <SelectTrigger className="w-[100px] bg-white">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((yr) => (
                <SelectItem key={yr} value={String(yr)}>
                  {yr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Department Filter */}
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[170px] bg-white">
              <Building2 className="mr-1.5 h-3.5 w-3.5 text-gray-400" />
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {(rosterData?.departments || []).map((dept) => (
                <SelectItem key={dept.id} value={String(dept.id)}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Refresh Button */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={fetchRoster}
            disabled={isLoading}
            title="Refresh Roster"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>

          {/* Export PDF */}
          <Button
            type="button"
            variant="outline"
            onClick={() => window.print()}
            className="hidden sm:flex"
          >
            <Download className="mr-1.5 h-4 w-4" />
            Print / PDF
          </Button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search employee, category, staff ID..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              Total Employees: <strong>{filteredEmployees.length}</strong>
            </span>
            <span className="h-3 w-px bg-gray-200" />
            <span>
              Period: <strong>{rosterData?.period || `${selectedMonth}/${selectedYear}`}</strong>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[1100px]">
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="sticky left-0 z-10 min-w-[200px] bg-gray-50 font-semibold uppercase text-gray-600">
                  Employee
                </TableHead>
                <TableHead className="font-semibold uppercase text-gray-600">
                  Department
                </TableHead>
                <TableHead className="font-semibold uppercase text-gray-600">
                  Category
                </TableHead>
                {leaveTypesList.map((lt) => (
                  <TableHead
                    key={lt.id}
                    className="min-w-[140px] font-semibold uppercase text-gray-600"
                  >
                    <span>{lt.short_code}</span>
                    <span className="block text-[11px] font-normal normal-case text-gray-500 truncate max-w-[130px]">
                      {lt.name}
                    </span>
                  </TableHead>
                ))}
                <TableHead className="font-semibold uppercase text-gray-600 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={leaveTypesList.length + 4}
                    className="h-32 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                      <span>Loading leave balances...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={leaveTypesList.length + 4}
                    className="h-28 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center justify-center gap-1">
                      <AlertCircle className="h-5 w-5 text-gray-400" />
                      <span>No employees found matching the filters.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((employee) => (
                  <TableRow key={employee.id} className="hover:bg-gray-50/70">
                    <TableCell className="sticky left-0 z-[1] bg-white font-semibold text-blue-700">
                      <div>
                        <span>{employee.name}</span>
                        {employee.staff_id && (
                          <span className="block text-[11px] font-normal text-gray-400">
                            ID: {employee.staff_id}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {employee.department}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700 font-normal text-xs">
                        {employee.category}
                      </Badge>
                    </TableCell>

                    {leaveTypesList.map((lt) => {
                      const code = lt.short_code;
                      const leaveInfo: DynamicEmployeeLeave | undefined = employee.leaves[code];

                      if (!leaveInfo || !leaveInfo.is_eligible) {
                        return (
                          <TableCell key={lt.id}>
                            <span className="text-gray-300 font-medium">-</span>
                          </TableCell>
                        );
                      }

                      if (leaveInfo.is_unlimited) {
                        return (
                          <TableCell key={lt.id}>
                            <span className="font-semibold text-gray-900">Unlimited</span>
                            <span className="mt-0.5 block text-xs text-gray-500">
                              Used {formatAmount(leaveInfo.used)}
                            </span>
                          </TableCell>
                        );
                      }

                      const balance = leaveInfo.balance;
                      const isLow = balance !== null && balance <= 2;
                      const isExhausted = balance !== null && balance <= 0;

                      return (
                        <TableCell key={lt.id}>
                          <span
                            className={
                              isExhausted
                                ? "font-bold text-red-600"
                                : isLow
                                ? "font-semibold text-amber-600"
                                : "font-semibold text-gray-900"
                            }
                          >
                            {formatAmount(balance)}
                          </span>
                          <span className="mt-0.5 block text-xs text-gray-500">
                            Used {formatAmount(leaveInfo.used)} / {formatAmount(leaveInfo.entitlement)}
                          </span>
                          {leaveInfo.pending > 0 && (
                            <span className="block text-[10px] text-amber-600 font-medium">
                              +{leaveInfo.pending} pending
                            </span>
                          )}
                        </TableCell>
                      );
                    })}

                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedEmployee(employee)}
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="border-t bg-gray-50 px-4 py-3 text-xs text-gray-500 flex flex-wrap items-center justify-between gap-2">
          <div>
            <strong>Balance</strong> is the remaining available leave days.{" "}
            <strong>Used</strong> includes approved leave days in {rosterData?.year || selectedYear}.{" "}
            <span className="text-gray-400">(-) indicates employee is not eligible under their staff category.</span>
          </div>
        </div>
      </div>

      {/* Employee Detail Dialog */}
      <Dialog
        open={selectedEmployee !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedEmployee(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[720px]">
          {selectedEmployee && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-gray-900">
                  {selectedEmployee.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedEmployee.email} {selectedEmployee.staff_id ? `• Staff ID: ${selectedEmployee.staff_id}` : ""}
                </DialogDescription>
              </DialogHeader>

              {/* Employee Summary Pills */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-md border bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Category</p>
                  <p className="mt-1 font-semibold text-gray-900">{selectedEmployee.category}</p>
                </div>
                <div className="rounded-md border bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Department</p>
                  <p className="mt-1 font-semibold text-gray-900">{selectedEmployee.department}</p>
                </div>
                <div className="rounded-md border bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Period</p>
                  <p className="mt-1 font-semibold text-gray-900">{rosterData?.period || `${selectedMonth}/${selectedYear}`}</p>
                </div>
              </div>

              {/* Breakdown Cards */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
                  Leave Balances & Utilization
                </h4>

                {leaveTypesList.map((lt) => {
                  const code = lt.short_code;
                  const leaveInfo: DynamicEmployeeLeave | undefined = selectedEmployee.leaves[code];

                  if (!leaveInfo || !leaveInfo.is_eligible) {
                    return (
                      <div
                        key={lt.id}
                        className="rounded-md border border-gray-100 bg-gray-50/60 p-3.5 flex items-center justify-between"
                      >
                        <div>
                          <h4 className="font-semibold text-gray-600 text-sm">{lt.name} ({lt.short_code})</h4>
                          <p className="text-xs text-gray-400">Not eligible for this staff category</p>
                        </div>
                        <Badge variant="outline" className="text-gray-400">Ineligible</Badge>
                      </div>
                    );
                  }

                  const isUnlimited = leaveInfo.is_unlimited;

                  return (
                    <div key={lt.id} className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900 text-sm">{lt.name}</h4>
                          <Badge variant="secondary" className="text-[11px] bg-blue-50 text-blue-700">
                            {lt.short_code}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">
                          {lt.policy_mode === "staff_category" ? "Category Policy" : "Standard Policy"}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                        <div className="rounded bg-gray-50 p-2">
                          <span className="block text-xs text-gray-500">Entitlement</span>
                          <span className="font-semibold text-gray-900">
                            {isUnlimited ? "Unlimited" : `${formatAmount(leaveInfo.entitlement)} Days`}
                          </span>
                        </div>
                        <div className="rounded bg-gray-50 p-2">
                          <span className="block text-xs text-gray-500">Total Used (Year)</span>
                          <span className="font-semibold text-gray-900">
                            {formatAmount(leaveInfo.used)} Days
                          </span>
                        </div>
                        <div className="rounded bg-gray-50 p-2">
                          <span className="block text-xs text-gray-500">Used in {MONTHS.find(m => m.value === selectedMonth)?.label}</span>
                          <span className="font-semibold text-gray-900">
                            {formatAmount(leaveInfo.monthly_used)} Days
                          </span>
                        </div>
                        <div className="rounded bg-blue-50 p-2">
                          <span className="block text-xs text-blue-700">Balance</span>
                          <span className="font-bold text-blue-900">
                            {isUnlimited ? "Unlimited" : `${formatAmount(leaveInfo.balance)} Days`}
                          </span>
                        </div>
                      </div>

                      {leaveInfo.pending > 0 && (
                        <div className="mt-2 text-xs text-amber-600 bg-amber-50 rounded px-2.5 py-1">
                          ⚠️ {leaveInfo.pending} day(s) pending approval (already accounted in balance).
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
