// "use client"

// import { useState, useEffect } from "react"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Separator } from "@/components/ui/separator"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { Building2, MapPin, Clock, Gauge, Shield, Calendar, Users, Settings, Pencil, RefreshCw, Save, X } from "lucide-react"
// import { useAuth, Company } from "@/context/AuthContext"
// import { Input } from "@/components/ui/input"
// import { Button } from "@/components/ui/button"
// import Image from "next/image"
// import { useRouter } from "next/navigation"
// import { toast } from "sonner"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// export default function CompanyProfilePage() {
//   const { company, updateCompany } = useAuth()
//   const router = useRouter()
//   const [editMode, setEditMode] = useState(false)
//   const [formData, setFormData] = useState<Company | null>(company)
//   const [imageError, setImageError] = useState(false)
//   const [isSaving, setIsSaving] = useState(false)
//   const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)

//   // Update formData when company changes
//   useEffect(() => {
//     if (company) {
//       setFormData(company)
//       setImageError(false)
//     }
//   }, [company])

//   // Get company logo URL
//   const getLogoUrl = () => {
//     if (formData?.company_img) {
//       return formData.company_img.startsWith("http")
//         ? formData.company_img
//         : `${formData.mediaBaseUrl}${formData.company_img}`
//     }
//     return `${formData?.mediaBaseUrl}/media/default_company.png`
//   }

//   const showLogo = formData?.company_img && !imageError

//   const handleChange = (field: keyof Company, value: any) => {
//     if (formData) {
//       setFormData({ ...formData, [field]: value })
//     }
//   }

//   // Get display label for punch mode
//   const getPunchModeLabel = (mode: string) => {
//     switch (mode) {
//       case "s": return "Single"
//       case "m": return "Multiple"
//       default: return mode
//     }
//   }

//   // PUT API call to update company
//   const handleSave = async () => {
//     if (!formData || !company) {
//       toast.error("Missing company data")
//       return
//     }

//     setIsSaving(true)

//     try {
//       // Prepare the payload according to your backend expectations
//       const payload = {
//         companyId: company.id,
//         company_name: formData.company_name,
//         latitude: formData.latitude,
//         longitude: formData.longitude,
//         perimeter: formData.perimeter,
//         daily_working_hours: formData.daily_working_hours,
//         work_summary_interval: formData.work_summary_interval,
//         is_admin: formData.is_admin,
//         punch_mode: formData.punch_mode,
//         // Note: company_img is handled separately for file upload
//       }

//       console.log("💾 Saving company data:", payload)

//       let response

//       if (selectedImageFile) {
//         // Handle file upload with FormData
//         const formDataToSend = new FormData()
//         formDataToSend.append("company_img", selectedImageFile)
//         formDataToSend.append("companyId", company.id.toString())
//         formDataToSend.append("company_name", formData.company_name)
        
//         // Append other fields if they exist
//         if (formData.latitude) formDataToSend.append("latitude", formData.latitude)
//         if (formData.longitude) formDataToSend.append("longitude", formData.longitude)
//         if (formData.perimeter) formDataToSend.append("perimeter", formData.perimeter.toString())
//         if (formData.daily_working_hours) formDataToSend.append("daily_working_hours", formData.daily_working_hours.toString())
//         if (formData.work_summary_interval) formDataToSend.append("work_summary_interval", formData.work_summary_interval)
//         formDataToSend.append("is_admin", formData.is_admin.toString())
//         formDataToSend.append("punch_mode", formData.punch_mode)

//         response = await fetch("/api/company", {
//           method: "PUT",
//           body: formDataToSend,
//         })
//       } else {
//         // Handle JSON data update
//         response = await fetch("/api/company", {
//           method: "PUT",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(payload),
//         })
//       }

//       const result = await response.json()
//       console.log("💾 Save response:", result)

//       if (result.success) {
//         toast.success("Company profile updated successfully!")
//         setEditMode(false)
//         setSelectedImageFile(null)
        
//         // Update the company context with new data
//         if (updateCompany && result.data) {
//           updateCompany(result.data)
//         }
        
//         // Refresh the page to get updated data
//         setTimeout(() => {
//           router.refresh()
//         }, 500)
//       } else {
//         toast.error(result.message || "Failed to update company profile")
//       }
//     } catch (error) {
//       console.error("Error updating company profile:", error)
//       toast.error("Failed to update company profile")
//     } finally {
//       setIsSaving(false)
//     }
//   }

//   const handleCancel = () => {
//     setFormData(company)
//     setEditMode(false)
//     setImageError(false)
//     setSelectedImageFile(null)
//   }

//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (file) {
//       setSelectedImageFile(file)
//       // Create a preview URL for the image
//       const reader = new FileReader()
//       reader.onload = () => {
//         if (formData) {
//           setFormData({ 
//             ...formData, 
//             company_img: reader.result as string 
//           })
//         }
//         setImageError(false)
//       }
//       reader.readAsDataURL(file)
//     }
//   }

//   const handleForceRefresh = () => {
//     router.refresh()
//   }

