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
  Loader, Mail, Phone, UserIcon, UserMinus, MapPin, ArrowLeft,
  MessageSquare, Home, Pen, AlertTriangle, RefreshCw, Camera, X, Upload,
  Edit, Save, Plus
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useAuth, User } from "@/context/AuthContext";
import EmployeeBanner from "../EmployeeBanner";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useEmployee } from "@/hooks/employees/useGetEmployee";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";


interface AddressDetails {
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
}

interface EmployeeFullProfile {
  id: number;
  user: number;
  dob?: string | null;
  guardian_name?: string | null;
  guardian_phone?: string | null;
  religion_name?: string | null;
  caste_name?: string | null;
  staff_type?: string | null;
  staff_category?: string | null;
  ktu_id?: string | null;
  aicte_id?: string | null;
  pan_no?: string | null;
  aadhar_no?: string | null;
  blood_group?: string | null;
  alternate_mobile?: string | null;
  alternate_email?: string | null;
  present_address_details?: AddressDetails;
  permanent_address_details?: AddressDetails;
}


interface EditableProfile {
  id: number;
  user: number;
  dob: string | null;
  guardian_name: string;
  guardian_phone: string;
  religion_id: number | null;
  caste_id: number | null;
  staff_type_id: number | null;
  staff_category_id: number | null;
  ktu_id: string;
  aicte_id: string;
  pan_no: string;
  aadhar_no: string;
  blood_group: string;
  alternate_mobile: string;
  alternate_email: string;
  present_address_details: AddressDetails;
  permanent_address_details: AddressDetails;
}

interface Group {
  id: number;
  group?: string;
  name?: string;
  group_name?: string;
}

interface LookupItem {
  id: number;
  name: string;
}


