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
import CalendarView from "@/components/FullCalendarView";

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

  // Update formData when employee data loads
  useEffect(() => {
    if (employee) {
      setFormData(employee);
      setRetryCount(0); // Reset retry count on successful load
    }
  }, [employee]);

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
      setFormData({ ...formData, [field]: value });
    }
  };

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
        is_whatsapp: formData.is_whatsapp,
        is_wfh: formData.is_wfh,
        is_active: formData.is_active, // ✅ This is crucial for reactivation
        role_id: formData.role_id,
        group_id: formData.group_id,
      };

      console.log("💾 Saving employee data with is_active:", formData.is_active);

      const response = await fetch(`/api/profile/${formData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-company-id": company.id.toString(),
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log("💾 Save response:", result);

      if (result.success) {
        toast.success(
          formData.is_active 
            ? "Employee activated successfully!" 
            : "Employee deactivated successfully!"
        );
        setEditMode(false);
        
        // Refetch to get updated data
        setTimeout(() => {
          refetch();
        }, 500);
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

  // Show error state - but provide option to retry for potentially inactive employees
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

  // If we have employee data (even if inactive), show the details
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
              <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <MapPin className="h-4 w-4 text-yellow-600" />
                {editMode ? (
                  <Input
                    value={formData.group || ""}
                    onChange={(e) => handleChange("group", e.target.value)}
                    placeholder="Group"
                  />
                ) : (
                  <p className="text-sm font-medium text-foreground">{formData.group || "No group"}</p>
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
      </div>
    </div>
  )
}

/*"use client";

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
  Pen
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useAuth, User } from "@/context/AuthContext"
import EmployeeBanner from "../EmployeeBanner"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { useEmployee } from "@/hooks/employees/useGetEmployee"
import { toast } from "sonner" // Add toast for notifications

export default function EmployeeDetailsPage() {
  const params = useParams()
  const employeeId = params.id as string
  const { company, loading: authLoading } = useAuth()
  const companyId = company?.id

  // Use the hook to fetch the specific employee
  const { data: employee, isLoading, isError, error } = useEmployee(companyId, employeeId)

  const [formData, setFormData] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update formData when employee data loads
  useEffect(() => {
    if (employee) {
      setFormData(employee);
    }
  }, [employee]);

  // ✅ Add debug logging
  useEffect(() => {
    console.log("Employee details debug:", {
      employeeId,
      companyId,
      employee,
      isLoading,
      isError,
      error
    });
  }, [employeeId, companyId, employee, isLoading, isError, error]);

  const handleChange = (field: keyof User, value: any) => {
    if (formData) {
      setFormData({ ...formData, [field]: value });
    }
  };

  // ✅ Save all employee updates
const handleSaveAllChanges = async () => {
  if (!formData || !company) {
    toast.error("Missing employee data or company information");
    return;
  }

  setIsSaving(true);
  
  try {
    // Prepare payload without prof_img for the main update
    const payload = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      mobile: formData.mobile,
      role: formData.role,
      // Remove prof_img from main update
      gender: formData.gender,
      group: formData.group,
      is_whatsapp: formData.is_whatsapp,
      is_wfh: formData.is_wfh,
      is_active: formData.is_active, // ✅ Added is_active field
      role_id: formData.role_id,
      group_id: formData.group_id,
    };

    console.log("Saving employee data (without image):", payload);

    const response = await fetch(`/api/profile/${formData.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-company-id": company.id.toString(),
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log("Save response:", result);

    if (result.success) {
      toast.success("Employee profile updated successfully!");
      setEditMode(false);
      refetch();
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
  // Show loading state
  if (authLoading || isLoading || !formData) {
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
  if (isError || !employee) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Employee Not Found</h2>
          <p className="text-muted-foreground mb-4">
            Employee ID: {employeeId} could not be found.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            {error instanceof Error ? error.message : "The employee may not exist or you may not have access."}
          </p>
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
        {/* Single Edit Button }
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditMode(!editMode)}
            disabled={isSaving}
          >
            <Pen className="h-4 w-4 mr-1" /> {editMode ? "Cancel" : "Edit"}
          </Button>
        </div>

        {/* Employee Banner }
        <EmployeeBanner 
          employee={formData} 
          editMode={editMode} 
          onChange={handleChange}
        />

        {/* Other Cards }
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* Contact Card }
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

          {/* Personal Card }
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
              <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <MapPin className="h-4 w-4 text-yellow-600" />
                {editMode ? (
                  <Input
                    value={formData.group || ""}
                    onChange={(e) => handleChange("group", e.target.value)}
                    placeholder="Group"
                  />
                ) : (
                  <p className="text-sm font-medium text-foreground">{formData.group || "No group"}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preferences Card }
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

        {/* Save Button }
        {editMode && (
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setEditMode(false)}
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
      </div>
    </div>
  )
}
  */