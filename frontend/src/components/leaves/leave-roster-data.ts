export interface DynamicLeaveTypeColumn {
  id: number;
  name: string;
  short_code: string;
  policy_mode: "normal" | "staff_category" | string;
  monthly_limit?: number | null;
  yearly_limit?: number | null;
  use_credit?: boolean;
}

export interface DynamicEmployeeLeave {
  leave_type_id: number;
  leave_type_name: string;
  short_code: string;
  is_eligible: boolean;
  is_unlimited: boolean;
  entitlement: number | null;
  monthly_limit?: number | null;
  yearly_limit?: number | null;
  used: number;
  pending: number;
  monthly_used: number;
  monthly_pending?: number;
  balance: number | null;
  credit_balance?: number | null;
}

export interface DynamicRosterEmployee {
  id: number;
  name: string;
  email: string;
  department: string;
  department_id: number | null;
  category: string;
  category_id: number | null;
  staff_id?: string;
  leaves: Record<string, DynamicEmployeeLeave>;
}

export interface DynamicRosterDepartment {
  id: number;
  name: string;
}

export interface DynamicRosterResponse {
  company_id: number;
  company_name: string;
  year: number;
  month: number;
  period: string;
  departments: DynamicRosterDepartment[];
  leave_types: DynamicLeaveTypeColumn[];
  employees: DynamicRosterEmployee[];
}
