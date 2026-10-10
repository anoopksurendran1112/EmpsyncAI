"use client"

import { useEffect, useMemo, useState } from "react"
import { Copy, Plus, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { salaryApi } from "./salary-api"
import { salaryPeriods, salaryStaff, type SalaryPeriod, type SalaryStaffMember } from "./salary-data"

type Tab = "register" | "summary" | "configure"
type EmployeeComponentKind = "Earning" | "Deduction"
type EmployeeComponentType = "Fixed" | "% of Basic" | "% of Gross"
type EmployeeComponentEntry = [EmployeeComponentKind, EmployeeComponentType, number, boolean]

type EmployeeRecord = {
  id: number
  name: string
  role: string
  dept: string
  type: "Permanent" | "Probationary"
  basic: number
  components: Record<string, EmployeeComponentEntry>
}

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
})

const formatMoney = (value: number) => (Number.isFinite(value) ? currency.format(value) : "0")

const employeeProfiles: EmployeeRecord[] = [
  {
    id: 1,
    name: "Dr. S Jose",
    role: "Principal",
    dept: "ADMN",
    type: "Permanent",
    basic: 180000,
    components: {
      "Basic Pay": ["Earning", "Fixed", 180000, true],
      "Special Allowance": ["Earning", "Fixed", 50000, true],
      EPF: ["Deduction", "% of Basic", 12, true],
      TDS: ["Deduction", "Fixed", 50000, true],
    },
  },
  {
    id: 2,
    name: "Dr. Reshmila S",
    role: "Professor",
    dept: "EEE",
    type: "Permanent",
    basic: 70100,
    components: {
      "Basic Pay": ["Earning", "Fixed", 70100, true],
      "Special Allowance": ["Earning", "Fixed", 7500, true],
      "Bus Fee": ["Deduction", "Fixed", 1200, false],
      EPF: ["Deduction", "% of Basic", 12, true],
    },
  },
  {
    id: 3,
    name: "Dr. Sunil Kumar P G",
    role: "Professor",
    dept: "NASB",
    type: "Permanent",
    basic: 151565,
    components: {
      "Basic Pay": ["Earning", "Fixed", 151565, true],
      "Travelling Allowance": ["Earning", "Fixed", 1000, true],
      "LIC Premium": ["Deduction", "Fixed", 3500, true],
      TDS: ["Deduction", "Fixed", 38500, true],
    },
  },
  {
    id: 4,
    name: "Mr. G Deepak Varma",
    role: "Administrative Officer",
    dept: "ADMN",
    type: "Probationary",
    basic: 40000,
    components: {
      "Basic Pay": ["Earning", "Fixed", 40000, true],
      "Special Allowance": ["Earning", "Fixed", 5000, true],
      ESI: ["Deduction", "% of Gross", 1.75, true],
    },
  },
  {
    id: 5,
    name: "Dr. P Krishnankutty",
    role: "Professor",
    dept: "NASB",
    type: "Probationary",
    basic: 150000,
    components: {
      "Basic Pay": ["Earning", "Fixed", 150000, true],
      ESI: ["Deduction", "% of Gross", 1.75, false],
    },
  },
]

function calcComponentAmount(entry: EmployeeComponentEntry, basic: number, gross: number) {
  const [, type, value, isActive] = entry
  if (!isActive) return 0

  if (type === "Fixed") return value
  if (type === "% of Basic") return (basic * value) / 100
  return (gross * value) / 100
}

function getEmployeeSummary(employee: EmployeeRecord) {
  const gross = Object.entries(employee.components).reduce((total, [name, entry]) => {
    if (entry[0] !== "Earning" || !entry[3]) return total
    if (name === "Basic Pay") return total + employee.basic
    return total + calcComponentAmount(entry, employee.basic, employee.basic)
  }, 0)

  const deductions = Object.values(employee.components).reduce((total, entry) => {
    if (entry[0] !== "Deduction" || !entry[3]) return total
    return total + calcComponentAmount(entry, employee.basic, gross)
  }, 0)

  return {
    gross,
    deductions,
    net: gross - deductions,
  }
}

function StatusBadge({ status }: { status: SalaryStaffMember["status"] }) {
  const tone =
    status === "Active"
      ? "bg-teal-50 text-teal-700"
      : status === "New joiner"
        ? "bg-blue-50 text-blue-700"
        : "bg-amber-50 text-amber-700"

  return <span className={cn("inline-flex rounded-full px-2 py-1 text-[11px] font-semibold", tone)}>{status}</span>
}

