// "use client";

// import { useEffect, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import { Trash2, Edit2, Calendar, Clock, Users, Globe, Plus, AlertCircle, CheckCircle, X, Save, CalendarRange } from "lucide-react";
// import { useCompany } from "@/context/CompanyContext";
// import { Switch } from "@/components/ui/switch";
// import { Label } from "@/components/ui/label";

// interface Holiday {
//   id?: string;
//   holiday: string;
//   date: string;
//   end_date?: string; // Add end_date for multi-day holidays
//   is_recurring: boolean;
//   is_full_holiday: boolean;
//   is_global: boolean;
//   role_ids: string[];
//   company_id?: string;
//   is_multi_day?: boolean; // Flag to indicate multi-day holiday
// }

// interface CompanyRole {
//   id: string;
//   name: string;
// }

// export default function HolidayPage() {
//   const { currentCompany } = useCompany();
//   const companyId = currentCompany?.id;

//   const [holidays, setHolidays] = useState<Holiday[]>([]);
//   const [roles, setRoles] = useState<CompanyRole[]>([]);
//   const [form, setForm] = useState<Holiday>({
//     holiday: "",
//     date: "",
//     end_date: "",
//     is_recurring: false,
//     is_full_holiday: true,
//     is_global: false,
//     role_ids: [],
//     is_multi_day: false,
//   });
//   const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isUpdating, setIsUpdating] = useState(false);
//   const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
//   const [errors, setErrors] = useState<Record<string, string>>({});

//   // Fetch holidays and roles
//   const fetchHolidays = async () => {
//     if (!companyId) return;
//     setIsLoading(true);
//     try {
//       const res = await fetch(`/api/settings/holiday`);
//       const data = await res.json();
//       if (res.ok && data.success) {
//         setHolidays(data.data);
//         setMessage({ type: "success", text: `Loaded ${data.data.length} holidays` });
//       } else {
//         setMessage({ type: "error", text: data.message || "Failed to load holidays" });
//       }
//     } catch (error) {
//       console.error("Failed to load holidays", error);
//       setMessage({ type: "error", text: "Network error while loading holidays" });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const fetchRoles = async () => {
//     if (!companyId) return;
//     try {
//       const res = await fetch(`/api/settings/roles/${companyId}`);
//       const data = await res.json();
      
//       if (res.ok) {
//         const rolesData = Array.isArray(data) ? data : (data.data || data);
//         setRoles(rolesData);
//         console.log(`✅ Loaded ${rolesData.length} roles`);
//       } else {
//         console.error("Failed to load roles:", data.error);
//         setMessage({ type: "error", text: data.error || "Failed to load roles" });
//       }
//     } catch (error) {
//       console.error("Failed to load roles", error);
//       setMessage({ type: "error", text: "Network error while loading roles" });
//     }
//   };

//   useEffect(() => {
//     if (companyId) {
//       fetchHolidays();
//       fetchRoles();
//     }
//   }, [companyId]);

//   // Validation
//   const validateForm = (holidayData: Holiday) => {
//     const newErrors: Record<string, string> = {};

//     if (!holidayData.holiday.trim()) newErrors.holiday = "Holiday name is required";
//     if (!holidayData.date) newErrors.date = "Start date is required";
    
//     // If multi-day holiday, validate end date
//     if (holidayData.is_multi_day) {
//       if (!holidayData.end_date) {
//         newErrors.end_date = "End date is required for multi-day holidays";
//       } else if (new Date(holidayData.end_date) < new Date(holidayData.date)) {
//         newErrors.end_date = "End date must be after start date";
//       }
//     }

//     // Check if dates are in the future (only for new holidays, not for edits)
//     if (!editingHoliday) {
//       if (holidayData.date && new Date(holidayData.date) < new Date()) {
//         newErrors.date = "Holiday date must be in the future";
//       }
//       if (holidayData.end_date && new Date(holidayData.end_date) < new Date()) {
//         newErrors.end_date = "Holiday end date must be in the future";
//       }
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   // Generate date range for multi-day holidays
//   const generateDateRange = (startDate: string, endDate: string): string[] => {
//     const dates = [];
//     const current = new Date(startDate);
//     const end = new Date(endDate);
    
//     while (current <= end) {
//       dates.push(new Date(current).toISOString().split('T')[0]);
//       current.setDate(current.getDate() + 1);
//     }
    
//     return dates;
//   };

//   // Calculate number of days for multi-day holidays
//   const calculateDaysCount = (startDate: string, endDate: string): number => {
//     const start = new Date(startDate);
//     const end = new Date(endDate);
//     const timeDiff = end.getTime() - start.getTime();
//     return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates
//   };