//   if (!company || !formData) {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <div className="text-center space-y-4">
//           <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
//             <Building2 className="w-8 h-8 text-muted-foreground" />
//           </div>
//           <div className="space-y-2">
//             <h3 className="text-lg font-semibold">No Company Data</h3>
//             <p className="text-sm text-muted-foreground">
//               Company information is not available at the moment.
//             </p>
//             <Button 
//               onClick={() => router.refresh()} 
//               variant="outline" 
//               size="sm"
//             >
//               Refresh Page
//             </Button>
//           </div>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-background">
//       {/* Header with Company Info and Refresh Button */}
//       <div className="border-b bg-card">
//         <div className="container mx-auto px-6 py-6">
//           <div className="flex justify-between items-start mb-4">
//             <div>
//               <h1 className="text-2xl font-bold">Company Profile</h1>
//               <p className="text-muted-foreground">
//                 Managing company settings and information
//               </p>
//             </div>
//             <div className="flex gap-2">
//               {/* Refresh button to fix stale data */}
//               <Button 
//                 variant="outline" 
//                 size="sm" 
//                 onClick={handleForceRefresh}
//               >
//                 <RefreshCw className="w-4 h-4 mr-1" />
//                 Refresh
//               </Button>
//               {editMode ? (
//                 <>
//                   <Button 
//                     size="sm" 
//                     variant="outline" 
//                     onClick={handleCancel}
//                     disabled={isSaving}
//                   >
//                     <X className="w-4 h-4 mr-1" />
//                     Cancel
//                   </Button>
//                   <Button 
//                     size="sm" 
//                     variant="default" 
//                     onClick={handleSave}
//                     disabled={isSaving}
//                   >
//                     {isSaving ? (
//                       <>
//                         <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
//                         Saving...
//                       </>
//                     ) : (
//                       <>
//                         <Save className="w-4 h-4 mr-1" />
//                         Save
//                       </>
//                     )}
//                   </Button>
//                 </>
//               ) : (
//                 <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
//                   <Pencil className="w-4 h-4 mr-1" /> Edit
//                 </Button>
//               )}
//             </div>
//           </div>

//           <div className="flex items-center gap-6">
//             <div className="relative">
//               <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
//                 {editMode ? (
//                   <div className="flex flex-col items-center justify-center w-20 h-20 gap-1 p-1">
//                     <div className="text-xs text-center mb-1">Company Logo</div>
//                     <input
//                       type="file"
//                       accept="image/*"
//                       onChange={handleImageChange}
//                       className="text-xs w-full"
//                     />
//                     {selectedImageFile && (
//                       <div className="text-xs text-green-600">
//                         {selectedImageFile.name}
//                       </div>
//                     )}
//                   </div>
//                 ) : showLogo ? (
//                   <div className="relative w-20 h-20 rounded-full overflow-hidden">
//                     <Image
//                       src={getLogoUrl()}
//                       alt={formData.company_name}
//                       fill
//                       className="object-cover w-full h-full"
//                       onError={() => setImageError(true)}
//                     />
//                   </div>
//                 ) : (
//                   <AvatarFallback className="text-2xl font-bold bg-blue-500 text-white">
//                     {formData.company_name.charAt(0).toUpperCase()}
//                   </AvatarFallback>
//                 )}
//               </Avatar>
//               {formData.is_admin && (
//                 <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
//                   <Shield className="w-3 h-3 text-white" />
//                 </div>
//               )}
//             </div>
//             <div className="flex-1 space-y-2">
//               <div className="flex items-center gap-3">
//                 {editMode ? (
//                   <Input
//                     value={formData.company_name}
//                     onChange={(e) => handleChange("company_name", e.target.value)}
//                     placeholder="Company Name"
//                     className="text-3xl font-bold h-12"
//                   />
//                 ) : (
//                   <h1 className="text-3xl font-bold">{formData.company_name}</h1>
//                 )}
//                 <Badge variant="outline" className="text-xs">
//                   ID: {formData.id}
//                 </Badge>
//               </div>
//               <div className="flex items-center gap-2">
//                 {formData.is_admin && (
//                   <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
//                     <Shield className="w-3 h-3 mr-1" />
//                     Admin Access
//                   </Badge>
//                 )}
//                 <Badge className="bg-yellow-100 text-yellow-800">
//                   <Building2 className="w-3 h-3 mr-1" />
//                   {getPunchModeLabel(formData.punch_mode)}
//                 </Badge>
//                 {/* Current company indicator */}
//                 <Badge variant="outline" className="text-green-600 border-green-200">
//                   Current Company
//                 </Badge>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="container mx-auto px-6 py-8">
//         <div className="grid gap-6 lg:grid-cols-3">
//           {/* Location & Boundaries */}
//           <Card className="border-0 shadow-sm bg-card">
//             <CardHeader className="pb-4">
//               <CardTitle className="flex items-center gap-2 text-lg">
//                 <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
//                   <MapPin className="w-4 h-4 text-blue-600" />
//                 </div>
//                 Location & Boundaries
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
//                   <span className="text-sm font-medium">Latitude</span>
//                   {editMode ? (
//                     <Input
//                       value={formData.latitude || ""}
//                       onChange={(e) => handleChange("latitude", e.target.value)}
//                       className="w-32 text-right"
//                       placeholder="e.g., 40.7128"
//                     />
//                   ) : (
//                     <code className="text-sm bg-background px-2 py-1 rounded border">
//                       {formData.latitude || "Not set"}
//                     </code>
//                   )}
//                 </div>

//                 <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
//                   <span className="text-sm font-medium">Longitude</span>
//                   {editMode ? (
//                     <Input
//                       value={formData.longitude || ""}
//                       onChange={(e) => handleChange("longitude", e.target.value)}
//                       className="w-32 text-right"
//                       placeholder="e.g., -74.0060"
//                     />
//                   ) : (
//                     <code className="text-sm bg-background px-2 py-1 rounded border">
//                       {formData.longitude || "Not set"}
//                     </code>
//                   )}
//                 </div>

