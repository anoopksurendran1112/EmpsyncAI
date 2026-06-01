"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import {
  Loader, Mail, Phone, UserIcon, UserMinus, MapPin, ArrowLeft,
  MessageSquare, Home, Pen, AlertTriangle, RefreshCw, Camera, X, Upload,
  Edit, Save, Plus, Activity, Hash, Briefcase, Shield, ShieldCheck, Crown, 
  CheckCircle, XCircle, Settings, Key, Globe, Layout, UserPlus, Fingerprint,
  Heart, GraduationCap, Building2, Landmark, Smartphone, MessageCircle, Edit3, Users,
  Calendar, Eye, History
} from "lucide-react";
import FullCalendarView from "@/components/FullCalendarView";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useAuth, User } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useEmployee } from "@/hooks/employees/useGetEmployee";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

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

interface Group {
  id: number;
  group?: string;
  name?: string;
  group_name?: string;
}

interface LookupItem {
  id: number;
  name: string;
}

export default function EmployeeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;
  const { company, loading: authLoading } = useAuth();
  const companyId = company?.id;

  // --- States ---
  const { data: employee, isLoading, isError, refetch } = useEmployee(companyId, employeeId);
  const [formData, setFormData] = useState<User | null>(null);
  const [fullProfile, setFullProfile] = useState<EmployeeFullProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editProfileData, setEditProfileData] = useState<EditableProfile | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [mobileError, setMobileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lookups
  const [staffTypes, setStaffTypes] = useState<LookupItem[]>([]);
  const [staffCategories, setStaffCategories] = useState<LookupItem[]>([]);
  const [religions, setReligions] = useState<LookupItem[]>([]);
  const [castes, setCastes] = useState<LookupItem[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  // --- Effects ---
  useEffect(() => {
    if (employee) {
      setFormData(employee);
      setRetryCount(0);
    } else {
      setFormData(null);
    }
  }, [employee]);

  useEffect(() => {
    if (employeeId) fetchProfile();
  }, [employeeId]);

  useEffect(() => {
    if (companyId) {
      fetchLookups();
      fetchGroupsAndRoles();
    }
  }, [companyId]);

  // Handle auto-retry
  useEffect(() => {
    if (isError && retryCount < 2) {
      const timer = setTimeout(() => { refetch(); setRetryCount(p => p + 1); }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isError, retryCount, refetch]);

  // Fetch castes when religion changes in edit mode
  useEffect(() => {
    if (!editingSection || !editProfileData?.religion_id) {
      setCastes([]);
      return;
    }
    fetchCastes(editProfileData.religion_id);
  }, [editProfileData?.religion_id, editingSection]);

  // --- Data Fetching ---
  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await fetch(`/api/employee-with-profile?user_id=${employeeId}`, { cache: "no-store" });
      if (res.ok) {
        const result = await res.json();
        if (result?.success && result.data) {
          setFullProfile(result.data.profile || null);
          setFormData(prev => result.data.user || prev);
        } else {
          setFullProfile(null);
        }
      } else {
        const errorText = await res.text();
        console.error("Failed to fetch employee-with-profile:", errorText);
        setFullProfile(null);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchLookups = async () => {
    // Staff Types
    try {
      const res = await fetch(`/api/settings/staff_type/${companyId}`);
      const data = await res.json();
      const items = Array.isArray(data) ? data : (data.data || data.types || data.results || []);
      setStaffTypes(items.map((st: any) => ({ id: st.id, name: st.type_name || st.name })));
    } catch (e) { console.error(e); }

    // Staff Categories
    try {
      const res = await fetch(`/api/settings/staff_category/${companyId}`);
      const data = await res.json();
      const items = Array.isArray(data) ? data : (data.data || data.categories || data.results || []);
      setStaffCategories(items.map((sc: any) => ({ id: sc.id, name: sc.category_name || sc.name })));
    } catch (e) { console.error(e); }

    // Religions
    try {
      const res = await fetch(`/api/settings/manage-religion/`);
      const data = await res.json();
      const items = Array.isArray(data) ? data : (data.data || data.religions || data.results || []);
      setReligions(items.map((r: any) => ({ id: r.id, name: r.name })));
    } catch (e) { console.error(e); }
  };

  const fetchCastes = async (religionId: number) => {
    try {
      const res = await fetch(`/api/settings/manage-caste/?religion_id=${religionId}`);
      const data = await res.json();
      const items = Array.isArray(data) ? data : (data.data || data.castes || data.results || []);
      setCastes(items.map((c: any) => ({ id: c.id, name: c.name })));
    } catch (e) { console.error(e); }
  };

  const fetchGroupsAndRoles = async () => {
    try {
      const [gRes, rRes] = await Promise.all([
        fetch(`/api/settings/groups/${companyId}`),
        fetch(`/api/settings/roles/${companyId}`)
      ]);
      const [gData, rData] = await Promise.all([gRes.json(), rRes.json()]);
      
      const gItems = Array.isArray(gData) ? gData : (gData.data || gData.groups || gData.results || []);
      setGroups(gItems);
      
      const rItems = Array.isArray(rData) ? rData : (rData.data || rData.roles || rData.results || []);
      setRoles(rItems);
    } catch (e) { console.error(e); }
  };

  // --- Helpers ---
  const getProfileImageUrl = () => {
    if (!formData?.prof_img) return null;
    return formData.prof_img.startsWith("http") || formData.prof_img.startsWith("data:")
      ? formData.prof_img
      : company?.mediaBaseUrl ? `${company.mediaBaseUrl}${formData.prof_img}` : formData.prof_img;
  };

  const getInitials = () => {
    if (!formData) return "??";
    return `${formData.first_name?.[0] || ""}${formData.last_name?.[0] || ""}`;
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

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case "M": return "👨";
      case "F": return "👩";
      default: return "🧑";
    }
  };

  // --- Handlers ---
  const handleEdit = (section: string) => {
    if (!formData) return;
    
    // Prepare extended profile data for editing
    let religionId = null;
    let casteId = null;
    
    if (fullProfile) {
      if (fullProfile.religion_name) {
        const found = religions.find(r => r.name === fullProfile.religion_name);
        religionId = found ? found.id : null;
      }
      if (fullProfile.caste_name) {
        // This might need a refetch if religions changed, but usually okay for simple init
        const found = castes.find(c => c.name === fullProfile.caste_name);
        casteId = found ? found.id : null;
      }
    }

    setEditProfileData({
      id: fullProfile?.id || 0,
      user: Number(employeeId),
      dob: fullProfile?.dob || "",
      guardian_name: fullProfile?.guardian_name || "",
      guardian_phone: fullProfile?.guardian_phone || "",
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
      present_address_details: fullProfile?.present_address_details || {
        address_line_1: "", address_line_2: "", city: "", district: "", state: "", country: "", pincode: ""
      },
      permanent_address_details: fullProfile?.permanent_address_details || {
        address_line_1: "", address_line_2: "", city: "", district: "", state: "", country: "", pincode: ""
      },
    });

    setEditingSection(section);
  };

  const handleCancel = () => {
    setFormData(employee ?? null);
    setEditingSection(null);
  };

  const handleInputChange = (field: keyof User, value: any) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleProfileChange = (field: keyof EditableProfile, value: any) => {
    setEditProfileData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleAddressChange = (type: 'present_address_details' | 'permanent_address_details', field: string, value: string) => {
    setEditProfileData(prev => {
      if (!prev) return null;
      return { ...prev, [type]: { ...prev[type], [field]: value } };
    });
  };

  // --- Save Logic ---
  const handleSave = async () => {
    if (!formData || !company) return;
    setIsSaving(true);

    try {
      const payload: Record<string, any> = {
        user_id: Number(employeeId),
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        mobile: formData.mobile,
        role: formData.role,
        gender: formData.gender,
        group: formData.group,
        is_wfh: formData.is_wfh,
        is_active: formData.is_active,
        role_id: formData.role_id,
        group_id: formData.group_id,
        is_whatsapp: formData.is_whatsapp || false,
        is_sms: formData.is_sms || false,
      };

      if (typeof formData.prof_img === "string" && formData.prof_img.trim()) {
        payload.prof_img = formData.prof_img;
      }

      if (editProfileData) {
        payload.profile = {
          dob: editProfileData.dob,
          guardian_name: editProfileData.guardian_name,
          guardian_phone: editProfileData.guardian_phone,
          religion_id: editProfileData.religion_id,
          caste_id: editProfileData.caste_id,
          staff_type_id: editProfileData.staff_type_id,
          staff_category_id: editProfileData.staff_category_id,
          ktu_id: editProfileData.ktu_id,
          aicte_id: editProfileData.aicte_id,
          pan_no: editProfileData.pan_no,
          aadhar_no: editProfileData.aadhar_no,
          blood_group: editProfileData.blood_group,
          alternate_mobile: editProfileData.alternate_mobile,
          alternate_email: editProfileData.alternate_email,
        };

        payload.present_address = editProfileData.present_address_details;
        payload.permanent_address = editProfileData.permanent_address_details;
      }

      const response = await fetch("/api/employee-with-profile/", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-company-id": company.id.toString() },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || "Failed to update employee");
      }

      toast.success("Employee information updated successfully!");
      setEditingSection(null);
      setFormData(result.data?.user || formData);
      setFullProfile(result.data?.profile || fullProfile);
      refetch();
      fetchProfile();
    } catch (err: any) {
      toast.error(err.message || "An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const createEmptyProfile = async () => {
    if (!employeeId || !companyId) return;
    setProfileLoading(true);
    try {
      const payload = {
        user_id: Number(employeeId),
        profile: {
          dob: "1900-01-01",
          guardian_name: "",
          guardian_phone: "",
          religion_id: null,
          caste_id: null,
          staff_type_id: null,
          staff_category_id: null,
          ktu_id: "",
          aicte_id: "",
          pan_no: "",
          aadhar_no: "",
          blood_group: "",
          alternate_mobile: "",
          alternate_email: "",
        },
        present_address: {
          address_line_1: "Not provided",
          address_line_2: "",
          city: "Not provided",
          district: "Not provided",
          state: "Not provided",
          country: "Not provided",
          pincode: "000000",
        },
        permanent_address: {
          address_line_1: "Not provided",
          address_line_2: "",
          city: "Not provided",
          district: "Not provided",
          state: "Not provided",
          country: "Not provided",
          pincode: "000000",
        },
      };

      const response = await fetch("/api/employee-with-profile/", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-company-id": companyId.toString() },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || "Failed to create profile skeleton");
      }

      toast.success("Extended profile initialized!");
      fetchProfile();
    } catch (error: any) {
      toast.error(error.message || "Failed to create profile skeleton");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleViewPunch = () => {
    if (!employeeId) return;
    let url = `/dashboard/employees/${employeeId}/punches`;
    if (formData?.biometric_id && formData.biometric_id.trim() !== '') {
      url += `?biometric_id=${encodeURIComponent(formData.biometric_id)}`;
    }
    router.push(url);
  };

  // --- Render ---
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="h-12 w-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">Synchronizing employee data...</p>
      </div>
    );
  }

  if (isError && !formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center p-8 bg-white shadow-xl rounded-2xl border-none">
          <div className="h-20 w-20 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restriced</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">We encountered an issue while retrieving this employee's data. This record may be dormant or inactive.</p>
          <div className="space-y-3">
             <Button onClick={() => { setRetryCount(0); refetch(); }} className="w-full bg-blue-600 py-6 text-base font-bold rounded-xl shadow-lg shadow-blue-200"><RefreshCw className="h-5 w-5 mr-2" />Re-sync Record</Button>
             <Link href="/dashboard/employees" className="block text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors pt-2">Return to list</Link>
          </div>
        </Card>
      </div>
    );
  }

  const profileUrl = getProfileImageUrl();
  const initials = getInitials();

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8">
      <div className="max-w-6xl mx-auto pb-12">
        {/* Header & Nav */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link href="/dashboard/employees" className="inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-700 mb-1 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Employees List
            </Link>
          </div>
          {!fullProfile && !profileLoading && (
            <Button onClick={createEmptyProfile} className="bg-blue-50 text-blue-700 border-none hover:bg-blue-100 font-bold px-4 py-2 rounded-xl">
              <UserPlus className="h-4 w-4 mr-2" />
              Initialize Extended Profile
            </Button>
          )}
        </div>

        {/* Hero Profile Card */}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="relative group">
                <div className="h-32 w-32 rounded-2xl overflow-hidden border-4 border-blue-50 shadow-inner bg-blue-50 flex items-center justify-center">
                  {profileUrl ? (
                      <Image src={profileUrl} alt="Employee Avatar" width={128} height={128} className="object-cover h-full w-full" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-blue-700">
                        <span className="text-4xl font-bold tracking-tight">{initials}</span>
                      </div>
                    )}
                </div>
                <div className={`absolute -bottom-2 -right-2 h-8 w-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${formData?.is_active ? "bg-green-500" : "bg-red-500"}`}>
                  {formData?.is_active ? <CheckCircle className="h-4 w-4 text-white" /> : <XCircle className="h-4 w-4 text-white" />}
                </div>
              </div>
  
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-1">
                      {formData?.first_name} {formData?.last_name}
                    </h2>
                    <div className="flex items-center justify-center md:justify-start gap-2 text-gray-500">
                      <Mail className="h-4 w-4" />
                      <span>{formData?.email}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-end gap-2 text-sm">
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none px-3 py-1 font-bold">
                      <Briefcase className="h-3 w-3 mr-1.5" />
                      {formData?.role || "Staff Members"}
                    </Badge>
                    {formData?.is_active ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-bold">Active</Badge>
                    ) : (
                      <Badge variant="destructive" className="font-bold">Dormant</Badge>
                    )}
                  </div>
                </div>
                
                <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-6 border-t border-gray-100 pt-6">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleViewPunch}
                      className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 font-bold rounded-lg h-9 px-4"
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      View Punches
                    </Button>
                  </div>
                  {/* <div className="flex items-center gap-2">
                    <Button 
                     variant="outline" 
                     size="sm" 
                     onClick={() => setShowCalendar(!showCalendar)}
                     className={`${showCalendar ? 'bg-gray-900 text-white' : 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100'} font-bold rounded-lg h-9 px-4 transition-all`}
                   >
                     <Calendar className="h-4 w-4 mr-2" />
                     {showCalendar ? "Hide Calendar" : "Attendance Calendar"}
                   </Button>
                  </div> */}
                  <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <span className="text-[10px] font-bold uppercase text-gray-400 ml-2">Account Status</span>
                    <Switch 
                      checked={formData?.is_active || false} 
                      onCheckedChange={(val) => {
                        handleInputChange("is_active", val);
                        setEditingSection("hero");
                      }}
                    />
                    {editingSection === "hero" && (
                      <Button size="sm" onClick={handleSave} className="bg-blue-600 text-white rounded-lg h-8 px-4 font-bold text-xs animate-in slide-in-from-right-2">Apply</Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Attendance Intelligence Dialog */}
        <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
          <DialogContent className="max-w-6xl p-0 overflow-hidden border-none rounded-xl shadow-2xl bg-white">
            <DialogHeader className="p-8 bg-gray-900 text-white flex flex-row items-center justify-between space-y-0">
              <div>
                <DialogTitle className="text-2xl font-bold">Attendance Intelligence</DialogTitle>
                <DialogDescription className="text-gray-400 font-bold">Visualizing punch patterns and shift compliance for {formData?.first_name}.</DialogDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowCalendar(false)} className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg h-12 w-12">
                <X className="h-6 w-6" />
              </Button>
            </DialogHeader>
            <div className="p-8 max-h-[85vh] overflow-y-auto scrollbar-hide">
              <FullCalendarView 
                employeeId={employeeId}
                companyId={companyId?.toString()}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: "User ID", val: `#${formData?.id}`, icon: Hash, color: "blue" },
            { label: "Biometric ID", val: formData?.biometric_id || "--", icon: Fingerprint, color: "green" },
            { label: "Current Group", val: formData?.group || "General", icon: Users, color: "purple" },
            { label: "Staff Type", val: fullProfile ? getStaffTypeName(fullProfile.staff_type) : "Pending", icon: Layout, color: "amber" }
          ].map((s, idx) => (
            <div key={idx} className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-between group hover:border-blue-200 transition-all">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-1">{s.label}</h3>
                <p className={`text-2xl font-bold text-${s.color}-600`}>{s.val}</p>
              </div>
              <div className={`p-3 bg-${s.color}-50 rounded-lg group-hover:scale-105 transition-transform`}>
                <s.icon className={`h-6 w-6 text-${s.color}-600`} />
              </div>
            </div>
          ))}
        </div>

        {/* Detail Sections Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Professional Details Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-50">
                  <Briefcase className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Professional Profile</h3>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleEdit("professional")} className="text-blue-600 border-blue-100 bg-blue-50 hover:bg-blue-100 font-bold rounded-lg px-4">
                <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit
              </Button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-[10px] uppercase font-bold text-gray-400 mb-1">Designation/Role</Label>
                  <p className="text-base font-semibold text-gray-800">{formData?.role || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-[10px] uppercase font-bold text-gray-400 mb-1">Department</Label>
                  <p className="text-base font-semibold text-gray-800">{formData?.group || "Not provided"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-[10px] uppercase font-bold text-gray-400 mb-1">Staff Category</Label>
                  <p className="text-base font-semibold text-gray-800">{fullProfile ? getStaffCategoryName(fullProfile.staff_category) : "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-[10px] uppercase font-bold text-gray-400 mb-1">Staff Type</Label>
                  <p className="text-base font-semibold text-gray-800">{fullProfile ? getStaffTypeName(fullProfile.staff_type) : "Not provided"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Intelligence Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600 shadow-sm border border-green-50">
                  <Smartphone className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Contact Details</h3>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleEdit("contact")} className="text-green-600 border-green-100 bg-green-50 hover:bg-green-100 font-bold rounded-lg px-4">
                <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit
              </Button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Primary Email</p>
                  <p className="text-base font-semibold text-gray-800">{formData?.email || "Not provided"}</p>
                </div>
                <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Alternate Email</p>
                    <p className="text-base font-semibold text-gray-800">{fullProfile?.alternate_email || "Not provided"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Primary Mobile</p>
                  <p className="text-base font-semibold text-gray-800">{formData?.mobile || "Not provided"}</p>
                </div>
                <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Alternate Mobile</p>
                    <p className="text-base font-semibold text-gray-800">{fullProfile?.alternate_mobile || "Not provided"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Details Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-pruple-50 flex items-center justify-center text-purple-600 shadow-sm border border-purple-50">
                  <UserIcon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Personal Details</h3>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleEdit("personal")} className="text-purple-600 border-purple-100 bg-purple-50 hover:bg-purple-100 font-bold rounded-lg px-4">
                <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit
              </Button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Date of Birth</p>
                  <p className="text-base font-semibold text-gray-800">{fullProfile?.dob || "Not provided"}</p>
                </div>
                <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Gender</p>
                    <p className="text-sm font-semibold text-gray-800">{formData?.gender_display || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Blood Group</p>
                  <p className="text-base font-semibold text-red-600 flex items-center gap-1.5"><Heart className="h-4 w-4 fill-red-50" /> {fullProfile?.blood_group || "Not provided"}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Religion</p>
                    <p className="text-sm font-semibold text-gray-800">{fullProfile?.religion_name || "Not provided"}</p>
                </div>
                <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Caste</p>
                    <p className="text-sm font-semibold text-gray-800">{fullProfile?.caste_name || "Not provided"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Identity & Legal Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm border border-amber-50">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Identity & Legal</h3>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleEdit("legal")} className="text-amber-600 border-amber-100 bg-amber-50 hover:bg-amber-100 font-bold rounded-lg px-4">
                <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit
              </Button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Aadhaar Card</p>
                    <p className="text-base font-bold text-gray-800">{fullProfile?.aadhar_no || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">PAN Number</p>
                    <p className="text-base font-bold text-gray-800 uppercase">{fullProfile?.pan_no || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">KTU ID</p>
                    <p className="text-base font-bold text-gray-800">{fullProfile?.ktu_id || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">AICTE ID</p>
                    <p className="text-base font-bold text-gray-800 uppercase">{fullProfile?.aicte_id || "Not provided"}</p>
                  </div>
              </div>
            </div>
          </div>

          {/* Physical Address Matrix */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden lg:col-span-2">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gray-900 flex items-center justify-center text-white shadow-sm border border-gray-800">
                  <MapPin className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Address Matrix</h3>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleEdit("address")} className="text-gray-900 border-gray-200 bg-gray-50 hover:bg-gray-100 font-bold rounded-lg px-4">
                <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit
              </Button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Present Residence</p>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 min-h-[120px]">
                  {fullProfile?.present_address_details ? (
                    <div className="text-sm font-semibold text-gray-800 space-y-1">
                      <p>{fullProfile.present_address_details.address_line_1}</p>
                      <p>{fullProfile.present_address_details.city}, {fullProfile.present_address_details.district}</p>
                      <p>{fullProfile.present_address_details.state}, {fullProfile.present_address_details.country}</p>
                      <p className="text-blue-600 mt-2 font-bold">{fullProfile.present_address_details.pincode}</p>
                    </div>
                  ) : <p className="text-sm font-semibold text-gray-400">Address record incomplete.</p>}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Permanent Landmark</p>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 min-h-[120px]">
                    {fullProfile?.permanent_address_details ? (
                      <div className="text-sm font-semibold text-gray-800 space-y-1">
                        <p>{fullProfile.permanent_address_details.address_line_1}</p>
                        <p>{fullProfile.permanent_address_details.city}, {fullProfile.permanent_address_details.district}</p>
                        <p>{fullProfile.permanent_address_details.state}, {fullProfile.permanent_address_details.country}</p>
                        <p className="text-blue-600 mt-2 font-bold">{fullProfile.permanent_address_details.pincode}</p>
                      </div>
                    ) : <p className="text-sm font-semibold text-gray-400">Address record incomplete.</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Preferences & Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden lg:col-span-2">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 shadow-sm border border-orange-50">
                  <Settings className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">System Preferences</h3>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleEdit("preferences")} className="text-orange-600 border-orange-100 bg-orange-50 hover:bg-orange-100 font-bold rounded-lg px-4">
                <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit
              </Button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-transparent hover:border-gray-200 transition-all">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">WhatsApp Alerts</span>
                  </div>
                  <Badge variant={formData?.is_whatsapp ? "default" : "secondary"} className={formData?.is_whatsapp ? "bg-green-500" : ""}>
                    {formData?.is_whatsapp ? "Enabled" : "Disabled"}
                  </Badge>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-transparent hover:border-gray-200 transition-all">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">SMS Notifications</span>
                  </div>
                  <Badge variant={formData?.is_sms ? "default" : "secondary"} className={formData?.is_sms ? "bg-blue-500" : ""}>
                    {formData?.is_sms ? "Enabled" : "Disabled"}
                  </Badge>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-transparent hover:border-gray-200 transition-all">
                  <div className="flex items-center gap-3">
                    <Home className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium text-gray-700">Work From Home</span>
                  </div>
                  <Badge variant={formData?.is_wfh ? "default" : "secondary"} className={formData?.is_wfh ? "bg-orange-500" : ""}>
                    {formData?.is_wfh ? "Enabled" : "Disabled"}
                  </Badge>
              </div>
            </div>
          </div>

        </div>

        {/* --- MODULAR DIALOGS --- */}
        
        {/* PROFESSIONAL EDIT DIALOG */}
        <Dialog open={editingSection === "professional"} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="max-w-2xl bg-white rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="p-8 bg-blue-600 text-white relative">
              <DialogTitle className="text-2xl font-black">Professional Profile Edit</DialogTitle>
              <DialogDescription className="text-blue-100 opacity-80 font-bold">Update designation, categorization, and system IDs.</DialogDescription>
              <div className="absolute top-8 right-8 text-blue-400 opacity-20"><Briefcase className="h-16 w-16" /></div>
            </DialogHeader>
            <div className="p-8 space-y-6 max-h-[60vh] overflow-auto">
              <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Designation / Role</Label>
                    <Select value={formData?.role_id?.toString() || "none"} onValueChange={(val) => {
                      const selected = roles.find(r => r.id.toString() === val);
                      handleInputChange("role_id", val === "none" ? null : Number(val));
                      handleInputChange("role", selected ? (selected.role || selected.name) : "");
                    }}>
                      <SelectTrigger className="rounded-xl h-11 border-slate-200 font-bold"><SelectValue placeholder="Select Designation" /></SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100"><SelectItem value="none">Manual Entry Only</SelectItem>{roles.map(r => <SelectItem key={r.id} value={r.id.toString()}>{r.role || r.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input value={formData?.role || ""} onChange={(e) => handleInputChange("role", e.target.value)} placeholder="Manual Designation" className="rounded-xl mt-2 h-11 border-slate-100 bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Organizational Group</Label>
                    <Select value={formData?.group_id?.toString() || "none"} onValueChange={(val) => {
                        const selected = groups.find(g => g.id.toString() === val);
                        handleInputChange("group_id", val === "none" ? null : Number(val));
                        handleInputChange("group", selected ? (selected.group || selected.name || selected.group_name) : "");
                    }}>
                        <SelectTrigger className="rounded-xl h-11 border-slate-200 font-bold"><SelectValue placeholder="Select Group" /></SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100"><SelectItem value="none">No Group</SelectItem>{groups.map(g => <SelectItem key={g.id} value={g.id.toString()}>{g.group || g.name || g.group_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Staff Type</Label>
                    <Select value={editProfileData?.staff_type_id?.toString() || ""} onValueChange={(val) => handleProfileChange("staff_type_id", val ? Number(val) : null)}>
                        <SelectTrigger className="rounded-xl h-11 border-slate-200 font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">{staffTypes.map(st => <SelectItem key={st.id} value={st.id.toString()}>{st.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Staff Category</Label>
                    <Select value={editProfileData?.staff_category_id?.toString() || ""} onValueChange={(val) => handleProfileChange("staff_category_id", val ? Number(val) : null)}>
                        <SelectTrigger className="rounded-xl h-11 border-slate-200 font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">{staffCategories.map(sc => <SelectItem key={sc.id} value={sc.id.toString()}>{sc.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
              </div>
              <div className="space-y-2">
                  <Label>Biometric Fingerprint ID</Label>
                  <Input value={formData?.biometric_id || ""} onChange={(e) => handleInputChange("biometric_id", e.target.value)} className="rounded-xl h-11 border-slate-200 font-bold" />
              </div>
            </div>
            <DialogFooter className="p-8 bg-slate-50 flex gap-4">
              <Button variant="ghost" onClick={handleCancel} className="font-bold rounded-xl h-12">Discard</Button>
              <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 font-black rounded-xl h-12 flex-1 shadow-lg shadow-blue-100">{isSaving ? "Syncing..." : "Update Professional Profile"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* CONTACT EDIT DIALOG */}
        <Dialog open={editingSection === "contact"} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="max-w-md bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-8 bg-green-600 text-white relative">
              <DialogTitle className="text-2xl font-black">Communication Edit</DialogTitle>
              <DialogDescription className="text-green-100 font-bold opacity-80">Manage primary and alternate contact channels.</DialogDescription>
              <div className="absolute top-8 right-8 text-green-400 opacity-20"><Smartphone className="h-16 w-16" /></div>
            </DialogHeader>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                  <Label>Primary Professional Email</Label>
                  <Input value={formData?.email || ""} onChange={(e) => handleInputChange("email", e.target.value)} className="rounded-xl h-11 border-slate-200 font-bold" />
              </div>
              <div className="space-y-2">
                  <Label>Official Mobile Presence</Label>
                  <Input value={formData?.mobile || ""} onChange={(e) => handleInputChange("mobile", e.target.value)} className="rounded-xl h-11 border-slate-200 font-bold" maxLength={10} />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Alt Mobile</Label>
                    <Input value={editProfileData?.alternate_mobile || ""} onChange={(e) => handleProfileChange("alternate_mobile", e.target.value)} className="rounded-xl h-10 border-slate-100 bg-slate-50 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label>Alt Email</Label>
                    <Input value={editProfileData?.alternate_email || ""} onChange={(e) => handleProfileChange("alternate_email", e.target.value)} className="rounded-xl h-10 border-slate-100 bg-slate-50 font-bold" />
                  </div>
              </div>
            </div>
            <DialogFooter className="p-8 bg-slate-50">
              <Button onClick={handleSave} className="bg-green-600 w-full h-12 font-black rounded-xl shadow-lg shadow-green-100">{isSaving ? "Saving..." : "Apply Transformations"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* PERSONAL EDIT DIALOG */}
        <Dialog open={editingSection === "personal"} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="max-w-2xl bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-8 bg-purple-600 text-white">
              <DialogTitle className="text-2xl font-black">Private Identity Metadata</DialogTitle>
              <DialogDescription className="text-purple-100 font-bold opacity-80">Refine demographic details and physical attributes.</DialogDescription>
            </DialogHeader>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input type="date" value={editProfileData?.dob || ""} onChange={(e) => handleProfileChange("dob", e.target.value)} className="rounded-xl h-11 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={formData?.gender || ""} onValueChange={(val) => handleInputChange("gender", val)}>
                        <SelectTrigger className="rounded-xl h-11 font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl"><SelectItem value="M">Male Identity</SelectItem><SelectItem value="F">Female Identity</SelectItem><SelectItem value="O">Non-Binary / Other</SelectItem></SelectContent>
                    </Select>
                  </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Blood Group</Label>
                    <Input value={editProfileData?.blood_group || ""} onChange={(e) => handleProfileChange("blood_group", e.target.value)} className="rounded-xl h-11 font-bold" placeholder="O+" />
                  </div>
                  <div className="space-y-2">
                    <Label>Religion</Label>
                    <Select value={editProfileData?.religion_id?.toString() || ""} onValueChange={(val) => handleProfileChange("religion_id", Number(val))}>
                        <SelectTrigger className="rounded-xl h-11 font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>{religions.map(r => <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Caste Identity</Label>
                    <Select value={editProfileData?.caste_id?.toString() || ""} onValueChange={(val) => handleProfileChange("caste_id", Number(val))} disabled={!editProfileData?.religion_id}>
                        <SelectTrigger className="rounded-xl h-11 font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>{castes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
              </div>
            </div>
            <DialogFooter className="p-8 bg-slate-50 mt-4">
              <Button onClick={handleSave} className="bg-purple-600 w-full h-12 font-black rounded-xl shadow-lg shadow-purple-100">Update Identity</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ADDITIONAL DIALOGS (STATUTORY, ADDRESS, ETC) CAN BE ADDED HERE SIMILARLY */}
        <Dialog open={editingSection === "legal"} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="max-w-md bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-8 bg-amber-600 text-white">
              <DialogTitle className="text-2xl font-black">Statutory Identities</DialogTitle>
              <DialogDescription className="text-amber-100 font-bold opacity-80">Update governmental and legal identification numbers.</DialogDescription>
            </DialogHeader>
            <div className="p-8 space-y-6">
                <div className="space-y-2"><Label>Aadhaar Number (UIDAI)</Label><Input value={editProfileData?.aadhar_no || ""} onChange={(e) => handleProfileChange("aadhar_no", e.target.value)} className="rounded-xl h-11 font-bold" /></div>
                <div className="space-y-2"><Label>PAN Number (Income Tax)</Label><Input value={editProfileData?.pan_no || ""} onChange={(e) => handleProfileChange("pan_no", e.target.value)} className="rounded-xl h-11 font-bold uppercase" /></div>
                <Separator />
                <div className="space-y-2"><Label>KTU / AICTE Identifier</Label><Input value={editProfileData?.ktu_id || ""} onChange={(e) => handleProfileChange("ktu_id", e.target.value)} className="rounded-xl h-11 font-bold" /></div>
            </div>
            <DialogFooter className="p-8 bg-slate-50"><Button onClick={handleSave} className="bg-amber-600 w-full h-12 font-black rounded-xl">Commit IDs</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={editingSection === "address"} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto bg-white rounded-3xl border-none p-0 shadow-2xl">
              <DialogHeader className="p-8 bg-slate-900 text-white">
                <DialogTitle className="text-2xl font-black">Residence Data Protocol</DialogTitle>
                <DialogDescription className="text-slate-400 font-bold">Update Present and Permanent Physical Coordinates.</DialogDescription>
              </DialogHeader>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Present Edit */}
                <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase text-blue-600 tracking-widest">Present Residence</h4>
                    <div className="space-y-3">
                      <Input placeholder="Line 1" value={editProfileData?.present_address_details.address_line_1 || ""} onChange={e => handleAddressChange("present_address_details", "address_line_1", e.target.value)} className="rounded-xl h-10" />
                      <div className="grid grid-cols-2 gap-3">
                          <Input placeholder="City" value={editProfileData?.present_address_details.city || ""} onChange={e => handleAddressChange("present_address_details", "city", e.target.value)} className="rounded-xl h-10" />
                          <Input placeholder="Pin" value={editProfileData?.present_address_details.pincode || ""} onChange={e => handleAddressChange("present_address_details", "pincode", e.target.value)} className="rounded-xl h-10" />
                      </div>
                      <Input placeholder="State" value={editProfileData?.present_address_details.state || ""} onChange={e => handleAddressChange("present_address_details", "state", e.target.value)} className="rounded-xl h-10" />
                    </div>
                </div>
                {/* Permanent Edit */}
                <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase text-indigo-600 tracking-widest">Permanent Residence</h4>
                    <div className="space-y-3">
                      <Input placeholder="Line 1" value={editProfileData?.permanent_address_details.address_line_1 || ""} onChange={e => handleAddressChange("permanent_address_details", "address_line_1", e.target.value)} className="rounded-xl h-10" />
                      <div className="grid grid-cols-2 gap-3">
                          <Input placeholder="City" value={editProfileData?.permanent_address_details.city || ""} onChange={e => handleAddressChange("permanent_address_details", "city", e.target.value)} className="rounded-xl h-10" />
                          <Input placeholder="Pin" value={editProfileData?.permanent_address_details.pincode || ""} onChange={e => handleAddressChange("permanent_address_details", "pincode", e.target.value)} className="rounded-xl h-10" />
                      </div>
                      <Input placeholder="State" value={editProfileData?.permanent_address_details.state || ""} onChange={e => handleAddressChange("permanent_address_details", "state", e.target.value)} className="rounded-xl h-10" />
                    </div>
                </div>
              </div>
              <DialogFooter className="p-8 bg-slate-50"><Button onClick={handleSave} className="bg-slate-900 w-full h-12 font-black rounded-xl">Commit Physical Data</Button></DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={editingSection === "preferences"} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="max-w-md bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-8 bg-slate-100 text-slate-900">
              <DialogTitle className="text-2xl font-black">System Configurations</DialogTitle>
              <DialogDescription className="text-slate-500 font-bold">Manage Work-from-home and automated alert policies.</DialogDescription>
            </DialogHeader>
            <div className="p-8 space-y-4">
              {[
                { icon: MessageCircle, label: "Enable WhatsApp Linkage", field: "is_whatsapp" },
                { icon: Smartphone, label: "Enable SMS Service Protocol", field: "is_sms" },
                { icon: Home, label: "Enable Remote Work (WFH)", field: "is_wfh" }
              ].map((pref, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-xl shadow-sm text-blue-600"><pref.icon className="h-4 w-4" /></div>
                      <span className="text-xs font-bold text-slate-700">{pref.label}</span>
                    </div>
                    <Switch checked={formData?.[pref.field as keyof User] as boolean || false} onCheckedChange={(val) => handleInputChange(pref.field as keyof User, val)} />
                </div>
              ))}
            </div>
            <DialogFooter className="p-8 bg-slate-50"><Button onClick={handleSave} className="bg-slate-900 w-full h-12 font-black rounded-xl text-white">Sync Preferences</Button></DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}