"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Building2, MapPin, Clock, Gauge, Shield, Calendar, Users, Settings,
  Edit3, RefreshCw, Save, X, MessageSquare, Phone, Activity, Hash,
  Globe, Navigation, CheckCircle, XCircle, Zap, MoreVertical, Mail, Home,
  Trash2, AlertTriangle
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"

export default function CompanyProfilePage() {
  const { company, isAdmin } = useAuth()
  const router = useRouter()
  
  // ============================================================
  // State for system/geofence/policy (uses /api/company endpoint)
  // ============================================================
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [formData, setFormData] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [activeEmployeeCount, setActiveEmployeeCount] = useState<number | null>(0)

  // ============================================================
  // State for address & contact profile (/api/manage-company-profile/)
  // ============================================================
  const [profileData, setProfileData] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileExists, setProfileExists] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // ------------------------------------------------------------------
  // 1. Fetch company profile from our Next.js route (proxies to Django)
  // ------------------------------------------------------------------
  const fetchProfile = async () => {
    if (!company?.id) return
    setProfileLoading(true)
    try {
      // Important: trailing slash before query param
      const res = await fetch(`/api/manage-company-profile/?company_id=${company.id}`)
      if (res.ok) {
        const data = await res.json()
        setProfileData(data)
        setProfileExists(true)
      } else if (res.status === 404) {
        setProfileData(null)
        setProfileExists(false)
      } else {
        throw new Error("Failed to load profile")
      }
    } catch (err) {
      console.error(err)
      toast.error("Could not load company profile")
      setProfileData(null)
      setProfileExists(false)
    } finally {
      setProfileLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [company])

  // ------------------------------------------------------------------
  // 2. Employee count – disabled to avoid 404 (set to 0)
  //    Replace with real endpoint later if needed.
  // ------------------------------------------------------------------
  useEffect(() => {
    setActiveEmployeeCount(0)
    // If you later implement a proper endpoint, uncomment:
    /*
    const fetchEmployeeCount = async () => {
      try {
        const response = await fetch("/api/employees/count?company_id=" + company.id)
        if (response.ok) {
          const data = await response.json()
          setActiveEmployeeCount(data.count)
        }
      } catch (err) {
        setActiveEmployeeCount(0)
      }
    }
    fetchEmployeeCount()
    */
  }, [company])

  // ------------------------------------------------------------------
  // 3. Save profile (POST for create, PUT for update)
  // ------------------------------------------------------------------
  const handleSaveProfile = async () => {
    if (!company) return
    setIsSaving(true)
    try {
      const url = `/api/manage-company-profile/`
      const payload: any = { ...profileData }
      payload.company_id = company.id

      let response
      if (!profileExists) {
        response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
      } else {
        response = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
      }

      if (response.ok) {
        toast.success(profileExists ? "Profile updated!" : "Profile created!")
        await fetchProfile()
        setEditingSection(null)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to save profile")
      }
    } catch (err) {
      toast.error("Internal Server Error")
    } finally {
      setIsSaving(false)
    }
  }

  // ------------------------------------------------------------------
  // 4. Delete profile (DELETE method)
  // ------------------------------------------------------------------
  const handleDeleteProfile = async () => {
    if (!company) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/manage-company-profile/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: company.id })
      })
      if (res.ok) {
        toast.success("Company profile deleted")
        setProfileData(null)
        setProfileExists(false)
        setShowDeleteConfirm(false)
      } else {
        const error = await res.json()
        toast.error(error.error || "Delete failed")
      }
    } catch (err) {
      toast.error("Could not delete profile")
    } finally {
      setIsSaving(false)
    }
  }

  // ------------------------------------------------------------------
  // 5. Helper: full address string
  // ------------------------------------------------------------------
  const getFullAddress = () => {
    if (!profileData) return "Not provided"
    const parts = [
      profileData.address_line_1,
      profileData.address_line_2,
      profileData.city,
      profileData.district,
      profileData.state,
      profileData.country,
      profileData.pincode
    ].filter(Boolean)
    return parts.length ? parts.join(", ") : "Not provided"
  }

  // ============================================================
  // Existing logic for system settings (/api/company)
  // ============================================================
  useEffect(() => {
    if (company) {
      setFormData({ ...company })
    }
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
    if (section === "address") {
      if (!profileExists) {
        setProfileData({
          company_id: company.id,
          address_line_1: "",
          address_line_2: "",
          city: "",
          district: "",
          state: "",
          country: "",
          pincode: "",
          email: "",
          phone_number: "",
          alternate_email: "",
          alternate_phone_number: "",
        })
      } else {
        setProfileData({ ...profileData })
      }
    }
    setEditingSection(section)
  }

  const handleCancel = () => {
    setFormData({ ...company })
    setEditingSection(null)
    setSelectedImageFile(null)
    if (profileExists) {
      fetchProfile()
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleProfileFieldChange = (field: string, value: string) => {
    setProfileData((prev: any) => ({ ...prev, [field]: value }))
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
        response = await fetch("/api/company", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            companyId: company.id
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

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ================== Contact & Address Section ================== */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                <Home className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Contact & Address</h3>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" size="sm" 
                  className="text-teal-600 border-teal-100 bg-teal-50 hover:bg-teal-100"
                  onClick={() => handleEdit("address")}
                >
                  <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit
                </Button>
                {profileExists && (
                  <Button 
                    variant="outline" size="sm" 
                    className="text-red-600 border-red-100 bg-red-50 hover:bg-red-100"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                  </Button>
                )}
              </div>
            )}
          </div>
          <div className="p-6">
            {profileLoading ? (
              <div className="flex justify-center py-8">Loading profile...</div>
            ) : profileExists && profileData ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Address</p>
                    <p className="text-sm text-gray-800">{getFullAddress()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Email</p>
                      <p className="text-sm text-gray-800">{profileData.email || "Not provided"}</p>
                      {profileData.alternate_email && (
                        <p className="text-xs text-gray-500 mt-1">Alt: {profileData.alternate_email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Phone</p>
                      <p className="text-sm text-gray-800">{profileData.phone_number || "Not provided"}</p>
                      {profileData.alternate_phone_number && (
                        <p className="text-xs text-gray-500 mt-1">Alt: {profileData.alternate_phone_number}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No contact information found.
                {isAdmin && <p className="text-sm mt-2">Click Edit to add company address & contact details.</p>}
              </div>
            )}
          </div>
        </div>

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

        {/* System Preferences */}
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

        {/* Communication Policy */}
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
                    <CheckCircle className={`h-4 w-4 ${formData.enable_sms ? "text-green-500" : "text-gray-400"}`} />
                    <span className="text-sm font-medium text-gray-700">SMS Alerts Service</span>
                  </div>
                  <Badge variant={formData.enable_sms ? "default" : "secondary"}>
                    {formData.enable_sms ? "Online" : "Offline"}
                  </Badge>
                </div>
                 <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <MessageSquare className={`h-4 w-4 ${formData.enable_whatsapp ? "text-green-500" : "text-gray-400"}`} />
                    <span className="text-sm font-medium text-gray-700">WhatsApp Alerts Service</span>
                  </div>
                  <Badge variant={formData.enable_whatsapp ? "default" : "secondary"}>
                    {formData.enable_whatsapp ? "Online" : "Offline"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50/50">
                  <div className="flex items-center gap-3">
                    <XCircle className={`h-4 w-4 ${formData.soft_disable ? "text-red-500" : "text-gray-400"}`} />
                    <span className="text-sm font-medium text-red-800">Master Kill Switch (Silent Mode)</span>
                  </div>
                  <Badge variant="destructive" className={formData.soft_disable ? "opacity-100" : "opacity-30"}>
                    {formData.soft_disable ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/50">
                   <div className="flex items-center gap-3">
                    <Shield className={`h-4 w-4 ${(formData.strict_sms || formData.strict_whatsapp) ? "text-blue-500" : "text-gray-400"}`} />
                    <span className="text-sm font-medium text-blue-800">Strict Enforcement Policy</span>
                  </div>
                  <Badge variant="outline" className="border-blue-200 text-blue-700">
                    { (formData.strict_sms || formData.strict_whatsapp) ? "Enforced" : "Standard"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================== DIALOGS ================== */}

      {/* Edit Address & Contact Dialog */}
      <Dialog open={editingSection === "address"} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Contact & Address</DialogTitle>
            <DialogDescription>Update company location and contact details</DialogDescription>
          </DialogHeader>
          {profileData && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Address line 1</Label>
                <Input value={profileData.address_line_1 || ""} onChange={(e) => handleProfileFieldChange("address_line_1", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Address line 2</Label>
                <Input value={profileData.address_line_2 || ""} onChange={(e) => handleProfileFieldChange("address_line_2", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>City</Label><Input value={profileData.city || ""} onChange={(e) => handleProfileFieldChange("city", e.target.value)} /></div>
                <div className="space-y-2"><Label>District</Label><Input value={profileData.district || ""} onChange={(e) => handleProfileFieldChange("district", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>State</Label><Input value={profileData.state || ""} onChange={(e) => handleProfileFieldChange("state", e.target.value)} /></div>
                <div className="space-y-2"><Label>Country</Label><Input value={profileData.country || ""} onChange={(e) => handleProfileFieldChange("country", e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>Pincode</Label><Input value={profileData.pincode || ""} onChange={(e) => handleProfileFieldChange("pincode", e.target.value)} /></div>
              <Separator />
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={profileData.email || ""} onChange={(e) => handleProfileFieldChange("email", e.target.value)} /></div>
              <div className="space-y-2"><Label>Alternate Email</Label><Input type="email" value={profileData.alternate_email || ""} onChange={(e) => handleProfileFieldChange("alternate_email", e.target.value)} /></div>
              <div className="space-y-2"><Label>Phone Number</Label><Input value={profileData.phone_number || ""} onChange={(e) => handleProfileFieldChange("phone_number", e.target.value)} /></div>
              <div className="space-y-2"><Label>Alternate Phone</Label><Input value={profileData.alternate_phone_number || ""} onChange={(e) => handleProfileFieldChange("alternate_phone_number", e.target.value)} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? "Saving..." : (profileExists ? "Update Profile" : "Create Profile")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Company Profile
            </DialogTitle>
            <DialogDescription>
              This will permanently remove the address and contact information for <strong>{company.company_name}</strong>. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteProfile} disabled={isSaving}>
              {isSaving ? "Deleting..." : "Yes, Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Location Dialog */}
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

      {/* Edit System Dialog */}
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

      {/* Edit Policy Dialog */}
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