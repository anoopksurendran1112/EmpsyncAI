"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader, Mail, Phone, UserIcon, UserMinus, MapPin, ArrowLeft,
  MessageSquare, Home, Pen, AlertTriangle, RefreshCw, Camera, X, Upload,
  Edit, Save, Plus, Activity, Hash, Briefcase, Shield, ShieldCheck, Crown, 
  CheckCircle, XCircle, Settings, Key, Globe, Layout, UserPlus, Fingerprint,
  Heart, GraduationCap, Building2, Landmark, Smartphone, MessageCircle, Edit3, Users,
  Calendar, Eye, History, Trash2, Milestone, FileText, GraduationCap as GradIcon,
  BriefcaseBusiness, MessageSquareDot, PlusCircle, MinusCircle
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// --- Interfaces (extended) ---
interface AddressDetails {
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
}

interface GuardianItem {
  id: number;
  employee: number;
  name: string;
  phone: string;
  relationship_type: string;
  relationship_type_display: string;
  is_guardian: boolean;
  created_at?: string;
  updated_at?: string;
}

interface DesignationItem {
  id?: number;
  company_role?: number | null;
  company_group?: number | null;
  company_group_text?: string;
  designation?: string;
  start_date: string;
  end_date?: string | null;
  change_type: string;
  change_type_display?: string;
}

interface ExperienceItem {
  id?: number;
  company_name: string;
  location?: string | null;
  start_year: string;
  end_year?: string | null;
  is_internal: boolean;
  designations: DesignationItem[];
  experience_letter?: string | File;
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

// Helper validation functions
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidMobile = (mobile: string) => /^\d{10}$/.test(mobile.trim());

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
  
  // Image upload states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lookups
  const [staffTypes, setStaffTypes] = useState<LookupItem[]>([]);
  const [staffCategories, setStaffCategories] = useState<LookupItem[]>([]);
  const [religions, setReligions] = useState<LookupItem[]>([]);
  const [castes, setCastes] = useState<LookupItem[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  // --- New state for extended sections ---
  const [qualifications, setQualifications] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);
  const [bankDetails, setBankDetails] = useState<any[]>([]);
  const [guardians, setGuardians] = useState<GuardianItem[]>([]);

  // Editing states
  const [editQualifications, setEditQualifications] = useState<any[]>([]);
  const [qualFormOpen, setQualFormOpen] = useState(false);
  const [currentQual, setCurrentQual] = useState<any>({});

  const [editExperiences, setEditExperiences] = useState<ExperienceItem[]>([]);
  const [expFormOpen, setExpFormOpen] = useState(false);
  const [currentExp, setCurrentExp] = useState<ExperienceItem | null>(null);

  const [editBankDetails, setEditBankDetails] = useState<any[]>([]);
  const [bankFormOpen, setBankFormOpen] = useState(false);
  const [currentBank, setCurrentBank] = useState<any>({});

  const [familyIsMarried, setFamilyIsMarried] = useState(false);