//                 <Separator />
//                 <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
//                   <span className="text-sm font-medium">Perimeter</span>
//                   {editMode ? (
//                     <Input
//                       type="number"
//                       value={formData.perimeter || ""}
//                       onChange={(e) => handleChange("perimeter", parseFloat(e.target.value) || 0)}
//                       className="w-24 text-right"
//                       placeholder="km"
//                     />
//                   ) : (
//                     <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
//                       <Gauge className="w-3 h-3 mr-1" />
//                       {formData.perimeter || 0} km
//                     </Badge>
//                   )}
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Work Schedule */}
//           <Card className="border-0 shadow-sm bg-card">
//             <CardHeader className="pb-4">
//               <CardTitle className="flex items-center gap-2 text-lg">
//                 <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
//                   <Clock className="w-4 h-4 text-yellow-600" />
//                 </div>
//                 Work Schedule
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
//                   <span className="text-sm font-medium">Daily Hours</span>
//                   {editMode ? (
//                     <Input
//                       type="number"
//                       value={formData.daily_working_hours || ""}
//                       onChange={(e) => handleChange("daily_working_hours", parseFloat(e.target.value) || 0)}
//                       className="w-24 text-right"
//                       placeholder="hours"
//                     />
//                   ) : (
//                     <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
//                       <Clock className="w-3 h-3 mr-1" />
//                       {formData.daily_working_hours || 0}h
//                     </Badge>
//                   )}
//                 </div>
//                 <Separator />
//                 <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
//                   <span className="text-sm font-medium">Summary Interval</span>
//                   {editMode ? (
//                     <Select
//                       value={formData.work_summary_interval || "daily"}
//                       onValueChange={(value) => handleChange("work_summary_interval", value)}
//                     >
//                       <SelectTrigger className="w-32">
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="daily">Daily</SelectItem>
//                         <SelectItem value="weekly">Weekly</SelectItem>
//                         <SelectItem value="monthly">Monthly</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   ) : (
//                     <Badge className="bg-yellow-100 text-yellow-800">
//                       <Calendar className="w-3 h-3 mr-1" />
//                       {formData.work_summary_interval || "daily"}
//                     </Badge>
//                   )}
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           {/* System Settings */}
//           <Card className="border-0 shadow-sm bg-card">
//             <CardHeader className="pb-4">
//               <CardTitle className="flex items-center gap-2 text-lg">
//                 <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
//                   <Settings className="w-4 h-4 text-blue-600" />
//                 </div>
//                 System Settings
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
//                   <div className="flex items-center gap-2">
//                     <Shield className="w-4 h-4 text-muted-foreground" />
//                     <span className="text-sm font-medium">Admin Rights</span>
//                   </div>
//                   {editMode ? (
//                     <Select
//                       value={formData.is_admin ? "true" : "false"}
//                       onValueChange={(value) => handleChange("is_admin", value === "true")}
//                     >
//                       <SelectTrigger className="w-24">
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="true">Enabled</SelectItem>
//                         <SelectItem value="false">Disabled</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   ) : (
//                     <Badge className={formData.is_admin ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-muted text-muted-foreground"}>
//                       {formData.is_admin ? "Enabled" : "Disabled"}
//                     </Badge>
//                   )}
//                 </div>

//                 <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
//                   <div className="flex items-center gap-2">
//                     <Users className="w-4 h-4 text-muted-foreground" />
//                     <span className="text-sm font-medium">Punch Mode</span>
//                   </div>
//                   {editMode ? (
//                     <Select
//                       value={formData.punch_mode || "s"}
//                       onValueChange={(value) => handleChange("punch_mode", value)}
//                     >
//                       <SelectTrigger className="w-32">
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="s">Single (s)</SelectItem>
//                         <SelectItem value="m">Multiple (m)</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   ) : (
//                     <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
//                       {getPunchModeLabel(formData.punch_mode)} ({formData.punch_mode})
//                     </Badge>
//                   )}
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   )
// }


// //first updated
// "use client"

// import { useState, useEffect } from "react"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Separator } from "@/components/ui/separator"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { Building2, MapPin, Clock, Gauge, Shield, Calendar, Users, Settings, Pencil, RefreshCw, Save, X, MessageSquare, Phone } from "lucide-react"
// import { useAuth, Company } from "@/context/AuthContext"
// import { Input } from "@/components/ui/input"
// import { Button } from "@/components/ui/button"
// import { Switch } from "@/components/ui/switch" // Make sure you have this component
// import { Label } from "@/components/ui/label" // Make sure you have this component
// import Image from "next/image"
// import { useRouter } from "next/navigation"
// import { toast } from "sonner"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// export default function CompanyProfilePage() {
//   const { company, updateCompany } = useAuth()
//   const router = useRouter()
//   const [editMode, setEditMode] = useState(false)
//   const [formData, setFormData] = useState<Company | null>(company)
//   const [imageError, setImageError] = useState(false)
//   const [isSaving, setIsSaving] = useState(false)
//   const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)

//   // Update formData when company changes
//   useEffect(() => {
//     if (company) {
//       setFormData(company)
//       setImageError(false)
//     }
//   }, [company])

//   // Get company logo URL
//   const getLogoUrl = () => {
//     if (formData?.company_img) {
//       return formData.company_img.startsWith("http")
//         ? formData.company_img
//         : `${formData.mediaBaseUrl}${formData.company_img}`
//     }
//     return `${formData?.mediaBaseUrl}/media/default_company.png`
//   }

//   const showLogo = formData?.company_img && !imageError

//   const handleChange = (field: keyof Company, value: any) => {
//     if (formData) {
//       setFormData({ ...formData, [field]: value })
//     }
//   }

//   // Get display label for punch mode
//   const getPunchModeLabel = (mode: string) => {
//     switch (mode) {
//       case "s": return "Single"
//       case "m": return "Multiple"
//       default: return mode
//     }
//   }

//   // PUT API call to update company
//   const handleSave = async () => {
//     if (!formData || !company) {
//       toast.error("Missing company data")
//       return
//     }

//     setIsSaving(true)

//     try {
//       // Prepare the payload according to your backend expectations
//       const payload = {
//         companyId: company.id,
//         company_name: formData.company_name,
//         latitude: formData.latitude,
//         longitude: formData.longitude,
//         perimeter: formData.perimeter,
//         daily_working_hours: formData.daily_working_hours,
//         work_summary_interval: formData.work_summary_interval,
//         is_admin: formData.is_admin,
//         punch_mode: formData.punch_mode,
//         force_enable_sms: formData.force_enable_sms || false,
//         force_enable_whatsapp: formData.force_enable_whatsapp || false,
//         // Note: company_img is handled separately for file upload
//       }

