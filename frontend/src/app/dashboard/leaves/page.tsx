"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useStaffCategories } from "@/hooks/settings/staff_category/useStaffCategories";
import { useRoles } from "@/hooks/settings/useRoles";
import { toast } from "sonner";
import {
  CalendarCheck,
  ShieldCheck,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LeaveRoster from "@/components/leaves/LeaveRoster";

// Types
import {
  Holiday,
  CompanyRole,
  ActiveEmployee,
  HierarchyEmployee,
  LeaveType,
  LeaveRequest,
  LeaveBalanceResponse,
  LeaveTypeFormData,
  EditableLeaveType,
  LeaveStats,
  PaginationState,
} from "./types";

// Helpers
import {
  createLeaveTypeForm,
  generateDateRange,
  calculateDaysCount,
} from "./helpers";

// Modular Components
import LeaveStatsCards from "./components/LeaveStatsCards";
import UserLeaveBalance from "./components/UserLeaveBalance";
import UserLeaveHistory from "./components/UserLeaveHistory";
import AdminRequestsSection from "./components/AdminRequestsSection";
import AdminLeaveTypesSection from "./components/AdminLeaveTypesSection";
import AdminHolidaySection from "./components/AdminHolidaySection";
import AdminHierarchySection from "./components/AdminHierarchySection";
import ApplyLeaveDialog from "./components/ApplyLeaveDialog";
import AddLeaveTypeDialog from "./components/AddLeaveTypeDialog";
import HolidayDialog from "./components/HolidayDialog";
import PastLeaveDialog from "./components/PastLeaveDialog";

export default function LeavesPage() {
  const { user, company, isAdmin } = useAuth();
  const companyId = company?.id;
  const { data: staffCategories = [] } = useStaffCategories();
  const [viewMode, setViewMode] = useState<"user" | "admin">("user");
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isAddTypeOpen, setIsAddTypeOpen] = useState(false);
  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false);
  const [isAddPastLeaveOpen, setIsAddPastLeaveOpen] = useState(false);

  // Holiday States
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [roles, setRoles] = useState<CompanyRole[]>([]);
  const [cookieSynced, setCookieSynced] = useState(false);
  const [holidayForm, setHolidayForm] = useState<Holiday>({
    holiday: "",
    date: "",
    end_date: "",
    is_recurring: false,
    is_full_holiday: true,
    is_global: false,
    role_ids: [],
    is_multi_day: false,
  });
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [isHolidayLoading, setIsHolidayLoading] = useState(false);
  const [isHolidaySubmitting, setIsHolidaySubmitting] = useState(false);
  const [holidayMessage, setHolidayMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [holidayErrors, setHolidayErrors] = useState<Record<string, string>>({});

  // Leave Type States
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalanceResponse | null>(null);
  const [isLeaveBalanceLoading, setIsLeaveBalanceLoading] = useState(false);

  const [leaveTypeForm, setLeaveTypeForm] = useState<LeaveTypeFormData>(
    createLeaveTypeForm()
  );
  const [activePolicyTab, setActivePolicyTab] = useState(0);
  const [leaveTypeSections, setLeaveTypeSections] = useState<Record<string, boolean>>({
    description: false,
    entitlement: true,
    availability: true,
    requirements: true,
  });
  const [editingLeaveType, setEditingLeaveType] = useState<EditableLeaveType | null>(null);
  const [isLeaveTypeLoading, setIsLeaveTypeLoading] = useState(false);
  const [isLeaveTypeSubmitting, setIsLeaveTypeSubmitting] = useState(false);
  const [leaveTypeMessage, setLeaveTypeMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Leave Request States
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([]);
  const [isRequestsLoading, setIsRequestsLoading] = useState(false);
  const [requestForm, setRequestForm] = useState({
    from_date: "",
    to_date: "",
    leave_id: "",
    custom_reason: "",
    leave_choice: "full_day",
    replacement_user_id: "",
  });

  const [loggedInStaffCategoryId, setLoggedInStaffCategoryId] = useState<number | null>(null);

  const selectedLeaveType = leaveTypes.find(
    (leaveType) => leaveType.id.toString() === requestForm.leave_id
  );
  const selectedPolicy = selectedLeaveType?.policies?.find(
    (policy) => policy.staff_category_id === loggedInStaffCategoryId
  );
  const [isRequestSubmitting, setIsRequestSubmitting] = useState(false);

  // Add Past Leave States
  const [employees, setEmployees] = useState<ActiveEmployee[]>([]);
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(false);
  const [replacementEmployees, setReplacementEmployees] = useState<
    { id: number; name: string; email: string }[]
  >([]);
  const [isReplacementEmployeesLoading, setIsReplacementEmployeesLoading] = useState(false);
  const [pastLeaveMessage, setPastLeaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pastLeaveForm, setPastLeaveForm] = useState({
    user_id: "",
    from_date: "",
    to_date: "",
    leave_id: "",
    custom_reason: "",
    leave_choice: "full_day",
    status: "A",
  });

  // Leave Hierarchy States
  const { data: companyRoles = [] } = useRoles();
  const [hierarchyEmployees, setHierarchyEmployees] = useState<HierarchyEmployee[]>([]);
  const [isHierarchyEmployeesLoading, setIsHierarchyEmployeesLoading] = useState(false);
  const [isHierarchyExists, setIsHierarchyExists] = useState(false);
  const [hierarchySearch, setHierarchySearch] = useState("");
  const [selectedHierarchyEmployeeId, setSelectedHierarchyEmployeeId] = useState("");
  const [leaveHierarchy, setLeaveHierarchy] = useState<HierarchyEmployee[]>([]);
  const [hierarchySelectionType, setHierarchySelectionType] = useState<"user" | "role">("user");
  const [selectedHierarchyRole, setSelectedHierarchyRole] = useState("");
  const [savedLeaveHierarchy, setSavedLeaveHierarchy] = useState<HierarchyEmployee[]>([]);
  const [draggedHierarchyIndex, setDraggedHierarchyIndex] = useState<number | null>(null);
  const [isHierarchySaving, setIsHierarchySaving] = useState(false);

  const filteredHierarchyEmployees = hierarchyEmployees.filter((employee) => {
    const searchValue = hierarchySearch.trim().toLowerCase();
    if (!searchValue) return false;

    const alreadyAdded = leaveHierarchy.some(
      (item) => item.id === employee.id
    );
    if (alreadyAdded) return false;

    return (
      employee.name.toLowerCase().includes(searchValue) ||
      employee.email.toLowerCase().includes(searchValue) ||
      employee.role.toLowerCase().includes(searchValue) ||
      employee.department.toLowerCase().includes(searchValue)
    );
  });

  const handleSelectHierarchyEmployee = (employee: HierarchyEmployee) => {
    setSelectedHierarchyEmployeeId(employee.id);
    setHierarchySearch(employee.name);
  };

  const handleAddEmployeeToHierarchy = () => {
    if (hierarchySelectionType === "user") {
      if (!selectedHierarchyEmployeeId) {
        toast.error("Please select an employee");
        return;
      }

      const selectedEmployee = hierarchyEmployees.find(
        (employee) => employee.id === selectedHierarchyEmployeeId
      );
      if (!selectedEmployee) return;

      const alreadyExists = leaveHierarchy.some(
        (employee) => employee.id === selectedEmployee.id
      );
      if (alreadyExists) {
        toast.error("Employee is already added to the hierarchy");
        return;
      }

      setLeaveHierarchy((previous) => [...previous, selectedEmployee]);
      setHierarchySearch("");
      setSelectedHierarchyEmployeeId("");
      return;
    }

    if (hierarchySelectionType === "role") {
      if (!selectedHierarchyRole) {
        toast.error("Please select a role");
        return;
      }

      const roleName = selectedHierarchyRole;
      const roleHierarchyItem: HierarchyEmployee = {
        id: `role-${selectedHierarchyRole.toLowerCase().replace(/\s+/g, "-")}`,
        name: roleName,
        email: "All employees assigned to this role",
        role: "Role",
        department: "All departments",
        initials: roleName
          .split(" ")
          .map((word) => word[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
      };

      const alreadyExists = leaveHierarchy.some(
        (item) => item.id === roleHierarchyItem.id
      );
      if (alreadyExists) {
        toast.error("Role is already added to the hierarchy");
        return;
      }

      setLeaveHierarchy((previous) => [...previous, roleHierarchyItem]);
      setSelectedHierarchyRole("");
    }
  };

  const handleHierarchyDrop = (dropIndex: number) => {
    if (
      draggedHierarchyIndex === null ||
      draggedHierarchyIndex === dropIndex
    ) {
      return;
    }

    const updatedHierarchy = [...leaveHierarchy];
    const [draggedEmployee] = updatedHierarchy.splice(draggedHierarchyIndex, 1);
    updatedHierarchy.splice(dropIndex, 0, draggedEmployee);

    setLeaveHierarchy(updatedHierarchy);
    setDraggedHierarchyIndex(null);
  };

  // Stats State
  const [leaveStats, setLeaveStats] = useState<LeaveStats>({
    leavesTaken: 0,
    fullDayLeaves: 0,
    halfDayLeaves: 0,
    pendingRequests: 0,
  });

  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  const [requestMessage, setRequestMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ─── Fetch hierarchy employees ──────────────────────────────────────────
  const fetchHierarchyEmployees = useCallback(async () => {
    if (!companyId) return;
    setIsHierarchyEmployeesLoading(true);
    try {
      const res = await fetch(`/api/leave/add-leave`);
      const result = await res.json();
      if (res.ok && result.success) {
        const users: HierarchyEmployee[] = (result.data || []).map(
          (u: { id: number; first_name: string; last_name?: string; email?: string }) => ({
            id: String(u.id),
            name: `${u.first_name}${u.last_name ? " " + u.last_name : ""}`.trim(),
            email: u.email || "",
            role: "Employee",
            department: "",
            initials: `${u.first_name?.[0] ?? ""}${u.last_name?.[0] ?? ""}`.toUpperCase(),
          })
        );
        setHierarchyEmployees(users);
      }
    } catch (err) {
      console.error("Failed to load hierarchy employees", err);
    } finally {
      setIsHierarchyEmployeesLoading(false);
    }
  }, [companyId]);

  // ─── Fetch saved leave hierarchy from backend ───────────────────────────
  const fetchLeaveHierarchy = useCallback(async () => {
    if (!companyId) return;
    try {
      const res = await fetch(`/api/leave/hierarchy`);
      if (res.status === 404) {
        setIsHierarchyExists(false);
        setLeaveHierarchy([]);
        setSavedLeaveHierarchy([]);
        return;
      }
      const result = await res.json();
      if (res.ok && result.success && result.data) {
        setIsHierarchyExists(true);
        const flowConfig: Array<{ level: number; criteria: string; managed_by: string }> =
          result.data.flow_config || [];

        const mapped: HierarchyEmployee[] = flowConfig.map((item) => {
          const isRole = item.criteria === "role";
          return {
            id: isRole
              ? `role-${item.managed_by.toLowerCase().replace(/\s+/g, "-")}`
              : String(item.managed_by),
            name: item.managed_by,
            email: isRole ? "All employees assigned to this role" : "",
            role: isRole ? "Role" : "Employee",
            department: isRole ? "All departments" : "",
            initials: item.managed_by
              .split(" ")
              .map((w: string) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase(),
          };
        });

        const enriched = mapped.map((item) => {
          if (item.id.startsWith("role-")) return item;
          const found = hierarchyEmployees.find((e) => e.id === item.id);
          return found ? { ...found, id: item.id } : item;
        });

        setLeaveHierarchy(enriched);
        setSavedLeaveHierarchy(enriched);
      } else {
        setIsHierarchyExists(false);
        setLeaveHierarchy([]);
        setSavedLeaveHierarchy([]);
      }
    } catch (err) {
      console.error("Failed to load leave hierarchy", err);
      toast.error("Failed to load leave hierarchy");
    }
  }, [companyId, hierarchyEmployees]);

  const buildHierarchyPayload = () => ({
    company_id: companyId,
    flow_config: leaveHierarchy.map((item, index) => ({
      level: index + 1,
      criteria: item.id.startsWith("role-") ? "role" : "user",
      managed_by: item.id.startsWith("role-") ? item.name : item.id,
    })),
  });

  const handleSaveHierarchy = async () => {
    if (!companyId) {
      toast.error("No company selected");
      return;
    }
    setIsHierarchySaving(true);
    try {
      const payload = buildHierarchyPayload();
      const method = isHierarchyExists ? "PUT" : "POST";

      const res = await fetch(`/api/leave/hierarchy`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (res.ok && result.success) {
        toast.success("Leave hierarchy saved successfully");
        setIsHierarchyExists(true);
        await fetchLeaveHierarchy();
      } else {
        toast.error(result.message || "Failed to save leave hierarchy");
      }
    } catch (err) {
      console.error("Failed to save hierarchy", err);
      toast.error("Network error while saving hierarchy");
    } finally {
      setIsHierarchySaving(false);
    }
  };

  const fetchLeaveBalance = useCallback(async () => {
    if (!companyId) return;

    setIsLeaveBalanceLoading(true);

    try {
      const res = await fetch(
        `/api/leave-balance?company_id=${companyId}`
      );

      const result = await res.json();

      if (res.ok && result.success) {
        setLeaveBalance(result.data);
      } else {
        console.error(
          "Failed to load leave balance:",
          result.message
        );
      }
    } catch (error) {
      console.error("Failed to load leave balance", error);
    } finally {
      setIsLeaveBalanceLoading(false);
    }
  }, [companyId]);

  // Fetch functions
  const fetchLeaveTypes = useCallback(async () => {
    if (!companyId) return;
    setIsLeaveTypeLoading(true);
    try {
      const res = await fetch(`/api/leave/types?company_id=${companyId}`);
      const data = await res.json();
      if (res.ok) setLeaveTypes(data.data || []);
    } catch (err) {
      console.error("Failed to load leave types", err);
    } finally {
      setIsLeaveTypeLoading(false);
    }
  }, [companyId]);

  const fetchLeaveRequests = useCallback(async (page: number = 1) => {
    if (!companyId) return;
    setIsRequestsLoading(true);
    try {
      console.log(`📋 Fetching leave requests for company: ${companyId}, page: ${page}`);
      const res = await fetch(`/api/leave/requests?company_id=${companyId}&page=${page}`);
      const result = await res.json();

      if (res.ok) {
        setLeaveRequests(result.data || []);
        setPagination({
          currentPage: result.page || 1,
          totalPages: result.total_page || 1,
          totalItems: result.total || 0,
        });

        const approved = (result.data || []).filter((r: LeaveRequest) => r.status === 'A');
        const pending = (result.data || []).filter((r: LeaveRequest) => r.status === 'P');
        setLeaveStats({
          leavesTaken: approved.length,
          fullDayLeaves: approved.filter((r: LeaveRequest) => r.leave_choice === 'full_day').length,
          halfDayLeaves: approved.filter((r: LeaveRequest) => r.leave_choice === 'half_day').length,
          pendingRequests: pending.length,
        });
      }
    } catch (err) {
      console.error("Failed to load leave requests", err);
    } finally {
      setIsRequestsLoading(false);
    }
  }, [companyId]);

  const fetchMyLeaves = useCallback(async () => {
    if (!companyId) return;
    try {
      const res = await fetch(`/api/leave/my-leaves?company_id=${companyId}`);
      const data = await res.json();
      if (res.ok) {
        const leaves = data.data || [];
        setMyLeaves(leaves);

        const approved = leaves.filter((r: LeaveRequest) => r.status === 'A');
        const pending = leaves.filter((r: LeaveRequest) => r.status === 'P');

        setLeaveStats({
          leavesTaken: approved.length,
          fullDayLeaves: approved.filter((r: LeaveRequest) => r.leave_choice === 'F' || r.leave_choice === 'full_day').length,
          halfDayLeaves: approved.filter((r: LeaveRequest) => r.leave_choice === 'H' || r.leave_choice === 'half_day').length,
          pendingRequests: pending.length,
        });
      }
    } catch (err) {
      console.error("Failed to load my leaves", err);
    }
  }, [companyId]);

  const fetchHolidays = useCallback(async () => {
    if (!companyId) return;
    setIsHolidayLoading(true);
    try {
      const res = await fetch(`/api/settings/holiday`);
      const data = await res.json();
      if (res.ok && data.success) {
        setHolidays(data.data || []);
      } else {
        console.error("Failed to load holidays:", data.message);
      }
    } catch (error) {
      console.error("Failed to load holidays", error);
    } finally {
      setIsHolidayLoading(false);
    }
  }, [companyId]);

  const fetchRoles = useCallback(async () => {
    if (!companyId) return;
    try {
      const res = await fetch(`/api/settings/roles/${companyId}`);
      const data = await res.json();
      if (res.ok) {
        setRoles(Array.isArray(data) ? data : (data.data || data || []));
      }
    } catch (error) {
      console.error("Failed to load roles", error);
    }
  }, [companyId]);

  const fetchActiveEmployees = useCallback(async () => {
    if (!companyId) return;
    setIsEmployeesLoading(true);
    try {
      console.log('👥 Fetching active employees for past leave...');
      const res = await fetch(`/api/leave/add-leave`);
      const result = await res.json();
      if (res.ok && result.success) {
        setEmployees(result.data || result.employees || []);
      }
    } catch (error) {
      console.error("Failed to load employees", error);
    } finally {
      setIsEmployeesLoading(false);
    }
  }, [companyId]);

  const fetchReplacementEmployees = useCallback(async () => {
    if (!companyId) return;

    setIsReplacementEmployeesLoading(true);

    try {
      const res = await fetch("/api/leave/eligible-replacements");
      const result = await res.json();

      if (res.ok && result.success) {
        setReplacementEmployees(result.data || []);
      }
    } catch (error) {
      console.error("Failed to load replacement employees", error);
    } finally {
      setIsReplacementEmployeesLoading(false);
    }
  }, [companyId]);

  // Sync company cookie with AuthContext on page load
  useEffect(() => {
    const syncCompanyCookie = async () => {
      if (companyId && !cookieSynced) {
        try {
          console.log('🔄 Syncing company cookie with AuthContext:', companyId);
          const res = await fetch('/api/update-company-cookie', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company_id: companyId }),
          });

          const data = await res.json();
          if (data.success) {
            console.log('✅ Company cookie synced successfully');
            setCookieSynced(true);
          } else {
            console.error('❌ Failed to sync company cookie');
          }
        } catch (error) {
          console.error('Error syncing company cookie:', error);
        }
      }
    };

    syncCompanyCookie();
  }, [companyId, cookieSynced]);

  useEffect(() => {
    if (companyId && cookieSynced) {
      fetchLeaveBalance();
      fetchLeaveTypes();

      if (viewMode === "admin") {
        fetchLeaveRequests();
        fetchHolidays();
        fetchRoles();
        fetchHierarchyEmployees();
      }

      if (viewMode !== "admin") {
        fetchMyLeaves();
      }
    }
  }, [
    companyId,
    viewMode,
    cookieSynced,
    fetchLeaveBalance,
    fetchLeaveTypes,
    fetchLeaveRequests,
    fetchMyLeaves,
    fetchHolidays,
    fetchRoles,
    fetchHierarchyEmployees,
  ]);

  useEffect(() => {
    const fetchLoggedInProfile = async () => {
      if (!user?.id || !companyId) return;

      try {
        const res = await fetch(
          `/api/employee-with-profile?user_id=${user.id}`,
          {
            headers: {
              "x-company-id": companyId.toString(),
            },
          }
        );

        if (!res.ok) return;

        const result = await res.json();
        const profile = result.data?.profile || result.data;
        setLoggedInStaffCategoryId(profile?.staff_category ?? null);
      } catch (err) {
        console.error("Failed to fetch logged-in profile", err);
      }
    };

    fetchLoggedInProfile();
  }, [user?.id, companyId]);

  useEffect(() => {
    if (companyId && cookieSynced && hierarchyEmployees.length > 0) {
      fetchLeaveHierarchy();
    }
  }, [companyId, cookieSynced, hierarchyEmployees, fetchLeaveHierarchy]);

  useEffect(() => {
    if (isAddPastLeaveOpen && viewMode === "admin") {
      fetchActiveEmployees();
    }
  }, [isAddPastLeaveOpen, viewMode, fetchActiveEmployees]);

  // Leave Type Form Helpers
  const toggleLeaveTypeSection = (key: string) => {
    setLeaveTypeSections((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const updateLeaveTypeField = <T extends keyof LeaveTypeFormData>(
    field: T,
    value: LeaveTypeFormData[T]
  ) => {
    if (editingLeaveType) {
      setEditingLeaveType((current) =>
        current ? { ...current, [field]: value } : current
      );
    } else {
      setLeaveTypeForm((current) => ({ ...current, [field]: value }));
    }
  };

  const updateLeaveTypeFields = (updates: Partial<LeaveTypeFormData>) => {
    if (editingLeaveType) {
      setEditingLeaveType((current) =>
        current ? { ...current, ...updates } : current
      );
    } else {
      setLeaveTypeForm((current) => ({ ...current, ...updates }));
    }
  };

  const handleLeaveTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = editingLeaveType || leaveTypeForm;

    if (!data.leave_type?.trim() || !data.short_name?.trim()) {
      setLeaveTypeMessage({ type: "error", text: "Name and Short Name are required" });
      return;
    }

    if (!companyId) {
      setLeaveTypeMessage({ type: "error", text: "No company selected" });
      return;
    }

    setIsLeaveTypeSubmitting(true);
    setLeaveTypeMessage(null);

    try {
      const method = editingLeaveType ? "PUT" : "POST";

      const payload = {
        ...data,
        company_id: companyId,
        leave_type: data.leave_type.trim(),
        short_name: data.short_name.trim(),
        settings: {
          description: data.description,
          employee_type: data.employee_type,
          department: data.department,
          employment_status: data.employment_status,
          designation: data.designation,
          work_location: data.work_location,
          service_period_value: data.service_period_value,
          service_period_unit: data.service_period_unit,
          waiting_rule: data.waiting_rule,
          entitlement_period: data.entitlement_period,
          limit_unit: data.limit_unit,
          limit_value: data.limit_value,
          credit_method: data.credit_method,
          restrict_availability_period: data.restrict_availability_period,
          availability_start_date: data.availability_start_date,
          availability_end_date: data.availability_end_date,
          availability_repeat: data.availability_repeat,
          allowed_duration: data.allowed_duration,
          minimum_duration: data.minimum_duration,
          maximum_per_application: data.maximum_per_application,
          maximum_consecutive_days: data.maximum_consecutive_days,
          maximum_carry_forward: data.maximum_carry_forward,
          carry_forward_expiry: data.carry_forward_expiry,
          leave_year_start: data.leave_year_start,
          custom_expiry_value: data.custom_expiry_value,
          custom_expiry_unit: data.custom_expiry_unit,
          replacement_required: data.replacement_required,
          supporting_document: data.supporting_document,
          ta_da_applicable: data.ta_da_applicable,
          manager_approval: data.manager_approval,
          hr_approval: data.hr_approval,
          multi_level_approval: data.multi_level_approval,
          effective_from: data.effective_from,
          effective_until: data.effective_until,
        },
      };

      console.log(`📤 ${method === "PUT" ? "Updating" : "Creating"} leave type:`, payload);

      const res = await fetch(`/api/leave/types`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (res.ok && result.success) {
        setLeaveTypeMessage({ type: "success", text: `Leave type ${editingLeaveType ? "updated" : "added"} successfully!` });

        setTimeout(() => {
          setIsAddTypeOpen(false);
          setEditingLeaveType(null);
          setLeaveTypeForm(createLeaveTypeForm());
          setLeaveTypeMessage(null);
          fetchLeaveTypes();
        }, 1500);
      } else {
        setLeaveTypeMessage({ type: "error", text: result.message || "Failed to save leave type" });
      }
    } catch (err) {
      console.error("Leave type submission error", err);
      setLeaveTypeMessage({ type: "error", text: "Network error while saving leave type" });
    } finally {
      setIsLeaveTypeSubmitting(false);
    }
  };

  const handleDeleteLeaveType = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`/api/leave/types`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, company_id: companyId }),
      });
      if (res.ok) fetchLeaveTypes();
    } catch (err) {
      console.error("Failed to delete leave type", err);
    }
  };

  // Leave Request Handlers
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.from_date || !requestForm.to_date || !requestForm.leave_id) {
      setRequestMessage({ type: "error", text: "Please fill in all required fields" });
      return;
    }
    if (
      selectedPolicy?.requires_replacement &&
      !requestForm.replacement_user_id
    ) {
      setRequestMessage({
        type: "error",
        text: "Please select a replacement employee",
      });
      return;
    }

    setIsRequestSubmitting(true);
    setRequestMessage(null);

    try {
      const payload = {
        company_id: companyId,
        leave_id: Number(requestForm.leave_id),
        from_date: requestForm.from_date,
        to_date: requestForm.to_date,
        leave_choice: requestForm.leave_choice === "full_day" ? "F" : "H",
        custom_reason: requestForm.custom_reason,
        replacement_user_id: requestForm.replacement_user_id
          ? Number(requestForm.replacement_user_id)
          : null,
      };
      console.log('📤 Submitting leave application:', payload);
      const res = await fetch("/api/leave/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (res.ok && result.success) {
        setRequestMessage({ type: "success", text: "Leave application submitted successfully!" });
        setTimeout(() => {
          setIsRequestDialogOpen(false);
          setRequestForm({ from_date: "", to_date: "", leave_id: "", custom_reason: "", leave_choice: "full_day", replacement_user_id: "" });
          setRequestMessage(null);
          fetchMyLeaves();
        }, 1500);
      } else {
        setRequestMessage({ type: "error", text: result.message || "Failed to submit leave application" });
      }
    } catch (err) {
      console.error("Failed to submit request", err);
      setRequestMessage({ type: "error", text: "Network error while submitting leave application" });
    } finally {
      setIsRequestSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    setStatusMessage(null);
    try {
      console.log(`🔄 Updating leave request status: ${id} -> ${status}`);
      const res = await fetch("/api/leave/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, company_id: companyId }),
      });
      const result = await res.json();

      if (res.ok && result.success) {
        setStatusMessage({ type: "success", text: result.message || `Leave ${status === "A" ? "approved" : "rejected"} successfully!` });
        fetchLeaveRequests(pagination.currentPage);
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        setStatusMessage({ type: "error", text: result.message || "Failed to update status" });
      }
    } catch (err) {
      console.error("Failed to update status", err);
      setStatusMessage({ type: "error", text: "Network error while updating status" });
    }
  };

  const handlePastLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if this is a bulk upload submission
    if ((e as any).isBulk) {
      const formData = (e as any).formData as FormData;
      const uploadStyle = (e as any).uploadStyle as "dates" | "balance";
      const endpoint =
        uploadStyle === "dates"
          ? "/api/leave/upload-past-leaves"
          : "/api/leave/upload-leave-balances";

      setIsRequestSubmitting(true);
      setPastLeaveMessage(null);
      
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });

        let result: any = {};
        try {
          const rawText = await res.text();
          result = rawText ? JSON.parse(rawText) : {};
        } catch {
          result = { success: false, message: "Unexpected response from server." };
        }

        if (res.ok && result.success) {
          const r = result.results || {};
          const created = r.created ?? 0;
          const updated = r.updated ?? 0;
          const hasRows = created + updated > 0;

          const parts: string[] =
            uploadStyle === "dates"
              ? [
                  `Leave records created: ${created}${
                    updated ? ` (updated: ${updated})` : ""
                  }.`,
                ]
              : [`Imported! Created: ${created}, Updated: ${updated}.`];
          if (r.created_leave_types?.length)
            parts.push(`New leave types: ${r.created_leave_types.join(", ")}.`);
          if (r.unmatched?.length)
            parts.push(`${r.unmatched.length} staff ID(s) not found (skipped).`);
          if (r.errors?.length) parts.push(r.errors.join(" "));

          const hasWarnings =
            r.unmatched?.length > 0 || r.errors?.length > 0 || r.created_leave_types?.length > 0;

          setPastLeaveMessage({
            type: hasRows ? "success" : "error",
            text: parts.join(" "),
          });

          // Only auto-close when the result is fully clean, so warnings stay readable.
          if (hasRows && !hasWarnings) {
            setTimeout(() => setIsAddPastLeaveOpen(false), 2500);
          }
        } else {
          setPastLeaveMessage({ type: "error", text: result.message || "Failed to import." });
        }
      } catch (err) {
        console.error("Bulk upload error", err);
        setPastLeaveMessage({ type: "error", text: "Network error during bulk upload." });
      } finally {
        setIsRequestSubmitting(false);
      }
      return;
    }

    if (!pastLeaveForm.from_date || !pastLeaveForm.to_date || !pastLeaveForm.leave_id || !pastLeaveForm.user_id) {
      setPastLeaveMessage({ type: "error", text: "Please fill in all required fields" });
      return;
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (new Date(pastLeaveForm.from_date) > today || new Date(pastLeaveForm.to_date) > today) {
      setPastLeaveMessage({ type: "error", text: "Past leave dates cannot be in the future" });
      return;
    }

    setIsRequestSubmitting(true);
    setPastLeaveMessage(null);

    try {
      const payload = {
        ...pastLeaveForm,
        user_id: parseInt(pastLeaveForm.user_id),
        leave_id: parseInt(pastLeaveForm.leave_id),
        company_id: companyId,
      };

      console.log('📤 Recording past leave:', payload);
      const res = await fetch("/api/leave/add-leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (res.ok && result.success) {
        setPastLeaveMessage({ type: "success", text: "Past leave recorded successfully!" });
        setTimeout(() => {
          setIsAddPastLeaveOpen(false);
          setPastLeaveForm({
            user_id: "",
            from_date: "",
            to_date: "",
            leave_id: "",
            custom_reason: "",
            leave_choice: "full_day",
            status: "A",
          });
          setPastLeaveMessage(null);
          fetchLeaveRequests();
        }, 1500);
      } else {
        setPastLeaveMessage({ type: "error", text: result.message || "Failed to record past leave" });
      }
    } catch (err) {
      console.error("Failed to record past leave", err);
      setPastLeaveMessage({ type: "error", text: "Network error while saving past leave" });
    } finally {
      setIsRequestSubmitting(false);
    }
  };

  const validateHolidayForm = (data: Holiday) => {
    const newErrors: Record<string, string> = {};
    if (!data.holiday.trim()) newErrors.holiday = "Holiday name is required";
    if (!data.date) newErrors.date = "Start date is required";
    if (data.is_multi_day) {
      if (!data.end_date) newErrors.end_date = "End date is required";
      else if (new Date(data.end_date) < new Date(data.date)) newErrors.end_date = "End date must be after start date";
    }
    setHolidayErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleHolidaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = editingHoliday || holidayForm;
    if (!validateHolidayForm(data)) {
      setHolidayMessage({ type: "error", text: "Please fix the errors above" });
      return;
    }
    if (!companyId) {
      setHolidayMessage({ type: "error", text: "No company selected" });
      return;
    }

    setIsHolidaySubmitting(true);
    setHolidayMessage(null);

    try {
      if (editingHoliday) {
        const requestData = {
          id: editingHoliday.id,
          company_id: companyId,
          holiday: editingHoliday.holiday,
          date: editingHoliday.date,
          is_recurring: editingHoliday.is_recurring,
          is_full_holiday: editingHoliday.is_full_holiday,
          role_ids: editingHoliday.is_full_holiday ? [] : editingHoliday.role_ids,
        };

        const res = await fetch(`/api/settings/holiday`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        });
        const result = await res.json();

        if (res.ok && result.success) {
          setHolidayMessage({ type: "success", text: "Holiday updated successfully!" });
          setIsHolidayDialogOpen(false);
          setEditingHoliday(null);
          fetchHolidays();
        } else {
          setHolidayMessage({ type: "error", text: result.message || "Failed to update holiday" });
        }
      } else {
        let holidaysToCreate: any[] = [];
        if (holidayForm.is_multi_day && holidayForm.end_date) {
          const dateRange = generateDateRange(holidayForm.date, holidayForm.end_date);
          holidaysToCreate = dateRange.map(date => ({
            holiday: holidayForm.holiday,
            date: date,
            end_date: holidayForm.end_date,
            is_recurring: holidayForm.is_recurring,
            is_full_holiday: holidayForm.is_full_holiday,
            is_global: holidayForm.is_global,
            role_ids: holidayForm.is_full_holiday ? [] : holidayForm.role_ids,
            company_id: companyId,
          }));
        } else {
          holidaysToCreate = [{
            holiday: holidayForm.holiday,
            date: holidayForm.date,
            end_date: holidayForm.end_date || null,
            is_recurring: holidayForm.is_recurring,
            is_full_holiday: holidayForm.is_full_holiday,
            is_global: holidayForm.is_global,
            role_ids: holidayForm.is_full_holiday ? [] : holidayForm.role_ids,
            company_id: companyId,
          }];
        }

        const createPromises = holidaysToCreate.map(h =>
          fetch(`/api/settings/holiday`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(h),
          })
        );

        const responses = await Promise.all(createPromises);
        const results = await Promise.all(responses.map(async (r) => {
          const resData = await r.json();
          return { success: r.ok && resData.success, data: resData };
        }));

        if (results.every(r => r.success)) {
          const daysCount = holidayForm.is_multi_day && holidayForm.end_date ? calculateDaysCount(holidayForm.date, holidayForm.end_date) : 1;
          setHolidayMessage({ type: "success", text: `Holiday${daysCount > 1 ? 's' : ''} added successfully!` });
          setIsHolidayDialogOpen(false);
          setHolidayForm({
            holiday: "",
            date: "",
            end_date: "",
            is_recurring: false,
            is_full_holiday: true,
            is_global: false,
            role_ids: [],
            is_multi_day: false,
          });
          fetchHolidays();
        } else {
          setHolidayMessage({ type: "error", text: "Failed to create some holidays" });
        }
      }
    } catch (err) {
      console.error("Holiday submission error", err);
      setHolidayMessage({ type: "error", text: "Network error while saving holiday" });
    } finally {
      setIsHolidaySubmitting(false);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!confirm("Are you sure you want to delete this holiday?")) return;
    try {
      const res = await fetch(`/api/settings/holiday`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchHolidays();
      }
    } catch (err) {
      console.error("Failed to delete holiday", err);
    }
  };

  const handleEditHoliday = (holiday: Holiday) => {
    setEditingHoliday({ ...holiday, is_multi_day: !!holiday.end_date });
    setIsHolidayDialogOpen(true);
    setHolidayErrors({});
    setHolidayMessage(null);
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Breadcrumb and Main Title Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Statistics</h1>
          <p className="text-sm text-gray-500 mt-1">
            {viewMode === "user"
              ? "Overview of your leaves and leave records"
              : "Review employee requests and maintain company holiday schedules"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            onClick={() => {
              setIsRequestDialogOpen(true);
              fetchReplacementEmployees();
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Request Leave
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <LeaveStatsCards viewMode={viewMode} leaveStats={leaveStats} />

      {/* Content Area */}
      {viewMode === "user" ? (
        <div className="space-y-6">
          <UserLeaveBalance
            leaveBalance={leaveBalance}
            isLeaveBalanceLoading={isLeaveBalanceLoading}
          />

          <UserLeaveHistory
            myLeaves={myLeaves}
            isAdmin={Boolean(isAdmin)}
            viewMode={viewMode}
            onToggleViewMode={() => setViewMode(viewMode === "user" ? "admin" : "user")}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <Tabs defaultValue="requests" className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-1">
                <ShieldCheck className="h-5 w-5 text-gray-600" />
                Manage Leave and Holiday
              </h1>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="border-gray-200 hover:bg-gray-50 bg-white shadow-sm"
                  onClick={() => setViewMode("user")}
                >
                  <CalendarCheck className="h-4 w-4 mr-2" />
                  My Leaves
                </Button>
              </div>
            </div>

            <TabsList className="bg-gray-100 p-1 rounded-lg w-fit mb-4">
              <TabsTrigger value="requests" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2 text-sm font-medium">Leave Requests</TabsTrigger>
              <TabsTrigger value="types" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2 text-sm font-medium">Leave Types</TabsTrigger>
              <TabsTrigger value="holidays" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2 text-sm font-medium">Holiday Schedule</TabsTrigger>
              <TabsTrigger value="hierarchy" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2 text-sm font-medium">Leave Hierarchy</TabsTrigger>
              <TabsTrigger value="roster" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2 text-sm font-medium">Leave Roster</TabsTrigger>
            </TabsList>

            {/* Admin: Requests Tab */}
            <TabsContent value="requests" className="space-y-4">
              <AdminRequestsSection
                leaveRequests={leaveRequests}
                isRequestsLoading={isRequestsLoading}
                statusMessage={statusMessage}
                pagination={pagination}
                onAddPastLeave={() => setIsAddPastLeaveOpen(true)}
                onUpdateStatus={handleUpdateStatus}
                onPageChange={(page) => fetchLeaveRequests(page)}
              />
            </TabsContent>

            {/* Admin: Types Tab */}
            <TabsContent value="types" className="space-y-6">
              <AdminLeaveTypesSection
                leaveTypes={leaveTypes}
                isLeaveTypeLoading={isLeaveTypeLoading}
                onAddType={() => {
                  setEditingLeaveType(null);
                  setLeaveTypeForm(createLeaveTypeForm());
                  setIsAddTypeOpen(true);
                }}
                onEditType={(type) => {
                  setEditingLeaveType({
                    ...createLeaveTypeForm(),
                    ...type,
                    ...(type.settings || {}),
                    id: type.id,
                    leave_type: type.leave_type || type.name || "",
                    short_name: type.short_name || "",
                    monthly_limit: type.monthly_limit || 0,
                    yearly_limit: type.yearly_limit || 0,
                    initial_credit: type.initial_credit || 0,
                    use_credit: type.use_credit || false,
                    policy_mode: type.policy_mode || "normal",
                    policies: type.policies || [],
                  });
                  setIsAddTypeOpen(true);
                }}
                onDeleteType={handleDeleteLeaveType}
              />
            </TabsContent>

            {/* Admin: Holidays Tab */}
            <TabsContent value="holidays" className="space-y-6">
              <AdminHolidaySection
                holidays={holidays}
                isHolidayLoading={isHolidayLoading}
                onAddHoliday={() => {
                  setEditingHoliday(null);
                  setHolidayForm({
                    holiday: "",
                    date: "",
                    end_date: "",
                    is_recurring: false,
                    is_full_holiday: true,
                    is_global: false,
                    role_ids: [],
                    is_multi_day: false,
                  });
                  setIsHolidayDialogOpen(true);
                  setHolidayErrors({});
                  setHolidayMessage(null);
                }}
                onEditHoliday={handleEditHoliday}
                onDeleteHoliday={handleDeleteHoliday}
              />
            </TabsContent>

            {/* Admin: Leave Hierarchy Tab */}
            <TabsContent value="hierarchy" className="space-y-6">
              <AdminHierarchySection
                hierarchySelectionType={hierarchySelectionType}
                setHierarchySelectionType={setHierarchySelectionType}
                hierarchySearch={hierarchySearch}
                setHierarchySearch={setHierarchySearch}
                selectedHierarchyEmployeeId={selectedHierarchyEmployeeId}
                setSelectedHierarchyEmployeeId={setSelectedHierarchyEmployeeId}
                selectedHierarchyRole={selectedHierarchyRole}
                setSelectedHierarchyRole={setSelectedHierarchyRole}
                filteredHierarchyEmployees={filteredHierarchyEmployees}
                isHierarchyEmployeesLoading={isHierarchyEmployeesLoading}
                handleSelectHierarchyEmployee={handleSelectHierarchyEmployee}
                handleAddEmployeeToHierarchy={handleAddEmployeeToHierarchy}
                leaveHierarchy={leaveHierarchy}
                setLeaveHierarchy={setLeaveHierarchy}
                hierarchyEmployees={hierarchyEmployees}
                draggedHierarchyIndex={draggedHierarchyIndex}
                setDraggedHierarchyIndex={setDraggedHierarchyIndex}
                handleHierarchyDrop={handleHierarchyDrop}
                isHierarchySaving={isHierarchySaving}
                handleSaveHierarchy={handleSaveHierarchy}
                fetchLeaveHierarchy={fetchLeaveHierarchy}
                companyRoles={companyRoles}
              />
            </TabsContent>

            {/* Admin: Leave Roster Tab */}
            <TabsContent value="roster" className="space-y-6">
              <LeaveRoster companyId={companyId} />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Dialogs */}

      {/* 1. Apply Leave Request Dialog */}
      <ApplyLeaveDialog
        open={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
        requestForm={requestForm}
        setRequestForm={setRequestForm}
        leaveTypes={leaveTypes}
        selectedPolicy={selectedPolicy}
        replacementEmployees={replacementEmployees}
        isReplacementEmployeesLoading={isReplacementEmployeesLoading}
        isRequestSubmitting={isRequestSubmitting}
        requestMessage={requestMessage}
        onSubmit={handleRequestSubmit}
      />

      {/* 2. Add/Edit Leave Type Dialog */}
      <AddLeaveTypeDialog
        open={isAddTypeOpen}
        onOpenChange={setIsAddTypeOpen}
        editingLeaveType={editingLeaveType}
        setEditingLeaveType={setEditingLeaveType}
        leaveTypeForm={leaveTypeForm}
        setLeaveTypeForm={setLeaveTypeForm}
        activePolicyTab={activePolicyTab}
        setActivePolicyTab={setActivePolicyTab}
        leaveTypeSections={leaveTypeSections}
        toggleLeaveTypeSection={toggleLeaveTypeSection}
        updateLeaveTypeField={updateLeaveTypeField}
        updateLeaveTypeFields={updateLeaveTypeFields}
        isLeaveTypeSubmitting={isLeaveTypeSubmitting}
        leaveTypeMessage={leaveTypeMessage}
        onSubmit={handleLeaveTypeSubmit}
      />

      {/* 3. Add/Edit Holiday Dialog */}
      <HolidayDialog
        open={isHolidayDialogOpen}
        onOpenChange={setIsHolidayDialogOpen}
        editingHoliday={editingHoliday}
        setEditingHoliday={setEditingHoliday}
        holidayForm={holidayForm}
        setHolidayForm={setHolidayForm}
        roles={roles}
        holidayErrors={holidayErrors}
        isHolidaySubmitting={isHolidaySubmitting}
        holidayMessage={holidayMessage}
        onSubmit={handleHolidaySubmit}
      />

      {/* 4. Add Past Leave Dialog (Admin Only) */}
      <PastLeaveDialog
        open={isAddPastLeaveOpen}
        onOpenChange={setIsAddPastLeaveOpen}
        pastLeaveForm={pastLeaveForm}
        setPastLeaveForm={setPastLeaveForm}
        employees={employees}
        isEmployeesLoading={isEmployeesLoading}
        leaveTypes={leaveTypes}
        isRequestSubmitting={isRequestSubmitting}
        pastLeaveMessage={pastLeaveMessage}
        onSubmit={handlePastLeaveSubmit}
      />
    </div>
  );
}
