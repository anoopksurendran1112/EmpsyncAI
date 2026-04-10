//frontend/src/app/dashboard/settings/add_employees/page.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { UserPlus, Save, Upload, X, Camera, User, UserMinus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// Type definitions for dropdowns
interface Role {
  id: number;
  role: string;
  name?: string;
}

interface Religion {
  id: number;
  name: string;
}

interface Caste {
  id: number;
  name: string;
}

interface StaffType {
  id: number;
  type_name?: string;
  name?: string;
}

interface StaffCategory {
  id: number;
  category_name?: string;
  name?: string;
}

export default function AddEmployeePage() {
  const { company } = useAuth();
  const companyId = company?.id || "";
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dropdown states
  const [roles, setRoles] = useState<Role[]>([]);
  const [religions, setReligions] = useState<Religion[]>([]);
  const [castes, setCastes] = useState<Caste[]>([]);
  const [staffTypes, setStaffTypes] = useState<StaffType[]>([]);
  const [staffCategories, setStaffCategories] = useState<StaffCategory[]>([]);
  const [groups, setGroups] = useState<{ id: number; group: string }[]>([]);

  // Basic employee fields
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    mobile: "",
    gender: "",
    role_id: "",
    group_id: "",
    company_id: companyId,
    password: "empsyncai123@",
    biometric_id: "",
    is_whatsapp: true,
    is_sms: true,
    is_wfh: true,
    is_active: true,
  });

  // Extended profile fields
  const [profileData, setProfileData] = useState({
    dob: "",
    guardian_name: "",
    guardian_phone: "",
    religion_id: "",
    caste_id: "",
    staff_type_id: "",
    staff_category_id: "",
    ktu_id: "",
    aicte_id: "",
    pan_no: "",
    aadhar_no: "",
    blood_group: "",
    alternate_mobile: "",
    alternate_email: "",
    present_address: {
      address_line_1: "",
      address_line_2: "",
      city: "",
      district: "",
      state: "",
      country: "",
      pincode: "",
    },
    permanent_address: {
      address_line_1: "",
      address_line_2: "",
      city: "",
      district: "",
      state: "",
      country: "",
      pincode: "",
    },
  });

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ---------- Generic fetch function that handles various response shapes ----------
  const fetchData = async (url: string, setter: (data: any[]) => void, label: string) => {
    try {
      const res = await fetch(url);
      const text = await res.text();
      console.log(`${label} raw response:`, text);
      let json;
      try { json = JSON.parse(text); } catch { json = []; }
      
      let arr: any[] = [];
      if (Array.isArray(json)) {
        arr = json;
      } else if (json && typeof json === 'object') {
        // Common wrapper keys
        const possibleKeys = ['data', 'results', 'items', 'staff_types', 'categories', 'types', 'list'];
        for (const key of possibleKeys) {
          if (json[key] && Array.isArray(json[key])) {
            arr = json[key];
            break;
          }
        }
        // If still empty, take the first array property found
        if (arr.length === 0) {
          for (const key in json) {
            if (Array.isArray(json[key])) {
              arr = json[key];
              console.log(`${label} found array under key: ${key}`);
              break;
            }
          }
        }
      }
      console.log(`${label} extracted array:`, arr);
      setter(arr);
    } catch (err) {
      console.error(`${label} error:`, err);
      setter([]);
    }
  };

  // ---------- Fetch roles ----------
  useEffect(() => {
    if (!companyId) return;
    fetchData(`/api/settings/roles/${companyId}`, setRoles, "Roles");
  }, [companyId]);

  // ---------- Fetch staff types & categories ----------
  useEffect(() => {
    if (!companyId) return;
    fetchData(`/api/settings/staff_type/${companyId}`, setStaffTypes, "StaffTypes");
    fetchData(`/api/settings/staff_category/${companyId}`, setStaffCategories, "StaffCategories");
    fetchData(`/api/settings/groups/${companyId}`, setGroups, "Groups");
  }, [companyId]);

  // ---------- Fetch religions ----------
  useEffect(() => {
    fetchData(`/api/settings/manage-religion/`, setReligions, "Religions");
  }, []);

  // ---------- Fetch castes when religion changes ----------
  useEffect(() => {
    if (!profileData.religion_id) {
      setCastes([]);
      return;
    }
    fetchData(`/api/settings/manage-caste/?religion_id=${profileData.religion_id}`, setCastes, "Castes");
  }, [profileData.religion_id]);

  // Sync company_id when it changes
  useEffect(() => {
    if (companyId) {
      setFormData(prev => ({ ...prev, company_id: companyId }));
    }
  }, [companyId]);

  // ---------- Validation ----------
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.first_name.trim()) newErrors.first_name = "First name is required";
    if (!formData.last_name.trim()) newErrors.last_name = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Please enter a valid email";
    if (!formData.mobile.trim()) newErrors.mobile = "Mobile number is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.role_id) newErrors.role_id = "Role is required";
    if (!formData.biometric_id.trim()) newErrors.biometric_id = "Biometric ID is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
  };

  const handleAddressChange = (type: "present_address" | "permanent_address", field: string, value: string) => {
    setProfileData({
      ...profileData,
      [type]: { ...profileData[type], [field]: value },
    });
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData({ ...formData, [name]: checked });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setMessage("Please select a valid image file (JPEG, PNG, GIF, WebP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image size should be less than 5MB");
      return;
    }
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

  const triggerFileInput = () => fileInputRef.current?.click();

  // ---------- Main submit: employee creation + profile creation ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setMessage("Please fix the errors above");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      //  Create employee (FormData with image)
      const fd = new FormData();
      Object.entries(formData).forEach(([key, value]) => fd.append(key, value.toString()));
      if (profileImage) fd.append('prof_img', profileImage);

      const empRes = await fetch("/api/employees/add_employees", { method: "POST", body: fd });
      const empData = await empRes.json();

      if (!empRes.ok) {
        let errorMsg = empData.message || empData.details || "Failed to add employee";
        if (typeof errorMsg === 'object') errorMsg = JSON.stringify(errorMsg);
        throw new Error(errorMsg);
      }

      // Extract employee ID (Django signup returns { data: { user: { id } } })
      let employeeId = empData?.data?.user?.id || empData?.data?.id || empData?.user?.id || empData?.id;
      if (!employeeId) {
        console.error("No employee ID in response:", empData);
        throw new Error("Employee created but ID not returned. Cannot create profile.");
      }

      console.log("Employee created with ID:", employeeId);

      //  Prepare profile payload (convert IDs to numbers, ensure strings)
      const profilePayload = {
        employee_id: Number(employeeId),
        dob: profileData.dob || null,
        guardian_name: profileData.guardian_name || "",
        guardian_phone: profileData.guardian_phone || "",
        religion: profileData.religion_id ? Number(profileData.religion_id) : null,
        caste: profileData.caste_id ? Number(profileData.caste_id) : null,
        staff_type: profileData.staff_type_id ? Number(profileData.staff_type_id) : null,
        staff_category: profileData.staff_category_id ? Number(profileData.staff_category_id) : null,
        ktu_id: profileData.ktu_id || "",
        aicte_id: profileData.aicte_id || "",
        pan_no: profileData.pan_no || "",
        aadhar_no: profileData.aadhar_no || "",
        blood_group: profileData.blood_group || "",
        alternate_mobile: profileData.alternate_mobile || "",
        alternate_email: profileData.alternate_email || "",
        present_address: {
          address_line_1: profileData.present_address.address_line_1 || "",
          address_line_2: profileData.present_address.address_line_2 || "",
          city: profileData.present_address.city || "",
          district: profileData.present_address.district || "",
          state: profileData.present_address.state || "",
          country: profileData.present_address.country || "",
          pincode: profileData.present_address.pincode || "",
        },
        permanent_address: {
          address_line_1: profileData.permanent_address.address_line_1 || "",
          address_line_2: profileData.permanent_address.address_line_2 || "",
          city: profileData.permanent_address.city || "",
          district: profileData.permanent_address.district || "",
          state: profileData.permanent_address.state || "",
          country: profileData.permanent_address.country || "",
          pincode: profileData.permanent_address.pincode || "",
        },
      };

      console.log("Sending profile payload:", profilePayload);

      // Create employee profile
      const profileRes = await fetch("/api/employee-profile/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profilePayload),
      });

      const profileResponseText = await profileRes.text();
      let profileDataResponse;
      try {
        profileDataResponse = JSON.parse(profileResponseText);
      } catch {
        profileDataResponse = { raw: profileResponseText };
      }

      if (!profileRes.ok) {
        console.error("Profile creation failed:", profileDataResponse);
        let errorDetail = "Failed to create employee profile: ";
        if (profileDataResponse.message) errorDetail += profileDataResponse.message;
        else if (profileDataResponse.error) errorDetail += profileDataResponse.error;
        else if (profileDataResponse.details) errorDetail += JSON.stringify(profileDataResponse.details);
        else if (profileDataResponse.errors) errorDetail += JSON.stringify(profileDataResponse.errors);
        else errorDetail += profileResponseText;
        throw new Error(errorDetail);
      }

      setMessage("Employee and profile created successfully!");
      queryClient.invalidateQueries({ queryKey: ["employees", companyId] });
      queryClient.invalidateQueries({ queryKey: ["roles", companyId] });

      // Reset forms
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        mobile: "",
        gender: "",
        role_id: "",
        group_id: "",
        company_id: companyId,
        password: "empsyncai123@",
        biometric_id: "",
        is_whatsapp: true,
        is_sms: true,
        is_wfh: true,
        is_active: true,
      });
      setProfileData({
        dob: "",
        guardian_name: "",
        guardian_phone: "",
        religion_id: "",
        caste_id: "",
        staff_type_id: "",
        staff_category_id: "",
        ktu_id: "",
        aicte_id: "",
        pan_no: "",
        aadhar_no: "",
        blood_group: "",
        alternate_mobile: "",
        alternate_email: "",
        present_address: {
          address_line_1: "",
          address_line_2: "",
          city: "",
          district: "",
          state: "",
          country: "",
          pincode: "",
        },
        permanent_address: {
          address_line_1: "",
          address_line_2: "",
          city: "",
          district: "",
          state: "",
          country: "",
          pincode: "",
        },
      });
      removeImage();
      setErrors({});
    } catch (error: any) {
      console.error("Error:", error);
      setMessage(error.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Helper to get display name for staff type (prefer type_name, fallback to name)
  const getStaffTypeName = (item: StaffType) => item.type_name || item.name || "";
  const getStaffCategoryName = (item: StaffCategory) => item.category_name || item.name || "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex items-center gap-3">
          <UserPlus className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Add Employee ({company?.company_name || "No Company Selected"})</h1>
        </div>

        <Separator />

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              {message && (
                <div className={`p-3 rounded-md ${message.includes("successfully") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {message}
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Profile Image Upload */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div
                    className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 overflow-hidden bg-gray-50 dark:bg-gray-800"
                    onClick={triggerFileInput}
                  >
                    {imagePreview ? (
                      <div className="relative w-full h-full group">
                        <img src={imagePreview} alt="Profile preview" className="w-full h-full rounded-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full flex items-center justify-center">
                          <Camera className="h-6 w-6 text-white" />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage();
                          }}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-4">
                        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full mb-2">
                          <Upload className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload Photo</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">(Optional)</p>
                      </div>
                    )}
                  </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Supported: JPG, PNG, GIF, WebP</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Max size: 5MB</p>
                </div>
              </div>

              <Separator />

              {/* Basic Info */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input name="first_name" value={formData.first_name} onChange={handleChange} placeholder="First Name *" />
                    {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
                  </div>
                  <div>
                    <Input name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Last Name *" />
                    {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
                  </div>
                  <div>
                    <Input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email *" />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Input name="mobile" value={formData.mobile} onChange={handleChange} placeholder="Mobile *" />
                    {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
                  </div>
                  <div>
                    <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-2.5 border rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Select Gender *</option>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="O">Other</option>
                    </select>
                    {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                  </div>
                  <div>
                    <Input name="biometric_id" value={formData.biometric_id} onChange={handleChange} placeholder="Biometric ID *" />
                    {errors.biometric_id && <p className="text-red-500 text-xs mt-1">{errors.biometric_id}</p>}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Role *</label>
                    <select name="role_id" value={formData.role_id} onChange={handleChange} className="w-full p-2.5 border rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Select Role</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.role || role.name}</option>
                      ))}
                    </select>
                    {errors.role_id && <p className="text-red-500 text-xs mt-1">{errors.role_id}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Group</label>
                    <select name="group_id" value={formData.group_id} onChange={handleChange} className="w-full p-2.5 border rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Select Group</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>{group.group}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Separator />

                {/* Extended Profile Fields */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">Additional Profile Information (Optional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input type="date" name="dob" value={profileData.dob} onChange={handleProfileChange} placeholder="Date of Birth" />
                    <Input name="guardian_name" value={profileData.guardian_name} onChange={handleProfileChange} placeholder="Guardian Name" />
                    <Input name="guardian_phone" value={profileData.guardian_phone} onChange={handleProfileChange} placeholder="Guardian Phone" />
                    <select
                          name="blood_group"
                          value={profileData.blood_group}
                          onChange={handleProfileChange}
                          className="w-full p-2.5 border rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
>
                          <option value="">Select Blood Group</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          </select>
                    <Input name="alternate_mobile" value={profileData.alternate_mobile} onChange={handleProfileChange} placeholder="Alternate Mobile" />
                    <Input name="alternate_email" value={profileData.alternate_email} onChange={handleProfileChange} placeholder="Alternate Email" />
                    <Input name="pan_no" value={profileData.pan_no} onChange={handleProfileChange} placeholder="PAN Number" />
                    <Input name="aadhar_no" value={profileData.aadhar_no} onChange={handleProfileChange} placeholder="Aadhar Number" />
                    <Input name="ktu_id" value={profileData.ktu_id} onChange={handleProfileChange} placeholder="KTU ID" />
                    <Input name="aicte_id" value={profileData.aicte_id} onChange={handleProfileChange} placeholder="AICTE ID" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <select name="religion_id" value={profileData.religion_id} onChange={handleProfileChange} className="w-full p-2.5 border rounded-md">
                      <option value="">Religion</option>
                      {religions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    <select name="caste_id" value={profileData.caste_id} onChange={handleProfileChange} className="w-full p-2.5 border rounded-md" disabled={!profileData.religion_id}>
                      <option value="">Caste</option>
                      {castes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select name="staff_type_id" value={profileData.staff_type_id} onChange={handleProfileChange} className="w-full p-2.5 border rounded-md">
                      <option value="">Staff Type</option>
                      {staffTypes.map(st => <option key={st.id} value={st.id}>{getStaffTypeName(st)}</option>)}
                    </select>
                    <select name="staff_category_id" value={profileData.staff_category_id} onChange={handleProfileChange} className="w-full p-2.5 border rounded-md">
                      <option value="">Staff Category</option>
                      {staffCategories.map(sc => <option key={sc.id} value={sc.id}>{getStaffCategoryName(sc)}</option>)}
                    </select>
                  </div>
                </div>

                {/* Present Address */}
                <div>
                  <h4 className="font-medium mb-2">Present Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input placeholder="Address Line 1" value={profileData.present_address.address_line_1} onChange={e => handleAddressChange("present_address", "address_line_1", e.target.value)} />
                    <Input placeholder="Address Line 2" value={profileData.present_address.address_line_2} onChange={e => handleAddressChange("present_address", "address_line_2", e.target.value)} />
                    <Input placeholder="City" value={profileData.present_address.city} onChange={e => handleAddressChange("present_address", "city", e.target.value)} />
                    <Input placeholder="District" value={profileData.present_address.district} onChange={e => handleAddressChange("present_address", "district", e.target.value)} />
                    <Input placeholder="State" value={profileData.present_address.state} onChange={e => handleAddressChange("present_address", "state", e.target.value)} />
                    <Input placeholder="Country" value={profileData.present_address.country} onChange={e => handleAddressChange("present_address", "country", e.target.value)} />
                    <Input placeholder="Pincode" value={profileData.present_address.pincode} onChange={e => handleAddressChange("present_address", "pincode", e.target.value)} />
                  </div>
                </div>

                {/* Permanent Address */}
                <div>
                  <h4 className="font-medium mb-2">Permanent Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input placeholder="Address Line 1" value={profileData.permanent_address.address_line_1} onChange={e => handleAddressChange("permanent_address", "address_line_1", e.target.value)} />
                    <Input placeholder="Address Line 2" value={profileData.permanent_address.address_line_2} onChange={e => handleAddressChange("permanent_address", "address_line_2", e.target.value)} />
                    <Input placeholder="City" value={profileData.permanent_address.city} onChange={e => handleAddressChange("permanent_address", "city", e.target.value)} />
                    <Input placeholder="District" value={profileData.permanent_address.district} onChange={e => handleAddressChange("permanent_address", "district", e.target.value)} />
                    <Input placeholder="State" value={profileData.permanent_address.state} onChange={e => handleAddressChange("permanent_address", "state", e.target.value)} />
                    <Input placeholder="Country" value={profileData.permanent_address.country} onChange={e => handleAddressChange("permanent_address", "country", e.target.value)} />
                    <Input placeholder="Pincode" value={profileData.permanent_address.pincode} onChange={e => handleAddressChange("permanent_address", "pincode", e.target.value)} />
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${formData.is_active ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                      {formData.is_active ? <User className="h-5 w-5 text-green-600 dark:text-green-400" /> : <UserMinus className="h-5 w-5 text-red-600 dark:text-red-400" />}
                    </div>
                    <div>
                      <Label htmlFor="is_active" className="text-sm font-medium">Employee Status</Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formData.is_active ? "Active employees can log in and use the system" : "Inactive employees cannot log in"}</p>
                    </div>
                  </div>
                  <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => handleSwitchChange('is_active', checked)} className={`${formData.is_active ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}`} />
                </div>

                {/* Notification Preferences */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="flex items-center space-x-2 p-2 rounded border">
                    <input type="checkbox" id="is_whatsapp" checked={formData.is_whatsapp} onChange={(e) => setFormData({...formData, is_whatsapp: e.target.checked})} className="h-4 w-4 text-primary rounded" />
                    <label htmlFor="is_whatsapp" className="text-sm">WhatsApp Notifications</label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 rounded border">
                    <input type="checkbox" id="is_sms" checked={formData.is_sms} onChange={(e) => setFormData({...formData, is_sms: e.target.checked})} className="h-4 w-4 text-primary rounded" />
                    <label htmlFor="is_sms" className="text-sm">SMS Notifications</label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 rounded border">
                    <input type="checkbox" id="is_wfh" checked={formData.is_wfh} onChange={(e) => setFormData({...formData, is_wfh: e.target.checked})} className="h-4 w-4 text-primary rounded" />
                    <label htmlFor="is_wfh" className="text-sm">Work From Home</label>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSubmit} disabled={loading || !companyId} className="gap-2 min-w-[180px]" size="lg">
                    {loading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        Add Employee
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