//       console.log("💾 Saving company data:", payload)

//       let response

//       if (selectedImageFile) {
//         // Handle file upload with FormData
//         const formDataToSend = new FormData()
//         formDataToSend.append("company_img", selectedImageFile)
//         formDataToSend.append("companyId", company.id.toString())
//         formDataToSend.append("company_name", formData.company_name)
        
//         // Append other fields if they exist
//         if (formData.latitude) formDataToSend.append("latitude", formData.latitude)
//         if (formData.longitude) formDataToSend.append("longitude", formData.longitude)
//         if (formData.perimeter) formDataToSend.append("perimeter", formData.perimeter.toString())
//         if (formData.daily_working_hours) formDataToSend.append("daily_working_hours", formData.daily_working_hours.toString())
//         if (formData.work_summary_interval) formDataToSend.append("work_summary_interval", formData.work_summary_interval)
//         formDataToSend.append("is_admin", formData.is_admin.toString())
//         formDataToSend.append("punch_mode", formData.punch_mode)
//         formDataToSend.append("force_enable_sms", (formData.force_enable_sms || false).toString())
//         formDataToSend.append("force_enable_whatsapp", (formData.force_enable_whatsapp || false).toString())

//         response = await fetch("/api/company", {
//           method: "PUT",
//           body: formDataToSend,
//         })
//       } else {
//         // Handle JSON data update
//         response = await fetch("/api/company", {
//           method: "PUT",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(payload),
//         })
//       }

//       const result = await response.json()
//       console.log("💾 Save response:", result)

//       if (result.success) {
//         toast.success("Company profile updated successfully!")
//         setEditMode(false)
//         setSelectedImageFile(null)
        
//         // Update the company context with new data
//         if (updateCompany && result.data) {
//           updateCompany(result.data)
//         }
        
//         // Refresh the page to get updated data
//         setTimeout(() => {
//           router.refresh()
//         }, 500)
//       } else {
//         toast.error(result.message || "Failed to update company profile")
//       }
//     } catch (error) {
//       console.error("Error updating company profile:", error)
//       toast.error("Failed to update company profile")
//     } finally {
//       setIsSaving(false)
//     }
//   }

//   const handleCancel = () => {
//     setFormData(company)
//     setEditMode(false)
//     setImageError(false)
//     setSelectedImageFile(null)
//   }

//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (file) {
//       setSelectedImageFile(file)
//       // Create a preview URL for the image
//       const reader = new FileReader()
//       reader.onload = () => {
//         if (formData) {
//           setFormData({ 
//             ...formData, 
//             company_img: reader.result as string 
//           })
//         }
//         setImageError(false)
//       }
//       reader.readAsDataURL(file)
//     }
//   }

//   const handleForceRefresh = () => {
//     router.refresh()
//   }

//   if (!company || !formData) {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <div className="text-center space-y-4">
//           <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
//             <Building2 className="w-8 h-8 text-muted-foreground" />
//           </div>
//           <div className="space-y-2">
//             <h3 className="text-lg font-semibold">No Company Data</h3>
//             <p className="text-sm text-muted-foreground">
//               Company information is not available at the moment.
//             </p>
//             <Button 
//               onClick={() => router.refresh()} 
//               variant="outline" 
//               size="sm"
//             >
//               Refresh Page
//             </Button>
//           </div>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-background">
//       {/* Header with Company Info and Refresh Button */}
//       <div className="border-b bg-card">
//         <div className="container mx-auto px-6 py-6">
//           <div className="flex justify-between items-start mb-4">
//             <div>
//               <h1 className="text-2xl font-bold">Company Profile</h1>
//               <p className="text-muted-foreground">
//                 Managing company settings and information
//               </p>
//             </div>
//             <div className="flex gap-2">
//               {/* Refresh button to fix stale data */}
//               <Button 
//                 variant="outline" 
//                 size="sm" 
//                 onClick={handleForceRefresh}
//               >
//                 <RefreshCw className="w-4 h-4 mr-1" />
//                 Refresh
//               </Button>
//               {editMode ? (
//                 <>
//                   <Button 
//                     size="sm" 
//                     variant="outline" 
//                     onClick={handleCancel}
//                     disabled={isSaving}
//                   >
//                     <X className="w-4 h-4 mr-1" />
//                     Cancel
//                   </Button>
//                   <Button 
//                     size="sm" 
//                     variant="default" 
//                     onClick={handleSave}
//                     disabled={isSaving}
//                   >
//                     {isSaving ? (
//                       <>
//                         <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
//                         Saving...
//                       </>
//                     ) : (
//                       <>
//                         <Save className="w-4 h-4 mr-1" />
//                         Save
//                       </>
//                     )}
//                   </Button>
//                 </>
//               ) : (
//                 <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
//                   <Pencil className="w-4 h-4 mr-1" /> Edit
//                 </Button>
//               )}
//             </div>
//           </div>

