// // src/app/dashboard/employees/[id]/page.tsx

// "use client";

// import { useParams } from "next/navigation"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { useState, useEffect } from "react";
// import {
//   Loader,
//   Mail,
//   Phone,
//   UserIcon,
//   MapPin,
//   ArrowLeft,
//   MessageSquare,
//   Home,
//   Pen,
//   AlertTriangle,
//   RefreshCw
// } from "lucide-react"
// import Link from "next/link"
// import { Badge } from "@/components/ui/badge"
// import { useAuth, User } from "@/context/AuthContext"
// import EmployeeBanner from "../EmployeeBanner"
// import { Input } from "@/components/ui/input"
// import { Switch } from "@/components/ui/switch"
// import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
// import { useEmployee } from "@/hooks/employees/useGetEmployee"
// import { toast } from "sonner"
// import { Alert, AlertDescription } from "@/components/ui/alert"
// import CalendarView from "@/components/FullCalendarView";

// export default function EmployeeDetailsPage() {
//   const params = useParams()
//   const employeeId = params.id as string
//   const { company, loading: authLoading } = useAuth()
//   const companyId = company?.id

//   const { data: employee, isLoading, isError, error, refetch } = useEmployee(companyId, employeeId)

//   const [formData, setFormData] = useState<User | null>(null);
//   const [editMode, setEditMode] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
//   const [retryCount, setRetryCount] = useState(0);

//   // Update formData when employee data loads
//   useEffect(() => {
//     if (employee) {
//       setFormData(employee);
//       setRetryCount(0); // Reset retry count on successful load
//     }
//   }, [employee]);

//   // Auto-retry if employee might be inactive
//   useEffect(() => {
//     if (isError && retryCount < 2) {
//       const timer = setTimeout(() => {
//         console.log(`🔄 Retrying employee fetch (attempt ${retryCount + 1})`);
//         refetch();
//         setRetryCount(prev => prev + 1);
//       }, 1000);

//       return () => clearTimeout(timer);
//     }
//   }, [isError, retryCount, refetch]);

//   const handleChange = (field: keyof User, value: any) => {
//     if (formData) {
//       setFormData({ ...formData, [field]: value });
//     }
//   };

//   // const handleSaveAllChanges = async () => {
//   //   if (!formData || !company) {
//   //     toast.error("Missing employee data or company information");
//   //     return;
//   //   }

//   //   setIsSaving(true);

//   //   try {
//   //     const payload = {
//   //       first_name: formData.first_name,
//   //       last_name: formData.last_name,
//   //       email: formData.email,
//   //       mobile: formData.mobile,
//   //       role: formData.role,
//   //       gender: formData.gender,
//   //       group: formData.group,
//   //       is_whatsapp: formData.is_whatsapp,
//   //       is_sms: formData.is_sms,
//   //       is_wfh: formData.is_wfh,
//   //       is_active: formData.is_active, // ✅ This is crucial for reactivation
//   //       role_id: formData.role_id,
//   //       group_id: formData.group_id,
//   //     };

//   //     console.log("💾 Saving employee data with is_active:", formData.is_active);

//   //     const response = await fetch(`/api/profile/${formData.id}`, {
//   //       method: "PUT",
//   //       headers: {
//   //         "Content-Type": "application/json",
//   //         "x-company-id": company.id.toString(),
//   //       },
//   //       body: JSON.stringify(payload),
//   //     });

//   //     const result = await response.json();
//   //     console.log("💾 Save response:", result);

//   //     if (result.success) {
//   //       toast.success(
//   //         formData.is_active 
//   //           ? "Employee activated successfully!" 
//   //           : "Employee deactivated successfully!"
//   //       );
//   //       setEditMode(false);

//   //       // Refetch to get updated data
//   //       setTimeout(() => {
//   //         refetch();
//   //       }, 500);
//   //     } else {
//   //       toast.error(result.message || "Failed to update employee profile");
//   //     }
//   //   } catch (error) {
//   //     console.error("Error updating employee profile:", error);
//   //     toast.error("Failed to update employee profile");
//   //   } finally {
//   //     setIsSaving(false);
//   //   }
//   // };


// const handleSaveAllChanges = async () => {
//   if (!formData || !company) {
//     toast.error("Missing employee data or company information");
//     return;
//   }

//   setIsSaving(true);

