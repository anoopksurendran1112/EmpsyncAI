import {
  defaultDeductions,
  defaultEarnings,
  salaryPeriods,
  salaryStaff,
  type SalaryComponent,
  type SalaryPeriod,
  type SalaryStaffMember,
} from "./salary-data"

export interface SalaryApi {
  listPeriods(): Promise<SalaryPeriod[]>
  listStaff(period: string): Promise<SalaryStaffMember[]>
  saveTemplate(template: { name: string; earnings: SalaryComponent[]; deductions: SalaryComponent[] }): Promise<void>
}

// Replace these methods with the backend client when payroll APIs are available.
export const salaryApi: SalaryApi = {
  async listPeriods() {
    return salaryPeriods
  },
  async listStaff(_period) {
    return salaryStaff
  },
  async saveTemplate(_template) {
    return Promise.resolve()
  },
}

export const salaryTemplateDefaults = {
  earnings: defaultEarnings,
  deductions: defaultDeductions,
}