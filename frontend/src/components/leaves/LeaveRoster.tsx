"use client";

import { useMemo, useState } from "react";
import { Download, Eye, Search } from "lucide-react";
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
import {
  leaveRosterDepartments,
  leaveRosterEmployees,
  leaveRosterPolicies,
  leaveRosterUsage,
  type LeaveRosterEmployee,
  type LeaveRosterPolicy,
} from "./leave-roster-data";

const rosterPeriod = "September 2026";

const formatAmount = (value: number | null) => {
  if (value === null) return "-";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
};

const getEntitlement = (
  policy: LeaveRosterPolicy,
  employee: LeaveRosterEmployee,
) => {
  if (policy.scope === "common") return policy.entitlement ?? null;
  return policy.categoryEntitlements?.[employee.category] ?? null;
};

const getUsage = (employee: LeaveRosterEmployee, policy: LeaveRosterPolicy) =>
  leaveRosterUsage[employee.id]?.[policy.shortCode] ?? null;

const getBalance = (
  policy: LeaveRosterPolicy,
  employee: LeaveRosterEmployee,
) => {
  if (policy.period === "Unlimited") return null;
  const entitlement = getEntitlement(policy, employee);
  const used = getUsage(employee, policy) ?? 0;
  return entitlement === null ? null : Math.max(0, entitlement - used);
};

const getPolicyLabel = (policy: LeaveRosterPolicy) =>
  policy.scope === "common" ? "Common Policy" : "Staff Category Based";

export default function LeaveRoster() {
  const [department, setDepartment] = useState("All Departments");
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] =
    useState<LeaveRosterEmployee | null>(null);

  const filteredEmployees = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return leaveRosterEmployees.filter((employee) => {
      const matchesDepartment =
        department === "All Departments" || employee.department === department;
      const matchesSearch =
        !searchValue ||
        employee.name.toLowerCase().includes(searchValue) ||
        employee.category.toLowerCase().includes(searchValue);

      return matchesDepartment && matchesSearch;
    });
  }, [department, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Leave Roster</h2>
          <p className="mt-1 text-sm text-gray-500">
            Current leave usage and remaining balance based on active leave policies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="w-[190px] bg-white">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {leaveRosterDepartments.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" onClick={() => window.print()}>
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search employee..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Badge className="w-fit bg-blue-50 text-blue-700 hover:bg-blue-50">
            Policy-driven roster - Static demo
          </Badge>
        </div>

        <Table className="min-w-[1120px]">
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="sticky left-0 z-10 min-w-[190px] bg-gray-50 font-semibold uppercase text-gray-600">
                Employee
              </TableHead>
              <TableHead className="font-semibold uppercase text-gray-600">Department</TableHead>
              {leaveRosterPolicies.map((policy) => (
                <TableHead key={policy.id} className="min-w-[145px] font-semibold uppercase text-gray-600">
                  <span>{policy.shortCode}</span>
                  <span className="block text-[11px] font-normal normal-case text-gray-500">
                    {policy.name}
                  </span>
                </TableHead>
              ))}
              <TableHead className="font-semibold uppercase text-gray-600">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={leaveRosterPolicies.length + 3} className="h-24 text-center text-gray-500">
                  No employees match the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="sticky left-0 z-[1] bg-white font-semibold text-blue-700">
                    {employee.name}
                  </TableCell>
                  <TableCell className="text-gray-500">{employee.department}</TableCell>
                  {leaveRosterPolicies.map((policy) => {
                    const entitlement = getEntitlement(policy, employee);
                    const used = getUsage(employee, policy);
                    const balance = getBalance(policy, employee);
                    const isIneligible = entitlement === null && policy.period !== "Unlimited";
                    const isLow = balance !== null && balance <= 2;

                    return (
                      <TableCell key={policy.id}>
                        {isIneligible ? (
                          <span className="text-gray-400">-</span>
                        ) : policy.period === "Unlimited" ? (
                          <>
                            <span className="font-semibold text-gray-900">Unlimited</span>
                            <span className="mt-1 block text-xs text-gray-500">
                              Used {formatAmount(used)}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className={isLow ? "font-semibold text-amber-700" : "font-semibold text-gray-900"}>
                              {formatAmount(balance)}
                            </span>
                            <span className="mt-1 block text-xs text-gray-500">
                              Used {formatAmount(used)} / {formatAmount(entitlement)}
                            </span>
                          </>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="border-t bg-gray-50 px-4 py-3 text-xs text-gray-500">
          <strong>Balance</strong> is the remaining entitlement. <strong>Used</strong> is calculated from approved leave. A dash means the employee is not eligible for that policy.
        </div>
      </div>

      <Dialog
        open={selectedEmployee !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedEmployee(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[760px]">
          {selectedEmployee && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedEmployee.name}</DialogTitle>
                <DialogDescription>
                  {selectedEmployee.department} - {selectedEmployee.category}
                </DialogDescription>
              </DialogHeader>

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
                  <p className="mt-1 font-semibold text-gray-900">{rosterPeriod}</p>
                </div>
              </div>

              <div className="space-y-3">
                {leaveRosterPolicies.map((policy) => {
                  const entitlement = getEntitlement(policy, selectedEmployee);
                  const used = getUsage(selectedEmployee, policy);
                  const balance = getBalance(policy, selectedEmployee);
                  const isIneligible = entitlement === null && policy.period !== "Unlimited";

                  if (isIneligible) return null;

                  return (
                    <div key={policy.id} className="rounded-md border bg-gray-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-semibold text-gray-900">{policy.name}</h3>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                          {getPolicyLabel(policy)}
                        </Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                        <p>
                          <span className="text-gray-500">Entitlement: </span>
                          <strong>{policy.period === "Unlimited" ? "Unlimited" : `${formatAmount(entitlement)} ${policy.unit} / ${policy.period}`}</strong>
                        </p>
                        <p>
                          <span className="text-gray-500">Used: </span>
                          <strong>{formatAmount(used)}</strong>
                        </p>
                        <p>
                          <span className="text-gray-500">Balance: </span>
                          <strong>{policy.period === "Unlimited" ? "Unlimited" : formatAmount(balance)}</strong>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-md border border-dashed bg-gray-50 p-4 text-sm text-gray-600">
                Static frontend data is currently used here. Backend integration should provide active policies, employee eligibility, and approved leave usage so columns and balances can be generated dynamically.
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
