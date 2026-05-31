"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SquareUser,
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
  Settings,
  Key,
  Clock,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useCompany } from "@/context/CompanyContext";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ProfilePage() {
  const { user, isAdmin, updateUser } = useAuth();
  const { currentCompany } = useCompany();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedUser, setEditedUser] = useState({ ...user });
  const [profileData, setProfileData] = useState<any>(null);
  const [editedProfile, setEditedProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update editedUser when user data changes
  useEffect(() => {
    if (user) {
      setEditedUser({ ...user });
    }
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    const fetchProfileData = async () => {
      setProfileLoading(true);
      try {
        const res = await fetch(`/api/employee-with-profile?user_id=${user.id}`, { cache: "no-store" });
        if (!res.ok) {
          console.error("Failed to load extended profile", await res.text());
          return;
        }
        const result = await res.json();
        if (result?.success && result.data) {
          setProfileData(result.data.profile || null);
          setEditedProfile(result.data.profile || null);
          if (result.data.user) {
            setEditedUser({ ...result.data.user });
          }
        }
      } catch (err) {
        console.error("Error loading employee-with-profile:", err);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfileData();
  }, [user?.id]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Get profile image URL using the same logic as employees list
  const getProfileImageUrl = () => {
    if (!user.prof_img) return null;
    return user.prof_img.startsWith("http")
      ? user.prof_img
      : currentCompany?.mediaBaseUrl
      ? `${currentCompany.mediaBaseUrl}${user.prof_img}`
      : user.prof_img;
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-green-500" : "bg-red-500";
  };

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case "M":
        return "👨";
      case "F":
        return "👩";
      default:
        return "🧑";
    }
  };

  const handleEdit = (section: string) => {
    setEditedUser({ ...user });
    setEditedProfile(profileData ? { ...profileData } : null);
    setEditingSection(section);
  };

  const handleCancel = () => {
    setEditedUser({ ...user });
    setEditedProfile(profileData ? { ...profileData } : null);
    setEditingSection(null);
  };

  const handleProfileChange = (field: string, value: any) => {
    setEditedProfile((prev: any) => (prev ? { ...prev, [field]: value } : { [field]: value }));
  };

  const handleAddressChange = (type: "present_address_details" | "permanent_address_details", field: string, value: string) => {
    setEditedProfile((prev: any) => {
      if (!prev) return null;
      return {
        ...prev,
        [type]: {
          ...(prev[type] || {}),
          [field]: value,
        },
      };
    });
  };

  // PUT request to update profile
  const handleSave = async () => {
    if (!user || !currentCompany) {
      toast.error("Missing user data or company information");
      return;
    }

    setIsSaving(true);

    try {
      const payload: any = {
        user_id: user.id,
        first_name: editedUser.first_name,
        last_name: editedUser.last_name,
        email: editedUser.email,
        mobile: editedUser.mobile,
        role: editedUser.role,
        gender: editedUser.gender,
        group: editedUser.group,
        is_whatsapp: editedUser.is_whatsapp,
        is_sms: editedUser.is_sms,
        is_wfh: editedUser.is_wfh,
        is_active: editedUser.is_active,
        role_id: editedUser.role_id,
        group_id: editedUser.group_id,
      };

      const profilePayload = editedProfile ?? profileData;
      if (profilePayload) {
        payload.profile = {
          dob: profilePayload.dob || null,
          guardian_name: profilePayload.guardian_name || "",
          guardian_phone: profilePayload.guardian_phone || "",
          religion_id: profilePayload.religion_id || null,
          caste_id: profilePayload.caste_id || null,
          staff_type_id: profilePayload.staff_type_id || null,
          staff_category_id: profilePayload.staff_category_id || null,
          ktu_id: profilePayload.ktu_id || "",
          aicte_id: profilePayload.aicte_id || "",
          pan_no: profilePayload.pan_no || "",
          aadhar_no: profilePayload.aadhar_no || "",
          blood_group: profilePayload.blood_group || "",
          alternate_mobile: profilePayload.alternate_mobile || "",
          alternate_email: profilePayload.alternate_email || "",
        };

        if (profilePayload.present_address_details) {
          payload.present_address = profilePayload.present_address_details;
        }
        if (profilePayload.permanent_address_details) {
          payload.permanent_address = profilePayload.permanent_address_details;
        }
      }

      console.log("💾 Saving profile data:", payload);

      const response = await fetch(`/api/employee-with-profile/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-company-id": currentCompany.id.toString(),
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log("💾 Save response:", result);

      if (result.success) {
        toast.success("Profile updated successfully!");
        setEditingSection(null);

        if (updateUser && result.data?.user) {
          updateUser(result.data.user);
          setEditedUser({ ...result.data.user });
        }
        if (result.data?.profile) {
          setProfileData(result.data.profile);
          setEditedProfile({ ...result.data.profile });
        }

        window.location.reload();
      } else {
        toast.error(result.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setEditedUser((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const profileUrl = getProfileImageUrl();
  const initials = `${user.first_name?.charAt(0) || ""}${user.last_name?.charAt(0) || ""}`;

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8">
      <div className="max-w-6xl mx-auto pb-12">
        {/* Header & Breadcrumbs */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-[#eff6ff] rounded-lg text-[#2563eb] shadow-sm">
            <SquareUser className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0f2744]">My Profile</h1>
            <p className="text-sm text-[#7a8ba0] mt-0.5">Manage your personal information, contact details and preferences</p>
          </div>
        </div>

        {/* Inactive User Warning */}
        {!user.is_active && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-200">
            <AlertDescription className="text-yellow-800 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              <span>
                <strong>Account Inactive:</strong> Your account is currently inactive. Please contact your administrator for full
                access.
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Hero Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative group">
              <div className="h-32 w-32 rounded-2xl overflow-hidden border-4 border-blue-50 shadow-inner bg-blue-50 flex items-center justify-center">
                {profileUrl ? (
                  <Image
                    src={profileUrl}
                    alt={`${user.first_name} ${user.last_name}`}
                    width={128}
                    height={128}
                    className="object-cover h-full w-full"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-blue-700">
                    <span className="text-4xl font-bold">{initials}</span>
                    <span className="text-xs font-semibold uppercase mt-1">User</span>
                  </div>
                )}
              </div>
              <div
                className={`absolute -bottom-2 -right-2 h-8 w-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${
                  user.is_active ? "bg-green-500" : "bg-red-500"
                }`}
              >
                {user.is_active ? <CheckCircle className="h-4 w-4 text-white" /> : <XCircle className="h-4 w-4 text-white" />}
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-1">
                    {user.first_name} {user.last_name}
                  </h2>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-gray-500">
                    <Mail className="h-4 w-4" />
                    <span>{user.email}</span>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center md:justify-end gap-2 text-sm">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none px-3 py-1">
                    <Briefcase className="h-3 w-3 mr-1.5" />
                    {user.role}
                  </Badge>
                  {isAdmin && (
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 px-3 py-1">
                      <Shield className="h-3 w-3 mr-1.5" />
                      Admin
                    </Badge>
                  )}
                  {user.is_superuser && (
                    <Badge className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 px-3 py-1">
                      <Crown className="h-3 w-3 mr-1.5" />
                      Super User
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-6 border-t border-gray-100 pt-6">
                {/* Optional stats can be added here */}
              </div>
            </div>
          </div>
        </div>

        {/* Identity Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">User ID</h3>
              <p className="text-2xl font-bold text-blue-600">#{user.id}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Hash className="h-6 w-6 text-blue-600" />
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">Biometric ID</h3>
              <p className="text-2xl font-bold text-green-600">{user.biometric_id || "--"}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">Current Group</h3>
              <p className="text-2xl font-bold text-purple-600">{user.group || "General"}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">Account Level</h3>
              <p className="text-2xl font-bold text-amber-600">{user.role_id === 1 ? "Admin" : "Member"}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <ShieldCheck className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>

        {/* Details Sections - REORDERED as requested */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Details - stays first */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <UserIcon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Personal Details</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-100 bg-blue-50 hover:bg-blue-100"
                onClick={() => handleEdit("personal")}
              >
                <Edit3 className="h-3.5 w-3.5 mr-2" />
                Edit
              </Button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">First Name</p>
                  <p className="text-base font-semibold text-gray-800">{user.first_name}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Last Name</p>
                  <p className="text-base font-semibold text-gray-800">{user.last_name}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Gender</p>
                <p className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <span>{getGenderIcon(user.gender)}</span>
                  {user.gender_display || (user.gender === "M" ? "Male" : user.gender === "F" ? "Female" : "Other")}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Details - stays second */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                  <Mail className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Contact Details</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-green-600 border-green-100 bg-green-50 hover:bg-green-100"
                onClick={() => handleEdit("contact")}
              >
                <Edit3 className="h-3.5 w-3.5 mr-2" />
                Edit
              </Button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Email Address</p>
                <p className="text-base font-semibold text-gray-800">{user.email}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Mobile Number</p>
                <p className="text-base font-semibold text-gray-800">{user.mobile || "Not provided"}</p>
              </div>
            </div>
          </div>

          {/* Profile & Identity - moved to first column, third row */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Profile & Identity</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-cyan-600 border-cyan-100 bg-cyan-50 hover:bg-cyan-100"
                onClick={() => handleEdit("extended")}
              >
                <Edit3 className="h-3.5 w-3.5 mr-2" />
                Edit
              </Button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Guardian Name</p>
                  <p className="text-base font-semibold text-gray-800">{profileData?.guardian_name || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Guardian Phone</p>
                  <p className="text-base font-semibold text-gray-800">{profileData?.guardian_phone || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Staff Type</p>
                  <p className="text-base font-semibold text-gray-800">{profileData?.staff_type || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Staff Category</p>
                  <p className="text-base font-semibold text-gray-800">{profileData?.staff_category || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Religion</p>
                  <p className="text-base font-semibold text-gray-800">{profileData?.religion_name || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Caste</p>
                  <p className="text-base font-semibold text-gray-800">{profileData?.caste_name || "Not provided"}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">KTU ID</p>
                  <p className="text-base font-semibold text-gray-800">{profileData?.ktu_id || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">AICTE ID</p>
                  <p className="text-base font-semibold text-gray-800">{profileData?.aicte_id || "Not provided"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Legal & Contact - moved to second column, third row */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-fuchsia-50 flex items-center justify-center text-fuchsia-600">
                  <Key className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Legal & Contact Info</h3>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">PAN Number</p>
                  <p className="text-base font-semibold text-gray-800">{profileData?.pan_no || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Aadhar Number</p>
                  <p className="text-base font-semibold text-gray-800">{profileData?.aadhar_no || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Blood Group</p>
                  <p className="text-base font-semibold text-gray-800">{profileData?.blood_group || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Alternate Mobile</p>
                  <p className="text-base font-semibold text-gray-800">{profileData?.alternate_mobile || "Not provided"}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Alternate Email</p>
                  <p className="text-base font-semibold text-gray-800">{profileData?.alternate_email || "Not provided"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Address Details - now in first column, fourth row */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Home className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Address Details</h3>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-3">Present Address</p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">{profileData?.present_address_details?.address_line_1 || "Not provided"}</p>
                  <p className="text-sm text-gray-500">{profileData?.present_address_details?.address_line_2 || ""}</p>
                  <p className="text-sm text-gray-500">
                    {profileData?.present_address_details?.city || ""}, {profileData?.present_address_details?.district || ""}
                  </p>
                  <p className="text-sm text-gray-500">
                    {profileData?.present_address_details?.state || ""} {profileData?.present_address_details?.pincode || ""}
                  </p>
                  <p className="text-sm text-gray-500">{profileData?.present_address_details?.country || ""}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-3">Permanent Address</p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">
                    {profileData?.permanent_address_details?.address_line_1 || "Not provided"}
                  </p>
                  <p className="text-sm text-gray-500">{profileData?.permanent_address_details?.address_line_2 || ""}</p>
                  <p className="text-sm text-gray-500">
                    {profileData?.permanent_address_details?.city || ""}, {profileData?.permanent_address_details?.district || ""}
                  </p>
                  <p className="text-sm text-gray-500">
                    {profileData?.permanent_address_details?.state || ""} {profileData?.permanent_address_details?.pincode || ""}
                  </p>
                  <p className="text-sm text-gray-500">{profileData?.permanent_address_details?.country || ""}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Access - moved to second column, fourth row */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                  <Shield className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Security & Access</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <Key className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-gray-700">Administrator Access</span>
                </div>
                <Badge variant={isAdmin ? "default" : "secondary"} className={isAdmin ? "bg-purple-600" : ""}>
                  {isAdmin ? "Full Access" : "Restricted"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <Crown className="h-4 w-4 text-pink-500" />
                  <span className="text-sm font-medium text-gray-700">Superuser Privileges</span>
                </div>
                <Badge variant={user.is_superuser ? "default" : "secondary"} className={user.is_superuser ? "bg-pink-600" : ""}>
                  {user.is_superuser ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Work Preferences - placed directly under the grid */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                  <Settings className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Work Preferences</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-orange-600 border-orange-100 bg-orange-50 hover:bg-orange-100"
                onClick={() => handleEdit("preferences")}
              >
                <Edit3 className="h-3.5 w-3.5 mr-2" />
                Edit
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-transparent hover:border-gray-200 transition-all">
                <div className="flex items-center gap-3">
                  <Home className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-gray-700">Work From Home</span>
                </div>
                <Badge variant={user.is_wfh ? "default" : "secondary"} className={user.is_wfh ? "bg-orange-500" : ""}>
                  {user.is_wfh ? "Enabled" : "Disabled"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-transparent hover:border-gray-200 transition-all">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">WhatsApp Alerts</span>
                </div>
                <Badge variant={user.is_whatsapp ? "default" : "secondary"} className={user.is_whatsapp ? "bg-green-500" : ""}>
                  {user.is_whatsapp ? "Enabled" : "Disabled"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-transparent hover:border-gray-200 transition-all">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">SMS Notifications</span>
                </div>
                <Badge variant={user.is_sms ? "default" : "secondary"} className={user.is_sms ? "bg-blue-500" : ""}>
                  {user.is_sms ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Dialogs (unchanged) */}

        {/* 1. Personal Details Dialog */}
        <Dialog open={editingSection === "personal"} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Edit Personal Details</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={editedUser.first_name || ""}
                    onChange={(e) => handleInputChange("first_name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={editedUser.last_name || ""}
                    onChange={(e) => handleInputChange("last_name", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={editedUser.gender || ""} onValueChange={(value) => handleInputChange("gender", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Male</SelectItem>
                    <SelectItem value="F">Female</SelectItem>
                    <SelectItem value="O">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 2. Contact Details Dialog */}
        <Dialog open={editingSection === "contact"} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Edit Contact Details</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={editedUser.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={editedUser.mobile || ""}
                  onChange={(e) => handleInputChange("mobile", e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Extended Profile Dialog - with fixed scrolling */}
        <Dialog open={editingSection === "extended"} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="max-w-4xl bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl flex flex-col max-h-[90vh]">
            <DialogHeader className="p-8 bg-cyan-600 text-white flex-shrink-0">
              <DialogTitle className="text-2xl font-bold">Edit Extended Profile</DialogTitle>
              <p className="text-sm text-cyan-100">Update guardian, identity, and address details.</p>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guardian_name">Guardian Name</Label>
                    <Input
                      id="guardian_name"
                      value={editedProfile?.guardian_name || ""}
                      onChange={(e) => handleProfileChange("guardian_name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardian_phone">Guardian Phone</Label>
                    <Input
                      id="guardian_phone"
                      value={editedProfile?.guardian_phone || ""}
                      onChange={(e) => handleProfileChange("guardian_phone", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ktu_id">KTU ID</Label>
                    <Input
                      id="ktu_id"
                      value={editedProfile?.ktu_id || ""}
                      onChange={(e) => handleProfileChange("ktu_id", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aicte_id">AICTE ID</Label>
                    <Input
                      id="aicte_id"
                      value={editedProfile?.aicte_id || ""}
                      onChange={(e) => handleProfileChange("aicte_id", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pan_no">PAN Number</Label>
                    <Input
                      id="pan_no"
                      value={editedProfile?.pan_no || ""}
                      onChange={(e) => handleProfileChange("pan_no", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aadhar_no">Aadhar Number</Label>
                    <Input
                      id="aadhar_no"
                      value={editedProfile?.aadhar_no || ""}
                      onChange={(e) => handleProfileChange("aadhar_no", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="blood_group">Blood Group</Label>
                    <Input
                      id="blood_group"
                      value={editedProfile?.blood_group || ""}
                      onChange={(e) => handleProfileChange("blood_group", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alternate_mobile">Alternate Mobile</Label>
                    <Input
                      id="alternate_mobile"
                      value={editedProfile?.alternate_mobile || ""}
                      onChange={(e) => handleProfileChange("alternate_mobile", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alternate_email">Alternate Email</Label>
                  <Input
                    id="alternate_email"
                    type="email"
                    value={editedProfile?.alternate_email || ""}
                    onChange={(e) => handleProfileChange("alternate_email", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-3">Present Address</p>
                  <div className="grid grid-cols-1 gap-4">
                    <Input
                      placeholder="Address Line 1"
                      value={editedProfile?.present_address_details?.address_line_1 || ""}
                      onChange={(e) => handleAddressChange("present_address_details", "address_line_1", e.target.value)}
                    />
                    <Input
                      placeholder="Address Line 2"
                      value={editedProfile?.present_address_details?.address_line_2 || ""}
                      onChange={(e) => handleAddressChange("present_address_details", "address_line_2", e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="City"
                        value={editedProfile?.present_address_details?.city || ""}
                        onChange={(e) => handleAddressChange("present_address_details", "city", e.target.value)}
                      />
                      <Input
                        placeholder="District"
                        value={editedProfile?.present_address_details?.district || ""}
                        onChange={(e) => handleAddressChange("present_address_details", "district", e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="State"
                        value={editedProfile?.present_address_details?.state || ""}
                        onChange={(e) => handleAddressChange("present_address_details", "state", e.target.value)}
                      />
                      <Input
                        placeholder="Country"
                        value={editedProfile?.present_address_details?.country || ""}
                        onChange={(e) => handleAddressChange("present_address_details", "country", e.target.value)}
                      />
                    </div>
                    <Input
                      placeholder="Pincode"
                      value={editedProfile?.present_address_details?.pincode || ""}
                      onChange={(e) => handleAddressChange("present_address_details", "pincode", e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-3">Permanent Address</p>
                  <div className="grid grid-cols-1 gap-4">
                    <Input
                      placeholder="Address Line 1"
                      value={editedProfile?.permanent_address_details?.address_line_1 || ""}
                      onChange={(e) => handleAddressChange("permanent_address_details", "address_line_1", e.target.value)}
                    />
                    <Input
                      placeholder="Address Line 2"
                      value={editedProfile?.permanent_address_details?.address_line_2 || ""}
                      onChange={(e) => handleAddressChange("permanent_address_details", "address_line_2", e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="City"
                        value={editedProfile?.permanent_address_details?.city || ""}
                        onChange={(e) => handleAddressChange("permanent_address_details", "city", e.target.value)}
                      />
                      <Input
                        placeholder="District"
                        value={editedProfile?.permanent_address_details?.district || ""}
                        onChange={(e) => handleAddressChange("permanent_address_details", "district", e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="State"
                        value={editedProfile?.permanent_address_details?.state || ""}
                        onChange={(e) => handleAddressChange("permanent_address_details", "state", e.target.value)}
                      />
                      <Input
                        placeholder="Country"
                        value={editedProfile?.permanent_address_details?.country || ""}
                        onChange={(e) => handleAddressChange("permanent_address_details", "country", e.target.value)}
                      />
                    </div>
                    <Input
                      placeholder="Pincode"
                      value={editedProfile?.permanent_address_details?.pincode || ""}
                      onChange={(e) => handleAddressChange("permanent_address_details", "pincode", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="p-8 bg-slate-50 flex gap-4 flex-shrink-0">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Work Preferences Dialog */}
        <Dialog open={editingSection === "preferences"} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Work Preferences</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="space-y-0.5">
                  <Label>Work From Home</Label>
                  <p className="text-[10px] text-gray-500">Enable remote work tracking</p>
                </div>
                <Switch
                  checked={editedUser.is_wfh || false}
                  onCheckedChange={(checked) => handleInputChange("is_wfh", checked)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="space-y-0.5">
                  <Label>WhatsApp Alerts</Label>
                  <p className="text-[10px] text-gray-500">Receive punch updates on WhatsApp</p>
                </div>
                <Switch
                  checked={editedUser.is_whatsapp || false}
                  onCheckedChange={(checked) => handleInputChange("is_whatsapp", checked)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="space-y-0.5">
                  <Label>SMS Notifications</Label>
                  <p className="text-[10px] text-gray-500">Receiver alerts via SMS</p>
                </div>
                <Switch
                  checked={editedUser.is_sms || false}
                  onCheckedChange={(checked) => handleInputChange("is_sms", checked)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}