export default function EmployeeDetailsPage() {
  const params = useParams();
  const employeeId = params.id as string;
  const { company, loading: authLoading } = useAuth();
  const companyId = company?.id;


  const { data: employee, isLoading, isError, refetch } = useEmployee(companyId, employeeId);
  const [formData, setFormData] = useState<User | null>(null);
  const [mobileError, setMobileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

 
  const [fullProfile, setFullProfile] = useState<EmployeeFullProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  
  const [staffTypes, setStaffTypes] = useState<LookupItem[]>([]);
  const [staffCategories, setStaffCategories] = useState<LookupItem[]>([]);
  const [religions, setReligions] = useState<LookupItem[]>([]);
  const [castes, setCastes] = useState<LookupItem[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);

  
  const [editProfileData, setEditProfileData] = useState<EditableProfile | null>(null);

  
  useEffect(() => {
    if (employee) {
      setFormData(employee);
      setRetryCount(0);
      setMobileError("");
    }
  }, [employee]);

  
  const fetchProfile = async () => {
    if (!employeeId) return;
    setProfileLoading(true);
    try {
      const res = await fetch(`/api/employee-profile?employee_id=${employeeId}`, { cache: "no-store" });
      if (res.status === 404) {
        // No profile exists – leave fullProfile as null
        setFullProfile(null);
      } else if (res.ok) {
        const result = await res.json();
        if (result?.success && result?.data) {
          setFullProfile(result.data);
        } else {
          setFullProfile(null);
        }
      } else {
        setFullProfile(null);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setFullProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [employeeId]);

  // ---------- Create empty profile with placeholder values for required address fields ----------
 const createEmptyProfile = async () => {
  if (!employeeId || !companyId) return;
  setProfileLoading(true);
  try {
    const payload = {
      employee_id: Number(employeeId),
      company_id: companyId,
      dob: "1900-01-01",                    // valid dummy date (not null/empty)
      guardian_name: "",
      guardian_phone: "",
      religion_id: null,
      caste_id: null,
      staff_type_id: null,
      staff_category_id: null,
      ktu_id: "",
      aicte_id: "",
      pan_no: "",
      aadhar_no: "",
      blood_group: "",
      alternate_mobile: "",
      alternate_email: "",
      present_address: {
        address_line_1: "Not provided",
        address_line_2: "",
        city: "Not provided",
        district: "Not provided",
        state: "Not provided",
        country: "Not provided",
        pincode: "000000",
      },
      permanent_address: {
        address_line_1: "Not provided",
        address_line_2: "",
        city: "Not provided",
        district: "Not provided",
        state: "Not provided",
        country: "Not provided",
        pincode: "000000",
      },
    };

    const response = await fetch("/api/employee-profile/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Log full response for debugging
    const responseText = await response.text();
    console.log("Profile creation response status:", response.status);
    console.log("Profile creation response text:", responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { raw: responseText };
    }

    if (!response.ok) {
      const errorMsg = result.message || result.error || result.raw || "Failed to create profile";
      throw new Error(errorMsg);
    }

    toast.success("Profile created. You can now edit it.");
    await fetchProfile();
  } catch (error: any) {
    console.error("Create profile error:", error);
    toast.error(error.message || "Could not create profile.");
  } finally {
    setProfileLoading(false);
  }
};


  useEffect(() => {
    if (!companyId) return;

    
    fetch(`/api/settings/staff_type/${companyId}`)
      .then(res => res.json())
      .then(data => {
        let items = [];
        if (Array.isArray(data)) items = data;
        else if (data.types && Array.isArray(data.types)) items = data.types;
        else if (data.results && Array.isArray(data.results)) items = data.results;
        else if (data.data && Array.isArray(data.data)) items = data.data;
        else items = [];
        setStaffTypes(items.map((st: any) => ({ id: st.id, name: st.type_name || st.name })));
      })
      .catch(console.error);

    
    fetch(`/api/settings/staff_category/${companyId}`)
      .then(res => res.json())
      .then(data => {
        let items = [];
        if (Array.isArray(data)) items = data;
        else if (data.categories && Array.isArray(data.categories)) items = data.categories;
        else if (data.results && Array.isArray(data.results)) items = data.results;
        else if (data.data && Array.isArray(data.data)) items = data.data;
        else items = [];
        setStaffCategories(items.map((sc: any) => ({ id: sc.id, name: sc.category_name || sc.name })));
      })
      .catch(console.error);

    
    fetch(`/api/settings/manage-religion/`)
      .then(res => res.json())
      .then(data => {
        let items = [];
        if (Array.isArray(data)) items = data;
        else if (data.results && Array.isArray(data.results)) items = data.results;
        else if (data.data && Array.isArray(data.data)) items = data.data;
        else if (data.religions && Array.isArray(data.religions)) items = data.religions;
        else items = [];
        setReligions(items.map((r: any) => ({ id: r.id, name: r.name })));
      })
      .catch(console.error);
  }, [companyId]);

 
  useEffect(() => {
    if (!isProfileEditModalOpen) return;
    if (!editProfileData?.religion_id) {
      setCastes([]);
      return;
    }
    fetch(`/api/settings/manage-caste/?religion_id=${editProfileData.religion_id}`)
      .then(res => res.json())
      .then(data => {
        let items = [];
        if (Array.isArray(data)) items = data;
        else if (data.results && Array.isArray(data.results)) items = data.results;
        else if (data.data && Array.isArray(data.data)) items = data.data;
        else if (data.castes && Array.isArray(data.castes)) items = data.castes;
        else items = [];
        setCastes(items.map((c: any) => ({ id: c.id, name: c.name })));
      })
      .catch(console.error);
  }, [editProfileData?.religion_id, isProfileEditModalOpen]);

  
  const getStaffTypeName = (id: number | string | null | undefined) => {
    if (!id) return "—";
    const numId = typeof id === "string" ? parseInt(id, 10) : id;
    const found = staffTypes.find(t => t.id === numId);
    return found ? found.name : `ID ${numId}`;
  };

  const getStaffCategoryName = (id: number | string | null | undefined) => {
    if (!id) return "—";
    const numId = typeof id === "string" ? parseInt(id, 10) : id;
    const found = staffCategories.find(c => c.id === numId);
    return found ? found.name : `ID ${numId}`;
  };

  
  const openProfileEditModal = () => {
    if (!fullProfile) return;

   
    let religionId = null;
    if (fullProfile.religion_name) {
      const found = religions.find(r => r.name === fullProfile.religion_name);
      religionId = found ? found.id : null;
    }

    
    let casteId = null;
    if (fullProfile.caste_name) {
      const found = castes.find(c => c.name === fullProfile.caste_name);
      casteId = found ? found.id : null;
    }

    setEditProfileData({
      id: fullProfile.id,
      user: fullProfile.user,
      dob: fullProfile.dob || null,
      guardian_name: fullProfile.guardian_name || "",
      guardian_phone: fullProfile.guardian_phone || "",
      religion_id: religionId,
      caste_id: casteId,
      staff_type_id: fullProfile.staff_type ? Number(fullProfile.staff_type) : null,
      staff_category_id: fullProfile.staff_category ? Number(fullProfile.staff_category) : null,
      ktu_id: fullProfile.ktu_id || "",
      aicte_id: fullProfile.aicte_id || "",
      pan_no: fullProfile.pan_no || "",
      aadhar_no: fullProfile.aadhar_no || "",
      blood_group: fullProfile.blood_group || "",
      alternate_mobile: fullProfile.alternate_mobile || "",
      alternate_email: fullProfile.alternate_email || "",
      present_address_details: fullProfile.present_address_details || {
        address_line_1: "", address_line_2: "", city: "", district: "", state: "", country: "", pincode: ""
      },
      permanent_address_details: fullProfile.permanent_address_details || {
        address_line_1: "", address_line_2: "", city: "", district: "", state: "", country: "", pincode: ""
      },
    });
    setIsProfileEditModalOpen(true);
  };

 
  const handleProfileEditChange = (field: keyof EditableProfile, value: any) => {
    setEditProfileData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleAddressChange = (type: 'present_address_details' | 'permanent_address_details', field: string, value: string) => {
    setEditProfileData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [type]: { ...prev[type], [field]: value }
      };
    });
  };

  const saveProfileEdit = async () => {
    if (!editProfileData || !companyId || !employeeId) return;
    setIsSavingProfile(true);
    try {
      const payload = {
        employee_id: Number(employeeId),
        dob: editProfileData.dob,
        guardian_name: editProfileData.guardian_name,
        guardian_phone: editProfileData.guardian_phone,
        religion_id: editProfileData.religion_id,
        caste_id: editProfileData.caste_id,
        staff_type_id: editProfileData.staff_type_id,
        staff_category_id: editProfileData.staff_category_id,
        ktu_id: editProfileData.ktu_id,
        aicte_id: editProfileData.aicte_id,
        pan_no: editProfileData.pan_no,
        aadhar_no: editProfileData.aadhar_no,
        blood_group: editProfileData.blood_group,
        alternate_mobile: editProfileData.alternate_mobile,
        alternate_email: editProfileData.alternate_email,
        present_address: editProfileData.present_address_details,
        permanent_address: editProfileData.permanent_address_details,
      };
      const response = await fetch(`/api/employee-profile/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to update profile");
      toast.success("Profile updated successfully!");
      setIsProfileEditModalOpen(false);
     
      await fetchProfile();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  
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
      setGroups(groupsArray);
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

  useEffect(() => {
    if (isError && retryCount < 2) {
      const timer = setTimeout(() => { refetch(); setRetryCount(p => p + 1); }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isError, retryCount, refetch]);

  const validateMobile = (mobile: string): boolean => {
    if (!mobile) { setMobileError("Mobile number is required"); return false; }
    if (!/^\d{10}$/.test(mobile)) { setMobileError("Mobile number must be exactly 10 digits"); return false; }
    setMobileError("");
    return true;
  };

  const handleChange = (field: keyof User, value: any) => {
    setFormData(prev => {
      if (!prev) return null;
      if (field === "mobile") validateMobile(value);
      return { ...prev, [field]: value };
    });
  };

  const handleGroupChange = (groupId: string) => {
    if (formData) {
      if (groupId === "none") setFormData({ ...formData, group_id: undefined, group: "" });
      else {
        const selected = groups.find(g => g.id.toString() === groupId);
        if (selected) {
          const name = selected.group || selected.name || selected.group_name || "";
          setFormData({ ...formData, group_id: Number(groupId), group: name });
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
        const selected = roles.find(r => r.id.toString() === roleId);
        if (selected) {
          handleChange("role_id", Number(roleId));
          handleChange("role", selected.role || selected.name || "");
        }
      }
    }
  };

  const getGroupDisplayName = (group: Group) => group.group || group.name || group.group_name || `Group ${group.id}`;

  const handleSaveAllChanges = async () => {
    if (!formData || !company) { toast.error("Missing employee data or company information"); return; }
    if (!validateMobile(formData.mobile)) { toast.error(mobileError || "Please enter a valid 10-digit mobile number"); return; }
    setIsSaving(true);
    try {
      const payload = {
        first_name: formData.first_name, last_name: formData.last_name, email: formData.email,
        mobile: formData.mobile, role: formData.role, gender: formData.gender, group: formData.group,
        is_wfh: formData.is_wfh, is_active: formData.is_active, role_id: formData.role_id,
        group_id: formData.group_id, is_whatsapp: formData.is_whatsapp || false,
        is_sms: formData.is_sms || false, ...(formData.prof_img && { prof_img: formData.prof_img }),
      };
      const response = await fetch(`/api/profile/${formData.id}?_t=${Date.now()}`, {
        method: "PUT", headers: { "Content-Type": "application/json", "x-company-id": company.id.toString(), "Cache-Control": "no-cache" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Employee updated successfully!");
        setIsEditModalOpen(false);
        if (result.data) {
          const updated = { ...formData, ...result.data, gender_display: result.data.gender === "M" ? "Male" : result.data.gender === "F" ? "Female" : "Other" };
          setFormData(updated);
        }
        setTimeout(() => refetch(), 1000);
      } else {
        toast.error(result.message || "Failed to update employee profile");
      }
    } catch (error) {
      toast.error("Failed to update employee profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualRetry = () => { setRetryCount(0); refetch(); };


  if (authLoading || isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex items-center gap-3"><Loader className="animate-spin h-8 w-8 text-blue-500" /><p className="text-lg">Loading employee details...</p></div>
    </div>
  );

  if (isError && !formData) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Employee Not Accessible</h2>
        <p className="text-muted-foreground mb-4">Unable to load employee ID: {employeeId}</p>
        <Button onClick={handleManualRetry} className="bg-blue-600 hover:bg-blue-700"><RefreshCw className="h-4 w-4 mr-2" />Try Again</Button>
      </div>
    </div>
  );

  if (!formData) return null;

  
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {!formData.is_active && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800"><strong>This employee is inactive.</strong> They cannot access the system.</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-center mb-4">
          <Link href="/dashboard/employees"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back to Employees</Button></Link>
          <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)} disabled={isSaving}><Pen className="h-4 w-4 mr-1" />Edit Basic Info</Button>
        </div>

        <EmployeeBanner employee={formData} editMode={false} onChange={() => {}} />

        {/* Basic info cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="h-4 w-4 text-yellow-600" />Contact</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"><Mail className="h-4 w-4 text-blue-600" /><p className="text-sm font-medium">{formData.email || "No email"}</p></div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"><Phone className="h-4 w-4 text-blue-600" /><p className="text-sm font-medium">{formData.mobile || "No mobile"}</p></div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader><CardTitle className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-blue-600" />Personal</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"><UserIcon className="h-4 w-4 text-yellow-600" /><p className="text-sm font-medium">{formData.gender_display || (formData.gender === "M" ? "Male" : formData.gender === "F" ? "Female" : "Other")}</p></div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"><MapPin className="h-4 w-4 text-yellow-600" /><p className="text-sm font-medium">{formData.group || "No group assigned"}{formData.group_id && <span className="text-xs text-gray-500 ml-2">(ID: {formData.group_id})</span>}</p></div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-yellow-600" />Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50"><span className="text-sm font-medium">WhatsApp</span><Badge variant={formData.is_whatsapp ? "default" : "secondary"}>{formData.is_whatsapp ? "On" : "Off"}</Badge></div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50"><span className="text-sm font-medium">SMS</span><Badge variant={formData.is_sms ? "default" : "secondary"}>{formData.is_sms ? "On" : "Off"}</Badge></div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50"><span className="text-sm font-medium">WFH</span><Badge variant={formData.is_wfh ? "default" : "secondary"}>{formData.is_wfh ? "Yes" : "No"}</Badge></div>
            </CardContent>
          </Card>
        </div>

        {/* Extended Profile Section with Conditional Button */}
        <div className="flex justify-between items-center mt-6 mb-2">
          <h2 className="text-xl font-semibold">Detailed Profile Information</h2>
          {fullProfile ? (
            <Button variant="outline" size="sm" onClick={openProfileEditModal} disabled={profileLoading}>
              <Edit className="h-4 w-4 mr-1" /> Edit Profile
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={createEmptyProfile} disabled={profileLoading}>
              <Plus className="h-4 w-4 mr-1" /> Create Profile
            </Button>
          )}
        </div>

        {profileLoading ? (
          <div className="flex justify-center py-12"><Loader className="animate-spin h-6 w-6 text-blue-500" /><span className="ml-2">Loading profile details...</span></div>
        ) : (
          <>
            {fullProfile ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
                  {/* Personal Details Card */}
                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader><CardTitle className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-green-600" />Personal Details</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Date of Birth</p><p className="text-sm font-medium">{fullProfile.dob || "—"}</p></div>
                        <div className="p-2 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Guardian Name</p><p className="text-sm font-medium">{fullProfile.guardian_name || "—"}</p></div>
                        <div className="p-2 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Guardian Phone</p><p className="text-sm font-medium">{fullProfile.guardian_phone || "—"}</p></div>
                        <div className="p-2 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Blood Group</p><p className="text-sm font-medium">{fullProfile.blood_group || "—"}</p></div>
                        <div className="p-2 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Religion</p><p className="text-sm font-medium">{fullProfile.religion_name || "—"}</p></div>
                        <div className="p-2 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Caste</p><p className="text-sm font-medium">{fullProfile.caste_name || "—"}</p></div>
                        <div className="p-2 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Staff Type</p><p className="text-sm font-medium">{getStaffTypeName(fullProfile.staff_type)}</p></div>
                        <div className="p-2 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Staff Category</p><p className="text-sm font-medium">{getStaffCategoryName(fullProfile.staff_category)}</p></div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Emergency & IDs Card */}
                  <Card className="border-l-4 border-l-purple-500">
                    <CardHeader><CardTitle className="flex items-center gap-2"><Phone className="h-4 w-4 text-purple-600" />Emergency & IDs</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Alternate Mobile</p><p className="text-sm font-medium">{fullProfile.alternate_mobile || "—"}</p></div>
                        <div className="p-2 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Alternate Email</p><p className="text-sm font-medium">{fullProfile.alternate_email || "—"}</p></div>
                        <div className="p-2 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">PAN</p><p className="text-sm font-medium">{fullProfile.pan_no || "—"}</p></div>
                        <div className="p-2 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Aadhaar</p><p className="text-sm font-medium">{fullProfile.aadhar_no || "—"}</p></div>
                        <div className="p-2 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">KTU ID</p><p className="text-sm font-medium">{fullProfile.ktu_id || "—"}</p></div>
                        <div className="p-2 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">AICTE ID</p><p className="text-sm font-medium">{fullProfile.aicte_id || "—"}</p></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Address Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader><CardTitle className="flex items-center gap-2"><Home className="h-4 w-4 text-blue-600" />Present Address</CardTitle></CardHeader>
                    <CardContent>
                      {fullProfile.present_address_details ? (
                        <div className="space-y-1 text-sm">
                          <p>{fullProfile.present_address_details.address_line_1}</p>
                          {fullProfile.present_address_details.address_line_2 && <p>{fullProfile.present_address_details.address_line_2}</p>}
                          <p>{fullProfile.present_address_details.city}, {fullProfile.present_address_details.district}</p>
                          <p>{fullProfile.present_address_details.state}, {fullProfile.present_address_details.country}</p>
                          <p>Pincode: {fullProfile.present_address_details.pincode}</p>
                        </div>
                      ) : <p className="text-sm text-muted-foreground">Not provided</p>}
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-600" />Permanent Address</CardTitle></CardHeader>
                    <CardContent>
                      {fullProfile.permanent_address_details ? (
                        <div className="space-y-1 text-sm">
                          <p>{fullProfile.permanent_address_details.address_line_1}</p>
                          {fullProfile.permanent_address_details.address_line_2 && <p>{fullProfile.permanent_address_details.address_line_2}</p>}
                          <p>{fullProfile.permanent_address_details.city}, {fullProfile.permanent_address_details.district}</p>
                          <p>{fullProfile.permanent_address_details.state}, {fullProfile.permanent_address_details.country}</p>
                          <p>Pincode: {fullProfile.permanent_address_details.pincode}</p>
                        </div>
                      ) : <p className="text-sm text-muted-foreground">Not provided</p>}
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg border">
                <p className="text-muted-foreground">No profile data available. Click "Create Profile" to add details.</p>
              </div>
            )}
          </>
        )}

        {/* EDIT BASIC INFO MODAL */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Edit Employee</DialogTitle><DialogDescription>Update employee details below.</DialogDescription></DialogHeader>
            {formData && (
              <div className="space-y-5 py-2">
                {/* Profile Image Upload */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div
                      className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 overflow-hidden bg-gray-50 dark:bg-gray-800"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {formData.prof_img ? (
                        <div className="relative w-full h-full group">
                          <img
                            src={formData.prof_img.startsWith("http") || formData.prof_img.startsWith("data:") ? formData.prof_img : company?.mediaBaseUrl ? `${company.mediaBaseUrl}${formData.prof_img}` : formData.prof_img}
                            alt="Profile preview"
                            className="w-full h-full rounded-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full flex items-center justify-center">
                            <Camera className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-2">
                          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full mb-1"><Upload className="h-5 w-5 text-gray-500 dark:text-gray-400" /></div>
                          <p className="text-[11px] font-medium text-gray-700 dark:text-gray-300">Upload Photo</p>
                        </div>
                      )}
                    </div>
                    {formData.prof_img && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleChange("prof_img", ""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        className="cursor-pointer absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors z-10 shadow-sm"
                      ><X className="h-3.5 w-3.5" /></button>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onloadend = () => handleChange("prof_img", reader.result as string);
                    reader.readAsDataURL(file);
                  }} accept="image/*" className="hidden" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="md:col-span-3"><Input value={formData.first_name || ""} onChange={(e) => handleChange("first_name", e.target.value)} placeholder="First Name *" /></div>
                  <div className="md:col-span-3"><Input value={formData.last_name || ""} onChange={(e) => handleChange("last_name", e.target.value)} placeholder="Last Name *" /></div>
                  <div className="md:col-span-3"><Input type="email" value={formData.email || ""} onChange={(e) => handleChange("email", e.target.value)} placeholder="Email *" /></div>
                  <div className="md:col-span-3"><Input value={formData.mobile || ""} onChange={(e) => handleChange("mobile", e.target.value)} placeholder="Mobile *" maxLength={10} className={mobileError ? "border-red-500" : ""} />{mobileError && <p className="text-red-500 text-xs mt-1">{mobileError}</p>}</div>
                  <div className="md:col-span-2">
                    <Select value={formData.gender || ""} onValueChange={(val) => handleChange("gender", val)}>
                      <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                      <SelectContent><SelectItem value="M">Male</SelectItem><SelectItem value="F">Female</SelectItem><SelectItem value="O">Other</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Select value={formData.role_id?.toString() || "none"} onValueChange={handleRoleChange} disabled={loadingRoles}>
                      <SelectTrigger><SelectValue placeholder={loadingRoles ? "Loading roles..." : "Select Role"} /></SelectTrigger>
                      <SelectContent><SelectItem value="none">No Role</SelectItem>{roles.map((role) => (<SelectItem key={role.id} value={role.id?.toString() || ""}>{role.role || role.name || `Role ${role.id}`}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Select value={formData.group_id?.toString() || "none"} onValueChange={handleGroupChange} disabled={loadingGroups}>
                      <SelectTrigger><SelectValue placeholder={loadingGroups ? "Loading groups..." : "Select Group"} /></SelectTrigger>
                      <SelectContent><SelectItem value="none">No Group</SelectItem>{groups.map((group) => (<SelectItem key={group.id} value={group.id?.toString() || ""}>{getGroupDisplayName(group)}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="h-px bg-border w-full" />

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-800 rounded-lg border gap-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-1.5 rounded-full ${formData.is_active ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"}`}>
                        {formData.is_active ? <UserIcon className="h-4 w-4 text-green-600 dark:text-green-400" /> : <UserMinus className="h-4 w-4 text-red-600 dark:text-red-400" />}
                      </div>
                      <div><label className="text-sm font-medium">Employee Status</label><p className="text-xs text-gray-500">{formData.is_active ? "Active employees can log in" : "Inactive employees cannot log in"}</p></div>
                    </div>
                    <Switch checked={formData.is_active || false} onCheckedChange={(val) => handleChange("is_active", val)} className={formData.is_active ? "data-[state=checked]:bg-black" : "data-[state=unchecked]:bg-gray-300"} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-center justify-between p-3 rounded border"><label className="text-[13px] font-medium">WhatsApp</label><Switch checked={formData.is_whatsapp || false} onCheckedChange={(val) => handleChange("is_whatsapp", val)} className={formData.is_whatsapp ? "data-[state=checked]:bg-black" : "data-[state=unchecked]:bg-gray-300"} /></div>
                    <div className="flex items-center justify-between p-3 rounded border"><label className="text-[13px] font-medium">SMS</label><Switch checked={formData.is_sms || false} onCheckedChange={(val) => handleChange("is_sms", val)} className={formData.is_sms ? "data-[state=checked]:bg-black" : "data-[state=unchecked]:bg-gray-300"} /></div>
                    <div className="flex items-center justify-between p-3 rounded border"><label className="text-[13px] font-medium">WFH</label><Switch checked={formData.is_wfh || false} onCheckedChange={(val) => handleChange("is_wfh", val)} className={formData.is_wfh ? "data-[state=checked]:bg-black" : "data-[state=unchecked]:bg-gray-300"} /></div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter><Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button><Button onClick={handleSaveAllChanges} disabled={isSaving} className="text-white min-w-[140px]">{isSaving ? <><Loader className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Pen className="mr-2 h-4 w-4" />Save Changes</>}</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/*  EDIT DETAILED PROFILE MODAL  */}
        <Dialog open={isProfileEditModalOpen} onOpenChange={setIsProfileEditModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Detailed Profile</DialogTitle>
              <DialogDescription>Update personal details, emergency contacts, IDs, and addresses.</DialogDescription>
            </DialogHeader>
            {editProfileData && (
              <div className="space-y-6 py-4">
                {/* Personal Details Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Personal Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Date of Birth</Label>
                      <Input type="date" value={editProfileData.dob || ""} onChange={e => handleProfileEditChange("dob", e.target.value)} />
                    </div>
                    <div>
                      <Label>Guardian Name</Label>
                      <Input value={editProfileData.guardian_name} onChange={e => handleProfileEditChange("guardian_name", e.target.value)} />
                    </div>
                    <div>
                      <Label>Guardian Phone</Label>
                      <Input value={editProfileData.guardian_phone} onChange={e => handleProfileEditChange("guardian_phone", e.target.value)} />
                    </div>
                    <div>
                      <Label>Blood Group</Label>
                      <Input value={editProfileData.blood_group} onChange={e => handleProfileEditChange("blood_group", e.target.value)} placeholder="e.g., O+, A-, B+" />
                    </div>
                    <div>
                      <Label>Religion</Label>
                      <select className="w-full p-2 border rounded-md" value={editProfileData.religion_id ?? ""} onChange={e => handleProfileEditChange("religion_id", e.target.value ? Number(e.target.value) : null)}>
                        <option value="">Select Religion</option>
                        {religions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label>Caste</Label>
                      <select className="w-full p-2 border rounded-md" value={editProfileData.caste_id ?? ""} onChange={e => handleProfileEditChange("caste_id", e.target.value ? Number(e.target.value) : null)} disabled={!editProfileData.religion_id}>
                        <option value="">Select Caste</option>
                        {castes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label>Staff Type</Label>
                      <select className="w-full p-2 border rounded-md" value={editProfileData.staff_type_id ?? ""} onChange={e => handleProfileEditChange("staff_type_id", e.target.value ? Number(e.target.value) : null)}>
                        <option value="">Select Staff Type</option>
                        {staffTypes.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label>Staff Category</Label>
                      <select className="w-full p-2 border rounded-md" value={editProfileData.staff_category_id ?? ""} onChange={e => handleProfileEditChange("staff_category_id", e.target.value ? Number(e.target.value) : null)}>
                        <option value="">Select Staff Category</option>
                        {staffCategories.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Emergency & IDs */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Emergency & IDs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Alternate Mobile</Label><Input value={editProfileData.alternate_mobile} onChange={e => handleProfileEditChange("alternate_mobile", e.target.value)} /></div>
                    <div><Label>Alternate Email</Label><Input type="email" value={editProfileData.alternate_email} onChange={e => handleProfileEditChange("alternate_email", e.target.value)} /></div>
                    <div><Label>PAN Number</Label><Input value={editProfileData.pan_no} onChange={e => handleProfileEditChange("pan_no", e.target.value)} /></div>
                    <div><Label>Aadhaar Number</Label><Input value={editProfileData.aadhar_no} onChange={e => handleProfileEditChange("aadhar_no", e.target.value)} /></div>
                    <div><Label>KTU ID</Label><Input value={editProfileData.ktu_id} onChange={e => handleProfileEditChange("ktu_id", e.target.value)} /></div>
                    <div><Label>AICTE ID</Label><Input value={editProfileData.aicte_id} onChange={e => handleProfileEditChange("aicte_id", e.target.value)} /></div>
                  </div>
                </div>

                {/* Present Address */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Present Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Address Line 1</Label><Input value={editProfileData.present_address_details.address_line_1 || ""} onChange={e => handleAddressChange("present_address_details", "address_line_1", e.target.value)} /></div>
                    <div><Label>Address Line 2</Label><Input value={editProfileData.present_address_details.address_line_2 || ""} onChange={e => handleAddressChange("present_address_details", "address_line_2", e.target.value)} /></div>
                    <div><Label>City</Label><Input value={editProfileData.present_address_details.city || ""} onChange={e => handleAddressChange("present_address_details", "city", e.target.value)} /></div>
                    <div><Label>District</Label><Input value={editProfileData.present_address_details.district || ""} onChange={e => handleAddressChange("present_address_details", "district", e.target.value)} /></div>
                    <div><Label>State</Label><Input value={editProfileData.present_address_details.state || ""} onChange={e => handleAddressChange("present_address_details", "state", e.target.value)} /></div>
                    <div><Label>Country</Label><Input value={editProfileData.present_address_details.country || ""} onChange={e => handleAddressChange("present_address_details", "country", e.target.value)} /></div>
                    <div><Label>Pincode</Label><Input value={editProfileData.present_address_details.pincode || ""} onChange={e => handleAddressChange("present_address_details", "pincode", e.target.value)} /></div>
                  </div>
                </div>

                {/* Permanent Address */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Permanent Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Address Line 1</Label><Input value={editProfileData.permanent_address_details.address_line_1 || ""} onChange={e => handleAddressChange("permanent_address_details", "address_line_1", e.target.value)} /></div>
                    <div><Label>Address Line 2</Label><Input value={editProfileData.permanent_address_details.address_line_2 || ""} onChange={e => handleAddressChange("permanent_address_details", "address_line_2", e.target.value)} /></div>
                    <div><Label>City</Label><Input value={editProfileData.permanent_address_details.city || ""} onChange={e => handleAddressChange("permanent_address_details", "city", e.target.value)} /></div>
                    <div><Label>District</Label><Input value={editProfileData.permanent_address_details.district || ""} onChange={e => handleAddressChange("permanent_address_details", "district", e.target.value)} /></div>
                    <div><Label>State</Label><Input value={editProfileData.permanent_address_details.state || ""} onChange={e => handleAddressChange("permanent_address_details", "state", e.target.value)} /></div>
                    <div><Label>Country</Label><Input value={editProfileData.permanent_address_details.country || ""} onChange={e => handleAddressChange("permanent_address_details", "country", e.target.value)} /></div>
                    <div><Label>Pincode</Label><Input value={editProfileData.permanent_address_details.pincode || ""} onChange={e => handleAddressChange("permanent_address_details", "pincode", e.target.value)} /></div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsProfileEditModalOpen(false)}>Cancel</Button>
              <Button onClick={saveProfileEdit} disabled={isSavingProfile} className="min-w-[140px]">
                {isSavingProfile ? <><Loader className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Profile</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}