//   // Submit new holiday
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!validateForm(form)) {
//       setMessage({ type: "error", text: "Please fix the errors above" });
//       return;
//     }

//     if (!companyId) {
//       setMessage({ type: "error", text: "No company selected" });
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       let holidaysToCreate: Holiday[] = [];

//       if (form.is_multi_day && form.end_date) {
//         // Create multiple holidays for date range
//         const dateRange = generateDateRange(form.date, form.end_date);
//         holidaysToCreate = dateRange.map(date => ({
//           holiday: form.holiday,
//           date: date,
//           is_recurring: form.is_recurring,
//           is_full_holiday: form.is_full_holiday,
//           is_global: form.is_global,
//           role_ids: form.is_full_holiday ? [] : form.role_ids,
//           company_id: companyId,
//           is_multi_day: true,
//         }));
//       } else {
//         // Single day holiday
//         holidaysToCreate = [{
//           ...form,
//           company_id: companyId,
//           is_multi_day: false,
//         }];
//       }

//       // Create all holidays
//       const createPromises = holidaysToCreate.map(holiday =>
//         fetch(`/api/settings/holiday`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(holiday),
//         })
//       );

//       const responses = await Promise.all(createPromises);
//       const results = await Promise.all(responses.map(res => res.json()));

//       // Check if all creations were successful
//       const allSuccess = results.every(result => result.success);
      
//       if (allSuccess) {
//         setForm({
//           holiday: "",
//           date: "",
//           end_date: "",
//           is_recurring: false,
//           is_full_holiday: true,
//           is_global: false,
//           role_ids: [],
//           is_multi_day: false,
//         });
//         setErrors({});
//         const daysCount = form.is_multi_day && form.end_date ? calculateDaysCount(form.date, form.end_date) : 1;
//         setMessage({ 
//           type: "success", 
//           text: `Successfully created ${daysCount} holiday${daysCount > 1 ? 's' : ''}!` 
//         });
//         fetchHolidays();
//       } else {
//         setMessage({ type: "error", text: "Failed to create some holidays" });
//       }
//     } catch (err) {
//       console.error("Error submitting holiday", err);
//       setMessage({ type: "error", text: "Network error while adding holiday" });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Update existing holiday
//   const handleUpdateHoliday = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!editingHoliday || !editingHoliday.id) {
//       setMessage({ type: "error", text: "No holiday selected for editing" });
//       return;
//     }

//     if (!validateForm(editingHoliday)) {
//       setMessage({ type: "error", text: "Please fix the errors above" });
//       return;
//     }

//     setIsUpdating(true);
//     try {
//       const res = await fetch(`/api/settings/holiday`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ 
//           id: editingHoliday.id,
//           holiday: editingHoliday.holiday,
//           date: editingHoliday.date,
//           end_date: editingHoliday.end_date,
//           is_recurring: editingHoliday.is_recurring,
//           is_full_holiday: editingHoliday.is_full_holiday,
//           is_global: editingHoliday.is_global,
//           role_ids: editingHoliday.is_full_holiday ? [] : editingHoliday.role_ids,
//           is_multi_day: editingHoliday.is_multi_day,
//         }),
//       });

//       const data = await res.json();

//       if (res.ok && data.success) {
//         setMessage({ type: "success", text: "Holiday updated successfully!" });
//         setEditingHoliday(null);
//         fetchHolidays();
//       } else {
//         setMessage({ type: "error", text: data.message || "Failed to update holiday" });
//       }
//     } catch (err) {
//       console.error("Error updating holiday", err);
//       setMessage({ type: "error", text: "Network error while updating holiday" });
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   // Start editing a holiday
//   const handleEditHoliday = (holiday: Holiday) => {
//     setEditingHoliday({ 
//       ...holiday,
//       is_multi_day: holiday.end_date ? true : false 
//     });
//     setErrors({});
//   };

//   // Cancel editing
//   const handleCancelEdit = () => {
//     setEditingHoliday(null);
//     setErrors({});
//   };

//   // Update editing holiday form
//   const handleEditInputChange = (field: keyof Holiday, value: any) => {
//     if (editingHoliday) {
//       setEditingHoliday({ ...editingHoliday, [field]: value });
//       if (errors[field]) {
//         setErrors({ ...errors, [field]: "" });
//       }
//     }
//   };

//   // Update new holiday form
//   const handleInputChange = (field: keyof Holiday, value: any) => {
//     setForm({ ...form, [field]: value });
//     if (errors[field]) {
//       setErrors({ ...errors, [field]: "" });
//     }
//   };

//   // Toggle multi-day holiday
//   const handleMultiDayToggle = (checked: boolean, isEditing: boolean = false) => {
//     if (isEditing && editingHoliday) {
//       setEditingHoliday({ 
//         ...editingHoliday, 
//         is_multi_day: checked,
//         end_date: checked ? editingHoliday.end_date || "" : ""
//       });
//     } else {
//       setForm({ 
//         ...form, 
//         is_multi_day: checked,
//         end_date: checked ? form.end_date || "" : ""
//       });
//     }
//   };

//   const handleRoleToggle = (roleId: string, isEditing: boolean = false) => {
//     if (isEditing && editingHoliday) {
//       const newRoleIds = editingHoliday.role_ids.includes(roleId)
//         ? editingHoliday.role_ids.filter(id => id !== roleId)
//         : [...editingHoliday.role_ids, roleId];
//       setEditingHoliday({ ...editingHoliday, role_ids: newRoleIds });
//     } else {
//       const newRoleIds = form.role_ids.includes(roleId)
//         ? form.role_ids.filter(id => id !== roleId)
//         : [...form.role_ids, roleId];
//       setForm({ ...form, role_ids: newRoleIds });
//     }
//   };

//   const handleDeleteHoliday = async (holidayId: string) => {
//     if (!confirm("Are you sure you want to delete this holiday?")) return;

//     try {
//       const res = await fetch(`/api/settings/holiday`, {
//         method: "DELETE",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ id: holidayId }),
//       });

//       const data = await res.json();

//       if (res.ok && data.success) {
//         setMessage({ type: "success", text: "Holiday deleted successfully!" });
//         if (editingHoliday?.id === holidayId) {
//           setEditingHoliday(null);
//         }
//         fetchHolidays();
//       } else {
//         setMessage({ type: "error", text: data.message || "Failed to delete holiday" });
//       }
//     } catch (err) {
//       console.error("Error deleting holiday", err);
//       setMessage({ type: "error", text: "Network error while deleting holiday" });
//     }
//   };

//   const getInputClasses = (fieldName: string) =>
//     `transition-colors ${
//       errors[fieldName]
//         ? "border-red-300 focus:border-red-500 focus:ring-red-200"
//         : "border-gray-300 focus:border-gray-500 focus:ring-gray-200"
//     }`;

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       weekday: 'long',
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric'
//     });
//   };

//   const formatDateRange = (startDate: string, endDate: string) => {
//     const start = new Date(startDate);
//     const end = new Date(endDate);
//     const daysCount = calculateDaysCount(startDate, endDate);
    
//     return `${formatDate(startDate)} to ${formatDate(endDate)} (${daysCount} days)`;
//   };

//   if (!companyId) {
//     return <p className="p-6 text-red-500">No company selected</p>;
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="max-w-7xl mx-auto">
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
//             <Calendar className="h-8 w-8 text-gray-700" />
//             Holiday Management
//           </h1>
//           <p className="text-gray-600 mt-2">Manage company holidays and time off</p>
//         </div>

//         {/* Message Display */}
//         {message && (
//           <div className={`mb-6 p-4 rounded-lg border-l-4 flex items-center gap-2 ${
//             message.type === 'success' 
//               ? 'bg-green-50 border-green-400 text-green-700' 
//               : 'bg-red-50 border-red-400 text-red-700'
//           }`}>
//             {message.type === 'success' ? (
//               <CheckCircle className="h-5 w-5" />
//             ) : (
//               <AlertCircle className="h-5 w-5" />
//             )}
//             <span>{message.text}</span>
//           </div>
//         )}

//         <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
//           {/* Holiday List - Takes 2/3 width on large screens */}
//           <div className="xl:col-span-2">
//             <Card className="shadow-sm border">
//               <CardHeader className="bg-white border-b">
//                 <CardTitle className="flex items-center gap-2 text-xl text-gray-900">
//                   <Calendar className="h-5 w-5 text-gray-600" />
//                   {editingHoliday ? "Edit Holiday" : `Upcoming Holidays (${holidays.length})`}
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="p-6">
//                 {isLoading ? (
//                   <div className="flex items-center justify-center py-12">
//                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
//                     <span className="ml-2 text-gray-600">Loading holidays...</span>
//                   </div>
//                 ) : holidays.length === 0 ? (
//                   <div className="text-center py-12">
//                     <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
//                     <p className="text-gray-500 text-lg">No holidays found</p>
//                     <p className="text-gray-400">Create your first holiday using the form</p>
//                   </div>
//                 ) : (
//                   <div className="grid gap-4">
//                     {holidays.map((holiday) => (
//                       <div key={holiday.id} className={`bg-white border rounded-lg p-4 transition-all ${
//                         editingHoliday?.id === holiday.id 
//                           ? 'border-blue-500 ring-2 ring-blue-100' 
//                           : 'border-gray-200 hover:shadow-sm'
//                       }`}>
//                         {editingHoliday?.id === holiday.id ? (
//                           // Edit Form
//                           <form onSubmit={handleUpdateHoliday} className="space-y-4">
//                             <div className="flex items-start justify-between">
//                               <div className="flex-1 space-y-4">
//                                 <div>
//                                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                                     Holiday Name *
//                                   </label>
//                                   <Input
//                                     value={editingHoliday.holiday}
//                                     onChange={(e) => handleEditInputChange('holiday', e.target.value)}
//                                     className={getInputClasses('holiday')}
//                                   />
//                                   {errors.holiday && (
//                                     <p className="text-red-500 text-xs mt-1">{errors.holiday}</p>
//                                   )}
//                                 </div>

//                                 <div className="flex items-center justify-between">
//                                   <Label htmlFor="edit-multi-day" className="text-sm font-medium text-gray-700">
//                                     Multi-day Holiday
//                                   </Label>
//                                   <Switch
//                                     id="edit-multi-day"
//                                     checked={editingHoliday.is_multi_day || false}
//                                     onCheckedChange={(checked) => handleMultiDayToggle(checked, true)}
//                                   />
//                                 </div>

//                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                   <div>
//                                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                                       Start Date *
//                                     </label>
//                                     <Input
//                                       type="date"
//                                       value={editingHoliday.date}
//                                       onChange={(e) => handleEditInputChange('date', e.target.value)}
//                                       className={getInputClasses('date')}
//                                     />
//                                     {errors.date && (
//                                       <p className="text-red-500 text-xs mt-1">{errors.date}</p>
//                                     )}
//                                   </div>

//                                   {editingHoliday.is_multi_day && (
//                                     <div>
//                                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                                         End Date *
//                                       </label>
//                                       <Input
//                                         type="date"
//                                         value={editingHoliday.end_date || ''}
//                                         onChange={(e) => handleEditInputChange('end_date', e.target.value)}
//                                         className={getInputClasses('end_date')}
//                                         min={editingHoliday.date}
//                                       />
//                                       {errors.end_date && (
//                                         <p className="text-red-500 text-xs mt-1">{errors.end_date}</p>
//                                       )}
//                                       {editingHoliday.end_date && editingHoliday.date && (
//                                         <p className="text-xs text-green-600 mt-1">
//                                           {calculateDaysCount(editingHoliday.date, editingHoliday.end_date)} days
//                                         </p>
//                                       )}
//                                     </div>
//                                   )}
//                                 </div>

//                                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//                                   <div className="flex items-center space-x-2">
//                                     <Switch
//                                       checked={editingHoliday.is_recurring}
//                                       onCheckedChange={(checked) => handleEditInputChange('is_recurring', checked)}
//                                     />
//                                     <Label className="text-sm">Recurring</Label>
//                                   </div>
//                                   <div className="flex items-center space-x-2">
//                                     <Switch
//                                       checked={editingHoliday.is_full_holiday}
//                                       onCheckedChange={(checked) => handleEditInputChange('is_full_holiday', checked)}
//                                     />
//                                     <Label className="text-sm">Full Day</Label>
//                                   </div>
//                                   <div className="flex items-center space-x-2">
//                                     <Switch
//                                       checked={editingHoliday.is_global}
//                                       onCheckedChange={(checked) => handleEditInputChange('is_global', checked)}
//                                     />
//                                     <Label className="text-sm">Global</Label>
//                                   </div>
//                                 </div>

//                                 {!editingHoliday.is_full_holiday && roles.length > 0 && (
//                                   <div>
//                                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                                       Select Roles
//                                     </label>
//                                     <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-3">
//                                       {roles.map((role) => (
//                                         <div key={role.id} className="flex items-center space-x-2">
//                                           <input
//                                             type="checkbox"
//                                             id={`edit-role-${role.id}`}
//                                             checked={editingHoliday.role_ids.includes(role.id)}
//                                             onChange={() => handleRoleToggle(role.id, true)}
//                                             className="rounded border-gray-300"
//                                           />
//                                           <label htmlFor={`edit-role-${role.id}`} className="text-sm text-gray-700">
//                                             {role.name}
//                                           </label>
//                                         </div>
//                                       ))}
//                                     </div>
//                                   </div>
//                                 )}
//                               </div>
//                             </div>
                            
//                             <div className="flex gap-2 pt-4 border-t">
//                               <Button 
//                                 type="submit"
//                                 disabled={isUpdating}
//                                 className="bg-blue-600 hover:bg-blue-700 text-white"
//                               >
//                                 {isUpdating ? (
//                                   <span className="flex items-center gap-2">
//                                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//                                     Updating...
//                                   </span>
//                                 ) : (
//                                   <span className="flex items-center gap-2">
//                                     <Save className="h-4 w-4" />
//                                     Update Holiday
//                                   </span>
//                                 )}
//                               </Button>
//                               <Button 
//                                 type="button"
//                                 variant="outline"
//                                 onClick={handleCancelEdit}
//                                 disabled={isUpdating}
//                               >
//                                 <X className="h-4 w-4 mr-1" />
//                                 Cancel
//                               </Button>
//                             </div>
//                           </form>
//                         ) : (
//                           // Display Mode
//                           <div className="flex items-start justify-between">
//                             <div className="flex-1">
//                               <div className="flex items-center gap-3 mb-2">
//                                 <h3 className="font-semibold text-lg text-gray-900">{holiday.holiday}</h3>
//                                 <div className="flex gap-1">
//                                   {holiday.end_date && (
//                                     <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
//                                       <CalendarRange className="h-3 w-3 mr-1" />
//                                       Multi-day
//                                     </Badge>
//                                   )}
//                                   {holiday.is_full_holiday && (
//                                     <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
//                                       Full Day
//                                     </Badge>
//                                   )}
//                                   {holiday.is_recurring && (
//                                     <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
//                                       Recurring
//                                     </Badge>
//                                   )}
//                                   {holiday.is_global && (
//                                     <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
//                                       <Globe className="h-3 w-3 mr-1" />
//                                       Global
//                                     </Badge>
//                                   )}
//                                 </div>
//                               </div>
                              
//                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-3">
//                                 <div className="flex items-center gap-2">
//                                   <Calendar className="h-4 w-4 text-gray-500" />
//                                   <span className="text-gray-600">Date:</span>
//                                   <span className="font-medium text-gray-900">
//                                     {holiday.end_date 
//                                       ? formatDateRange(holiday.date, holiday.end_date)
//                                       : formatDate(holiday.date)
//                                     }
//                                   </span>
//                                 </div>
                                
//                                 <div className="flex items-center gap-2">
//                                   <Users className="h-4 w-4 text-gray-500" />
//                                   <span className="text-gray-600">For:</span>
//                                   <span className="font-medium text-gray-900">
//                                     {holiday.is_full_holiday ? "All Employees" : `${holiday.role_ids.length} Role(s)`}
//                                   </span>
//                                 </div>
//                               </div>
//                             </div>
                            
//                             <div className="flex gap-2 ml-4">
//                               <Button 
//                                 variant="outline" 
//                                 size="sm" 
//                                 className="h-8 w-8 p-0 border-gray-300"
//                                 onClick={() => handleEditHoliday(holiday)}
//                               >
//                                 <Edit2 className="h-3 w-3" />
//                               </Button>
//                               <Button 
//                                 variant="outline" 
//                                 size="sm" 
//                                 className="h-8 w-8 p-0 border-gray-300 text-red-600 hover:text-red-700"
//                                 onClick={() => holiday.id && handleDeleteHoliday(holiday.id)}
//                               >
//                                 <Trash2 className="h-3 w-3" />
//                               </Button>
//                             </div>
//                           </div>
//                         )}
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </div>

//           {/* Add Holiday Form - Takes 1/3 width on large screens */}
//           <div className="xl:col-span-1">
//             <Card className="shadow-sm border sticky top-6">
//               <CardHeader className="bg-white border-b">
//                 <CardTitle className="flex items-center gap-2 text-xl text-gray-900">
//                   <Plus className="h-5 w-5 text-gray-600" />
//                   Add Holiday
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="p-6">
//                 <form onSubmit={handleSubmit} className="space-y-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Holiday Name *
//                     </label>
//                     <Input
//                       placeholder="e.g. Christmas Holidays"
//                       value={form.holiday}
//                       onChange={(e) => handleInputChange('holiday', e.target.value)}
//                       className={getInputClasses('holiday')}
//                     />
//                     {errors.holiday && (
//                       <p className="text-red-500 text-xs mt-1">{errors.holiday}</p>
//                     )}
//                   </div>

//                   <div className="flex items-center justify-between">
//                     <Label htmlFor="multi-day" className="text-sm font-medium text-gray-700">
//                       Multi-day Holiday
//                     </Label>
//                     <Switch
//                       id="multi-day"
//                       checked={form.is_multi_day || false}
//                       onCheckedChange={(checked) => handleMultiDayToggle(checked)}
//                     />
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         Start Date *
//                       </label>
//                       <Input
//                         type="date"
//                         value={form.date}
//                         onChange={(e) => handleInputChange('date', e.target.value)}
//                         className={getInputClasses('date')}
//                         min={new Date().toISOString().split('T')[0]}
//                       />
//                       {errors.date && (
//                         <p className="text-red-500 text-xs mt-1">{errors.date}</p>
//                       )}
//                     </div>

//                     {form.is_multi_day && (
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">
//                           End Date *
//                         </label>
//                         <Input
//                           type="date"
//                           value={form.end_date || ''}
//                           onChange={(e) => handleInputChange('end_date', e.target.value)}
//                           className={getInputClasses('end_date')}
//                           min={form.date || new Date().toISOString().split('T')[0]}
//                         />
//                         {errors.end_date && (
//                           <p className="text-red-500 text-xs mt-1">{errors.end_date}</p>
//                         )}
//                         {form.end_date && form.date && (
//                           <p className="text-xs text-green-600 mt-1">
//                             {calculateDaysCount(form.date, form.end_date)} days will be created
//                           </p>
//                         )}
//                       </div>
//                     )}
//                   </div>

//                   <div className="space-y-3">
//                     <div className="flex items-center justify-between">
//                       <Label htmlFor="recurring" className="text-sm font-medium text-gray-700">
//                         Recurring Holiday
//                       </Label>
//                       <Switch
//                         id="recurring"
//                         checked={form.is_recurring}
//                         onCheckedChange={(checked) => handleInputChange('is_recurring', checked)}
//                       />
//                     </div>

//                     <div className="flex items-center justify-between">
//                       <Label htmlFor="full_holiday" className="text-sm font-medium text-gray-700">
//                         Full Day Holiday
//                       </Label>
//                       <Switch
//                         id="full_holiday"
//                         checked={form.is_full_holiday}
//                         onCheckedChange={(checked) => handleInputChange('is_full_holiday', checked)}
//                       />
//                     </div>

//                     <div className="flex items-center justify-between">
//                       <Label htmlFor="global" className="text-sm font-medium text-gray-700">
//                         Global Holiday
//                       </Label>
//                       <Switch
//                         id="global"
//                         checked={form.is_global}
//                         onCheckedChange={(checked) => handleInputChange('is_global', checked)}
//                       />
//                     </div>
//                   </div>

//                   {!form.is_full_holiday && roles.length > 0 && (
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Select Roles
//                       </label>
//                       <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
//                         {roles.map((role) => (
//                           <div key={role.id} className="flex items-center space-x-2">
//                             <input
//                               type="checkbox"
//                               id={`role-${role.id}`}
//                               checked={form.role_ids.includes(role.id)}
//                               onChange={() => handleRoleToggle(role.id)}
//                               className="rounded border-gray-300"
//                             />
//                             <label htmlFor={`role-${role.id}`} className="text-sm text-gray-700">
//                               {role.name}
//                             </label>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   <Button 
//                     type="submit"
//                     disabled={isSubmitting}
//                     className="w-full bg-gray-900 hover:bg-gray-800 text-white"
//                   >
//                     {isSubmitting ? (
//                       <span className="flex items-center gap-2">
//                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//                         {form.is_multi_day ? 'Creating Holidays...' : 'Adding...'}
//                       </span>
//                     ) : (
//                       <span className="flex items-center gap-2">
//                         <Plus className="h-4 w-4" />
//                         {form.is_multi_day ? 'Create Holidays' : 'Add Holiday'}
//                       </span>
//                     )}
//                   </Button>
//                 </form>
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit2, Calendar, Clock, Users, Globe, Plus, AlertCircle, CheckCircle, X, Save, CalendarRange } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Holiday {
  id?: string;
  holiday: string;
  date: string;
  end_date?: string;
  is_recurring: boolean;
  is_full_holiday: boolean;
  is_global: boolean;
  role_ids: string[];
  company_id?: string;
  is_multi_day?: boolean;
}

