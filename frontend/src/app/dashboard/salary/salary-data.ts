export type SalaryStatus = "Active" | "On hold" | "New joiner" | "On LWA" | "Per diem"

export interface SalaryStaffMember {
  name: string
  role: string
  department: string
  joined: string
  salaryType: "Regular" | "Consolidated" | "Per diem"
  base: number
  status: SalaryStatus
}

export interface SalaryLine {
  label: string
  amount: number
  kind?: "subtotal" | "deduction"
}

export interface SalaryLedger {
  headcount: string
  earnings: SalaryLine[]
  less: SalaryLine[]
  deductions: SalaryLine[]
  netPayable: number
}

export interface SalaryPeriod {
  name: string
  staffCount: number
  grossPayable: number
  deductions: number
  netPayable: number
  permanent: SalaryLedger
  probationary: SalaryLedger
}

export interface SalaryComponent {
  name: string
  type: "Fixed" | "% of basic" | "% of gross"
  value: number
}

export const salaryStaff: SalaryStaffMember[] = [
  { name: "Dr. K S Divakaran Nair", role: "Academic Advisor", department: "MBA", joined: "15 Oct 2021", salaryType: "Consolidated", base: 30000, status: "On hold" },
  { name: "Dr. P Krishnankutty", role: "Professor", department: "NASB", joined: "1 Dec 2025", salaryType: "Consolidated", base: 150000, status: "Active" },
  { name: "Dr. C B Sudheer", role: "Professor", department: "NASB", joined: "7 Jul 2025", salaryType: "Consolidated", base: 125000, status: "Active" },
  { name: "Mr. G Deepak Varma", role: "Administrative Officer", department: "ADMN", joined: "2 Jun 2025", salaryType: "Consolidated", base: 45000, status: "Active" },
  { name: "Dr. Reshmila S", role: "Professor", department: "EEE", joined: "1 Oct 2002", salaryType: "Regular", base: 70100, status: "Active" },
  { name: "Dr. Sunil Kumar P G", role: "Professor", department: "NASB", joined: "17 Jul 2017", salaryType: "Regular", base: 151565, status: "Active" },
  { name: "Dr. Vintu M", role: "Asst. Professor", department: "S&H", joined: "15 Jun 2026", salaryType: "Regular", base: 55000, status: "New joiner" },
  { name: "Mr. Praveen E.D", role: "Driver", department: "TR", joined: "1 Aug 2007", salaryType: "Regular", base: 0, status: "On LWA" },
  { name: "Ms. Reena N.S", role: "Peon", department: "ADMN", joined: "15 Oct 2003", salaryType: "Regular", base: 16500, status: "Active" },
  { name: "Mr. Lalu V.S", role: "Peon", department: "ADMN", joined: "1 Jul 2004", salaryType: "Regular", base: 16500, status: "Active" },
  { name: "Capt. Paul V Issac", role: "Adjunct Professor", department: "NASB", joined: "1 Aug 2022", salaryType: "Per diem", base: 0, status: "Per diem" },
]

const ledger = (headcount: string, netPayable: number, basic: number, deductions: number): SalaryLedger => ({
  headcount,
  earnings: [
    { label: "Basic pay", amount: basic },
    { label: "Special pay", amount: Math.round(basic * 0.05) },
    { label: "Other allowances", amount: Math.round(basic * 0.08) },
    { label: "Gross earnings", amount: Math.round(basic * 1.13), kind: "subtotal" },
  ],
  less: [
    { label: "LWA / excess paid", amount: Math.round(basic * 0.02) },
    { label: "Gross salary payable", amount: Math.round(basic * 1.11), kind: "subtotal" },
  ],
  deductions: [
    { label: "EPF", amount: Math.round(deductions * 0.2) },
    { label: "Professional tax", amount: 4350 },
    { label: "TDS", amount: Math.round(deductions * 0.45) },
    { label: "Other recovery", amount: Math.round(deductions * 0.25) },
    { label: "Total deductions", amount: deductions, kind: "subtotal" },
  ],
  netPayable,
})

export const salaryPeriods: SalaryPeriod[] = [
  {
    name: "June 2026",
    staffCount: 231,
    grossPayable: 6725963,
    deductions: 407417,
    netPayable: 6318546,
    permanent: ledger("184 staff", 5087561, 4840454, 375752),
    probationary: ledger("47 staff", 1230985, 1187540, 31665),
  },
  {
    name: "May 2026",
    staffCount: 415,
    grossPayable: 6826166,
    deductions: 503798,
    netPayable: 6322165,
    permanent: ledger("415 staff", 5091180, 4840454, 372133),
    probationary: ledger("47 staff", 1230985, 1187540, 31665),
  },
  {
    name: "April 2026",
    staffCount: 409,
    grossPayable: 6784210,
    deductions: 501340,
    netPayable: 6282870,
    permanent: ledger("362 staff", 5055550, 4810200, 370650),
    probationary: ledger("47 staff", 1223100, 1180000, 31300),
  },
  {
    name: "March 2026",
    staffCount: 405,
    grossPayable: 6692480,
    deductions: 496820,
    netPayable: 6195660,
    permanent: ledger("358 staff", 5013480, 4770000, 366520),
    probationary: ledger("47 staff", 1214050, 1172000, 30950),
  },
]

export const defaultEarnings: SalaryComponent[] = [
  { name: "Basic Pay", type: "Fixed", value: 70000 },
  { name: "Special Pay", type: "% of basic", value: 10 },
  { name: "Other Allowance", type: "Fixed", value: 5000 },
]

export const defaultDeductions: SalaryComponent[] = [
  { name: "EPF", type: "% of basic", value: 12 },
  { name: "Professional Tax", type: "Fixed", value: 350 },
  { name: "Bus Fee", type: "Fixed", value: 500 },
]