//   try {
//     const payload = {
//       first_name: formData.first_name,
//       last_name: formData.last_name,
//       email: formData.email,
//       mobile: formData.mobile,
//       role: formData.role,
//       gender: formData.gender,
//       group: formData.group,
//       is_wfh: formData.is_wfh,
//       is_active: formData.is_active,
//       role_id: formData.role_id,
//       group_id: formData.group_id,
//       // ⚠️ WORKAROUND: Include current messaging values to satisfy backend
//       is_whatsapp: formData.is_whatsapp || false,
//       is_sms: formData.is_sms || false,
//     };

//     console.log("💾 Saving with workaround:", payload);

//     const response = await fetch(`/api/profile/${formData.id}`, {
//       method: "PUT",
//       headers: {
//         "Content-Type": "application/json",
//         "x-company-id": company.id.toString(),
//       },
//       body: JSON.stringify(payload),
//     });

//     const result = await response.json();
//     console.log("💾 Save response:", result);

//     if (result.success) {
//       toast.success("Employee updated successfully!");
//       setEditMode(false);

//       // Refetch to get updated data
//       setTimeout(() => {
//         refetch();
//       }, 500);
//     } else {
//       // Check if it's the messaging services error
//       if (result.backendMessage?.includes('Messaging services')) {
//         toast.error("Cannot update while messaging services are disabled. Please contact your administrator.");
//       } else {
//         toast.error(result.message || "Failed to update employee profile");
//       }
//     }
//   } catch (error) {
//     console.error("Error updating employee profile:", error);
//     toast.error("Failed to update employee profile");
//   } finally {
//     setIsSaving(false);
//   }
// };

//   // Manual retry function
//   const handleManualRetry = () => {
//     setRetryCount(0);
//     refetch();
//   };

//   // Show loading state
//   if (authLoading || isLoading) {
//     return (
//       <div className="min-h-screen bg-background flex items-center justify-center">
//         <div className="flex items-center gap-3">
//           <Loader className="animate-spin h-8 w-8 text-blue-500" />
//           <p className="text-lg text-foreground">Loading employee details...</p>
//         </div>
//       </div>
//     )
//   }

//   // Show error state - but provide option to retry for potentially inactive employees
//   if (isError && !formData) {
//     return (
//       <div className="min-h-screen bg-background flex items-center justify-center">
//         <div className="text-center max-w-md">
//           <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
//           <h2 className="text-2xl font-bold text-foreground mb-2">
//             Employee Not Accessible
//           </h2>
//           <p className="text-muted-foreground mb-4">
//             Unable to load employee ID: {employeeId}
//           </p>

//           <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
//             <p className="text-yellow-800 text-sm">
//               This might be because:
//             </p>
//             <ul className="text-yellow-800 text-sm list-disc list-inside mt-2 text-left">
//               <li>The employee is inactive</li>
//               <li>There's a temporary connection issue</li>
//               <li>The employee was recently deactivated</li>
//             </ul>
//           </div>

//           <div className="flex flex-col gap-3">
//             <Button 
//               onClick={handleManualRetry}
//               className="bg-blue-600 hover:bg-blue-700 text-white"
//             >
//               <RefreshCw className="h-4 w-4 mr-2" />
//               Try Loading Again
//             </Button>

//             <Link href="/dashboard/employees">
//               <Button variant="outline" className="w-full">
//                 <ArrowLeft className="h-4 w-4 mr-2" />
//                 Back to Employees List
//               </Button>
//             </Link>
//           </div>
//         </div>
//       </div>
//     )
//   }

//   // If we have employee data (even if inactive), show the details
//   if (!formData) {
//     return (
//       <div className="min-h-screen bg-background flex items-center justify-center">
//         <div className="text-center">
//           <h2 className="text-2xl font-bold text-foreground mb-2">No Employee Data</h2>
//           <Link href="/dashboard/employees">
//             <Button className="bg-blue-600 hover:bg-blue-700 text-white">
//               <ArrowLeft className="h-4 w-4 mr-2" />
//               Back to Employees
//             </Button>
//           </Link>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-background">
//       <div className="max-w-7xl mx-auto px-6 py-6">
//         {/* Inactive Employee Warning */}
//         {!formData.is_active && (
//           <Alert className="mb-6 bg-yellow-50 border-yellow-200">
//             <AlertTriangle className="h-4 w-4 text-yellow-600" />
//             <AlertDescription className="text-yellow-800">
//               <strong>This employee is inactive.</strong> They cannot access the system. 
//               You can reactivate them using the toggle in edit mode.
//             </AlertDescription>
//           </Alert>
//         )}

