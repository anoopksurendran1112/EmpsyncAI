export interface LeavePolicy {
  id?: number;
  staff_category_id: number;
  staff_category_name?: string;

  monthly_limit: number;
  yearly_limit: number;
  initial_credit: number;

  allow_carry_forward: boolean;
  use_credit: boolean;
  requires_replacement?: boolean;
  custom_settings?: Record<string, any>;
}

export interface LeaveType {
  id: number;
  leave_type: string;
  name?: string;

  short_name: string;

  monthly_limit: number;
  yearly_limit: number;
  initial_credit?: number;

  use_credit?: boolean;

  policy_mode?: "normal" | "staff_category";

  allow_carry_forward?: boolean;
  settings?: Partial<LeaveTypeFormData>;

  policies?: LeavePolicy[];
}

export type LeaveTypePolicyMode = "normal" | "staff_category";
export type CarryForwardExpiry = "end_of_year" | "no_expiry" | "custom_period";
export type CustomExpiryUnit = "days" | "months" | "quarters" | "years";

export interface LeaveTypeFormData {
  leave_type: string;
  short_name: string;
  monthly_limit: number | string;
  yearly_limit: number | string;
  initial_credit: number | string;
  use_credit: boolean;
  policy_mode: LeaveTypePolicyMode;
  policies: LeavePolicy[];
  description: string;
  employee_type: string;
  department: string;
  employment_status: string;
  designation: string;
  work_location: string;
  service_period_value: number | string;
  service_period_unit: "days" | "months" | "years";
  waiting_rule: string;
  entitlement_period: string;
  limit_unit: string;
  limit_value: number | string;
  credit_method: string;
  restrict_availability_period: boolean;
  availability_start_date: string;
  availability_end_date: string;
  availability_repeat: string;
  allowed_duration: string;
  minimum_duration: number | string;
  maximum_per_application: number | string | null;
  maximum_consecutive_days: number | string | null;
  allow_carry_forward: boolean;
  maximum_carry_forward: number | string | null;
  carry_forward_expiry: CarryForwardExpiry;
  leave_year_start: string;
  custom_expiry_value: number | string | null;
  custom_expiry_unit: CustomExpiryUnit;
  replacement_required: boolean;
  supporting_document: boolean;
  ta_da_applicable: boolean;
  manager_approval: boolean;
  hr_approval: boolean;
  multi_level_approval: boolean;
  effective_from: string;
  effective_until: string;
}

export type EditableLeaveType = LeaveTypeFormData & { id: number };

export interface LeaveBalanceTaken {
  approved: number;
  pending: number;
  total: number;
}

export interface LeaveBalance {
  leave_type_id: number;
  leave_type: string;
  short_name: string;
  policy_mode: "normal" | "staff_category";
  policy_id: number | null;
  monthly_limit: number;
  yearly_limit: number;
  use_credit: boolean;
  initial_credit: number;
  monthly_taken: LeaveBalanceTaken;
  yearly_taken: LeaveBalanceTaken;
  monthly_remaining: number;
  yearly_remaining: number;
  credit_balance: number | null;
  available_balance: number;
}

export interface LeaveBalanceResponse {
  user_id: number;
  user_name: string;
  company_id: number;
  staff_category_id: number;
  staff_category_name: string;
  year: number;
  month: number;
  balances: LeaveBalance[];
}
export interface LeaveRequest {
  id: number;
  user?: { first_name: string; last_name?: string };
  from_date: string;
  to_date: string;
  custom_reason?: string;
  status: string;
  leave_type?: { name: string; leave_type?: string };
  leave_choice?: string;
  days?: number;
  current_approver_detail?: { id: number; name: string } | null;
  current_level?: number;
  hierarchy_total_levels?: number;
  approval_progress?: Array<{ level: number; criteria: string; status: string }>;
}

export interface Holiday {
  id?: string;
  holiday: string;
  date: string;
  end_date?: string;
  is_recurring: boolean;
  is_full_holiday: boolean;
  is_global: boolean;
  role_ids: string[];
  company_id?: string | number;
  is_multi_day?: boolean;
}

export interface CompanyRole {
  id: string;
  name: string;
}

export interface ActiveEmployee {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
}

export type HierarchyEmployee = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  initials: string;
};

export interface LeaveStats {
  leavesTaken: number;
  fullDayLeaves: number;
  halfDayLeaves: number;
  pendingRequests: number;
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}
