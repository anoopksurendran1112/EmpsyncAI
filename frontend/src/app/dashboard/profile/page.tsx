"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SquareUser, Mail, UserIcon, Briefcase, Shield, ShieldCheck,
  MessageSquare, MessageCircle, Home, Activity, Hash, Users,
  CheckCircle, XCircle, Crown, Edit3, Settings, Key, Smartphone,
  Heart, MapPin, Plus, RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

// --- Interfaces ---
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
  religion_name?: string | null;   // for display
  caste_name?: string | null;       // for display
  staff_type?: string | null;       // ID or name? from backend
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
  // Raw IDs from backend (if returned as separate fields)
  religion?: number | null;
  caste?: number | null;
}

interface EditableProfile {
  id: number;
  user: number;
  dob: string | null;
  religion_id: number | null;   // internal ID for selects
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

interface LookupItem { id: number; name: string; }

export default function ProfilePage() {
  const { user, isAdmin, updateUser, company } = useAuth();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedUser, setEditedUser] = useState({ ...user });
  const [isSaving, setIsSaving] = useState(false);

  const [fullProfile, setFullProfile] = useState<EmployeeFullProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editProfileData, setEditProfileData] = useState<EditableProfile | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const [staffTypes, setStaffTypes] = useState<LookupItem[]>([]);
  const [staffCategories, setStaffCategories] = useState<LookupItem[]>([]);
  const [religions, setReligions] = useState<LookupItem[]>([]);
  const [castes, setCastes] = useState<LookupItem[]>([]);

  // Sync editedUser when user changes
  useEffect(() => {
    if (user) setEditedUser({ ...user });
  }, [user]);

  // Fetch profile & lookups when ready
  useEffect(() => {
    if (user?.id && company?.id) {
      fetchProfile();
      fetchLookups();
    }
  }, [user?.id, company?.id]);

  // Auto-retry if profile fails
  useEffect(() => {
    if (!fullProfile && !profileLoading && retryCount < 2 && user?.id && company?.id) {
      const timer = setTimeout(() => { fetchProfile(); setRetryCount(c => c + 1); }, 1000);
      return () => clearTimeout(timer);
    }
  }, [fullProfile, profileLoading, retryCount, user?.id, company?.id]);

  // Fetch castes when religion changes in edit mode
  useEffect(() => {
    if (!editingSection || !editProfileData?.religion_id) {
      setCastes([]);
      return;
    }
    fetchCastes(editProfileData.religion_id);
  }, [editProfileData?.religion_id, editingSection]);

  // Enrich profile with religion/caste names when lookups are loaded
  useEffect(() => {
    if (!fullProfile) return;
    if (fullProfile.religion_name && fullProfile.caste_name) return;
    
    let updated = false;
    const newProfile = { ...fullProfile };
    
    // Map religion ID to name
    if (!newProfile.religion_name && newProfile.religion && religions.length) {
      const rel = religions.find(r => r.id === newProfile.religion);
      if (rel) {
        newProfile.religion_name = rel.name;
        updated = true;
      }
    }
    // Map caste ID to name
    if (!newProfile.caste_name && newProfile.caste && castes.length) {
      const caste = castes.find(c => c.id === newProfile.caste);
      if (caste) {
        newProfile.caste_name = caste.name;
        updated = true;
      }
    }
    
    if (updated) {
      setFullProfile(newProfile);
    }
  }, [fullProfile, religions, castes]);

  // --- Robust address & profile mapper ---
  const mapProfileFromBackend = (profileFromApi: any): EmployeeFullProfile | null => {
    if (!profileFromApi) return null;
    
    console.log("Raw profile from API:", profileFromApi);
    
    // Extract addresses
    const presentAddress = 
      profileFromApi.present_address_details ||
      profileFromApi.present_address ||
      null;
    const permanentAddress = 
      profileFromApi.permanent_address_details ||
      profileFromApi.permanent_address ||
      null;
    
    // Extract religion/caste IDs (backend uses "religion" and "caste" fields)
    const religionId = profileFromApi.religion ?? null;
    const casteId = profileFromApi.caste ?? null;
    
    // Also handle nested objects if ever present
    let religionName = profileFromApi.religion_name;
    let casteName = profileFromApi.caste_name;
    if (profileFromApi.religion && typeof profileFromApi.religion === 'object') {
      religionName = profileFromApi.religion.name;
    }
    if (profileFromApi.caste && typeof profileFromApi.caste === 'object') {
      casteName = profileFromApi.caste.name;
    }
    
    return {
      ...profileFromApi,
      religion: religionId,
      caste: casteId,
      religion_name: religionName,
      caste_name: casteName,
      present_address_details: presentAddress,
      permanent_address_details: permanentAddress,
    };
  };

  // Fixed: short pincode default (10 chars)
  const ensureAddressDefaults = (addr: AddressDetails): AddressDetails => {
    const requiredFields = ['address_line_1', 'city', 'district', 'state', 'country', 'pincode'];
    const result = { ...addr };
    for (const field of requiredFields) {
      const value = result[field as keyof AddressDetails];
      if (!value || value.trim() === '') {
        if (field === 'pincode') {
          (result as any)[field] = '0000000000';
        } else {
          (result as any)[field] = 'Not provided';
        }
      }
    }
    return result;
  };

  const nullIfEmpty = (value: string | null | undefined): string | null => {
    if (value === undefined || value === null || value.trim() === '') return null;
    return value;
  };

  // --- API calls ---
  const fetchProfile = async () => {
    if (!user?.id || !company?.id) return;
    setProfileLoading(true);
    try {
      const res = await fetch(`/api/employee-with-profile?user_id=${user.id}`, {
        cache: "no-store",
        headers: { "x-company-id": company.id.toString() },
      });
      if (res.ok) {
        const result = await res.json();
        console.log("Full GET response:", result);
        if (result?.success && result.data) {
          const profileData = result.data.profile || result.data;
          const mapped = mapProfileFromBackend(profileData);
          setFullProfile(mapped);
          setRetryCount(0);
        } else {
          setFullProfile(null);
        }
      } else {
        setFullProfile(null);
      }
    } catch (err) { console.error(err); }
    finally { setProfileLoading(false); }
  };

  const fetchLookups = async () => {
    if (!company?.id) return;
    try {
      const [staffTypeRes, staffCatRes, religionRes] = await Promise.all([
        fetch(`/api/settings/staff_type/${company.id}`, { headers: { "x-company-id": company.id.toString() } }),
        fetch(`/api/settings/staff_category/${company.id}`, { headers: { "x-company-id": company.id.toString() } }),
        fetch(`/api/settings/manage-religion/`, { headers: { "x-company-id": company.id.toString() } }),
      ]);
      const staffTypeData = await staffTypeRes.json();
      const staffCatData = await staffCatRes.json();
      const religionData = await religionRes.json();

      setStaffTypes((Array.isArray(staffTypeData) ? staffTypeData : staffTypeData.data || []).map((st: any) => ({ id: st.id, name: st.type_name || st.name })));
      setStaffCategories((Array.isArray(staffCatData) ? staffCatData : staffCatData.data || []).map((sc: any) => ({ id: sc.id, name: sc.category_name || sc.name })));
      setReligions((Array.isArray(religionData) ? religionData : religionData.data || []).map((r: any) => ({ id: r.id, name: r.name })));
    } catch (e) { console.error(e); }
  };

  const fetchCastes = async (religionId: number) => {
    try {
      const res = await fetch(`/api/settings/manage-caste/?religion_id=${religionId}`, {
        headers: company?.id ? { "x-company-id": company.id.toString() } : {},
      });
      const data = await res.json();
      const items = Array.isArray(data) ? data : data.data || [];
      setCastes(items.map((c: any) => ({ id: c.id, name: c.name })));
    } catch (e) { console.error(e); }
  };

  // --- UI helpers ---
  const getProfileImageUrl = () => user?.prof_img ? (user.prof_img.startsWith("http") ? user.prof_img : user.prof_img) : null;
  const getGenderIcon = (gender: string) => ({ M: "👨", F: "👩" }[gender] || "🧑");
  const getInitials = () => `${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`;
  
  const displayAddress = (addr?: AddressDetails) => {
    if (!addr) return "Not provided";
    const parts = [
      addr.address_line_1,
      addr.address_line_2,
      addr.city,
      addr.district,
      addr.state,
      addr.country,
      addr.pincode
    ].filter(Boolean);
    return parts.length ? parts.join(", ") : "Not provided";
  };

  // --- Edit handlers ---
  const handleEditExtended = (section: string) => {
    if (!user) return;
    let religionId = null, casteId = null;
    if (fullProfile) {
      // Use the IDs we now store (fullProfile.religion and fullProfile.caste)
      religionId = fullProfile.religion ?? null;
      casteId = fullProfile.caste ?? null;
    }
    setEditProfileData({
      id: fullProfile?.id || 0,
      user: user.id,
      dob: fullProfile?.dob || "",
      religion_id: religionId,
      caste_id: casteId,
      staff_type_id: fullProfile?.staff_type ? Number(fullProfile.staff_type) : null,
      staff_category_id: fullProfile?.staff_category ? Number(fullProfile.staff_category) : null,
      ktu_id: fullProfile?.ktu_id || "",
      aicte_id: fullProfile?.aicte_id || "",
      pan_no: fullProfile?.pan_no || "",
      aadhar_no: fullProfile?.aadhar_no || "",
      blood_group: fullProfile?.blood_group || "",
      alternate_mobile: fullProfile?.alternate_mobile || "",
      alternate_email: fullProfile?.alternate_email || "",
      present_address_details: fullProfile?.present_address_details || { address_line_1: "", address_line_2: "", city: "", district: "", state: "", country: "", pincode: "" },
      permanent_address_details: fullProfile?.permanent_address_details || { address_line_1: "", address_line_2: "", city: "", district: "", state: "", country: "", pincode: "" },
    });
    setEditingSection(section);
  };

  const handleProfileChange = (field: keyof EditableProfile, value: any) => {
    setEditProfileData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleAddressChange = (type: "present_address_details" | "permanent_address_details", field: keyof AddressDetails, value: string) => {
    setEditProfileData(prev => prev ? { ...prev, [type]: { ...prev[type], [field]: value } } : null);
  };

  const handleCancel = () => {
    setEditingSection(null);
    setEditedUser({ ...user });
  };

  const handleInputChange = (field: string, value: any) => {
    setEditedUser(prev => ({ ...prev, [field]: value }));
  };

  // --- Save (with corrected field names for backend) ---
  const handleSave = async () => {
    if (!user || !company) return;
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
        is_wfh: editedUser.is_wfh,
        is_active: editedUser.is_active,
        role_id: editedUser.role_id,
        group_id: editedUser.group_id,
        is_whatsapp: editedUser.is_whatsapp || false,
        is_sms: editedUser.is_sms || false,
      };

      if (editProfileData) {
        payload.profile = {
          dob: nullIfEmpty(editProfileData.dob),
          // Backend expects "religion" and "caste" (not religion_id/caste_id)
          religion: editProfileData.religion_id,
          caste: editProfileData.caste_id,
          staff_type: editProfileData.staff_type_id,
          staff_category: editProfileData.staff_category_id,
          ktu_id: editProfileData.ktu_id,
          aicte_id: editProfileData.aicte_id,
          pan_no: editProfileData.pan_no,
          aadhar_no: editProfileData.aadhar_no,
          blood_group: editProfileData.blood_group,
          alternate_mobile: editProfileData.alternate_mobile,
          alternate_email: editProfileData.alternate_email,
        };
        payload.present_address = ensureAddressDefaults(editProfileData.present_address_details);
        payload.permanent_address = ensureAddressDefaults(editProfileData.permanent_address_details);
      }

      console.log("Saving payload:", payload); // Debug

      const response = await fetch("/api/employee-with-profile/", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-company-id": company.id.toString() },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Failed to update profile");

      toast.success("Profile updated successfully!");
      setEditingSection(null);
      
      if (updateUser && result.data?.user) {
        updateUser(result.data.user);
        setEditedUser(result.data.user);
      }
      
      // Force a complete refetch to get the latest data
      await fetchProfile();
      
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const createEmptyProfile = async () => {
    if (!user?.id || !company?.id) return;
    setProfileLoading(true);
    try {
      const payload = {
        user_id: user.id,
        profile: {
          dob: "1900-01-01",
          religion: null, caste: null,
          staff_type: null, staff_category: null,
          ktu_id: "", aicte_id: "",
          pan_no: "", aadhar_no: "", blood_group: "", alternate_mobile: "", alternate_email: "",
        },
        present_address: { address_line_1: "Not provided", address_line_2: "", city: "Not provided", district: "Not provided", state: "Not provided", country: "Not provided", pincode: "0000000000" },
        permanent_address: { address_line_1: "Not provided", address_line_2: "", city: "Not provided", district: "Not provided", state: "Not provided", country: "Not provided", pincode: "0000000000" },
      };
      const response = await fetch("/api/employee-with-profile/", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-company-id": company.id.toString() },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error("Failed to create profile");
      toast.success("Extended profile initialized!");
      await fetchProfile();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProfileLoading(false);
    }
  };

  if (!user) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  const profileUrl = getProfileImageUrl();
  const initials = getInitials();

  if (profileLoading && !fullProfile && retryCount === 0) {
    return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center"><div className="text-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div><p className="text-gray-500">Loading your profile data...</p></div></div>;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8">
      <div className="max-w-6xl mx-auto pb-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#eff6ff] rounded-lg text-[#2563eb] shadow-sm"><SquareUser className="h-8 w-8" /></div>
            <div><h1 className="text-2xl font-bold text-[#0f2744]">My Profile</h1><p className="text-sm text-[#7a8ba0] mt-0.5">Manage your personal information and preferences</p></div>
          </div>
          {!fullProfile && !profileLoading && <Button onClick={createEmptyProfile} className="bg-blue-50 text-blue-700 border-none hover:bg-blue-100"><Plus className="h-4 w-4 mr-2" /> Initialize Extended Profile</Button>}
          {!fullProfile && !profileLoading && retryCount >= 2 && <Button onClick={() => { setRetryCount(0); fetchProfile(); }} variant="outline" className="border-amber-200 text-amber-700"><RefreshCw className="h-4 w-4 mr-2" /> Retry Loading</Button>}
        </div>

        {/* Inactive User Warning */}
        {!user.is_active && <Alert className="mb-6 bg-yellow-50 border-yellow-200"><AlertDescription className="text-yellow-800 flex items-center gap-2"><XCircle className="h-4 w-4" /><span><strong>Account Inactive:</strong> Your account is currently inactive. Please contact your administrator.</span></AlertDescription></Alert>}

        {/* Hero Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative group">
              <div className="h-32 w-32 rounded-2xl overflow-hidden border-4 border-blue-50 shadow-inner bg-blue-50 flex items-center justify-center">
                {profileUrl ? <Image src={profileUrl} alt="Profile" width={128} height={128} className="object-cover h-full w-full" /> : <div className="flex flex-col items-center justify-center text-blue-700"><span className="text-4xl font-bold">{initials}</span><span className="text-xs font-semibold uppercase mt-1">User</span></div>}
              </div>
              <div className={`absolute -bottom-2 -right-2 h-8 w-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${user.is_active ? "bg-green-500" : "bg-red-500"}`}>
                {user.is_active ? <CheckCircle className="h-4 w-4 text-white" /> : <XCircle className="h-4 w-4 text-white" />}
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div><h2 className="text-3xl font-bold text-gray-900 mb-1">{user.first_name} {user.last_name}</h2><div className="flex items-center justify-center md:justify-start gap-2 text-gray-500"><Mail className="h-4 w-4" /><span>{user.email}</span></div></div>
                <div className="flex flex-wrap justify-center md:justify-end gap-2 text-sm">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none px-3 py-1"><Briefcase className="h-3 w-3 mr-1.5" /> {user.role}</Badge>
                  {isAdmin && <Badge className="bg-amber-50 text-amber-700 border-amber-200 px-3 py-1"><Shield className="h-3 w-3 mr-1.5" /> Admin</Badge>}
                  {user.is_superuser && <Badge className="bg-purple-50 text-purple-700 border-purple-200 px-3 py-1"><Crown className="h-3 w-3 mr-1.5" /> Super User</Badge>}
                </div>
              </div>
              <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-6 border-t border-gray-100 pt-6">
                <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <span className="text-[10px] font-bold uppercase text-gray-400 ml-2">Account Status</span>
                  <Switch checked={editedUser.is_active || false} onCheckedChange={(val) => { handleInputChange("is_active", val); handleSave(); }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-between"><div><h3 className="text-sm font-semibold text-gray-500 mb-1">User ID</h3><p className="text-2xl font-bold text-blue-600">#{user.id}</p></div><div className="p-3 bg-blue-50 rounded-lg"><Hash className="h-6 w-6 text-blue-600" /></div></div>
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-between"><div><h3 className="text-sm font-semibold text-gray-500 mb-1">Biometric ID</h3><p className="text-2xl font-bold text-green-600">{user.biometric_id || "--"}</p></div><div className="p-3 bg-green-50 rounded-lg"><Activity className="h-6 w-6 text-green-600" /></div></div>
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-between"><div><h3 className="text-sm font-semibold text-gray-500 mb-1">Current Group</h3><p className="text-2xl font-bold text-purple-600">{user.group || "General"}</p></div><div className="p-3 bg-purple-50 rounded-lg"><Users className="h-6 w-6 text-purple-600" /></div></div>
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-between"><div><h3 className="text-sm font-semibold text-gray-500 mb-1">Account Level</h3><p className="text-2xl font-bold text-amber-600">{user.role_id === 1 ? "Admin" : "Member"}</p></div><div className="p-3 bg-amber-50 rounded-lg"><ShieldCheck className="h-6 w-6 text-amber-600" /></div></div>
        </div>

        {/* Extended Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Contact Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600"><Smartphone className="h-5 w-5" /></div><h3 className="text-lg font-bold text-gray-900">Contact Details</h3></div>
              <Button variant="outline" size="sm" onClick={() => handleEditExtended("contact")} className="text-green-600 border-green-100 bg-green-50 hover:bg-green-100"><Edit3 className="h-3.5 w-3.5 mr-2" /> Edit</Button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Primary Email</p><p className="text-base font-semibold text-gray-800">{user.email || "Not provided"}</p></div>
                <div><p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Alternate Email</p><p className="text-base font-semibold text-gray-800">{fullProfile?.alternate_email || "Not provided"}</p></div>
                <div><p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Primary Mobile</p><p className="text-base font-semibold text-gray-800">{user.mobile || "Not provided"}</p></div>
                <div><p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Alternate Mobile</p><p className="text-base font-semibold text-gray-800">{fullProfile?.alternate_mobile || "Not provided"}</p></div>
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600"><UserIcon className="h-5 w-5" /></div><h3 className="text-lg font-bold text-gray-900">Personal Details</h3></div>
              <Button variant="outline" size="sm" onClick={() => handleEditExtended("personal")} className="text-purple-600 border-purple-100 bg-purple-50 hover:bg-purple-100"><Edit3 className="h-3.5 w-3.5 mr-2" /> Edit</Button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-[10px] uppercase font-bold text-gray-400 mb-1">First Name</p><p className="text-base font-semibold">{user.first_name}</p></div>
                <div><p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Last Name</p><p className="text-base font-semibold">{user.last_name}</p></div>
                <div><p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Gender</p><p className="text-base font-semibold flex items-center gap-2"><span>{getGenderIcon(user.gender)}</span> {user.gender_display || (user.gender === "M" ? "Male" : user.gender === "F" ? "Female" : "Other")}</p></div>
                <div><p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Date of Birth</p><p className="text-base font-semibold">{fullProfile?.dob || "Not provided"}</p></div>
                <div><p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Blood Group</p><p className="text-base font-semibold flex items-center gap-1"><Heart className="h-4 w-4 text-red-500" /> {fullProfile?.blood_group || "Not provided"}</p></div>
                <div><p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Religion</p><p className="text-base font-semibold">{fullProfile?.religion_name || "Not provided"}</p></div>
                <div><p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Caste</p><p className="text-base font-semibold">{fullProfile?.caste_name || "Not provided"}</p></div>
              </div>
            </div>
          </div>

          {/* Identity & Legal */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600"><ShieldCheck className="h-5 w-5" /></div><h3 className="text-lg font-bold text-gray-900">Identity & Legal</h3></div>
              <Button variant="outline" size="sm" onClick={() => handleEditExtended("legal")} className="text-amber-600 border-amber-100 bg-amber-50 hover:bg-amber-100"><Edit3 className="h-3.5 w-3.5 mr-2" /> Edit</Button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div><p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Aadhaar Number</p><p className="text-base font-bold text-gray-800">{fullProfile?.aadhar_no || "Not provided"}</p></div>
                <div><p className="text-[10px] font-bold uppercase text-gray-400 mb-1">PAN Number</p><p className="text-base font-bold text-gray-800 uppercase">{fullProfile?.pan_no || "Not provided"}</p></div>
                <div><p className="text-[10px] font-bold uppercase text-gray-400 mb-1">KTU ID</p><p className="text-base font-bold text-gray-800">{fullProfile?.ktu_id || "Not provided"}</p></div>
                <div><p className="text-[10px] font-bold uppercase text-gray-400 mb-1">AICTE ID</p><p className="text-base font-bold text-gray-800">{fullProfile?.aicte_id || "Not provided"}</p></div>
              </div>
            </div>
          </div>

          {/* Security & Access */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600"><Shield className="h-5 w-5" /></div><h3 className="text-lg font-bold text-gray-900">Security & Access</h3></div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50"><div className="flex items-center gap-3"><Key className="h-4 w-4 text-purple-500" /><span className="text-sm font-medium text-gray-700">Administrator Access</span></div><Badge variant={isAdmin ? "default" : "secondary"} className={isAdmin ? "bg-purple-600" : ""}>{isAdmin ? "Full Access" : "Restricted"}</Badge></div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50"><div className="flex items-center gap-3"><Crown className="h-4 w-4 text-pink-500" /><span className="text-sm font-medium text-gray-700">Superuser Privileges</span></div><Badge variant={user.is_superuser ? "default" : "secondary"} className={user.is_superuser ? "bg-pink-600" : ""}>{user.is_superuser ? "Yes" : "No"}</Badge></div>
            </div>
          </div>
        </div>

        {/* Address Matrix */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-gray-900 flex items-center justify-center text-white"><MapPin className="h-5 w-5" /></div><h3 className="text-lg font-bold text-gray-900">Address Matrix</h3></div>
            <Button variant="outline" size="sm" onClick={() => handleEditExtended("address")} className="text-gray-900 border-gray-200 bg-gray-50 hover:bg-gray-100"><Edit3 className="h-3.5 w-3.5 mr-2" /> Edit</Button>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div><p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Present Residence</p><div className="p-4 bg-gray-50 rounded-lg border border-gray-100 min-h-[120px]"><div className="text-sm font-semibold text-gray-800">{displayAddress(fullProfile?.present_address_details)}</div></div></div>
            <div><p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Permanent Landmark</p><div className="p-4 bg-gray-50 rounded-lg border border-gray-100 min-h-[120px]"><div className="text-sm font-semibold text-gray-800">{displayAddress(fullProfile?.permanent_address_details)}</div></div></div>
          </div>
        </div>

        {/* Work Preferences */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600"><Settings className="h-5 w-5" /></div><h3 className="text-lg font-bold text-gray-900">Work Preferences</h3></div>
            <Button variant="outline" size="sm" onClick={() => handleEditExtended("preferences")} className="text-orange-600 border-orange-100 bg-orange-50 hover:bg-orange-100"><Edit3 className="h-3.5 w-3.5 mr-2" /> Edit</Button>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50"><div className="flex items-center gap-3"><Home className="h-4 w-4 text-orange-500" /><span className="text-sm font-medium text-gray-700">Work From Home</span></div><Badge variant={user.is_wfh ? "default" : "secondary"} className={user.is_wfh ? "bg-orange-500" : ""}>{user.is_wfh ? "Enabled" : "Disabled"}</Badge></div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50"><div className="flex items-center gap-3"><MessageCircle className="h-4 w-4 text-green-500" /><span className="text-sm font-medium text-gray-700">WhatsApp Alerts</span></div><Badge variant={user.is_whatsapp ? "default" : "secondary"} className={user.is_whatsapp ? "bg-green-500" : ""}>{user.is_whatsapp ? "Enabled" : "Disabled"}</Badge></div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50"><div className="flex items-center gap-3"><MessageSquare className="h-4 w-4 text-blue-500" /><span className="text-sm font-medium text-gray-700">SMS Notifications</span></div><Badge variant={user.is_sms ? "default" : "secondary"} className={user.is_sms ? "bg-blue-500" : ""}>{user.is_sms ? "Enabled" : "Disabled"}</Badge></div>
          </div>
        </div>

        {/* ========== EDIT DIALOGS (unchanged) ========== */}
        {/* Contact Dialog */}
        <Dialog open={editingSection === "contact"} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="max-w-md bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-8 bg-green-600 text-white relative">
              <DialogTitle className="text-2xl font-black">Communication Edit</DialogTitle>
              <DialogDescription className="text-green-100 font-bold opacity-80">Manage primary and alternate contact channels.</DialogDescription>
              <div className="absolute top-8 right-8 text-green-400 opacity-20"><Smartphone className="h-16 w-16" /></div>
            </DialogHeader>
            <div className="p-8 space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Alternate Email</Label>
                  <Input
                    value={editProfileData?.alternate_email || ""}
                    onChange={(e) => handleProfileChange("alternate_email", e.target.value)}
                    placeholder="alternate@example.com"
                    className="rounded-xl h-11 border-slate-200 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Alternate Mobile</Label>
                  <Input
                    value={editProfileData?.alternate_mobile || ""}
                    onChange={(e) => handleProfileChange("alternate_mobile", e.target.value)}
                    placeholder="+91 9876543210"
                    className="rounded-xl h-11 border-slate-200 font-bold"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="p-8 bg-slate-50">
              <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 w-full h-12 font-black rounded-xl shadow-lg shadow-green-100">
                {isSaving ? "Saving..." : "Apply Transformations"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Personal Details Dialog */}
        <Dialog open={editingSection === "personal"} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="max-w-2xl bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-8 bg-purple-600 text-white relative">
              <DialogTitle className="text-2xl font-black">Private Identity Metadata</DialogTitle>
              <DialogDescription className="text-purple-100 font-bold opacity-80">Refine demographic details and physical attributes.</DialogDescription>
              <div className="absolute top-8 right-8 text-purple-400 opacity-20"><UserIcon className="h-16 w-16" /></div>
            </DialogHeader>
            <div className="p-8 space-y-6 max-h-[60vh] overflow-auto">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" value={editProfileData?.dob || ""} onChange={(e) => handleProfileChange("dob", e.target.value)} className="rounded-xl h-11 font-bold" />
                </div>
                <div className="space-y-2">
                  <Label>Blood Group</Label>
                  <Select value={editProfileData?.blood_group || ""} onValueChange={(v) => handleProfileChange("blood_group", v)}>
                    <SelectTrigger className="rounded-xl h-11 font-bold"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(bg => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Religion</Label>
                  <Select value={editProfileData?.religion_id?.toString() || ""} onValueChange={(v) => handleProfileChange("religion_id", v ? parseInt(v) : null)}>
                    <SelectTrigger className="rounded-xl h-11 font-bold"><SelectValue placeholder="Select religion" /></SelectTrigger>
                    <SelectContent>
                      {religions.map(r => <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Caste</Label>
                  <Select value={editProfileData?.caste_id?.toString() || ""} onValueChange={(v) => handleProfileChange("caste_id", v ? parseInt(v) : null)} disabled={!editProfileData?.religion_id}>
                    <SelectTrigger className="rounded-xl h-11 font-bold"><SelectValue placeholder="Select caste" /></SelectTrigger>
                    <SelectContent>
                      {castes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Staff Type</Label>
                  <Select value={editProfileData?.staff_type_id?.toString() || ""} onValueChange={(v) => handleProfileChange("staff_type_id", v ? parseInt(v) : null)}>
                    <SelectTrigger className="rounded-xl h-11 font-bold"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {staffTypes.map(st => <SelectItem key={st.id} value={st.id.toString()}>{st.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Staff Category</Label>
                  <Select value={editProfileData?.staff_category_id?.toString() || ""} onValueChange={(v) => handleProfileChange("staff_category_id", v ? parseInt(v) : null)}>
                    <SelectTrigger className="rounded-xl h-11 font-bold"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {staffCategories.map(sc => <SelectItem key={sc.id} value={sc.id.toString()}>{sc.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter className="p-8 bg-slate-50">
              <Button onClick={handleSave} disabled={isSaving} className="bg-purple-600 w-full h-12 font-black rounded-xl shadow-lg shadow-purple-100">
                {isSaving ? "Saving..." : "Update Identity"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Identity & Legal Dialog */}
        <Dialog open={editingSection === "legal"} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="max-w-md bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-8 bg-amber-600 text-white relative">
              <DialogTitle className="text-2xl font-black">Statutory Identities</DialogTitle>
              <DialogDescription className="text-amber-100 font-bold opacity-80">Update governmental and legal identification numbers.</DialogDescription>
              <div className="absolute top-8 right-8 text-amber-400 opacity-20"><ShieldCheck className="h-16 w-16" /></div>
            </DialogHeader>
            <div className="p-8 space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2"><Label>Aadhaar Number</Label><Input value={editProfileData?.aadhar_no || ""} onChange={(e) => handleProfileChange("aadhar_no", e.target.value)} className="rounded-xl h-11 font-bold" /></div>
                <div className="space-y-2"><Label>PAN Number</Label><Input value={editProfileData?.pan_no || ""} onChange={(e) => handleProfileChange("pan_no", e.target.value)} className="rounded-xl h-11 font-bold uppercase" /></div>
                <Separator />
                <div className="space-y-2"><Label>KTU ID</Label><Input value={editProfileData?.ktu_id || ""} onChange={(e) => handleProfileChange("ktu_id", e.target.value)} className="rounded-xl h-11 font-bold" /></div>
                <div className="space-y-2"><Label>AICTE ID</Label><Input value={editProfileData?.aicte_id || ""} onChange={(e) => handleProfileChange("aicte_id", e.target.value)} className="rounded-xl h-11 font-bold" /></div>
              </div>
            </div>
            <DialogFooter className="p-8 bg-slate-50">
              <Button onClick={handleSave} disabled={isSaving} className="bg-amber-600 w-full h-12 font-black rounded-xl shadow-lg shadow-amber-100">
                {isSaving ? "Saving..." : "Commit IDs"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Address Dialog */}
        <Dialog open={editingSection === "address"} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto bg-white rounded-3xl border-none p-0 shadow-2xl">
            <DialogHeader className="p-8 bg-slate-900 text-white relative">
              <DialogTitle className="text-2xl font-black">Residence Data Protocol</DialogTitle>
              <DialogDescription className="text-slate-400 font-bold">Update Present and Permanent Physical Coordinates.</DialogDescription>
              <div className="absolute top-8 right-8 text-slate-700 opacity-30"><MapPin className="h-16 w-16" /></div>
            </DialogHeader>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Present Address */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-blue-600 tracking-widest">Present Residence</h4>
                <div className="space-y-3">
                  <Input placeholder="Line 1" value={editProfileData?.present_address_details?.address_line_1 || ""} onChange={(e) => handleAddressChange("present_address_details", "address_line_1", e.target.value)} className="rounded-xl h-10" />
                  <Input placeholder="Line 2" value={editProfileData?.present_address_details?.address_line_2 || ""} onChange={(e) => handleAddressChange("present_address_details", "address_line_2", e.target.value)} className="rounded-xl h-10" />
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="City" value={editProfileData?.present_address_details?.city || ""} onChange={(e) => handleAddressChange("present_address_details", "city", e.target.value)} className="rounded-xl h-10" />
                    <Input placeholder="District" value={editProfileData?.present_address_details?.district || ""} onChange={(e) => handleAddressChange("present_address_details", "district", e.target.value)} className="rounded-xl h-10" />
                  </div>
                  <Input placeholder="State" value={editProfileData?.present_address_details?.state || ""} onChange={(e) => handleAddressChange("present_address_details", "state", e.target.value)} className="rounded-xl h-10" />
                  <Input placeholder="Country" value={editProfileData?.present_address_details?.country || ""} onChange={(e) => handleAddressChange("present_address_details", "country", e.target.value)} className="rounded-xl h-10" />
                  <Input 
                    placeholder="Pincode" 
                    value={editProfileData?.present_address_details?.pincode || ""} 
                    onChange={(e) => handleAddressChange("present_address_details", "pincode", e.target.value)} 
                    className="rounded-xl h-10" 
                    maxLength={10}
                  />
                </div>
              </div>
              {/* Permanent Address */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-indigo-600 tracking-widest">Permanent Landmark</h4>
                <div className="space-y-3">
                  <Input placeholder="Line 1" value={editProfileData?.permanent_address_details?.address_line_1 || ""} onChange={(e) => handleAddressChange("permanent_address_details", "address_line_1", e.target.value)} className="rounded-xl h-10" />
                  <Input placeholder="Line 2" value={editProfileData?.permanent_address_details?.address_line_2 || ""} onChange={(e) => handleAddressChange("permanent_address_details", "address_line_2", e.target.value)} className="rounded-xl h-10" />
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="City" value={editProfileData?.permanent_address_details?.city || ""} onChange={(e) => handleAddressChange("permanent_address_details", "city", e.target.value)} className="rounded-xl h-10" />
                    <Input placeholder="District" value={editProfileData?.permanent_address_details?.district || ""} onChange={(e) => handleAddressChange("permanent_address_details", "district", e.target.value)} className="rounded-xl h-10" />
                  </div>
                  <Input placeholder="State" value={editProfileData?.permanent_address_details?.state || ""} onChange={(e) => handleAddressChange("permanent_address_details", "state", e.target.value)} className="rounded-xl h-10" />
                  <Input placeholder="Country" value={editProfileData?.permanent_address_details?.country || ""} onChange={(e) => handleAddressChange("permanent_address_details", "country", e.target.value)} className="rounded-xl h-10" />
                  <Input 
                    placeholder="Pincode" 
                    value={editProfileData?.permanent_address_details?.pincode || ""} 
                    onChange={(e) => handleAddressChange("permanent_address_details", "pincode", e.target.value)} 
                    className="rounded-xl h-10" 
                    maxLength={10}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="p-8 bg-slate-50">
              <Button onClick={handleSave} disabled={isSaving} className="bg-slate-900 w-full h-12 font-black rounded-xl shadow-lg shadow-slate-200">
                {isSaving ? "Saving..." : "Commit Physical Data"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Work Preferences Dialog */}
        <Dialog open={editingSection === "preferences"} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="max-w-md bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-8 bg-orange-600 text-white relative">
              <DialogTitle className="text-2xl font-black">System Configurations</DialogTitle>
              <DialogDescription className="text-orange-100 font-bold opacity-80">Manage Work-from-home and automated alert policies.</DialogDescription>
              <div className="absolute top-8 right-8 text-orange-400 opacity-20"><Settings className="h-16 w-16" /></div>
            </DialogHeader>
            <div className="p-8 space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm text-orange-500"><Home className="h-4 w-4" /></div>
                  <span className="text-xs font-bold text-slate-700">Work From Home</span>
                </div>
                <Switch checked={editedUser.is_wfh || false} onCheckedChange={(val) => handleInputChange("is_wfh", val)} />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm text-green-500"><MessageCircle className="h-4 w-4" /></div>
                  <span className="text-xs font-bold text-slate-700">WhatsApp Alerts</span>
                </div>
                <Switch checked={editedUser.is_whatsapp || false} onCheckedChange={(val) => handleInputChange("is_whatsapp", val)} />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm text-blue-500"><MessageSquare className="h-4 w-4" /></div>
                  <span className="text-xs font-bold text-slate-700">SMS Notifications</span>
                </div>
                <Switch checked={editedUser.is_sms || false} onCheckedChange={(val) => handleInputChange("is_sms", val)} />
              </div>
            </div>
            <DialogFooter className="p-8 bg-slate-50">
              <Button onClick={handleSave} disabled={isSaving} className="bg-orange-600 w-full h-12 font-black rounded-xl shadow-lg shadow-orange-100">
                {isSaving ? "Saving..." : "Sync Preferences"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}