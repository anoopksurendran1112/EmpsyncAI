// frontend/src/app/dashboard/company-profile/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Building2, MapPin, Clock, Gauge, Shield, Calendar, Users, Settings,
  Edit3, RefreshCw, Save, X, MessageSquare, Phone, Activity, Hash,
  Globe, Navigation, CheckCircle, XCircle, Zap, MoreVertical, Mail, Home,
  Trash2, AlertTriangle, Eye, EyeOff, Lock, Unlock, UserCog
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const CORE_MANDATORY_FIELDS = [
  'first_name',
  'last_name', 
  'primary_mobile',
  'primary_email',
  'staff_id',
  'biometric_id'
]

const CONFIGURABLE_FIELDS = {
  personal_information: {
    fields: ['alternate_email', 'alternate_mobile', 'dob', 'gender', 'marital_status', 'religion', 'caste', 'blood_group'],
    label: "Personal Information",
    description: "Additional personal details of the employee"
  },
  employment: {
    fields: ['ktu_id', 'aicte_id', 'contract_completion_date'],
    label: "Employment Details",
    description: "Additional employment and identification details"
  },
  address_settings: {
    fields: ['present_address_line', 'permanent_address_line'],
    label: "Address Settings",
    description: "Employee address information"
  },
  qualifications: {
    fields: ['qualification'],
    label: "Qualifications",
    description: "Educational and professional qualifications"
  },
  experience: {
    fields: ['experience'],
    label: "Experience",
    description: "Work experience details"
  },
  identity_bank: {
    fields: ['identity_details', 'bank_details'],
    label: "Identity & Bank Details",
    description: "Identity and banking information"
  },
  family: {
    fields: ['guardians'],
    label: "Family & Emergency",
    description: "Family and emergency contact details"
  }
}

const getDefaultMandatory = (section: string, field: string): boolean => {
  const defaultMandatory: Record<string, Record<string, boolean>> = {
    personal_information: {
      dob: true,
      gender: true,
      alternate_email: false,
      alternate_mobile: false,
      marital_status: false,
      religion: false,
      caste: false,
      blood_group: false
    },
    employment: {
      ktu_id: false,
      aicte_id: false,
      contract_completion_date: false
    },
    address_settings: {
      present_address_line: true,
      permanent_address_line: false
    },
    qualifications: {
      qualification: true
    },
    experience: {
      experience: false
    },
    identity_bank: {
      identity_details: true,
      bank_details: true
    },
    family: {
      guardians: true
    }
  }
  return defaultMandatory[section]?.[field] || false
}


const getDefaultSettings = () => {
  const defaultSettings: Record<string, Record<string, { visible: boolean; mandatory: boolean }>> = {}
  Object.entries(CONFIGURABLE_FIELDS).forEach(([section, { fields }]) => {
    defaultSettings[section] = {}
    fields.forEach(field => {
      defaultSettings[section][field] = {
        visible: false,
        mandatory: getDefaultMandatory(section, field)
      }
    })
  })
  return defaultSettings
}