export default function SalaryPage() {
  const [periods, setPeriods] = useState<SalaryPeriod[]>(salaryPeriods)
  const [selectedPeriod, setSelectedPeriod] = useState("June 2026")
  const [activeTab, setActiveTab] = useState<Tab>("register")
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(1)
  const [employeeProfilesState, setEmployeeProfilesState] = useState<EmployeeRecord[]>(employeeProfiles)
  const [newEarningName, setNewEarningName] = useState("")
  const [newEarningType, setNewEarningType] = useState<EmployeeComponentType>("Fixed")
  const [newDeductionName, setNewDeductionName] = useState("")
  const [newDeductionType, setNewDeductionType] = useState<EmployeeComponentType>("Fixed")

  useEffect(() => {
    void salaryApi.listPeriods().then((data) => setPeriods(data))
  }, [])

  const period = periods.find((item) => item.name === selectedPeriod) ?? periods[0]

  const selectedEmployee =
    employeeProfilesState.find((employee) => employee.id === selectedEmployeeId) ?? employeeProfilesState[0]

  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return salaryStaff
    return salaryStaff.filter((item) => `${item.name} ${item.role} ${item.department}`.toLowerCase().includes(query))
  }, [search])

  const employeeTotals = useMemo(() => getEmployeeSummary(selectedEmployee), [selectedEmployee])

  const updateEmployeeComponent = (componentName: string, toggled?: boolean) => {
    setEmployeeProfilesState((current) =>
      current.map((employee) => {
        if (employee.id !== selectedEmployeeId) return employee

        const component = employee.components[componentName]
        if (!component) return employee

        return {
          ...employee,
          components: {
            ...employee.components,
            [componentName]: toggled === undefined ? component : [component[0], component[1], component[2], toggled],
          },
        }
      }),
    )
  }

  const addComponent = (kind: EmployeeComponentKind) => {
    const name = kind === "Earning" ? newEarningName.trim() : newDeductionName.trim()
    const type = kind === "Earning" ? newEarningType : newDeductionType
    const value = 0

    if (!name) return

    setEmployeeProfilesState((current) =>
      current.map((employee) => {
        if (employee.id !== selectedEmployeeId) return employee

        return {
          ...employee,
          components: {
            ...employee.components,
            [name]: [kind, type, value, true],
          },
        }
      }),
    )

    if (kind === "Earning") {
      setNewEarningName("")
      setNewEarningType("Fixed")
    } else {
      setNewDeductionName("")
      setNewDeductionType("Fixed")
    }

    setIsModalOpen(false)
  }

  return (
    <div className="mx-auto max-w-[1250px] pb-12">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payroll Register</h1>
          <p className="mt-1 text-sm text-slate-500">Monthly salary register and payroll summary</p>
        </div>

        <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="sr-only">Payroll period</span>
          <select
            value={selectedPeriod}
            onChange={(event) => setSelectedPeriod(event.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-teal-500"
          >
            {periods.map((item) => (
              <option key={item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </header>

      {period && (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total Staff", value: period.staffCount },
              { label: "Gross Payable", value: formatMoney(period.grossPayable) },
              { label: "Total Deductions", value: formatMoney(period.deductions) },
              { label: "Net Payable", value: formatMoney(period.netPayable) },
            ].map((item, index) => (
              <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">{item.label}</p>
                <p className={cn("text-[22px] font-bold text-slate-900", index === 3 && "text-teal-600")}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-200">
            {[
              { id: "register", label: "Staff Register" },
              { id: "summary", label: "Salary Summary" },
              { id: "configure", label: "Configure Salary" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  "whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition",
                  activeTab === tab.id
                    ? "border-teal-600 text-teal-600"
                    : "border-transparent text-slate-500 hover:text-slate-900",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "register" && (
            <section>
              <div className="my-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Staff Register</h2>
                  <p className="mt-1 text-xs text-slate-500">Payroll period: {selectedPeriod}</p>
                </div>

                <div className="relative w-full sm:w-[320px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search staff member or department..."
                    className="h-10 pl-9 text-sm"
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px] border-collapse text-left">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.08em] text-slate-500">
                      <tr>
                        {[
                          "Sl.",
                          "Staff member",
                          "Department",
                          "Joined",
                          "Salary Type",
                          "Basic / consolidated",
                          "Allowance",
                          "Deductions",
                          "Net Payable",
                          "Status",
                        ].map((heading) => (
                          <th key={heading} className="border-b border-slate-200 px-4 py-3 font-semibold">
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStaff.map((item, index) => {
                        const allowance = Math.round(item.base * 0.06)
                        const deductions = Math.round(item.base * 0.07)
                        const net = item.base + allowance - deductions

                        return (
                          <tr key={`${item.name}-${item.role}`} className="border-b border-slate-100 last:border-0">
                            <td className="px-4 py-3 text-sm text-slate-700">{index + 1}</td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                              <p className="mt-1 text-[11px] text-slate-500">{item.role}</p>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-700">{item.department}</td>
                            <td className="px-4 py-3 text-sm text-slate-700">{item.joined}</td>
                            <td className="px-4 py-3 text-sm text-slate-700">{item.salaryType}</td>
                            <td className="px-4 py-3 text-right font-mono text-xs text-slate-900">{formatMoney(item.base)}</td>
                            <td className="px-4 py-3 text-right font-mono text-xs text-slate-900">{formatMoney(allowance)}</td>
                            <td className="px-4 py-3 text-right font-mono text-xs text-red-700">{formatMoney(deductions)}</td>
                            <td className="px-4 py-3 text-right font-mono text-xs font-bold text-slate-900">{formatMoney(net)}</td>
                            <td className="px-4 py-3">{item.status && <StatusBadge status={item.status} />}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {activeTab === "summary" && (
            <section className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="text-[15px] font-bold text-slate-900">Salary Summary</h2>
                  <p className="mt-1 text-xs text-slate-500">Component-wise payroll summary for the selected month</p>
                </div>
                <span className="text-xs font-medium text-slate-500">{selectedPeriod}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left">
                  <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <tr>
                      <th className="border-b border-slate-200 px-5 py-3">Component</th>
                      <th className="border-b border-slate-200 px-5 py-3">Permanent Staff</th>
                      <th className="border-b border-slate-200 px-5 py-3">Probationary Staff</th>
                      <th className="border-b border-slate-200 px-5 py-3">Total</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-slate-700">
                    {[
                      { label: "Basic pay", permanent: period.permanent.earnings[0]?.amount ?? 0, probationary: period.probationary.earnings[0]?.amount ?? 0 },
                      { label: "Special pay", permanent: period.permanent.earnings[1]?.amount ?? 0, probationary: period.probationary.earnings[1]?.amount ?? 0 },
                      { label: "Travelling allowance", permanent: period.permanent.earnings[2]?.amount ?? 0, probationary: 0 },
                      { label: "Gross earnings", permanent: period.permanent.earnings[3]?.amount ?? 0, probationary: period.probationary.earnings[3]?.amount ?? 0 },
                      { label: "LWA / excess paid", permanent: period.permanent.less[0]?.amount ?? 0, probationary: period.probationary.less[0]?.amount ?? 0 },
                      { label: "Total deductions", permanent: period.permanent.deductions[period.permanent.deductions.length - 1]?.amount ?? 0, probationary: period.probationary.deductions[period.probationary.deductions.length - 1]?.amount ?? 0 },
                      { label: "Net payable", permanent: period.permanent.netPayable, probationary: period.probationary.netPayable },
                    ].map((row) => {
                      const total = row.permanent + row.probationary

                      return (
                        <tr key={row.label} className="border-b border-slate-100 last:border-0">
                          <td className="px-5 py-3 font-semibold text-slate-900">{row.label}</td>
                          <td className="px-5 py-3 font-mono text-xs text-slate-700">{formatMoney(row.permanent)}</td>
                          <td className="px-5 py-3 font-mono text-xs text-slate-700">{formatMoney(row.probationary)}</td>
                          <td className="px-5 py-3 font-mono text-xs font-bold text-slate-900">{formatMoney(total)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-5 py-4 text-base font-bold text-slate-900">
                Combined Net Payable: <span className="text-teal-600">{formatMoney(period.netPayable)}</span>
              </div>
            </section>
          )}

          {activeTab === "configure" && (
            <section className="mt-5">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <label className="text-xs font-medium text-slate-500">
                  Select Employee
                  <select
                    value={selectedEmployeeId}
                    onChange={(event) => setSelectedEmployeeId(Number(event.target.value))}
                    className="mt-2 block h-10 min-w-[340px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500"
                  >
                    {employeeProfilesState.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} · {employee.role} · {employee.dept}
                      </option>
                    ))}
                  </select>
                </label>

                <Button type="button" onClick={() => setIsModalOpen(true)} className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Configure Components
                </Button>
              </div>

              <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Employee</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{selectedEmployee.name}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Role</p>
                  <p className="mt-2 text-sm text-slate-700">{selectedEmployee.role}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Department</p>
                  <p className="mt-2 text-sm text-slate-700">{selectedEmployee.dept}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Employment</p>
                  <p className="mt-2 text-sm text-slate-700">{selectedEmployee.type}</p>
                </div>
              </div>

              <div className="space-y-4">
                {["Earning", "Deduction" as const].map((kind) => {
                  const rows = Object.entries(selectedEmployee.components).filter(([_, entry]) => entry[0] === kind)

                  return (
                    <div key={kind} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
                        <div>
                          <div className="text-base font-bold text-slate-900">{kind === "Earning" ? "Earnings" : "Deductions"}</div>
                          <div className="mt-1 text-[11px] text-slate-500">
                            {kind === "Earning" ? "Allowances and other earning components" : "Salary reductions applied to this employee"}
                          </div>
                        </div>
                        <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                          {rows.length} {rows.length === 1 ? "component" : "components"}
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[750px] border-collapse text-left">
                          <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.08em] text-slate-500">
                            <tr>
                              <th className="border-b border-slate-200 px-4 py-3 font-semibold">Component</th>
                              <th className="border-b border-slate-200 px-4 py-3 font-semibold">Type</th>
                              <th className="border-b border-slate-200 px-4 py-3 font-semibold">Value</th>
                              <th className="border-b border-slate-200 px-4 py-3 font-semibold">Status</th>
                              <th className="border-b border-slate-200 px-4 py-3 font-semibold">Applied Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                                  No {kind.toLowerCase()} components added yet.
                                </td>
                              </tr>
                            ) : (
                              rows.map(([name, entry]) => {
                                const amount = calcComponentAmount(entry, selectedEmployee.basic, employeeTotals.gross)

                                return (
                                  <tr key={name} className="border-b border-slate-100 last:border-0">
                                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{name}</td>
                                    <td className="px-4 py-3 text-sm text-slate-700">{entry[1]}</td>
                                    <td className="px-4 py-3 text-sm font-mono text-slate-900">{entry[1] === "Fixed" ? formatMoney(entry[2]) : `${entry[2]}%`}</td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-3">
                                        <button
                                          type="button"
                                          aria-label={`Toggle ${name}`}
                                          onClick={() => updateEmployeeComponent(name, !entry[3])}
                                          className={cn(
                                            "relative inline-flex h-6 w-11 items-center rounded-full transition",
                                            entry[3] ? "bg-teal-600" : "bg-slate-200",
                                          )}
                                        >
                                          <span
                                            className={cn(
                                              "inline-block h-4 w-4 rounded-full bg-white transition",
                                              entry[3] ? "translate-x-6" : "translate-x-1",
                                            )}
                                          />
                                        </button>
                                        <span className={cn("text-xs font-semibold", entry[3] ? "text-teal-700" : "text-slate-500")}>{entry[3] ? "Active" : "Inactive"}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-xs text-slate-900">{formatMoney(amount)}</td>
                                  </tr>
                                )
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Active Earnings</p>
                  <p className="mt-2 text-[18px] font-bold text-slate-900">{formatMoney(employeeTotals.gross)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Active Deductions</p>
                  <p className="mt-2 text-[18px] font-bold text-slate-900">{formatMoney(employeeTotals.deductions)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Estimated Net</p>
                  <p className="mt-2 text-[18px] font-bold text-slate-900">{formatMoney(employeeTotals.net)}</p>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      <div className="mt-6 text-xs text-slate-500">Demo frontend only. Company components and employee salary settings are static and can later be connected to the backend.</div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add Salary Components</h3>
                <p className="mt-1 text-xs text-slate-500">Type a component name and save it directly to the selected employee</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg border border-slate-200 bg-slate-100 p-2 text-slate-500 hover:bg-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-6 p-5">
              <div>
                <h4 className="mb-3 text-sm font-bold text-slate-900">Earning Components</h4>
                <div className="flex flex-col gap-2 md:flex-row">
                  <Input
                    value={newEarningName}
                    onChange={(event) => setNewEarningName(event.target.value)}
                    placeholder="Enter earning component name"
                    className="flex-1"
                  />
                  <select
                    value={newEarningType}
                    onChange={(event) => setNewEarningType(event.target.value as EmployeeComponentType)}
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
                  >
                    <option value="Fixed">Fixed</option>
                    <option value="% of Basic">% of Basic</option>
                    <option value="% of Gross">% of Gross</option>
                  </select>
                  <Button type="button" onClick={() => addComponent("Earning")} className="bg-teal-600 hover:bg-teal-700">
                    <Plus className="mr-2 h-4 w-4" /> Add
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-bold text-slate-900">Deduction Components</h4>
                <div className="flex flex-col gap-2 md:flex-row">
                  <Input
                    value={newDeductionName}
                    onChange={(event) => setNewDeductionName(event.target.value)}
                    placeholder="Enter deduction component name"
                    className="flex-1"
                  />
                  <select
                    value={newDeductionType}
                    onChange={(event) => setNewDeductionType(event.target.value as EmployeeComponentType)}
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
                  >
                    <option value="Fixed">Fixed</option>
                    <option value="% of Basic">% of Basic</option>
                    <option value="% of Gross">% of Gross</option>
                  </select>
                  <Button type="button" onClick={() => addComponent("Deduction")} className="bg-teal-600 hover:bg-teal-700">
                    <Plus className="mr-2 h-4 w-4" /> Add
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 px-5 py-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
