"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail, UserIcon, Briefcase, Shield, ShieldCheck,
  MessageSquare, MessageCircle, Home, Activity, Hash, Users,
  CheckCircle, XCircle, Crown, Edit3, Settings, Key, Smartphone,
  Heart, MapPin, Plus, RefreshCw, Camera,
} from "lucide-react";
import { useAuth, User } from "@/context/AuthContext";
import { useState, useEffect, useRef, useCallback } from "react";
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
  guardian_name?: string | null;
  guardian_phone?: string | null;
  religion_name?: string | null;
  caste_name?: string | null;
  staff_type?: string | null;
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
  religion?: number | null;
  caste?: number | null;
}

interface EditableProfile {
  id: number;
  user: number;
  dob: string | null;
  guardian_name: string;
  guardian_phone: string;
  religion_id: number | null;
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
interface GroupItem { id: number; group?: string; name?: string; group_name?: string; }
interface RoleItem { id: number; role?: string; name?: string; }

export default function ProfilePage() {
  const { user, isAdmin, updateUser, company } = useAuth();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedUser, setEditedUser] = useState<User | null>(user ? { ...user } : null);
  const [isSaving, setIsSaving] = useState(false);

  const [fullProfile, setFullProfile] = useState<EmployeeFullProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editProfileData, setEditProfileData] = useState<EditableProfile | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Image upload & error states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lookups
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [staffTypes, setStaffTypes] = useState<LookupItem[]>([]);
  const [staffCategories, setStaffCategories] = useState<LookupItem[]>([]);
  const [religions, setReligions] = useState<LookupItem[]>([]);
  const [castes, setCastes] = useState<LookupItem[]>([]);

  // Refs to prevent duplicate fetches
  const initialFetchDone = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Helper: sanitize User object
  const sanitizeUser = useCallback((rawUser: any): User => ({
    id: rawUser.id,
    first_name: rawUser.first_name || '',
    last_name: rawUser.last_name || '',
    email: rawUser.email || '',
    mobile: rawUser.mobile || '',
    role: rawUser.role || '',
    gender: rawUser.gender || '',
    group: rawUser.group || '',
    prof_img: rawUser.prof_img || null,
    biometric_id: rawUser.biometric_id || null,
    is_active: rawUser.is_active ?? true,
    is_wfh: rawUser.is_wfh ?? false,
    is_whatsapp: rawUser.is_whatsapp ?? false,
    is_sms: rawUser.is_sms ?? false,
    is_superuser: rawUser.is_superuser ?? false,
    role_id: rawUser.role_id ?? null,
    group_id: rawUser.group_id ?? null,
    gender_display: rawUser.gender_display || '',
  }), []);

  // Helper functions for display
  const getGroupName = (groupId: string | number | undefined) => {
    if (!groupId) return "Not provided";
    const asNum = Number(groupId);
    if (!isNaN(asNum)) {
      const found = groups.find(g => g.id === asNum);
      return found ? (found.group || found.name || found.group_name) : "Not provided";
    }
    return String(groupId);
  };

  const getRoleName = (roleId: string | number | undefined) => {
    if (!roleId) return "Not provided";
    const asNum = Number(roleId);
    if (!isNaN(asNum)) {
      const found = roles.find(r => r.id === asNum);
      return found ? (found.role || found.name) : "Not provided";
    }
    return String(roleId);
  };

  const getStaffTypeName = (id: any) => {
    if (!id) return "Not provided";
    const found = staffTypes.find(t => t.id === Number(id));
    return found ? found.name : `ID ${id}`;
  };

  const getStaffCategoryName = (id: any) => {
    if (!id) return "Not provided";
    const found = staffCategories.find(c => c.id === Number(id));
    return found ? found.name : `ID ${id}`;
  };

  const getGenderIcon = (gender: string) => ({ M: "👨", F: "👩" }[gender] || "🧑");
  const getInitials = () => `${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`;

  // Correct image URL using env variable
  const getProfileImageUrl = () => {
    if (!user?.prof_img) return null;
    if (user.prof_img.startsWith('http')) return user.prof_img;
    const baseUrl = process.env.NEXT_PUBLIC_COMPANY_MEDIA_BASE || '';
    const path = user.prof_img.startsWith('/') ? user.prof_img : `/${user.prof_img}`;
    return `${baseUrl}${path}`;
  };

  const calculateAge = (dob: string | null | undefined): number | null => {
    if (!dob) return null;
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  };

  // --- API calls with AbortController ---
  const fetchProfile = useCallback(async () => {
    if (!user?.id || !company?.id) return;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setProfileLoading(true);
    try {
      const res = await fetch(`/api/employee-with-profile?user_id=${user.id}`, {
        cache: "no-store",
        headers: { "x-company-id": company.id.toString() },
        signal: controller.signal,
      });
      if (res.ok) {
        const result = await res.json();
        if (result?.success && result.data) {
          const profileData = result.data.profile || result.data;
          const presentAddress = profileData.present_address_details || profileData.present_address || null;
          const permanentAddress = profileData.permanent_address_details || profileData.permanent_address || null;
          const religionId = profileData.religion ?? null;
          const casteId = profileData.caste ?? null;
          let religionName = profileData.religion_name;
          let casteName = profileData.caste_name;
          if (profileData.religion && typeof profileData.religion === 'object') {
            religionName = profileData.religion.name;
          }
          if (profileData.caste && typeof profileData.caste === 'object') {
            casteName = profileData.caste.name;
          }
          const mapped: EmployeeFullProfile = {
            ...profileData,
            religion: religionId,
            caste: casteId,
            religion_name: religionName,
            caste_name: casteName,
            present_address_details: presentAddress,
            permanent_address_details: permanentAddress,
          };
          setFullProfile(mapped);
          setRetryCount(0);
        } else {
          setFullProfile(null);
        }
      } else {
        setFullProfile(null);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error(err);
    } finally {
      if (abortControllerRef.current === controller) setProfileLoading(false);
    }
  }, [user?.id, company?.id]);

  const fetchLookups = useCallback(async () => {
    if (!company?.id) return;
    try {
      const [staffTypeRes, staffCatRes, religionRes, groupsRes, rolesRes] = await Promise.all([
        fetch(`/api/settings/staff_type/${company.id}`, { headers: { "x-company-id": company.id.toString() } }),
        fetch(`/api/settings/staff_category/${company.id}`, { headers: { "x-company-id": company.id.toString() } }),
        fetch(`/api/settings/manage-religion/`, { headers: { "x-company-id": company.id.toString() } }),
        fetch(`/api/settings/groups/${company.id}`, { headers: { "x-company-id": company.id.toString() } }),
        fetch(`/api/settings/roles/${company.id}`, { headers: { "x-company-id": company.id.toString() } }),
      ]);

      const safeJson = async (res: Response) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        try { return JSON.parse(text); } catch { throw new Error("Invalid JSON"); }
      };

      const staffTypeData = await safeJson(staffTypeRes);
      const staffCatData = await safeJson(staffCatRes);
      const religionData = await safeJson(religionRes);
      const groupsData = await safeJson(groupsRes);
      const rolesData = await safeJson(rolesRes);

      const typesArray = staffTypeData?.types ?? staffTypeData?.data ?? (Array.isArray(staffTypeData) ? staffTypeData : []);
      setStaffTypes(typesArray.map((st: any) => ({ id: st.id, name: st.type_name || st.name || st.type })));

      const categoriesArray = staffCatData?.categories ?? staffCatData?.data ?? (Array.isArray(staffCatData) ? staffCatData : []);
      setStaffCategories(categoriesArray.map((sc: any) => ({ id: sc.id, name: sc.category_name || sc.name || sc.category })));

      const religionsArray = religionData?.data ?? (Array.isArray(religionData) ? religionData : []);
      setReligions(religionsArray.map((r: any) => ({ id: r.id, name: r.name })));

      const groupsArray = groupsData?.data ?? (Array.isArray(groupsData) ? groupsData : []);
      setGroups(groupsArray.map((g: any) => ({ id: g.id, group: g.group || g.name || g.group_name })));

      const rolesArray = rolesData?.data ?? (Array.isArray(rolesData) ? rolesData : []);
      setRoles(rolesArray.map((r: any) => ({ id: r.id, role: r.role || r.name })));
    } catch (e) {
      console.error("Lookup fetch error:", e);
      toast.error("Failed to load dropdown data. Please refresh.");
    }
  }, [company?.id]);

  // --- Initial data fetch (only once) ---
  useEffect(() => {
    if (!initialFetchDone.current && user?.id && company?.id) {
      initialFetchDone.current = true;
      fetchProfile();
      fetchLookups();
    }
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [user?.id, company?.id, fetchProfile, fetchLookups]);

  // Auto‑retry on failure
  useEffect(() => {
    if (!fullProfile && !profileLoading && retryCount < 2 && user?.id && company?.id) {
      const timer = setTimeout(() => { fetchProfile(); setRetryCount(c => c + 1); }, 2000);
      return () => clearTimeout(timer);
    }
  }, [fullProfile, profileLoading, retryCount, user?.id, company?.id, fetchProfile]);

  // Sync editedUser when user changes
  useEffect(() => {
    if (user) setEditedUser(prev => prev?.id === user.id ? prev : { ...user });
  }, [user]);

  // Reset image error when profile image URL changes
  useEffect(() => {
    setImgError(false);
  }, [user?.prof_img]);

  // Fetch castes when religion changes in personal edit mode
  useEffect(() => {
    if (editingSection !== "personal") {
      setCastes([]);
      return;
    }
    const religionId = editProfileData?.religion_id;
    if (!religionId || typeof religionId !== 'number') {
      setCastes([]);
      return;
    }
    let isMounted = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/settings/manage-caste/?religion_id=${religionId}`, {
          headers: company?.id ? { "x-company-id": company.id.toString() } : {},
        });
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.data || [];
        if (isMounted) setCastes(items.map((c: any) => ({ id: c.id, name: c.name })));
      } catch (e) { console.error(e); if (isMounted) setCastes([]); }
    };
    load();
    return () => { isMounted = false; };
  }, [editProfileData?.religion_id, editingSection, company?.id]);

  // Enrich profile with religion/caste names when lookups load
  useEffect(() => {
    if (!fullProfile) return;
    if (fullProfile.religion_name && fullProfile.caste_name) return;
    let updated = false;
    const newProfile = { ...fullProfile };
    if (!newProfile.religion_name && newProfile.religion && religions.length) {
      const rel = religions.find(r => r.id === newProfile.religion);
      if (rel) { newProfile.religion_name = rel.name; updated = true; }
    }
    if (!newProfile.caste_name && newProfile.caste && castes.length) {
      const caste = castes.find(c => c.id === newProfile.caste);
      if (caste) { newProfile.caste_name = caste.name; updated = true; }
    }
    if (updated) setFullProfile(newProfile);
  }, [fullProfile, religions, castes]);

  // --- Helpers for saving ---
  const ensureAddressDefaults = (addr: AddressDetails): AddressDetails => {
    const requiredFields = ['address_line_1', 'city', 'district', 'state', 'country', 'pincode'];
    const result = { ...addr };
    for (const field of requiredFields) {
      const value = result[field as keyof AddressDetails];
      if (!value || value.trim() === '') {
        if (field === 'pincode') (result as any)[field] = '0000000000';
        else (result as any)[field] = 'Not provided';
      }
    }
    return result;
  };

  const nullIfEmpty = (value: string | null | undefined): string | null => {
    if (value === undefined || value === null || value.trim() === '') return null;
    return value;
  };

  // --- Image Upload Handler ---
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, or WEBP images are allowed');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be smaller than 2MB');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('prof_img', file);
      formData.append('user_id', user.id.toString());

      const response = await fetch('/api/employee-with-profile/', { method: 'PUT', body: formData });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || result.error || 'Upload failed');

      const newImageUrl = result.data?.user?.prof_img || result.prof_img;
      if (newImageUrl && updateUser) {
        const updatedUser = sanitizeUser({ ...user, prof_img: newImageUrl });
        updateUser(updatedUser);
        setEditedUser(updatedUser);
      }
      toast.success('Profile picture updated!');
      await fetchProfile();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- Edit handlers ---
  const handleEditExtended = (section: string) => {
    if (!user) return;
    let religionId = null, casteId = null;
    if (fullProfile) {
      religionId = fullProfile.religion ?? null;
      casteId = fullProfile.caste ?? null;
    }

    let staffTypeId = fullProfile?.staff_type ? Number(fullProfile.staff_type) : null;
    let staffCategoryId = fullProfile?.staff_category ? Number(fullProfile.staff_category) : null;
    if (isNaN(staffTypeId as number)) staffTypeId = null;
    if (isNaN(staffCategoryId as number)) staffCategoryId = null;

    setEditProfileData({
      id: fullProfile?.id || 0,
      user: user.id,
      dob: fullProfile?.dob || "",
      guardian_name: fullProfile?.guardian_name || "",
      guardian_phone: fullProfile?.guardian_phone || "",
      religion_id: religionId,
      caste_id: casteId,
      staff_type_id: staffTypeId,
      staff_category_id: staffCategoryId,
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
    if (user) setEditedUser({ ...user });
  };

  const handleInputChange = (field: string, value: any) => {
    setEditedUser(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleGroupChange = (groupId: string) => {
    const selectedGroup = groups.find(g => g.id.toString() === groupId);
    if (selectedGroup) {
      handleInputChange("group", selectedGroup.group || selectedGroup.name || selectedGroup.group_name);
      handleInputChange("group_id", selectedGroup.id);
    }
  };

  const handleRoleChange = (roleId: string) => {
    const selectedRole = roles.find(r => r.id.toString() === roleId);
    if (selectedRole) {
      handleInputChange("role", selectedRole.role || selectedRole.name);
      handleInputChange("role_id", selectedRole.id);
    }
  };

  const handleSave = async () => {
    if (!user || !company) return;
    setIsSaving(true);
    try {
      const payload: any = {
        user_id: user.id,
        first_name: editedUser?.first_name || "",
        last_name: editedUser?.last_name || "",
        email: editedUser?.email || "",
        mobile: editedUser?.mobile || "",
        role: editedUser?.role || "",
        gender: editedUser?.gender || "",
        group: editedUser?.group || "",
        is_wfh: editedUser?.is_wfh || false,
        is_active: editedUser?.is_active ?? true,
        role_id: editedUser?.role_id,
        group_id: editedUser?.group_id,
        is_whatsapp: editedUser?.is_whatsapp || false,
        is_sms: editedUser?.is_sms || false,
      };

      if (editProfileData) {
        payload.profile = {
          dob: nullIfEmpty(editProfileData.dob),
          guardian_name: editProfileData.guardian_name || "",
          guardian_phone: editProfileData.guardian_phone || "",
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
        const safeUser = sanitizeUser(result.data.user);
        updateUser(safeUser);
        setEditedUser(safeUser);
      }
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

  // --- Render guard ---
  if (!user) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  const profileUrl = getProfileImageUrl();
  const initials = getInitials();

  if (profileLoading && !fullProfile && retryCount === 0) {
    return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center"><div className="text-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div><p className="text-gray-500">Loading your profile data...</p></div></div>;
  }

  // ========== JSX (the complete UI) ==========
  return (
    <div className="min-h-screen bg-[#f8fafc] py-8">
      <div className="max-w-6xl mx-auto pb-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          {!fullProfile && !profileLoading && <Button onClick={createEmptyProfile} className="bg-blue-50 text-blue-700 border-none hover:bg-blue-100"><Plus className="h-4 w-4 mr-2" /> Initialize Extended Profile</Button>}
          {!fullProfile && !profileLoading && retryCount >= 2 && <Button onClick={() => { setRetryCount(0); fetchProfile(); }} variant="outline" className="border-amber-200 text-amber-700"><RefreshCw className="h-4 w-4 mr-2" /> Retry Loading</Button>}
        </div>

        {/* Inactive User Warning */}
        {!user.is_active && <Alert className="mb-6 bg-yellow-50 border-yellow-200"><AlertDescription className="text-yellow-800 flex items-center gap-2"><XCircle className="h-4 w-4" /><span><strong>Account Inactive:</strong> Your account is currently inactive. Please contact your administrator.</span></AlertDescription></Alert>}

        {/* Hero Profile Card with Image Upload */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative group">
              <div className="h-32 w-32 rounded-2xl overflow-hidden border-4 border-blue-50 shadow-inner bg-blue-50 flex items-center justify-center">
                {profileUrl && !imgError ? (
                  <Image
                    src={profileUrl}
                    alt="Profile"
                    width={128}
                    height={128}
                    className="object-cover h-full w-full"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-blue-700">
                    <span className="text-4xl font-bold">{initials}</span>
                    <span className="text-xs font-semibold uppercase mt-1">User</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-blue-600 border-2 border-white shadow-sm flex items-center justify-center hover:bg-blue-700 transition disabled:opacity-50"
                aria-label="Change profile picture"
              >
                {uploadingImage ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Camera className="h-4 w-4 text-white" />
                )}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
              />
              <div className={`absolute -bottom-2 -left-2 h-8 w-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${user.is_active ? "bg-green-500" : "bg-red-500"}`}>
                {user.is_active ? <CheckCircle className="h-4 w-4 text-white" /> : <XCircle className="h-4 w-4 text-white" />}
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div><h2 className="text-3xl font-bold text-gray-900 mb-1">{user.first_name} {user.last_name}</h2><div className="flex items-center justify-center md:justify-start gap-2 text-gray-500"><Mail className="h-4 w-4" /><span>{user.email}</span></div></div>
                <div className="flex flex-wrap justify-center md:justify-end gap-2 text-sm">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none px-3 py-1"><Briefcase className="h-3 w-3 mr-1.5" /> {getRoleName(user.role_id || user.role)}</Badge>
                  {isAdmin && <Badge className="bg-amber-50 text-amber-700 border-amber-200 px-3 py-1"><Shield className="h-3 w-3 mr-1.5" /> Admin</Badge>}
                  {user.is_superuser && <Badge className="bg-purple-50 text-purple-700 border-purple-200 px-3 py-1"><Crown className="h-3 w-3 mr-1.5" /> Super User</Badge>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-between"><div><h3 className="text-sm font-semibold text-gray-500 mb-1">User ID</h3><p className="text-2xl font-bold text-blue-600">#{user.id}</p></div><div className="p-3 bg-blue-50 rounded-lg"><Hash className="h-6 w-6 text-blue-600" /></div></div>
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-between"><div><h3 className="text-sm font-semibold text-gray-500 mb-1">Biometric ID</h3><p className="text-2xl font-bold text-green-600">{user.biometric_id || "--"}</p></div><div className="p-3 bg-green-50 rounded-lg"><Activity className="h-6 w-6 text-green-600" /></div></div>
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-between"><div><h3 className="text-sm font-semibold text-gray-500 mb-1">Current Group</h3><p className="text-2xl font-bold text-purple-600">{getGroupName(user.group_id || user.group)}</p></div><div className="p-3 bg-purple-50 rounded-lg"><Users className="h-6 w-6 text-purple-600" /></div></div>
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-between"><div><h3 className="text-sm font-semibold text-gray-500 mb-1">Account Level</h3><p className="text-2xl font-bold text-amber-600">{user.role_id === 1 ? "Admin" : "Member"}</p></div><div className="p-3 bg-amber-50 rounded-lg"><ShieldCheck className="h-6 w-6 text-amber-600" /></div></div>
        </div>

        {/* Detail Sections Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Personal Details Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm border border-purple-50">
                  <UserIcon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Personal Details</h3>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleEditExtended("personal")} className="text-purple-600 border-purple-100 bg-purple-50 hover:bg-purple-100 font-bold rounded-lg px-4">
                <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit
              </Button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div><p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Date of Birth</p><div className="flex items-center gap-2"><p className="text-base font-semibold text-gray-800">{fullProfile?.dob || "Not provided"}</p>{fullProfile?.dob && <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200">{calculateAge(fullProfile.dob)} yrs</Badge>}</div></div>
                <div><p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Gender</p><p className="text-base font-semibold text-gray-800 flex items-center gap-1.5">{getGenderIcon(user.gender || "O")} {user.gender_display || (user.gender === "M" ? "Male" : user.gender === "F" ? "Female" : "Other")}</p></div>
                <div><p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Blood Group</p><p className="text-base font-semibold text-red-600 flex items-center gap-1.5"><Heart className="h-4 w-4 fill-red-50" /> {fullProfile?.blood_group || "Not provided"}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div><p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Religion</p><p className="text-base font-semibold text-gray-800">{fullProfile?.religion_name || "Not provided"}</p></div>
                <div><p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Caste</p><p className="text-base font-semibold text-gray-800">{fullProfile?.caste_name || "Not provided"}</p></div>
              </div>
            </div>
          </div>

          {/* Professional Details Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><Briefcase className="h-5 w-5" /></div><h3 className="text-lg font-bold text-gray-900">Professional Profile</h3></div>
              <Button variant="outline" size="sm" onClick={() => handleEditExtended("professional")} className="text-blue-600 border-blue-100 bg-blue-50 hover:bg-blue-100 font-bold rounded-lg px-4"><Edit3 className="h-3.5 w-3.5 mr-2" /> Edit</Button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6"><div><Label className="text-[10px] uppercase font-bold text-gray-400 mb-1">Designation / Role</Label><p className="text-base font-semibold text-gray-800">{getRoleName(user.role_id || user.role)}</p></div><div><Label className="text-[10px] uppercase font-bold text-gray-400 mb-1">Department / Group</Label><p className="text-base font-semibold text-gray-800">{getGroupName(user.group_id || user.group)}</p></div></div>
              <div className="grid grid-cols-2 gap-6"><div><Label className="text-[10px] uppercase font-bold text-gray-400 mb-1">Staff Category</Label><p className="text-base font-semibold text-gray-800">{fullProfile ? getStaffCategoryName(fullProfile.staff_category) : "Not provided"}</p></div><div><Label className="text-[10px] uppercase font-bold text-gray-400 mb-1">Staff Type</Label><p className="text-base font-semibold text-gray-800">{fullProfile ? getStaffTypeName(fullProfile.staff_type) : "Not provided"}</p></div></div>
            </div>
          </div>

          {/* Contact Intelligence Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600"><Smartphone className="h-5 w-5" /></div><h3 className="text-lg font-bold text-gray-900">Contact Details</h3></div><Button variant="outline" size="sm" onClick={() => handleEditExtended("contact")} className="text-green-600 border-green-100 bg-green-50 hover:bg-green-100 font-bold rounded-lg px-4"><Edit3 className="h-3.5 w-3.5 mr-2" /> Edit</Button></div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4"><div><p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Primary Email</p><p className="text-base font-semibold text-gray-800">{user?.email || "Not provided"}</p></div><div><p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Primary Mobile</p><p className="text-base font-semibold text-gray-800">{user?.mobile || "Not provided"}</p></div></div>
              <div className="grid grid-cols-2 gap-4"><div><p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Alternate Email</p><p className="text-base font-semibold text-gray-800">{fullProfile?.alternate_email || "Not provided"}</p></div><div><p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Alternate Mobile</p><p className="text-base font-semibold text-gray-800">{fullProfile?.alternate_mobile || "Not provided"}</p></div></div>
              <div className="grid grid-cols-2 gap-6"><div><p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Guardian Name</p><p className="text-base font-semibold text-gray-800">{fullProfile?.guardian_name || "Not provided"}</p></div><div><p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Guardian Phone</p><p className="text-base font-semibold text-gray-800">{fullProfile?.guardian_phone || "Not provided"}</p></div></div>
            </div>
          </div>

          {/* Identity & Legal Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600"><ShieldCheck className="h-5 w-5" /></div><h3 className="text-lg font-bold text-gray-900">Identity & Legal</h3></div><Button variant="outline" size="sm" onClick={() => handleEditExtended("legal")} className="text-amber-600 border-amber-100 bg-amber-50 hover:bg-amber-100 font-bold rounded-lg px-4"><Edit3 className="h-3.5 w-3.5 mr-2" /> Edit</Button></div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-100"><div><p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Aadhaar Card</p><p className="text-base font-bold text-gray-800">{fullProfile?.aadhar_no || "Not provided"}</p></div><div><p className="text-[10px] font-bold uppercase text-gray-400 mb-1">PAN Number</p><p className="text-base font-bold text-gray-800 uppercase">{fullProfile?.pan_no || "Not provided"}</p></div></div>
              <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-100"><div><p className="text-[10px] font-bold uppercase text-gray-400 mb-1">KTU ID</p><p className="text-base font-bold text-gray-800">{fullProfile?.ktu_id || "Not provided"}</p></div><div><p className="text-[10px] font-bold uppercase text-gray-400 mb-1">AICTE ID</p><p className="text-base font-bold text-gray-800 uppercase">{fullProfile?.aicte_id || "Not provided"}</p></div></div>
            </div>
          </div>

          {/* Physical Address Matrix */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden lg:col-span-2">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-gray-900 flex items-center justify-center text-white"><MapPin className="h-5 w-5" /></div><h3 className="text-lg font-bold text-gray-900">Address Matrix</h3></div><Button variant="outline" size="sm" onClick={() => handleEditExtended("address")} className="text-gray-900 border-gray-200 bg-gray-50 hover:bg-gray-100 font-bold rounded-lg px-4"><Edit3 className="h-3.5 w-3.5 mr-2" /> Edit</Button></div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div><p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Present Residence</p><div className="p-4 bg-gray-50 rounded-lg border border-gray-100 min-h-[120px]">{fullProfile?.present_address_details ? <div className="text-sm font-semibold text-gray-800 space-y-1"><p>{fullProfile.present_address_details.address_line_1}</p><p>{fullProfile.present_address_details.city}, {fullProfile.present_address_details.district}</p><p>{fullProfile.present_address_details.state}, {fullProfile.present_address_details.country}</p><p className="text-blue-600 mt-2 font-bold">{fullProfile.present_address_details.pincode}</p></div> : <p className="text-sm font-semibold text-gray-400">Address record incomplete.</p>}</div></div>
              <div><p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Permanent Landmark</p><div className="p-4 bg-gray-50 rounded-lg border border-gray-100 min-h-[120px]">{fullProfile?.permanent_address_details ? <div className="text-sm font-semibold text-gray-800 space-y-1"><p>{fullProfile.permanent_address_details.address_line_1}</p><p>{fullProfile.permanent_address_details.city}, {fullProfile.permanent_address_details.district}</p><p>{fullProfile.permanent_address_details.state}, {fullProfile.permanent_address_details.country}</p><p className="text-blue-600 mt-2 font-bold">{fullProfile.permanent_address_details.pincode}</p></div> : <p className="text-sm font-semibold text-gray-400">Address record incomplete.</p>}</div></div>
            </div>
          </div>

          {/* Preferences & Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden lg:col-span-2">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600"><Settings className="h-5 w-5" /></div><h3 className="text-lg font-bold text-gray-900">System Preferences</h3></div><Button variant="outline" size="sm" onClick={() => handleEditExtended("preferences")} className="text-orange-600 border-orange-100 bg-orange-50 hover:bg-orange-100 font-bold rounded-lg px-4"><Edit3 className="h-3.5 w-3.5 mr-2" /> Edit</Button></div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50"><div className="flex items-center gap-3"><MessageCircle className="h-4 w-4 text-green-500" /><span className="text-sm font-medium text-gray-700">WhatsApp Alerts</span></div><Badge variant={user?.is_whatsapp ? "default" : "secondary"} className={user?.is_whatsapp ? "bg-green-600" : "bg-gray-300"}>{user?.is_whatsapp ? "Enabled" : "Disabled"}</Badge></div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50"><div className="flex items-center gap-3"><MessageSquare className="h-4 w-4 text-blue-500" /><span className="text-sm font-medium text-gray-700">SMS Notifications</span></div><Badge variant={user?.is_sms ? "default" : "secondary"} className={user?.is_sms ? "bg-blue-600" : "bg-gray-300"}>{user?.is_sms ? "Enabled" : "Disabled"}</Badge></div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50"><div className="flex items-center gap-3"><Home className="h-4 w-4 text-orange-500" /><span className="text-sm font-medium text-gray-700">Work From Home</span></div><Badge variant={user?.is_wfh ? "default" : "secondary"} className={user?.is_wfh ? "bg-orange-600" : "bg-gray-300"}>{user?.is_wfh ? "Enabled" : "Disabled"}</Badge></div>
            </div>
          </div>

          {/* Security & Access */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden lg:col-span-2">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600"><Shield className="h-5 w-5" /></div><h3 className="text-lg font-bold text-gray-900">Security & Access</h3></div></div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50"><div className="flex items-center gap-3"><Key className="h-4 w-4 text-purple-500" /><span className="text-sm font-medium text-gray-700">Administrator Access</span></div><Badge variant={isAdmin ? "default" : "secondary"} className={isAdmin ? "bg-purple-600" : "bg-gray-300"}>{isAdmin ? "Full Access" : "Restricted"}</Badge></div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50"><div className="flex items-center gap-3"><Crown className="h-4 w-4 text-pink-500" /><span className="text-sm font-medium text-gray-700">Superuser Privileges</span></div><Badge variant={user.is_superuser ? "default" : "secondary"} className={user.is_superuser ? "bg-pink-600" : "bg-gray-300"}>{user.is_superuser ? "Enabled" : "Disabled"}</Badge></div>
            </div>
          </div>
        </div>

        {/* ========== PROFESSIONAL EDIT DIALOG (Blue Theme) ========== */}
        <Dialog open={editingSection === "professional"} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="max-w-2xl bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-8 bg-blue-600 text-white relative">
              <DialogTitle className="text-2xl font-bold">Professional Identity Metadata</DialogTitle>
              <DialogDescription className="text-blue-100 mt-1">Refine corporate structure alignment and tracking parameters.</DialogDescription>
              <Briefcase className="absolute right-8 top-8 h-12 w-12 text-blue-300/30" />
            </DialogHeader>
            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2"><Label className="text-xs font-semibold uppercase text-gray-500">Department / Group</Label><Select value={editedUser?.group_id?.toString() || ""} onValueChange={handleGroupChange}><SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="Select department" /></SelectTrigger><SelectContent>{groups.map(g => (<SelectItem key={g.id} value={g.id.toString()}>{g.group || g.name || g.group_name}</SelectItem>))}</SelectContent></Select></div>
                <div className="space-y-2"><Label className="text-xs font-semibold uppercase text-gray-500">Designation / Role</Label><Select value={editedUser?.role_id?.toString() || ""} onValueChange={handleRoleChange}><SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="Select designation" /></SelectTrigger><SelectContent>{roles.map(r => (<SelectItem key={r.id} value={r.id.toString()}>{r.role || r.name}</SelectItem>))}</SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2"><Label className="text-xs font-semibold uppercase text-gray-500">Staff Type</Label><Select value={editProfileData?.staff_type_id?.toString() || ""} onValueChange={(v) => handleProfileChange("staff_type_id", v ? parseInt(v) : null)}><SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent>{staffTypes.map(st => (<SelectItem key={st.id} value={st.id.toString()}>{st.name}</SelectItem>))}</SelectContent></Select></div>
                <div className="space-y-2"><Label className="text-xs font-semibold uppercase text-gray-500">Staff Category</Label><Select value={editProfileData?.staff_category_id?.toString() || ""} onValueChange={(v) => handleProfileChange("staff_category_id", v ? parseInt(v) : null)}><SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{staffCategories.map(sc => (<SelectItem key={sc.id} value={sc.id.toString()}>{sc.name}</SelectItem>))}</SelectContent></Select></div>
              </div>
            </div>
            <DialogFooter className="p-6 bg-gray-50 border-t border-gray-100"><Button variant="outline" onClick={handleCancel} className="rounded-xl px-6">Cancel</Button><Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 rounded-xl px-6">{isSaving ? "Saving..." : "Update Professional Profile"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ========== PERSONAL EDIT DIALOG (Purple Theme) ========== */}
        <Dialog open={editingSection === "personal"} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="max-w-2xl bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-8 bg-purple-600 text-white relative">
              <DialogTitle className="text-2xl font-bold">Private Identity Metadata</DialogTitle>
              <DialogDescription className="text-purple-100 mt-1">Refine demographic details and physical attributes.</DialogDescription>
              <UserIcon className="absolute right-8 top-8 h-12 w-12 text-purple-300/30" />
            </DialogHeader>
            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2"><Label className="text-xs font-semibold uppercase text-gray-500">Date of Birth</Label><Input type="date" value={editProfileData?.dob || ""} onChange={(e) => handleProfileChange("dob", e.target.value)} className="rounded-xl h-11" />{editProfileData?.dob && calculateAge(editProfileData.dob) !== null && <p className="text-xs text-purple-600 font-medium mt-1">Age: {calculateAge(editProfileData.dob)} years</p>}</div>
                <div className="space-y-2"><Label className="text-xs font-semibold uppercase text-gray-500">Gender</Label><Select value={editedUser?.gender || ""} onValueChange={(val) => handleInputChange("gender", val)}><SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="Select gender" /></SelectTrigger><SelectContent><SelectItem value="M">Male</SelectItem><SelectItem value="F">Female</SelectItem><SelectItem value="O">Other</SelectItem></SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-2 gap-6 p-5 bg-purple-50 rounded-2xl border border-purple-100">
                <div className="space-y-2"><Label className="text-purple-900 font-semibold">Guardian Name</Label><Input value={editProfileData?.guardian_name || ""} onChange={(e) => handleProfileChange("guardian_name", e.target.value)} placeholder="E.g. John Doe" className="rounded-xl h-11 bg-white border-purple-200" /></div>
                <div className="space-y-2"><Label className="text-purple-900 font-semibold">Guardian Phone</Label><Input value={editProfileData?.guardian_phone || ""} onChange={(e) => handleProfileChange("guardian_phone", e.target.value)} placeholder="+1 234 567 890" className="rounded-xl h-11 bg-white border-purple-200" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label className="text-xs font-semibold uppercase text-gray-500">Blood Group</Label><Select value={editProfileData?.blood_group || ""} onValueChange={(v) => handleProfileChange("blood_group", v)}><SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(bg => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label className="text-xs font-semibold uppercase text-gray-500">Religion</Label><Select value={editProfileData?.religion_id?.toString() || ""} onValueChange={(v) => { const newId = v ? parseInt(v) : null; handleProfileChange("religion_id", newId); setCastes([]); }}><SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{religions.map(r => <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label className="text-xs font-semibold uppercase text-gray-500">Caste Identity</Label><Select value={editProfileData?.caste_id?.toString() || ""} onValueChange={(v) => handleProfileChange("caste_id", v ? parseInt(v) : null)} disabled={!editProfileData?.religion_id}><SelectTrigger className="rounded-xl h-11"><SelectValue placeholder={!editProfileData?.religion_id ? "Select religion first" : "Select caste"} /></SelectTrigger><SelectContent>{castes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent></Select></div>
              </div>
            </div>
            <DialogFooter className="p-6 bg-gray-50 border-t border-gray-100"><Button variant="outline" onClick={handleCancel} className="rounded-xl px-6">Cancel</Button><Button onClick={handleSave} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700 rounded-xl px-6">{isSaving ? "Updating..." : "Update Identity"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ========== CONTACT EDIT DIALOG (Green Theme WITH GUARDIAN FIELDS) ========== */}
        <Dialog open={editingSection === "contact"} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="max-w-md bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-8 bg-green-600 text-white relative">
              <DialogTitle className="text-2xl font-bold">Communication & Guardian Edit</DialogTitle>
              <DialogDescription className="text-green-100 mt-1">Manage primary/alternate contacts and guardian details.</DialogDescription>
              <Smartphone className="absolute right-8 top-8 h-12 w-12 text-green-300/30" />
            </DialogHeader>
            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Primary Contact */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase text-green-700 tracking-wider border-b border-green-100 pb-1">Primary Contact</h4>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-gray-500">Primary Email</Label>
                  <Input value={editedUser?.email || ""} onChange={(e) => handleInputChange("email", e.target.value)} className="rounded-xl h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-gray-500">Primary Mobile</Label>
                  <Input value={editedUser?.mobile || ""} onChange={(e) => handleInputChange("mobile", e.target.value)} className="rounded-xl h-11" maxLength={10} />
                </div>
              </div>

              {/* Guardian Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase text-green-700 tracking-wider border-b border-green-100 pb-1">Guardian Information</h4>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-gray-500">Guardian Name</Label>
                  <Input value={editProfileData?.guardian_name || ""} onChange={(e) => handleProfileChange("guardian_name", e.target.value)} placeholder="Father / Mother / Spouse name" className="rounded-xl h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-gray-500">Guardian Phone</Label>
                  <Input value={editProfileData?.guardian_phone || ""} onChange={(e) => handleProfileChange("guardian_phone", e.target.value)} placeholder="Guardian's mobile number" className="rounded-xl h-11" maxLength={10} />
                </div>
              </div>

              {/* Alternate Contact */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase text-green-700 tracking-wider border-b border-green-100 pb-1">Alternate Contact</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-gray-500">Alternate Mobile</Label>
                    <Input value={editProfileData?.alternate_mobile || ""} onChange={(e) => handleProfileChange("alternate_mobile", e.target.value)} className="rounded-xl h-10 bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-gray-500">Alternate Email</Label>
                    <Input value={editProfileData?.alternate_email || ""} onChange={(e) => handleProfileChange("alternate_email", e.target.value)} className="rounded-xl h-10 bg-gray-50" />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="p-6 bg-gray-50 border-t border-gray-100">
              <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700 w-full rounded-xl h-12">
                {isSaving ? "Saving..." : "Apply Transformations"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ========== LEGAL EDIT DIALOG (Amber Theme) ========== */}
        <Dialog open={editingSection === "legal"} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="max-w-md bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-8 bg-amber-600 text-white relative"><DialogTitle className="text-2xl font-bold">Statutory Identities</DialogTitle><DialogDescription className="text-amber-100 mt-1">Update governmental and legal identification numbers.</DialogDescription><ShieldCheck className="absolute right-8 top-8 h-12 w-12 text-amber-300/30" /></DialogHeader>
            <div className="p-8 space-y-6"><div className="space-y-2"><Label className="text-xs font-semibold uppercase text-gray-500">Aadhaar Number (UIDAI)</Label><Input value={editProfileData?.aadhar_no || ""} onChange={(e) => handleProfileChange("aadhar_no", e.target.value)} className="rounded-xl h-11" /></div><div className="space-y-2"><Label className="text-xs font-semibold uppercase text-gray-500">PAN Number (Income Tax)</Label><Input value={editProfileData?.pan_no || ""} onChange={(e) => handleProfileChange("pan_no", e.target.value)} className="rounded-xl h-11 uppercase" /></div><Separator /><div className="space-y-2"><Label className="text-xs font-semibold uppercase text-gray-500">KTU / AICTE Identifier</Label><Input value={editProfileData?.ktu_id || ""} onChange={(e) => handleProfileChange("ktu_id", e.target.value)} className="rounded-xl h-11" /></div></div>
            <DialogFooter className="p-6 bg-gray-50 border-t border-gray-100"><Button onClick={handleSave} disabled={isSaving} className="bg-amber-600 hover:bg-amber-700 w-full rounded-xl h-12">{isSaving ? "Saving..." : "Commit IDs"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ========== ADDRESS EDIT DIALOG (Improved Slate Theme) ========== */}
        <Dialog open={editingSection === "address"} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="max-w-4xl bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-8 bg-slate-800 text-white relative">
              <DialogTitle className="text-2xl font-bold">Residence Data Protocol</DialogTitle>
              <DialogDescription className="text-slate-300 mt-1">Update Present and Permanent Physical Coordinates.</DialogDescription>
              <MapPin className="absolute right-8 top-8 h-12 w-12 text-slate-500/30" />
            </DialogHeader>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto">
              {/* Present Address */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2"><div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center"><MapPin className="h-4 w-4 text-blue-600" /></div><h4 className="text-sm font-bold uppercase text-blue-600 tracking-wider">Present Residence</h4></div>
                <div className="space-y-4">
                  <div><Label className="text-xs font-semibold text-gray-500">Address Line 1</Label><Input placeholder="House number, street" value={editProfileData?.present_address_details?.address_line_1 || ""} onChange={(e) => handleAddressChange("present_address_details", "address_line_1", e.target.value)} className="rounded-xl h-11 mt-1" /></div>
                  <div className="grid grid-cols-2 gap-4"><div><Label className="text-xs font-semibold text-gray-500">City</Label><Input placeholder="City" value={editProfileData?.present_address_details?.city || ""} onChange={(e) => handleAddressChange("present_address_details", "city", e.target.value)} className="rounded-xl h-11 mt-1" /></div><div><Label className="text-xs font-semibold text-gray-500">Pincode</Label><Input placeholder="Pincode" value={editProfileData?.present_address_details?.pincode || ""} onChange={(e) => handleAddressChange("present_address_details", "pincode", e.target.value)} className="rounded-xl h-11 mt-1" /></div></div>
                  <div><Label className="text-xs font-semibold text-gray-500">State</Label><Input placeholder="State" value={editProfileData?.present_address_details?.state || ""} onChange={(e) => handleAddressChange("present_address_details", "state", e.target.value)} className="rounded-xl h-11 mt-1" /></div>
                  <div><Label className="text-xs font-semibold text-gray-500">Country</Label><Input placeholder="Country" value={editProfileData?.present_address_details?.country || "India"} onChange={(e) => handleAddressChange("present_address_details", "country", e.target.value)} className="rounded-xl h-11 mt-1" /></div>
                </div>
              </div>
              {/* Permanent Address */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2"><div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center"><MapPin className="h-4 w-4 text-indigo-600" /></div><h4 className="text-sm font-bold uppercase text-indigo-600 tracking-wider">Permanent Landmark</h4></div>
                <div className="space-y-4">
                  <div><Label className="text-xs font-semibold text-gray-500">Address Line 1</Label><Input placeholder="House number, street" value={editProfileData?.permanent_address_details?.address_line_1 || ""} onChange={(e) => handleAddressChange("permanent_address_details", "address_line_1", e.target.value)} className="rounded-xl h-11 mt-1" /></div>
                  <div className="grid grid-cols-2 gap-4"><div><Label className="text-xs font-semibold text-gray-500">City</Label><Input placeholder="City" value={editProfileData?.permanent_address_details?.city || ""} onChange={(e) => handleAddressChange("permanent_address_details", "city", e.target.value)} className="rounded-xl h-11 mt-1" /></div><div><Label className="text-xs font-semibold text-gray-500">Pincode</Label><Input placeholder="Pincode" value={editProfileData?.permanent_address_details?.pincode || ""} onChange={(e) => handleAddressChange("permanent_address_details", "pincode", e.target.value)} className="rounded-xl h-11 mt-1" /></div></div>
                  <div><Label className="text-xs font-semibold text-gray-500">State</Label><Input placeholder="State" value={editProfileData?.permanent_address_details?.state || ""} onChange={(e) => handleAddressChange("permanent_address_details", "state", e.target.value)} className="rounded-xl h-11 mt-1" /></div>
                  <div><Label className="text-xs font-semibold text-gray-500">Country</Label><Input placeholder="Country" value={editProfileData?.permanent_address_details?.country || "India"} onChange={(e) => handleAddressChange("permanent_address_details", "country", e.target.value)} className="rounded-xl h-11 mt-1" /></div>
                </div>
              </div>
            </div>
            <DialogFooter className="p-6 bg-gray-50 border-t border-gray-100"><Button variant="outline" onClick={handleCancel} className="rounded-xl px-6">Cancel</Button><Button onClick={handleSave} disabled={isSaving} className="bg-slate-800 hover:bg-slate-900 rounded-xl px-6">{isSaving ? "Saving..." : "Commit Physical Data"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ========== PREFERENCES EDIT DIALOG (Orange Theme) ========== */}
        <Dialog open={editingSection === "preferences"} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="max-w-md bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-8 bg-orange-500 text-white relative"><DialogTitle className="text-2xl font-bold">System Configurations</DialogTitle><DialogDescription className="text-orange-100 mt-1">Manage Work-from-home and automated alert policies.</DialogDescription><Settings className="absolute right-8 top-8 h-12 w-12 text-orange-300/30" /></DialogHeader>
            <div className="p-8 space-y-4">{[
              { icon: MessageCircle, label: "Enable WhatsApp Linkage", field: "is_whatsapp" },
              { icon: MessageSquare, label: "Enable SMS Service Protocol", field: "is_sms" },
              { icon: Home, label: "Enable Remote Work (WFH)", field: "is_wfh" }
            ].map((pref, i) => (<div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100"><div className="flex items-center gap-3"><div className="p-2 bg-white rounded-xl shadow-sm text-orange-500"><pref.icon className="h-4 w-4" /></div><span className="text-sm font-medium text-gray-700">{pref.label}</span></div><Switch checked={editedUser?.[pref.field as keyof typeof editedUser] as boolean || false} onCheckedChange={(val) => handleInputChange(pref.field, val)} /></div>))}</div>
            <DialogFooter className="p-6 bg-gray-50 border-t border-gray-100"><Button onClick={handleSave} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600 w-full rounded-xl h-12">{isSaving ? "Saving..." : "Sync Preferences"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}