//         {/* Header with navigation and edit button */}
//         <div className="flex justify-between items-center mb-4">
//           <Link href="/dashboard/employees">
//             <Button variant="outline" size="sm">
//               <ArrowLeft className="h-4 w-4 mr-1" />
//               Back to Employees
//             </Button>
//           </Link>

//           <div className="flex items-center gap-2">
//             {!formData.is_active && (
//               <Badge variant="secondary" className="bg-gray-100 text-gray-700">
//                 Inactive
//               </Badge>
//             )}
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => setEditMode(!editMode)}
//               disabled={isSaving}
//             >
//               <Pen className="h-4 w-4 mr-1" /> 
//               {editMode ? "Cancel" : "Edit"}
//             </Button>
//           </div>
//         </div>

//         {/* Employee Banner */}
//         <EmployeeBanner 
//           employee={formData} 
//           editMode={editMode} 
//           onChange={handleChange}
//         />


//         {/* Other Cards */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
//           {/* Contact Card */}
//           <Card className="border-l-4 border-l-yellow-500">
//             <CardHeader className="pb-3">
//               <CardTitle className="flex items-center gap-2 text-foreground text-lg">
//                 <Mail className="h-4 w-4 text-yellow-600" />
//                 Contact
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-3">
//               <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
//                 <Mail className="h-4 w-4 text-blue-600" />
//                 {editMode ? (
//                   <Input
//                     value={formData.email || ""}
//                     onChange={(e) => handleChange("email", e.target.value)}
//                     placeholder="Email"
//                   />
//                 ) : (
//                   <p className="text-sm font-medium text-foreground">{formData.email || "No email"}</p>
//                 )}
//               </div>
//               <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
//                 <Phone className="h-4 w-4 text-blue-600" />
//                 {editMode ? (
//                   <Input
//                     value={formData.mobile || ""}
//                     onChange={(e) => handleChange("mobile", e.target.value)}
//                     placeholder="Mobile"
//                   />
//                 ) : (
//                   <p className="text-sm font-medium text-foreground">{formData.mobile || "No mobile"}</p>
//                 )}
//               </div>
//             </CardContent>
//           </Card>

//           {/* Personal Card */}
//           <Card className="border-l-4 border-l-blue-500">
//             <CardHeader className="pb-3">
//               <CardTitle className="flex items-center gap-2 text-foreground text-lg">
//                 <UserIcon className="h-4 w-4 text-blue-600" />
//                 Personal
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-3">
//               <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
//                 <UserIcon className="h-4 w-4 text-yellow-600" />
//                 {editMode ? (
//                   <Select
//                     value={formData.gender || ""}
//                     onValueChange={(val) => handleChange("gender", val)}
//                   >
//                     <SelectTrigger>
//                       <SelectValue placeholder="Gender" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="M">Male</SelectItem>
//                       <SelectItem value="F">Female</SelectItem>
//                       <SelectItem value="O">Other</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 ) : (
//                   <p className="text-sm font-medium text-foreground">
//                     {formData.gender_display || (formData.gender === 'M' ? 'Male' : formData.gender === 'F' ? 'Female' : 'Other')}
//                   </p>
//                 )}
//               </div>
//               <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
//                 <MapPin className="h-4 w-4 text-yellow-600" />
//                 {editMode ? (
//                   <Input
//                     value={formData.group || ""}
//                     onChange={(e) => handleChange("group", e.target.value)}
//                     placeholder="Group"
//                   />
//                 ) : (
//                   <p className="text-sm font-medium text-foreground">{formData.group || "No group"}</p>
//                 )}
//               </div>
//             </CardContent>
//           </Card>

//           {/* Preferences Card */}
//           <Card className="border-l-4 border-l-yellow-500">
//             <CardHeader className="pb-3">
//               <CardTitle className="flex items-center gap-2 text-foreground text-lg">
//                 <MessageSquare className="h-4 w-4 text-yellow-600" />
//                 Preferences
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-3">
//               <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
//                 <div className="flex items-center gap-2">
//                   <MessageSquare className="h-4 w-4 text-blue-600" />
//                   <span className="text-sm font-medium text-foreground">WhatsApp</span>
//                 </div>
//                 {editMode ? (
//                   <Switch
//                     checked={formData.is_whatsapp || false}
//                     onCheckedChange={(val) => handleChange("is_whatsapp", val)}
//                   />
//                 ) : (
//                   <Badge variant={formData.is_whatsapp ? "default" : "secondary"}>
//                     {formData.is_whatsapp ? "On" : "Off"}
//                   </Badge>
//                 )}
//               </div>

