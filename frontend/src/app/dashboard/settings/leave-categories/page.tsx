//src/app/dashboard/settings/leave-categories/page.tsx        
"use client";
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import AddLeaveButton from "@/components/AddLeaveButton";

interface LeaveType {
  id: number;
  leave_type?: string;
  short_name?: string;
  monthly_limit?: number;
  yearly_limit?: number;
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
  leave_type_display?: string;
}

interface LeaveRequestsResponse {
  success: boolean;
  total: number;
  page: number;
  total_page: number;
  data: LeaveRequest[];
}

type ActiveTab = "apply" | "requests" | "types" | "balance";

// Add interface for editing state
interface EditingLeaveType {
  id: number;
  leave_type: string;
  short_name: string;
  monthly_limit: number;
  yearly_limit: number;
  initial_credit: number;
  use_credit: boolean;
}

export default function LeavePage() {
  const { company } = useAuth();
  const companyId = company?.id;

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("apply");
  const [formData, setFormData] = useState({
    from_date: "",
    to_date: "",
    leave_id: "",
    custom_reason: "",
    leave_choice: "full_day",
  });

  const [newType, setNewType] = useState({
    leave_type: "",
    short_name: "",
    monthly_limit: 0,
    yearly_limit: 0,
    initial_credit: 0,
    use_credit: false,
  });

  // Inline editing state
  const [editingType, setEditingType] = useState<EditingLeaveType | null>(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cookieSynced, setCookieSynced] = useState(false);
  const [savedLeaves, setSavedLeaves] = useState<any[]>([]);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  const handleSaveLeave = (leaveData: any) => {
    console.log('Leave saved:', leaveData);
    setSavedLeaves(prev => [...prev, leaveData]);
  };

  // Sync company cookie with AuthContext on page load
  useEffect(() => {
    const syncCompanyCookie = async () => {
      if (companyId && !cookieSynced) {
        try {
          console.log('🔄 Syncing company cookie with AuthContext for leave page:', companyId);
          const res = await fetch('/api/update-company-cookie', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company_id: companyId }),
          });
          
          const data = await res.json();
          if (data.success) {
            console.log('✅ Company cookie synced successfully for leave page');
            setCookieSynced(true);
          } else {
            console.error('❌ Failed to sync company cookie for leave page');
          }
        } catch (error) {
          console.error('Error syncing company cookie for leave page:', error);
        }
      }
    };

    syncCompanyCookie();
  }, [companyId, cookieSynced]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  useEffect(() => {
    if (!companyId || !cookieSynced) return;
    console.log('🎯 Fetching leave data with company ID:', companyId, 'Cookie synced:', cookieSynced);
    fetchLeaveTypes();
    fetchRequests(1); // Start with page 1
  }, [companyId, cookieSynced]);

  // ----------- LEAVE TYPE CRUD ----------------
  const fetchLeaveTypes = async () => {
    if (!companyId) return;
    try {
      console.log('📋 Fetching leave types for company:', companyId);
      const res = await fetch(`/api/leave/types?company_id=${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch leave types");
      const data = await res.json();
      console.log('✅ Received leave types:', data.data?.length || 0);
      setLeaveTypes(data.data || []);
    } catch {
      setError("Failed to load leave types");
    }
  };

  const addLeaveType = async () => {
    if (!companyId) return;
    try {
      console.log('➕ Adding leave type for company:', companyId);
      const res = await fetch(`/api/leave/types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newType,
          company_id: companyId
        }),
      });
      if (!res.ok) throw new Error("Failed to add leave type");
      await fetchLeaveTypes();
      setNewType({
        leave_type: "",
        short_name: "",
        monthly_limit: 0,
        yearly_limit: 0,
        initial_credit: 0,
        use_credit: false,
      });
      setMessage("Leave type added successfully");
    } catch {
      setError("Failed to add leave type");
    }
  };

  const updateLeaveType = async (leaveTypeData: EditingLeaveType) => {
    if (!companyId) return;
    
    // Check if leave_type is empty
    if (!leaveTypeData.leave_type.trim()) {
      setError("Leave type name cannot be empty");
      return;
    }
    
    try {
      console.log('✏️ Updating leave type for company:', companyId);
      const res = await fetch(`/api/leave/types`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: leaveTypeData.id,
          leave_type: leaveTypeData.leave_type,
          short_name: leaveTypeData.short_name,
          monthly_limit: leaveTypeData.monthly_limit,
          yearly_limit: leaveTypeData.yearly_limit,
          initial_credit: leaveTypeData.initial_credit,
          use_credit: leaveTypeData.use_credit,
          company_id: companyId 
        }),
      });
      if (!res.ok) throw new Error("Failed to update leave type");
      await fetchLeaveTypes();
      setMessage("Leave type updated successfully");
    } catch {
      setError("Failed to update leave type");
    }
  };

  const deleteLeaveType = async (id: number) => {
    if (!companyId) return;
    try {
      console.log('🗑️ Deleting leave type for company:', companyId);
      const res = await fetch(`/api/leave/types`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id,
          company_id: companyId 
        }),
      });
      if (!res.ok) throw new Error("Failed to delete leave type");
      await fetchLeaveTypes();
      setMessage("Leave type deleted successfully");
    } catch {
      setError("Failed to delete leave type");
    }
  };

  // Inline editing handlers
  const handleEditClick = (leaveType: LeaveType) => {
    setEditingType({
      id: leaveType.id,
      leave_type: leaveType.leave_type || "",
      short_name: leaveType.short_name || "",
      monthly_limit: leaveType.monthly_limit || 0,
      yearly_limit: leaveType.yearly_limit || 0,
      initial_credit: leaveType.initial_credit || 0,
      use_credit: leaveType.use_credit || false,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingType) return;
    await updateLeaveType(editingType);
    setEditingType(null);
  };

  const handleCancelEdit = () => {
    setEditingType(null);
  };

  // ----------- LEAVE REQUESTS ----------------
  const fetchRequests = async (page: number = 1) => {
    if (!companyId) return;
    try {
      console.log('📋 Fetching leave requests for company:', companyId, 'page:', page);
      const res = await fetch(`/api/leave/requests?company_id=${companyId}&page=${page}`);
      if (!res.ok) throw new Error("Failed to fetch leave requests");
      const data: LeaveRequestsResponse = await res.json();
      console.log('✅ Received leave requests:', data.data?.length || 0, 'Total:', data.total);
      
      setRequests(data.data || []);
      setPagination({
        currentPage: data.page || 1,
        totalPages: data.total_page || 1,
        totalItems: data.total || 0,
        itemsPerPage: 10
      });
    } catch {
      setError("Failed to load leave requests");
    }
  };

  // ---------------- LEAVE APPLY ----------------
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !cookieSynced) {
      setError("Company settings not synced yet. Please wait...");
      return;
    }
    
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const payload = {
        from_date: formData.from_date,
        to_date: formData.to_date,
        leave_id: parseInt(formData.leave_id),
        leave_choice: formData.leave_choice,
        custom_reason: formData.custom_reason,
        company_id: companyId,
      };

      console.log('📤 Submitting leave application for company:', companyId);

      const res = await fetch("/api/leave/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Leave application submitted successfully!");
        setFormData({
          from_date: "",
          to_date: "",
          leave_id: "",
          custom_reason: "",
          leave_choice: "full_day",
        });
        setActiveTab("requests");
        fetchRequests(1); // Go to first page after new application
      } else {
        setError(data.message || "Failed to submit leave application");
      }
    } catch {
      setError("Failed to submit leave application");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    if (!companyId || !cookieSynced) {
      setError("Company settings not synced yet. Please wait...");
      return;
    }
    
    try {
      setMessage("");
      setError("");
      
      console.log('🔄 Updating leave status for company:', companyId);
      
      const response = await fetch("/api/leave/status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          id, 
          status, 
          company_id: companyId 
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage(
          `Leave ${status === "A" ? "approved" : "rejected"} successfully`
        );
        // Refresh the current page after status update
        fetchRequests(pagination.currentPage);
      } else {
        setError(data.message || "Failed to update leave status");
      }
    } catch (err) {
      console.error("Error updating leave status:", err);
      setError("Failed to update leave status");
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status.toUpperCase()) {
      case "P":
        return "Pending";
      case "A":
        return "Approved";
      case "R":
        return "Rejected";
      default:
        return status;
    }
  };

  // Function to get leave type display
  const getLeaveTypeDisplay = (request: LeaveRequest) => {
    if (request.leave_type_display) {
      return request.leave_type_display;
    }
    if (request.leave_type?.leave_type) {
      return request.leave_type.leave_type;
    }
    if (request.leave_type?.name) {
      return request.leave_type.name;
    }
    return "Unknown";
  };

  // Pagination component
  const renderPagination = () => {
    const { currentPage, totalPages, totalItems } = pagination;
    
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex items-center justify-between px-6 py-4 border-t">
        <div className="text-sm text-gray-700">
          Showing page {currentPage} of {totalPages} • {totalItems} total requests
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchRequests(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          
          {startPage > 1 && (
            <>
              <button
                onClick={() => fetchRequests(1)}
                className={`px-3 py-1 border rounded-md text-sm font-medium ${currentPage === 1 ? 'bg-blue-50 border-blue-500 text-blue-600' : 'hover:bg-gray-50'}`}
              >
                1
              </button>
              {startPage > 2 && <span className="px-2 text-gray-500">...</span>}
            </>
          )}
          
          {pageNumbers.map((page) => (
            <button
              key={page}
              onClick={() => fetchRequests(page)}
              className={`px-3 py-1 border rounded-md text-sm font-medium ${currentPage === page ? 'bg-blue-50 border-blue-500 text-blue-600' : 'hover:bg-gray-50'}`}
            >
              {page}
            </button>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-2 text-gray-500">...</span>}
              <button
                onClick={() => fetchRequests(totalPages)}
                className={`px-3 py-1 border rounded-md text-sm font-medium ${currentPage === totalPages ? 'bg-blue-50 border-blue-500 text-blue-600' : 'hover:bg-gray-50'}`}
              >
                {totalPages}
              </button>
            </>
          )}
          
          <button
            onClick={() => fetchRequests(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  // --- TAB CONTENT ---
  const renderApplyTab = () => (
    <div className="bg-white border rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Apply for Leave</h2>

      {!cookieSynced && companyId && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-700">
            <span>🔄 Syncing company settings...</span>
          </div>
        </div>
      )}

      <form onSubmit={handleApply} className="space-y-4">
        <div>
          <label htmlFor="leave_id" className="block text-sm font-medium text-gray-700 mb-1">
            Leave Type *
          </label>
          <select
            id="leave_id"
            name="leave_id"
            value={formData.leave_id}
            onChange={handleChange}
            required
            disabled={!cookieSynced}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">-- Select Leave Type --</option>
            {leaveTypes.map((lt) => (
              <option key={lt.id} value={lt.id}>
                {lt.name || lt.leave_type}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="from_date" className="block text-sm font-medium text-gray-700 mb-1">
              From Date *
            </label>
            <DatePicker
              id="from_date"
              selected={formData.from_date ? new Date(formData.from_date) : null}
              onChange={(date: Date | null) =>
                setFormData({
                  ...formData,
                  from_date: date ? format(date, "dd-MMM-yyyy") : "",
                })
              }
              dateFormat="dd-MMM-yyyy"
              placeholderText="Select From Date"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={!cookieSynced}
            />
          </div>

          <div>
            <label htmlFor="to_date" className="block text-sm font-medium text-gray-700 mb-1">
              To Date *
            </label>
            <DatePicker
              id="to_date"
              selected={formData.to_date ? new Date(formData.to_date) : null}
              onChange={(date: Date | null) =>
                setFormData({
                  ...formData,
                  to_date: date ? format(date, "dd-MMM-yyyy") : "",
                })
              }
              dateFormat="dd-MMM-yyyy"
              placeholderText="Select To Date"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              minDate={formData.from_date ? new Date(formData.from_date) : new Date()}
              disabled={!cookieSynced}
            />
          </div>
        </div>

        <div>
          <label htmlFor="leave_choice" className="block text-sm font-medium text-gray-700 mb-1">
            Leave Choice
          </label>
          <select
            id="leave_choice"
            name="leave_choice"
            value={formData.leave_choice}
            onChange={handleChange}
            disabled={!cookieSynced}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="full_day">Full Day</option>
            <option value="half_day">Half Day</option>
          </select>
        </div>

        <div>
          <label htmlFor="custom_reason" className="block text-sm font-medium text-gray-700 mb-1">
            Reason
          </label>
          <textarea
            id="custom_reason"
            name="custom_reason"
            value={formData.custom_reason}
            onChange={handleChange}
            rows={3}
            disabled={!cookieSynced}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Enter reason for leave application"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !cookieSynced}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          {loading ? "Submitting..." : !cookieSynced ? "Syncing Settings..." : "Submit Application"}
        </button>
      </form>
    </div>
  );

  const renderRequestsTab = () => (
    <div className="bg-white border rounded-lg shadow-md">
      <div className="px-6 py-4 border-b">
        <h2 className="text-xl font-bold text-gray-800">Leave Requests</h2>
        {!cookieSynced && companyId && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
            🔄 Syncing company settings...
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        {requests.length > 0 ? (
          <>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    To Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leave Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {req.user?.first_name} {req.user?.last_name || ""}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {req.from_date}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {req.to_date}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getLeaveTypeDisplay(req)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {req.custom_reason || "N/A"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        req.status === 'A' 
                          ? 'bg-green-100 text-green-800' 
                          : req.status === 'R' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getStatusDisplay(req.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                      {req.status.toUpperCase() === "P" ? (
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => updateStatus(req.id, "A")}
                            disabled={!cookieSynced}
                            className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-3 py-1 rounded text-xs transition-colors disabled:cursor-not-allowed"
                            title={cookieSynced ? "Approve" : "Syncing settings..."}
                          >
                            ✅
                          </button>
                          <button
                            onClick={() => updateStatus(req.id, "R")}
                            disabled={!cookieSynced}
                            className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-3 py-1 rounded text-xs transition-colors disabled:cursor-not-allowed"
                            title={cookieSynced ? "Reject" : "Syncing settings..."}
                          >
                            ❌
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs">No actions</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {renderPagination()}
          </>
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">
            {cookieSynced ? "No leave requests found" : "Syncing company settings..."}
          </div>
        )}
      </div>
    </div>
  );

  const renderTypesTab = () => (
    <div className="bg-white border rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Manage Leave Types</h2>

      {!cookieSynced && companyId && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-700">
            <span>🔄 Syncing company settings...</span>
          </div>
        </div>
      )}

      {/* Add New Leave Type Form */}
      <div className="space-y-2 mb-4">
        <input
          type="text"
          value={newType.leave_type}
          onChange={(e) => setNewType({ ...newType, leave_type: e.target.value })}
          placeholder="Leave Type (e.g., Sick Leave, Casual Leave)"
          className="border px-3 py-2 rounded w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={!cookieSynced}
        />
        <input
          type="text"
          value={newType.short_name}
          onChange={(e) => setNewType({ ...newType, short_name: e.target.value })}
          placeholder="Short Name (e.g., SL, CL)"
          className="border px-3 py-2 rounded w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={!cookieSynced}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <input
              type="number"
              value={newType.monthly_limit}
              onChange={(e) => setNewType({ ...newType, monthly_limit: Number(e.target.value) })}
              placeholder="Monthly limit (0 = unlimited)"
              className="border px-3 py-2 rounded w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={!cookieSynced}
            />
            <p className="text-xs text-gray-500 mt-1">Monthly limit</p>
          </div>
          <div>
            <input
              type="number"
              value={newType.yearly_limit}
              onChange={(e) => setNewType({ ...newType, yearly_limit: Number(e.target.value) })}
              placeholder="Yearly limit (0 = unlimited)"
              className="border px-3 py-2 rounded w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={!cookieSynced}
            />
            <p className="text-xs text-gray-500 mt-1">Yearly limit</p>
          </div>
          <div>
            <input
              type="number"
              value={newType.initial_credit}
              onChange={(e) => setNewType({ ...newType, initial_credit: Number(e.target.value) })}
              placeholder="Initial credit (starting balance)"
              className="border px-3 py-2 rounded w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={!cookieSynced}
            />
            <p className="text-xs text-gray-500 mt-1">Initial credit</p>
          </div>
        </div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={newType.use_credit}
            onChange={(e) => setNewType({ ...newType, use_credit: e.target.checked })}
            disabled={!cookieSynced}
            className="disabled:cursor-not-allowed"
          />
          <span className={!cookieSynced ? "text-gray-400" : ""}>
            Can use leave credit
          </span>
        </label>

        <button
          onClick={addLeaveType}
          disabled={!cookieSynced || !newType.leave_type.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {cookieSynced ? "Add Leave Type" : "Syncing Settings..."}
        </button>
      </div>

      {/* Leave Types Table with Inline Editing */}
      <div className="overflow-x-auto">
        <table className="w-full border">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Leave Type</th>
              <th className="px-4 py-2 text-left">Short Name</th>
              <th className="px-4 py-2 text-left">Monthly Limit</th>
              <th className="px-4 py-2 text-left">Yearly Limit</th>
              <th className="px-4 py-2 text-left">Initial Credit</th>
              <th className="px-4 py-2 text-left">Use Credit</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leaveTypes.map((lt) => (
              <tr key={lt.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 align-middle">{lt.id}</td>
                
                {/* Leave Type Column */}
                <td className="px-4 py-2 align-middle">
                  {editingType?.id === lt.id ? (
                    <input
                      type="text"
                      value={editingType.leave_type}
                      onChange={(e) => setEditingType({...editingType, leave_type: e.target.value})}
                      className="border px-2 py-1 rounded w-full text-sm"
                      autoFocus
                    />
                  ) : (
                    lt.leave_type
                  )}
                </td>
                
                {/* Short Name Column */}
                <td className="px-4 py-2 align-middle">
                  {editingType?.id === lt.id ? (
                    <input
                      type="text"
                      value={editingType.short_name}
                      onChange={(e) => setEditingType({...editingType, short_name: e.target.value})}
                      className="border px-2 py-1 rounded w-full text-sm"
                    />
                  ) : (
                    lt.short_name
                  )}
                </td>
                
                {/* Monthly Limit Column */}
                <td className="px-4 py-2 align-middle">
                  {editingType?.id === lt.id ? (
                    <input
                      type="number"
                      value={editingType.monthly_limit}
                      onChange={(e) => setEditingType({...editingType, monthly_limit: Number(e.target.value)})}
                      className="border px-2 py-1 rounded w-full text-sm"
                      min="0"
                    />
                  ) : (
                    lt.monthly_limit
                  )}
                </td>
                
                {/* Yearly Limit Column */}
                <td className="px-4 py-2 align-middle">
                  {editingType?.id === lt.id ? (
                    <input
                      type="number"
                      value={editingType.yearly_limit}
                      onChange={(e) => setEditingType({...editingType, yearly_limit: Number(e.target.value)})}
                      className="border px-2 py-1 rounded w-full text-sm"
                      min="0"
                    />
                  ) : (
                    lt.yearly_limit
                  )}
                </td>
                
                {/* Initial Credit Column */}
                <td className="px-4 py-2 align-middle">
                  {editingType?.id === lt.id ? (
                    <input
                      type="number"
                      value={editingType.initial_credit}
                      onChange={(e) => setEditingType({...editingType, initial_credit: Number(e.target.value)})}
                      className="border px-2 py-1 rounded w-full text-sm"
                      min="0"
                    />
                  ) : (
                    lt.initial_credit
                  )}
                </td>
                
                {/* Use Credit Column */}
                <td className="px-4 py-2 align-middle">
                  {editingType?.id === lt.id ? (
                    <label className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={editingType.use_credit}
                        onChange={(e) => setEditingType({...editingType, use_credit: e.target.checked})}
                        className="mr-2"
                      />
                    </label>
                  ) : (
                    <span className="flex justify-center">
                      {lt.use_credit ? "✓" : "✗"}
                    </span>
                  )}
                </td>
                
                {/* Actions Column */}
                <td className="px-4 py-2 align-middle text-center space-x-2">
                  {editingType?.id === lt.id ? (
                    <>
                      <button
                        onClick={handleSaveEdit}
                        disabled={!editingType.leave_type.trim()}
                        className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-3 py-1 rounded text-xs transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEditClick(lt)}
                        disabled={!cookieSynced}
                        className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white px-3 py-1 rounded text-xs transition-colors disabled:cursor-not-allowed"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteLeaveType(lt.id)}
                        disabled={!cookieSynced}
                        className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-3 py-1 rounded text-xs transition-colors disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {leaveTypes.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-3 text-gray-500">
                  {cookieSynced ? "No leave types found" : "Syncing company settings..."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBalanceTab = () => (
    <div className="bg-white border rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Leave Balance</h2>
      <div className="text-center text-gray-500 py-8">
        Leave balance tracking feature coming soon...
      </div>
    </div>
  );

  // --- MAIN UI ---
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
            <p className="text-gray-600">Manage your leave applications and approvals</p>
          </div>

          {/* Add Leave Button */}
          <AddLeaveButton 
            companyId={companyId || 0}
            leaveTypes={leaveTypes}
            isAdmin={true}
            onSave={handleSaveLeave}
          />
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("apply")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "apply"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Apply Leave
          </button>
          <button
            onClick={() => setActiveTab("types")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "types"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Leave Types
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "requests"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Leave Requests
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "apply" && renderApplyTab()}
        {activeTab === "types" && renderTypesTab()}
        {activeTab === "requests" && renderRequestsTab()}
        {activeTab === "balance" && renderBalanceTab()}
      </div>
    </div>
  );
}