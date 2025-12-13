"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Mail,
  Phone,
  UserIcon,
  Briefcase,
  Shield,
  ShieldCheck,
  MessageSquare,
  MessageCircle,
  Home,
  Activity,
  Hash,
  Users,
  CheckCircle,
  XCircle,
  Crown,
  Edit3,
  Save,
  X,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useCompany } from "@/context/CompanyContext"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ProfilePage() {
  const { user, isAdmin, updateUser } = useAuth()
  const { currentCompany } = useCompany()
  const [isEditing, setIsEditing] = useState(false)
  const [editedUser, setEditedUser] = useState({ ...user })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Update editedUser when user data changes
  useEffect(() => {
    if (user) {
      setEditedUser({ ...user })
    }
  }, [user])

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Get profile image URL using the same logic as employees list
  const getProfileImageUrl = () => {
    if (!user.prof_img) return null
    return user.prof_img.startsWith("http") 
      ? user.prof_img 
      : currentCompany?.mediaBaseUrl 
        ? `${currentCompany.mediaBaseUrl}${user.prof_img}`
        : user.prof_img
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-green-500" : "bg-red-500"
  }

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case "M":
        return "👨"
      case "F":
        return "👩"
      default:
        return "🧑"
    }
  }

  const handleEdit = () => {
    setEditedUser({ ...user })
    setIsEditing(true)
  }

  const handleCancel = () => {
    setEditedUser({ ...user })
    setIsEditing(false)
  }

  // PUT request to update profile
  const handleSave = async () => {
    if (!user || !currentCompany) {
      toast.error("Missing user data or company information")
      return
    }

    setIsSaving(true)
    
    try {
      const payload = {
        first_name: editedUser.first_name,
        last_name: editedUser.last_name,
        email: editedUser.email,
        mobile: editedUser.mobile,
        role: editedUser.role,
        gender: editedUser.gender,
        group: editedUser.group,
        is_whatsapp: editedUser.is_whatsapp,
        is_wfh: editedUser.is_wfh,
        is_active: editedUser.is_active,
        role_id: editedUser.role_id,
        group_id: editedUser.group_id,
      }

      console.log("💾 Saving profile data:", payload)

      const response = await fetch(`/api/profile/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-company-id": currentCompany.id.toString(),
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      console.log("💾 Save response:", result)

      if (result.success) {
        toast.success("Profile updated successfully!")
        setIsEditing(false)
        
        // Update the user context with new data
        if (updateUser && result.data) {
          updateUser(result.data)
        }
        
        // Refetch user data
        setTimeout(() => {
          window.location.reload() // Simple refresh to get updated data
        }, 500)
      } else {
        toast.error(result.message || "Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setEditedUser(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const profileUrl = getProfileImageUrl()
  const initials = `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Inactive User Warning */}
        {!user.is_active && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertDescription className="text-yellow-800">
              <strong>Your account is inactive.</strong> You cannot access all system features. 
              Please contact your administrator to reactivate your account.
            </AlertDescription>
          </Alert>
        )}

        {/* Header Section with Edit Button */}
        <div className="text-center space-y-4 relative">
          <div className="relative inline-block">
            <Avatar className="h-32 w-32 border-4 border-border shadow-lg">
              {profileUrl ? (
                <AvatarImage
                  src={profileUrl}
                  alt={`${user.first_name} ${user.last_name}`}
                />
              ) : (
                <AvatarFallback className="text-4xl font-bold bg-blue-600 text-white">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div
              className={`absolute -bottom-2 -right-2 h-8 w-8 rounded-full border-4 border-background ${getStatusColor(user.is_active)}`}
            >
              {user.is_active ? (
                <CheckCircle className="h-4 w-4 text-white m-1" />
              ) : (
                <XCircle className="h-4 w-4 text-white m-1" />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">
              {user.first_name} {user.last_name}
            </h1>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                <Briefcase className="h-3 w-3 mr-1" />
                {user.role}
              </Badge>
              {isAdmin && (
                <Badge className="bg-yellow-500 text-black hover:bg-yellow-600">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
              {user.is_superuser && (
                <Badge className="bg-blue-600 text-white hover:bg-blue-700">
                  <Crown className="h-3 w-3 mr-1" />
                  Super User
                </Badge>
              )}
              <Badge variant={user.is_active ? "default" : "destructive"}>
                {user.is_active ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Inactive
                  </>
                )}
              </Badge>
            </div>
          </div>

          {/* Edit/Save/Cancel Buttons */}
          <div className="absolute top-0 right-0">
            {!isEditing ? (
              <Button onClick={handleEdit} variant="outline" className="flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button onClick={handleCancel} variant="outline" className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Contact & Identity */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card className="shadow-lg border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mail className="h-5 w-5 text-blue-600" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={editedUser.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                    />
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.email}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile" className="text-xs text-muted-foreground">Mobile</Label>
                  {isEditing ? (
                    <Input
                      id="mobile"
                      type="tel"
                      value={editedUser.mobile || ''}
                      onChange={(e) => handleInputChange('mobile', e.target.value)}
                      placeholder="Enter mobile number"
                    />
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">{user.mobile}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Identity & Security */}
            <Card className="shadow-lg border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5 text-yellow-500" />
                  Identity & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">User ID</p>
                    <p className="font-medium">#{user.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Biometric ID</p>
                    <p className="font-medium">{user.biometric_id}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-xs text-muted-foreground">Gender</Label>
                  {isEditing ? (
                    <Select
                      value={editedUser.gender || ''}
                      onValueChange={(value) => handleInputChange('gender', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Male</SelectItem>
                        <SelectItem value="F">Female</SelectItem>
                        <SelectItem value="O">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium flex items-center gap-2">
                          <span>{getGenderIcon(user.gender)}</span>
                          {user.gender_display}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Personal Details */}
          <div className="space-y-6">
            {/* Personal Information */}
            <Card className="shadow-lg border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                  Personal Details
                </CardTitle>
                <CardDescription>Your personal information and profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-xs text-muted-foreground uppercase tracking-wide">First Name</Label>
                      {isEditing ? (
                        <Input
                          id="firstName"
                          value={editedUser.first_name || ''}
                          onChange={(e) => handleInputChange('first_name', e.target.value)}
                          placeholder="First Name"
                        />
                      ) : (
                        <p className="text-lg font-semibold">{user.first_name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-xs text-muted-foreground uppercase tracking-wide">Last Name</Label>
                      {isEditing ? (
                        <Input
                          id="lastName"
                          value={editedUser.last_name || ''}
                          onChange={(e) => handleInputChange('last_name', e.target.value)}
                          placeholder="Last Name"
                        />
                      ) : (
                        <p className="text-lg font-semibold">{user.last_name}</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-xs text-muted-foreground uppercase tracking-wide">Professional Role</Label>
                    {isEditing ? (
                      <Input
                        id="role"
                        value={editedUser.role || ''}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                        placeholder="Professional Role"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <p className="text-lg font-semibold">{user.role}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="group" className="text-xs text-muted-foreground uppercase tracking-wide">Group</Label>
                    {isEditing ? (
                      <Input
                        id="group"
                        value={editedUser.group || ''}
                        onChange={(e) => handleInputChange('group', e.target.value)}
                        placeholder="Group"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <p className="text-lg font-semibold">{user.group || "No group"}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Account Status</p>
                    <div className="flex items-center gap-2">
                      {user.is_active ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <p className={`text-lg font-semibold ${user.is_active ? "text-green-600" : "text-red-600"}`}>
                        {user.is_active ? "Active" : "Inactive"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Preferences & Settings */}
          <div className="space-y-6">
            {/* Communication Preferences */}
            <Card className="shadow-lg border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5 text-yellow-500" />
                  Communication Preferences
                </CardTitle>
                <CardDescription>Manage your notification settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="font-medium">WhatsApp Notifications</p>
                      <p className="text-xs text-muted-foreground">Receive updates via WhatsApp</p>
                    </div>
                  </div>
                  {isEditing ? (
                    <Switch 
                      checked={editedUser.is_whatsapp || false}
                      onCheckedChange={(checked) => handleInputChange('is_whatsapp', checked)}
                    />
                  ) : (
                    <Switch checked={user.is_whatsapp} disabled />
                  )}
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="font-medium">SMS Notifications</p>
                      <p className="text-xs text-muted-foreground">Receive updates via SMS</p>
                    </div>
                  </div>
                  {isEditing ? (
                    <Switch 
                      checked={editedUser.is_sms || false}
                      onCheckedChange={(checked) => handleInputChange('is_sms', checked)}
                    />
                  ) : (
                    <Switch checked={user.is_sms} disabled />
                  )}
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-3">
                    <Home className="h-4 w-4 text-yellow-500" />
                    <div>
                      <p className="font-medium">Work From Home</p>
                      <p className="text-xs text-muted-foreground">Remote work preference</p>
                    </div>
                  </div>
                  {isEditing ? (
                    <Switch 
                      checked={editedUser.is_wfh || false}
                      onCheckedChange={(checked) => handleInputChange('is_wfh', checked)}
                    />
                  ) : (
                    <Switch checked={user.is_wfh} disabled />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* System Permissions - Read Only */}
            <Card className="shadow-lg border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-blue-600" />
                  System Permissions
                </CardTitle>
                <CardDescription>Your access levels and permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">Admin Access</span>
                  </div>
                  <Badge variant={isAdmin ? "default" : "secondary"}>{isAdmin ? "Granted" : "Not Granted"}</Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-3">
                    <Crown className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Super User</span>
                  </div>
                  <Badge variant={user.is_superuser ? "default" : "secondary"}>
                    {user.is_superuser ? "Yes" : "No"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}