//               {/* SMS Section */}
//               <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
//                 <div className="flex items-center gap-2">
//                   <MessageSquare className="h-4 w-4 text-blue-600" />
//                   <span className="text-sm font-medium text-foreground">SMS</span>
//                 </div>
//                 {editMode ? (
//                   <Switch
//                     checked={formData.is_sms || false}
//                     onCheckedChange={(val) => handleChange("is_sms", val)}
//                   />
//                 ) : (
//                   <Badge variant={formData.is_sms ? "default" : "secondary"}>
//                     {formData.is_sms ? "On" : "Off"}
//                   </Badge>
//                 )}
//               </div>

//               <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
//                 <div className="flex items-center gap-2">
//                   <Home className="h-4 w-4 text-yellow-600" />
//                   <span className="text-sm font-medium text-foreground">WFH</span>
//                 </div>
//                 {editMode ? (
//                   <Switch
//                     checked={formData.is_wfh || false}
//                     onCheckedChange={(val) => handleChange("is_wfh", val)}
//                   />
//                 ) : (
//                   <Badge variant={formData.is_wfh ? "default" : "secondary"}>
//                     {formData.is_wfh ? "Yes" : "No"}
//                   </Badge>
//                 )}
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Save Button */}
//       {/* Save Button */}
//         {editMode && (
//           <div className="mt-6 flex justify-end gap-3">
//             <Button
//               variant="outline"
//               onClick={() => {
//                 setEditMode(false);
//                 // Reset form data to original employee data
//                 if (employee) {
//                   setFormData(employee);
//                 }
//               }}
//               disabled={isSaving}
//             >
//               Cancel
//             </Button>
//             <Button
//               className="bg-green-600 hover:bg-green-700 text-white"
//               onClick={handleSaveAllChanges}
//               disabled={isSaving}
//             >
//               {isSaving ? "Saving..." : "Save All Changes"}
//             </Button>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

// src/app/dashboard/employees/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import {
  Loader,
  Mail,
  Phone,
  UserIcon,
  UserMinus,
  MapPin,
  ArrowLeft,
  MessageSquare,
  Home,
  Pen,
  AlertTriangle,
  RefreshCw,
  Camera,
  X,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useAuth, User } from "@/context/AuthContext";
import EmployeeBanner from "../EmployeeBanner";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useEmployee } from "@/hooks/employees/useGetEmployee";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// ============================================
// TYPES – matches the actual API response
// ============================================
interface EmployeeFullProfile {
  employee_id: number;
  dob?: string | null;
  guardian_name?: string | null;
  guardian_phone?: string | null;
  religion_id?: number | null;
  caste_id?: number | null;
  staff_type_id?: number | null;
  staff_category_id?: number | null;
  ktu_id?: string | null;
  aicte_id?: string | null;
  pan_no?: string | null;
  aadhar_no?: string | null;
  blood_group?: string | null;
  alternate_mobile?: string | null;
  alternate_email?: string | null;
  present_address?: {
    address_line_1?: string | null;
    address_line_2?: string | null;
    city?: string | null;
    district?: string | null;
    state?: string | null;
    country?: string | null;
    pincode?: string | null;
  };
  permanent_address?: {
    address_line_1?: string | null;
    address_line_2?: string | null;
    city?: string | null;
    district?: string | null;
    state?: string | null;
    country?: string | null;
    pincode?: string | null;
  };
}

interface Group {
  id: number;
  group?: string;
  name?: string;
  group_name?: string;
  short_name?: string;
}