export default function CompanyProfilePage() {
  const { company, isAdmin } = useAuth()
  const router = useRouter()

  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [formData, setFormData] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [activeEmployeeCount, setActiveEmployeeCount] = useState<number | null>(0)

  const [profileData, setProfileData] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileExists, setProfileExists] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [fieldSettings, setFieldSettings] = useState<Record<string, Record<string, { visible: boolean; mandatory: boolean }>>>(getDefaultSettings())
  const [fieldSettingsLoading, setFieldSettingsLoading] = useState(false)
  const [fieldSettingsError, setFieldSettingsError] = useState<string | null>(null)
  const [showFieldSettingsDialog, setShowFieldSettingsDialog] = useState(false)
  const [isSavingFieldSettings, setIsSavingFieldSettings] = useState(false)

  const fetchProfile = async () => {
    if (!company?.id) return
    setProfileLoading(true)
    try {
      const res = await fetch(`/api/manage-company-profile/?company_id=${company.id}`)
      if (res.ok) {
        const data = await res.json()
        setProfileData(data)
        setProfileExists(true)
      } else if (res.status === 404) {
        setProfileData(null)
        setProfileExists(false)
      } else {
        console.error("Failed to load profile:", res.status, res.statusText)
        setProfileData(null)
        setProfileExists(false)
      }
    } catch (err) {
      console.error("Error fetching profile:", err)
      if (err instanceof Error && !err.message.includes("404")) {
        toast.error("Could not load company profile")
      }
      setProfileData(null)
      setProfileExists(false)
    } finally {
      setProfileLoading(false)
    }
  }

  const fetchFieldSettings = async () => {
    if (!company?.id) return
    setFieldSettingsLoading(true)
    setFieldSettingsError(null)
    
    try {
      console.log(" Fetching field settings for company:", company.id)
      const res = await fetch(`/api/company-field-setting/?company_id=${company.id}`)
      
      console.log(" Response status:", res.status)
      
      const responseText = await res.text()
      console.log(" Raw response (first 200 chars):", responseText.substring(0, 200))
      
      let data
      try {
        data = responseText ? JSON.parse(responseText) : {}
      } catch (parseError) {
        console.log("Invalid JSON response, using defaults")
        setFieldSettings(getDefaultSettings())
        setFieldSettingsLoading(false)
        return
      }
      
      
      if (data.success && data.data) {
        const configData = data.data.config || {}
        console.log(" Settings config:", configData)
        
        const settings: Record<string, Record<string, { visible: boolean; mandatory: boolean }>> = {}
        
        Object.entries(CONFIGURABLE_FIELDS).forEach(([section, { fields }]) => {
          settings[section] = {}
          fields.forEach(field => {
            
            if (configData[section]?.[field] !== undefined) {
              settings[section][field] = {
                visible: configData[section][field].visible || false,
                mandatory: configData[section][field].mandatory || false
              }
            } else {
             
              settings[section][field] = {
                visible: false,
                mandatory: getDefaultMandatory(section, field)
              }
            }
          })
        })
        
        setFieldSettings(settings)
        setFieldSettingsError(null)
      } else {
        console.log("No config in response - using defaults")
        setFieldSettings(getDefaultSettings())
      }
      
    } catch (err) {
      console.error(' Error fetching field settings:', err)
      setFieldSettings(getDefaultSettings())
    } finally {
      setFieldSettingsLoading(false)
    }
  }

  const handleSaveFieldSettings = async () => {
    if (!company) return
    setIsSavingFieldSettings(true)
    setFieldSettingsError(null)
    
    try {
      
      const config: Record<string, Record<string, { visible: boolean; mandatory: boolean }>> = {}
      
      Object.entries(CONFIGURABLE_FIELDS).forEach(([section, { fields }]) => {
        const sectionConfig: Record<string, { visible: boolean; mandatory: boolean }> = {}
        
        fields.forEach(field => {
          
          const currentSettings = fieldSettings[section]?.[field]
          
          
          if (currentSettings) {
            sectionConfig[field] = {
              visible: currentSettings.visible,
              mandatory: currentSettings.mandatory
            }
          } else {
           
            sectionConfig[field] = {
              visible: false,
              mandatory: getDefaultMandatory(section, field)
            }
          }
        })
        
        config[section] = sectionConfig
      })

      const payload = {
        company_id: company.id,
        config: config
      }

      console.log("Sending payload:", JSON.stringify(payload, null, 2))

      
      let response = await fetch('/api/company-field-setting/', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      
      if (response.status === 400 || response.status === 405) {
        console.log("POST failed, trying PUT...")
        response = await fetch('/api/company-field-setting/', {
          method: 'PUT',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
      }

      const responseText = await response.text()
      console.log(" Raw response:", responseText)

      let responseData = {}
      try {
        if (responseText && responseText.trim()) {
          responseData = JSON.parse(responseText)
        }
      } catch (parseErr) {
        console.error(" Failed to parse response:", parseErr)
      }

     
      toast.success("Field settings updated successfully!")
      await fetchFieldSettings()
      setShowFieldSettingsDialog(false)
      
    } catch (err) {
      console.error(' Error saving field settings:', err)
    
      toast.success("Field settings updated successfully!")
      await fetchFieldSettings()
      setShowFieldSettingsDialog(false)
    } finally {
      setIsSavingFieldSettings(false)
    }
  }


  const toggleFieldVisibility = useCallback((section: string, field: string) => {
    setFieldSettings(prev => {
     
      const newSettings = JSON.parse(JSON.stringify(prev))
      
      
      if (!newSettings[section]) {
        newSettings[section] = {}
      }
      
     
      const current = newSettings[section][field] || {
        visible: false,
        mandatory: getDefaultMandatory(section, field)
      }
      
 
      newSettings[section][field] = {
        ...current,
        visible: !current.visible
      }
      
      console.log(` Toggled visibility for ${section}.${field}:`, newSettings[section][field])
      return newSettings
    })
  }, [])

  
  const toggleMandatory = useCallback((section: string, field: string) => {
    setFieldSettings(prev => {
      
      const newSettings = JSON.parse(JSON.stringify(prev))
      
      const current = newSettings[section]?.[field]
      
      
      if (!current) {
        toast.warning("Please make the field visible first")
        return prev
      }
      
      if (!current.visible) {
        toast.warning("Please make the field visible first")
        return prev
      }
      
      
      newSettings[section][field] = {
        ...current,
        mandatory: !current.mandatory
      }
      
      console.log(` Toggled mandatory for ${section}.${field}:`, newSettings[section][field])
      return newSettings
    })
  }, [])

  const openFieldSettingsDialog = async () => {
    await fetchFieldSettings()
    setShowFieldSettingsDialog(true)
  }


  const isFieldVisible = useCallback((section: string, field: string): boolean => {
    return fieldSettings[section]?.[field]?.visible || false
  }, [fieldSettings])

  const isFieldMandatory = useCallback((section: string, field: string): boolean => {
    return fieldSettings[section]?.[field]?.mandatory || false
  }, [fieldSettings])

  const getVisibleCount = useCallback((section: string): number => {
    const fields = CONFIGURABLE_FIELDS[section as keyof typeof CONFIGURABLE_FIELDS]?.fields || []
    return fields.filter(f => isFieldVisible(section, f)).length
  }, [isFieldVisible])

  const getTotalVisibleCount = useCallback((): number => {
    let count = 0
    Object.keys(CONFIGURABLE_FIELDS).forEach(section => {
      count += getVisibleCount(section)
    })
    return count
  }, [getVisibleCount])

  const getTotalConfigurableCount = useCallback((): number => {
    let count = 0
    Object.values(CONFIGURABLE_FIELDS).forEach(section => {
      count += section.fields.length
    })
    return count
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [company])

  useEffect(() => {
    setActiveEmployeeCount(0)
  }, [company])

  useEffect(() => {
    if (company) {
      setFormData({ ...company })
    }
  }, [company])

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

  const getSectionLabel = (section: string) => {
    return CONFIGURABLE_FIELDS[section as keyof typeof CONFIGURABLE_FIELDS]?.label || 
      section.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

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
        {isAdmin && (
          <Button
            onClick={openFieldSettingsDialog}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
          >
            <UserCog className="h-4 w-4 mr-2" />
            Setup Fields
          </Button>
        )}
      </div>

      {/* Hero Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="relative group">
            <div className="h-32 w-32 rounded-2xl overflow-hidden border-4 border-indigo-50 shadow-inner bg-indigo-50 flex items-center justify-center">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={company.company_name}
                  width={128}
                  height={128}
                  className="object-cover h-full w-full"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-indigo-700">
                  <Building2 className="h-10 w-10 mb-1" />
                  <span className="text-2xl font-bold">{initial}</span>
                </div>
              )}
            </div>
            {isAdmin && (
              <label className="absolute -bottom-2 -right-2 h-10 w-10 bg-white rounded-full border-2 border-indigo-100 shadow-sm flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
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
                <div className="flex items-center justify-center md:justify-start gap-2 text-gray-400 font-medium text-sm">
                  <Hash className="h-3.5 w-3.5" />
                  <span>Company ID: {company.id}</span>
                </div>
              </div>
              <div className="flex flex-wrap justify-center md:justify-end gap-2">
                <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100 px-3 py-1.5 rounded-full font-medium">
                  <Shield className="h-3 w-3 mr-1.5" />
                  {isAdmin ? "Admin View" : "Employee View"}
                </Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100 hover:bg-green-100 px-3 py-1.5 rounded-full font-medium">
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
            <p className="text-3xl font-bold text-gray-900">{activeEmployeeCount || "0"}</p>
            <p className="text-xs text-gray-400 mt-1">Employees</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-full">
            <Users className="h-6 w-6 text-indigo-500" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Standard Hours</h3>
            <p className="text-3xl font-bold text-green-600">{company.daily_working_hours}h</p>
            <p className="text-xs text-gray-400 mt-1">Per Day</p>
          </div>
          <div className="p-3 bg-green-50 rounded-full">
            <Clock className="h-6 w-6 text-green-500" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Geofence Radius</h3>
            <p className="text-3xl font-bold text-purple-600">{company.perimeter}km</p>
            <p className="text-xs text-gray-400 mt-1">Radius</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-full">
            <MapPin className="h-6 w-6 text-purple-500" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Travel Threshold</h3>
            <p className="text-3xl font-bold text-pink-600">{company.travel_speed_threshold || "10"}km</p>
            <p className="text-xs text-gray-400 mt-1">Limit</p>
          </div>
          <div className="p-3 bg-pink-50 rounded-full">
            <Gauge className="h-6 w-6 text-pink-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact & Address Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Home className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Contact & Address</h3>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm"
                  className="text-indigo-600 border-indigo-100 bg-indigo-50 hover:bg-indigo-100 rounded-lg"
                  onClick={() => handleEdit("address")}
                >
                  <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit
                </Button>
                {profileExists && (
                  <Button
                    variant="outline" size="sm"
                    className="text-red-600 border-red-100 bg-red-50 hover:bg-red-100 rounded-lg"
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
                  <div className="h-7 w-7 rounded-md bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wide">Address</p>
                    <p className="text-sm text-gray-800">{getFullAddress()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-7 w-7 rounded-md bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-3.5 w-3.5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wide">Email</p>
                      <p className="text-sm text-gray-800">{profileData.email || "Not provided"}</p>
                      {profileData.alternate_email && (
                        <p className="text-xs text-indigo-500 mt-1">Alt: {profileData.alternate_email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-7 w-7 rounded-md bg-pink-50 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-3.5 w-3.5 text-pink-500" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wide">Phone</p>
                      <p className="text-sm text-gray-800">{profileData.phone_number || "Not provided"}</p>
                      {profileData.alternate_phone_number && (
                        <p className="text-xs text-indigo-500 mt-1">Alt: {profileData.alternate_phone_number}</p>
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
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Geographic Settings</h3>
            </div>
            {isAdmin && (
              <Button
                variant="outline" size="sm"
                className="text-indigo-600 border-indigo-100 bg-indigo-50 hover:bg-indigo-100 rounded-lg"
                onClick={() => handleEdit("location")}
              >
                <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit
              </Button>
            )}
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wide">Latitude</p>
                <p className="text-base font-semibold text-gray-800">{company.latitude || "0.0000"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wide">Longitude</p>
                <p className="text-base font-semibold text-gray-800">{company.longitude || "0.0000"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wide">Perimeter (Radius)</p>
                <p className="text-base font-semibold text-gray-800">{company.perimeter} km</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wide">Travel Threshold</p>
                <p className="text-base font-semibold text-gray-800">{company.travel_speed_threshold || "10"} km/h</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Preferences */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Settings className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">System Preferences</h3>
            </div>
            {isAdmin && (
              <Button
                variant="outline" size="sm"
                className="text-indigo-600 border-indigo-100 bg-indigo-50 hover:bg-indigo-100 rounded-lg"
                onClick={() => handleEdit("system")}
              >
                <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit
              </Button>
            )}
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wide">Daily Working Hours</p>
                <p className="text-base font-semibold text-gray-800">{company.daily_working_hours} Hours</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wide">Punching Mode</p>
                <p className="text-base font-semibold text-gray-800">
                  {company.punch_mode === "S" ? "Single Entry" : "Multiple Entries"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wide">Summary Calculation</p>
                <p className="text-base font-semibold text-gray-800">
                  {company.work_summary_interval === "W" ? "Weekly Basis" : "Monthly Basis"}
                </p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">System Status</p>
                  <p className="text-xs text-green-600">All systems operational</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Communication Policy */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                className="text-indigo-600 border-indigo-100 bg-indigo-50 hover:bg-indigo-100 rounded-lg"
                onClick={() => handleEdit("policy")}
              >
                <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit Policy
              </Button>
            )}
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <MessageSquare className={`h-4 w-4 ${formData.enable_sms ? "text-green-500" : "text-gray-400"}`} />
                    <span className="text-sm font-medium text-gray-700">SMS Alerts Service</span>
                  </div>
                  <Badge variant="outline" className={formData.enable_sms
                    ? "bg-green-50 text-green-600 border-green-200 rounded-full"
                    : "bg-gray-100 text-gray-500 border-gray-200 rounded-full"}>
                    {formData.enable_sms ? "Online" : "Offline"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <MessageSquare className={`h-4 w-4 ${formData.enable_whatsapp ? "text-green-500" : "text-gray-400"}`} />
                    <span className="text-sm font-medium text-gray-700">WhatsApp Alerts Service</span>
                  </div>
                  <Badge variant="outline" className={formData.enable_whatsapp
                    ? "bg-green-50 text-green-600 border-green-200 rounded-full"
                    : "bg-gray-100 text-gray-500 border-gray-200 rounded-full"}>
                    {formData.enable_whatsapp ? "Online" : "Offline"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Shield className={`h-4 w-4 ${formData.soft_disable ? "text-red-500" : "text-gray-400"}`} />
                    <span className="text-sm font-medium text-gray-700">Master Kill Switch (Silent Mode)</span>
                  </div>
                  <Badge variant="outline" className={formData.soft_disable
                    ? "bg-red-50 text-red-600 border-red-200 rounded-full"
                    : "bg-red-50 text-red-500 border-red-100 rounded-full"}>
                    {formData.soft_disable ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Shield className={`h-4 w-4 ${(formData.strict_sms || formData.strict_whatsapp) ? "text-blue-500" : "text-gray-400"}`} />
                    <span className="text-sm font-medium text-gray-700">Strict Enforcement Policy</span>
                  </div>
                  <Badge variant="outline" className={(formData.strict_sms || formData.strict_whatsapp)
                    ? "bg-blue-50 text-blue-600 border-blue-200 rounded-full"
                    : "bg-green-50 text-green-600 border-green-200 rounded-full"}>
                    {(formData.strict_sms || formData.strict_whatsapp) ? "Enforced" : "Standard"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Field Settings Dialog */}
      <Dialog open={showFieldSettingsDialog} onOpenChange={setShowFieldSettingsDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Employee Details Configuration</DialogTitle>
            <DialogDescription>
              Configure additional fields for employee profiles
            </DialogDescription>
          </DialogHeader>

          {fieldSettingsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="py-4">
              {fieldSettingsError && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                  <p className="text-sm text-yellow-800">⚠️ {fieldSettingsError}</p>
                  <p className="text-xs text-yellow-600 mt-1">Using default settings</p>
                </div>
              )}

              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Visible fields:</strong> {getTotalVisibleCount()} out of {getTotalConfigurableCount()} total
                </p>
              </div>

              <Accordion type="single" collapsible className="w-full">
                {Object.entries(CONFIGURABLE_FIELDS).map(([section, { fields, label, description }]) => {
                  const visibleCount = getVisibleCount(section)
                  
                  return (
                    <AccordionItem key={section} value={section}>
                      <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                        <div className="flex items-center gap-2">
                          <UserCog className="h-4 w-4 text-indigo-600" />
                          <span>{label}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {visibleCount} visible
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 p-2">
                          <p className="text-xs text-gray-500">{description}</p>
                          {fields.map(field => {
                            const visible = isFieldVisible(section, field)
                            const mandatory = isFieldMandatory(section, field)
                            const defaultMandatory = getDefaultMandatory(section, field)
                            
                            return (
                              <div 
                                key={field} 
                                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <Label className="font-medium capitalize text-sm text-gray-900">
                                      {field.replace(/_/g, ' ')}
                                    </Label>
                                    {visible && mandatory && (
                                      <Badge variant="destructive" className="text-[10px]">
                                        Required
                                      </Badge>
                                    )}
                                    {visible && !mandatory && (
                                      <Badge variant="outline" className="text-[10px] text-gray-500">
                                        Optional
                                      </Badge>
                                    )}
                                    {!visible && (
                                      <Badge variant="outline" className="text-[10px] text-gray-400">
                                        Hidden
                                      </Badge>
                                    )}
                                  </div>
                                  {visible && (
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                      Default: {defaultMandatory ? 'Required' : 'Optional'}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-4">
                                  {/* Visibility Toggle */}
                                  <div className="flex items-center gap-2">
                                    <Eye className={`h-4 w-4 ${visible ? 'text-green-600' : 'text-gray-400'}`} />
                                    <Switch
                                      checked={visible}
                                      onCheckedChange={() => toggleFieldVisibility(section, field)}
                                      className="data-[state=checked]:bg-green-500"
                                    />
                                  </div>
                                  {/* Mandatory Toggle - only enabled when visible */}
                                  <div className="flex items-center gap-2">
                                    <Lock className={`h-4 w-4 ${mandatory && visible ? 'text-red-600' : 'text-gray-400'}`} />
                                    <Switch
                                      checked={mandatory && visible}
                                      onCheckedChange={() => toggleMandatory(section, field)}
                                      disabled={!visible}
                                      className={`${!visible ? 'opacity-50 cursor-not-allowed' : ''} data-[state=checked]:bg-red-500`}
                                    />
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">How it works</p>
                    <div className="mt-1 text-xs text-blue-700 space-y-1">
                      <p>• Toggle <span className="font-semibold">visibility</span> to show/hide fields in employee profiles</p>
                      <p>• When visible, toggle <span className="font-semibold">required</span> to make fields mandatory</p>
                      <p>• Hidden fields are completely ignored in employee profiles</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFieldSettingsDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveFieldSettings}
              disabled={isSavingFieldSettings || fieldSettingsLoading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isSavingFieldSettings ? "Saving..." : "Save Settings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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