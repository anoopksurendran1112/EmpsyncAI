"use client";

import { useState } from "react";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface LeaveType {
  id: number;
  leave_type?: string;
  short_name?: string;
  name?: string;
}

interface User {
  id: number;
  first_name: string;
  last_name?: string;
  email?: string;
}

interface AddLeaveButtonProps {
  companyId: number;
  leaveTypes: LeaveType[];
  users?: User[];
  isAdmin?: boolean;
  onSave?: (leaveData: any) => void;
}

export default function AddLeaveButton({ 
  companyId, 
  leaveTypes, 
  users = [],
  isAdmin = false,
  onSave
}: AddLeaveButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const calculateDays = (from: string, to: string) => {
    if (!from || !to) return 1;
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

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
    const daysTaken = calculateDays(formData.from_date, formData.to_date);
    
    // Prepare leave data
    const leaveData = {
      id: Date.now(), // Generate mock ID
      ...formData,
      days_taken: daysTaken,
      company_id: companyId,
      created_at: new Date().toISOString(),
      user: isAdmin ? users.find(u => u.id.toString() === formData.user_id) : null,
      leave_type: leaveTypes.find(lt => lt.id.toString() === formData.leave_id),
    };

    console.log('💾 Saving leave data:', leaveData);

    // Simulate API call delay
    setTimeout(() => {
      if (onSave) {
        onSave(leaveData);
      }
      
      setSuccessMessage(
        isAdmin 
          ? "Leave record added successfully!" 
          : "Leave application submitted successfully!"
      );
      
      setLoading(false);
      
      // Close modal after 1.5 seconds
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMessage("");
        resetForm();
      }, 1500);
    }, 1000);
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
    setFormData(prev => ({
      ...prev,
      from_date: date ? format(date, "yyyy-MM-dd") : "",
    }));
  };

  const handleToDateChange = (date: Date | null) => {
    setSelectedToDate(date);
    setFormData(prev => ({
      ...prev,
      to_date: date ? format(date, "yyyy-MM-dd") : "",
    }));
  };

  const getButtonText = () => {
    if (isAdmin) {
      return "Add Leave Record";
    }
    return "Apply for Leave";
  };

  const getModalTitle = () => {
    if (isAdmin) {
      return "Add Leave Record (Admin)";
    }
    return "Apply for Leave";
  };

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

      {/* Modal - Without black background */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          {/* Modal Container - Smaller size */}
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

              {/* ADMIN ONLY FIELDS */}
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
                    disabled={loading}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="">-- Select Employee --</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id} className="text-sm">
                        {user.first_name} {user.last_name || ""}
                        {user.email ? ` (${user.email})` : ''}
                      </option>
                    ))}
                  </select>
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

              {/* Timezone Note
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>5.5 hours ahead of server time</span>
              </div> */}

              {/* Days Taken (Calculated) */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Days Taken
                </label>
                <div className="w-full border border-gray-300 bg-gray-50 rounded px-3 py-1.5 text-sm text-gray-700">
                  {calculateDays(formData.from_date, formData.to_date)} day(s)
                </div>
              </div>

              {/* Leave Choice (for non-admin) */}
              {!isAdmin && (
                <div>
                  <label htmlFor="modal_leave_choice" className="block text-xs font-medium text-gray-700 mb-1">
                    Leave Choice
                  </label>
                  <select
                    id="modal_leave_choice"
                    name="leave_choice"
                    value={formData.leave_choice}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="full_day">Full Day</option>
                    <option value="half_day">Half Day</option>
                  </select>
                </div>
              )}

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
                  disabled={loading}
                  className={`px-4 py-1.5 rounded text-sm text-white ${
                    isAdmin 
                      ? 'bg-purple-600 hover:bg-purple-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
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