export default function EmployeeDetailsPage() {
  const params = useParams();
  const employeeId = params.id as string;
  const { company, loading: authLoading } = useAuth();
  const companyId = company?.id;

  const {
    data: employee,
    isLoading,
    isError,
    error,
    refetch,
  } = useEmployee(companyId, employeeId);

  // Basic employee data (used for editing)
  const [formData, setFormData] = useState<User | null>(null);
  // Extended profile data (read‑only for display)
  const [fullProfile, setFullProfile] = useState<EmployeeFullProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mobile validation state
  const [mobileError, setMobileError] = useState("");

  // Update formData when employee data loads
  useEffect(() => {
    if (employee) {
      setFormData(employee);
      setRetryCount(0);
      setMobileError("");
    }
  }, [employee]);

  // Fetch extended profile data from /api/employee-profile
  useEffect(() => {
    if (!employeeId) return;

    const fetchProfile = async () => {
      setProfileLoading(true);
      try {
        const res = await fetch(`/api/employee-profile?employee_id=${employeeId}`, {
          cache: "no-store",
        });
        const result = await res.json();
        console.log("📦 Full profile API response:", result);

        if (res.ok && result) {
          // The API might return { success: true, data: {...} } or the raw object.
          // Adapt based on your actual backend.
          if (result.success && result.data) {
            setFullProfile(result.data);
          } else if (result.employee_id) {
            setFullProfile(result);
          } else {
            setFullProfile(null);
          }
        } else {
          console.warn("Profile fetch failed:", result);
          setFullProfile(null);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setFullProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [employeeId]);

  // Fetch groups and roles when modal opens
  useEffect(() => {
    if (isEditModalOpen && companyId) {
      fetchGroups();
      fetchRoles();
    }
  }, [isEditModalOpen, companyId]);

  const fetchGroups = async () => {
    if (!companyId) return;
    setLoadingGroups(true);
    try {
      const response = await fetch(`/api/settings/groups/${companyId}`);
      if (!response.ok) throw new Error("Failed to fetch groups");
      const result = await response.json();
      let groupsArray: Group[] = [];
      if (Array.isArray(result)) groupsArray = result;
      else if (result.success && Array.isArray(result.data)) groupsArray = result.data;
      else if (Array.isArray(result.data)) groupsArray = result.data;
      else if (result.groups) groupsArray = result.groups;

      const validGroups = groupsArray.filter((group) => {
        const groupId = group.id?.toString()?.trim();
        const groupName = (group.group || group.name || group.group_name || "").trim();
        return groupId && groupId !== "" && groupName !== "";
      });
      setGroups(validGroups);
    } catch (err) {
      console.error("Error fetching groups:", err);
      setGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  const fetchRoles = async () => {
    if (!companyId) return;
    setLoadingRoles(true);
    try {
      const response = await fetch(`/api/settings/roles/${companyId}`);
      if (!response.ok) throw new Error("Failed to fetch roles");
      const result = await response.json();
      let rolesArray: any[] = [];
      if (Array.isArray(result)) rolesArray = result;
      else if (result.success && Array.isArray(result.data)) rolesArray = result.data;
      else if (Array.isArray(result.data)) rolesArray = result.data;
      else if (result.roles) rolesArray = result.roles;
      setRoles(rolesArray);
    } catch (err) {
      console.error("Error fetching roles:", err);
      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  };

  // Auto‑retry on error
  useEffect(() => {
    if (isError && retryCount < 2) {
      const timer = setTimeout(() => {
        refetch();
        setRetryCount((prev) => prev + 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isError, retryCount, refetch]);

  const validateMobile = (mobile: string): boolean => {
    if (!mobile) {
      setMobileError("Mobile number is required");
      return false;
    }
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(mobile)) {
      setMobileError("Mobile number must be exactly 10 digits");
      return false;
    }
    setMobileError("");
    return true;
  };

  const handleChange = (field: keyof User, value: any) => {
    setFormData((prev) => {
      if (!prev) return null;
      if (field === "mobile") validateMobile(value);
      return { ...prev, [field]: value };
    });
  };

  const handleGroupChange = (groupId: string) => {
    if (formData) {
      if (groupId === "none") {
        setFormData({ ...formData, group_id: undefined, group: "" });
      } else {
        const selectedGroup = groups.find((group) => group.id.toString() === groupId);
        if (selectedGroup) {
          const groupName =
            selectedGroup.group || selectedGroup.name || selectedGroup.group_name || "";
          setFormData({ ...formData, group_id: Number(groupId), group: groupName });
        }
      }
    }
  };

  const handleRoleChange = (roleId: string) => {
    if (formData) {
      if (roleId === "none") {
        handleChange("role_id", undefined);
        handleChange("role", "");
      } else {
        const selected = roles.find((r) => r.id.toString() === roleId);
        if (selected) {
          handleChange("role_id", Number(roleId));
          handleChange("role", selected.role || selected.name || "");
        }
      }
    }
  };

  const getGroupDisplayName = (group: Group) => {
    return group.group || group.name || group.group_name || `Group ${group.id}`;
  };

  const handleSaveAllChanges = async () => {
    if (!formData || !company) {
      toast.error("Missing employee data or company information");
      return;
    }

    if (!validateMobile(formData.mobile)) {
      toast.error(mobileError || "Please enter a valid 10-digit mobile number");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        mobile: formData.mobile,
        role: formData.role,
        gender: formData.gender,
        group: formData.group,
        is_wfh: formData.is_wfh,
        is_active: formData.is_active,
        role_id: formData.role_id,
        group_id: formData.group_id,
        is_whatsapp: formData.is_whatsapp || false,
        is_sms: formData.is_sms || false,
        ...(formData.prof_img && { prof_img: formData.prof_img }),
      };

      const response = await fetch(`/api/profile/${formData.id}?_t=${Date.now()}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-company-id": company.id.toString(),
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Employee updated successfully!");
        setIsEditModalOpen(false);
        if (result.data) {
          const updatedEmployee = {
            ...formData,
            ...result.data,
            gender_display:
              result.data.gender === "M"
                ? "Male"
                : result.data.gender === "F"
                ? "Female"
                : "Other",
          };
          setFormData(updatedEmployee);
        }
        setTimeout(() => refetch(), 1000);
      } else {
        toast.error(result.message || "Failed to update employee profile");
      }
    } catch (error) {
      console.error("Error updating employee profile:", error);
      toast.error("Failed to update employee profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualRetry = () => {
    setRetryCount(0);
    refetch();
  };

  // Combined loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader className="animate-spin h-8 w-8 text-blue-500" />
          <p className="text-lg text-foreground">Loading employee details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError && !formData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Employee Not Accessible
          </h2>
          <p className="text-muted-foreground mb-4">
            Unable to load employee ID: {employeeId}
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-sm">This might be because:</p>
            <ul className="text-yellow-800 text-sm list-disc list-inside mt-2 text-left">
              <li>The employee is inactive</li>
              <li>There's a temporary connection issue</li>
              <li>The employee was recently deactivated</li>
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <Button onClick={handleManualRetry} className="bg-blue-600 hover:bg-blue-700 text-white">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Loading Again
            </Button>
            <Link href="/dashboard/employees">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Employees List
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">No Employee Data</h2>
          <Link href="/dashboard/employees">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Employees
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER MAIN PAGE WITH ALL SECTIONS
  // ============================================
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Inactive Warning */}
        {!formData.is_active && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>This employee is inactive.</strong> They cannot access the system.
              You can reactivate them using the toggle in edit mode.
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <Link href="/dashboard/employees">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Employees
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {!formData.is_active && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                Inactive
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)} disabled={isSaving}>
              <Pen className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        </div>

        {/* Employee Banner */}
        <EmployeeBanner employee={formData} editMode={false} onChange={() => {}} />

        {/* Three basic cards: Contact, Personal, Preferences */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* Contact Card */}
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                <Mail className="h-4 w-4 text-yellow-600" />
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <Mail className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium text-foreground">{formData.email || "No email"}</p>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <Phone className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium text-foreground">{formData.mobile || "No mobile"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Personal (basic) Card */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                <UserIcon className="h-4 w-4 text-blue-600" />
                Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <UserIcon className="h-4 w-4 text-yellow-600" />
                <p className="text-sm font-medium text-foreground">
                  {formData.gender_display ||
                    (formData.gender === "M" ? "Male" : formData.gender === "F" ? "Female" : "Other")}
                </p>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <MapPin className="h-4 w-4 text-yellow-600" />
                <p className="text-sm font-medium text-foreground">
                  {formData.group || "No group assigned"}
                  {formData.group_id && <span className="text-xs text-gray-500 ml-2">(ID: {formData.group_id})</span>}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Preferences Card */}
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                <MessageSquare className="h-4 w-4 text-yellow-600" />
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-foreground">WhatsApp</span>
                </div>
                <Badge variant={formData.is_whatsapp ? "default" : "secondary"}>
                  {formData.is_whatsapp ? "On" : "Off"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-foreground">SMS</span>
                </div>
                <Badge variant={formData.is_sms ? "default" : "secondary"}>
                  {formData.is_sms ? "On" : "Off"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-foreground">WFH</span>
                </div>
                <Badge variant={formData.is_wfh ? "default" : "secondary"}>
                  {formData.is_wfh ? "Yes" : "No"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ============================================ */}
        {/* EXTENDED PROFILE SECTION (from /api/employee-profile) */}
        {/* ============================================ */}
        {profileLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="animate-spin h-6 w-6 text-blue-500" />
            <span className="ml-2 text-muted-foreground">Loading profile details...</span>
          </div>
        ) : (
          <>
            {/* Personal Details + Emergency & IDs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Personal Details Card */}
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                    <UserIcon className="h-4 w-4 text-green-600" />
                    Personal Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Date of Birth</p>
                      <p className="text-sm font-medium">{fullProfile?.dob || "—"}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Guardian Name</p>
                      <p className="text-sm font-medium">{fullProfile?.guardian_name || "—"}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Guardian Phone</p>
                      <p className="text-sm font-medium">{fullProfile?.guardian_phone || "—"}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Blood Group</p>
                      <p className="text-sm font-medium">{fullProfile?.blood_group || "—"}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Religion ID</p>
                      <p className="text-sm font-medium">{fullProfile?.religion_id ?? "—"}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Caste ID</p>
                      <p className="text-sm font-medium">{fullProfile?.caste_id ?? "—"}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Staff Type ID</p>
                      <p className="text-sm font-medium">{fullProfile?.staff_type_id ?? "—"}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Staff Category ID</p>
                      <p className="text-sm font-medium">{fullProfile?.staff_category_id ?? "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Other Details Card */}
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                    <Phone className="h-4 w-4 text-purple-600" />
                   Other Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Alternate Mobile</p>
                      <p className="text-sm font-medium">{fullProfile?.alternate_mobile || "—"}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Alternate Email</p>
                      <p className="text-sm font-medium">{fullProfile?.alternate_email || "—"}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">PAN</p>
                      <p className="text-sm font-medium">{fullProfile?.pan_no || "—"}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Aadhaar</p>
                      <p className="text-sm font-medium">{fullProfile?.aadhar_no || "—"}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">KTU ID</p>
                      <p className="text-sm font-medium">{fullProfile?.ktu_id || "—"}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">AICTE ID</p>
                      <p className="text-sm font-medium">{fullProfile?.aicte_id || "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Addresses Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Present Address */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                    <Home className="h-4 w-4 text-blue-600" />
                    Present Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {fullProfile?.present_address ? (
                    <div className="space-y-1 text-sm">
                      <p>{fullProfile.present_address.address_line_1}</p>
                      {fullProfile.present_address.address_line_2 && <p>{fullProfile.present_address.address_line_2}</p>}
                      <p>
                        {fullProfile.present_address.city}, {fullProfile.present_address.district}
                      </p>
                      <p>
                        {fullProfile.present_address.state}, {fullProfile.present_address.country}
                      </p>
                      <p>Pincode: {fullProfile.present_address.pincode}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not provided</p>
                  )}
                </CardContent>
              </Card>

              {/* Permanent Address */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    Permanent Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {fullProfile?.permanent_address ? (
                    <div className="space-y-1 text-sm">
                      <p>{fullProfile.permanent_address.address_line_1}</p>
                      {fullProfile.permanent_address.address_line_2 && <p>{fullProfile.permanent_address.address_line_2}</p>}
                      <p>
                        {fullProfile.permanent_address.city}, {fullProfile.permanent_address.district}
                      </p>
                      <p>
                        {fullProfile.permanent_address.state}, {fullProfile.permanent_address.country}
                      </p>
                      <p>Pincode: {fullProfile.permanent_address.pincode}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not provided</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
              <DialogDescription>
                Update employee details below. Click save when done.
              </DialogDescription>
            </DialogHeader>

            {formData && (
              <div className="space-y-5 py-2">
                {/* Profile Image & Personal Info */}
                <div className="space-y-4">
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <div
                        title="Change Photo"
                        className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 overflow-hidden bg-gray-50 dark:bg-gray-800"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {formData.prof_img ? (
                          <div className="relative w-full h-full group">
                            <img
                              src={
                                formData.prof_img.startsWith("http") || formData.prof_img.startsWith("data:")
                                  ? formData.prof_img
                                  : company?.mediaBaseUrl
                                  ? `${company.mediaBaseUrl}${formData.prof_img}`
                                  : formData.prof_img
                              }
                              alt="Profile preview"
                              className="w-full h-full rounded-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full flex items-center justify-center">
                              <Camera className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center p-2">
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full mb-1">
                              <Upload className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            </div>
                            <p className="text-[11px] font-medium text-gray-700 dark:text-gray-300">Upload Photo</p>
                          </div>
                        )}
                      </div>
                      {formData.prof_img && (
                        <button
                          type="button"
                          title="Remove Photo"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChange("prof_img", "");
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="cursor-pointer absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors z-10 shadow-sm"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          handleChange("prof_img", reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="md:col-span-3">
                      <Input
                        value={formData.first_name || ""}
                        onChange={(e) => handleChange("first_name", e.target.value)}
                        placeholder="First Name *"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Input
                        value={formData.last_name || ""}
                        onChange={(e) => handleChange("last_name", e.target.value)}
                        placeholder="Last Name *"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Input
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="Email *"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Input
                        value={formData.mobile || ""}
                        onChange={(e) => handleChange("mobile", e.target.value)}
                        placeholder="Mobile *"
                        maxLength={10}
                        pattern="\d*"
                        className={mobileError ? "border-red-500" : ""}
                      />
                      {mobileError && <p className="text-red-500 text-xs mt-1">{mobileError}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <Select
                        value={formData.gender || ""}
                        onValueChange={(val) => handleChange("gender", val)}
                      >
                        <SelectTrigger className="w-full bg-white dark:bg-gray-800">
                          <SelectValue placeholder="Select Gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                          <SelectItem value="O">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2">
                      <Select
                        value={formData.role_id?.toString() || "none"}
                        onValueChange={handleRoleChange}
                        disabled={loadingRoles}
                      >
                        <SelectTrigger className="w-full bg-white dark:bg-gray-800">
                          <SelectValue placeholder={loadingRoles ? "Loading roles..." : "Select Role"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Role</SelectItem>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id?.toString() || ""}>
                              {role.role || role.name || `Role ${role.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2">
                      <Select
                        value={formData.group_id?.toString() || "none"}
                        onValueChange={handleGroupChange}
                        disabled={loadingGroups}
                      >
                        <SelectTrigger className="w-full bg-white dark:bg-gray-800">
                          <SelectValue placeholder={loadingGroups ? "Loading groups..." : "Select Group"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Group</SelectItem>
                          {groups.map((group) => (
                            <SelectItem key={group.id} value={group.id?.toString() || ""}>
                              {getGroupDisplayName(group)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border w-full" />

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-800 rounded-lg border gap-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-1.5 rounded-full flex-shrink-0 ${
                          formData.is_active ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"
                        }`}
                      >
                        {formData.is_active ? (
                          <UserIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <UserMinus className="h-4 w-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium leading-none">Employee Status</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {formData.is_active
                            ? "Active employees can log in and use the system"
                            : "Inactive employees cannot log in"}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.is_active || false}
                      onCheckedChange={(val) => handleChange("is_active", val)}
                      className={
                        formData.is_active
                          ? "data-[state=checked]:bg-black"
                          : "data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-center justify-between p-3 rounded border bg-white dark:bg-gray-800">
                      <label htmlFor="is_whatsapp" className="text-[13px] font-medium cursor-pointer select-none">
                        WhatsApp
                      </label>
                      <Switch
                        id="is_whatsapp"
                        checked={formData.is_whatsapp || false}
                        onCheckedChange={(val) => handleChange("is_whatsapp", val)}
                        className={
                          formData.is_whatsapp
                            ? "data-[state=checked]:bg-black"
                            : "data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded border bg-white dark:bg-gray-800">
                      <label htmlFor="is_sms" className="text-[13px] font-medium cursor-pointer select-none">
                        SMS
                      </label>
                      <Switch
                        id="is_sms"
                        checked={formData.is_sms || false}
                        onCheckedChange={(val) => handleChange("is_sms", val)}
                        className={
                          formData.is_sms
                            ? "data-[state=checked]:bg-black"
                            : "data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded border bg-white dark:bg-gray-800">
                      <label htmlFor="is_wfh" className="text-[13px] font-medium cursor-pointer select-none">
                        WFH
                      </label>
                      <Switch
                        id="is_wfh"
                        checked={formData.is_wfh || false}
                        onCheckedChange={(val) => handleChange("is_wfh", val)}
                        className={
                          formData.is_wfh
                            ? "data-[state=checked]:bg-black"
                            : "data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="h-px bg-border w-full mt-1" />

            <DialogFooter className="pt-1">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAllChanges} disabled={isSaving} className="text-white min-w-[140px]">
                {isSaving ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Pen className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}