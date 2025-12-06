"use client";
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";

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
  leave_type?: { name: string };
}

type ActiveTab = "apply" | "requests" | "types" | "balance";

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

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cookieSynced, setCookieSynced] = useState(false);

  // Sync company cookie with AuthContext on page load - SAME AS OTHER PAGES
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

  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || localStorage.getItem("access_token");
    }
    return null;
  };

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
    fetchRequests();
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

  const updateLeaveType = async (id: number, name: string) => {
    if (!companyId) return;
    try {
      console.log('✏️ Updating leave type for company:', companyId);
      const res = await fetch(`/api/leave/types`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id, 
          leave_type: name,
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

  // ----------- LEAVE REQUESTS ----------------
  const fetchRequests = async () => {
    if (!companyId) return;
    try {
      console.log('📋 Fetching leave requests for company:', companyId);
      const res = await fetch(`/api/leave/requests?company_id=${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch leave requests");
      const data = await res.json();
      console.log('✅ Received leave requests:', data.data?.length || 0);
      setRequests(data.data || []);
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
        fetchRequests();
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
      const token = getToken();
      if (!token) {
        setError("Unauthorized");
        return;
      }
      
      console.log('🔄 Updating leave status for company:', companyId);
      
      const response = await fetch("/api/leave/status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
        fetchRequests();
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
              minDate={new Date()}
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
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  From Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  To Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {req.user?.first_name} {req.user?.last_name || ""}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {req.from_date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {req.to_date}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {req.custom_reason || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {getStatusDisplay(req.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
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
                      <span className="text-gray-500">No actions</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
        <input
          type="number"
          value={newType.monthly_limit}
          onChange={(e) => setNewType({ ...newType, monthly_limit: Number(e.target.value) })}
          placeholder="Enter maximum leaves allowed per month"
          className="border px-3 py-2 rounded w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={!cookieSynced}
        />
        <input
          type="number"
          value={newType.yearly_limit}
          onChange={(e) => setNewType({ ...newType, yearly_limit: Number(e.target.value) })}
          placeholder="Enter maximum leaves allowed per year"
          className="border px-3 py-2 rounded w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={!cookieSynced}
        />
        <input
          type="number"
          value={newType.initial_credit}
          onChange={(e) => setNewType({ ...newType, initial_credit: Number(e.target.value) })}
          placeholder="Enter starting leave balance"
          className="border px-3 py-2 rounded w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={!cookieSynced}
        />
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={newType.use_credit}
            onChange={(e) => setNewType({ ...newType, use_credit: e.target.checked })}
            disabled={!cookieSynced}
            className="disabled:cursor-not-allowed"
          />
          <span className={!cookieSynced ? "text-gray-400" : ""}>Can use leave credit</span>
        </label>

        <button
          onClick={addLeaveType}
          disabled={!cookieSynced}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {cookieSynced ? "Add Leave Type" : "Syncing Settings..."}
        </button>
      </div>

      <table className="w-full border">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left">ID</th>
            <th className="px-4 py-2 text-left">Leave Type</th>
            <th className="px-4 py-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {leaveTypes.map((lt) => (
            <tr key={lt.id} className="border-t">
              <td className="px-4 py-2">{lt.id}</td>
              <td className="px-4 py-2">{lt.leave_type}</td>
              <td className="px-4 py-2 text-center space-x-2">
                <button
                  onClick={() =>
                    updateLeaveType(lt.id, prompt("Edit leave type", lt.leave_type || "") || "")
                  }
                  disabled={!cookieSynced}
                  className="bg-yellow-500 text-white px-3 py-1 rounded text-xs disabled:bg-yellow-300 disabled:cursor-not-allowed"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteLeaveType(lt.id)}
                  disabled={!cookieSynced}
                  className="bg-red-500 text-white px-3 py-1 rounded text-xs disabled:bg-red-300 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {leaveTypes.length === 0 && (
            <tr>
              <td colSpan={3} className="text-center py-3 text-gray-500">
                {cookieSynced ? "No leave types found" : "Syncing company settings..."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Leave Management</h1>
        <p className="text-gray-600">Manage your leave applications and approvals</p>
        
        {/* Company Info Debug
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Company:</span>
              <span>{company?.name || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">ID:</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{companyId || 'Not set'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Cookie Sync:</span>
              <span className={`px-2 py-1 rounded ${cookieSynced ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {cookieSynced ? '✅ Synced' : '🔄 Syncing'}
              </span>
            </div>
          </div>
        </div> */}
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

        
// "use client";
// import { useEffect, useState } from "react";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import { format } from "date-fns";
// import { useAuth } from "@/context/AuthContext"; // ✅ import Auth context

// interface LeaveType {
//   id: number;
//   leave_type?: string;
//   short_name?: string;
//   monthly_limit?: number;
//   yearly_limit?: number;
//   initial_credit?: number;
//   use_credit?: boolean;
// }

// interface LeaveRequest {
//   id: number;
//   user?: { first_name: string; last_name?: string };
//   from_date: string;
//   to_date: string;
//   custom_reason?: string;
//   status: string;
//   leave_type?: { name: string };
// }

// export default function LeavePage() {
//   const { company, switchCompany } = useAuth(); // ✅ get company from context
//   const companyId = company?.id; // ✅ dynamic company ID

//   const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
//   const [requests, setRequests] = useState<LeaveRequest[]>([]);
//   const [formData, setFormData] = useState({
//     from_date: "",
//     to_date: "",
//     leave_id: "",
//     custom_reason: "",
//     leave_choice: "full_day",
//   });

//   const [newType, setNewType] = useState({
//     leave_type: "",
//     short_name: "",
//     monthly_limit: 0,
//     yearly_limit: 0,
//     initial_credit: 0,
//     use_credit: false,
//   });

//   const [message, setMessage] = useState("");
//   const [showForm, setShowForm] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const getToken = () => {
//     if (typeof window !== "undefined") {
//       return localStorage.getItem("token") || localStorage.getItem("access_token");
//     }
//     return null;
//   };

//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
//   ) => {
//     const { name, value, type } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: type === "number" ? Number(value) : value,
//     }));
//   };

//   useEffect(() => {
//     if (!companyId) return; // wait until company is loaded
//     fetchLeaveTypes();
//     fetchRequests();
//   }, [companyId]); // ✅ re-fetch when company changes

//   // ----------- LEAVE TYPE CRUD ----------------
//   const fetchLeaveTypes = async () => {
//     if (!companyId) return;
//     try {
//       const res = await fetch(`/api/leave/types`);
//       if (!res.ok) throw new Error("Failed to fetch leave types");
//       const data = await res.json();
//       setLeaveTypes(data.data || []);
//     } catch {
//       setError("Failed to load leave types");
//     }
//   };

//   const addLeaveType = async () => {
//     if (!companyId) return;
//     try {
//       const res = await fetch(`/api/leave/types`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(newType),
//       });
//       if (!res.ok) throw new Error("Failed to add leave type");
//       await fetchLeaveTypes();
//       setNewType({
//         leave_type: "",
//         short_name: "",
//         monthly_limit: 0,
//         yearly_limit: 0,
//         initial_credit: 0,
//         use_credit: false,
//       });
//       setMessage("Leave type added successfully");
//     } catch {
//       setError("Failed to add leave type");
//     }
//   };

//   const updateLeaveType = async (id: number, name: string) => {
//     if (!companyId) return;
//     try {
//       const res = await fetch(`/api/leave/types`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ id, leave_type: name }),
//       });
//       if (!res.ok) throw new Error("Failed to update leave type");
//       await fetchLeaveTypes();
//       setMessage("Leave type updated successfully");
//     } catch {
//       setError("Failed to update leave type");
//     }
//   };

//   const deleteLeaveType = async (id: number) => {
//     if (!companyId) return;
//     try {
//       const res = await fetch(`/api/leave/types`, {
//         method: "DELETE",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ id }),
//       });
//       if (!res.ok) throw new Error("Failed to delete leave type");
//       await fetchLeaveTypes();
//       setMessage("Leave type deleted successfully");
//     } catch {
//       setError("Failed to delete leave type");
//     }
//   };

//   // ----------- LEAVE REQUESTS ----------------
//   const fetchRequests = async () => {
//     if (!companyId) return;
//     try {
//       const res = await fetch(`/api/leave/requests`);
//       if (!res.ok) throw new Error("Failed to fetch leave requests");
//       const data = await res.json();
//       setRequests(data.data || []);
//     } catch {
//       setError("Failed to load leave requests");
//     }
//   };

//   // ---------------- LEAVE APPLY ----------------
//   const handleApply = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!companyId) return;
//     setLoading(true);
//     setMessage("");
//     setError("");
//     try {
//       const payload = {
//         from_date: formData.from_date,
//         to_date: formData.to_date,
//         leave_id: parseInt(formData.leave_id),
//         leave_choice: formData.leave_choice,
//         custom_reason: formData.custom_reason,
//         company_id: companyId, // ✅ send dynamic company ID
//       };

//       const res = await fetch("/api/leave/apply", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       const data = await res.json();

//       if (res.ok) {
//         setMessage("Leave application submitted successfully!");
//         setFormData({
//           from_date: "",
//           to_date: "",
//           leave_id: "",
//           custom_reason: "",
//           leave_choice: "full_day",
//         });
//         setShowForm(false);
//         fetchRequests();
//       } else {
//         setError(data.message || "Failed to submit leave application");
//       }
//     } catch {
//       setError("Failed to submit leave application");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const updateStatus = async (id: number, status: string) => {
//     if (!companyId) return;
//     try {
//       setMessage("");
//       setError("");
//       const token = getToken();
//       if (!token) {
//         setError("Unauthorized");
//         return;
//       }
//       const response = await fetch("/api/leave/status", {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ id, status, company_id: companyId }),
//       });

//       const data = await response.json();

//       if (response.ok && data.success) {
//         setMessage(
//           `Leave ${status === "A" ? "approved" : "rejected"} successfully`
//         );
//         fetchRequests();
//       } else {
//         setError(data.message || "Failed to update leave status");
//       }
//     } catch (err) {
//       console.error("Error updating leave status:", err);
//       setError("Failed to update leave status");
//     }
//   };
  
// const getStatusDisplay = (status: string) => {
//   switch (status.toUpperCase()) {
//     case "P":
//       return "Pending";
//     case "A":
//       return "Approved";
//     case "R":
//       return "Rejected";
//     default:
//       return status;
//   }
// };

//   // --- UI ---
//   return (
//    <div className="p-4 space-y-8 max-w-6xl mx-auto">
//       <h1 className="text-2xl font-bold">Leave Management</h1>

//       {/* Leave Type Management */}
//       <div className="bg-white border rounded-lg shadow-md p-6">
//         <h2 className="text-xl font-bold mb-4">Manage Leave Types</h2>

//         {/* 🔹 updated form UI */}
//         {/* 🔹 updated form UI with descriptive labels */}
// <div className="space-y-2 mb-4">
//   <input
//     type="text"
//     value={newType.leave_type}
//     onChange={(e) => setNewType({ ...newType, leave_type: e.target.value })}
//     placeholder="Leave Type (e.g., Sick Leave, Casual Leave)"
//     className="border px-3 py-2 rounded w-full"
//   />
//   <input
//     type="text"
//     value={newType.short_name}
//     onChange={(e) => setNewType({ ...newType, short_name: e.target.value })}
//     placeholder="Short Name (e.g., SL, CL)"
//     className="border px-3 py-2 rounded w-full"
//   />
//   <input
//     type="number"
//     value={newType.monthly_limit}
//     onChange={(e) =>
//       setNewType({ ...newType, monthly_limit: e.target.value })
//     }
//     placeholder="Enter maximum leaves allowed per month"
//     className="border px-3 py-2 rounded w-full"
//   />
//   <input
//     type="number"
//     value={newType.yearly_limit}
//     onChange={(e) =>
//       setNewType({ ...newType, yearly_limit: e.target.value })
//     }
//     placeholder="Enter maximum leaves allowed per year"
//     className="border px-3 py-2 rounded w-full"
//   />
//   <input
//     type="number"
//     value={newType.initial_credit}
//     onChange={(e) =>
//       setNewType({ ...newType, initial_credit: e.target.value })
//     }
//     placeholder="Enter starting leave balance"
//     className="border px-3 py-2 rounded w-full"
//   />
//   <label className="flex items-center space-x-2">
//     <input
//       type="checkbox"
//       checked={newType.use_credit}
//       onChange={(e) =>
//         setNewType({ ...newType, use_credit: e.target.checked })
//       }
//     />
//     <span>Can use leave credit</span>
//   </label>

//   <button
//     onClick={addLeaveType}
//     className="bg-blue-600 text-white px-4 py-2 rounded"
//   >
//     Add
//   </button>
// </div>


//         {/* Leave Type Table (unchanged except using leave_type field) */}
//         <table className="w-full border">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-4 py-2 text-left">ID</th>
//               <th className="px-4 py-2 text-left">Leave Type</th>
//               <th className="px-4 py-2 text-center">Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {leaveTypes.map((lt) => (
//               <tr key={lt.id} className="border-t">
//                 <td className="px-4 py-2">{lt.id}</td>
//                 <td className="px-4 py-2">{lt.leave_type}</td>
//                 <td className="px-4 py-2 text-center space-x-2">
//                   <button
//                     onClick={() =>
//                       updateLeaveType(lt.id, prompt("Edit leave type", lt.leave_type || "") || "")
//                     }
//                     className="bg-yellow-500 text-white px-3 py-1 rounded text-xs"
//                   >
//                     Edit
//                   </button>
//                   <button
//                     onClick={() => deleteLeaveType(lt.id)}
//                     className="bg-red-500 text-white px-3 py-1 rounded text-xs"
//                   >
//                     Delete
//                   </button>
//                 </td>
//               </tr>
//             ))}
//             {leaveTypes.length === 0 && (
//               <tr>
//                 <td colSpan={3} className="text-center py-3 text-gray-500">
//                   No leave types found
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
      

//       {/* Apply Leave Form */}
//       <div className="flex justify-between items-center">
//         <h1 className="text-2xl font-bold text-gray-800">Leave Management</h1>
//         <button
//           onClick={() => setShowForm(!showForm)}
//           className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
//         >
//           {showForm ? "Close Form" : "Apply Leave"}
//         </button>
//       </div>
//       {showForm && (
//         <div className="bg-white border rounded-lg shadow-md p-6">
//           <h2 className="text-xl font-bold mb-4 text-gray-800">
//             Apply for Leave
//           </h2>

//           <form onSubmit={handleApply} className="space-y-4">
//             {/* Leave Type */}
//             <div>
//               <label htmlFor="leave_id" className="block text-sm font-medium text-gray-700 mb-1">
//                 Leave Type *
//               </label>
//               <select
//                 id="leave_id"
//                 name="leave_id"
//                 value={formData.leave_id}
//                 onChange={handleChange}
//                 required
//                 className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="">-- Select Leave Type --</option>
//                 {leaveTypes.map((lt) => (
//                   <option key={lt.id} value={lt.id}>
//                     {lt.name || lt.leave_type}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Date Range */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label htmlFor="from_date" className="block text-sm font-medium text-gray-700 mb-1">
//                   From Date *
//                 </label>
//                 <DatePicker
//                   id="from_date"
//                   selected={formData.from_date ? new Date(formData.from_date) : null}
//                   onChange={(date: Date | null) =>
//                     setFormData({
//                       ...formData,
//                       from_date: date ? format(date, "dd-MMM-yyyy") : "",
//                     })
//                   }
//                   dateFormat="dd-MMM-yyyy"
//                   placeholderText="Select From Date"
//                   className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   minDate={new Date()}
//                 />
//               </div>

//               <div>
//                 <label htmlFor="to_date" className="block text-sm font-medium text-gray-700 mb-1">
//                   To Date *
//                 </label>
//                 <DatePicker
//                   id="to_date"
//                   selected={formData.to_date ? new Date(formData.to_date) : null}
//                   onChange={(date: Date | null) =>
//                     setFormData({
//                       ...formData,
//                       to_date: date ? format(date, "dd-MMM-yyyy") : "",
//                     })
//                   }
//                   dateFormat="dd-MMM-yyyy"
//                   placeholderText="Select To Date"
//                   className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   minDate={formData.from_date ? new Date(formData.from_date) : new Date()}
//                 />
//               </div>
//             </div>

//             {/* Leave Choice */}
//             <div>
//               <label htmlFor="leave_choice" className="block text-sm font-medium text-gray-700 mb-1">
//                 Leave Choice
//               </label>
//               <select
//                 id="leave_choice"
//                 name="leave_choice"
//                 value={formData.leave_choice}
//                 onChange={handleChange}
//                 className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="full_day">Full Day</option>
//                 <option value="half_day">Half Day</option>
//               </select>
//             </div>

//             {/* Reason */}
//             <div>
//               <label htmlFor="custom_reason" className="block text-sm font-medium text-gray-700 mb-1">
//                 Reason
//               </label>
//               <textarea
//                 id="custom_reason"
//                 name="custom_reason"
//                 value={formData.custom_reason}
//                 onChange={handleChange}
//                 rows={3}
//                 className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 placeholder="Enter reason for leave application"
//               />
//             </div>

//             <button
//               type="submit"
//               disabled={loading}
//               className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors"
//             >
//               {loading ? "Submitting..." : "Submit Application"}
//             </button>
//           </form>
//         </div>
//       )}

//       {/* Leave Requests Table */}
//       <div className="bg-white border rounded-lg shadow-md">
//         <div className="px-6 py-4 border-b">
//           <h2 className="text-xl font-bold text-gray-800">Leave Requests</h2>
//         </div>

//         <div className="overflow-x-auto">
//           {requests.length > 0 ? (
//             <table className="w-full">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Employee
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     From Date
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     To Date
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Reason
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Status
//                   </th>
//                   <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {requests.map((req) => (
//                   <tr key={req.id} className="hover:bg-gray-50">
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                       {req.user?.first_name} {req.user?.last_name || ""}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                       {req.from_date ? format(new Date(req.from_date), "dd-MMM-yyyy") : ""}

//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                       {req.from_date ? format(new Date(req.to_date), "dd-MMM-yyyy") : ""}

//                     </td>
//                     <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
//                       {req.custom_reason || "N/A"}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm">
//                       {getStatusDisplay(req.status)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
//                     {req.status.toUpperCase() === "P" ? (
//                       <div className="flex justify-center space-x-2">
//                         <button
//                           onClick={() => updateStatus(req.id, "A")}
//                           className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition-colors"
//                           title="Approve"
//                         >
//                           ✅
//                         </button>
//                         <button
//                           onClick={() => updateStatus(req.id, "R")}
//                           className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs transition-colors"
//                           title="Reject"
//                         >
//                           ❌
//                         </button>
//                       </div>
//                     ) : (
//                       <span className="text-gray-500">No actions</span>
//                     )}
//                   </td>

//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           ) : (
//             <div className="px-6 py-8 text-center text-gray-500">
//               No leave requests found
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

