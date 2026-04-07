"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  History,
  CalendarCheck,
  ShieldCheck,
  Trash2,
  Edit2,
  MoreVertical,
  PlusCircle,
  Filter,
  MoreHorizontal,
  Plus,
  Settings,
  TrendingUp,
  Globe,
  CalendarRange,
  AlertCircle,
  CheckCircle,
  Save,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Dummy Data
const DUMMY_STATS = {
  leavesTaken: 0,
  fullDayLeaves: 0,
  halfDayLeaves: 0,
  pendingRequests: 0,
};



interface LeaveType {
  id: number;
  leave_type: string;
  name?: string; // Sometimes returned as name
  short_name: string;
  monthly_limit: number;
  yearly_limit: number;
  initial_credit?: number;
  use_credit?: boolean;
}

interface LeaveRequest {
  id: number;
  user?: { first_name: string; last_name?: string };
  from_date: string;
  to_date: string;
  custom_reason?: string;
  status: string;
  leave_type?: { name: string; leave_type?: string };
  leave_choice?: string;
  days?: number;
}

interface Holiday {
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

interface CompanyRole {
  id: string;
  name: string;
}

interface ActiveEmployee {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
}

export default function LeavesPage() {
  const { company, isAdmin } = useAuth();
  const companyId = company?.id;

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
  const [leaveTypeForm, setLeaveTypeForm] = useState<Partial<LeaveType>>({
    leave_type: "",
    short_name: "",
    monthly_limit: 0,
    yearly_limit: 0,
    initial_credit: 0,
    use_credit: false,
  });
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null);
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
  });
  const [isRequestSubmitting, setIsRequestSubmitting] = useState(false);
  
  // Add Past Leave States
  const [employees, setEmployees] = useState<ActiveEmployee[]>([]);
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(false);
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

  // Stats State
  const [leaveStats, setLeaveStats] = useState({
    leavesTaken: 0,
    fullDayLeaves: 0,
    halfDayLeaves: 0,
    pendingRequests: 0,
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [requestMessage, setRequestMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

        // Update stats based on requests (using the full data if available or just the current page)
        // Note: For accurate stats, the backend usually returns them in the response or we fetch separately.
        // Assuming result includes enough context for basic stats:
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
        
        // Update stats based on my leaves
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

  // Holiday Fetch functions
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
    if (companyId) {
      if (cookieSynced) {
        fetchLeaveTypes();
        if (viewMode === "admin") {
          fetchLeaveRequests();
          fetchHolidays();
          fetchRoles();
        }
      } 
      
      if (viewMode !== "admin") {
        fetchMyLeaves();
      }
    }
  }, [companyId, viewMode, fetchLeaveTypes, fetchLeaveRequests, fetchMyLeaves, fetchHolidays, fetchRoles, cookieSynced]);

  // Trigger employee fetch when Past Leave Dialog opens
  useEffect(() => {
    if (isAddPastLeaveOpen && viewMode === "admin") {
      fetchActiveEmployees();
    }
  }, [isAddPastLeaveOpen, viewMode, fetchActiveEmployees]);

  // Leave Type Handlers
  const handleLeaveTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = editingLeaveType || leaveTypeForm;
    
    // Explicit validation matching settings page
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
        short_name: data.short_name.trim()
      };

      console.log(`📤 ${method === "PUT" ? "Updating" : "Creating"} leave type:`, payload);

      const res = await fetch(`/api/leave/types`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      console.log(`📡 Leave type ${method === "PUT" ? "update" : "creation"} response:`, { status: res.status, data: result });

      if (res.ok && result.success) {
        setLeaveTypeMessage({ type: "success", text: `Leave type ${editingLeaveType ? "updated" : "added"} successfully!` });
        
        // Short delay before closing to show success message
        setTimeout(() => {
          setIsAddTypeOpen(false);
          setEditingLeaveType(null);
          setLeaveTypeForm({
            leave_type: "",
            short_name: "",
            monthly_limit: 0,
            yearly_limit: 0,
            initial_credit: 0,
            use_credit: false,
          });
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

    setIsRequestSubmitting(true);
    setRequestMessage(null);

    try {
      console.log('📤 Submitting leave application:', { ...requestForm, company_id: companyId });
      const res = await fetch("/api/leave/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...requestForm, company_id: companyId }),
      });
      const result = await res.json();
      
      console.log('📡 Leave application response:', { status: res.status, data: result });

      if (res.ok && result.success) {
        setRequestMessage({ type: "success", text: "Leave application submitted successfully!" });
        setTimeout(() => {
          setIsRequestDialogOpen(false);
          setRequestForm({ from_date: "", to_date: "", leave_id: "", custom_reason: "", leave_choice: "full_day" });
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

      console.log('📡 Status update response:', { status: res.status, data: result });

      if (res.ok && result.success) {
        setStatusMessage({ type: "success", text: `Leave ${status === "A" ? "approved" : "rejected"} successfully!` });
        fetchLeaveRequests(pagination.currentPage);
        // Clear message after 3 seconds
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
    if (!pastLeaveForm.from_date || !pastLeaveForm.to_date || !pastLeaveForm.leave_id || !pastLeaveForm.user_id) {
      setPastLeaveMessage({ type: "error", text: "Please fill in all required fields" });
      return;
    }

    // Date validation
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

  // Helper functions
  const generateDateRange = (startDate: string, endDate: string): string[] => {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    while (current <= end) {
      dates.push(new Date(current).toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const calculateDaysCount = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    return Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1);
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

  // Submit Holiday (Add or Update)
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
        // Update existing - EXACTLY as backend expects
        const requestData = {
          id: editingHoliday.id,
          company_id: companyId,
          holiday: editingHoliday.holiday,
          date: editingHoliday.date,
          is_recurring: editingHoliday.is_recurring,
          is_full_holiday: editingHoliday.is_full_holiday,
          role_ids: editingHoliday.is_full_holiday ? [] : editingHoliday.role_ids,
        };

        console.log('📤 Updating holiday with data:', requestData);

        const res = await fetch(`/api/settings/holiday`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        });
        const result = await res.json();
        
        console.log('📡 Update response:', { status: res.status, data: result });

        if (res.ok && result.success) {
          setHolidayMessage({ type: "success", text: "Holiday updated successfully!" });
          setIsHolidayDialogOpen(false);
          setEditingHoliday(null);
          fetchHolidays();
        } else {
          setHolidayMessage({ type: "error", text: result.message || "Failed to update holiday" });
        }
      } else {
        // Add new (handle multi-day expansion like the settings page)
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

        console.log('🎯 Creating holidays:', { count: holidaysToCreate.length, data: holidaysToCreate });

        const createPromises = holidaysToCreate.map(h =>
          fetch(`/api/settings/holiday`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(h),
          })
        );

        const responses = await Promise.all(createPromises);
        const results = await Promise.all(responses.map(async (r, i) => {
          const resData = await r.json();
          console.log(`📡 Holiday ${i + 1} response:`, { status: r.status, data: resData });
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
      {/* breadcrumb and Main Title Area */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Stats</h1>
          <p className="text-sm text-gray-500 mt-1">
            {viewMode === "user" 
              ? "Overview of your leaves and leave records" 
              : "Review employee requests and maintain company holiday schedules"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            onClick={() => setIsRequestDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Request Leave
          </Button>

        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">
              {viewMode === "user" 
              ? "Leaves Taken" 
              : "Leaves Approved"}
            </h3>
            <p className="text-3xl font-bold text-blue-600">{leaveStats.leavesTaken}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <History className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Full Day</h3>
            <p className="text-3xl font-bold text-green-600">{leaveStats.fullDayLeaves}</p>
          </div>
          <div className="p-3 bg-green-100 rounded-full">
            <CalendarCheck className="h-6 w-6 text-green-600" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Half Day</h3>
            <p className="text-3xl font-bold text-purple-600">{leaveStats.halfDayLeaves}</p>
          </div>
          <div className="p-3 bg-purple-100 rounded-full">
            <Clock className="h-6 w-6 text-purple-600" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">
              {viewMode === "user" 
              ? "Pending" 
              : "Pending Approvals"}
            </h3>
            <p className="text-3xl font-bold text-amber-600">{leaveStats.pendingRequests}</p>
          </div>
          <div className="p-3 bg-amber-100 rounded-full">
            <TrendingUp className="h-6 w-6 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === "user" ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-1">
              <History className="h-5 w-5 text-gray-600" />
              Recent Leave History
            </h1>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
              {isAdmin && (
              <Button 
                variant="outline" 
                className="border-gray-200 hover:bg-gray-50 bg-white shadow-sm"
                onClick={() => setViewMode(viewMode === "user" ? "admin" : "user")}
              >
                {viewMode === "user" ? (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Leaves
                  </>
                ) : (
                  <>
                    <CalendarCheck className="h-4 w-4 mr-2" />
                    My Leaves
                  </>
                )}
              </Button>
              )}
            </div>
          </div>

          <div className="grid gap-4">
            {myLeaves.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                <History className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No leave history found</p>
              </div>
            ) : (
              myLeaves.map((leave) => (
                <div 
                  key={leave.id} 
                  className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:bg-gray-50 cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                  <div className="h-14 w-14 rounded-xl border-2 border-blue-100 bg-blue-50 flex flex-col items-center justify-center flex-shrink-0 text-blue-700">
                    <span className="text-xl font-bold leading-none">
                      {new Date(leave.from_date).getDate()}
                    </span>
                    <span className="text-xs font-semibold uppercase mt-1">
                      {format(new Date(leave.from_date), "MMM")}
                    </span>
                  </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 leading-tight">
                        {leave.leave_type?.leave_type || leave.leave_type?.name || "Leave"}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                        {leave.from_date} to {leave.to_date}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 italic line-clamp-1">"{leave.custom_reason || "No reason provided"}"</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge variant={
                      leave.status === 'A' ? 'default' :
                      leave.status === 'P' ? 'secondary' :
                      'destructive'
                    } className={
                      leave.status === 'A' ? 'bg-green-500' :
                      leave.status === 'P' ? 'bg-amber-500 text-white border-none' :
                      ''
                    }>
                      {leave.status === 'A' ? 'Approved' : leave.status === 'P' ? 'Pending' : 'Rejected'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>

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
                      <>
                        <CalendarCheck className="h-4 w-4 mr-2" />
                        My Leaves
                      </>
                  </Button>
              </div>
            </div>
            <TabsList className="bg-gray-100 p-1 rounded-lg w-fit mb-4">
              <TabsTrigger value="requests" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2 text-sm font-medium">Leave Requests</TabsTrigger>
              <TabsTrigger value="types" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2 text-sm font-medium">Leave Types</TabsTrigger>
              <TabsTrigger value="holidays" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2 text-sm font-medium">Holiday Schedule</TabsTrigger>
            </TabsList>


            {/* Admin: Requests Tab */}
            <TabsContent value="requests" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">Manage Leave Requests</h3>
                  <p className="text-xs text-gray-500">Approve or reject leave requests</p>
                </div>
                <Button onClick={() => setIsAddPastLeaveOpen(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                  <PlusCircle className="h-4 w-4 mr-2" /> Add Past Leave
                </Button>
              </div>

              {statusMessage && (
                <div className={`p-3 rounded-lg flex items-center gap-2 text-sm max-w-md mx-auto mb-4 ${
                  statusMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {statusMessage.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  {statusMessage.text}
                </div>
              )}
              
              <div className="grid gap-4">
                {isRequestsLoading ? (
                  <div className="flex items-center justify-center py-12"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div></div>
                ) : leaveRequests.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg bg-gray-50 border-gray-200">
                    <p className="text-gray-500">No leave requests found</p>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4">
                      {leaveRequests.map((req) => (
                        <div 
                          key={req.id} 
                          className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:bg-gray-50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-xl border-2 border-blue-100 bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-700 font-bold">
                               {req.user?.first_name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900 leading-tight">{req.user?.first_name} {req.user?.last_name || ""}</h3>
                              <p className="text-sm text-blue-600 font-semibold">{req.leave_type?.leave_type || req.leave_type?.name || "Leave"}</p>
                              <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {req.from_date} to {req.to_date}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {req.status === 'P' ? (
                              <div className="flex items-center gap-2">
                                <Button 
                                  size="sm" 
                                  className="bg-green-500 hover:bg-green-600 text-white min-w-[80px] shadow-sm h-8"
                                  onClick={() => handleUpdateStatus(req.id, "A")}
                                >
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-red-500 border-red-200 bg-red-50 hover:bg-red-100 min-w-[80px] h-8"
                                  onClick={() => handleUpdateStatus(req.id, "R")}
                                >
                                  Reject
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-4">
                                <Badge variant={req.status === 'A' ? 'default' : 'destructive'} className={req.status === 'A' ? 'bg-green-500' : ''}>
                                  {req.status === 'A' ? 'Approved' : 'Rejected'}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination Controls */}
                    {pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between px-2 py-4 border-t mt-4">
                        <div className="text-xs text-gray-500 font-medium">
                          Showing page {pagination.currentPage} of {pagination.totalPages} • {pagination.totalItems} total requests
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={pagination.currentPage === 1}
                            onClick={() => fetchLeaveRequests(pagination.currentPage - 1)}
                            className="h-8 text-xs"
                          >
                            Previous
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                              // Simple pagination logic for 5 pages around current
                              let pageNum = pagination.currentPage <= 3 
                                ? i + 1 
                                : Math.min(pagination.currentPage - 2 + i, pagination.totalPages - 4 + i);
                              
                              if (pageNum <= 0) pageNum = i + 1;
                              if (pageNum > pagination.totalPages) return null;

                              return (
                                <Button
                                  key={pageNum}
                                  variant={pagination.currentPage === pageNum ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => fetchLeaveRequests(pageNum)}
                                  className={`h-8 w-8 text-xs p-0 ${pagination.currentPage === pageNum ? 'bg-blue-600' : ''}`}
                                >
                                  {pageNum}
                                </Button>
                              );
                            })}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={pagination.currentPage === pagination.totalPages}
                            onClick={() => fetchLeaveRequests(pagination.currentPage + 1)}
                            className="h-8 text-xs"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

            </TabsContent>

            {/* Admin: Types Tab */}
            <TabsContent value="types" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">Configured Leave Types</h3>
                  <p className="text-xs text-gray-500">Define how many days can be taken for each category</p>
                </div>
                <Button onClick={() => setIsAddTypeOpen(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                   <Plus className="h-4 w-4 mr-2" /> Add Leave Type
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLeaveTypeLoading ? (
                  <div className="col-span-full flex justify-center py-12"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div></div>
                ) : leaveTypes.length === 0 ? (
                  <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg bg-gray-50 border-gray-200 p-10">
                    <p className="text-gray-500 italic">No leave types configured. Click "Add Leave Type" to get started.</p>
                  </div>
                ) : (
                  leaveTypes.map((type) => (
                    <div key={type.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm group hover:border-blue-200 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold uppercase">
                          {type.short_name}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-blue-600 border-blue-100 bg-blue-50 hover:bg-blue-100"
                            onClick={() => {
                              setEditingLeaveType(type);
                              setIsAddTypeOpen(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-600 border-red-100 bg-red-50 hover:bg-red-100"
                            onClick={() => handleDeleteLeaveType(type.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <h4 className="font-bold text-gray-900 mb-1">{type.leave_type}</h4>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                         <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                           <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Monthly</p>
                           <p className="text-sm font-bold text-gray-700">{type.monthly_limit} Day</p>
                         </div>
                         <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                           <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Yearly</p>
                           <p className="text-sm font-bold text-gray-700">{type.yearly_limit} Days</p>
                         </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </TabsContent>

            {/* Admin: Holidays Tab */}
            <TabsContent value="holidays" className="space-y-6">
               <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">Holiday Calendar 2026</h3>
                  <p className="text-xs text-gray-500">Public and company-wide holidays</p>
                </div>
                <Button 
                  onClick={() => {
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
                    setHolidayErrors({});
                    setHolidayMessage(null);
                    setIsHolidayDialogOpen(true);
                  }} 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                   <Plus className="h-4 w-4 mr-2" /> Add Holiday
                </Button>
              </div>

              <div className="grid gap-4">
                {isHolidayLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : holidays.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg bg-gray-50 border-gray-200">
                    <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No holidays scheduled</p>
                  </div>
                ) : (
                  holidays.map((holiday) => (
                    <div key={holiday.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:border-blue-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl border-2 border-red-100 bg-red-50 flex items-center justify-center flex-shrink-0 text-red-600">
                          <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg text-gray-900 leading-tight">{holiday.holiday}</h3>
                            <div className="flex gap-1">
                              {holiday.is_recurring && (
                                <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-600 border-none px-1.5 py-0">Recurring</Badge>
                              )}
                              {holiday.is_full_holiday && (
                                <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-600 border-none px-1.5 py-0">Full Day</Badge>
                              )}
                              {holiday.is_global && (
                                <Badge variant="secondary" className="text-[10px] bg-purple-50 text-purple-600 border-none px-1.5 py-0">Global</Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-wider text-[11px]">
                            {holiday.end_date 
                              ? `${format(new Date(holiday.date), "PPP")} - ${format(new Date(holiday.end_date), "PPP")}`
                              : format(new Date(holiday.date), "PPPP")
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-none pt-3 sm:pt-0">
                        <div className="text-right hidden md:block">
                           <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Applies To</p>
                           <p className="text-xs font-semibold text-gray-700">
                             {holiday.is_full_holiday ? "All Employees" : `${holiday.role_ids?.length || 0} Role(s)`}
                           </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-blue-600 border-blue-100 bg-blue-50 hover:bg-blue-100"
                            onClick={() => handleEditHoliday(holiday)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-red-600 border-red-100 bg-red-50 hover:bg-red-100"
                            onClick={() => holiday.id && handleDeleteHoliday(holiday.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Dialogs */}
      
      {/* 1. Apply Leave Request Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Apply for Leave</DialogTitle>
            <DialogDescription>Submit your leave application for approval</DialogDescription>
          </DialogHeader>

          {requestMessage && (
            <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
              requestMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700 text-left'
            }`}>
              {requestMessage.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {requestMessage.text}
            </div>
          )}

          <form onSubmit={handleRequestSubmit} className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from_date">From Date</Label>
                <Input 
                  id="from_date" 
                  type="date" 
                  required
                  value={requestForm.from_date}
                  onChange={(e) => setRequestForm({...requestForm, from_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="to_date">To Date</Label>
                <Input 
                  id="to_date" 
                  type="date" 
                  required
                  value={requestForm.to_date}
                  onChange={(e) => setRequestForm({...requestForm, to_date: e.target.value})}
                  min={requestForm.from_date}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leave_id">Leave Type</Label>
                <Select
                  value={requestForm.leave_id}
                  onValueChange={(val) => setRequestForm({...requestForm, leave_id: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map(lt => (
                      <SelectItem key={lt.id} value={lt.id.toString()}>{lt.leave_type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="leave_choice">Duration</Label>
                <Select 
                  value={requestForm.leave_choice}
                  onValueChange={(val) => setRequestForm({...requestForm, leave_choice: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_day">Full Day</SelectItem>
                    <SelectItem value="half_day">Half Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Leave</Label>
              <textarea 
                id="reason"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter short details..."
                value={requestForm.custom_reason}
                onChange={(e) => setRequestForm({...requestForm, custom_reason: e.target.value})}
                required
              ></textarea>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRequestDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 text-white" disabled={isRequestSubmitting}>
                {isRequestSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Add Leave Type Dialog */}
      <Dialog open={isAddTypeOpen} onOpenChange={setIsAddTypeOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingLeaveType ? "Edit Leave Type" : "Add Leave Type"}
            </DialogTitle>
            <DialogDescription>Define a new leave category and its limits</DialogDescription>
          </DialogHeader>
          
          {leaveTypeMessage && (
            <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
              leaveTypeMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700 text-left'
            }`}>
              {leaveTypeMessage.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {leaveTypeMessage.text}
            </div>
          )}

          <form onSubmit={handleLeaveTypeSubmit} className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label>Type Name *</Label>
              <Input 
                placeholder="e.g. Sick Leave" 
                value={editingLeaveType ? editingLeaveType.leave_type : leaveTypeForm.leave_type}
                onChange={(e) => {
                  const val = e.target.value;
                  if (editingLeaveType) setEditingLeaveType({...editingLeaveType, leave_type: val});
                  else setLeaveTypeForm({...leaveTypeForm, leave_type: val});
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Short Name *</Label>
              <Input 
                placeholder="e.g. SL" 
                value={editingLeaveType ? editingLeaveType.short_name : leaveTypeForm.short_name}
                onChange={(e) => {
                  const val = e.target.value;
                  if (editingLeaveType) setEditingLeaveType({...editingLeaveType, short_name: val});
                  else setLeaveTypeForm({...leaveTypeForm, short_name: val});
                }}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monthly Limit</Label>
                <Input 
                  type="number" 
                  value={editingLeaveType ? editingLeaveType.monthly_limit : leaveTypeForm.monthly_limit}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    if (editingLeaveType) setEditingLeaveType({...editingLeaveType, monthly_limit: val});
                    else setLeaveTypeForm({...leaveTypeForm, monthly_limit: val});
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Yearly Limit</Label>
                <Input 
                  type="number" 
                  value={editingLeaveType ? editingLeaveType.yearly_limit : leaveTypeForm.yearly_limit}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    if (editingLeaveType) setEditingLeaveType({...editingLeaveType, yearly_limit: val});
                    else setLeaveTypeForm({...leaveTypeForm, yearly_limit: val});
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Initial Credit</Label>
              <Input 
                type="number" 
                value={editingLeaveType ? editingLeaveType.initial_credit : leaveTypeForm.initial_credit}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  if (editingLeaveType) setEditingLeaveType({...editingLeaveType, initial_credit: val});
                  else setLeaveTypeForm({...leaveTypeForm, initial_credit: val});
                }}
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Switch 
                id="use_credit"
                checked={editingLeaveType ? editingLeaveType.use_credit : leaveTypeForm.use_credit}
                onCheckedChange={(checked) => {
                  if (editingLeaveType) setEditingLeaveType({...editingLeaveType, use_credit: checked});
                  else setLeaveTypeForm({...leaveTypeForm, use_credit: checked});
                }}
              />
              <Label htmlFor="use_credit">Enable Leave Credit</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddTypeOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 text-white" disabled={isLeaveTypeSubmitting}>
                {isLeaveTypeSubmitting ? "Saving..." : (editingLeaveType ? "Update Type" : "Save Type")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Add/Edit Holiday Dialog */}
      <Dialog open={isHolidayDialogOpen} onOpenChange={setIsHolidayDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingHoliday ? "Edit Holiday" : "Add Company Holiday"}
            </DialogTitle>
            <DialogDescription>
              {editingHoliday ? "Update holiday details" : "Add a public or company-wide holiday to the calendar"}
            </DialogDescription>
          </DialogHeader>
          
          {holidayMessage && (
            <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
              holidayMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {holidayMessage.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {holidayMessage.text}
            </div>
          )}

          <form onSubmit={handleHolidaySubmit} className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="h_name">Holiday Name *</Label>
              <Input 
                id="h_name"
                placeholder="e.g. Independence Day" 
                value={editingHoliday ? editingHoliday.holiday : holidayForm.holiday}
                onChange={(e) => {
                  const val = e.target.value;
                  if (editingHoliday) setEditingHoliday({...editingHoliday, holiday: val});
                  else setHolidayForm({...holidayForm, holiday: val});
                }}
              />
              {holidayErrors.holiday && <p className="text-red-500 text-xs">{holidayErrors.holiday}</p>}
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="multi_day_toggle" className="text-sm font-medium cursor-pointer">Multi-day Holiday</Label>
              <Switch 
                id="multi_day_toggle"
                checked={editingHoliday ? editingHoliday.is_multi_day : holidayForm.is_multi_day}
                onCheckedChange={(checked) => {
                  if (editingHoliday) setEditingHoliday({...editingHoliday, is_multi_day: checked});
                  else setHolidayForm({...holidayForm, is_multi_day: checked});
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="h_date">{editingHoliday?.is_multi_day || holidayForm.is_multi_day ? "Start Date" : "Date"} *</Label>
                <Input 
                  id="h_date"
                  type="date" 
                  value={editingHoliday ? editingHoliday.date : holidayForm.date}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (editingHoliday) setEditingHoliday({...editingHoliday, date: val});
                    else setHolidayForm({...holidayForm, date: val});
                  }}
                />
                {holidayErrors.date && <p className="text-red-500 text-xs">{holidayErrors.date}</p>}
              </div>

              {(editingHoliday?.is_multi_day || holidayForm.is_multi_day) && (
                <div className="space-y-2">
                  <Label htmlFor="h_end_date">End Date *</Label>
                  <Input 
                    id="h_end_date"
                    type="date" 
                    value={editingHoliday ? editingHoliday.end_date : holidayForm.end_date}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (editingHoliday) setEditingHoliday({...editingHoliday, end_date: val});
                      else setHolidayForm({...holidayForm, end_date: val});
                    }}
                    min={editingHoliday ? editingHoliday.date : holidayForm.date}
                  />
                  {holidayErrors.end_date && <p className="text-red-500 text-xs">{holidayErrors.end_date}</p>}
                  {(editingHoliday?.end_date && editingHoliday?.date) || (holidayForm.end_date && holidayForm.date) ? (
                    <p className="text-[10px] text-green-600 font-semibold uppercase">
                      {calculateDaysCount(
                        editingHoliday ? editingHoliday.date : holidayForm.date,
                        editingHoliday ? (editingHoliday.end_date || '') : (holidayForm.end_date || '')
                      )} days holiday
                    </p>
                  ) : null}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <div className="flex items-center gap-2">
                  <Switch 
                    id="h_recurring"
                    checked={editingHoliday ? editingHoliday.is_recurring : holidayForm.is_recurring}
                    onCheckedChange={(checked) => {
                      if (editingHoliday) setEditingHoliday({...editingHoliday, is_recurring: checked});
                      else setHolidayForm({...holidayForm, is_recurring: checked});
                    }}
                  />
                  <Label htmlFor="h_recurring" className="text-xs cursor-pointer">Recurring</Label>
               </div>
               <div className="flex items-center gap-2">
                  <Switch 
                    id="h_full"
                    checked={editingHoliday ? editingHoliday.is_full_holiday : holidayForm.is_full_holiday}
                    onCheckedChange={(checked) => {
                      if (editingHoliday) setEditingHoliday({...editingHoliday, is_full_holiday: checked});
                      else setHolidayForm({...holidayForm, is_full_holiday: checked});
                    }}
                  />
                  <Label htmlFor="h_full" className="text-xs cursor-pointer">Full Day</Label>
               </div>
               <div className="flex items-center gap-2">
                  <Switch 
                    id="h_global"
                    checked={editingHoliday ? editingHoliday.is_global : holidayForm.is_global}
                    onCheckedChange={(checked) => {
                      if (editingHoliday) setEditingHoliday({...editingHoliday, is_global: checked});
                      else setHolidayForm({...holidayForm, is_global: checked});
                    }}
                  />
                  <Label htmlFor="h_global" className="text-xs cursor-pointer">Global</Label>
               </div>
            </div>

            {!(editingHoliday ? editingHoliday.is_full_holiday : holidayForm.is_full_holiday) && roles.length > 0 && (
              <div className="space-y-2">
                <Label>Applicable Roles</Label>
                <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg max-h-32 overflow-y-auto bg-gray-50">
                  {roles.map(role => (
                    <div key={role.id} className="flex items-center gap-2">
                      <input 
                        type="checkbox"
                        id={`role-${role.id}`}
                        checked={editingHoliday ? editingHoliday.role_ids.includes(role.id) : holidayForm.role_ids.includes(role.id)}
                        onChange={(e) => {
                          const isEditing = !!editingHoliday;
                          const currentData = isEditing ? editingHoliday! : holidayForm;
                          const newRoles = e.target.checked 
                            ? [...currentData.role_ids, role.id]
                            : currentData.role_ids.filter(id => id !== role.id);
                          
                          if (isEditing) setEditingHoliday({...editingHoliday!, role_ids: newRoles});
                          else setHolidayForm({...holidayForm, role_ids: newRoles});
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={`role-${role.id}`} className="text-xs text-gray-700 cursor-pointer">{role.name}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsHolidayDialogOpen(false)}>Cancel</Button>
              <Button 
                type="submit" 
                className="bg-blue-600 text-white min-w-[120px]"
                disabled={isHolidaySubmitting}
              >
                {isHolidaySubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {editingHoliday ? "Updating..." : "Saving..."}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {editingHoliday ? "Update Holiday" : "Add Holiday"}
                  </span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. Add Past Leave Dialog (Admin Only) */}
      <Dialog open={isAddPastLeaveOpen} onOpenChange={setIsAddPastLeaveOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add Past Leave Record</DialogTitle>
            <DialogDescription>Record a past leave for an employee (Past dates only)</DialogDescription>
          </DialogHeader>

          {pastLeaveMessage && (
            <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
              pastLeaveMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {pastLeaveMessage.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {pastLeaveMessage.text}
            </div>
          )}

          <form onSubmit={handlePastLeaveSubmit} className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="past_user_id">Employee *</Label>
              <Select 
                value={pastLeaveForm.user_id}
                onValueChange={(val) => setPastLeaveForm({...pastLeaveForm, user_id: val})}
              >
                <SelectTrigger id="past_user_id">
                  <SelectValue placeholder={isEmployeesLoading ? "Loading employees..." : "Select Employee"} />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.first_name} {emp.last_name || ""}
                    </SelectItem>
                  ))}
                  {employees.length === 0 && !isEmployeesLoading && (
                    <SelectItem value="none" disabled>No employees found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="past_from_date">From Date *</Label>
                <Input 
                  id="past_from_date" 
                  type="date" 
                  required
                  value={pastLeaveForm.from_date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setPastLeaveForm({...pastLeaveForm, from_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="past_to_date">To Date *</Label>
                <Input 
                  id="past_to_date" 
                  type="date" 
                  required
                  value={pastLeaveForm.to_date}
                  min={pastLeaveForm.from_date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setPastLeaveForm({...pastLeaveForm, to_date: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="past_leave_id">Leave Type *</Label>
              <Select 
                value={pastLeaveForm.leave_id}
                onValueChange={(val) => setPastLeaveForm({...pastLeaveForm, leave_id: val})}
              >
                <SelectTrigger id="past_leave_id">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map(lt => (
                    <SelectItem key={lt.id} value={lt.id.toString()}>{lt.leave_type || lt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="past_leave_choice">Duration</Label>
                <Select 
                  value={pastLeaveForm.leave_choice}
                  onValueChange={(val) => setPastLeaveForm({...pastLeaveForm, leave_choice: val})}
                >
                  <SelectTrigger id="past_leave_choice">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_day">Full Day</SelectItem>
                    <SelectItem value="half_day">Half Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="past_status">Status</Label>
                <Select 
                  value={pastLeaveForm.status}
                  onValueChange={(val) => setPastLeaveForm({...pastLeaveForm, status: val})}
                >
                  <SelectTrigger id="past_status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Approved</SelectItem>
                    <SelectItem value="P">Pending</SelectItem>
                    <SelectItem value="R">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="past_reason">Reason (Optional)</Label>
              <textarea 
                id="past_reason"
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter details..."
                value={pastLeaveForm.custom_reason}
                onChange={(e) => setPastLeaveForm({...pastLeaveForm, custom_reason: e.target.value})}
              ></textarea>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddPastLeaveOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 text-white" disabled={isRequestSubmitting}>
                {isRequestSubmitting ? "Recording..." : "Record Leave"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
