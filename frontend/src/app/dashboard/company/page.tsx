"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Building2,
  MapPin,
  Clock,
  Gauge,
  Shield,
  Calendar,
  Users,
  Settings,
  Edit3,
  RefreshCw,
  Save,
  X,
  MessageSquare,
  Phone,
  Activity,
  Hash,
  Globe,
  Navigation,
  CheckCircle,
  XCircle,
  Zap,
  MoreVertical,
  Mail,
  Home,
} from "lucide-react"

import { useAuth } from "@/context/AuthContext"
import { useCompany } from "@/context/CompanyContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"

export default function CompanyProfilePage() {
  const { company, isAdmin } = useAuth()
  const router = useRouter()
  
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [formData, setFormData] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [activeEmployeeCount, setActiveEmployeeCount] = useState<number | null>(null)

  // Initialize form data when company changes
  useEffect(() => {
    if (company) {
      setFormData({ ...company })
    }
  }, [company])

  // Fetch total active employees
  useEffect(() => {
    const fetchEmployeeCount = async () => {
      if (!company) return
      try {
        const response = await fetch("/api/get-all-employees/1", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company_id: company.id, is_active: true })
        })
        const result = await response.json()
        if (result.success) {
          setActiveEmployeeCount(result.total)
        }
      } catch (err) {
        console.error("Failed to fetch employee count:", err)
      }
    }
    fetchEmployeeCount()
  }, [company])

  if (!company || !formData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const getLogoUrl = () => {
    if (formData.company_img && !imageError) {
      return formData.company_img.startsWith("data:") 
        ? formData.company_img 
        : formData.company_img.startsWith("http")
          ? formData.company_img
          : `${company.mediaBaseUrl}${formData.company_img}`
    }
    return null
  }

  const handleEdit = (section: string) => {
    setFormData({ ...company })
    setEditingSection(section)
  }

  const handleCancel = () => {
    setFormData({ ...company })
    setEditingSection(null)
    setSelectedImageFile(null)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImageFile(file)
      const reader = new FileReader()
      reader.onload = () => {
        setFormData((prev: any) => ({ ...prev, company_img: reader.result as string }))
        setImageError(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      let response
      if (selectedImageFile) {
        const data = new FormData()
        data.append("company_img", selectedImageFile)
        data.append("companyId", company.id.toString())
        data.append("company_name", formData.company_name)
        data.append("latitude", formData.latitude.toString())
        data.append("longitude", formData.longitude.toString())
        data.append("perimeter", formData.perimeter.toString())
        data.append("daily_working_hours", formData.daily_working_hours.toString())
        data.append("work_summary_interval", formData.work_summary_interval)
        data.append("punch_mode", formData.punch_mode)
        data.append("travel_speed_threshold", formData.travel_speed_threshold?.toString() || "10")
        
        // Address, phone, email are NOT sent to API (commented out)
        // data.append("address", formData.address || "")
        // data.append("phone", formData.phone || "")
        // data.append("email", formData.email || "")
        
        // Add boolean fields
        data.append("enable_sms", (formData.enable_sms || false).toString())
        data.append("enable_whatsapp", (formData.enable_whatsapp || false).toString())
        data.append("soft_disable", (formData.soft_disable || false).toString())
        data.append("strict_sms", (formData.strict_sms || false).toString())
        data.append("strict_whatsapp", (formData.strict_whatsapp || false).toString())

        response = await fetch("/api/company", {
          method: "PUT",
          body: data
        })
      } else {
        // Omit address, phone, email from JSON payload
        response = await fetch("/api/company", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            companyId: company.id
            // address, phone, email are excluded
          })
        })
      }

      const result = await response.json()
      if (result.success) {
        toast.success("Company settings updated!")
        setEditingSection(null)
        setTimeout(() => window.location.reload(), 500)
      } else {
        toast.error(result.message || "Failed to update company")
      }
    } catch (err) {
      toast.error("Internal Server Error")
    } finally {
      setIsSaving(false)
    }
  }

  const logoUrl = getLogoUrl()
  const initial = company.company_name?.charAt(0).toUpperCase() || "C"

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header Area */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
          {isAdmin && (
            <p className="text-sm text-gray-500 mt-1">
              Manage organization-wide settings, geofencing, and communication policies
            </p>
          )}
        </div>
      </div>

      {/* Hero Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Logo Section */}
          <div className="relative group">
            <div className="h-32 w-32 rounded-2xl overflow-hidden border-4 border-blue-50 shadow-inner bg-blue-50 flex items-center justify-center">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={company.company_name}
                  width={128}
                  height={128}
                  className="object-cover h-full w-full"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-blue-700">
                  <Building2 className="h-10 w-10 mb-1" />
                  <span className="text-2xl font-bold">{initial}</span>
                </div>
              )}
            </div>
            {isAdmin && (
               <label className="absolute -bottom-2 -right-2 h-10 w-10 bg-white rounded-full border-2 border-blue-100 shadow-sm flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                <Edit3 className="h-4 w-4 text-gray-600" />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-1">
                  {company.company_name}
                </h2>
                <div className="flex items-center justify-center md:justify-start gap-2 text-gray-500 font-medium">
                  <Hash className="h-4 w-4" />
                  <span>Company ID: {company.id}</span>
                </div>
              </div>
              <div className="flex flex-wrap justify-center md:justify-end gap-2">
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none px-3 py-1">
                  <Shield className="h-3 w-3 mr-1.5" />
                  {isAdmin ? "Admin View" : "Employee View"}
                </Badge>
                <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 px-3 py-1">
                  <Activity className="h-3 w-3 mr-1.5" />
                  Active Status
                </Badge>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-6 border-t border-gray-100 pt-6">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 leading-none mb-0.5">Punch Mode</p>
                  <p className="text-sm font-semibold text-gray-700">{company.punch_mode === "S" ? "Single Punch" : "Multi Punch"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Active Staff</h3>
            <p className="text-3xl font-bold text-blue-600">{activeEmployeeCount || "0"}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-full">
             <Users className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Standard Hours</h3>
            <p className="text-3xl font-bold text-green-600">{company.daily_working_hours}h</p>
          </div>
          <div className="p-3 bg-green-50 rounded-full">
            <Clock className="h-6 w-6 text-green-600" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Geofence Radius</h3>
            <p className="text-3xl font-bold text-purple-600">{company.perimeter}km</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-full">
            <Navigation className="h-6 w-6 text-purple-600" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Travel Threshold</h3>
            <p className="text-3xl font-bold text-amber-600">{company.travel_speed_threshold || "10"}km</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-full">
            <Gauge className="h-6 w-6 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Details Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Contact Information Section - FULLY COMMENTED OUT (address, phone, email) */}
        {/* 
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                <Home className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Contact Information</h3>
            </div>
            {isAdmin && (
              <Button 
                variant="outline" size="sm" 
                className="text-teal-600 border-teal-100 bg-teal-50 hover:bg-teal-100"
                onClick={() => handleEdit("contact")}
              >
                <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit
              </Button>
            )}
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Home className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Address</p>
                <p className="text-sm text-gray-800">{company.address || "Not provided"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Phone Number</p>
                <p className="text-sm text-gray-800">{company.phone || "Not provided"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Email Address</p>
                <p className="text-sm text-gray-800">{company.email || "Not provided"}</p>
              </div>
            </div>
          </div>
        </div>
        */}

        {/* Geographic & Location Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Geographic Settings</h3>
            </div>
            {isAdmin && (
              <Button 
                variant="outline" size="sm" 
                className="text-blue-600 border-blue-100 bg-blue-50 hover:bg-blue-100"
                onClick={() => handleEdit("location")}
              >
                <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit
              </Button>
            )}
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Latitude</p>
                <p className="text-base font-semibold text-gray-800">{company.latitude || "0.0000"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Longitude</p>
                <p className="text-base font-semibold text-gray-800">{company.longitude || "0.0000"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Perimeter (Radius)</p>
                <p className="text-base font-semibold text-gray-800">{company.perimeter} km</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Travel Threshold</p>
                <p className="text-base font-semibold text-gray-800">{company.travel_speed_threshold || "10"} km/h</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Configurations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                <Settings className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">System Preferences</h3>
            </div>
            {isAdmin && (
              <Button 
                variant="outline" size="sm" 
                className="text-orange-600 border-orange-100 bg-orange-50 hover:bg-orange-100"
                onClick={() => handleEdit("system")}
              >
                <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit
              </Button>
            )}
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Daily Working Hours</p>
                <p className="text-base font-semibold text-gray-800">{company.daily_working_hours} Hours</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Punching Mode</p>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-100">
                  {company.punch_mode === "S" ? "Single Entry" : "Multiple Entries"}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Summary Calculation</p>
              <p className="text-base font-semibold text-gray-800">
                {company.work_summary_interval === "W" ? "Weekly Basis" : "Monthly Basis"}
              </p>
            </div>
          </div>
        </div>

        {/* Global Communication Policy (Admin Only) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden lg:col-span-2">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Company-wide Communication Policy</h3>
            </div>
            {isAdmin && (
              <Button 
                variant="outline" size="sm" 
                className="text-purple-600 border-purple-100 bg-purple-50 hover:bg-purple-100"
                onClick={() => handleEdit("policy")}
              >
                <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit Policy
              </Button>
            )}
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                 <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <CheckCircle className={`h-4 w-4 ${company.enable_sms ? "text-green-500" : "text-gray-400"}`} />
                    <span className="text-sm font-medium text-gray-700">SMS Alerts Service</span>
                  </div>
                  <Badge variant={company.enable_sms ? "default" : "secondary"}>
                    {company.enable_sms ? "Online" : "Offline"}
                  </Badge>
                </div>
                 <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <MessageSquare className={`h-4 w-4 ${company.enable_whatsapp ? "text-green-500" : "text-gray-400"}`} />
                    <span className="text-sm font-medium text-gray-700">WhatsApp Alerts Service</span>
                  </div>
                  <Badge variant={company.enable_whatsapp ? "default" : "secondary"}>
                    {company.enable_whatsapp ? "Online" : "Offline"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50/50">
                  <div className="flex items-center gap-3">
                    <XCircle className={`h-4 w-4 ${company.soft_disable ? "text-red-500" : "text-gray-400"}`} />
                    <span className="text-sm font-medium text-red-800">Master Kill Switch (Silent Mode)</span>
                  </div>
                  <Badge variant="destructive" className={company.soft_disable ? "opacity-100" : "opacity-30"}>
                    {company.soft_disable ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/50">
                   <div className="flex items-center gap-3">
                    <Shield className={`h-4 w-4 ${(company.strict_sms || company.strict_whatsapp) ? "text-blue-500" : "text-gray-400"}`} />
                    <span className="text-sm font-medium text-blue-800">Strict Enforcement Policy</span>
                  </div>
                  <Badge variant="outline" className="border-blue-200 text-blue-700">
                    { (company.strict_sms || company.strict_whatsapp) ? "Enforced" : "Standard"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Dialogs */}
      
      {/* Contact Information Dialog - FULLY COMMENTED OUT */}
      {/* 
      <Dialog open={editingSection === "contact"} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Contact Information</DialogTitle>
            <DialogDescription>Update company address, phone number, and email</DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="space-y-2">
              <Label>Full Address</Label>
              <Input 
                value={formData.address || ""} 
                onChange={(e) => handleInputChange("address", e.target.value)} 
                placeholder="Street, city, state, postal code"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input 
                value={formData.phone || ""} 
                onChange={(e) => handleInputChange("phone", e.target.value)} 
                placeholder="+91 XXXXXXXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input 
                type="email"
                value={formData.email || ""} 
                onChange={(e) => handleInputChange("email", e.target.value)} 
                placeholder="contact@company.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      */}

      {/* Location Settings Dialog */}
      <Dialog open={editingSection === "location"} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Location Settings</DialogTitle>
            <DialogDescription>Update the central coordinate and geofence radius</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input value={formData.latitude} onChange={(e) => handleInputChange("latitude", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input value={formData.longitude} onChange={(e) => handleInputChange("longitude", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label>Radius (km)</Label>
                <Input type="number" value={formData.perimeter} onChange={(e) => handleInputChange("perimeter", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Travel Threshold (km/h)</Label>
                <Input type="number" value={formData.travel_speed_threshold} onChange={(e) => handleInputChange("travel_speed_threshold", e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* System Styles Dialog */}
      <Dialog open={editingSection === "system"} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">System Preferences</DialogTitle>
            <DialogDescription>Configure working hours and summary intervals</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label>Company Display Name</Label>
              <Input value={formData.company_name} onChange={(e) => handleInputChange("company_name", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label>Daily Working Hours</Label>
                <Input type="number" value={formData.daily_working_hours} onChange={(e) => handleInputChange("daily_working_hours", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Summary Interval</Label>
                <Select value={formData.work_summary_interval} onValueChange={(val) => handleInputChange("work_summary_interval", val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="W">Weekly</SelectItem>
                    <SelectItem value="M">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Punching Mode</Label>
              <Select value={formData.punch_mode} onValueChange={(val) => handleInputChange("punch_mode", val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="S">Single Entry (Fastest)</SelectItem>
                  <SelectItem value="M">Multiple Entries (Detailed)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>Save Preferences</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Communication Policy Dialog */}
      <Dialog open={editingSection === "policy"} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Communication Policy</DialogTitle>
            <DialogDescription>Enforce organization-wide messaging rules</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
               <div>
                 <Label>SMS Service</Label>
                 <p className="text-[10px] text-gray-500">Enable overall SMS capabilities</p>
               </div>
               <Switch checked={formData.enable_sms} onCheckedChange={(val) => handleInputChange("enable_sms", val)} />
             </div>
             <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
               <div>
                 <Label>WhatsApp Service</Label>
                 <p className="text-[10px] text-gray-500">Enable overall WhatsApp messaging</p>
               </div>
               <Switch checked={formData.enable_whatsapp} onCheckedChange={(val) => handleInputChange("enable_whatsapp", val)} />
             </div>
             
             <Separator />

             <div className="space-y-3">
               <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Strict Enforcement</h4>
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/50">
                  <div className="space-y-0.5">
                    <Label className="text-blue-900">Force Strict SMS</Label>
                    <p className="text-[10px] text-blue-600">Override user individual preferences</p>
                  </div>
                  <Switch checked={formData.strict_sms} onCheckedChange={(val) => handleInputChange("strict_sms", val)} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/50">
                  <div className="space-y-0.5">
                    <Label className="text-blue-900">Force Strict WhatsApp</Label>
                    <p className="text-[10px] text-blue-600">Always send WhatsApp alerts</p>
                  </div>
                  <Switch checked={formData.strict_whatsapp} onCheckedChange={(val) => handleInputChange("strict_whatsapp", val)} />
                </div>
             </div>

             <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
               <div className="space-y-0.5">
                 <Label className="text-red-900">Service Master Kill-Switch</Label>
                 <p className="text-[10px] text-red-600">Instantly stop all outgoing communications</p>
               </div>
               <Switch checked={formData.soft_disable} onCheckedChange={(val) => handleInputChange("soft_disable", val)} />
             </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>Update Policy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}