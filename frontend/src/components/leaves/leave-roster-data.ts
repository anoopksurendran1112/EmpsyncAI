export type LeavePolicyScope = "common" | "category";

export interface LeaveRosterPolicy {
  id: string;
  name: string;
  shortCode: string;
  scope: LeavePolicyScope;
  entitlement?: number;
  categoryEntitlements?: Record<string, number>;
  unit: "Days" | "Occurrences";
  period: string;
}

export interface LeaveRosterEmployee {
  id: number;
  name: string;
  department: string;
  category: string;
}

export type LeaveUsageValue = number | null;

export const leaveRosterPolicies: LeaveRosterPolicy[] = [
  {
    id: "casual-leave",
    name: "Casual Leave",
    shortCode: "CL",
    scope: "category",
    categoryEntitlements: { Teaching: 15, Technical: 15, "Non-Teaching": 20 },
    unit: "Days",
    period: "Yearly",
  },
  {
    id: "sick-leave",
    name: "Sick Leave",
    shortCode: "SL",
    scope: "common",
    entitlement: 12,
    unit: "Days",
    period: "Yearly",
  },
  {
    id: "vacation-leave",
    name: "Vacation Leave",
    shortCode: "VL",
    scope: "category",
    categoryEntitlements: { Teaching: 15, Technical: 15 },
    unit: "Days",
    period: "Yearly",
  },
  {
    id: "earned-leave",
    name: "Earned Leave",
    shortCode: "EL",
    scope: "category",
    categoryEntitlements: { "Non-Teaching": 15 },
    unit: "Days",
    period: "Academic Year",
  },
  {
    id: "maternity-leave",
    name: "Maternity Leave",
    shortCode: "ML",
    scope: "common",
    entitlement: 90,
    unit: "Days",
    period: "Per Event",
  },
  {
    id: "compensatory-off",
    name: "Compensatory Off",
    shortCode: "COFF",
    scope: "common",
    entitlement: 5,
    unit: "Days",
    period: "Yearly",
  },
  {
    id: "loss-of-pay",
    name: "Loss of Pay",
    shortCode: "LWA",
    scope: "common",
    unit: "Days",
    period: "Unlimited",
  },
  {
    id: "special-leave",
    name: "Special Leave",
    shortCode: "Special",
    scope: "common",
    entitlement: 2,
    unit: "Occurrences",
    period: "Yearly",
  },
];

export const leaveRosterEmployees: LeaveRosterEmployee[] = [
  { id: 1, name: "Dr. Smitha Suresh", department: "CS", category: "Teaching" },
  { id: 2, name: "Sreeraj T.V.", department: "CS", category: "Technical" },
  { id: 3, name: "Dr. Anita Krishnan", department: "ME", category: "Teaching" },
  { id: 4, name: "Nisha P.K.", department: "Admin", category: "Non-Teaching" },
  { id: 5, name: "Jijo Mathew", department: "EE", category: "Technical" },
  { id: 6, name: "Priya Suresh", department: "S&H", category: "Teaching" },
];

export const leaveRosterUsage: Record<number, Record<string, LeaveUsageValue>> = {
  1: { CL: 4, SL: 2, VL: 0, EL: null, ML: 0, COFF: 2, LWA: 0, Special: 0 },
  2: { CL: 6, SL: 1, VL: 0, EL: null, ML: 0, COFF: 0, LWA: 0, Special: 1 },
  3: { CL: 2, SL: 3, VL: 3, EL: null, ML: 0, COFF: 1, LWA: 0, Special: 0 },
  4: { CL: 8, SL: 1, VL: null, EL: 7, ML: 0, COFF: 5, LWA: 0, Special: 0 },
  5: { CL: 3, SL: 2, VL: 0, EL: null, ML: 0, COFF: 3, LWA: 0, Special: 0 },
  6: { CL: 5, SL: 0, VL: 2, EL: null, ML: 0, COFF: 0, LWA: 0, Special: 0 },
};

export const leaveRosterDepartments = ["All Departments", "CS", "ME", "Admin", "EE", "S&H"];
