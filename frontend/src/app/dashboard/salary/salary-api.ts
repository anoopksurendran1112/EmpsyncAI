// Client for the salary/payroll backend, going through the Next.js proxy routes
// under /api/salary/*. The proxy injects company_id from the session cookie.

export type SalaryComponentType = "fixed" | "percent_basic" | "percent_gross";
export type SalaryComponentKind = "earning" | "deduction";

export interface SalaryComponentDef {
  key?: string;
  name: string;
  type: SalaryComponentType;
  value?: number;
}

export interface SalaryConfigData {
  earnings: SalaryComponentDef[];
  deductions: SalaryComponentDef[];
  settings: Record<string, unknown>;
}

export interface SalaryComponentRow {
  key: string;
  name: string;
  kind: SalaryComponentKind;
  type: SalaryComponentType;
  value: number;
  active: boolean;
  applied_amount: number;
}

export interface SalaryComponentValue {
  value: number;
  active: boolean;
}

export interface SalaryTotals {
  basic: number;
  gross: number;
  deductions: number;
  net: number;
}

export interface SalarySummaryTotals {
  staff_count: number;
  gross: number;
  deductions: number;
  net: number;
}

export interface SalarySummaryComponent {
  key: string;
  name: string;
  kind: SalaryComponentKind;
  permanent: number;
  probationary: number;
  total: number;
}

export interface SalarySummary {
  totals: SalarySummaryTotals;
  permanent: SalarySummaryTotals;
  probationary: SalarySummaryTotals;
  components: SalarySummaryComponent[];
}

export interface SalaryEmployeeSummary {
  employee_id: number;
  name: string;
  role: string;
  dept: string;
  joined: string;
  salary_type: string;
  employment_type: string;
  status: string;
  status_label: string;
  basic: number;
  gross: number;
  deductions: number;
  net: number;
  configured: boolean;
  structure_effective_from?: string | null;
}

export interface SalaryEmployeeDetail {
  employee_id: number;
  name: string;
  role: string;
  dept: string;
  joined: string;
  salary_type: string;
  employment_type: string;
  status: string;
  status_label: string;
  notes: string;
  configured: boolean;
  components: SalaryComponentRow[];
  totals: SalaryTotals;
  effective_from?: string;
  effective_to?: string | null;
  as_of?: string;
}

export interface SalaryRevision {
  id: number;
  effective_from: string;
  effective_to: string | null;
  is_current?: boolean;
  salary_type: string;
  employment_type: string;
  status: string;
  status_label: string;
  reason: string;
  note: string;
  basic: number;
  gross: number;
  deductions: number;
  net: number;
  created_at: string;
}

export interface SaveEmployeeSalaryPayload {
  salary_type: string;
  employment_type: string;
  status: string;
  components: Record<string, SalaryComponentValue>;
  notes?: string;
  effective_from?: string;
  reason?: string;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init });
  const data = await response.json().catch(() => null);
  if (!response.ok || (data && data.success === false)) {
    throw new Error(data?.message || `Request failed (${response.status})`);
  }
  return data as T;
}

const jsonHeaders = { "Content-Type": "application/json" };

export const salaryApi = {
  async getConfig(): Promise<SalaryConfigData> {
    const result = await requestJson<{ data: SalaryConfigData }>("/api/salary/config");
    return result.data;
  },

  async saveConfig(config: SalaryConfigData): Promise<SalaryConfigData> {
    const result = await requestJson<{ data: SalaryConfigData }>("/api/salary/config", {
      method: "PUT",
      headers: jsonHeaders,
      body: JSON.stringify(config),
    });
    return result.data;
  },

  async listEmployees(month?: string): Promise<SalaryEmployeeSummary[]> {
    const query = month ? `?month=${encodeURIComponent(month)}` : "";
    const result = await requestJson<{ data: SalaryEmployeeSummary[] }>(
      `/api/salary/employees${query}`,
    );
    return result.data;
  },

  async getSummary(month?: string): Promise<SalarySummary> {
    const query = month ? `?month=${encodeURIComponent(month)}` : "";
    const result = await requestJson<{ data: SalarySummary }>(`/api/salary/summary${query}`);
    return result.data;
  },

  async getEmployee(employeeId: number, month?: string): Promise<SalaryEmployeeDetail> {
    const query = month ? `?month=${encodeURIComponent(month)}` : "";
    const result = await requestJson<{ data: SalaryEmployeeDetail }>(
      `/api/salary/employees/${employeeId}${query}`,
    );
    return result.data;
  },

  async getHistory(employeeId: number): Promise<SalaryRevision[]> {
    const result = await requestJson<{ data: SalaryRevision[] }>(
      `/api/salary/employees/${employeeId}/history`,
    );
    return result.data;
  },

  async saveEmployee(
    employeeId: number,
    payload: SaveEmployeeSalaryPayload,
  ): Promise<SalaryEmployeeDetail> {
    const result = await requestJson<{ data: SalaryEmployeeDetail }>(
      `/api/salary/employees/${employeeId}`,
      { method: "PUT", headers: jsonHeaders, body: JSON.stringify(payload) },
    );
    return result.data;
  },
};