//           <div className="flex items-center gap-6">
//             <div className="relative">
//               <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
//                 {editMode ? (
//                   <div className="flex flex-col items-center justify-center w-20 h-20 gap-1 p-1">
//                     <div className="text-xs text-center mb-1">Company Logo</div>
//                     <input
//                       type="file"
//                       accept="image/*"
//                       onChange={handleImageChange}
//                       className="text-xs w-full"
//                     />
//                     {selectedImageFile && (
//                       <div className="text-xs text-green-600">
//                         {selectedImageFile.name}
//                       </div>
//                     )}
//                   </div>
//                 ) : showLogo ? (
//                   <div className="relative w-20 h-20 rounded-full overflow-hidden">
//                     <Image
//                       src={getLogoUrl()}
//                       alt={formData.company_name}
//                       fill
//                       className="object-cover w-full h-full"
//                       onError={() => setImageError(true)}
//                     />
//                   </div>
//                 ) : (
//                   <AvatarFallback className="text-2xl font-bold bg-blue-500 text-white">
//                     {formData.company_name.charAt(0).toUpperCase()}
//                   </AvatarFallback>
//                 )}
//               </Avatar>
//               {formData.is_admin && (
//                 <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
//                   <Shield className="w-3 h-3 text-white" />
//                 </div>
//               )}
//             </div>
//             <div className="flex-1 space-y-2">
//               <div className="flex items-center gap-3">
//                 {editMode ? (
//                   <Input
//                     value={formData.company_name}
//                     onChange={(e) => handleChange("company_name", e.target.value)}
//                     placeholder="Company Name"
//                     className="text-3xl font-bold h-12"
//                   />
//                 ) : (
//                   <h1 className="text-3xl font-bold">{formData.company_name}</h1>
//                 )}
//                 <Badge variant="outline" className="text-xs">
//                   ID: {formData.id}
//                 </Badge>
//               </div>
//               <div className="flex items-center gap-2">
//                 {formData.is_admin && (
//                   <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
//                     <Shield className="w-3 h-3 mr-1" />
//                     Admin Access
//                   </Badge>
//                 )}
//                 <Badge className="bg-yellow-100 text-yellow-800">
//                   <Building2 className="w-3 h-3 mr-1" />
//                   {getPunchModeLabel(formData.punch_mode)}
//                 </Badge>
//                 {/* Current company indicator */}
//                 <Badge variant="outline" className="text-green-600 border-green-200">
//                   Current Company
//                 </Badge>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="container mx-auto px-6 py-8">
//         <div className="grid gap-6 lg:grid-cols-3">
//           {/* Location & Boundaries */}
//           <Card className="border-0 shadow-sm bg-card">
//             <CardHeader className="pb-4">
//               <CardTitle className="flex items-center gap-2 text-lg">
//                 <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
//                   <MapPin className="w-4 h-4 text-blue-600" />
//                 </div>
//                 Location & Boundaries
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
//                   <span className="text-sm font-medium">Latitude</span>
//                   {editMode ? (
//                     <Input
//                       value={formData.latitude || ""}
//                       onChange={(e) => handleChange("latitude", e.target.value)}
//                       className="w-32 text-right"
//                       placeholder="e.g., 40.7128"
//                     />
//                   ) : (
//                     <code className="text-sm bg-background px-2 py-1 rounded border">
//                       {formData.latitude || "Not set"}
//                     </code>
//                   )}
//                 </div>

//                 <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
//                   <span className="text-sm font-medium">Longitude</span>
//                   {editMode ? (
//                     <Input
//                       value={formData.longitude || ""}
//                       onChange={(e) => handleChange("longitude", e.target.value)}
//                       className="w-32 text-right"
//                       placeholder="e.g., -74.0060"
//                     />
//                   ) : (
//                     <code className="text-sm bg-background px-2 py-1 rounded border">
//                       {formData.longitude || "Not set"}
//                     </code>
//                   )}
//                 </div>

//                 <Separator />
//                 <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
//                   <span className="text-sm font-medium">Perimeter</span>
//                   {editMode ? (
//                     <Input
//                       type="number"
//                       value={formData.perimeter || ""}
//                       onChange={(e) => handleChange("perimeter", parseFloat(e.target.value) || 0)}
//                       className="w-24 text-right"
//                       placeholder="km"
//                     />
//                   ) : (
//                     <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
//                       <Gauge className="w-3 h-3 mr-1" />
//                       {formData.perimeter || 0} km
//                     </Badge>
//                   )}
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Work Schedule */}
//           <Card className="border-0 shadow-sm bg-card">
//             <CardHeader className="pb-4">
//               <CardTitle className="flex items-center gap-2 text-lg">
//                 <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
//                   <Clock className="w-4 h-4 text-yellow-600" />
//                 </div>
//                 Work Schedule
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
//                   <span className="text-sm font-medium">Daily Hours</span>
//                   {editMode ? (
//                     <Input
//                       type="number"
//                       value={formData.daily_working_hours || ""}
//                       onChange={(e) => handleChange("daily_working_hours", parseFloat(e.target.value) || 0)}
//                       className="w-24 text-right"
//                       placeholder="hours"
//                     />
//                   ) : (
//                     <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
//                       <Clock className="w-3 h-3 mr-1" />
//                       {formData.daily_working_hours || 0}h
//                     </Badge>
//                   )}
//                 </div>
//                 <Separator />
//                 <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
//                   <span className="text-sm font-medium">Summary Interval</span>
//                   {editMode ? (
//                     <Select
//                       value={formData.work_summary_interval || "daily"}
//                       onValueChange={(value) => handleChange("work_summary_interval", value)}
//                     >
//                       <SelectTrigger className="w-32">
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="daily">Daily</SelectItem>
//                         <SelectItem value="weekly">Weekly</SelectItem>
//                         <SelectItem value="monthly">Monthly</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   ) : (
//                     <Badge className="bg-yellow-100 text-yellow-800">
//                       <Calendar className="w-3 h-3 mr-1" />
//                       {formData.work_summary_interval || "daily"}
//                     </Badge>
//                   )}
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           {/* System Settings */}
//           <Card className="border-0 shadow-sm bg-card">
//             <CardHeader className="pb-4">
//               <CardTitle className="flex items-center gap-2 text-lg">
//                 <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
//                   <Settings className="w-4 h-4 text-blue-600" />
//                 </div>
//                 System Settings
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
//                   <div className="flex items-center gap-2">
//                     <Shield className="w-4 h-4 text-muted-foreground" />
//                     <span className="text-sm font-medium">Admin Rights</span>
//                   </div>
//                   {editMode ? (
//                     <Select
//                       value={formData.is_admin ? "true" : "false"}
//                       onValueChange={(value) => handleChange("is_admin", value === "true")}
//                     >
//                       <SelectTrigger className="w-24">
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="true">Enabled</SelectItem>
//                         <SelectItem value="false">Disabled</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   ) : (
//                     <Badge className={formData.is_admin ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-muted text-muted-foreground"}>
//                       {formData.is_admin ? "Enabled" : "Disabled"}
//                     </Badge>
//                   )}
//                 </div>

