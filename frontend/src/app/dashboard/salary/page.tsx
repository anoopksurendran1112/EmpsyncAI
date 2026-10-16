"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Search, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  salaryApi,
  type SalaryComponentRow,
  type SalaryComponentType,
  type SalaryComponentValue,
  type SalaryConfigData,
  type SalaryEmployeeDetail,
  type SalaryEmployeeSummary,
  type SalaryRevision,
  type SalarySummary,
  type SalaryTotals,
} from "./salary-api"

type Tab = "register" | "summary" | "configure"

interface ReportingPeriod {
  value: string
  label: string
}

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
})

const formatMoney = (value: number | null | undefined) =>
  Number.isFinite(value as number) ? currency.format(value as number) : "—"

// Periods are generated from the current date down to the earliest known data
// (no hardcoded list). Falls back to the last 12 months when unknown.
function buildPeriods(earliest?: string | null): ReportingPeriod[] {
  const now = new Date()
  let limit = 12
  if (earliest && /^\d{4}-\d{2}$/.test(earliest)) {
    const [year, month] = earliest.split("-").map(Number)
    const diff = (now.getFullYear() - year) * 12 + (now.getMonth() - (month - 1))
    limit = Math.max(1, Math.min(diff + 1, 240))
  }

  const periods: ReportingPeriod[] = []
  for (let offset = 0; offset < limit; offset += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    periods.push({
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: date.toLocaleString("en-US", { month: "long", year: "numeric" }),
    })
  }
  return periods
}

