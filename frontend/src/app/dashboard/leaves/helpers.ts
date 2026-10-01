import { LeavePolicy, LeaveTypeFormData } from "./types";

// Dummy Data
export const DUMMY_STATS = {
  leavesTaken: 0,
  fullDayLeaves: 0,
  halfDayLeaves: 0,
  pendingRequests: 0,
};

export const createLeaveTypeForm = (policies: LeavePolicy[] = []): LeaveTypeFormData => ({
  leave_type: "",
  short_name: "",
  monthly_limit: 0,
  yearly_limit: 0,
  initial_credit: 0,
  use_credit: false,
  policy_mode: "normal",
  policies,
  description: "",
  employee_type: "All Employee Types",
  department: "All Departments",
  employment_status: "Active",
  designation: "All Designations",
  work_location: "All Locations",
  service_period_value: 0,
  service_period_unit: "months",
  waiting_rule: "LOP only",
  entitlement_period: "Monthly",
  limit_unit: "Days",
  limit_value: 0,
  credit_method: "Monthly",
  restrict_availability_period: false,
  availability_start_date: "",
  availability_end_date: "",
  availability_repeat: "Every Year",
  allowed_duration: "Full Day & Half Day",
  minimum_duration: 0.5,
  maximum_per_application: null,
  maximum_consecutive_days: null,
  allow_carry_forward: true,
  maximum_carry_forward: null,
  carry_forward_expiry: "end_of_year",
  leave_year_start: "",
  custom_expiry_value: null,
  custom_expiry_unit: "months",
  replacement_required: false,
  supporting_document: false,
  ta_da_applicable: false,
  manager_approval: false,
  hr_approval: false,
  multi_level_approval: false,
  effective_from: "",
  effective_until: "",
});

export const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const getMonthDayFromDate = (dateString: string) => {
  if (!dateString) {
    return { month: 11, day: 31 };
  }

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return { month: 11, day: 31 };
  }

  return {
    month: parsed.getMonth(),
    day: parsed.getDate(),
  };
};

export const getMaxDaysForMonth = (month: number) => {
  if (month === 1) return 28;
  if ([3, 5, 8, 10].includes(month)) return 30;
  return 31;
};

export const createYearlessDateString = (month: number, day: number) => {
  const year = new Date().getFullYear();
  const maxDays = getMaxDaysForMonth(month);
  const safeDay = Math.min(day, maxDays);
  const date = new Date(year, month, safeDay);
  return date.toISOString().split("T")[0];
};

export const generateDateRange = (startDate: string, endDate: string): string[] => {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    dates.push(new Date(current).toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

export const calculateDaysCount = (startDate: string, endDate: string): number => {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeDiff = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1);
};