//                 <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
//                   <div className="flex items-center gap-2">
//                     <Users className="w-4 h-4 text-muted-foreground" />
//                     <span className="text-sm font-medium">Punch Mode</span>
//                   </div>
//                   {editMode ? (
//                     <Select
//                       value={formData.punch_mode || "s"}
//                       onValueChange={(value) => handleChange("punch_mode", value)}
//                     >
//                       <SelectTrigger className="w-32">
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="s">Single (s)</SelectItem>
//                         <SelectItem value="m">Multiple (m)</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   ) : (
//                     <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
//                       {getPunchModeLabel(formData.punch_mode)} ({formData.punch_mode})
//                     </Badge>
//                   )}
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Notification Overrides */}
//           <Card className="border-0 shadow-sm bg-card lg:col-span-3">
//             <CardHeader className="pb-4">
//               <CardTitle className="flex items-center gap-2 text-lg">
//                 <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
//                   <MessageSquare className="w-4 h-4 text-green-600" />
//                 </div>
//                 Notification 
//                 {/* <Badge variant="outline" className="ml-2 text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
//                   Overrides Individual Settings
//                 </Badge> */}
//               </CardTitle>
//               {/* <p className="text-sm text-muted-foreground mt-2">
//                 When enabled, these settings will override individual employee preferences and force notifications for all employees.
//               </p> */}
//             </CardHeader>
//             <CardContent>
//               <div className="grid gap-6 md:grid-cols-2">
//                 {/* SMS Override */}
//                 <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
//                   <div className="flex items-center gap-3">
//                     <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
//                       <Phone className="w-5 h-5 text-blue-600" />
//                     </div>
//                     <div>
//                       <Label htmlFor="sms-override" className="text-base font-medium">
//                         Force Enable SMS
//                       </Label>
//                       {/* <p className="text-sm text-muted-foreground mt-1">
//                         All employees will receive SMS notifications regardless of their individual settings
//                       </p> */}
//                     </div>
//                   </div>
//                   {editMode ? (
//                     <Switch
//                       id="sms-override"
//                       checked={formData.force_enable_sms || false}
//                       onCheckedChange={(checked) => handleChange("force_enable_sms", checked)}
//                     />
//                   ) : (
//                     <Badge className={formData.force_enable_sms ? "bg-green-500 hover:bg-green-600 text-white" : "bg-muted text-muted-foreground"}>
//                       {formData.force_enable_sms ? "Enabled" : "Disabled"}
//                     </Badge>
//                   )}
//                 </div>

//                 {/* WhatsApp Override */}
//                 <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
//                   <div className="flex items-center gap-3">
//                     <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
//                       <MessageSquare className="w-5 h-5 text-green-600" />
//                     </div>
//                     <div>
//                       <Label htmlFor="whatsapp-override" className="text-base font-medium">
//                         Force Enable WhatsApp
//                       </Label>
//                       {/* <p className="text-sm text-muted-foreground mt-1">
//                         All employees will receive WhatsApp notifications regardless of their individual settings
//                       </p> */}
//                     </div>
//                   </div>
//                   {editMode ? (
//                     <Switch
//                       id="whatsapp-override"
//                       checked={formData.force_enable_whatsapp || false}
//                       onCheckedChange={(checked) => handleChange("force_enable_whatsapp", checked)}
//                     />
//                   ) : (
//                     <Badge className={formData.force_enable_whatsapp ? "bg-green-500 hover:bg-green-600 text-white" : "bg-muted text-muted-foreground"}>
//                       {formData.force_enable_whatsapp ? "Enabled" : "Disabled"}
//                     </Badge>
//                   )}
//                 </div>
//               </div>

//               {/* Information Box */}
//               {editMode && (
//                 <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
//                   <div className="flex items-start gap-3">
//                     <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
//                     <div>
//                       <h4 className="text-sm font-medium text-blue-800">Override Behavior</h4>
//                       {/* <p className="text-sm text-blue-700 mt-1">
//                         When enabled, these settings will take precedence over individual employee notification preferences. 
//                         Employees will receive notifications through the enabled channels even if they have disabled them in their personal settings.
//                       </p> */}
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   )
// }

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Building2, MapPin, Clock, Gauge, Shield, Calendar, Users, Settings, Pencil, RefreshCw, Save, X, MessageSquare, Phone, Wrench } from "lucide-react"
import { useAuth, Company } from "@/context/AuthContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import FixPunch from "@/components/fix-punch"
import { CheckCircle, XCircle } from "lucide-react"

