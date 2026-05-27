"use client";

import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { UserPlus, Save, Upload, X, Camera, User, UserMinus, Plus, Trash2, ArrowRight, ArrowLeft, ChevronRight, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// Type definitions for dropdowns
interface Role { id: number; role: string; name?: string; }
interface Religion { id: number; name: string; }
interface Caste { id: number; name: string; }
interface StaffType { id: number; type_name?: string; name?: string; }
interface StaffCategory { id: number; category_name?: string; name?: string; }

export default function AddEmployeePage() {
  const { company } = useAuth();
  const companyId = company?.id || "";
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stepper State
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    "Personal Info",
    "Employment",
    "Address & Settings",
    "Qualifications",
    "Experience",
    "Identity & Bank"
  ];

  // Dropdown states
  const [roles, setRoles] = useState<Role[]>([]);
  const [religions, setReligions] = useState<Religion[]>([]);
  const [castes, setCastes] = useState<Caste[]>([]);
  const [staffTypes, setStaffTypes] = useState<StaffType[]>([]);
  const [staffCategories, setStaffCategories] = useState<StaffCategory[]>([]);
  const [groups, setGroups] = useState<{ id: number; group: string }[]>([]);

  // Basic employee fields
  const [formData, setFormData] = useState({
    first_name: "", last_name: "", email: "", mobile: "", gender: "",
    role_id: "", group_id: "", company_id: companyId, password: "empsyncai123@",
    biometric_id: "", is_whatsapp: true, is_sms: true, is_wfh: true, is_active: true,
    team_lead: false,
  });

  // Extended profile fields
  const [profileData, setProfileData] = useState({
    dob: "", guardian_name: "", guardian_phone: "", religion_id: "", caste_id: "",
    staff_type_id: "", staff_category_id: "", ktu_id: "", aicte_id: "", pan_no: "",
    aadhar_no: "", blood_group: "", alternate_mobile: "", alternate_email: "",
    present_address: { address_line_1: "", address_line_2: "", city: "", district: "", state: "", country: "India", pincode: "" },
    permanent_address: { address_line_1: "", address_line_2: "", city: "", district: "", state: "", country: "India", pincode: "" },
  });

  // Dynamic Arrays
  const [bankDetails, setBankDetails] = useState<any[]>([]);
  const [qualifications, setQualifications] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ---------- Generic fetch function ----------
  const fetchData = async (url: string, setter: (data: any[]) => void, label: string) => {
    try {
      const res = await fetch(url);
      const text = await res.text();
      let json;
      try { json = JSON.parse(text); } catch { json = []; }
      
      let arr: any[] = [];
      if (Array.isArray(json)) {
        arr = json;
      } else if (json && typeof json === 'object') {
        const possibleKeys = ['data', 'results', 'items', 'staff_types', 'categories', 'types', 'list'];
        for (const key of possibleKeys) {
          if (json[key] && Array.isArray(json[key])) { arr = json[key]; break; }
        }
        if (arr.length === 0) {
          for (const key in json) {
            if (Array.isArray(json[key])) { arr = json[key]; break; }
          }
        }
      }
      setter(arr);
    } catch (err) {
      setter([]);
    }
  };

  // ---------- Fetch initial data ----------
  useEffect(() => {
    if (!companyId) return;
    fetchData(`/api/settings/roles/${companyId}`, setRoles, "Roles");
    fetchData(`/api/settings/staff_type/${companyId}`, setStaffTypes, "StaffTypes");
    fetchData(`/api/settings/staff_category/${companyId}`, setStaffCategories, "StaffCategories");
    fetchData(`/api/settings/groups/${companyId}`, setGroups, "Groups");
  }, [companyId]);

  useEffect(() => { fetchData(`/api/settings/manage-religion/`, setReligions, "Religions"); }, []);

  useEffect(() => {
    if (!profileData.religion_id) { setCastes([]); return; }
    fetchData(`/api/settings/manage-caste/?religion_id=${profileData.religion_id}`, setCastes, "Castes");
  }, [profileData.religion_id]);

  useEffect(() => {
    if (companyId) setFormData(prev => ({ ...prev, company_id: companyId }));
  }, [companyId]);

  // ---------- Dynamic Array Helpers ----------
  const addBank = () => setBankDetails([...bankDetails, { acc_holder_fname: "", acc_holder_mname: "", acc_holder_lname: "", bank_name: "", account_number: "", ifsc_code: "", branch_name: "", is_primary: false }]);
  const removeBank = (idx: number) => setBankDetails(bankDetails.filter((_, i) => i !== idx));
  const updateBank = (idx: number, field: string, val: any) => {
    const updated = [...bankDetails];
    updated[idx][field] = val;
    setBankDetails(updated);
  };

  const addQual = () => setQualifications([...qualifications, { qualification_level: "", specialization: "", institution_name: "", university: "", location: "", start_year: "", passing_year: "", percentage: "", certificate: null }]);
  const removeQual = (idx: number) => setQualifications(qualifications.filter((_, i) => i !== idx));
  const updateQual = (idx: number, field: string, val: any) => {
    const updated = [...qualifications];
    updated[idx][field] = val;
    setQualifications(updated);
  };

  const addExp = () => setExperiences([...experiences, { company_name: "", location: "", start_year: "", end_year: "", description: "", experience_letter: null, designations: [] }]);
  const removeExp = (idx: number) => setExperiences(experiences.filter((_, i) => i !== idx));
  const updateExp = (idx: number, field: string, val: any) => {
    const updated = [...experiences];
    updated[idx][field] = val;
    setExperiences(updated);
  };

  const addDesig = (expIdx: number) => {
    const updated = [...experiences];
    updated[expIdx].designations.push({ designation: "", start_date: "", end_date: "", change_type: "Joined", description: "" }); // end_date & description already tracked
    setExperiences(updated);
  };
  const removeDesig = (expIdx: number, desIdx: number) => {
    const updated = [...experiences];
    updated[expIdx].designations = updated[expIdx].designations.filter((_: any, i: number) => i !== desIdx);
    setExperiences(updated);
  };
  const updateDesig = (expIdx: number, desIdx: number, field: string, val: any) => {
    const updated = [...experiences];
    updated[expIdx].designations[desIdx][field] = val;
    setExperiences(updated);
  };

  // ---------- Input handlers ----------
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const processedValue = (name === 'role_id' || name === 'company_id' || name === 'group_id') ? (value === '' ? '' : Number(value)) : value;
    setFormData({ ...formData, [name]: processedValue });
    if (errors[name]) setErrors(prev => { const newErrors = { ...prev }; delete newErrors[name]; return newErrors; });
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
    if (errors[name]) setErrors(prev => { const newErrors = { ...prev }; delete newErrors[name]; return newErrors; });
  };

  const handleAddressChange = (type: "present_address" | "permanent_address", field: string, value: string) => {
    setProfileData({ ...profileData, [type]: { ...profileData[type], [field]: value } });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setProfileImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ---------- Validation & Navigation ----------
  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    
    if (step === 0) {
      if (!formData.first_name.trim()) newErrors.first_name = "Required";
      if (!formData.last_name.trim()) newErrors.last_name = "Required";
      if (!formData.email.trim()) newErrors.email = "Required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email";
      if (!formData.mobile.trim()) newErrors.mobile = "Required";
      if (!formData.gender) newErrors.gender = "Required";
      if (!profileData.dob) newErrors.dob = "Required";
    } 
    else if (step === 1) {
      if (!formData.role_id) newErrors.role_id = "Required";
      if (!formData.biometric_id.trim()) newErrors.biometric_id = "Required";
      if (!profileData.staff_type_id) newErrors.staff_type_id = "Required";
      if (!profileData.staff_category_id) newErrors.staff_category_id = "Required";
    }
    else if (step === 2) {
      if (!profileData.present_address.address_line_1) newErrors.present_addr_1 = "Required";
      if (!profileData.present_address.city) newErrors.present_city = "Required";
    }
    else if (step === 3) {
      if (qualifications.length === 0) newErrors.general = "At least one qualification is required.";
      qualifications.forEach((q, i) => {
        if (!q.qualification_level) newErrors[`qual_${i}_level`] = "Required";
        if (!q.institution_name) newErrors[`qual_${i}_inst`] = "Required";
      });
    }
    else if (step === 4) {
      // Experience is optional, but if entered, needs validation
      experiences.forEach((e, i) => {
        if (!e.company_name) newErrors[`exp_${i}_company`] = "Required";
      });
    }
    else if (step === 5) {
      if (!profileData.aadhar_no) newErrors.aadhar_no = "Aadhar Number is required";
      if (bankDetails.length === 0) newErrors.general = "At least one bank account is required.";
      bankDetails.forEach((b, i) => {
        if (!b.bank_name) newErrors[`bank_${i}_name`] = "Required";
        if (!b.account_number) newErrors[`bank_${i}_acc`] = "Required";
        if (!b.ifsc_code) newErrors[`bank_${i}_ifsc`] = "Required";
      });
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setMessage("Please fill all required fields correctly.");
      return false;
    }
    setMessage("");
    return true;
  };

  const handleNext = () => { if (validateStep(currentStep)) setCurrentStep(p => p + 1); };
  const handlePrev = () => { setCurrentStep(p => p - 1); setMessage(""); };

  // ---------- Submit ----------
  const handleSubmit = async () => {
    if (!validateStep(5)) return;
    setLoading(true); setMessage("");

    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([key, value]) => fd.append(key, value.toString()));
      if (profileImage) fd.append('prof_img', profileImage);

      const empRes = await fetch("/api/employees/add_employees", { method: "POST", body: fd });
      const empData = await empRes.json();
      if (!empRes.ok) throw new Error(empData.message || "Failed to add employee");

      let employeeId = empData?.data?.user?.id || empData?.data?.id || empData?.user?.id || empData?.id;
      if (!employeeId) throw new Error("Employee created but ID not returned.");

      const profilePayload = {
        employee_id: Number(employeeId),
        dob: profileData.dob || null,
        guardian_name: profileData.guardian_name, guardian_phone: profileData.guardian_phone,
        religion: profileData.religion_id ? Number(profileData.religion_id) : null,
        caste: profileData.caste_id ? Number(profileData.caste_id) : null,
        staff_type: profileData.staff_type_id ? Number(profileData.staff_type_id) : null,
        staff_category: profileData.staff_category_id ? Number(profileData.staff_category_id) : null,
        ktu_id: profileData.ktu_id, aicte_id: profileData.aicte_id,
        pan_no: profileData.pan_no, aadhar_no: profileData.aadhar_no,
        blood_group: profileData.blood_group,
        alternate_mobile: profileData.alternate_mobile, alternate_email: profileData.alternate_email,
        present_address: profileData.present_address,
        permanent_address: profileData.permanent_address,
        bank_details: bankDetails,
        qualifications: qualifications,
        experiences: experiences
      };

      const profileRes = await fetch("/api/employee-profile/", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profilePayload),
      });

      if (!profileRes.ok) {
        const txt = await profileRes.text();
        throw new Error("Failed to create profile: " + txt);
      }

      setMessage("Employee and profile created successfully!");
      queryClient.invalidateQueries({ queryKey: ["employees", companyId] });
      
      // reset form
      setCurrentStep(0);
      setBankDetails([]); setQualifications([]); setExperiences([]);
      removeImage();
    } catch (error: any) {
      setMessage(error.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Render Steps ----------
  const renderStep0 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Photo Upload Box */}
        <div className="flex-shrink-0 flex flex-col items-center gap-2 w-full md:w-auto">
          <div className="relative">
            <div 
              className="w-[110px] h-[130px] rounded-lg border-2 border-dashed border-[#dde3ec] bg-[#f4f7fb] flex flex-col items-center justify-center cursor-pointer hover:border-[#e8b84b] hover:bg-[#fdf3dc] overflow-hidden transition-all group" 
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="relative w-full h-full">
                  <img src={imagePreview} className="w-full h-full object-cover rounded-lg" />
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); removeImage(); }} 
                    className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center p-3 text-center">
                  <Upload className="h-6 w-6 text-[#7a8ba0] mb-2 group-hover:text-[#e8b84b] transition-colors" />
                  <p className="text-xs font-semibold text-[#445069]">Upload Photo</p>
                </div>
              )}
            </div>
          </div>
          <p className="text-[10px] text-[#7a8ba0] text-center max-w-[110px]">JPG, PNG<br/>Max 2MB</p>
          <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
        </div>

        {/* Form Fields Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-[18px]">
          <div>
            <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">First Name <span className="text-[#c9962a] ml-1">*</span></Label>
            <Input 
              name="first_name" 
              value={formData.first_name} 
              onChange={handleChange} 
              className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all placeholder:text-[#7a8ba0]"
            />
            {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name}</p>}
          </div>

          <div>
            <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">Last Name <span className="text-[#c9962a] ml-1">*</span></Label>
            <Input 
              name="last_name" 
              value={formData.last_name} 
              onChange={handleChange} 
              className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all placeholder:text-[#7a8ba0]"
            />
            {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name}</p>}
          </div>

          <div>
            <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">Email <span className="text-[#c9962a] ml-1">*</span></Label>
            <Input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all placeholder:text-[#7a8ba0]"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">Mobile <span className="text-[#c9962a] ml-1">*</span></Label>
            <Input 
              name="mobile" 
              value={formData.mobile} 
              onChange={handleChange} 
              className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all placeholder:text-[#7a8ba0]"
            />
            {errors.mobile && <p className="text-xs text-red-500 mt-1">{errors.mobile}</p>}
          </div>

          <div>
            <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">Gender <span className="text-[#c9962a] ml-1">*</span></Label>
            <select 
              name="gender" 
              value={formData.gender} 
              onChange={handleChange} 
              className="w-full h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all cursor-pointer"
            >
              <option value="">Select Gender</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
              <option value="N">Prefer not to say</option>
            </select>
            {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender}</p>}
          </div>

          <div>
            <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">Date of Birth <span className="text-[#c9962a] ml-1">*</span></Label>
            <Input 
              type="date" 
              name="dob" 
              value={profileData.dob} 
              onChange={handleProfileChange} 
              className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all placeholder:text-[#7a8ba0]"
            />
            {errors.dob && <p className="text-xs text-red-500 mt-1">{errors.dob}</p>}
          </div>

          <div>
            <Label className="text-xs font-medium text-[#445069] mb-1.5">Blood Group</Label>
            <select 
              name="blood_group" 
              value={profileData.blood_group} 
              onChange={handleProfileChange} 
              className="w-full h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all cursor-pointer"
            >
              <option value="">Select</option>
              <option value="A+">A+</option>
              <option value="B+">B+</option>
              <option value="O+">O+</option>
              <option value="AB+">AB+</option>
              <option value="A-">A-</option>
              <option value="B-">B-</option>
              <option value="O-">O-</option>
              <option value="AB-">AB-</option>
            </select>
          </div>

          <div>
            <Label className="text-xs font-medium text-[#445069] mb-1.5">Alternate Mobile</Label>
            <Input 
              name="alternate_mobile" 
              value={profileData.alternate_mobile} 
              onChange={handleProfileChange} 
              className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all placeholder:text-[#7a8ba0]"
            />
          </div>

          <div>
            <Label className="text-xs font-medium text-[#445069] mb-1.5">Religion</Label>
            <select 
              name="religion_id" 
              value={profileData.religion_id} 
              onChange={handleProfileChange} 
              className="w-full h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all cursor-pointer"
            >
              <option value="">Select</option>
              {religions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          <div>
            <Label className="text-xs font-medium text-[#445069] mb-1.5">Caste</Label>
            <select 
              name="caste_id" 
              value={profileData.caste_id} 
              onChange={handleProfileChange} 
              className="w-full h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all cursor-pointer disabled:bg-[#f4f7fb] disabled:cursor-not-allowed" 
              disabled={!profileData.religion_id}
            >
              <option value="">Select</option>
              {castes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
        <div>
          <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">Role <span className="text-[#c9962a] ml-1">*</span></Label>
          <select 
            name="role_id" 
            value={formData.role_id} 
            onChange={handleChange} 
            className="w-full h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all cursor-pointer"
          >
            <option value="">Select Role</option>
            {roles.map(r => <option key={r.id} value={r.id}>{r.role || r.name}</option>)}
          </select>
          {errors.role_id && <p className="text-xs text-red-500 mt-1">{errors.role_id}</p>}
        </div>

        <div>
          <Label className="text-xs font-medium text-[#445069] mb-1.5">Group</Label>
          <select 
            name="group_id" 
            value={formData.group_id} 
            onChange={handleChange} 
            className="w-full h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all cursor-pointer"
          >
            <option value="">Select Group</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.group}</option>)}
          </select>
        </div>

        <div>
          <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">Staff Type <span className="text-[#c9962a] ml-1">*</span></Label>
          <select 
            name="staff_type_id" 
            value={profileData.staff_type_id} 
            onChange={handleProfileChange} 
            className="w-full h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all cursor-pointer"
          >
            <option value="">Select Type</option>
            {staffTypes.map(st => <option key={st.id} value={st.id}>{st.type_name || st.name}</option>)}
          </select>
          {errors.staff_type_id && <p className="text-xs text-red-500 mt-1">{errors.staff_type_id}</p>}
        </div>

        <div>
          <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">Staff Category <span className="text-[#c9962a] ml-1">*</span></Label>
          <select 
            name="staff_category_id" 
            value={profileData.staff_category_id} 
            onChange={handleProfileChange} 
            className="w-full h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all cursor-pointer"
          >
            <option value="">Select Category</option>
            {staffCategories.map(sc => <option key={sc.id} value={sc.id}>{sc.category_name || sc.name}</option>)}
          </select>
          {errors.staff_category_id && <p className="text-xs text-red-500 mt-1">{errors.staff_category_id}</p>}
        </div>

        <div>
          <Label className="text-xs font-medium text-[#445069] mb-1.5">KTU ID</Label>
          <Input 
            name="ktu_id" 
            value={profileData.ktu_id} 
            onChange={handleProfileChange} 
            className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all placeholder:text-[#7a8ba0]"
          />
        </div>

        <div>
          <Label className="text-xs font-medium text-[#445069] mb-1.5">AICTE ID</Label>
          <Input 
            name="aicte_id" 
            value={profileData.aicte_id} 
            onChange={handleProfileChange} 
            className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all placeholder:text-[#7a8ba0]"
          />
        </div>

        <div>
          <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">Biometric ID <span className="text-[#c9962a] ml-1">*</span></Label>
          <Input 
            name="biometric_id" 
            value={formData.biometric_id} 
            onChange={handleChange} 
            className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all placeholder:text-[#7a8ba0]"
          />
          {errors.biometric_id && <p className="text-xs text-red-500 mt-1">{errors.biometric_id}</p>}
        </div>

        <div className="flex items-center gap-3 mt-1 bg-[#f4f7fb] p-3 rounded-lg border border-[#dde3ec]/60">
          <Switch checked={formData.team_lead} onCheckedChange={v => setFormData({...formData, team_lead: v})} />
          <div>
            <Label className="text-sm font-medium text-[#445069] cursor-pointer">Team Lead</Label>
            <p className="text-[10px] text-[#7a8ba0] mt-0.5">Mark this employee as a team lead for their group</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Present Address Column */}
        <div className="space-y-4">
          <h4 className="font-semibold text-base text-[#0f2744] flex items-center gap-2 pb-1 border-b border-[#dde3ec]">
            Present Address
          </h4>
          <div>
            <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">Address Line 1 <span className="text-[#c9962a] ml-1">*</span></Label>
            <Input 
              value={profileData.present_address.address_line_1} 
              onChange={e => handleAddressChange("present_address", "address_line_1", e.target.value)} 
              className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
            />
            {errors.present_addr_1 && <p className="text-xs text-red-500 mt-1">{errors.present_addr_1}</p>}
          </div>

          <div>
            <Label className="text-xs font-medium text-[#445069] mb-1.5">Address Line 2</Label>
            <Input 
              value={profileData.present_address.address_line_2} 
              onChange={e => handleAddressChange("present_address", "address_line_2", e.target.value)} 
              className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">City <span className="text-[#c9962a] ml-1">*</span></Label>
              <Input 
                value={profileData.present_address.city} 
                onChange={e => handleAddressChange("present_address", "city", e.target.value)} 
                className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
              />
              {errors.present_city && <p className="text-xs text-red-500 mt-1">{errors.present_city}</p>}
            </div>
            <div>
              <Label className="text-xs font-medium text-[#445069] mb-1.5">District</Label>
              <Input 
                value={profileData.present_address.district} 
                onChange={e => handleAddressChange("present_address", "district", e.target.value)} 
                className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium text-[#445069] mb-1.5">State</Label>
              <Input 
                value={profileData.present_address.state} 
                onChange={e => handleAddressChange("present_address", "state", e.target.value)} 
                className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-[#445069] mb-1.5">Pincode</Label>
              <Input 
                value={profileData.present_address.pincode} 
                onChange={e => handleAddressChange("present_address", "pincode", e.target.value)} 
                className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium text-[#445069] mb-1.5">Country</Label>
            <Input 
              value={profileData.present_address.country} 
              onChange={e => handleAddressChange("present_address", "country", e.target.value)} 
              className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
            />
          </div>
        </div>

        {/* Permanent Address Column */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#dde3ec]">
            <h4 className="font-semibold text-base text-[#0f2744]">Permanent Address</h4>
            <Button 
              type="button"
              variant="outline" 
              size="sm" 
              onClick={() => setProfileData(p => ({...p, permanent_address: {...p.present_address}}))}
              className="text-xs h-7 border-[#dde3ec] text-[#445069] pb-1 bg-[#f4f7fb] hover:bg-[#f4f7fb] hover:text-[#0f2744] transition-all"
            >
              Copy Present
            </Button>
          </div>

          <div>
            <Label className="text-xs font-medium text-[#445069] mb-1.5">Address Line 1</Label>
            <Input 
              value={profileData.permanent_address.address_line_1} 
              onChange={e => handleAddressChange("permanent_address", "address_line_1", e.target.value)} 
              className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
            />
          </div>

          <div>
            <Label className="text-xs font-medium text-[#445069] mb-1.5">Address Line 2</Label>
            <Input 
              value={profileData.permanent_address.address_line_2} 
              onChange={e => handleAddressChange("permanent_address", "address_line_2", e.target.value)} 
              className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium text-[#445069] mb-1.5">City</Label>
              <Input 
                value={profileData.permanent_address.city} 
                onChange={e => handleAddressChange("permanent_address", "city", e.target.value)} 
                className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-[#445069] mb-1.5">District</Label>
              <Input 
                value={profileData.permanent_address.district} 
                onChange={e => handleAddressChange("permanent_address", "district", e.target.value)} 
                className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium text-[#445069] mb-1.5">State</Label>
              <Input 
                value={profileData.permanent_address.state} 
                onChange={e => handleAddressChange("permanent_address", "state", e.target.value)} 
                className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-[#445069] mb-1.5">Pincode</Label>
              <Input 
                value={profileData.permanent_address.pincode} 
                onChange={e => handleAddressChange("permanent_address", "pincode", e.target.value)} 
                className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium text-[#445069] mb-1.5">Country</Label>
            <Input 
              value={profileData.permanent_address.country} 
              onChange={e => handleAddressChange("permanent_address", "country", e.target.value)} 
              className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
            />
          </div>
        </div>
      </div>

      <Separator className="bg-[#dde3ec]" />

      <div className="flex flex-wrap gap-4 justify-around bg-[#f4f7fb] p-5 rounded-lg border border-[#dde3ec]/60">
        <div className="flex items-center gap-3">
          <Switch checked={formData.is_whatsapp} onCheckedChange={v => setFormData({...formData, is_whatsapp: v})} />
          <Label className="text-sm font-medium text-[#445069] cursor-pointer">WhatsApp Notif</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={formData.is_sms} onCheckedChange={v => setFormData({...formData, is_sms: v})} />
          <Label className="text-sm font-medium text-[#445069] cursor-pointer">SMS Notif</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={formData.is_wfh} onCheckedChange={v => setFormData({...formData, is_wfh: v})} />
          <Label className="text-sm font-medium text-[#445069] cursor-pointer">WFH Allowed</Label>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="flex justify-between items-center pb-2 border-b border-[#dde3ec]">
        <h3 className="font-semibold text-base text-[#0f2744]">Academic Qualifications</h3>
        <Button 
          type="button"
          onClick={addQual} 
          size="sm" 
          variant="outline" 
          className="gap-1.5 text-xs h-8 border-[#0f2744] text-[#0f2744] hover:bg-[#eff6ff] hover:text-[#0f2744] font-medium transition-all flex items-center"
        >
          <Plus className="w-4 h-4"/> Add Qualification
        </Button>
      </div>

      {errors.general && <p className="text-red-500 font-medium text-sm">{errors.general}</p>}

      <div className="space-y-6">
        {qualifications.map((q, idx) => (
          <Card key={idx} className="relative bg-[#f4f7fb] border border-[#dde3ec] rounded-lg p-6 group transition-all hover:border-[#234d78]/30 shadow-sm overflow-visible">
            {/* Delete button absolutely positioned */}
            <Button 
              type="button"
              variant="destructive" 
              size="icon" 
              className="absolute -top-3 -right-3 rounded-full h-8 w-8 bg-white border border-[#dde3ec] text-[#7a8ba0] hover:text-red-500 hover:border-red-500 hover:bg-white shadow-md flex items-center justify-center transition-all md:opacity-0 md:group-hover:opacity-100" 
              onClick={() => removeQual(idx)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            
            <CardContent className="p-0 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">Level <span className="text-[#c9962a] ml-1">*</span></Label>
                <Input 
                  placeholder="e.g. B.Tech" 
                  value={q.qualification_level} 
                  onChange={e => updateQual(idx, 'qualification_level', e.target.value)} 
                  className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
                />
                {errors[`qual_${idx}_level`] && <p className="text-xs text-red-500 mt-1">{errors[`qual_${idx}_level`]}</p>}
              </div>

              <div>
                <Label className="text-xs font-medium text-[#445069] mb-1.5">Specialization</Label>
                <Input 
                  value={q.specialization} 
                  onChange={e => updateQual(idx, 'specialization', e.target.value)} 
                  className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">Institution <span className="text-[#c9962a] ml-1">*</span></Label>
                <Input 
                  value={q.institution_name} 
                  onChange={e => updateQual(idx, 'institution_name', e.target.value)} 
                  className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
                />
                {errors[`qual_${idx}_inst`] && <p className="text-xs text-red-500 mt-1">{errors[`qual_${idx}_inst`]}</p>}
              </div>

              <div>
                <Label className="text-xs font-medium text-[#445069] mb-1.5">University / Board</Label>
                <Input 
                  value={q.university} 
                  onChange={e => updateQual(idx, 'university', e.target.value)} 
                  className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-[#445069] mb-1.5">Institution Location</Label>
                <Input 
                  placeholder="e.g. Kochi, Kerala" 
                  value={q.location} 
                  onChange={e => updateQual(idx, 'location', e.target.value)} 
                  className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-[#445069] mb-1.5">Percentage / CGPA</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={q.percentage} 
                  onChange={e => updateQual(idx, 'percentage', e.target.value)} 
                  className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-[#445069] mb-1.5">Start Date</Label>
                <Input 
                  type="date" 
                  value={q.start_year} 
                  onChange={e => updateQual(idx, 'start_year', e.target.value)} 
                  className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-[#445069] mb-1.5">Pass Date</Label>
                <Input 
                  type="date" 
                  value={q.passing_year} 
                  onChange={e => updateQual(idx, 'passing_year', e.target.value)} 
                  className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
                />
              </div>

              <div className="col-span-1 md:col-span-3">
                <Label className="text-xs font-medium text-[#445069] mb-1.5">Certificate (optional)</Label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer h-[38px] px-4 border border-dashed border-[#dde3ec] rounded-[7px] bg-white text-[#7a8ba0] text-sm hover:border-[#c9962a] hover:text-[#c9962a] transition-all">
                    <Upload className="w-4 h-4" />
                    <span>{q.certificate ? (q.certificate as File).name : "Upload Certificate"}</span>
                    <input 
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png" 
                      className="hidden" 
                      onChange={e => { const f = e.target.files?.[0] || null; updateQual(idx, 'certificate', f); }}
                    />
                  </label>
                  {q.certificate && (
                    <button type="button" onClick={() => updateQual(idx, 'certificate', null)} className="text-red-400 hover:text-red-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {qualifications.length === 0 && (
        <div className="text-center p-8 border border-dashed border-[#dde3ec] rounded-lg text-[#7a8ba0] bg-[#f4f7fb]/30 font-medium">
          No qualifications added yet. Please add at least one.
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="flex justify-between items-center pb-2 border-b border-[#dde3ec]">
        <h3 className="font-semibold text-base text-[#0f2744]">Work Experience</h3>
        <Button 
          type="button"
          onClick={addExp} 
          size="sm" 
          variant="outline" 
          className="gap-1.5 text-xs h-8 border-[#0f2744] text-[#0f2744] hover:bg-[#eff6ff] hover:text-[#0f2744] font-medium transition-all flex items-center"
        >
          <Plus className="w-4 h-4"/> Add Experience
        </Button>
      </div>

      <div className="space-y-6">
        {experiences.map((exp, idx) => (
          <Card key={idx} className="relative bg-[#f4f7fb] border border-[#dde3ec] rounded-lg p-6 group transition-all hover:border-[#234d78]/30 shadow-sm overflow-visible mb-6">
            <Button 
              type="button"
              variant="destructive" 
              size="icon" 
              className="absolute -top-3 -right-3 rounded-full h-8 w-8 bg-white border border-[#dde3ec] text-[#7a8ba0] hover:text-red-500 hover:border-red-500 hover:bg-white shadow-md flex items-center justify-center transition-all md:opacity-0 md:group-hover:opacity-100" 
              onClick={() => removeExp(idx)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            
            <CardContent className="p-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">Company Name <span className="text-[#c9962a] ml-1">*</span></Label>
                  <Input 
                    value={exp.company_name} 
                    onChange={e => updateExp(idx, 'company_name', e.target.value)} 
                    className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
                  />
                  {errors[`exp_${idx}_company`] && <p className="text-xs text-red-500 mt-1">{errors[`exp_${idx}_company`]}</p>}
                </div>
                <div>
                  <Label className="text-xs font-medium text-[#445069] mb-1.5">Location</Label>
                  <Input 
                    value={exp.location} 
                    onChange={e => updateExp(idx, 'location', e.target.value)} 
                    className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-[#445069] mb-1.5">Start Date</Label>
                  <Input 
                    type="date" 
                    value={exp.start_year} 
                    onChange={e => updateExp(idx, 'start_year', e.target.value)} 
                    className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-[#445069] mb-1.5">End Date</Label>
                  <Input 
                    type="date" 
                    value={exp.end_year} 
                    onChange={e => updateExp(idx, 'end_year', e.target.value)} 
                    className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-[#445069] mb-1.5">Description / Notes</Label>
                <textarea 
                  rows={2}
                  value={exp.description} 
                  onChange={e => updateExp(idx, 'description', e.target.value)} 
                  placeholder="Brief description of role or responsibilities..."
                  className="w-full px-3 py-2 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all resize-none placeholder:text-[#7a8ba0]"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-[#445069] mb-1.5">Experience Letter (optional)</Label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer h-[38px] px-4 border border-dashed border-[#dde3ec] rounded-[7px] bg-white text-[#7a8ba0] text-sm hover:border-[#c9962a] hover:text-[#c9962a] transition-all">
                    <Upload className="w-4 h-4" />
                    <span>{exp.experience_letter ? (exp.experience_letter as File).name : "Upload Experience Letter"}</span>
                    <input 
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png" 
                      className="hidden" 
                      onChange={e => { const f = e.target.files?.[0] || null; updateExp(idx, 'experience_letter', f); }}
                    />
                  </label>
                  {exp.experience_letter && (
                    <button type="button" onClick={() => updateExp(idx, 'experience_letter', null)} className="text-red-400 hover:text-red-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
               
              <div className="bg-white p-5 rounded-lg border border-[#dde3ec] space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-[#dde3ec]/60">
                  <h5 className="font-semibold text-xs text-[#0f2744] uppercase tracking-wider">Designations</h5>
                  <Button 
                    type="button"
                    size="sm" 
                    variant="ghost" 
                    onClick={() => addDesig(idx)} 
                    className="h-8 px-2.5 text-xs text-[#0f2744] hover:bg-[#eff6ff] hover:text-[#0f2744] gap-1 flex items-center transition-all font-medium border border-transparent hover:border-[#dde3ec]"
                  >
                    <Plus className="w-3 h-3"/> Add Designation
                  </Button>
                </div>
                
                {exp.designations.map((des: any, didx: number) => (
                  <div key={didx} className="flex flex-col gap-3 bg-[#f4f7fb]/40 p-3 rounded border border-[#dde3ec]/40 relative">
                    {/* Row 1: Title (Full Width) */}
                    <div className="w-full">
                      <Label className="text-xs font-medium text-[#445069] mb-1 block">Title</Label>
                      <Input 
                        className="h-8 text-xs border-[#dde3ec] bg-white w-full" 
                        value={des.designation} 
                        onChange={e => updateDesig(idx, didx, 'designation', e.target.value)}
                      />
                    </div>

                    {/* Row 2: Start Date, End Date, Type (Shared Row) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-[#445069] mb-1 block">Start Date</Label>
                        <Input 
                          type="date" 
                          className="h-8 text-xs border-[#dde3ec] bg-white w-full" 
                          value={des.start_date} 
                          onChange={e => updateDesig(idx, didx, 'start_date', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-[#445069] mb-1 block">End Date</Label>
                        <Input 
                          type="date" 
                          className="h-8 text-xs border-[#dde3ec] bg-white w-full" 
                          value={des.end_date} 
                          onChange={e => updateDesig(idx, didx, 'end_date', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-[#445069] mb-1 block">Type</Label>
                        <select 
                          className="h-8 text-xs w-full border border-[#dde3ec] bg-white rounded-md px-2 focus:outline-none cursor-pointer" 
                          value={des.change_type} 
                          onChange={e => updateDesig(idx, didx, 'change_type', e.target.value)}
                        >
                          <option value="Joined">Joined</option>
                          <option value="Promotion">Promotion</option>
                          <option value="Demotion">Demotion</option>
                        </select>
                      </div>
                    </div>

                    {/* Row 3: Description and Action Button (Shared Row) */}
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <Label className="text-xs font-medium text-[#445069] mb-1 block">Description</Label>
                        <Input 
                          className="h-8 text-xs border-[#dde3ec] bg-white w-full" 
                          placeholder="Notes about this change..."
                          value={des.description} 
                          onChange={e => updateDesig(idx, didx, 'description', e.target.value)}
                        />
                      </div>
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded shrink-0" 
                        onClick={() => removeDesig(idx, didx)}
                      >
                        <X className="w-4 h-4"/>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {experiences.length === 0 && (
        <div className="text-center p-8 border border-dashed border-[#dde3ec] rounded-lg text-[#7a8ba0] bg-[#f4f7fb]/30 font-medium">
          No experience records added yet.
        </div>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
        <div>
          <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">Aadhar Number <span className="text-[#c9962a] ml-1">*</span></Label>
          <Input 
            value={profileData.aadhar_no} 
            onChange={handleProfileChange} 
            name="aadhar_no"
            placeholder="xxxx xxxx xxxx xxxx"
            className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
          />
          {errors.aadhar_no && <p className="text-xs text-red-500 mt-1">{errors.aadhar_no}</p>}
        </div>
        
        <div>
          <Label className="text-xs font-medium text-[#445069] mb-1.5">PAN Number</Label>
          <Input 
            value={profileData.pan_no} 
            onChange={handleProfileChange} 
            name="pan_no"
            placeholder="ABCDE1234F"
            className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all uppercase"
          />
        </div>
      </div>

      <Separator className="bg-[#dde3ec]" />

      <div className="flex justify-between items-center pb-2 border-b border-[#dde3ec]">
        <h3 className="font-semibold text-base text-[#0f2744]">Bank Accounts</h3>
        <Button 
          type="button"
          onClick={addBank} 
          size="sm" 
          variant="outline" 
          className="gap-1.5 text-xs h-8 border-[#0f2744] text-[#0f2744] hover:bg-[#eff6ff] hover:text-[#0f2744] font-medium transition-all flex items-center"
        >
          <Plus className="w-4 h-4"/> Add Bank
        </Button>
      </div>

      {errors.general && <p className="text-red-500 font-medium text-sm">{errors.general}</p>}

      <div className="space-y-6">
        {bankDetails.map((b, idx) => (
          <Card key={idx} className="relative bg-[#f4f7fb] border border-[#dde3ec] rounded-lg p-6 group transition-all hover:border-[#234d78]/30 shadow-sm overflow-visible">
            <Button 
              type="button"
              variant="destructive" 
              size="icon" 
              className="absolute -top-3 -right-3 rounded-full h-8 w-8 bg-white border border-[#dde3ec] text-[#7a8ba0] hover:text-red-500 hover:border-red-500 hover:bg-white shadow-md flex items-center justify-center transition-all md:opacity-0 md:group-hover:opacity-100" 
              onClick={() => removeBank(idx)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            
            <CardContent className="p-0 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">Bank Name <span className="text-[#c9962a] ml-1">*</span></Label>
                <Input 
                  value={b.bank_name} 
                  onChange={e => updateBank(idx, 'bank_name', e.target.value)} 
                  className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
                />
                {errors[`bank_${idx}_name`] && <p className="text-xs text-red-500 mt-1">{errors[`bank_${idx}_name`]}</p>}
              </div>

              <div>
                <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">Account Number <span className="text-[#c9962a] ml-1">*</span></Label>
                <Input 
                  value={b.account_number} 
                  onChange={e => updateBank(idx, 'account_number', e.target.value)} 
                  className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
                />
                {errors[`bank_${idx}_acc`] && <p className="text-xs text-red-500 mt-1">{errors[`bank_${idx}_acc`]}</p>}
              </div>

              <div>
                <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">IFSC Code <span className="text-[#c9962a] ml-1">*</span></Label>
                <Input 
                  value={b.ifsc_code} 
                  onChange={e => updateBank(idx, 'ifsc_code', e.target.value)} 
                  className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
                />
                {errors[`bank_${idx}_ifsc`] && <p className="text-xs text-red-500 mt-1">{errors[`bank_${idx}_ifsc`]}</p>}
              </div>

              <div>
                <Label className="text-xs font-medium text-[#445069] mb-1.5">Holder First Name</Label>
                <Input 
                  value={b.acc_holder_fname} 
                  onChange={e => updateBank(idx, 'acc_holder_fname', e.target.value)} 
                  className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-[#445069] mb-1.5">Holder Middle Name</Label>
                <Input 
                  value={b.acc_holder_mname} 
                  onChange={e => updateBank(idx, 'acc_holder_mname', e.target.value)} 
                  placeholder="Optional"
                  className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all placeholder:text-[#7a8ba0]"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-[#445069] mb-1.5">Holder Last Name</Label>
                <Input 
                  value={b.acc_holder_lname} 
                  onChange={e => updateBank(idx, 'acc_holder_lname', e.target.value)} 
                  className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-[#445069] mb-1.5">Branch</Label>
                <Input 
                  value={b.branch_name} 
                  onChange={e => updateBank(idx, 'branch_name', e.target.value)} 
                  className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
                />
              </div>

              <div className="col-span-1 md:col-span-3 flex items-center gap-3 mt-3 bg-white p-3 rounded-lg border border-[#dde3ec]/60">
                <Switch 
                  checked={b.is_primary} 
                  onCheckedChange={v => updateBank(idx, 'is_primary', v)} 
                />
                <Label className="text-xs font-semibold text-[#445069] cursor-pointer">Primary Salary Account</Label>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {bankDetails.length === 0 && (
        <div className="text-center p-8 border border-dashed border-[#dde3ec] rounded-lg text-[#7a8ba0] bg-[#f4f7fb]/30 font-medium">
          No bank accounts added yet. Please add at least one.
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8">
      <div className="max-w-6xl mx-auto pb-12">

        {/* Page Title Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-[#eff6ff] rounded-lg text-[#2563eb] shadow-sm"><UserPlus className="h-6 w-6" /></div>
          <div>
            <h1 className="text-2xl font-bold text-[#0f2744]">Add New Employee</h1>
            <p className="text-sm text-[#7a8ba0] mt-0.5">{company?.company_name || "EmpSync AI Client"}</p>
          </div>
        </div>

        {/* Stepper progress tracker */}
        <div className="bg-white rounded-xl shadow-[0_2px_16px_rgba(15,39,68,0.08)] p-6 mb-8 border border-[#dde3ec]">
          <div className="flex items-center justify-between relative px-4">
            {/* Connecting Line Background */}
            <div className="absolute left-[5%] right-[5%] top-1/2 -translate-y-1/2 h-[3px] bg-[#dde3ec] z-0 rounded-full"></div>
            {/* Connecting Line Progress */}
            <div 
              className="absolute left-[5%] top-1/2 -translate-y-1/2 h-[3px] bg-[#0f2744] z-0 rounded-full transition-all duration-500" 
              style={{ width: `${(currentStep / (steps.length - 1)) * 90}%` }}
            ></div>
            
            {steps.map((label, idx) => (
              <div 
                key={idx} 
                className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer w-24" 
                onClick={() => { if (idx < currentStep) setCurrentStep(idx); }}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  idx === currentStep 
                    ? 'bg-[#eff6ff] border-2 border-[#0f2744] text-[#0f2744] shadow-[0_0_0_4px_rgba(239,246,255,1)] scale-105' 
                    : idx < currentStep 
                      ? 'bg-[#0f2744] text-white' 
                      : 'bg-[#f4f7fb] text-[#7a8ba0] border-2 border-transparent'
                }`}>
                  {idx < currentStep ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                <span className={`text-[11px] font-semibold text-center whitespace-nowrap hidden sm:block ${idx === currentStep ? 'text-[#0f2744]' : 'text-[#7a8ba0]'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Main form Card */}
        <Card className="border border-[#dde3ec] shadow-[0_2px_16px_rgba(15,39,68,0.08)] bg-white rounded-xl overflow-hidden">
          <div className="px-8 py-5 border-b border-[#dde3ec] bg-white flex items-center">
            <div className="w-1 h-5 bg-[#e8b84b] rounded-r-sm mr-3"></div>
            <h3 className="text-lg font-bold text-[#0f2744] tracking-tight font-serif">
              {steps[currentStep]}
            </h3>
          </div>

          <CardContent className="p-8 min-h-[400px]">
             {message && (
               <div className={`p-4 rounded-lg mb-6 flex items-center gap-2 text-sm ${
                 message.includes("successfully") 
                   ? "bg-green-50 text-green-700 border border-green-200" 
                   : "bg-red-50 text-red-700 border border-red-200"
               }`}>
                 {message}
               </div>
             )}
             {currentStep === 0 && renderStep0()}
             {currentStep === 1 && renderStep1()}
             {currentStep === 2 && renderStep2()}
             {currentStep === 3 && renderStep3()}
             {currentStep === 4 && renderStep4()}
             {currentStep === 5 && renderStep5()}
          </CardContent>

          <CardFooter className="bg-[#f4f7fb] border-t border-[#dde3ec] px-8 py-4 flex justify-between items-center">
            <Button 
              type="button"
              variant="outline" 
              onClick={handlePrev} 
              disabled={currentStep === 0 || loading} 
              className="w-32 gap-2 border-[#dde3ec] text-[#445069] bg-white hover:bg-[#f4f7fb]"
            >
              <ArrowLeft className="w-4 h-4"/> Back
            </Button>
            {currentStep < steps.length - 1 ? (
               <Button 
                 type="button"
                 onClick={handleNext} 
                 className="w-32 gap-2 bg-[#0f2744] hover:bg-[#1a3a5c] text-white shadow-sm"
               >
                 Next <ArrowRight className="w-4 h-4"/>
               </Button>
            ) : (
               <Button 
                 type="button"
                 onClick={handleSubmit} 
                 disabled={loading} 
                 className="w-40 gap-2 bg-[#1a7f5a] hover:bg-[#146648] text-white shadow-lg shadow-green-600/10"
               >
                 {loading ? (
                   <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                 ) : (
                   <Save className="w-4 h-4"/>
                 )}
                 Submit
               </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