interface CompanyRole {
  id: string;
  name: string;
}

export default function HolidayPage() {
  const { company } = useAuth();
  const companyId = company?.id;

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [roles, setRoles] = useState<CompanyRole[]>([]);
  const [form, setForm] = useState<Holiday>({
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
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cookieSynced, setCookieSynced] = useState(false);

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

  // Fetch holidays and roles
  const fetchHolidays = async () => {
    if (!companyId) {
      console.log('⏳ No company ID available');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('📅 Fetching holidays for company:', companyId);
      
      const res = await fetch(`/api/settings/holiday`);
      const data = await res.json();
      
      console.log('📡 Holidays API Response:', {
        status: res.status,
        data: data,
        companyIdUsed: companyId
      });

      if (res.ok && data.success) {
        setHolidays(data.data || []);
        setMessage({ type: "success", text: `Loaded ${data.data?.length || 0} holidays` });
      } else {
        setMessage({ type: "error", text: data.message || "Failed to load holidays" });
        setHolidays([]);
      }
    } catch (error) {
      console.error("Failed to load holidays", error);
      setMessage({ type: "error", text: "Network error while loading holidays" });
      setHolidays([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    if (!companyId) return;
    
    try {
      console.log('👥 Fetching roles for company:', companyId);
      
      const res = await fetch(`/api/settings/roles`);
      const data = await res.json();
      
      console.log('📡 Roles API Response:', {
        status: res.status,
        data: data
      });

      if (res.ok) {
        const rolesData = Array.isArray(data) ? data : (data.data || data || []);
        setRoles(rolesData);
        console.log(`✅ Loaded ${rolesData.length} roles`);
      } else {
        console.error("Failed to load roles:", data.error);
        setMessage({ type: "error", text: data.error || "Failed to load roles" });
      }
    } catch (error) {
      console.error("Failed to load roles", error);
      setMessage({ type: "error", text: "Network error while loading roles" });
    }
  };

  useEffect(() => {
    if (companyId && cookieSynced) {
      console.log('🎯 Company ID for API calls:', companyId, 'Cookie synced:', cookieSynced);
      fetchHolidays();
      fetchRoles();
    }
  }, [companyId, cookieSynced]);

  // Validation
  const validateForm = (holidayData: Holiday) => {
    const newErrors: Record<string, string> = {};

    if (!holidayData.holiday.trim()) newErrors.holiday = "Holiday name is required";
    if (!holidayData.date) newErrors.date = "Start date is required";
    
    if (holidayData.is_multi_day) {
      if (!holidayData.end_date) {
        newErrors.end_date = "End date is required for multi-day holidays";
      } else if (new Date(holidayData.end_date) < new Date(holidayData.date)) {
        newErrors.end_date = "End date must be after start date";
      }
    }

    if (!editingHoliday) {
      if (holidayData.date && new Date(holidayData.date) < new Date()) {
        newErrors.date = "Holiday date must be in the future";
      }
      if (holidayData.end_date && new Date(holidayData.end_date) < new Date()) {
        newErrors.end_date = "Holiday end date must be in the future";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Generate date range for multi-day holidays
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

  // Calculate number of days for multi-day holidays
  const calculateDaysCount = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  };

  // Submit new holiday
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm(form)) {
      setMessage({ type: "error", text: "Please fix the errors above" });
      return;
    }

    if (!companyId) {
      setMessage({ type: "error", text: "No company selected" });
      return;
    }

    setIsSubmitting(true);
    try {
      let holidaysToCreate: Holiday[] = [];

      if (form.is_multi_day && form.end_date) {
        const dateRange = generateDateRange(form.date, form.end_date);
        holidaysToCreate = dateRange.map(date => ({
          holiday: form.holiday,
          date: date,
          is_recurring: form.is_recurring,
          is_full_holiday: form.is_full_holiday,
          is_global: form.is_global,
          role_ids: form.is_full_holiday ? [] : form.role_ids,
          company_id: companyId,
          is_multi_day: true,
        }));
      } else {
        holidaysToCreate = [{
          ...form,
          company_id: companyId,
          is_multi_day: false,
        }];
      }

      console.log('🎯 Creating holidays:', {
        companyId: companyId,
        holidaysCount: holidaysToCreate.length,
        holidays: holidaysToCreate
      });

      const createPromises = holidaysToCreate.map(holiday =>
        fetch(`/api/settings/holiday`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(holiday),
        })
      );

      const responses = await Promise.all(createPromises);
      const results = await Promise.all(responses.map(res => res.json()));

      console.log('📡 Holiday creation results:', results);

      const allSuccess = results.every(result => result.success);
      
      if (allSuccess) {
        setForm({
          holiday: "",
          date: "",
          end_date: "",
          is_recurring: false,
          is_full_holiday: true,
          is_global: false,
          role_ids: [],
          is_multi_day: false,
        });
        setErrors({});
        const daysCount = form.is_multi_day && form.end_date ? calculateDaysCount(form.date, form.end_date) : 1;
        setMessage({ 
          type: "success", 
          text: `Successfully created ${daysCount} holiday${daysCount > 1 ? 's' : ''}!` 
        });
        fetchHolidays();
      } else {
        setMessage({ type: "error", text: "Failed to create some holidays" });
      }
    } catch (err) {
      console.error("Error submitting holiday", err);
      setMessage({ type: "error", text: "Network error while adding holiday" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update existing holiday
  const handleUpdateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingHoliday || !editingHoliday.id) {
      setMessage({ type: "error", text: "No holiday selected for editing" });
      return;
    }

    if (!validateForm(editingHoliday)) {
      setMessage({ type: "error", text: "Please fix the errors above" });
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/settings/holiday`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: editingHoliday.id,
          holiday: editingHoliday.holiday,
          date: editingHoliday.date,
          end_date: editingHoliday.end_date,
          is_recurring: editingHoliday.is_recurring,
          is_full_holiday: editingHoliday.is_full_holiday,
          is_global: editingHoliday.is_global,
          role_ids: editingHoliday.is_full_holiday ? [] : editingHoliday.role_ids,
          is_multi_day: editingHoliday.is_multi_day,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ type: "success", text: "Holiday updated successfully!" });
        setEditingHoliday(null);
        fetchHolidays();
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update holiday" });
      }
    } catch (err) {
      console.error("Error updating holiday", err);
      setMessage({ type: "error", text: "Network error while updating holiday" });
    } finally {
      setIsUpdating(false);
    }
  };

  // Start editing a holiday
  const handleEditHoliday = (holiday: Holiday) => {
    setEditingHoliday({ 
      ...holiday,
      is_multi_day: holiday.end_date ? true : false 
    });
    setErrors({});
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingHoliday(null);
    setErrors({});
  };

  // Update editing holiday form
  const handleEditInputChange = (field: keyof Holiday, value: any) => {
    if (editingHoliday) {
      setEditingHoliday({ ...editingHoliday, [field]: value });
      if (errors[field]) {
        setErrors({ ...errors, [field]: "" });
      }
    }
  };

  // Update new holiday form
  const handleInputChange = (field: keyof Holiday, value: any) => {
    setForm({ ...form, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  // Toggle multi-day holiday
  const handleMultiDayToggle = (checked: boolean, isEditing: boolean = false) => {
    if (isEditing && editingHoliday) {
      setEditingHoliday({ 
        ...editingHoliday, 
        is_multi_day: checked,
        end_date: checked ? editingHoliday.end_date || "" : ""
      });
    } else {
      setForm({ 
        ...form, 
        is_multi_day: checked,
        end_date: checked ? form.end_date || "" : ""
      });
    }
  };

  const handleRoleToggle = (roleId: string, isEditing: boolean = false) => {
    if (isEditing && editingHoliday) {
      const newRoleIds = editingHoliday.role_ids.includes(roleId)
        ? editingHoliday.role_ids.filter(id => id !== roleId)
        : [...editingHoliday.role_ids, roleId];
      setEditingHoliday({ ...editingHoliday, role_ids: newRoleIds });
    } else {
      const newRoleIds = form.role_ids.includes(roleId)
        ? form.role_ids.filter(id => id !== roleId)
        : [...form.role_ids, roleId];
      setForm({ ...form, role_ids: newRoleIds });
    }
  };

  const handleDeleteHoliday = async (holidayId: string) => {
    if (!confirm("Are you sure you want to delete this holiday?")) return;

    try {
      const res = await fetch(`/api/settings/holiday`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: holidayId }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ type: "success", text: "Holiday deleted successfully!" });
        if (editingHoliday?.id === holidayId) {
          setEditingHoliday(null);
        }
        fetchHolidays();
      } else {
        setMessage({ type: "error", text: data.message || "Failed to delete holiday" });
      }
    } catch (err) {
      console.error("Error deleting holiday", err);
      setMessage({ type: "error", text: "Network error while deleting holiday" });
    }
  };

  const getInputClasses = (fieldName: string) =>
    `transition-colors ${
      errors[fieldName]
        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
        : "border-gray-300 focus:border-gray-500 focus:ring-gray-200"
    }`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysCount = calculateDaysCount(startDate, endDate);
    
    return `${formatDate(startDate)} to ${formatDate(endDate)} (${daysCount} days)`;
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading holidays...</p>
        </div>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Company Selected</h2>
          <p className="text-gray-600">Please select a company to manage holidays.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-8 w-8 text-gray-700" />
            Holiday Management
          </h1>
          <p className="text-gray-600 mt-2">Manage company holidays and time off</p>
          {/* <div className="text-sm text-gray-500 mt-1">
            Company ID: {companyId} | Company Name: {company?.name || 'Unknown'} | 
            Cookie Synced: {cookieSynced ? '✅ Yes' : '⏳ No'}
          </div> */}
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-400 text-green-700' 
              : 'bg-red-50 border-red-400 text-red-700'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {!cookieSynced && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-700">Syncing company settings...</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Holiday List - Takes 2/3 width on large screens */}
          <div className="xl:col-span-2">
            <Card className="shadow-sm border">
              <CardHeader className="bg-white border-b">
                <CardTitle className="flex items-center gap-2 text-xl text-gray-900">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  {editingHoliday ? "Edit Holiday" : `Upcoming Holidays (${holidays.length})`}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {holidays.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No holidays found</p>
                    <p className="text-gray-400">Create your first holiday using the form</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {holidays.map((holiday) => (
                      <div key={holiday.id} className={`bg-white border rounded-lg p-4 transition-all ${
                        editingHoliday?.id === holiday.id 
                          ? 'border-blue-500 ring-2 ring-blue-100' 
                          : 'border-gray-200 hover:shadow-sm'
                      }`}>
                        {editingHoliday?.id === holiday.id ? (
                          // Edit Form
                          <form onSubmit={handleUpdateHoliday} className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Holiday Name *
                                  </label>
                                  <Input
                                    value={editingHoliday.holiday}
                                    onChange={(e) => handleEditInputChange('holiday', e.target.value)}
                                    className={getInputClasses('holiday')}
                                  />
                                  {errors.holiday && (
                                    <p className="text-red-500 text-xs mt-1">{errors.holiday}</p>
                                  )}
                                </div>

                                <div className="flex items-center justify-between">
                                  <Label htmlFor="edit-multi-day" className="text-sm font-medium text-gray-700">
                                    Multi-day Holiday
                                  </Label>
                                  <Switch
                                    id="edit-multi-day"
                                    checked={editingHoliday.is_multi_day || false}
                                    onCheckedChange={(checked) => handleMultiDayToggle(checked, true)}
                                  />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Start Date *
                                    </label>
                                    <Input
                                      type="date"
                                      value={editingHoliday.date}
                                      onChange={(e) => handleEditInputChange('date', e.target.value)}
                                      className={getInputClasses('date')}
                                    />
                                    {errors.date && (
                                      <p className="text-red-500 text-xs mt-1">{errors.date}</p>
                                    )}
                                  </div>

                                  {editingHoliday.is_multi_day && (
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        End Date *
                                      </label>
                                      <Input
                                        type="date"
                                        value={editingHoliday.end_date || ''}
                                        onChange={(e) => handleEditInputChange('end_date', e.target.value)}
                                        className={getInputClasses('end_date')}
                                        min={editingHoliday.date}
                                      />
                                      {errors.end_date && (
                                        <p className="text-red-500 text-xs mt-1">{errors.end_date}</p>
                                      )}
                                      {editingHoliday.end_date && editingHoliday.date && (
                                        <p className="text-xs text-green-600 mt-1">
                                          {calculateDaysCount(editingHoliday.date, editingHoliday.end_date)} days
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      checked={editingHoliday.is_recurring}
                                      onCheckedChange={(checked) => handleEditInputChange('is_recurring', checked)}
                                    />
                                    <Label className="text-sm">Recurring</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      checked={editingHoliday.is_full_holiday}
                                      onCheckedChange={(checked) => handleEditInputChange('is_full_holiday', checked)}
                                    />
                                    <Label className="text-sm">Full Day</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      checked={editingHoliday.is_global}
                                      onCheckedChange={(checked) => handleEditInputChange('is_global', checked)}
                                    />
                                    <Label className="text-sm">Global</Label>
                                  </div>
                                </div>

                                {!editingHoliday.is_full_holiday && roles.length > 0 && (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Select Roles
                                    </label>
                                    <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-3">
                                      {roles.map((role) => (
                                        <div key={role.id} className="flex items-center space-x-2">
                                          <input
                                            type="checkbox"
                                            id={`edit-role-${role.id}`}
                                            checked={editingHoliday.role_ids.includes(role.id)}
                                            onChange={() => handleRoleToggle(role.id, true)}
                                            className="rounded border-gray-300"
                                          />
                                          <label htmlFor={`edit-role-${role.id}`} className="text-sm text-gray-700">
                                            {role.name}
                                          </label>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex gap-2 pt-4 border-t">
                              <Button 
                                type="submit"
                                disabled={isUpdating}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                {isUpdating ? (
                                  <span className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Updating...
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    Update Holiday
                                  </span>
                                )}
                              </Button>
                              <Button 
                                type="button"
                                variant="outline"
                                onClick={handleCancelEdit}
                                disabled={isUpdating}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </form>
                        ) : (
                          // Display Mode
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg text-gray-900">{holiday.holiday}</h3>
                                <div className="flex gap-1">
                                  {holiday.end_date && (
                                    <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                                      <CalendarRange className="h-3 w-3 mr-1" />
                                      Multi-day
                                    </Badge>
                                  )}
                                  {holiday.is_full_holiday && (
                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                      Full Day
                                    </Badge>
                                  )}
                                  {holiday.is_recurring && (
                                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                      Recurring
                                    </Badge>
                                  )}
                                  {holiday.is_global && (
                                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                                      <Globe className="h-3 w-3 mr-1" />
                                      Global
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-3">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-gray-500" />
                                  <span className="text-gray-600">Date:</span>
                                  <span className="font-medium text-gray-900">
                                    {holiday.end_date 
                                      ? formatDateRange(holiday.date, holiday.end_date)
                                      : formatDate(holiday.date)
                                    }
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-gray-500" />
                                  <span className="text-gray-600">For:</span>
                                  <span className="font-medium text-gray-900">
                                    {holiday.is_full_holiday ? "All Employees" : `${holiday.role_ids.length} Role(s)`}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2 ml-4">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 w-8 p-0 border-gray-300"
                                onClick={() => handleEditHoliday(holiday)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 w-8 p-0 border-gray-300 text-red-600 hover:text-red-700"
                                onClick={() => holiday.id && handleDeleteHoliday(holiday.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Add Holiday Form - Takes 1/3 width on large screens */}
          <div className="xl:col-span-1">
            <Card className="shadow-sm border sticky top-6">
              <CardHeader className="bg-white border-b">
                <CardTitle className="flex items-center gap-2 text-xl text-gray-900">
                  <Plus className="h-5 w-5 text-gray-600" />
                  Add Holiday
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Holiday Name *
                    </label>
                    <Input
                      placeholder="e.g. Christmas Holidays"
                      value={form.holiday}
                      onChange={(e) => handleInputChange('holiday', e.target.value)}
                      className={getInputClasses('holiday')}
                    />
                    {errors.holiday && (
                      <p className="text-red-500 text-xs mt-1">{errors.holiday}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="multi-day" className="text-sm font-medium text-gray-700">
                      Multi-day Holiday
                    </Label>
                    <Switch
                      id="multi-day"
                      checked={form.is_multi_day || false}
                      onCheckedChange={(checked) => handleMultiDayToggle(checked)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date *
                      </label>
                      <Input
                        type="date"
                        value={form.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        className={getInputClasses('date')}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      {errors.date && (
                        <p className="text-red-500 text-xs mt-1">{errors.date}</p>
                      )}
                    </div>

                    {form.is_multi_day && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date *
                        </label>
                        <Input
                          type="date"
                          value={form.end_date || ''}
                          onChange={(e) => handleInputChange('end_date', e.target.value)}
                          className={getInputClasses('end_date')}
                          min={form.date || new Date().toISOString().split('T')[0]}
                        />
                        {errors.end_date && (
                          <p className="text-red-500 text-xs mt-1">{errors.end_date}</p>
                        )}
                        {form.end_date && form.date && (
                          <p className="text-xs text-green-600 mt-1">
                            {calculateDaysCount(form.date, form.end_date)} days will be created
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="recurring" className="text-sm font-medium text-gray-700">
                        Recurring Holiday
                      </Label>
                      <Switch
                        id="recurring"
                        checked={form.is_recurring}
                        onCheckedChange={(checked) => handleInputChange('is_recurring', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="full_holiday" className="text-sm font-medium text-gray-700">
                        Full Day Holiday
                      </Label>
                      <Switch
                        id="full_holiday"
                        checked={form.is_full_holiday}
                        onCheckedChange={(checked) => handleInputChange('is_full_holiday', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="global" className="text-sm font-medium text-gray-700">
                        Global Holiday
                      </Label>
                      <Switch
                        id="global"
                        checked={form.is_global}
                        onCheckedChange={(checked) => handleInputChange('is_global', checked)}
                      />
                    </div>
                  </div>

                  {!form.is_full_holiday && roles.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Roles
                      </label>
                      <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                        {roles.map((role) => (
                          <div key={role.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`role-${role.id}`}
                              checked={form.role_ids.includes(role.id)}
                              onChange={() => handleRoleToggle(role.id)}
                              className="rounded border-gray-300"
                            />
                            <label htmlFor={`role-${role.id}`} className="text-sm text-gray-700">
                              {role.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button 
                    type="submit"
                    disabled={isSubmitting || !cookieSynced}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {form.is_multi_day ? 'Creating Holidays...' : 'Adding...'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        {form.is_multi_day ? 'Create Holidays' : 'Add Holiday'}
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}