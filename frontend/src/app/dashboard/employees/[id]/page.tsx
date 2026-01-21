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

import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react";
import {
  Loader,
  Mail,
  Phone,
  UserIcon,
  MapPin,
  ArrowLeft,
  MessageSquare,
  Home,
  Pen,
  AlertTriangle,
  RefreshCw
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useAuth, User } from "@/context/AuthContext"
import EmployeeBanner from "../EmployeeBanner"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { useEmployee } from "@/hooks/employees/useGetEmployee"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Group {
  id: number;
  group?: string; // Changed from 'name' to 'group' based on API response
  name?: string;
  group_name?: string;
  short_name?: string;
}

export default function EmployeeDetailsPage() {
  const params = useParams()
  const employeeId = params.id as string
  const { company, loading: authLoading } = useAuth()
  const companyId = company?.id

  const { data: employee, isLoading, isError, error, refetch } = useEmployee(companyId, employeeId)

  const [formData, setFormData] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Update formData when employee data loads
  useEffect(() => {
    if (employee) {
      console.log("📥 Employee data loaded:", {
        id: employee.id,
        role: employee.role,
        role_id: employee.role_id,
        group: employee.group,
        group_id: employee.group_id
      });
      setFormData(employee);
      setRetryCount(0); // Reset retry count on successful load
    }
  }, [employee]);

  // Fetch groups when in edit mode
  useEffect(() => {
    if (editMode && companyId) {
      fetchGroups();
    }
  }, [editMode, companyId]);

  const fetchGroups = async () => {
    if (!companyId) return;
    
    setLoadingGroups(true);
    try {
      const response = await fetch(`/api/settings/groups/${companyId}`);
      if (!response.ok) throw new Error("Failed to fetch groups");
      
      const result = await response.json();
      console.log("📊 Groups API response:", result);
      
      let groupsArray: Group[] = [];
      
      if (Array.isArray(result)) {
        groupsArray = result;
      } else if (result.success && Array.isArray(result.data)) {
        groupsArray = result.data;
      } else if (Array.isArray(result.data)) {
        groupsArray = result.data;
      } else if (result.groups) {
        groupsArray = result.groups;
      }
      
      // Debug log to see the actual structure
      console.log("🔍 Groups array structure:", groupsArray.map(g => ({
        id: g.id,
        group: g.group,
        name: g.name,
        group_name: g.group_name,
        short_name: g.short_name,
        allKeys: Object.keys(g)
      })));
      
      // Filter out groups with invalid IDs or names
      const validGroups = groupsArray.filter(group => {
        const groupId = group.id?.toString()?.trim();
        // Get group name from any possible field
        const groupName = (group.group || group.name || group.group_name || "").trim();
        return groupId && groupId !== "" && groupName !== "";
      });
      
      console.log("✅ Valid groups after filtering:", validGroups);
      setGroups(validGroups);
    } catch (err) {
      console.error("Error fetching groups:", err);
      setGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  // Auto-retry if employee might be inactive
  useEffect(() => {
    if (isError && retryCount < 2) {
      const timer = setTimeout(() => {
        console.log(`🔄 Retrying employee fetch (attempt ${retryCount + 1})`);
        refetch();
        setRetryCount(prev => prev + 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isError, retryCount, refetch]);

  const handleChange = (field: keyof User, value: any) => {
    if (formData) {
      console.log("🔄 Field changed:", { field, value, current: formData[field] });
      setFormData({ ...formData, [field]: value });
    }
  };

  const handleGroupChange = (groupId: string) => {
    if (formData) {
      if (groupId === "none") {
        console.log("Clearing group selection");
        setFormData({
          ...formData,
          group_id: null,
          group: ""
        });
      } else {
        const selectedGroup = groups.find(group => group.id.toString() === groupId);
        if (selectedGroup) {
          // Get the group name from any possible field
          const groupName = selectedGroup.group || selectedGroup.name || selectedGroup.group_name || "";
          
          console.log("🎯 Group selected:", {
            group_id: Number(groupId),
            group: groupName
          });
          
          setFormData({
            ...formData,
            group_id: Number(groupId),
            group: groupName
          });
        }
      }
    }
  };

  // Helper function to get group display name
  const getGroupDisplayName = (group: Group) => {
    return group.group || group.name || group.group_name || `Group ${group.id}`;
  };

// In your EmployeeDetailsPage component, update handleSaveAllChanges:

const handleSaveAllChanges = async () => {
  if (!formData || !company) {
    toast.error("Missing employee data or company information");
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
    };

    console.log("💾 Saving employee with payload:", payload);

    // Add cache busting to the PUT request
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
    console.log("💾 Save response:", result);

    if (result.success) {
      toast.success("Employee updated successfully!");
      setEditMode(false);
      
      // CRITICAL: Update formData IMMEDIATELY with the response
      if (result.data) {
        console.log("🚨 UPDATING FORM DATA FROM RESPONSE:", result.data);
        
        // Create updated employee object
        const updatedEmployee = {
          ...formData,
          // Update all fields from response
          first_name: result.data.first_name || formData.first_name,
          last_name: result.data.last_name || formData.last_name,
          email: result.data.email || formData.email,
          mobile: result.data.mobile || formData.mobile,
          role: result.data.role || formData.role,
          gender: result.data.gender || formData.gender,
          group: result.data.group || formData.group,
          is_wfh: result.data.is_wfh !== undefined ? result.data.is_wfh : formData.is_wfh,
          is_active: result.data.is_active !== undefined ? result.data.is_active : formData.is_active,
          role_id: result.data.role_id || formData.role_id,
          group_id: result.data.group_id || formData.group_id,
          is_whatsapp: result.data.is_whatsapp !== undefined ? result.data.is_whatsapp : formData.is_whatsapp,
          is_sms: result.data.is_sms !== undefined ? result.data.is_sms : formData.is_sms,
          // Calculate gender_display
          gender_display: result.data.gender === 'M' ? 'Male' : 
                         result.data.gender === 'F' ? 'Female' : 'Other'
        };
        
        console.log("✅ UPDATED EMPLOYEE DATA:", updatedEmployee);
        setFormData(updatedEmployee);
      }
      
      // Force a hard refresh of employee data with cache busting
      setTimeout(() => {
        console.log("🔄 Forcing hard refresh...");
        
        // Create a new promise for refetch with cache busting
        fetch(`/api/profile/${formData.id}?_t=${Date.now()}&force=true`, {
          headers: {
            "x-company-id": company.id.toString(),
          },
          cache: 'no-store'
        })
        .then(res => res.json())
        .then(freshData => {
          console.log("🔄 Fresh data from hard refresh:", freshData);
          if (freshData.success && freshData.data) {
            setFormData(prev => ({
              ...prev!,
              ...freshData.data,
              gender_display: freshData.data.gender === 'M' ? 'Male' : 
                            freshData.data.gender === 'F' ? 'Female' : 'Other'
            }));
          }
        })
        .catch(err => console.error("Error in hard refresh:", err));
        
        // Also call the original refetch
        refetch();
      }, 1000);
      
    } else {
      if (result.backendMessage?.includes('Messaging services')) {
        toast.error("Cannot update while messaging services are disabled. Please contact your administrator.");
      } else {
        toast.error(result.message || "Failed to update employee profile");
      }
    }
  } catch (error) {
    console.error("Error updating employee profile:", error);
    toast.error("Failed to update employee profile");
  } finally {
    setIsSaving(false);
  }
};

  // Manual retry function
  const handleManualRetry = () => {
    setRetryCount(0);
    refetch();
  };

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader className="animate-spin h-8 w-8 text-blue-500" />
          <p className="text-lg text-foreground">Loading employee details...</p>
        </div>
      </div>
    )
  }

  // Show error state
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
            <p className="text-yellow-800 text-sm">
              This might be because:
            </p>
            <ul className="text-yellow-800 text-sm list-disc list-inside mt-2 text-left">
              <li>The employee is inactive</li>
              <li>There's a temporary connection issue</li>
              <li>The employee was recently deactivated</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleManualRetry}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
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
    )
  }

  // If no employee data
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
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Inactive Employee Warning */}
        {!formData.is_active && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>This employee is inactive.</strong> They cannot access the system. 
              You can reactivate them using the toggle in edit mode.
            </AlertDescription>
          </Alert>
        )}

        {/* Header with navigation and edit button */}
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode(!editMode)}
              disabled={isSaving}
            >
              <Pen className="h-4 w-4 mr-1" /> 
              {editMode ? "Cancel" : "Edit"}
            </Button>
          </div>
        </div>

        {/* Employee Banner */}
        <EmployeeBanner 
          employee={formData} 
          editMode={editMode} 
          onChange={handleChange}
        />

        {/* Other Cards */}
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
                {editMode ? (
                  <Input
                    value={formData.email || ""}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="Email"
                  />
                ) : (
                  <p className="text-sm font-medium text-foreground">{formData.email || "No email"}</p>
                )}
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <Phone className="h-4 w-4 text-blue-600" />
                {editMode ? (
                  <Input
                    value={formData.mobile || ""}
                    onChange={(e) => handleChange("mobile", e.target.value)}
                    placeholder="Mobile"
                  />
                ) : (
                  <p className="text-sm font-medium text-foreground">{formData.mobile || "No mobile"}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Personal Card */}
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
                {editMode ? (
                  <Select
                    value={formData.gender || ""}
                    onValueChange={(val) => handleChange("gender", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                      <SelectItem value="O">Other</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm font-medium text-foreground">
                    {formData.gender_display || (formData.gender === 'M' ? 'Male' : formData.gender === 'F' ? 'Female' : 'Other')}
                  </p>
                )}
              </div>
              
              {/* Group Dropdown - UPDATED */}
              <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <MapPin className="h-4 w-4 text-yellow-600" />
                {editMode ? (
                  <div className="w-full">
                    <Select
                      value={formData.group_id?.toString() || "none"}
                      onValueChange={handleGroupChange}
                      disabled={loadingGroups}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingGroups ? "Loading groups..." : "Select Group"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Group</SelectItem>
                        {groups.map((group) => {
                          const groupId = group.id?.toString() || "";
                          const groupName = getGroupDisplayName(group);
                          
                          if (!groupId || groupId.trim() === "" || !groupName.trim()) {
                            console.warn("Skipping group with invalid data:", group);
                            return null;
                          }
                          
                          return (
                            <SelectItem key={group.id} value={groupId}>
                              {groupName}
                            </SelectItem>
                          );
                        }).filter(Boolean)}
                      </SelectContent>
                    </Select>
                    {/* Debug info */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="text-xs text-gray-500 mt-1">
                        Groups loaded: {groups.length} | 
                        Current Group ID: {formData.group_id || "None"} | 
                        Current Group: {formData.group || "None"}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm font-medium text-foreground">
                    {formData.group || "No group assigned"}
                    {formData.group_id && <span className="text-xs text-gray-500 ml-2">(ID: {formData.group_id})</span>}
                  </p>
                )}
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
                {editMode ? (
                  <Switch
                    checked={formData.is_whatsapp || false}
                    onCheckedChange={(val) => handleChange("is_whatsapp", val)}
                  />
                ) : (
                  <Badge variant={formData.is_whatsapp ? "default" : "secondary"}>
                    {formData.is_whatsapp ? "On" : "Off"}
                  </Badge>
                )}
              </div>

              {/* SMS Section */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-foreground">SMS</span>
                </div>
                {editMode ? (
                  <Switch
                    checked={formData.is_sms || false}
                    onCheckedChange={(val) => handleChange("is_sms", val)}
                  />
                ) : (
                  <Badge variant={formData.is_sms ? "default" : "secondary"}>
                    {formData.is_sms ? "On" : "Off"}
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-foreground">WFH</span>
                </div>
                {editMode ? (
                  <Switch
                    checked={formData.is_wfh || false}
                    onCheckedChange={(val) => handleChange("is_wfh", val)}
                  />
                ) : (
                  <Badge variant={formData.is_wfh ? "default" : "secondary"}>
                    {formData.is_wfh ? "Yes" : "No"}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        {editMode && (
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setEditMode(false);
                // Reset form data to original employee data
                if (employee) {
                  setFormData(employee);
                }
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleSaveAllChanges}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save All Changes"}
            </Button>
          </div>
        )}

        {/* Debug info (development only)
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm">
            <h3 className="font-medium mb-2">Debug Info:</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <strong>Role:</strong> {formData.role || "None"}
              </div>
              <div>
                <strong>Role ID:</strong> {formData.role_id || "None"}
              </div>
              <div>
                <strong>Group:</strong> {formData.group || "None"}
              </div>
              <div>
                <strong>Group ID:</strong> {formData.group_id || "None"}
              </div>
              <div>
                <strong>Employee ID:</strong> {formData.id}
              </div>
              <div>
                <strong>Active:</strong> {formData.is_active ? "Yes" : "No"}
              </div>
            </div>
          </div>
        )} */}
      </div>
    </div>
  )
}