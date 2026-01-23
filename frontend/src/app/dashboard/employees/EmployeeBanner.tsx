// src/app/dashboard/employees/EmployeeBanner.tsx
"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { User, useAuth } from "@/context/AuthContext";
import { useCompany } from "@/context/CompanyContext";
import { UserIcon, Activity, Calendar, X } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import FullCalendarView from "@/components/FullCalendarView";
import { Button } from "@/components/ui/button";

interface EmployeeBannerProps {
  employee: User;
  editMode?: boolean;
  onChange?: (field: keyof User, value: any) => void;
}

interface Role {
  id: number;
  role: string;
  name?: string;
}

export default function EmployeeBanner({
  employee,
  editMode,
  onChange,
}: EmployeeBannerProps) {
  const [imageError, setImageError] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const { currentCompany } = useCompany();
  const { company: authCompany } = useAuth();
  const router = useRouter();

  const showInitials = !employee.prof_img || imageError;

  // Fetch roles when in edit mode
  useEffect(() => {
    if (editMode) {
      fetchRoles();
    }
  }, [editMode]);

  const fetchRoles = async () => {
    const companyId = authCompany?.id || currentCompany?.id || "";
    
    console.log("Fetching roles for company ID:", companyId);
    
    if (!companyId) {
      console.error("No company ID found for fetching roles");
      setRoles([]);
      return;
    }
    
    setLoadingRoles(true);
    try {
      const res = await fetch(`/api/settings/roles/${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch roles");
      const responseData = await res.json();
      
      let rolesArray: Role[] = [];
      
      if (Array.isArray(responseData)) {
        rolesArray = responseData;
      } else if (responseData.success && Array.isArray(responseData.data)) {
        rolesArray = responseData.data;
      } else if (Array.isArray(responseData.data)) {
        rolesArray = responseData.data;
      } else if (responseData.roles) {
        rolesArray = responseData.roles;
      }
      
      console.log("Fetched roles:", rolesArray);
      setRoles(rolesArray);
    } catch (err) {
      console.error("Error fetching roles:", err);
      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  };

  // Find current role ID by matching role name
  const getCurrentRoleId = () => {
    if (!employee.role || roles.length === 0) return "";
    
    // Try to find role by name (case-insensitive)
    const foundRole = roles.find(role => {
      const roleName = (role.role || role.name || "").toLowerCase().trim();
      const employeeRole = (employee.role || "").toLowerCase().trim();
      return roleName === employeeRole;
    });
    
    return foundRole?.id.toString() || "";
  };

  const getProfileImageUrl = () => {
    if (employee.prof_img) {
      return employee.prof_img.startsWith("http")
        ? employee.prof_img
        : `${currentCompany?.mediaBaseUrl}${employee.prof_img}`;
    }
    return `${currentCompany?.mediaBaseUrl}/media/default_profile.png`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        onChange?.("prof_img", reader.result as string);
        setImageError(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // ✅ Navigate to Punch History with biometric_id as query parameter
  const handleViewPunch = () => {
    if (!employee.id) {
      console.error("Employee ID is undefined");
      return;
    }

    let url = `/dashboard/employees/${employee.id}/punches`;
    
    if (employee.biometric_id && employee.biometric_id.trim() !== '') {
      url += `?biometric_id=${encodeURIComponent(employee.biometric_id)}`;
    }

    console.log("Navigating to:", url);
    router.push(url);
  };

  // ✅ Toggle calendar visibility
  const handleViewCalendar = () => {
    setShowCalendar(!showCalendar);
  };

  // ✅ Handle active status toggle
  const handleActiveToggle = (checked: boolean) => {
    onChange?.("is_active", checked);
  };

  // ✅ Handle role change
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    
    if (value) {
      const selectedRole = roles.find(role => role.id.toString() === value);
      if (selectedRole) {
        // Update both role_id and role
        onChange?.("role_id", Number(value));
        onChange?.("role", selectedRole.role || selectedRole.name || "");
      }
    } else {
      // Clear both if no role selected
      onChange?.("role_id", "");
      onChange?.("role", "");
    }
  };

  return (
    <>
      <Card className="mb-6 border-l-4 border-l-blue-500">
        <CardHeader className="pb-4 flex justify-between items-start">
          <div className="flex items-start gap-4">
            {/* Profile image */}
            <div className="relative">
              <Avatar className="h-16 w-16 border-2 border-background shadow-lg">
                {editMode ? (
                  <div className="flex flex-col items-center justify-center h-16 w-16 gap-1">
                    <Input
                      type="text"
                      value={employee.prof_img || ""}
                      placeholder="Profile Image URL"
                      onChange={(e) => onChange?.("prof_img", e.target.value)}
                      className="h-8 w-full text-xs p-1"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="text-xs"
                    />
                  </div>
                ) : showInitials ? (
                  <AvatarFallback className="text-lg font-bold bg-blue-100 text-blue-700 flex items-center justify-center">
                    {employee.first_name?.[0]}
                    {employee.last_name?.[0]}
                  </AvatarFallback>
                ) : (
                  <div className="relative h-16 w-16 rounded-full overflow-hidden">
                    <Image
                      src={getProfileImageUrl()}
                      alt={`${employee.first_name} ${employee.last_name}`}
                      fill
                      className="object-cover w-full h-full"
                      onError={() => setImageError(true)}
                    />
                  </div>
                )}
              </Avatar>
              <div
                className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background ${
                  employee.is_active ? "bg-green-500" : "bg-gray-400"
                }`}
              />
            </div>

            {/* Employee details */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                {editMode ? (
                  <>
                    <Input
                      value={employee.first_name}
                      onChange={(e) => onChange?.("first_name", e.target.value)}
                      placeholder="First Name"
                      className="font-bold text-xl w-32"
                    />
                    <Input
                      value={employee.last_name}
                      onChange={(e) => onChange?.("last_name", e.target.value)}
                      placeholder="Last Name"
                      className="font-bold text-xl w-32"
                    />
                  </>
                ) : (
                  <CardTitle className="text-xl font-bold text-foreground">
                    {employee.first_name} {employee.last_name}
                  </CardTitle>
                )}

                {/* Active Status Badge - Always visible */}
                <Badge
                  variant={employee.is_active ? "default" : "secondary"}
                  className="bg-blue-100 text-blue-700 border-blue-200"
                >
                  {employee.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              {/* ROLE SECTION - FIXED */}
              {editMode ? (
                <div className="mb-2">
                  <div className="flex items-center gap-3">
                    <select
                      value={getCurrentRoleId()}
                      onChange={handleRoleChange}
                      className="w-full max-w-xs p-2.5 border rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary text-lg"
                      disabled={loadingRoles}
                    >
                      <option value="">Select Role</option>
                      {roles.length > 0 ? (
                        roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.role || role.name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          {loadingRoles ? "Loading roles..." : "No roles available"}
                        </option>
                      )}
                    </select>
                    
                    {/* Display current role name */}
                    {employee.role && (
                      <Badge variant="outline" className="whitespace-nowrap">
                        Current: {employee.role}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Debug info (optional)
                  {editMode && process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-gray-500 mt-1">
                      Role ID in DB: {employee.role_id || "Not set"} | 
                      Matched ID: {getCurrentRoleId() || "Not found"}
                    </div>
                  )} */}
                </div>
              ) : (
                <p className="text-lg text-muted-foreground mb-2">
                  {employee.role || "No role assigned"}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <UserIcon className="h-4 w-4" />
                  ID: {employee.id}
                </span>
                <span className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  {employee.biometric_id || "No biometric ID"}
                </span>
              </div>

              {/* ✅ Active Status Toggle - Only shown in edit mode */}
              {editMode && (
                <div className="flex items-center gap-3 mt-3 p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="active-status"
                      checked={employee.is_active}
                      onCheckedChange={handleActiveToggle}
                    />
                    <Label htmlFor="active-status" className="text-sm font-medium">
                      Employee Status
                    </Label>
                  </div>
                  <span className={`text-sm font-medium ${employee.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {employee.is_active ? 'Active (Employee can access system)' : 'Inactive (Employee disabled)'}
                  </span>
                </div>
              )}

              {/* ✅ Action Buttons - View Punch and Calendar */}
              <div className="flex gap-3 mt-3">
                <Button
                  onClick={handleViewPunch}
                  className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
                  size="sm"
                >
                  <Activity className="h-4 w-4" />
                  View Punch
                </Button>
                
                <Button
                  onClick={handleViewCalendar}
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white"
                  size="sm"
                >
                  <Calendar className="h-4 w-4" />
                  {showCalendar ? "Hide Calendar" : "View Calendar"}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ✅ Calendar Section - Conditionally Rendered */}
      {showCalendar && (
        <div className="mb-6 relative">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              {employee.first_name}'s Attendance Calendar
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCalendar(false)}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Close Calendar
            </Button>
          </div>
          <FullCalendarView 
            employeeId={employee.id.toString()}
            companyId={currentCompany?.id?.toString()}
          />
        </div>
      )}
    </>
  );
}

// // src/app/dashboard/employees/EmployeeBanner.tsx
// "use client";

// import { Card, CardHeader, CardTitle } from "@/components/ui/card";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import { User, useAuth } from "@/context/AuthContext";
// import { useCompany } from "@/context/CompanyContext";
// import { UserIcon, Activity, Calendar, X } from "lucide-react";
// import Image from "next/image";
// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { Switch } from "@/components/ui/switch";
// import { Label } from "@/components/ui/label";
// import FullCalendarView from "@/components/FullCalendarView";
// import { Button } from "@/components/ui/button";

// interface EmployeeBannerProps {
//   employee: User;
//   editMode?: boolean;
//   onChange?: (field: keyof User, value: any) => void;
// }

// export default function EmployeeBanner({
//   employee,
//   editMode,
//   onChange,
// }: EmployeeBannerProps) {
//   const [imageError, setImageError] = useState(false);
//   const [showCalendar, setShowCalendar] = useState(false);
//   const { currentCompany } = useCompany();
//   const router = useRouter();

//   const showInitials = !employee.prof_img || imageError;

//   const getProfileImageUrl = () => {
//     if (employee.prof_img) {
//       return employee.prof_img.startsWith("http")
//         ? employee.prof_img
//         : `${currentCompany?.mediaBaseUrl}${employee.prof_img}`;
//     }
//     return `${currentCompany?.mediaBaseUrl}/media/default_profile.png`;
//   };

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = () => {
//         onChange?.("prof_img", reader.result as string);
//         setImageError(false);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   // ✅ Navigate to Punch History with biometric_id as query parameter - FIXED
// // ✅ Navigate to Punch History with biometric_id as query parameter - FIXED
// const handleViewPunch = () => {
//   // Check if employee.id exists
//   if (!employee.id) {
//     console.error("Employee ID is undefined");
//     return;
//   }

//   // Build URL with query params
//   let url = `/dashboard/employees/${employee.id}/punches`;
  
//   // Add biometric_id as query parameter if it exists
//   if (employee.biometric_id && employee.biometric_id.trim() !== '') {
//     url += `?biometric_id=${encodeURIComponent(employee.biometric_id)}`;
//   }

//   console.log("Navigating to:", url); // Debug log
//   router.push(url);
// };

//   // ✅ Toggle calendar visibility
//   const handleViewCalendar = () => {
//     setShowCalendar(!showCalendar);
//   };

//   // ✅ Handle active status toggle
//   const handleActiveToggle = (checked: boolean) => {
//     onChange?.("is_active", checked);
//   };

//   return (
//     <>
//       <Card className="mb-6 border-l-4 border-l-blue-500">
//         <CardHeader className="pb-4 flex justify-between items-start">
//           <div className="flex items-start gap-4">
//             {/* Profile image */}
//             <div className="relative">
//               <Avatar className="h-16 w-16 border-2 border-background shadow-lg">
//                 {editMode ? (
//                   <div className="flex flex-col items-center justify-center h-16 w-16 gap-1">
//                     <Input
//                       type="text"
//                       value={employee.prof_img || ""}
//                       placeholder="Profile Image URL"
//                       onChange={(e) => onChange?.("prof_img", e.target.value)}
//                       className="h-8 w-full text-xs p-1"
//                     />
//                     <input
//                       type="file"
//                       accept="image/*"
//                       onChange={handleFileChange}
//                       className="text-xs"
//                     />
//                   </div>
//                 ) : showInitials ? (
//                   <AvatarFallback className="text-lg font-bold bg-blue-100 text-blue-700 flex items-center justify-center">
//                     {employee.first_name?.[0]}
//                     {employee.last_name?.[0]}
//                   </AvatarFallback>
//                 ) : (
//                   <div className="relative h-16 w-16 rounded-full overflow-hidden">
//                     <Image
//                       src={getProfileImageUrl()}
//                       alt={`${employee.first_name} ${employee.last_name}`}
//                       fill
//                       className="object-cover w-full h-full"
//                       onError={() => setImageError(true)}
//                     />
//                   </div>
//                 )}
//               </Avatar>
//               <div
//                 className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background ${
//                   employee.is_active ? "bg-green-500" : "bg-gray-400"
//                 }`}
//               />
//             </div>

//             {/* Employee details */}
//             <div className="flex-1">
//               <div className="flex items-center gap-3 mb-1">
//                 {editMode ? (
//                   <>
//                     <Input
//                       value={employee.first_name}
//                       onChange={(e) => onChange?.("first_name", e.target.value)}
//                       placeholder="First Name"
//                       className="font-bold text-xl w-32"
//                     />
//                     <Input
//                       value={employee.last_name}
//                       onChange={(e) => onChange?.("last_name", e.target.value)}
//                       placeholder="Last Name"
//                       className="font-bold text-xl w-32"
//                     />
//                   </>
//                 ) : (
//                   <CardTitle className="text-xl font-bold text-foreground">
//                     {employee.first_name} {employee.last_name}
//                   </CardTitle>
//                 )}

//                 {/* Active Status Badge - Always visible */}
//                 <Badge
//                   variant={employee.is_active ? "default" : "secondary"}
//                   className="bg-blue-100 text-blue-700 border-blue-200"
//                 >
//                   {employee.is_active ? "Active" : "Inactive"}
//                 </Badge>
//               </div>

//               {editMode ? (
//                 <Input
//                   value={employee.role || ""}
//                   onChange={(e) => onChange?.("role", e.target.value)}
//                   placeholder="Role"
//                   className="text-lg w-48"
//                 />
//               ) : (
//                 <p className="text-lg text-muted-foreground mb-2">
//                   {employee.role}
//                 </p>
//               )}

//               <div className="flex items-center gap-4 text-sm text-muted-foreground">
//                 <span className="flex items-center gap-1">
//                   <UserIcon className="h-4 w-4" />
//                   ID: {employee.id}
//                 </span>
//                 <span className="flex items-center gap-1">
//                   <Activity className="h-4 w-4" />
//                   {employee.biometric_id || "No biometric ID"}
//                 </span>
//               </div>

//               {/* ✅ Active Status Toggle - Only shown in edit mode */}
//               {editMode && (
//                 <div className="flex items-center gap-3 mt-3 p-3 bg-gray-50 rounded-lg border">
//                   <div className="flex items-center gap-2">
//                     <Switch
//                       id="active-status"
//                       checked={employee.is_active}
//                       onCheckedChange={handleActiveToggle}
//                     />
//                     <Label htmlFor="active-status" className="text-sm font-medium">
//                       Employee Status
//                     </Label>
//                   </div>
//                   <span className={`text-sm font-medium ${employee.is_active ? 'text-green-600' : 'text-red-600'}`}>
//                     {employee.is_active ? 'Active (Employee can access system)' : 'Inactive (Employee disabled)'}
//                   </span>
//                 </div>
//               )}

//               {/* ✅ Action Buttons - View Punch and Calendar */}
//               <div className="flex gap-3 mt-3">
//                 <Button
//                   onClick={handleViewPunch}
//                   className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
//                   size="sm"
//                 >
//                   <Activity className="h-4 w-4" />
//                   View Punch
//                 </Button>
                
//                 <Button
//                   onClick={handleViewCalendar}
//                   className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white"
//                   size="sm"
//                 >
//                   <Calendar className="h-4 w-4" />
//                   {showCalendar ? "Hide Calendar" : "View Calendar"}
//                 </Button>
//               </div>
//             </div>
//           </div>
//         </CardHeader>
//       </Card>

//       {/* ✅ Calendar Section - Conditionally Rendered */}
//       {showCalendar && (
//         <div className="mb-6 relative">
//           <div className="flex justify-between items-center mb-4">
//             <h3 className="text-lg font-semibold text-foreground">
//               {employee.first_name}'s Attendance Calendar
//             </h3>
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => setShowCalendar(false)}
//               className="flex items-center gap-2"
//             >
//               <X className="h-4 w-4" />
//               Close Calendar
//             </Button>
//           </div>
//           <FullCalendarView 
//             employeeId={employee.id.toString()}
//             companyId={currentCompany?.id?.toString()}
//           />
//         </div>
//       )}
//     </>
//   );
// }


