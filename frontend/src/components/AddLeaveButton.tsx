"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface LeaveType {
  id: number;
  leave_type?: string;
  short_name?: string;
  name?: string;
}

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: Employee[];  // Your API returns data array
  employees?: Employee[];
  pagination?: any;
}

interface AddLeaveButtonProps {
  companyId: number;
  leaveTypes: LeaveType[];
  isAdmin?: boolean;
  onSave?: (leaveData: any) => void;
}

export default function AddLeaveButton({ 
  companyId, 
  leaveTypes, 
  isAdmin = false,
  onSave
}: AddLeaveButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  const [formData, setFormData] = useState({
    user_id: "",
    from_date: "",
    to_date: "",
    leave_id: "",
    custom_reason: "",
    leave_choice: "full_day",
    status: "A",
    days_taken: 1,
  });

  const [selectedFromDate, setSelectedFromDate] = useState<Date | null>(null);
  const [selectedToDate, setSelectedToDate] = useState<Date | null>(null);

  // Fetch employees when modal opens (admin only)
  useEffect(() => {
    const fetchEmployees = async () => {
      if (isModalOpen && isAdmin && companyId) {
        setEmployeesLoading(true);
        try {
          const response = await fetch(`/api/leave/add-leave`);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data: ApiResponse = await response.json();
          
          if (data.success) {
            // Check both possible response structures
            if (data.data && Array.isArray(data.data)) {
              // Your API returns employees in data array
              setEmployees(data.data);
            } else if (data.employees && Array.isArray(data.employees)) {
              // Alternative: employees in root
              setEmployees(data.employees);
            } else {
              console.error("No employees array found in response:", data);
              setEmployees([]);
            }
          } else {
            console.error("API returned error:", data.message);
            setEmployees([]);
          }
        } catch (error) {
          console.error("Error fetching employees:", error);
          setEmployees([]);
        } finally {
          setEmployeesLoading(false);
        }
      }
    };

    fetchEmployees();
  }, [isModalOpen, isAdmin, companyId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const calculateDays = (from: string, to: string, leaveChoice: string) => {
    if (!from || !to) return 1;
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    if (leaveChoice === 'half_day' || leaveChoice === 'H') {
      return days * 0.5;
    }
    return days;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      // Validate form
      if (!formData.leave_id) {
        setError("Leave type is required");
        setLoading(false);
        return;
      }

      if (!formData.from_date || !formData.to_date) {
        setError("Date range is required");
        setLoading(false);
        return;
      }

      if (isAdmin && !formData.user_id) {
        setError("Please select an employee");
        setLoading(false);
        return;
      }

      // Calculate days
      const daysTaken = calculateDays(formData.from_date, formData.to_date, formData.leave_choice);
      
      // Prepare API payload
      const payload = {
        user_id: parseInt(formData.user_id),
        leave_id: parseInt(formData.leave_id),
        from_date: formData.from_date,
        to_date: formData.to_date,
        leave_choice: formData.leave_choice === 'half_day' ? 'half_day' : 'full_day',
        custom_reason: formData.custom_reason || "",
        status: formData.status || "A",
        company_id: companyId,
      };

      console.log('📤 Adding past leave:', payload);

      // Call the API endpoint
      const response = await fetch("/api/leave/add-leave", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage("Leave record added successfully!");
        
        // Find selected employee name for display
        const selectedEmployee = employees.find(e => e.id.toString() === formData.user_id);
        const selectedLeaveType = leaveTypes.find(lt => lt.id.toString() === formData.leave_id);
        
        // Prepare data for callback
        const leaveRecord = {
          id: Date.now(),
          ...formData,
          days_taken: daysTaken,
          company_id: companyId,
          created_at: new Date().toISOString(),
          user_name: selectedEmployee ? 
            `${selectedEmployee.first_name} ${selectedEmployee.last_name || ''}`.trim() : 
            "Unknown",
          leave_type_name: selectedLeaveType?.name || selectedLeaveType?.leave_type || "Unknown",
          status: formData.status,
        };
        
        if (onSave) {
          onSave(leaveRecord);
        }

        // Reset and close modal after success
        setTimeout(() => {
          setIsModalOpen(false);
          setSuccessMessage("");
          resetForm();
        }, 1500);
      } else {
        setError(data.message || "Failed to add leave record");
      }
    } catch (err) {
      console.error("Error adding leave:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: "",
      from_date: "",
      to_date: "",
      leave_id: "",
      custom_reason: "",
      leave_choice: "full_day",
      status: "A",
      days_taken: 1,
    });
    setSelectedFromDate(null);
    setSelectedToDate(null);
  };

  const handleOpenModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleFromDateChange = (date: Date | null) => {
    setSelectedFromDate(date);
    const fromDateStr = date ? format(date, "yyyy-MM-dd") : "";
    setFormData(prev => ({
      ...prev,
      from_date: fromDateStr,
      days_taken: fromDateStr && prev.to_date 
        ? calculateDays(fromDateStr, prev.to_date, prev.leave_choice)
        : prev.days_taken
    }));
  };

  const handleToDateChange = (date: Date | null) => {
    setSelectedToDate(date);
    const toDateStr = date ? format(date, "yyyy-MM-dd") : "";
    setFormData(prev => ({
      ...prev,
      to_date: toDateStr,
      days_taken: toDateStr && prev.from_date
        ? calculateDays(prev.from_date, toDateStr, prev.leave_choice)
        : prev.days_taken
    }));
  };

  const handleLeaveChoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      leave_choice: value,
      days_taken: prev.from_date && prev.to_date
        ? calculateDays(prev.from_date, prev.to_date, value)
        : prev.days_taken
    }));
  };

  const getButtonText = () => {
    return isAdmin ? "Add Leave Record" : "Apply for Leave";
  };

  const getModalTitle = () => {
    return isAdmin ? "Add Leave Record (Admin)" : "Apply for Leave";
  };

  // Debug: Check employees array
  console.log('Employees loaded:', employees.length, employees);

  return (
    <>
      {/* Add Leave Button */}
      <button
        onClick={handleOpenModal}
        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
          isAdmin 
            ? "bg-purple-600 hover:bg-purple-700 text-white" 
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        <svg 
          className="w-5 h-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 4v16m8-8H4" 
          />
        </svg>
        {getButtonText()}
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md border border-gray-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b px-4 py-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{getModalTitle()}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {isAdmin 
                    ? "Manually record leave taken by employees" 
                    : "Submit your leave application"}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
                disabled={loading}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              {/* Success Message */}
              {successMessage && (
                <div className="p-2 bg-green-100 text-green-700 rounded text-sm">
                  {successMessage}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-2 bg-red-100 text-red-700 rounded text-sm">
                  {error}
                </div>
              )}

              {/* ADMIN ONLY: Employee Selection */}
              {isAdmin && (
                <div>
                  <label htmlFor="modal_user_id" className="block text-xs font-medium text-gray-700 mb-1">
                    Employee *
                  </label>
                  <select
                    id="modal_user_id"
                    name="user_id"
                    value={formData.user_id}
                    onChange={handleChange}
                    required={isAdmin}
                    disabled={loading || employeesLoading}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="">-- Select Employee --</option>
                    {employees.length > 0 ? (
                      employees.map((employee) => (
                        <option key={employee.id} value={employee.id} className="text-sm">
                          {employee.first_name} {employee.last_name || ""}
                        </option>
                      ))
                    ) : (
                      !employeesLoading && (
                        <option value="" disabled className="text-sm text-gray-500">
                          No employees found
                        </option>
                      )
                    )}
                  </select>
                  {employeesLoading && (
                    <p className="text-xs text-gray-500 mt-1">Loading employees...</p>
                  )}
                  {!employeesLoading && employees.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">No employees available</p>
                  )}
                </div>
              )}

              {/* Leave Type */}
              <div>
                <label htmlFor="modal_leave_id" className="block text-xs font-medium text-gray-700 mb-1">
                  Leave Type *
                </label>
                <select
                  id="modal_leave_id"
                  name="leave_id"
                  value={formData.leave_id}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Select Leave Type --</option>
                  {leaveTypes.map((lt) => (
                    <option key={lt.id} value={lt.id} className="text-sm">
                      {lt.name || lt.leave_type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="modal_from_date" className="block text-xs font-medium text-gray-700 mb-1">
                    From Date *
                  </label>
                  <DatePicker
                    id="modal_from_date"
                    selected={selectedFromDate}
                    onChange={handleFromDateChange}
                    dateFormat="dd-MMM-yyyy"
                    placeholderText="From"
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="modal_to_date" className="block text-xs font-medium text-gray-700 mb-1">
                    To Date *
                  </label>
                  <DatePicker
                    id="modal_to_date"
                    selected={selectedToDate}
                    onChange={handleToDateChange}
                    dateFormat="dd-MMM-yyyy"
                    placeholderText="To"
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    minDate={selectedFromDate || undefined}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Days Taken (Calculated) */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Days Taken
                </label>
                <div className="w-full border border-gray-300 bg-gray-50 rounded px-3 py-1.5 text-sm text-gray-700">
                  {formData.days_taken} day(s)
                </div>
              </div>

              {/* Leave Choice */}
              <div>
                <label htmlFor="modal_leave_choice" className="block text-xs font-medium text-gray-700 mb-1">
                  Leave Choice
                </label>
                <select
                  id="modal_leave_choice"
                  name="leave_choice"
                  value={formData.leave_choice}
                  onChange={handleLeaveChoiceChange}
                  disabled={loading}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="full_day">Full Day</option>
                  <option value="half_day">Half Day</option>
                </select>
              </div>

              {/* Status (Admin only) */}
              {isAdmin && (
                <div>
                  <label htmlFor="modal_status" className="block text-xs font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    id="modal_status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required={isAdmin}
                    disabled={loading}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="P">Pending</option>
                    <option value="A">Approved</option>
                    <option value="R">Rejected</option>
                  </select>
                </div>
              )}

              {/* Reason */}
              <div>
                <label htmlFor="modal_custom_reason" className="block text-xs font-medium text-gray-700 mb-1">
                  Reason / Notes
                </label>
                <textarea
                  id="modal_custom_reason"
                  name="custom_reason"
                  value={formData.custom_reason}
                  onChange={handleChange}
                  rows={2}
                  disabled={loading}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter reason or notes"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={loading}
                  className="px-3 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || (isAdmin && employeesLoading)}
                  className={`px-4 py-1.5 rounded text-sm text-white ${
                    isAdmin 
                      ? 'bg-purple-600 hover:bg-purple-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}