export default function CompanyProfilePage() {
  const { company, updateCompany } = useAuth()
  const router = useRouter()
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState<Company | null>(company)
  const [imageError, setImageError] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  // Add this near your other useState declarations
  const [fixPunchResult, setFixPunchResult] = useState<any>(null)
  const [showFixResult, setShowFixResult] = useState(false)

  // Update formData when company changes
  useEffect(() => {
    if (company) {
      setFormData(company)
      setImageError(false)
    }
  }, [company])

  // Get company logo URL
  const getLogoUrl = () => {
    if (formData?.company_img) {
      return formData.company_img.startsWith("http")
        ? formData.company_img
        : `${formData.mediaBaseUrl}${formData.company_img}`
    }
    return `${formData?.mediaBaseUrl}/media/default_company.png`
  }

  const showLogo = formData?.company_img && !imageError

  const handleChange = (field: keyof Company, value: any) => {
    if (formData) {
      setFormData({ ...formData, [field]: value })
    }
  }

  // Get display label for punch mode
  const getPunchModeLabel = (mode: string) => {
    switch (mode) {
      case "s": return "Single"
      case "m": return "Multiple"
      default: return mode
    }
  }

  // PUT API call to update company
  const handleSave = async () => {
    if (!formData || !company) {
      toast.error("Missing company data")
      return
    }

    setIsSaving(true)

    try {
      // Prepare the payload according to your backend expectations
      const payload = {
        companyId: company.id,
        company_name: formData.company_name,
        latitude: formData.latitude,
        longitude: formData.longitude,
        perimeter: formData.perimeter,
        daily_working_hours: formData.daily_working_hours,
        work_summary_interval: formData.work_summary_interval,
        is_admin: formData.is_admin,
        punch_mode: formData.punch_mode,
        force_enable_sms: formData.force_enable_sms || false,
        force_enable_whatsapp: formData.force_enable_whatsapp || false,
      }

      console.log("💾 Saving company data:", payload)

      let response

      if (selectedImageFile) {
        // Handle file upload with FormData
        const formDataToSend = new FormData()
        formDataToSend.append("company_img", selectedImageFile)
        formDataToSend.append("companyId", company.id.toString())
        formDataToSend.append("company_name", formData.company_name)
        
        // Append other fields if they exist
        if (formData.latitude) formDataToSend.append("latitude", formData.latitude)
        if (formData.longitude) formDataToSend.append("longitude", formData.longitude)
        if (formData.perimeter) formDataToSend.append("perimeter", formData.perimeter.toString())
        if (formData.daily_working_hours) formDataToSend.append("daily_working_hours", formData.daily_working_hours.toString())
        if (formData.work_summary_interval) formDataToSend.append("work_summary_interval", formData.work_summary_interval)
        formDataToSend.append("is_admin", formData.is_admin.toString())
        formDataToSend.append("punch_mode", formData.punch_mode)
        formDataToSend.append("force_enable_sms", (formData.force_enable_sms || false).toString())
        formDataToSend.append("force_enable_whatsapp", (formData.force_enable_whatsapp || false).toString())

        response = await fetch("/api/company", {
          method: "PUT",
          body: formDataToSend,
        })
      } else {
        // Handle JSON data update
        response = await fetch("/api/company", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })
      }

      const result = await response.json()
      console.log("💾 Save response:", result)

      if (result.success) {
        toast.success("Company profile updated successfully!")
        setEditMode(false)
        setSelectedImageFile(null)
        
        // Update the company context with new data
        if (updateCompany && result.data) {
          updateCompany(result.data)
        }
        
        // Refresh the page to get updated data
        setTimeout(() => {
          router.refresh()
        }, 500)
      } else {
        toast.error(result.message || "Failed to update company profile")
      }
    } catch (error) {
      console.error("Error updating company profile:", error)
      toast.error("Failed to update company profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData(company)
    setEditMode(false)
    setImageError(false)
    setSelectedImageFile(null)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImageFile(file)
      // Create a preview URL for the image
      const reader = new FileReader()
      reader.onload = () => {
        if (formData) {
          setFormData({ 
            ...formData, 
            company_img: reader.result as string 
          })
        }
        setImageError(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleForceRefresh = () => {
    router.refresh()
  }

  if (!company || !formData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">No Company Data</h3>
            <p className="text-sm text-muted-foreground">
              Company information is not available at the moment.
            </p>
            <Button 
              onClick={() => router.refresh()} 
              variant="outline" 
              size="sm"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Company Info and Refresh Button */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold">Company Profile</h1>
              <p className="text-muted-foreground">
                Managing company settings and information
              </p>
            </div>
            <div className="flex gap-2">
              {/* Refresh button to fix stale data */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleForceRefresh}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
              
              {editMode ? (
                <>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    variant="default" 
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
                  <Pencil className="w-4 h-4 mr-1" /> Edit
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
                {editMode ? (
                  <div className="flex flex-col items-center justify-center w-20 h-20 gap-1 p-1">
                    <div className="text-xs text-center mb-1">Company Logo</div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="text-xs w-full"
                    />
                    {selectedImageFile && (
                      <div className="text-xs text-green-600">
                        {selectedImageFile.name}
                      </div>
                    )}
                  </div>
                ) : showLogo ? (
                  <div className="relative w-20 h-20 rounded-full overflow-hidden">
                    <Image
                      src={getLogoUrl()}
                      alt={formData.company_name}
                      fill
                      className="object-cover w-full h-full"
                      onError={() => setImageError(true)}
                    />
                  </div>
                ) : (
                  <AvatarFallback className="text-2xl font-bold bg-blue-500 text-white">
                    {formData.company_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              {formData.is_admin && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Shield className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                {editMode ? (
                  <Input
                    value={formData.company_name}
                    onChange={(e) => handleChange("company_name", e.target.value)}
                    placeholder="Company Name"
                    className="text-3xl font-bold h-12"
                  />
                ) : (
                  <h1 className="text-3xl font-bold">{formData.company_name}</h1>
                )}
                <Badge variant="outline" className="text-xs">
                  ID: {formData.id}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {formData.is_admin && (
                  <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
                    <Shield className="w-3 h-3 mr-1" />
                    Admin Access
                  </Badge>
                )}
                <Badge className="bg-yellow-100 text-yellow-800">
                  <Building2 className="w-3 h-3 mr-1" />
                  {getPunchModeLabel(formData.punch_mode)}
                </Badge>
                {/* Current company indicator */}
                <Badge variant="outline" className="text-green-600 border-green-200">
                  Current Company
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Location & Boundaries */}
          <Card className="border-0 shadow-sm bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                Location & Boundaries
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Latitude</span>
                  {editMode ? (
                    <Input
                      value={formData.latitude || ""}
                      onChange={(e) => handleChange("latitude", e.target.value)}
                      className="w-32 text-right"
                      placeholder="e.g., 40.7128"
                    />
                  ) : (
                    <code className="text-sm bg-background px-2 py-1 rounded border">
                      {formData.latitude || "Not set"}
                    </code>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Longitude</span>
                  {editMode ? (
                    <Input
                      value={formData.longitude || ""}
                      onChange={(e) => handleChange("longitude", e.target.value)}
                      className="w-32 text-right"
                      placeholder="e.g., -74.0060"
                    />
                  ) : (
                    <code className="text-sm bg-background px-2 py-1 rounded border">
                      {formData.longitude || "Not set"}
                    </code>
                  )}
                </div>

                <Separator />
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Perimeter</span>
                  {editMode ? (
                    <Input
                      type="number"
                      value={formData.perimeter || ""}
                      onChange={(e) => handleChange("perimeter", parseFloat(e.target.value) || 0)}
                      className="w-24 text-right"
                      placeholder="km"
                    />
                  ) : (
                    <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
                      <Gauge className="w-3 h-3 mr-1" />
                      {formData.perimeter || 0} km
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Schedule */}
          <Card className="border-0 shadow-sm bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
                Work Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Daily Hours</span>
                  {editMode ? (
                    <Input
                      type="number"
                      value={formData.daily_working_hours || ""}
                      onChange={(e) => handleChange("daily_working_hours", parseFloat(e.target.value) || 0)}
                      className="w-24 text-right"
                      placeholder="hours"
                    />
                  ) : (
                    <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
                      <Clock className="w-3 h-3 mr-1" />
                      {formData.daily_working_hours || 0}h
                    </Badge>
                  )}
                </div>
                <Separator />
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Summary Interval</span>
                  {editMode ? (
                    <Select
                      value={formData.work_summary_interval || "daily"}
                      onValueChange={(value) => handleChange("work_summary_interval", value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formData.work_summary_interval || "daily"}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card className="border-0 shadow-sm bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-purple-600" />
                </div>
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Admin Rights</span>
                  </div>
                  {editMode ? (
                    <Select
                      value={formData.is_admin ? "true" : "false"}
                      onValueChange={(value) => handleChange("is_admin", value === "true")}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Enabled</SelectItem>
                        <SelectItem value="false">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={formData.is_admin ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-muted text-muted-foreground"}>
                      {formData.is_admin ? "Enabled" : "Disabled"}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Punch Mode</span>
                  </div>
                  {editMode ? (
                    <Select
                      value={formData.punch_mode || "s"}
                      onValueChange={(value) => handleChange("punch_mode", value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="s">Single (s)</SelectItem>
                        <SelectItem value="m">Multiple (m)</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
                      {getPunchModeLabel(formData.punch_mode)} ({formData.punch_mode})
                    </Badge>
                  )}
                </div>

                {/* Fix Punches Button Section - Now using the separate component */}
                <Separator />
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium">Fix Punch Issues</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Automatically detect and fix inconsistent punches
                      </p>
                    </div>
                  </div>
                  <FixPunch 
                    companyId={company.id} 
                    disabled={editMode}
                    onComplete={(result) => {
                      setFixPunchResult(result)
                      setShowFixResult(true)
                      
                      // Auto-hide after 5 seconds
                      setTimeout(() => {
                        setShowFixResult(false)
                      }, 5000)
                    }}
                  />
                      {/* Show result indicator */}
                  {showFixResult && fixPunchResult && (
                    <div className={`text-xs px-2 py-1 rounded ${
                      fixPunchResult.success 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {fixPunchResult.success ? (
                        <span>✓ Fixed {fixPunchResult.fixed || 0} punches</span>
                      ) : (
                        <span>✗ Failed: {fixPunchResult.message}</span>
                      )}
                    </div>
                  )}
            
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Overrides */}
          <Card className="border-0 shadow-sm bg-card lg:col-span-3">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                </div>
                Notification 
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {/* SMS Override */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <Label htmlFor="sms-override" className="text-base font-medium">
                        Force Enable SMS
                      </Label>
                    </div>
                  </div>
                  {editMode ? (
                    <Switch
                      id="sms-override"
                      checked={formData.force_enable_sms || false}
                      onCheckedChange={(checked) => handleChange("force_enable_sms", checked)}
                    />
                  ) : (
                    <Badge className={formData.force_enable_sms ? "bg-green-500 hover:bg-green-600 text-white" : "bg-muted text-muted-foreground"}>
                      {formData.force_enable_sms ? "Enabled" : "Disabled"}
                    </Badge>
                  )}
                </div>

                {/* WhatsApp Override */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <Label htmlFor="whatsapp-override" className="text-base font-medium">
                        Force Enable WhatsApp
                      </Label>
                    </div>
                  </div>
                  {editMode ? (
                    <Switch
                      id="whatsapp-override"
                      checked={formData.force_enable_whatsapp || false}
                      onCheckedChange={(checked) => handleChange("force_enable_whatsapp", checked)}
                    />
                  ) : (
                    <Badge className={formData.force_enable_whatsapp ? "bg-green-500 hover:bg-green-600 text-white" : "bg-muted text-muted-foreground"}>
                      {formData.force_enable_whatsapp ? "Enabled" : "Disabled"}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
             
        {/* Fix Punch Results Notification - ADD THIS HERE */}
        {showFixResult && fixPunchResult && (
          <div className={`mt-6 p-4 rounded-lg border ${
            fixPunchResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {fixPunchResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <h4 className="font-medium">
                    {fixPunchResult.success ? 'Punch Fix Completed' : 'Punch Fix Failed'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {fixPunchResult.success 
                      ? `Successfully fixed ${fixPunchResult.fixed || 0} punch records`
                      : fixPunchResult.message || 'Unknown error occurred'
                    }
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFixResult(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}