function formatMonth(value?: string | null): string {
  if (!value) return "—"
  const [year, month] = value.split("-").map(Number)
  if (!year || !month) return value
  return new Date(year, month - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" })
}

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

const SALARY_TYPES = [
  { value: "regular", label: "Regular" },
  { value: "consolidated", label: "Consolidated" },
  { value: "per_diem", label: "Per diem" },
]

const EMPLOYMENT_TYPES = [
  { value: "permanent", label: "Permanent" },
  { value: "probationary", label: "Probationary" },
]

const STATUSES = [
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On hold" },
  { value: "new_joiner", label: "New joiner" },
  { value: "on_lwa", label: "On LWA" },
  { value: "per_diem", label: "Per diem" },
  { value: "exited", label: "Exited" },
]

const REVISION_REASONS = [
  { value: "increment", label: "Increment / revision" },
  { value: "promotion", label: "Promotion" },
  { value: "correction", label: "Correction" },
  { value: "status", label: "Status change" },
  { value: "initial", label: "Initial setup" },
  { value: "other", label: "Other" },
]

const reasonLabel = (value: string) =>
  REVISION_REASONS.find((item) => item.value === value)?.label ?? value

const TYPE_LABELS: Record<SalaryComponentType, string> = {
  fixed: "Fixed",
  percent_basic: "% of Basic",
  percent_gross: "% of Gross",
}

const COMPONENT_TYPES: SalaryComponentType[] = ["fixed", "percent_basic", "percent_gross"]

const salaryTypeLabel = (value: string) =>
  SALARY_TYPES.find((item) => item.value === value)?.label ?? value

type Draft = Record<string, SalaryComponentValue>

function draftFromDetail(detail: SalaryEmployeeDetail): Draft {
  const draft: Draft = {}
  for (const component of detail.components) {
    draft[component.key] = { value: component.value, active: component.active }
  }
  return draft
}

function computePreview(components: SalaryComponentRow[], draft: Draft) {
  const rows = components.map((component) => {
    const entry = draft[component.key]
    return {
      ...component,
      value: entry ? entry.value : component.value,
      active: entry ? entry.active : component.active,
    }
  })

  let basic = 0
  for (const row of rows) {
    if (row.kind === "earning" && row.key === "basic" && row.active) basic = row.value || 0
  }

  let gross = 0
  for (const row of rows) {
    if (row.kind !== "earning" || !row.active) continue
    const value = row.value || 0
    if (row.type === "fixed") gross += value
    else if (row.type === "percent_basic") gross += (basic * value) / 100
  }
  for (const row of rows) {
    if (row.kind === "earning" && row.active && row.type === "percent_gross") {
      gross += (gross * (row.value || 0)) / 100
    }
  }

  let deductions = 0
  for (const row of rows) {
    if (row.kind !== "deduction" || !row.active) continue
    const value = row.value || 0
    if (row.type === "fixed") deductions += value
    else if (row.type === "percent_basic") deductions += (basic * value) / 100
    else if (row.type === "percent_gross") deductions += (gross * value) / 100
  }

  const applied: Record<string, number> = {}
  for (const row of rows) {
    const value = row.value || 0
    if (!row.active) {
      applied[row.key] = 0
    } else if (row.type === "fixed") {
      applied[row.key] = value
    } else if (row.type === "percent_basic") {
      applied[row.key] = (basic * value) / 100
    } else {
      applied[row.key] = (gross * value) / 100
    }
  }

  const totals: SalaryTotals = { basic, gross, deductions, net: gross - deductions }
  return { rows, applied, totals }
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Active"
      ? "bg-teal-50 text-teal-700"
      : status === "New joiner"
        ? "bg-blue-50 text-blue-700"
        : "bg-amber-50 text-amber-700"

  return (
    <span className={cn("inline-flex rounded-full px-2 py-1 text-[11px] font-semibold", tone)}>
      {status}
    </span>
  )
}

export default function SalaryPage() {
  const [earliestMonth, setEarliestMonth] = useState<string | null>(null)
  const periods = useMemo(() => buildPeriods(earliestMonth), [earliestMonth])
  const [selectedPeriod, setSelectedPeriod] = useState(periods[0].value)
  const [activeTab, setActiveTab] = useState<Tab>("register")
  const [search, setSearch] = useState("")

  const [employees, setEmployees] = useState<SalaryEmployeeSummary[]>([])
  const [employeesLoading, setEmployeesLoading] = useState(true)
  const [summary, setSummary] = useState<SalarySummary | null>(null)

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null)
  const [detail, setDetail] = useState<SalaryEmployeeDetail | null>(null)
  const [draft, setDraft] = useState<Draft>({})
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [history, setHistory] = useState<SalaryRevision[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [salaryMonth, setSalaryMonth] = useState("")
  const [revisionReason, setRevisionReason] = useState("increment")
  const [effectiveNote, setEffectiveNote] = useState("")
  const [pendingSave, setPendingSave] = useState<{ month: string; isCorrection: boolean } | null>(
    null,
  )

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [config, setConfig] = useState<SalaryConfigData | null>(null)
  const [configSaving, setConfigSaving] = useState(false)
  const [newEarningName, setNewEarningName] = useState("")
  const [newEarningType, setNewEarningType] = useState<SalaryComponentType>("fixed")
  const [newEarningValue, setNewEarningValue] = useState("")
  const [newDeductionName, setNewDeductionName] = useState("")
  const [newDeductionType, setNewDeductionType] = useState<SalaryComponentType>("fixed")
  const [newDeductionValue, setNewDeductionValue] = useState("")

  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null)

  const periodLabel = periods.find((item) => item.value === selectedPeriod)?.label ?? selectedPeriod

  const loadEmployees = async (month: string) => {
    setEmployeesLoading(true)
    try {
      const data = await salaryApi.listEmployees(month)
      setEmployees(data)
      setSelectedEmployeeId((current) => current ?? data[0]?.employee_id ?? null)
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message })
    } finally {
      setEmployeesLoading(false)
    }
  }

  const loadSummary = async (month: string) => {
    try {
      setSummary(await salaryApi.getSummary(month))
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message })
    }
  }

  const loadHistory = async (employeeId: number) => {
    setHistoryLoading(true)
    try {
      setHistory(await salaryApi.getHistory(employeeId))
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  // Register + summary follow the selected payroll period.
  useEffect(() => {
    void loadEmployees(selectedPeriod)
    void loadSummary(selectedPeriod)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod])

  // Widen the period dropdown back to the earliest structure/join date.
  useEffect(() => {
    if (employeesLoading) return
    let earliest: string | null = null
    for (const employee of employees) {
      for (const candidate of [employee.structure_effective_from, employee.joined]) {
        if (!candidate) continue
        const month = candidate.slice(0, 7)
        if (!earliest || month < earliest) earliest = month
      }
    }
    if (earliest) {
      setEarliestMonth((current) => (current && current < earliest ? current : earliest))
    }
  }, [employees, employeesLoading])

  // The configure tab always edits the *current* structure.
  useEffect(() => {
    if (selectedEmployeeId == null) {
      setDetail(null)
      setHistory([])
      return
    }
    let cancelled = false
    setDetailLoading(true)
    salaryApi
      .getEmployee(selectedEmployeeId)
      .then((data) => {
        if (cancelled) return
        setDetail(data)
        setDraft(draftFromDetail(data))
        setSalaryMonth(data.effective_from ? data.effective_from.slice(0, 7) : currentMonth())
        setEffectiveNote(data.notes || "")
      })
      .catch((error: Error) => {
        if (!cancelled) setNotice({ tone: "error", text: error.message })
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })
    void loadHistory(selectedEmployeeId)
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployeeId])

  const filteredRegister = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return employees
    return employees.filter((item) =>
      `${item.name} ${item.role} ${item.dept}`.toLowerCase().includes(query),
    )
  }, [employees, search])

  const preview = useMemo(
    () => (detail ? computePreview(detail.components, draft) : null),
    [detail, draft],
  )

  const existingForMonth = useMemo(
    () =>
      history.find((revision) => revision.effective_from.slice(0, 7) === salaryMonth) ?? null,
    [history, salaryMonth],
  )

  // Monthly pattern: an existing month is a correction, otherwise it is new data.
  useEffect(() => {
    if (!salaryMonth) return
    setRevisionReason(
      existingForMonth ? "correction" : detail?.configured ? "increment" : "initial",
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salaryMonth, existingForMonth, detail?.configured])

  const earningRows = preview?.rows.filter((row) => row.kind === "earning") ?? []
  const deductionRows = preview?.rows.filter((row) => row.kind === "deduction") ?? []

  const summaryEarnings = summary?.components.filter((row) => row.kind === "earning") ?? []
  const summaryDeductions = summary?.components.filter((row) => row.kind === "deduction") ?? []

  const updateDraft = (key: string, patch: Partial<SalaryComponentValue>) => {
    setDraft((current) => ({ ...current, [key]: { ...current[key], ...patch } }))
  }

  const requestSaveEmployee = () => {
    if (!detail || !selectedEmployeeId) return
    if (!salaryMonth) {
      setNotice({ tone: "error", text: "Choose a salary month first." })
      return
    }
    setPendingSave({ month: salaryMonth, isCorrection: Boolean(existingForMonth) })
  }

  const confirmSaveEmployee = async () => {
    if (!detail || !selectedEmployeeId || !pendingSave) return
    const intent = pendingSave
    setPendingSave(null)
    setSaving(true)
    setNotice(null)
    try {
      const saved = await salaryApi.saveEmployee(selectedEmployeeId, {
        salary_type: detail.salary_type,
        employment_type: detail.employment_type,
        status: detail.status,
        components: draft,
        notes: effectiveNote,
        effective_from: `${intent.month}-01`,
        reason: intent.isCorrection ? "correction" : revisionReason,
      })
      setDetail((current) =>
        current
          ? {
              ...current,
              salary_type: saved.salary_type,
              employment_type: saved.employment_type,
              status: saved.status,
              status_label: saved.status_label,
              configured: true,
              components: saved.components,
              totals: saved.totals,
              effective_from: saved.effective_from,
            }
          : current,
      )
      setNotice({
        tone: "success",
        text: intent.isCorrection
          ? `Salary data for ${formatMonth(intent.month)} updated.`
          : `New salary data created for ${formatMonth(intent.month)}.`,
      })
      void loadEmployees(selectedPeriod)
      void loadSummary(selectedPeriod)
      void loadHistory(selectedEmployeeId)
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message })
    } finally {
      setSaving(false)
    }
  }

  const openConfigModal = async () => {
    setIsModalOpen(true)
    if (config) return
    try {
      setConfig(await salaryApi.getConfig())
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message })
    }
  }

  const addConfigComponent = (kind: "earning" | "deduction") => {
    const name = (kind === "earning" ? newEarningName : newDeductionName).trim()
    const type = kind === "earning" ? newEarningType : newDeductionType
    const rawValue = kind === "earning" ? newEarningValue : newDeductionValue
    if (!name || !config) return

    const value = type === "fixed" ? 0 : Number(rawValue) || 0
    const next: SalaryConfigData = {
      ...config,
      earnings: kind === "earning" ? [...config.earnings, { name, type, value }] : config.earnings,
      deductions:
        kind === "deduction" ? [...config.deductions, { name, type, value }] : config.deductions,
    }
    setConfig(next)

    if (kind === "earning") {
      setNewEarningName("")
      setNewEarningType("fixed")
      setNewEarningValue("")
    } else {
      setNewDeductionName("")
      setNewDeductionType("fixed")
      setNewDeductionValue("")
    }
  }

  const removeConfigComponent = (kind: "earning" | "deduction", index: number) => {
    if (!config) return
    const next: SalaryConfigData = {
      ...config,
      earnings:
        kind === "earning"
          ? config.earnings.filter((_, i) => i !== index)
          : config.earnings,
      deductions:
        kind === "deduction"
          ? config.deductions.filter((_, i) => i !== index)
          : config.deductions,
    }
    setConfig(next)
  }

  const handleSaveConfig = async () => {
    if (!config) return
    setConfigSaving(true)
    setNotice(null)
    try {
      const saved = await salaryApi.saveConfig(config)
      setConfig(saved)
      setIsModalOpen(false)
      setNotice({ tone: "success", text: "Company salary components saved." })
      if (selectedEmployeeId != null) {
        const refreshed = await salaryApi.getEmployee(selectedEmployeeId)
        setDetail(refreshed)
        setDraft(draftFromDetail(refreshed))
      }
      void loadSummary(selectedPeriod)
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message })
    } finally {
      setConfigSaving(false)
    }
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
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </header>

      {notice && (
        <div
          className={cn(
            "mb-4 rounded-lg border px-4 py-3 text-sm",
            notice.tone === "success"
              ? "border-teal-200 bg-teal-50 text-teal-800"
              : "border-red-200 bg-red-50 text-red-700",
          )}
        >
          {notice.text}
        </div>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Staff on Payroll", value: summary ? String(summary.totals.staff_count) : "—" },
          { label: "Gross Payable", value: formatMoney(summary?.totals.gross) },
          { label: "Total Deductions", value: formatMoney(summary?.totals.deductions) },
          { label: "Net Payable", value: formatMoney(summary?.totals.net) },
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
              <p className="mt-1 text-xs text-slate-500">Payroll period: {periodLabel}</p>
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
              <table className="w-full min-w-[1250px] border-collapse text-left">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.08em] text-slate-500">
                  <tr>
                    {[
                      "Sl.",
                      "Staff member",
                      "Department",
                      "Joined",
                      "Structure month",
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
                  {employeesLoading ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-8 text-center text-sm text-slate-500">
                        Loading staff…
                      </td>
                    </tr>
                  ) : filteredRegister.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-8 text-center text-sm text-slate-500">
                        No staff members found.
                      </td>
                    </tr>
                  ) : (
                    filteredRegister.map((item, index) => {
                      const allowance = item.gross - item.basic
                      return (
                        <tr key={item.employee_id} className="border-b border-slate-100 last:border-0">
                          <td className="px-4 py-3 text-sm text-slate-700">{index + 1}</td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                            <p className="mt-1 text-[11px] text-slate-500">{item.role}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">{item.dept}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{item.joined || "—"}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            {item.structure_effective_from ? formatMonth(item.structure_effective_from) : "—"}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">{salaryTypeLabel(item.salary_type)}</td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-slate-900">{formatMoney(item.basic)}</td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-slate-900">{formatMoney(allowance)}</td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-red-700">{formatMoney(item.deductions)}</td>
                          <td className="px-4 py-3 text-right font-mono text-xs font-bold text-slate-900">{formatMoney(item.net)}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={item.status_label} />
                          </td>
                        </tr>
                      )
                    })
                  )}
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
              <p className="mt-1 text-xs text-slate-500">
                Component-wise payroll summary for the selected month
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500">{periodLabel}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="border-b border-slate-200 px-5 py-3">Component</th>
                  <th className="border-b border-slate-200 px-5 py-3">
                    Permanent Staff
                    {summary ? <span className="ml-1 normal-case text-slate-400">({summary.permanent.staff_count})</span> : null}
                  </th>
                  <th className="border-b border-slate-200 px-5 py-3">
                    Probationary Staff
                    {summary ? <span className="ml-1 normal-case text-slate-400">({summary.probationary.staff_count})</span> : null}
                  </th>
                  <th className="border-b border-slate-200 px-5 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700">
                {!summary ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">
                      Loading summary…
                    </td>
                  </tr>
                ) : (
                  <>
                    {summaryEarnings.map((row) => (
                      <tr key={row.key} className="border-b border-slate-100">
                        <td className="px-5 py-3 font-medium text-slate-900">{row.name}</td>
                        <td className="px-5 py-3 font-mono text-xs text-slate-700">{formatMoney(row.permanent)}</td>
                        <td className="px-5 py-3 font-mono text-xs text-slate-700">{formatMoney(row.probationary)}</td>
                        <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-900">{formatMoney(row.total)}</td>
                      </tr>
                    ))}
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <td className="px-5 py-3 font-bold text-slate-900">Gross earnings</td>
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-900">{formatMoney(summary.permanent.gross)}</td>
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-900">{formatMoney(summary.probationary.gross)}</td>
                      <td className="px-5 py-3 font-mono text-xs font-bold text-slate-900">{formatMoney(summary.totals.gross)}</td>
                    </tr>
                    {summaryDeductions.map((row) => (
                      <tr key={row.key} className="border-b border-slate-100">
                        <td className="px-5 py-3 font-medium text-slate-900">{row.name}</td>
                        <td className="px-5 py-3 font-mono text-xs text-slate-700">{formatMoney(row.permanent)}</td>
                        <td className="px-5 py-3 font-mono text-xs text-slate-700">{formatMoney(row.probationary)}</td>
                        <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-900">{formatMoney(row.total)}</td>
                      </tr>
                    ))}
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <td className="px-5 py-3 font-bold text-slate-900">Total deductions</td>
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-red-700">{formatMoney(summary.permanent.deductions)}</td>
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-red-700">{formatMoney(summary.probationary.deductions)}</td>
                      <td className="px-5 py-3 font-mono text-xs font-bold text-red-700">{formatMoney(summary.totals.deductions)}</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 font-bold text-slate-900">Net payable</td>
                      <td className="px-5 py-3 font-mono text-xs font-bold text-teal-700">{formatMoney(summary.permanent.net)}</td>
                      <td className="px-5 py-3 font-mono text-xs font-bold text-teal-700">{formatMoney(summary.probationary.net)}</td>
                      <td className="px-5 py-3 font-mono text-xs font-bold text-teal-700">{formatMoney(summary.totals.net)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-4 text-base font-bold text-slate-900">
            Combined Net Payable: <span className="text-teal-600">{formatMoney(summary?.totals.net)}</span>
          </div>
        </section>
      )}

      {activeTab === "configure" && (
        <section className="mt-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="text-xs font-medium text-slate-500">
              Select Employee
              <select
                value={selectedEmployeeId ?? ""}
                onChange={(event) => setSelectedEmployeeId(Number(event.target.value))}
                className="mt-2 block h-10 min-w-[340px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500"
              >
                {employees.length === 0 && <option value="">No employees</option>}
                {employees.map((employee) => (
                  <option key={employee.employee_id} value={employee.employee_id}>
                    {employee.name} · {employee.role} · {employee.dept}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={openConfigModal}>
                Company Components
              </Button>
              <Button
                type="button"
                onClick={requestSaveEmployee}
                disabled={!detail || saving}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {saving ? "Saving…" : "Save Structure"}
              </Button>
            </div>
          </div>

          {detailLoading || !detail || !preview ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              {detailLoading ? "Loading salary structure…" : "Select an employee to configure salary."}
            </div>
          ) : (
            <>
              <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Employee</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{detail.name}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Role</p>
                  <p className="mt-2 text-sm text-slate-700">{detail.role || "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Department</p>
                  <p className="mt-2 text-sm text-slate-700">{detail.dept || "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Status</p>
                  <p className="mt-2 text-sm text-slate-700">{[detail.status_label, detail.configured ? null : "Not configured"].filter(Boolean).join(" · ")}</p>
                </div>
              </div>

              <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
                <label className="text-xs font-medium text-slate-500">
                  Salary Type
                  <select
                    value={detail.salary_type}
                    onChange={(event) => setDetail({ ...detail, salary_type: event.target.value })}
                    className="mt-2 block h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:border-teal-500"
                  >
                    {SALARY_TYPES.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-medium text-slate-500">
                  Employment
                  <select
                    value={detail.employment_type}
                    onChange={(event) => setDetail({ ...detail, employment_type: event.target.value })}
                    className="mt-2 block h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:border-teal-500"
                  >
                    {EMPLOYMENT_TYPES.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-medium text-slate-500">
                  Status
                  <select
                    value={detail.status}
                    onChange={(event) => setDetail({ ...detail, status: event.target.value })}
                    className="mt-2 block h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:border-teal-500"
                  >
                    {STATUSES.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
                <label className="text-xs font-medium text-slate-500">
                  Salary Month
                  <input
                    type="month"
                    value={salaryMonth}
                    onChange={(event) => setSalaryMonth(event.target.value)}
                    className="mt-2 block h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:border-teal-500"
                  />
                </label>
                <label className="text-xs font-medium text-slate-500">
                  Reason
                  <select
                    value={revisionReason}
                    onChange={(event) => setRevisionReason(event.target.value)}
                    className="mt-2 block h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:border-teal-500"
                  >
                    {REVISION_REASONS.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-medium text-slate-500">
                  Note
                  <input
                    type="text"
                    value={effectiveNote}
                    onChange={(event) => setEffectiveNote(event.target.value)}
                    placeholder="Optional note for this month"
                    className="mt-2 block h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:border-teal-500"
                  />
                </label>
                <p className="text-[11px] sm:col-span-3">
                  {existingForMonth ? (
                    <span className="font-medium text-amber-700">
                      {formatMonth(salaryMonth)} already has a salary record — saving will update it
                      (correction).
                    </span>
                  ) : (
                    <span className="font-medium text-teal-700">
                      No record for {formatMonth(salaryMonth)} — saving will create new salary data.
                    </span>
                  )}
                </p>
              </div>

              <div className="space-y-4">
                {(
                  [
                    { kind: "earning" as const, rows: earningRows, title: "Earnings", hint: "Allowances and other earning components" },
                    { kind: "deduction" as const, rows: deductionRows, title: "Deductions", hint: "Salary reductions applied to this employee" },
                  ]
                ).map((group) => (
                  <div key={group.kind} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
                      <div>
                        <div className="text-base font-bold text-slate-900">{group.title}</div>
                        <div className="mt-1 text-[11px] text-slate-500">{group.hint}</div>
                      </div>
                      <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        {group.rows.length} {group.rows.length === 1 ? "component" : "components"}
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
                          {group.rows.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                                No {group.title.toLowerCase()} configured. Use “Company Components” to add some.
                              </td>
                            </tr>
                          ) : (
                            group.rows.map((row) => {
                              const entry = draft[row.key] ?? { value: row.value, active: row.active }
                              return (
                                <tr key={row.key} className="border-b border-slate-100 last:border-0">
                                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.name}</td>
                                  <td className="px-4 py-3 text-sm text-slate-700">{TYPE_LABELS[row.type]}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-1">
                                      <Input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={entry.value}
                                        onChange={(event) =>
                                          updateDraft(row.key, { value: Number(event.target.value) || 0 })
                                        }
                                        className="h-9 w-28 text-right text-sm"
                                      />
                                      {row.type !== "fixed" && <span className="text-sm text-slate-500">%</span>}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      <button
                                        type="button"
                                        aria-label={`Toggle ${row.name}`}
                                        onClick={() => updateDraft(row.key, { active: !entry.active })}
                                        className={cn(
                                          "relative inline-flex h-6 w-11 items-center rounded-full transition",
                                          entry.active ? "bg-teal-600" : "bg-slate-200",
                                        )}
                                      >
                                        <span
                                          className={cn(
                                            "inline-block h-4 w-4 rounded-full bg-white transition",
                                            entry.active ? "translate-x-6" : "translate-x-1",
                                          )}
                                        />
                                      </button>
                                      <span className={cn("text-xs font-semibold", entry.active ? "text-teal-700" : "text-slate-500")}>
                                        {entry.active ? "Active" : "Inactive"}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-right font-mono text-xs text-slate-900">
                                    {formatMoney(preview.applied[row.key] ?? 0)}
                                  </td>
                                </tr>
                              )
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Active Earnings</p>
                  <p className="mt-2 text-[18px] font-bold text-slate-900">{formatMoney(preview.totals.gross)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Active Deductions</p>
                  <p className="mt-2 text-[18px] font-bold text-slate-900">{formatMoney(preview.totals.deductions)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Estimated Net</p>
                  <p className="mt-2 text-[18px] font-bold text-slate-900">{formatMoney(preview.totals.net)}</p>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
                  <div>
                    <div className="text-base font-bold text-slate-900">Salary History</div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      Every effective-dated revision for {detail.name}
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    {history.length} {history.length === 1 ? "revision" : "revisions"}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] border-collapse text-left">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.08em] text-slate-500">
                      <tr>
                        <th className="border-b border-slate-200 px-5 py-3 font-semibold">Salary Month</th>
                        <th className="border-b border-slate-200 px-5 py-3 font-semibold">Reason</th>
                        <th className="border-b border-slate-200 px-5 py-3 font-semibold">Status</th>
                        <th className="border-b border-slate-200 px-5 py-3 text-right font-semibold">Basic</th>
                        <th className="border-b border-slate-200 px-5 py-3 text-right font-semibold">Gross</th>
                        <th className="border-b border-slate-200 px-5 py-3 text-right font-semibold">Deductions</th>
                        <th className="border-b border-slate-200 px-5 py-3 text-right font-semibold">Net</th>
                        <th className="border-b border-slate-200 px-5 py-3 font-semibold">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyLoading ? (
                        <tr>
                          <td colSpan={8} className="px-5 py-6 text-center text-sm text-slate-500">
                            Loading history…
                          </td>
                        </tr>
                      ) : history.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-5 py-6 text-center text-sm text-slate-500">
                            No revisions yet. Save the structure to create the first one.
                          </td>
                        </tr>
                      ) : (
                        history.map((revision) => (
                          <tr key={revision.id} className="border-b border-slate-100 last:border-0">
                            <td className="px-5 py-3 text-sm font-semibold text-slate-900">
                              {formatMonth(revision.effective_from)}
                              {revision.is_current && (
                                <span className="ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-700">
                                  Current
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-sm text-slate-700">{reasonLabel(revision.reason)}</td>
                            <td className="px-5 py-3"><StatusBadge status={revision.status_label} /></td>
                            <td className="px-5 py-3 text-right font-mono text-xs text-slate-900">{formatMoney(revision.basic)}</td>
                            <td className="px-5 py-3 text-right font-mono text-xs text-slate-900">{formatMoney(revision.gross)}</td>
                            <td className="px-5 py-3 text-right font-mono text-xs text-red-700">{formatMoney(revision.deductions)}</td>
                            <td className="px-5 py-3 text-right font-mono text-xs font-bold text-slate-900">{formatMoney(revision.net)}</td>
                            <td className="px-5 py-3 text-xs text-slate-500">{revision.note || "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Company Salary Components</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Components and their rules are shared across every employee in this company
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-slate-200 bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-6 p-5">
              {!config ? (
                <p className="text-sm text-slate-500">Loading components…</p>
              ) : (
                (["earning", "deduction"] as const).map((kind) => {
                  const items = kind === "earning" ? config.earnings : config.deductions
                  const name = kind === "earning" ? newEarningName : newDeductionName
                  const type = kind === "earning" ? newEarningType : newDeductionType
                  const value = kind === "earning" ? newEarningValue : newDeductionValue
                  return (
                    <div key={kind}>
                      <h4 className="mb-3 text-sm font-bold text-slate-900">
                        {kind === "earning" ? "Earning Components" : "Deduction Components"}
                      </h4>

                      <div className="mb-3 space-y-2">
                        {items.length === 0 && (
                          <p className="text-xs text-slate-500">No {kind} components yet.</p>
                        )}
                        {items.map((item, index) => (
                          <div
                            key={`${item.name}-${index}`}
                            className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                          >
                            <span className="text-sm text-slate-900">
                              {item.name}
                              <span className="ml-2 text-xs text-slate-500">
                                {TYPE_LABELS[item.type]}
                                {item.type !== "fixed" ? ` · ${item.value ?? 0}%` : ""}
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() => removeConfigComponent(kind, index)}
                              className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                              aria-label={`Remove ${item.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col gap-2 md:flex-row">
                        <Input
                          value={name}
                          onChange={(event) =>
                            kind === "earning"
                              ? setNewEarningName(event.target.value)
                              : setNewDeductionName(event.target.value)
                          }
                          placeholder={`Enter ${kind} component name`}
                          className="flex-1"
                        />
                        <select
                          value={type}
                          onChange={(event) =>
                            kind === "earning"
                              ? setNewEarningType(event.target.value as SalaryComponentType)
                              : setNewDeductionType(event.target.value as SalaryComponentType)
                          }
                          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
                        >
                          {COMPONENT_TYPES.map((item) => (
                            <option key={item} value={item}>{TYPE_LABELS[item]}</option>
                          ))}
                        </select>
                        {type !== "fixed" && (
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={value}
                            onChange={(event) =>
                              kind === "earning"
                                ? setNewEarningValue(event.target.value)
                                : setNewDeductionValue(event.target.value)
                            }
                            placeholder="%"
                            className="h-10 w-24"
                          />
                        )}
                        <Button
                          type="button"
                          onClick={() => addConfigComponent(kind)}
                          className="bg-teal-600 hover:bg-teal-700"
                        >
                          <Plus className="mr-2 h-4 w-4" /> Add
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveConfig}
                disabled={!config || configSaving}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {configSaving ? "Saving…" : "Save Components"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {pendingSave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">
              {pendingSave.isCorrection ? "Update existing salary data?" : "Create new salary data?"}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {pendingSave.isCorrection ? (
                <>
                  A salary record already exists for{" "}
                  <span className="font-semibold text-slate-900">{formatMonth(pendingSave.month)}</span>.
                  Saving now will <span className="font-semibold text-amber-700">update that month
                  (correction)</span> instead of creating a duplicate.
                </>
              ) : (
                <>
                  No salary record exists for{" "}
                  <span className="font-semibold text-slate-900">{formatMonth(pendingSave.month)}</span>.
                  Saving will create a <span className="font-semibold text-teal-700">new monthly
                  record</span>.
                </>
              )}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setPendingSave(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmSaveEmployee}
                disabled={saving}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {saving ? "Saving…" : pendingSave.isCorrection ? "Yes, update" : "Yes, create"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