  // Company profile for address auto-fill in experience
  const [companyProfile, setCompanyProfile] = useState<any>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState('general');
  const tabs = [
    { id: 'general', label: 'General', icon: <UserIcon className="h-4 w-4" /> },
    { id: 'qualifications', label: 'Qualifications', icon: <GraduationCap className="h-4 w-4" /> },
    { id: 'experiences', label: 'Experiences', icon: <BriefcaseBusiness className="h-4 w-4" /> },
    { id: 'legal', label: 'Legal & Bank Details', icon: <Landmark className="h-4 w-4" /> },
    { id: 'notifications', label: 'Notification Preferences', icon: <MessageSquareDot className="h-4 w-4" /> },
  ];

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
      fetchCompanyProfile();
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
          setQualifications(result.data.qualifications || []);
          setExperiences(result.data.experiences || []);
          setBankDetails(result.data.bank_details || []);
          setGuardians(result.data.guardians || []);
        } else {
          setFullProfile(null);
          setQualifications([]);
          setExperiences([]);
          setBankDetails([]);
          setGuardians([]);
        }
      } else {
        const errorText = await res.text();
        console.error("Failed to fetch employee-with-profile:", errorText);
        setFullProfile(null);
        setQualifications([]);
        setExperiences([]);
        setBankDetails([]);
        setGuardians([]);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setFullProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const [staffTypeRes, staffCatRes, religionRes] = await Promise.all([
        fetch(`/api/settings/staff_type/${companyId}`),
        fetch(`/api/settings/staff_category/${companyId}`),
        fetch(`/api/settings/manage-religion/`)
      ]);
      
      const staffTypeData = await staffTypeRes.json();
      const items = Array.isArray(staffTypeData) ? staffTypeData : (staffTypeData.data || staffTypeData.types || staffTypeData.results || []);
      setStaffTypes(items.map((st: any) => ({ id: st.id, name: st.type_name || st.name })));

      const staffCatData = await staffCatRes.json();
      const catItems = Array.isArray(staffCatData) ? staffCatData : (staffCatData.data || staffCatData.categories || staffCatData.results || []);
      setStaffCategories(catItems.map((sc: any) => ({ id: sc.id, name: sc.category_name || sc.name })));

      const religionData = await religionRes.json();
      const relItems = Array.isArray(religionData) ? religionData : (religionData.data || religionData.religions || religionData.results || []);
      setReligions(relItems.map((r: any) => ({ id: r.id, name: r.name })));
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

  const fetchCompanyProfile = async () => {
    if (!companyId) return;
    try {
      const res = await fetch(`/api/manage-company-profile/?company_id=${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setCompanyProfile(data);
      }
    } catch (err) { console.error("Failed to fetch company profile", err); }
  };

  // --- Helpers ---
  const getProfileImageUrl = () => {
    if (!formData?.prof_img) return null;
    if (formData.prof_img.startsWith('http') || formData.prof_img.startsWith('data:')) return formData.prof_img;
    const baseUrl = process.env.NEXT_PUBLIC_COMPANY_MEDIA_BASE || '';
    const path = formData.prof_img.startsWith('/') ? formData.prof_img : `/${formData.prof_img}`;
    return `${baseUrl}${path}`;
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

  const calculateAge = (dob: string | null | undefined) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const nullIfEmpty = (value: string | null | undefined): string | null => {
    if (value === undefined || value === null || value.trim() === '') return null;
    return value;
  };

  // --- Edit Handlers ---
  const handleEdit = (section: string) => {
    if (!formData) return;
    
    let religionId = null;
    let casteId = null;
    
    if (fullProfile) {
      religionId = (fullProfile as any).religion || null;
      if (!religionId && fullProfile.religion_name) {
        const found = religions.find(r => r.name === fullProfile.religion_name);
        religionId = found ? found.id : null;
      }
      
      casteId = (fullProfile as any).caste || null;
      if (!casteId && fullProfile.caste_name) {
        const found = castes.find(c => c.name === fullProfile.caste_name);
        casteId = found ? found.id : null;
      }
      
      if (religionId) {
        fetchCastes(religionId);
      }
    }

    let staffTypeId = fullProfile?.staff_type ? Number(fullProfile.staff_type) : null;
    let staffCategoryId = fullProfile?.staff_category ? Number(fullProfile.staff_category) : null;
    if (isNaN(staffTypeId as number)) staffTypeId = null;
    if (isNaN(staffCategoryId as number)) staffCategoryId = null;

    setEditProfileData({
      id: fullProfile?.id || 0,
      user: Number(employeeId),
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
      present_address_details: fullProfile?.present_address_details || {
        address_line_1: "", address_line_2: "", city: "", district: "", state: "", country: "", pincode: ""
      },
      permanent_address_details: fullProfile?.permanent_address_details || {
        address_line_1: "", address_line_2: "", city: "", district: "", state: "", country: "", pincode: ""
      },
    });

    if (section === "family") {
      setFamilyIsMarried(guardians.some((g: any) => g.relationship_type === 'spouse'));
    }
    if (section === "education") {
      setEditQualifications([...qualifications]);
      setQualFormOpen(false);
      setCurrentQual({});
    }
    if (section === "experience") {
      const copiedExperiences = experiences.map(exp => ({
        ...exp,
        designations: exp.designations ? exp.designations.map(d => ({ ...d })) : []
      }));
      setEditExperiences(copiedExperiences);
      setExpFormOpen(false);
      setCurrentExp(null);
    }
    if (section === "bank") {
      setEditBankDetails([...bankDetails]);
      setBankFormOpen(false);
      setCurrentBank({});
    }

    setEditingSection(section);
  };

  const handleCancel = () => {
    setFormData(employee ?? null);
    setEditingSection(null);
    setQualFormOpen(false);
    setExpFormOpen(false);
    setBankFormOpen(false);
    setCurrentQual({});
    setCurrentExp(null);
    setCurrentBank({});
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

  // --- Save Logic (integrated with image upload) ---
  const handleSave = async () => {
    if (!formData || !company) return;

    // --- Validations ---
    const primaryMobile = formData.mobile?.trim() || '';
    if (!primaryMobile || !isValidMobile(primaryMobile)) {
      toast.error("Primary mobile number must be exactly 10 digits");
      return;
    }
    const primaryEmail = formData.email?.trim() || '';
    if (!primaryEmail || !isValidEmail(primaryEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    const altMobile = editProfileData?.alternate_mobile?.trim();
    if (altMobile && !isValidMobile(altMobile)) {
      toast.error("Alternate mobile must be exactly 10 digits or empty");
      return;
    }
    const altEmail = editProfileData?.alternate_email?.trim();
    if (altEmail && !isValidEmail(altEmail)) {
      toast.error("Alternate email must be valid or empty");
      return;
    }

    // Validate guardian phones
    for (const guardian of guardians) {
      const phone = guardian.phone?.trim();
      if (phone && !isValidMobile(phone)) {
        toast.error(`${guardian.relationship_type_display || guardian.relationship_type}'s mobile must be 10 digits`);
        return;
      }
    }

    // --- Process Image File (integrated) ---
    const imageFile = fileInputRef.current?.files?.[0] || null;
    if (imageFile) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!allowedTypes.includes(imageFile.type)) {
        toast.error('Only JPEG, PNG, or WEBP images are allowed');
        return;
      }
      if (imageFile.size > 2 * 1024 * 1024) {
        toast.error('Image must be smaller than 2MB');
        return;
      }
    }

    // --- Process Guardians ---
    let guardiansToSend = guardians
      .filter((g: any) => g.name?.trim())
      .map((g: any) => ({
        ...(g.id ? { id: g.id } : {}),
        employee: Number(employeeId),
        name: g.name,
        phone: g.phone || '',
        relationship_type: g.relationship_type,
        is_guardian: !!g.is_guardian,
      }));

    if (!familyIsMarried) {
      guardiansToSend = guardiansToSend.filter(g => g.relationship_type !== 'spouse');
    }

    // --- Process Qualifications (use edit data only if editing that section) ---
    const currentQualifications = editingSection === 'education' ? editQualifications : qualifications;
    const qualsToSend = currentQualifications.map((q: any) => ({
      ...(q.id ? { id: q.id } : {}),
      user: Number(employeeId),
      qualification_level: q.qualification_level,
      specialization: q.specialization,
      institution_name: q.institution_name,
      university: q.university || '',
      location: q.location || '',
      start_date: q.start_date || null,
      completion_date: q.completion_date || null,
      percentage: q.percentage !== '' && q.percentage != null ? Number(q.percentage) : null,
    }));

    // --- Process Experiences (use edit data only if editing that section) ---
    const currentExperiences = editingSection === 'experience' ? editExperiences : experiences;
    const experiencesToSend = currentExperiences.map((exp: ExperienceItem) => {
      const cleanedExp: any = {
        ...(exp.id ? { id: exp.id } : {}),
        company_name: exp.company_name || '',
        location: exp.location || '',
        start_year: exp.start_year,
        end_year: exp.end_year || null,
        is_internal: !!exp.is_internal,
        designations: (exp.designations || []).map((des: DesignationItem) => {
          if (exp.is_internal) {
            return {
              ...(des.id ? { id: des.id } : {}),
              company_role: des.company_role || null,
              company_group: des.company_group || null,
              start_date: des.start_date,
              end_date: des.end_date || null,
              change_type: des.change_type || 'Joined',
            };
          } else {
            return {
              ...(des.id ? { id: des.id } : {}),
              designation: des.designation || '',
              company_group_text: des.company_group_text || '',
              start_date: des.start_date,
              end_date: des.end_date || null,
              change_type: des.change_type || 'Joined',
            };
          }
        }),
      };
      if (!exp.is_internal) {
        cleanedExp.designations = cleanedExp.designations.map((d: any) => {
          delete d.company_role;
          delete d.company_group;
          return d;
        });
      }
      return cleanedExp;
    });

    // --- Process Bank Details (use edit data only if editing that section) ---
    const currentBankDetails = editingSection === 'bank' ? editBankDetails : bankDetails;
    const banksToSend = currentBankDetails.map((b: any) => ({
      ...(b.id ? { id: b.id } : {}),
      user: Number(employeeId),
      acc_holder_name: b.acc_holder_name,
      bank_name: b.bank_name,
      account_number: b.account_number,
      ifsc_code: b.ifsc_code,
      branch_name: b.branch_name || '',
      is_primary: !!b.is_primary,
    }));

    setIsSaving(true);
    setUploadingImage(true);
    try {
      const formDataPayload = new FormData();

      // 1. Core Identification
      formDataPayload.append("user_id", employeeId);

      // 2. User base fields
      formDataPayload.append("first_name", formData.first_name || "");
      formDataPayload.append("last_name", formData.last_name || "");
      formDataPayload.append("email", formData.email || "");
      formDataPayload.append("mobile", formData.mobile || "");
      formDataPayload.append("role", formData.role || "");
      formDataPayload.append("gender", formData.gender || "");
      formDataPayload.append("group", formData.group || "");
      formDataPayload.append("is_wfh", String(formData.is_wfh || false));
      formDataPayload.append("is_active", String(formData.is_active ?? true));
      formDataPayload.append("is_whatsapp", String(formData.is_whatsapp || false));
      formDataPayload.append("is_sms", String(formData.is_sms || false));
      if (formData.role_id) formDataPayload.append("role_id", formData.role_id.toString());
      if (formData.group_id) formDataPayload.append("group_id", formData.group_id.toString());

      // 3. Profile sub-object & addresses
      if (editProfileData) {
        const profileData = {
          dob: nullIfEmpty(editProfileData.dob),
          guardian_name: editProfileData.guardian_name,
          guardian_phone: editProfileData.guardian_phone,
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
        formDataPayload.append("profile", JSON.stringify(profileData));
        
        const presentAddr = { ...editProfileData.present_address_details };
        const permanentAddr = { ...editProfileData.permanent_address_details };
        // Ensure required fields have default values
        ['address_line_1','city','district','state','country','pincode'].forEach(f => {
          if (!presentAddr[f as keyof AddressDetails] || (presentAddr[f as keyof AddressDetails] as string)?.trim() === '') {
            (presentAddr as any)[f] = f === 'pincode' ? '000000' : 'Not provided';
          }
          if (!permanentAddr[f as keyof AddressDetails] || (permanentAddr[f as keyof AddressDetails] as string)?.trim() === '') {
            (permanentAddr as any)[f] = f === 'pincode' ? '000000' : 'Not provided';
          }
        });
        formDataPayload.append("present_address", JSON.stringify(presentAddr));
        formDataPayload.append("permanent_address", JSON.stringify(permanentAddr));
      }

      // 4. Sub-arrays (as JSON)
      formDataPayload.append("guardians", JSON.stringify(guardiansToSend));
      formDataPayload.append("qualifications", JSON.stringify(qualsToSend));
      formDataPayload.append("experiences", JSON.stringify(experiencesToSend));
      formDataPayload.append("bank_details", JSON.stringify(banksToSend));

      // 5. Profile image file (integrated)
      if (imageFile) {
        formDataPayload.append('prof_img', imageFile);
      }

      // 6. Qualification certificate files
      editQualifications.forEach((q: any, index: number) => {
        if (q.certificate_file instanceof File) {
          formDataPayload.append(`certificate_${index}`, q.certificate_file);
        }
      });

      // 7. Experience letter files
      editExperiences.forEach((exp: ExperienceItem, index: number) => {
        if (exp.experience_letter instanceof File) {
          formDataPayload.append(`experience_letter_${index}`, exp.experience_letter);
        }
      });

      // 8. Dispatch
      const response = await fetch("/api/employee-with-profile/", {
        method: "PUT",
        headers: { "x-company-id": company.id.toString() },
        body: formDataPayload,
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update employee");
      }

      toast.success("Employee information updated successfully!");
      setEditingSection(null);
      setQualFormOpen(false);
      setExpFormOpen(false);
      setBankFormOpen(false);

      // Update local state
      if (result.data?.user) {
        setFormData(result.data.user);
      }
      if (result.data?.profile) {
        setFullProfile(result.data.profile);
      }
      if (result.data?.qualifications) setQualifications(result.data.qualifications);
      if (result.data?.experiences) setExperiences(result.data.experiences);
      if (result.data?.bank_details) setBankDetails(result.data.bank_details);
      if (result.data?.guardians) setGuardians(result.data.guardians);

      refetch();
      fetchProfile();
    } catch (err: any) {
      toast.error(err.message || "An error occurred while saving.");
    } finally {
      setIsSaving(false);
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
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

        {/* Hero Profile Card with Image Upload */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative group">
              <div className="h-32 w-32 rounded-2xl overflow-hidden border-4 border-blue-50 shadow-inner bg-blue-50 flex items-center justify-center">
                {profileUrl && !imgError ? (
                  <Image
                    src={profileUrl}
                    alt="Employee Avatar"
                    width={128}
                    height={128}
                    className="object-cover h-full w-full"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-blue-700">
                    <span className="text-4xl font-bold tracking-tight">{initials}</span>
                  </div>
                )}
              </div>

              {/* Camera button with loading state */}
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
                onChange={handleSave}
              />

              <div
                className={`absolute -bottom-2 -left-2 h-8 w-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${
                  formData?.is_active ? "bg-green-500" : "bg-red-500"
                }`}
              >
                {formData?.is_active ? (
                  <CheckCircle className="h-4 w-4 text-white" />
                ) : (
                  <XCircle className="h-4 w-4 text-white" />
                )}
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
                    {getRoleName(formData?.role_id || formData?.role)}
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

        {/* Attendance Dialog */}
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
            { label: "Current Group", val: getGroupName(formData?.group_id || formData?.group), icon: Users, color: "purple" },
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

        {/* ========== TABS NAVIGATION ========== */}
        <div className="border-b border-gray-200 bg-white px-4 rounded-xl shadow-sm mb-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto scrollbar-none" aria-label="Tabs">
            {tabs.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 ease-in-out focus:outline-none
                    ${isSelected
                      ? 'border-blue-600 text-blue-600 font-semibold'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ========== TAB CONTENT ========== */}
        <div className="transition-all duration-300 ease-in-out">
          {/* --- GENERAL TAB --- */}
          {activeTab === 'general' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Personal Details */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm border border-purple-50">
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
                      <div className="flex items-center gap-2">
                        <p className="text-base font-semibold text-gray-800">{fullProfile?.dob || "Not provided"}</p>
                        {fullProfile?.dob && <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200">{calculateAge(fullProfile.dob)} yrs</Badge>}
                      </div>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Gender</p>
                        <p className="text-base font-semibold text-gray-800 flex items-center gap-1.5">{getGenderIcon(formData?.gender || "O")} {formData?.gender_display || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Blood Group</p>
                      <p className="text-base font-semibold text-red-600 flex items-center gap-1.5"><Heart className="h-4 w-4 fill-red-50" /> {fullProfile?.blood_group || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6 mt-4">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Religion</p>
                      <p className="text-base font-semibold text-gray-800">{fullProfile?.religion_name || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Caste</p>
                        <p className="text-base font-semibold text-gray-800">{fullProfile?.caste_name || "Not provided"}</p>
                        </div>
                        <div></div>
                        </div>
                </div>
              </div>
              
              {/* Professional Details */}
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
                      <Label className="text-[10px] uppercase font-bold text-gray-400 mb-1">Designation / Role</Label>
                      <p className="text-base font-semibold text-gray-800">{getRoleName(formData?.role_id || formData?.role)}</p>
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-gray-400 mb-1">Department / Group</Label>
                      <p className="text-base font-semibold text-gray-800">{getGroupName(formData?.group_id || formData?.group)}</p>
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

              {/* Contact Details */}
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
                      <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Primary Mobile</p>
                      <p className="text-base font-semibold text-gray-800">{formData?.mobile || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Alternate Email</p>
                        <p className="text-base font-semibold text-gray-800">{fullProfile?.alternate_email || "Not provided"}</p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Alternate Mobile</p>
                        <p className="text-base font-semibold text-gray-800">{fullProfile?.alternate_mobile || "Not provided"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Family & Emergency */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600 shadow-sm border border-pink-50">
                      <Users className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Family & Emergency Contacts</h3>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleEdit("family")} className="text-pink-600 border-pink-100 bg-pink-50 hover:bg-pink-100 font-bold rounded-lg px-4">
                    <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit
                  </Button>
                </div>
                <div className="p-6 space-y-4">
                  {guardians && guardians.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {guardians.map((guardian: GuardianItem) => (
                        <div key={guardian.id} className="flex flex-row items-center justify-between relative group">
                          <div className="flex flex-col">
                            <h4 className="text-base font-semibold text-gray-800">{guardian.name}</h4>
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] uppercase font-bold text-gray-400">{guardian.relationship_type_display || guardian.relationship_type}</p>
                              {guardian.is_guardian && <span className="text-[9px] font-extrabold uppercase tracking-wide bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded shadow-3xs">Primary Guardian</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                            <Smartphone className="h-4 w-4 text-gray-400" />
                            <span className="font-mono tracking-wide">{guardian.phone}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-6">No immediate family or emergency contact profiles attached to this account.</p>
                  )}
                </div>
              </div>

              {/* Address Matrix */}
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
            </div>
          )}

          {/* --- QUALIFICATIONS TAB --- */}
          {activeTab === 'qualifications' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600 shadow-sm border border-cyan-50">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Education Details</h3>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleEdit("education")} className="text-cyan-600 border-cyan-100 bg-cyan-50 hover:bg-cyan-100 font-bold rounded-lg px-4">
                  <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit
                </Button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6">
                {qualifications && qualifications.length > 0 ? (
                  qualifications.map((qual: any) => (
                    <div key={qual.id} className="p-5 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-bold text-gray-800 capitalize">{qual.specialization || "__ __"}</h4>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{qual.qualification_level || "__ __"}</span>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-gray-700">{qual.institution_name || "__ __"}, {qual.location || "__ __"}</p>
                        {qual.university && <p className="text-xs font-medium text-gray-500">{qual.university}</p>}
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200/60">
                        <span className="text-xs font-semibold text-gray-400">{qual.start_date ? new Date(qual.start_date).getFullYear() : "N/A"} - {qual.completion_date ? new Date(qual.completion_date).getFullYear() : "Present"}</span>
                        {qual.percentage && <span className="bg-gray-200 px-2.5 py-0.5 rounded text-xs font-bold text-gray-700">{qual.percentage}%</span>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4 col-span-3">No educational records provided.</p>
                )}
              </div>
            </div>
          )}

          {/* --- EXPERIENCES TAB --- */}
          {activeTab === 'experiences' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-50">
                    <BriefcaseBusiness className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Work Experience</h3>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleEdit("experience")} className="text-indigo-600 border-indigo-100 bg-indigo-50 hover:bg-indigo-100 font-bold rounded-lg px-4">
                  <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit
                </Button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
                {experiences && experiences.length > 0 ? (
                  experiences.map((exp: ExperienceItem) => {
                    const sortedDesignations = exp.designations 
                      ? [...exp.designations].sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
                      : [];
                    const latestTitle = sortedDesignations[0] 
                      ? (exp.is_internal 
                          ? (roles.find(r => r.id === sortedDesignations[0].company_role)?.role || sortedDesignations[0].designation || "Unknown")
                          : sortedDesignations[0].designation || "Unknown")
                      : "No designation";
                    return (
                      <div key={exp.id} className="p-5 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 shadow-3xs transition-all space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-50 rounded-lg text-gray-500">
                              <Briefcase className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="text-base font-bold text-gray-800">
                                {exp.company_name || "Unnamed Company"}
                              </h4>
                              <p className="text-sm font-semibold text-gray-600">{latestTitle}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-gray-500 pt-1">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            <span>
                              {exp.start_year ? new Date(exp.start_year).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ""} - {
                                exp.end_year ? new Date(exp.end_year).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "Present"
                              }
                            </span>
                          </div>
                          {exp.location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-gray-400" />
                              <span>{exp.location}</span>
                            </div>
                          )}
                          {exp.experience_letter && typeof exp.experience_letter === 'string' && (
                            <a href={exp.experience_letter} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer">
                              <FileText className="h-3.5 w-3.5" />
                              <span>Experience Letter</span>
                            </a>
                          )}
                        </div>

                        {/* Multiple designations timeline */}
                        {sortedDesignations.length > 0 && (
                          <div className="mt-3 pl-4 border-l-2 border-gray-100 space-y-2.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              <Milestone className="h-3 w-3" />
                              <span>Role Timeline</span>
                            </div>
                            <div className="space-y-2">
                              {sortedDesignations.map((des, idx) => {
                                let title = "";
                                let groupInfo = "";
                                if (exp.is_internal) {
                                  title = roles.find(r => r.id === des.company_role)?.role || des.designation || "Unknown";
                                  const group = groups.find(g => g.id === des.company_group);
                                  groupInfo = group ? ` (${group.group || group.name})` : "";
                                } else {
                                  title = des.designation || "Unknown";
                                  groupInfo = des.company_group_text ? ` (${des.company_group_text})` : "";
                                }
                                return (
                                  <div key={idx} className="text-xs flex flex-col space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                      <span className="font-semibold text-gray-700">{title}{groupInfo}</span>
                                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-gray-100 text-gray-600 rounded">
                                        {des.change_type_display || des.change_type}
                                      </span>
                                    </div>
                                    <p className="text-gray-400 pl-3 text-[11px] leading-relaxed">
                                      {des.start_date ? new Date(des.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''} 
                                      {des.end_date ? ` - ${new Date(des.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ' - Present'}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500 text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200 col-span-2">
                    No working history records provided.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* --- LEGAL & BANK DETAILS TAB --- */}
          {activeTab === 'legal' && (
            <div className="grid grid-cols-1 gap-8">
              {/* Identity & Legal */}
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
                  </div>
                  <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
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

              {/* Bank Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-50">
                      <Landmark className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Bank Information</h3>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleEdit("bank")} className="text-emerald-600 border-emerald-100 bg-emerald-50 hover:bg-emerald-100 font-bold rounded-lg px-4">
                    <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit
                  </Button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
                  {bankDetails && bankDetails.length > 0 ? bankDetails.map((bank: any) => (
                    <div key={bank.id} className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-xl border border-gray-100 relative">
                      {bank.is_primary && <span className="absolute top-3 right-3 text-[9px] font-extrabold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded shadow-2xs">Primary</span>}
                      <div><span className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Account Holder</span><p className="text-base font-semibold text-gray-800">{bank.acc_holder_name}</p></div>
                      <div><span className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Bank Name</span><p className="text-base font-semibold text-gray-800">{bank.bank_name} ({bank.branch_name || "N/A"})</p></div>
                      <div><span className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Account Number</span><p className="text-base font-mono font-bold text-gray-800 tracking-wider">{bank.account_number}</p></div>
                      <div><span className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">IFSC Code</span><p className="text-base font-mono font-bold text-gray-800">{bank.ifsc_code}</p></div>
                    </div>
                  )) : (
                    <p className="text-sm text-gray-500 text-center py-4 col-span-2">No financial billing accounts connected.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* --- NOTIFICATION PREFERENCES TAB --- */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
          )}
        </div>

        {/* ========== ALL EDIT DIALOGS ========== */}

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
                      if (val === "none") {
                        handleInputChange("role_id", null);
                        handleInputChange("role", "");
                      } else {
                        handleInputChange("role_id", Number(val));
                        handleInputChange("role", selected?.role || selected?.name || "");
                      }
                    }}>
                      <SelectTrigger className="rounded-xl h-11 border-slate-200 font-bold"><SelectValue placeholder="Select Designation" /></SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100"><SelectItem value="none">No Designation</SelectItem>{roles.map(r => <SelectItem key={r.id} value={r.id.toString()}>{r.role || r.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Organizational Group</Label>
                    <Select value={formData?.group_id?.toString() || "none"} onValueChange={(val) => {
                        const selected = groups.find(g => g.id.toString() === val);
                        if (val === "none") {
                          handleInputChange("group_id", null);
                          handleInputChange("group", "");
                        } else {
                          handleInputChange("group_id", Number(val));
                          handleInputChange("group", selected?.group || selected?.name || selected?.group_name || "");
                        }
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
            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input type="date" value={editProfileData?.dob || ""} onChange={(e) => handleProfileChange("dob", e.target.value)} className="rounded-xl h-11 font-bold" />
                    {editProfileData?.dob && calculateAge(editProfileData.dob) !== null && (
                      <p className="text-xs text-[#2563eb] font-bold mt-1">Age: {calculateAge(editProfileData.dob)} years</p>
                    )}
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

        {/* LEGAL EDIT DIALOG */}
        <Dialog open={editingSection === "legal"} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="max-w-md bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-8 bg-amber-600 text-white">
              <DialogTitle className="text-2xl font-black">Statutory Identities</DialogTitle>
              <DialogDescription className="text-amber-100 font-bold opacity-80">Update governmental and legal identification numbers.</DialogDescription>
            </DialogHeader>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <Label>Aadhaar Number (UIDAI)</Label>
                <Input value={editProfileData?.aadhar_no || ""} onChange={(e) => handleProfileChange("aadhar_no", e.target.value)} className="rounded-xl h-11 font-bold" />
              </div>
              <div className="space-y-2">
                <Label>PAN Number (Income Tax)</Label>
                <Input value={editProfileData?.pan_no || ""} onChange={(e) => handleProfileChange("pan_no", e.target.value)} className="rounded-xl h-11 font-bold uppercase" />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>KTU Identifier</Label>
                <Input value={editProfileData?.ktu_id || ""} onChange={(e) => handleProfileChange("ktu_id", e.target.value)} className="rounded-xl h-11 font-bold" />
              </div>
              <div className="space-y-2">
                <Label>AICTE Identifier</Label>
                <Input value={editProfileData?.aicte_id || ""} onChange={(e) => handleProfileChange("aicte_id", e.target.value)} className="rounded-xl h-11 font-bold" />
              </div>
            </div>
            <DialogFooter className="p-8 bg-slate-50">
              <Button onClick={handleSave} className="bg-amber-600 w-full h-12 font-black rounded-xl">Commit IDs</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ADDRESS EDIT DIALOG */}
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

        {/* FAMILY / GUARDIAN EDIT DIALOG */}
        <Dialog open={editingSection === "family"} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="sm:max-w-4xl bg-white rounded-xl p-0 overflow-hidden border border-[#dde3ec] shadow-2xl">
            <DialogHeader className="p-6 border-b border-[#dde3ec] bg-white relative">
              <DialogTitle className="text-[18px] font-bold text-[#1a1a2e] tracking-tight">
                Edit Family & Emergency Contacts
              </DialogTitle>
              <DialogDescription className="text-[#7a8ba0] mt-1 text-[12px] font-normal">
                Manage statutory dependencies and emergency contacts.
              </DialogDescription>
              <Users className="absolute right-8 top-6 h-10 w-10 text-blue-600 pointer-events-none" />
            </DialogHeader>

            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-[#7a8ba0] block mb-1">
                  Primary Emergency Node Configuration
                </Label>
                
                <RadioGroup 
                  value={guardians?.find((g: any) => g.is_guardian)?.relationship_type || ""} 
                  onValueChange={(relationshipType) => { 
                    const updated = guardians.map((g: any) => ({ ...g, is_guardian: g.relationship_type === relationshipType })); 
                    setGuardians(updated); 
                  }} 
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    {/* Father Node */}
                    <div>
                      {(() => { 
                        const father = guardians?.find((g: any) => g.relationship_type === 'father') || { relationship_type: 'father', name: '', phone: '', is_guardian: false }; 
                        const updateFather = (fields: any) => { 
                          let exists = false; 
                          const updated = (guardians || []).map((g: any) => { 
                            if (g.relationship_type === 'father') { exists = true; return { ...g, ...fields }; } 
                            return g; 
                          }); 
                          if (!exists) updated.push({ ...father, ...fields }); 
                          setGuardians(updated); 
                        }; 
                        return (
                          <div className={`p-4 rounded-lg border transition-all ${father.is_guardian ? 'border-[#004ac6] bg-[#eff6ff]/50 shadow-sm' : 'border-[#dde3ec] bg-white'} space-y-3`}>
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-[#434655] uppercase tracking-wider flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-blue-600"></span> Father Details
                              </span>
                              <div className="flex items-center space-x-2 bg-white px-2.5 py-1 rounded-md border border-[#dde3ec] shadow-sm">
                                <RadioGroupItem value="father" id="primary-father" className="text-blue-600 focus:ring-[#004ac6]/20 border-[#dde3ec]" />
                                <Label htmlFor="primary-father" className="text-[11px] font-bold text-[#7a8ba0] cursor-pointer">Set Primary Guardian</Label>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-[#7a8ba0] uppercase">Full Name</Label>
                                <Input value={father.name || ""} onChange={(e) => updateFather({ name: e.target.value })} className="w-full px-3 py-2 border border-[#dde3ec] rounded-lg text-[14px] text-[#1a1a2e] focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] outline-none transition-all h-10" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-[#7a8ba0] uppercase">Mobile Number</Label>
                                <Input value={father.phone || ""} onChange={(e) => updateFather({ phone: e.target.value })} className="w-full px-3 py-2 border border-[#dde3ec] rounded-lg text-[14px] text-[#1a1a2e] focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] outline-none transition-all h-10 font-mono" maxLength={10} minLength={10} />
                              </div>
                            </div>
                          </div>
                        ); 
                      })()}
                    </div>
                    
                    {/* Mother Node */}
                    <div>
                      {(() => { 
                        const mother = guardians?.find((g: any) => g.relationship_type === 'mother') || { relationship_type: 'mother', name: '', phone: '', is_guardian: false }; 
                        const updateMother = (fields: any) => { 
                          let exists = false; 
                          const updated = (guardians || []).map((g: any) => { 
                            if (g.relationship_type === 'mother') { exists = true; return { ...g, ...fields }; } 
                            return g; 
                          }); 
                          if (!exists) updated.push({ ...mother, ...fields }); 
                          setGuardians(updated); 
                        }; 
                        return (
                          <div className={`p-4 rounded-lg border transition-all ${mother.is_guardian ? 'border-[#004ac6] bg-[#eff6ff]/50 shadow-sm' : 'border-[#dde3ec] bg-white'} space-y-3`}>
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-[#434655] uppercase tracking-wider flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-[#ef4444]"></span> Mother Details
                              </span>
                              <div className="flex items-center space-x-2 bg-white px-2.5 py-1 rounded-md border border-[#dde3ec] shadow-sm">
                                <RadioGroupItem value="mother" id="primary-mother" className="text-blue-600 focus:ring-[#004ac6]/20 border-[#dde3ec]" />
                                <Label htmlFor="primary-mother" className="text-[11px] font-bold text-[#7a8ba0] cursor-pointer">Set Primary Guardian</Label>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-[#7a8ba0] uppercase">Full Name</Label>
                                <Input value={mother.name || ""} onChange={(e) => updateMother({ name: e.target.value })} className="w-full px-3 py-2 border border-[#dde3ec] rounded-lg text-[14px] text-[#1a1a2e] focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] outline-none transition-all h-10" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-[#7a8ba0] uppercase">Mobile Number</Label>
                                <Input value={mother.phone || ""} onChange={(e) => updateMother({ phone: e.target.value })} className="w-full px-3 py-2 border border-[#dde3ec] rounded-lg text-[14px] text-[#1a1a2e] focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] outline-none transition-all h-10 font-mono" maxLength={10} minLength={10} />
                              </div>
                            </div>
                          </div>
                        ); 
                      })()}
                    </div>

                    {/* Marital Status Banner */}
                    <div>  
                      <div className="p-3.5 bg-[#f2f4f6] rounded-lg border border-[#dde3ec] flex items-center justify-between h-auto">
                        <div className="space-y-0.5">
                          <Label htmlFor="is_married" className="text-[13px] font-bold text-[#1a1a2e] cursor-pointer">
                            Marital Status: Married?
                          </Label>
                          <p className="text-[11px] text-[#7a8ba0]">Toggle to reveal spouse contact field</p>
                        </div>
                        <Checkbox 
                          id="is_married" 
                          checked={familyIsMarried} 
                          onCheckedChange={(checked) => setFamilyIsMarried(!!checked)} 
                          className="h-4 w-4 rounded border-[#dde3ec] bg-white text-blue-600 focus:ring-[#004ac6]/20" 
                        />
                      </div>
                    </div>
                      
                    {/* Spouse Node (Conditional) */}
                    <div>  
                      {familyIsMarried && (() => { 
                        const spouse = guardians?.find((g: any) => g.relationship_type === 'spouse') || { relationship_type: 'spouse', name: '', phone: '', is_guardian: false }; 
                        const updateSpouse = (fields: any) => { 
                          let exists = false; 
                          const updated = (guardians || []).map((g: any) => { 
                            if (g.relationship_type === 'spouse') { exists = true; return { ...g, ...fields }; } 
                            return g; 
                          }); 
                          if (!exists) updated.push({ ...spouse, ...fields }); 
                          setGuardians(updated); 
                        }; 
                        return (
                          <div className={`p-4 rounded-lg border transition-all ${spouse.is_guardian ? 'border-[#004ac6] bg-[#eff6ff]/50 shadow-sm' : 'border-[#dde3ec] bg-white'} space-y-3 animate-in fade-in slide-in-from-top-2 duration-200`}>
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-[#434655] uppercase tracking-wider flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-[#f59e0b]"></span> Spouse Details
                              </span>
                              <div className="flex items-center space-x-2 bg-white px-2.5 py-1 rounded-md border border-[#dde3ec] shadow-sm">
                                <RadioGroupItem value="spouse" id="primary-spouse" className="text-blue-600 focus:ring-[#004ac6]/20 border-[#dde3ec]" />
                                <Label htmlFor="primary-spouse" className="text-[11px] font-bold text-[#7a8ba0] cursor-pointer">Set Primary Guardian</Label>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-[#7a8ba0] uppercase">Full Name</Label>
                                <Input value={spouse.name || ""} onChange={(e) => updateSpouse({ name: e.target.value })} className="w-full px-3 py-2 border border-[#dde3ec] rounded-lg text-[14px] text-[#1a1a2e] focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] outline-none transition-all h-10" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-[#7a8ba0] uppercase">Mobile Number</Label>
                                <Input value={spouse.phone || ""} onChange={(e) => updateSpouse({ phone: e.target.value })} className="w-full px-3 py-2 border border-[#dde3ec] rounded-lg text-[14px] text-[#1a1a2e] focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] outline-none transition-all h-10 font-mono" maxLength={10} minLength={10} />
                              </div>
                            </div>
                          </div>
                        ); 
                      })()}
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <DialogFooter className="px-6 py-4 bg-white border-t border-[#dde3ec] flex items-center justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={handleCancel} 
                className="px-4 py-2 border border-[#dde3ec] text-[#434655] font-semibold rounded-lg hover:bg-[#f2f4f6] h-10 transition-colors"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving} 
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:opacity-95 active:scale-[0.98] h-10 transition-all disabled:opacity-50"
              >
                {isSaving ? "Updating Changes..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* EDUCATION EDIT DIALOG */}
        <Dialog open={editingSection === "education"} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="sm:max-w-2xl bg-white rounded-xl p-0 overflow-hidden border border-[#dde3ec] shadow-2xl">
            <DialogHeader className="p-6 border-b border-[#dde3ec] bg-white relative">
              <DialogTitle className="text-[18px] font-bold text-[#1a1a2e] tracking-tight">
                Edit Education Details
              </DialogTitle>
              <DialogDescription className="text-[#7a8ba0] mt-1 text-[12px] font-normal">
                Manage academic qualifications, degrees, and certifications.
              </DialogDescription>
              <GraduationCap className="absolute right-8 top-6 h-10 w-10 text-blue-600 pointer-events-none" />
            </DialogHeader>

            <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto custom-scrollbar">
              
              {/* Existing Education Qualifications Stack */}
              <div className="space-y-3">
                {editQualifications.map((qual: any, idx: number) => { 
                  const levelLabels: Record<string, string> = { 
                    UG: 'UG', 
                    PG: 'PG', 
                    MPHIL: 'M.Phil', 
                    PHD: 'Ph.D', 
                    POSTDOC: 'Post Doc', 
                    RESEARCH_OTHERS: 'Research', 
                    OTHERS: 'Others' 
                  }; 
                  const displayLevel = levelLabels[qual.qualification_level] || qual.qualification_level || "Oth"; 
                  
                  return (
                    <div key={idx} className="p-4 bg-white rounded-lg border border-[#dde3ec] flex items-start justify-between gap-4 shadow-xs">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14px] font-bold text-[#1a1a2e] truncate">
                            {qual.specialization || "Unnamed"}
                          </span>
                          <span className="text-[10px] font-bold uppercase bg-[#eff6ff] text-blue-600 px-2 py-0.5 rounded border border-blue-100 shrink-0">
                            {displayLevel}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#7a8ba0]">
                          {qual.institution_name}{qual.university ? `, ${qual.university}` : ""}
                        </p>
                        <p className="text-[12px] text-[#434655] font-medium">
                          {qual.start_date ? new Date(qual.start_date).getFullYear() : "N/A"} &ndash; {qual.completion_date ? new Date(qual.completion_date).getFullYear() : "Present"}
                          {qual.percentage != null && qual.percentage !== "" ? ` &middot; ${qual.percentage}%` : ""}
                        </p>
                        {qual.certificate_preview && (
                          <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                            <CheckCircle className="h-3 w-3" /> Certificate Document Staged
                          </p>
                        )}
                        {qual.certificate && typeof qual.certificate === 'string' && !qual.certificate_preview && (
                          <a href={qual.certificate} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 hover:underline font-medium block mt-1">
                            View Uploaded Document
                          </a>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button 
                          onClick={() => { 
                            let normalizedLevel = qual.qualification_level; 
                            if (normalizedLevel === "B.Tech") normalizedLevel = "UG"; 
                            setCurrentQual({ ...qual, qualification_level: normalizedLevel, _idx: idx }); 
                            setQualFormOpen(true); 
                          }} 
                          className="text-blue-600 hover:text-[#004ac6] text-xs font-bold px-2.5 py-1.5 rounded-lg hover:bg-[#eff6ff] transition"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => setEditQualifications(prev => prev.filter((_, i) => i !== idx))} 
                          className="text-[#ef4444] hover:text-[#dc2626] text-xs font-bold px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
                {editQualifications.length === 0 && !qualFormOpen && (
                  <p className="text-sm text-[#7a8ba0] text-center py-6">
                    No qualifications added yet. Click below to add one.
                  </p>
                )}
              </div>

              {/* Qualification Mutation Node */}
              {qualFormOpen && (
                <div className="p-5 bg-[#f2f4f6] rounded-lg border border-[#dde3ec] space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#434655] flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                    {currentQual?._idx !== undefined ? 'Edit Qualification Log' : 'Add Qualification Log'}
                  </h4>
                  
                  {/* Level & Specialty Block */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-[#7a8ba0]">Qualification Level<span className="text-red-500 -ml-1">*</span></Label>
                      <Select value={currentQual?.qualification_level || ''} onValueChange={v => setCurrentQual((p: any) => ({ ...p, qualification_level: v }))} required>
                        <SelectTrigger className="h-9 rounded-lg text-[13px] border-[#dde3ec] focus:ring-[#004ac6]/20 bg-white">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            ['UG','Undergraduate (UG)'],
                            ['PG','Postgraduate (PG)'],
                            ['MPHIL','M.Phil.'],
                            ['PHD','Ph.D.'],
                            ['POSTDOC','Post Doctoral'],
                            ['RESEARCH_OTHERS','Research (Others)'],
                            ['OTHERS','Others']
                          ].map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-[#7a8ba0]">Specialization / Degree<span className="text-red-500 -ml-1">*</span></Label>
                      <Input value={currentQual?.specialization || ''} onChange={e => setCurrentQual((p: any) => ({ ...p, specialization: e.target.value }))} className="w-full px-3 py-2 border border-[#dde3ec] rounded-lg text-[14px] text-[#1a1a2e] focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] outline-none transition-all h-10 bg-white" placeholder="e.g. Computer Science" 
                      required
                      />
                    </div>
                  </div>

                  {/* Institutional Identification Block */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-[#7a8ba0]">Institution / College<span className="text-red-500 -ml-1">*</span></Label>
                      <Input value={currentQual?.institution_name || ''} onChange={e => setCurrentQual((p: any) => ({ ...p, institution_name: e.target.value }))} className="w-full px-3 py-2 border border-[#dde3ec] rounded-lg text-[14px] text-[#1a1a2e] focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] outline-none transition-all h-10 bg-white" placeholder="College or school name" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-[#7a8ba0]">Affiliated University<span className="text-red-500 -ml-1">*</span></Label>
                      <Input value={currentQual?.university || ''} onChange={e => setCurrentQual((p: any) => ({ ...p, university: e.target.value }))} className="w-full px-3 py-2 border border-[#dde3ec] rounded-lg text-[14px] text-[#1a1a2e] focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] outline-none transition-all h-10 bg-white" placeholder="University name" required />
                    </div>
                  </div>

                  {/* Geographic Metadata */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-[#7a8ba0]">Location<span className="text-red-500 -ml-1">*</span></Label>
                      <Input value={currentQual?.location || ''} onChange={e => setCurrentQual((p: any) => ({ ...p, location: e.target.value }))} className="w-full px-3 py-2 border border-[#dde3ec] rounded-lg text-[14px] text-[#1a1a2e] focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] outline-none transition-all h-10 bg-white" placeholder="City, State" required />
                    </div>
                  </div>

                  {/* Chronology & Metrics Matrix */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-[#7a8ba0]">Start Date<span className="text-red-500 -ml-1">*</span></Label>
                      <Input type="date" value={currentQual?.start_date || ''} onChange={e => setCurrentQual((p: any) => ({ ...p, start_date: e.target.value }))} className="w-full px-3 py-2 border border-[#dde3ec] rounded-lg text-[14px] text-[#1a1a2e] focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] outline-none transition-all h-10 bg-white" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-[#7a8ba0]">Completion Date<span className="text-red-500 -ml-1">*</span></Label>
                      <Input type="date" value={currentQual?.completion_date || ''} onChange={e => setCurrentQual((p: any) => ({ ...p, completion_date: e.target.value }))} className="w-full px-3 py-2 border border-[#dde3ec] rounded-lg text-[14px] text-[#1a1a2e] focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] outline-none transition-all h-10 bg-white" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-[#7a8ba0]">Score / %<span className="text-red-500 -ml-1">*</span></Label>
                      <Input type="number" min="0" max="100" step="0.01" value={currentQual?.percentage ?? ''} onChange={e => setCurrentQual((p: any) => ({ ...p, percentage: e.target.value }))} className="w-full px-3 py-2 border border-[#dde3ec] rounded-lg text-[14px] text-[#1a1a2e] focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] outline-none transition-all h-10 bg-white" placeholder="e.g. 85.5" required />
                    </div>
                  </div>

                  {/* Verification Attestations */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-[#7a8ba0]">Certificate Document (.pdf, image)<span className="text-red-500 -ml-1">*</span></Label>
                      <Input type="file" accept=".pdf,image/*" onChange={e => { const file = e.target.files?.[0]; if (file) setCurrentQual((p: any) => ({ ...p, certificate_file: file, certificate_preview: file.name })); }} className="w-full px-3 py-1.5 border border-[#dde3ec] rounded-lg text-[14px] text-[#1a1a2e] bg-white h-10 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#eff6ff] file:text-blue-600 hover:file:bg-[#dbeafe]" required />
                    </div>
                  </div>

                  {/* Mutation Action Sub-block */}
                  <div className="flex gap-3 pt-2 border-t border-[#dde3ec]/60">
                    <Button 
                      type="button" 
                      onClick={() => { 
                        if (!currentQual?.qualification_level) { toast.error("Please select a Qualification Level."); return; } 
                        if (!currentQual?.specialization?.trim() || !currentQual?.institution_name?.trim()) { toast.error("Specialization and Institution are required."); return; } 
                        const { _idx, ...qualData } = currentQual; 
                        if (_idx !== undefined) { setEditQualifications(prev => prev.map((q: any, i: number) => i === _idx ? qualData : q)); } 
                        else { setEditQualifications(prev => [...prev, qualData]); } 
                        setCurrentQual({}); 
                        setQualFormOpen(false); 
                      }} 
                      className="bg-blue-600 hover:opacity-95 text-white rounded-lg h-9 px-4 text-sm font-semibold transition-all active:scale-[0.98]"
                    >
                      {currentQual?._idx !== undefined ? 'Update Record' : 'Add Record'}
                    </Button>
                    <Button 
                      variant="outline" 
                      type="button" 
                      onClick={() => { setQualFormOpen(false); setCurrentQual({}); }} 
                      className="border border-[#dde3ec] text-[#434655] hover:bg-[#f2f4f6] rounded-lg h-9 px-4 text-sm font-semibold transition-colors"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Trigger Node to Reveal Form */}
              {!qualFormOpen && (
                <button 
                  type="button" 
                  onClick={() => { setCurrentQual({ qualification_level: 'UG' }); setQualFormOpen(true); }} 
                  className="w-full py-3 border-2 border-dashed border-[#dde3ec] rounded-lg text-blue-600 text-sm font-bold hover:bg-[#eff6ff] hover:border-[#2563eb]/30 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Add Qualification Record
                </button>
              )}
            </div>

            <DialogFooter className="px-6 py-4 bg-white border-t border-[#dde3ec] flex items-center justify-end gap-3">
              <Button 
                variant="outline" 
                type="button" 
                onClick={handleCancel} 
                className="px-4 py-2 border border-[#dde3ec] text-[#434655] font-semibold rounded-lg hover:bg-[#f2f4f6] h-10 transition-colors"
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleSave} 
                disabled={isSaving} 
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:opacity-95 active:scale-[0.98] h-10 transition-all disabled:opacity-50"
              >
                {isSaving ? "Saving Education Details..." : "Save Education Details"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* EXPERIENCE EDIT DIALOG */}
        <Dialog open={editingSection === "experience"} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="sm:max-w-2xl bg-white rounded-xl p-0 overflow-hidden border border-[#dde3ec] shadow-2xl">
            <DialogHeader className="p-6 border-b border-[#dde3ec] bg-white relative">
              <DialogTitle className="text-[18px] font-bold text-[#1a1a2e] tracking-tight">
                Edit Work Experience
              </DialogTitle>
              <DialogDescription className="text-[#7a8ba0] mt-1 text-[12px] font-normal">
                Manage professional employment history. Toggle "Internal Role" &ndash; company & location auto‑fill from organisation profile.
              </DialogDescription>
              <BriefcaseBusiness className="absolute right-8 top-6 h-10 w-10 text-blue-600 pointer-events-none" />
            </DialogHeader>

            <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto custom-scrollbar">
              
              {/* Existing Experiences Stack */}
              <div className="space-y-3">
                {editExperiences.map((exp: ExperienceItem, idx: number) => (
                  <div key={idx} className="p-4 bg-white rounded-lg border border-[#dde3ec] flex items-start justify-between gap-4 shadow-xs">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-bold text-[#1a1a2e] truncate">
                          {exp.company_name || 'Company'}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#7a8ba0]">
                        {exp.start_year ? new Date(exp.start_year).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                        {exp.end_year ? ` &ndash; ${new Date(exp.end_year).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ' &ndash; Present'}
                        {exp.location ? ` &middot; ${exp.location}` : ''}
                      </p>
                      <p className="text-[12px] text-[#434655] font-medium mt-1">
                        {exp.designations?.length || 0} role(s) defined
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button 
                        onClick={() => { setCurrentExp(JSON.parse(JSON.stringify(exp))); setExpFormOpen(true); }} 
                        className="text-blue-600 hover:text-[#004ac6] text-xs font-bold px-2.5 py-1.5 rounded-lg hover:bg-[#eff6ff] transition"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => setEditExperiences(prev => prev.filter((_, i) => i !== idx))} 
                        className="text-[#ef4444] hover:text-[#dc2626] text-xs font-bold px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {editExperiences.length === 0 && !expFormOpen && (
                  <p className="text-sm text-[#7a8ba0] text-center py-6">
                    No experience records added yet. Click below to add one.
                  </p>
                )}
              </div>

              {/* Experience Mutation Node */}
              {expFormOpen && currentExp && (
                <div className="p-5 bg-[#f2f4f6] rounded-lg border border-[#dde3ec] space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#434655] flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                    {currentExp.id ? 'Edit Experience Log' : 'Add Experience Log'}
                  </h4>

                  {/* Internal Role Configuration Node */}
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-[#dde3ec]">
                    <Checkbox
                      id="internal-role-checkbox"
                      checked={currentExp.is_internal || false}
                      onCheckedChange={(checked) => {
                        const isInternal = !!checked;
                        let newCompanyName = currentExp.company_name;
                        let newLocation = currentExp.location;
                        if (isInternal && company) {
                          newCompanyName = company.company_name || company.name || "Internal Organization";
                          if (companyProfile) {
                            const addressParts = [
                              companyProfile.city,
                              companyProfile.district,
                              companyProfile.state
                            ].filter(Boolean);
                            newLocation = addressParts.join(", ");
                            if (!newLocation) newLocation = companyProfile.city || "";
                          } else {
                            newLocation = "";
                          }
                        } else if (!isInternal && !currentExp.company_name) {
                          const defaultCompany = company?.company_name || company?.name || "Internal Organization";
                          if (newCompanyName === defaultCompany) newCompanyName = "";
                          if (newLocation === (companyProfile ? (companyProfile.city || "") : "")) newLocation = "";
                        }
                        setCurrentExp({ 
                          ...currentExp, 
                          is_internal: isInternal,
                          company_name: newCompanyName,
                          location: newLocation
                        });
                      }}
                      className="h-4 w-4 rounded border-[#dde3ec] text-blue-600 focus:ring-[#004ac6]/20"
                    />
                    <Label htmlFor="internal-role-checkbox" className="text-[13px] font-semibold text-[#434655] cursor-pointer select-none">
                      This is an internal role (organisation uses predefined Roles & Groups)
                    </Label>
                  </div>

                  {/* Company & Location Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-[#7a8ba0]">Company / Organization</Label>
                      <Input
                        value={currentExp.company_name || ''}
                        onChange={e => setCurrentExp({ ...currentExp, company_name: e.target.value })}
                        disabled={currentExp.is_internal}
                        className={`w-full px-3 py-2 border border-[#dde3ec] rounded-lg text-[14px] text-[#1a1a2e] focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] outline-none transition-all h-10 bg-white ${currentExp.is_internal ? 'bg-[#f2f4f6] text-[#7a8ba0] cursor-not-allowed border-[#dde3ec]/60' : ''}`}
                        placeholder={currentExp.is_internal ? "Auto-filled from company" : "Company name"}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-[#7a8ba0]">Location (City, State)</Label>
                      <Input
                        value={currentExp.location || ''}
                        onChange={e => setCurrentExp({ ...currentExp, location: e.target.value })}
                        disabled={currentExp.is_internal}
                        className={`w-full px-3 py-2 border border-[#dde3ec] rounded-lg text-[14px] text-[#1a1a2e] focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] outline-none transition-all h-10 bg-white ${currentExp.is_internal ? 'bg-[#f2f4f6] text-[#7a8ba0] cursor-not-allowed border-[#dde3ec]/60' : ''}`}
                        placeholder={currentExp.is_internal ? "Auto-filled from company address" : "e.g. Bangalore, India"}
                      />
                    </div>
                  </div>

                  {/* Tenure Lifespan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-[#7a8ba0]">Start Year<span className="text-red-500 -ml-1">*</span></Label>
                      <Input type="date" value={currentExp.start_year || ''} onChange={e => setCurrentExp({ ...currentExp, start_year: e.target.value })} className="w-full px-3 py-2 border border-[#dde3ec] rounded-lg text-[14px] text-[#1a1a2e] focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] outline-none transition-all h-10 bg-white" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-[#7a8ba0]">End Year <span className="text-[#7a8ba0]/70 normal-case font-normal">(leave blank if current)</span></Label>
                      <Input type="date" value={currentExp.end_year || ''} onChange={e => setCurrentExp({ ...currentExp, end_year: e.target.value })} className="w-full px-3 py-2 border border-[#dde3ec] rounded-lg text-[14px] text-[#1a1a2e] focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] outline-none transition-all h-10 bg-white" />
                    </div>
                  </div>

                  {/* Verification Attestation */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-[#7a8ba0]">Experience Letter (optional)</Label>
                    <Input 
                      type="file" 
                      accept=".pdf,.jpg,.png" 
                      onChange={(e) => { const file = e.target.files?.[0]; if (file) setCurrentExp({ ...currentExp, experience_letter: file }); }} 
                      className="w-full px-3 py-1.5 border border-[#dde3ec] rounded-lg text-[14px] text-[#1a1a2e] bg-white h-10 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#eff6ff] file:text-blue-600 hover:file:bg-[#dbeafe]" 
                    />
                    {currentExp.experience_letter && typeof currentExp.experience_letter !== 'string' && (
                      <p className="text-[11px] text-blue-600 font-medium mt-1">Selected: {(currentExp.experience_letter as File).name}</p>
                    )}
                  </div>

                  {/* Multiple Designations Vector Segment */}
                  <div className="mt-4 pt-2 border-t border-[#dde3ec]/60">
                    <div className="flex items-center justify-between mb-2.5">
                      <Label className="text-[11px] font-bold uppercase tracking-wider text-[#434655]">Roles / Designations</Label>
                      <Button 
                        type="button" 
                        onClick={() => { 
                          const newDesignation: DesignationItem = { start_date: '', change_type: 'Joined' }; 
                          if (currentExp.is_internal) { newDesignation.company_role = null; newDesignation.company_group = null; } 
                          else { newDesignation.designation = ''; newDesignation.company_group_text = ''; } 
                          setCurrentExp({ ...currentExp, designations: [...(currentExp.designations || []), newDesignation] }); 
                        }} 
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-xs bg-white border border-[#dde3ec] text-blue-600 hover:bg-[#eff6ff] rounded-md transition-colors font-semibold px-3 flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Add Role
                      </Button>
                    </div>
                    
                    <div className="space-y-3 overflow-y-auto pr-1">
                      {currentExp.designations && currentExp.designations.map((des, desIdx) => (
                        <div key={desIdx} className="p-3.5 bg-white rounded-lg border border-[#dde3ec] space-y-3 relative shadow-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a8ba0]">Role #{desIdx+1}</span>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => { const updated = currentExp.designations.filter((_, i) => i !== desIdx); setCurrentExp({ ...currentExp, designations: updated }); }} 
                              className="h-7 w-7 p-0 text-[#ef4444] hover:text-[#dc2626] hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          
                          {currentExp.is_internal ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-[#7a8ba0] uppercase tracking-wider block mb-1">Role</Label>
                                <Select value={des.company_role?.toString() || ""} onValueChange={(val) => { const updated = [...currentExp.designations]; updated[desIdx].company_role = val ? parseInt(val) : null; setCurrentExp({ ...currentExp, designations: updated }); }}>
                                  <SelectTrigger className="h-9 rounded-lg text-[13px] border-[#dde3ec] focus:ring-[#004ac6]/20 bg-white"><SelectValue placeholder="Select role" /></SelectTrigger>
                                  <SelectContent>{roles.map(r => <SelectItem key={r.id} value={r.id.toString()}>{r.role || r.name}</SelectItem>)}</SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-[#7a8ba0] uppercase tracking-wider block mb-1">Group</Label>
                                <Select value={des.company_group?.toString() || ""} onValueChange={(val) => { const updated = [...currentExp.designations]; updated[desIdx].company_group = val ? parseInt(val) : null; setCurrentExp({ ...currentExp, designations: updated }); }}>
                                  <SelectTrigger className="h-9 rounded-lg text-[13px] border-[#dde3ec] focus:ring-[#004ac6]/20 bg-white"><SelectValue placeholder="Select group" /></SelectTrigger>
                                  <SelectContent>{groups.map(g => <SelectItem key={g.id} value={g.id.toString()}>{g.group || g.name}</SelectItem>)}</SelectContent>
                                </Select>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-[#7a8ba0] uppercase tracking-wider block mb-1">Designation Title</Label>
                                <Input value={des.designation || ''} onChange={(e) => { const updated = [...currentExp.designations]; updated[desIdx].designation = e.target.value; setCurrentExp({ ...currentExp, designations: updated }); }} className="h-9 rounded-lg text-[13px] border-[#dde3ec] px-3 py-1.5 w-full focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] outline-none transition-all bg-white" placeholder="e.g. Software Engineer" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-[#7a8ba0] uppercase tracking-wider block mb-1">Group / Department <span className="text-[#7a8ba0]/70 normal-case font-normal">(optional)</span></Label>
                                <Input value={des.company_group_text || ''} onChange={(e) => { const updated = [...currentExp.designations]; updated[desIdx].company_group_text = e.target.value; setCurrentExp({ ...currentExp, designations: updated }); }} className="h-9 rounded-lg text-[13px] border-[#dde3ec] px-3 py-1.5 w-full focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] outline-none transition-all bg-white" placeholder="e.g. Engineering" />
                              </div>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-[10px] font-bold text-[#7a8ba0] uppercase tracking-wider block mb-1">Start Date</Label>
                              <Input type="date" value={des.start_date || ''} onChange={(e) => { const updated = [...currentExp.designations]; updated[desIdx].start_date = e.target.value; setCurrentExp({ ...currentExp, designations: updated }); }} className="h-9 rounded-lg text-[13px] border-[#dde3ec] px-3 py-1.5 w-full focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] outline-none transition-all bg-white" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] font-bold text-[#7a8ba0] uppercase tracking-wider block mb-1">End Date</Label>
                              <Input type="date" value={des.end_date || ''} onChange={(e) => { const updated = [...currentExp.designations]; updated[desIdx].end_date = e.target.value; setCurrentExp({ ...currentExp, designations: updated }); }} className="h-9 rounded-lg text-[13px] border-[#dde3ec] px-3 py-1.5 w-full focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] outline-none transition-all bg-white" />
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-[#7a8ba0] uppercase tracking-wider block mb-1">Change Type</Label>
                            <Select value={des.change_type || 'Joined'} onValueChange={(val) => { const updated = [...currentExp.designations]; updated[desIdx].change_type = val; setCurrentExp({ ...currentExp, designations: updated }); }}>
                              <SelectTrigger className="h-9 rounded-lg text-[13px] border-[#dde3ec] focus:ring-[#004ac6]/20 bg-white"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Joined">Joined</SelectItem>
                                <SelectItem value="Promotion">Promotion</SelectItem>
                                <SelectItem value="Transfer">Transfer</SelectItem>
                                <SelectItem value="Demotion">Demotion</SelectItem>
                                <SelectItem value="Contract">Contract</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                      {(!currentExp.designations || currentExp.designations.length === 0) && (
                        <p className="text-xs text-[#7a8ba0] text-center py-2">No roles added. Click "Add Role" to specify.</p>
                      )}
                    </div>
                  </div>

                  {/* Form Node Actions */}
                  <div className="flex gap-3 pt-2 border-t border-[#dde3ec]/60">
                    <Button 
                      onClick={() => {
                        if (!currentExp.start_year) { toast.error("Start year is required."); return; }
                        if (!currentExp.designations || currentExp.designations.length === 0) { toast.error("At least one role/designation is required."); return; }
                        for (let i = 0; i < currentExp.designations.length; i++) {
                          const des = currentExp.designations[i];
                          if (currentExp.is_internal) { if (!des.company_role || !des.company_group) { toast.error(`Role #${i+1}: Please select both Role and Group.`); return; } } 
                          else { if (!des.designation || des.designation.trim() === '') { toast.error(`Role #${i+1}: Designation title is required.`); return; } }
                          if (!des.start_date) { toast.error(`Role #${i+1}: Start date is required.`); return; }
                        }
                        const existingIndex = editExperiences.findIndex(exp => exp.id === currentExp.id);
                        if (existingIndex !== -1) setEditExperiences(prev => prev.map((exp, idx) => idx === existingIndex ? currentExp : exp));
                        else setEditExperiences(prev => [...prev, currentExp]);
                        setCurrentExp(null); setExpFormOpen(false);
                      }} 
                      className="bg-blue-600 hover:opacity-95 text-white rounded-lg h-9 px-4 text-sm font-semibold transition-all active:scale-[0.98]"
                    >
                      {currentExp.id ? 'Update Record' : 'Add Record'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => { setExpFormOpen(false); setCurrentExp(null); }} 
                      className="border border-[#dde3ec] text-[#434655] hover:bg-[#f2f4f6] rounded-lg h-9 px-4 text-sm font-semibold transition-colors"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Trigger Node to Reveal Form */}
              {!expFormOpen && (
                <button 
                  onClick={() => { setCurrentExp({ is_internal: false, company_name: "", location: "", designations: [] }); setExpFormOpen(true); }} 
                  className="w-full py-3 border-2 border-dashed border-[#dde3ec] rounded-lg text-blue-600 text-sm font-bold hover:bg-[#eff6ff] hover:border-[#2563eb]/30 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Add Experience Record
                </button>
              )}
            </div>

            <DialogFooter className="px-6 py-4 bg-white border-t border-[#dde3ec] flex items-center justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={handleCancel} 
                className="px-4 py-2 border border-[#dde3ec] text-[#434655] font-semibold rounded-lg hover:bg-[#f2f4f6] h-10 transition-colors"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving} 
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:opacity-95 active:scale-[0.98] h-10 transition-all disabled:opacity-50"
              >
                {isSaving ? "Saving Work Experience..." : "Save Work Experience"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* BANK EDIT DIALOG */}
        <Dialog open={editingSection === "bank"} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="max-w-2xl bg-white rounded-xl p-0 overflow-hidden border border-[#dde3ec] shadow-2xl">
            <DialogHeader className="p-6 border-b border-[#dde3ec] bg-white relative">
              <DialogTitle className="text-[18px] font-bold text-[#1a1a2e] tracking-tight">
                Bank Accounts
              </DialogTitle>
              <DialogDescription className="text-[#7a8ba0] mt-1 text-[12px] font-normal">
                Manage financial accounts linked to your employee profile.
              </DialogDescription>
              <Landmark className="absolute right-8 top-6 h-10 w-10 text-blue-600 pointer-events-none" />
            </DialogHeader>

            <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto custom-scrollbar">
              
              {/* Account List Stack */}
              <div className="space-y-3">
                {editBankDetails.map((bank: any, idx: number) => (
                  <div key={idx} className="p-4 bg-white rounded-lg border border-[#dde3ec] flex items-start justify-between gap-4 shadow-xs">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-bold text-[#1a1a2e] truncate">
                          {bank.bank_name || 'Bank'}
                        </span>
                        {bank.branch_name && (
                          <span className="text-[12px] text-[#7a8ba0]">
                            ({bank.branch_name})
                          </span>
                        )}
                        {bank.is_primary && (
                          <span className="text-[10px] font-bold uppercase bg-[#eff6ff] text-blue-600 border border-blue-100 px-2 py-0.5 rounded shrink-0">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] font-mono text-[#434655] tracking-wider">
                        {bank.account_number}
                      </p>
                      <p className="text-[12px] text-[#7a8ba0]">
                        {bank.acc_holder_name} &middot; <span className="font-mono">IFSC: {bank.ifsc_code}</span>
                      </p>
                    </div>
                    
                    {/* Action Row */}
                    <div className="flex gap-1 shrink-0">
                      <button 
                        onClick={() => { setCurrentBank({ ...bank, _idx: idx }); setBankFormOpen(true); }} 
                        className="text-blue-600 hover:text-[#004ac6] text-xs font-bold px-2.5 py-1.5 rounded-lg hover:bg-[#eff6ff] transition"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => setEditBankDetails(prev => prev.filter((_, i) => i !== idx))} 
                        className="text-[#ef4444] hover:text-[#dc2626] text-xs font-bold px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                {editBankDetails.length === 0 && !bankFormOpen && (
                  <p className="text-sm text-[#7a8ba0] text-center py-6">
                    No bank accounts added yet. Click below to add one.
                  </p>
                )}
              </div>

              {/* Inline Account Mutation Node */}
              {bankFormOpen && (
                <div className="p-5 bg-[#f2f4f6] rounded-lg border border-[#dde3ec] space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#434655] flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                    {currentBank?._idx !== undefined ? 'Edit Account Matrix' : 'Add Account Matrix'}
                  </h4>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-[#7a8ba0]">Account Holder Name<span className="text-red-500 -ml-1">*</span></Label>
                      <Input 
                        value={currentBank?.acc_holder_name || ''} 
                        onChange={e => setCurrentBank((p: any) => ({ ...p, acc_holder_name: e.target.value }))} 
                        className="w-full px-3 py-2 border border-[#dde3ec] rounded-lg text-[14px] text-[#1a1a2e] focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] focus-visible:ring-[#004ac6] outline-none transition-all h-10 bg-white" 
                        placeholder="Full name as in bank records" 
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-[#7a8ba0]">Bank Name<span className="text-red-500 -ml-1">*</span></Label>
                      <Input 
                        value={currentBank?.bank_name || ''} 
                        onChange={e => setCurrentBank((p: any) => ({ ...p, bank_name: e.target.value }))} 
                        className="w-full px-3 py-2 border border-[#dde3ec] rounded-lg text-[14px] text-[#1a1a2e] focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] focus-visible:ring-[#004ac6] outline-none transition-all h-10 bg-white" 
                        placeholder="e.g. State Bank of India" 
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-[#7a8ba0]">Branch Name<span className="text-red-500 -ml-1">*</span></Label>
                      <Input 
                        value={currentBank?.branch_name || ''} 
                        onChange={e => setCurrentBank((p: any) => ({ ...p, branch_name: e.target.value }))} 
                        className="w-full px-3 py-2 border border-[#dde3ec] rounded-lg text-[14px] text-[#1a1a2e] focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] focus-visible:ring-[#004ac6] outline-none transition-all h-10 bg-white" 
                        placeholder="Branch location" 
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-[#7a8ba0]">Account Number<span className="text-red-500 -ml-1">*</span></Label>
                      <Input 
                        value={currentBank?.account_number || ''} 
                        onChange={e => setCurrentBank((p: any) => ({ ...p, account_number: e.target.value }))} 
                        className="w-full px-3 py-2 border border-[#dde3ec] rounded-lg text-[14px] text-[#1a1a2e] focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] focus-visible:ring-[#004ac6] outline-none transition-all h-10 font-mono bg-white" 
                        placeholder="Bank account number" 
                        minLength={9} maxLength={18} required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-[#7a8ba0]">IFSC Code<span className="text-red-500 -ml-1">*</span></Label>
                      <Input 
                        value={currentBank?.ifsc_code || ''} 
                        onChange={e => setCurrentBank((p: any) => ({ ...p, ifsc_code: e.target.value.toUpperCase() }))} 
                        className="w-full px-3 py-2 border border-[#dde3ec] rounded-lg text-[14px] text-[#1a1a2e] focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] focus-visible:ring-[#004ac6] outline-none transition-all h-10 uppercase font-mono tracking-wider bg-white" 
                        placeholder="e.g. SBIN0001234" 
                        minLength={11} maxLength={11} required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <Checkbox 
                          checked={!!currentBank?.is_primary} 
                          onCheckedChange={(checked) => setCurrentBank((p: any) => ({ ...p, is_primary: !!checked }))}
                          className="h-4 w-4 rounded border-[#dde3ec] text-blue-600 focus:ring-[#004ac6]/20 bg-white" 
                        />
                        <span className="text-[13px] font-semibold text-[#434655]">Set as Primary Account</span>
                      </label>
                    </div>
                  </div>

                  {/* Form Action Controls */}
                  <div className="flex gap-3 pt-2 border-t border-[#dde3ec]/60">
                    <Button 
                      onClick={() => { 
                        if (!currentBank?.account_number?.trim() || !currentBank?.bank_name?.trim() || !currentBank?.ifsc_code?.trim()) { 
                          toast.error("Bank name, account number and IFSC code are required."); 
                          return; 
                        } 
                        const { _idx, ...bankData } = currentBank; 
                        if (_idx !== undefined) { 
                          setEditBankDetails(prev => prev.map((b: any, i: number) => i === _idx ? bankData : b)); 
                        } else { 
                          setEditBankDetails(prev => [...prev, bankData]); 
                        } 
                        setCurrentBank({}); 
                        setBankFormOpen(false); 
                      }} 
                      className="bg-blue-600 hover:opacity-95 text-white rounded-lg h-9 px-4 text-sm font-semibold transition-all active:scale-[0.98]"
                    >
                      {currentBank?._idx !== undefined ? 'Update Account' : 'Add Account'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => { setBankFormOpen(false); setCurrentBank({}); }} 
                      className="border border-[#dde3ec] text-[#434655] hover:bg-[#f2f4f6] rounded-lg h-9 px-4 text-sm font-semibold transition-colors"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Trigger Node to Reveal Form */}
              {!bankFormOpen && (
                <button 
                  onClick={() => { setCurrentBank({}); setBankFormOpen(true); }} 
                  className="w-full py-3 border-2 border-dashed border-[#dde3ec] rounded-lg text-blue-600 text-sm font-bold hover:bg-[#eff6ff] hover:border-[#2563eb]/30 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Add Bank Account
                </button>
              )}
            </div>

            <DialogFooter className="px-6 py-4 bg-white border-t border-[#dde3ec] flex items-center justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={handleCancel} 
                className="px-4 py-2 border border-[#dde3ec] text-[#434655] font-semibold rounded-lg hover:bg-[#f2f4f6] h-10 transition-colors"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving} 
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:opacity-95 active:scale-[0.98] h-10 transition-all disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Bank Details"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* PREFERENCES EDIT DIALOG */}
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