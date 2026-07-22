"use client";

import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { UserPlus, Save, Upload, X, Plus, Trash2, ArrowRight, ArrowLeft, Check } from "lucide-react";
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
    biometric_id: "", is_whatsapp: false, is_sms: false, is_wfh: false, is_active: true,
    team_lead: false,
  });

  // Extended profile fields
  const [profileData, setProfileData] = useState({
    dob: "", guardian_name: "", guardian_phone: "", religion_id: "", caste_id: "",
    staff_type_id: "", staff_category_id: "", ktu_id: "", aicte_id: "", pan_no: "",
    aadhar_no: "", blood_group: "", alternate_mobile: "", alternate_email: "",
    staff_id: "", date_of_joining: "", date_of_contract_completion: "", date_of_relieving: "",
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

  // Draft States & Functions
  const [hasDraft, setHasDraft] = useState(false);
  const [draftPayload, setDraftPayload] = useState<any>(null);

  useEffect(() => {
    const checkDraft = async () => {
      if (!companyId) return;
      try {
        const res = await fetch(`/api/employee-draft/?company_id=${companyId}`);
        const data = await res.json();
        if (res.ok && data.success && data.data) {
          setHasDraft(true);
          setDraftPayload(data.data);
        } else {
          setHasDraft(false);
          setDraftPayload(null);
        }
      } catch (err) {
        console.error("Error checking draft:", err);
      }
    };
    checkDraft();
  }, [companyId]);

  const saveDraft = async (stepIndex: number, showSuccessMessage = false) => {
    if (!companyId) return;
    try {
      const draftData = {
        formData,
        profileData,
        bankDetails,
        qualifications: qualifications.map(({ certificate, ...rest }) => ({ ...rest, certificate: null })),
        experiences: experiences.map(({ experience_letter, ...rest }) => ({ ...rest, experience_letter: null })),
        prof_img_base64: imagePreview,
      };

      const payload = {
        company_id: Number(companyId),
        last_step: stepIndex,
        draft_data: draftData,
      };

      const res = await fetch("/api/employee-draft/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save draft");
      if (showSuccessMessage) {
        setMessage("Draft saved successfully!");
      }
    } catch (err: any) {
      console.error("Error saving draft:", err);
      if (showSuccessMessage) {
        setMessage(err.message || "Error saving draft");
      }
    }
  };

  const resumeDraft = () => {
    if (!draftPayload) return;
    const { last_step, draft_data } = draftPayload;
    if (draft_data) {
      if (draft_data.formData) {
        setFormData({
          ...formData,
          ...draft_data.formData,
          company_id: companyId
        });
      }
      if (draft_data.profileData) setProfileData(draft_data.profileData);
      if (draft_data.bankDetails) setBankDetails(draft_data.bankDetails);
      if (draft_data.qualifications) setQualifications(draft_data.qualifications);
      if (draft_data.experiences) setExperiences(draft_data.experiences);
      if (draft_data.prof_img_base64) {
        setImagePreview(draft_data.prof_img_base64);
      }
    }
    setCurrentStep(last_step);
    setHasDraft(false);
    setMessage("Draft loaded successfully.");
  };

  const discardDraft = async () => {
    if (!companyId) return;
    try {
      const res = await fetch(`/api/employee-draft/?company_id=${companyId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setHasDraft(false);
        setDraftPayload(null);
        setMessage("Draft discarded.");
      }
    } catch (err) {
      console.error("Error discarding draft:", err);
    }
  };

  // ---------- Generic fetch function ----------
  const fetchData = async (url: string, setter: (data: any[]) => void) => {
    try {
      const res = await fetch(url);
      const text = await res.text();
      let json;
      try { json = JSON.parse(text); } catch { json = []; }

      let arr: any[] = [];
      if (Array.isArray(json)) arr = json;
      else if (json && typeof json === 'object') {
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
    fetchData(`/api/settings/roles/${companyId}`, setRoles);
    fetchData(`/api/settings/staff_type/${companyId}`, setStaffTypes);
    fetchData(`/api/settings/staff_category/${companyId}`, setStaffCategories);
    fetchData(`/api/settings/groups/${companyId}`, setGroups);
  }, [companyId]);

  useEffect(() => { fetchData(`/api/settings/manage-religion/`, setReligions); }, []);

  useEffect(() => {
    if (!profileData.religion_id) { setCastes([]); return; }
    fetchData(`/api/settings/manage-caste/?religion_id=${profileData.religion_id}`, setCastes);
  }, [profileData.religion_id]);

  useEffect(() => {
    if (companyId) setFormData(prev => ({ ...prev, company_id: companyId }));
  }, [companyId]);

  // ---------- Dynamic Array Helpers ----------
  const addBank = () => setBankDetails([...bankDetails, { acc_holder_name: "", bank_name: "", account_number: "", ifsc_code: "", branch_name: "", is_primary: false }]);
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

  const addExp = () => setExperiences([...experiences, { company_name: "", location: "", is_internal: false, start_year: "", end_year: "", description: "", experience_letter: null, designations: [] }]);
  const removeExp = (idx: number) => setExperiences(experiences.filter((_, i) => i !== idx));
  const updateExp = (idx: number, field: string, val: any) => {
    const updated = [...experiences];
    updated[idx][field] = val;
    setExperiences(updated);
  };

  const handleQualFileChange = (idx: number, file: File | null) => {
    if (!file) {
      updateQual(idx, 'certificate', null);
      updateQual(idx, 'certificate_base64', null);
      updateQual(idx, 'certificate_name', null);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setQualifications(prev => {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          certificate: file,
          certificate_base64: reader.result as string,
          certificate_name: file.name
        };
        return updated;
      });
    };
    reader.readAsDataURL(file);
  };

  const handleExpFileChange = (idx: number, file: File | null) => {
    if (!file) {
      updateExp(idx, 'experience_letter', null);
      updateExp(idx, 'experience_letter_base64', null);
      updateExp(idx, 'experience_letter_name', null);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setExperiences(prev => {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          experience_letter: file,
          experience_letter_base64: reader.result as string,
          experience_letter_name: file.name
        };
        return updated;
      });
    };
    reader.readAsDataURL(file);
  };

  const addDesig = (expIdx: number) => {
    const updated = [...experiences];
    updated[expIdx].designations.push({ designation: "", company_role_id: "", company_group_id: "", start_date: "", end_date: "", change_type: "Joined", description: "" });
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

    const allowedTypes = ["image/jpeg", "image/png"];

    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        photo: "Only JPG and PNG files are allowed",
      }));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        photo: "Image size must not exceed 2 MB",
      }));
      return;
    }

    // Clear photo error
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.photo;
      return newErrors;
    });

    setProfileImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setProfileImage(null);
    setImagePreview(null);

    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.photo;
      return newErrors;
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ---------- Validation (step-by-step) ----------
  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      const firstName = formData.first_name.trim();
      if (!firstName) {
        newErrors.first_name = "First Name is required";
      } else if (!/^[A-Za-z ]+$/.test(firstName)) {
        newErrors.first_name = "Only alphabets are allowed";
      } else if (firstName.length < 2) {
        newErrors.first_name = "First Name must contain at least 2 characters";
      } else if (firstName.length > 50) {
        newErrors.first_name = "First Name cannot exceed 50 characters";
      }


      const lastName = formData.last_name.trim();
      if (!lastName) {
        newErrors.last_name = "Last Name is required";
      } else if (!/^[A-Za-z ]+$/.test(lastName)) {
        newErrors.last_name = "Last Name can contain only alphabets and spaces";
      } else if (lastName.length < 1) {
        newErrors.last_name = "Last Name must be at least 1 character";
      } else if (lastName.length > 50) {
        newErrors.last_name = "Last Name cannot exceed 50 characters";
      }

      const email = formData.email.trim();
      if (!email) {
        newErrors.email = "Email is required";
      } else if (email.includes(" ")) {
        newErrors.email = "Email cannot contain spaces";
      } else if (email.length > 254) {
        newErrors.email = "Email cannot exceed 254 characters";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = "Enter a valid email address";
      }

      const mobile = formData.mobile.trim();
      if (!mobile) {
        newErrors.mobile = "Mobile Number is required";
      } else if (!/^\d+$/.test(mobile)) {
        newErrors.mobile = "Mobile Number must contain only digits";
      } else if (mobile.startsWith("0")) {
        newErrors.mobile = "Mobile Number cannot start with 0";
      } else if (mobile.length !== 10) {
        newErrors.mobile = "Mobile Number must be exactly 10 digits";
      }

      const alternateEmail = profileData.alternate_email.trim();
      if (alternateEmail) {

        if (alternateEmail.includes(" ")) {
          newErrors.alternate_email =
            "Alternate Email cannot contain spaces";

        } else if (alternateEmail.length > 254) {
          newErrors.alternate_email =
            "Alternate Email cannot exceed 254 characters";

        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(alternateEmail)) {
          newErrors.alternate_email =
            "Enter a valid alternate email address";

        } else if (
          alternateEmail.toLowerCase() === email.toLowerCase()
        ) {
          newErrors.alternate_email =
            "Alternate Email cannot be the same as Primary Email";
        }
      }

      const alternateMobile = profileData.alternate_mobile.trim();
      if (alternateMobile) {

        if (!/^\d+$/.test(alternateMobile)) {
          newErrors.alternate_mobile =
            "Alternate Mobile Number must contain only digits";

        } else if (alternateMobile.startsWith("0")) {
          newErrors.alternate_mobile =
            "Alternate Mobile Number cannot start with 0";

        } else if (alternateMobile.length !== 10) {
          newErrors.alternate_mobile =
            "Alternate Mobile Number must be exactly 10 digits";

        } else if (alternateMobile === mobile) {
          newErrors.alternate_mobile =
            "Alternate Mobile Number cannot be the same as Primary Mobile Number";
        }

      }

      if (!profileData.dob) {
        newErrors.dob = "Date of Birth is required";
      } else {

        const dob = new Date(profileData.dob);
        const today = new Date();

        if (dob > today) {
          newErrors.dob = "Date of Birth cannot be a future date";
        } else {

          let age = today.getFullYear() - dob.getFullYear();

          const monthDiff = today.getMonth() - dob.getMonth();

          if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < dob.getDate())
          ) {
            age--;
          }

          if (age < 18) {
            newErrors.dob = "Employee must be at least 18 years old";
          }

        }
      }
      if (!formData.gender) {
        newErrors.gender = "Please select Gender";
      }

      // Profile Photo Validation
      if (!profileImage && !imagePreview) {
        newErrors.photo = "Profile Photo is required";
      }

    }


    else if (step === 1) {
      if (!formData.role_id) newErrors.role_id = "Required";
      if (!formData.biometric_id.trim()) newErrors.biometric_id = "Required";
      if (!profileData.staff_id?.trim()) newErrors.staff_id = "Required";
      if (!profileData.staff_type_id) newErrors.staff_type_id = "Required";
      if (!profileData.staff_category_id) newErrors.staff_category_id = "Required";
    }


    else if (step === 2) {


      if (!profileData.present_address.address_line_1?.trim()) {
        newErrors.present_addr_1 = "Required";
      }
      else if (profileData.present_address.address_line_1.trim().length < 3) {
        newErrors.present_addr_1 = "Minimum 3 characters required";
      }

      if (
        profileData.present_address.address_line_2 &&
        !profileData.present_address.address_line_2.trim()
      ) {
        newErrors.present_addr_2 = "Address Line 2 cannot contain only spaces";
      }

      if (!profileData.present_address.city?.trim()) {
        newErrors.present_city = "Required";
      } else if (!/^[A-Za-z\s]+$/.test(profileData.present_address.city.trim())) {
        newErrors.present_city = "Only alphabets and spaces are allowed";
      }

      if (!profileData.present_address.district?.trim()) {
        newErrors.present_district = "Required";
      } else if (!/^[A-Za-z\s]+$/.test(profileData.present_address.district.trim())) {
        newErrors.present_district = "Only alphabets and spaces are allowed";
      }

      if (!profileData.present_address.state?.trim()) {
        newErrors.present_state = "Required";
      } else if (!/^[A-Za-z\s]+$/.test(profileData.present_address.state.trim())) {
        newErrors.present_state = "Only alphabets and spaces are allowed";
      }

      if (!profileData.present_address.country?.trim()) {
        newErrors.present_country = "Required";
      } else if (!/^[A-Za-z\s]+$/.test(profileData.present_address.country.trim())) {
        newErrors.present_country = "Only alphabets and spaces are allowed";
      }

      if (!profileData.present_address.pincode?.trim()) {
        newErrors.present_pincode = "Required";
      } else if (!/^\d+$/.test(profileData.present_address.pincode.trim())) {
        newErrors.present_pincode = "Only digits are allowed";
      } else if (profileData.present_address.pincode.trim().length !== 6) {
        newErrors.present_pincode = "Pincode must be exactly 6 digits";
      }

      // Permanent Address

      if (!profileData.permanent_address.address_line_1?.trim()) {
        newErrors.permanent_addr_1 = "Required";
      }
      else if (profileData.present_address.address_line_1.trim().length < 3) {
        newErrors.present_addr_1 = "Minimum 3 characters required";
      }

      if (
        profileData.permanent_address.address_line_2 &&
        !profileData.permanent_address.address_line_2.trim()
      ) {
        newErrors.permanent_addr_2 =
          "Address Line 2 cannot contain only spaces";
      }

      if (!profileData.permanent_address.city?.trim()) {
        newErrors.permanent_city = "Required";
      } else if (
        !/^[A-Za-z\s]+$/.test(profileData.permanent_address.city.trim())
      ) {
        newErrors.permanent_city =
          "Only alphabets and spaces are allowed";
      }

      if (!profileData.permanent_address.district?.trim()) {
        newErrors.permanent_district = "Required";
      } else if (
        !/^[A-Za-z\s]+$/.test(profileData.permanent_address.district.trim())
      ) {
        newErrors.permanent_district =
          "Only alphabets and spaces are allowed";
      }

      if (!profileData.permanent_address.state?.trim()) {
        newErrors.permanent_state = "Required";
      } else if (
        !/^[A-Za-z\s]+$/.test(profileData.permanent_address.state.trim())
      ) {
        newErrors.permanent_state =
          "Only alphabets and spaces are allowed";
      }

      if (!profileData.permanent_address.country?.trim()) {
        newErrors.permanent_country = "Required";
      } else if (
        !/^[A-Za-z\s]+$/.test(profileData.permanent_address.country.trim())
      ) {
        newErrors.permanent_country =
          "Only alphabets and spaces are allowed";
      }

      if (!profileData.permanent_address.pincode?.trim()) {
        newErrors.permanent_pincode = "Required";
      } else if (
        !/^\d+$/.test(profileData.permanent_address.pincode.trim())
      ) {
        newErrors.permanent_pincode = "Only digits are allowed";
      } else if (
        profileData.permanent_address.pincode.trim().length !== 6
      ) {
        newErrors.permanent_pincode =
          "Pincode must be exactly 6 digits";
      }

    }

    else if (step === 3) {
      if (qualifications.length === 0) {
        newErrors.general = "At least one qualification is required.";
      }

      qualifications.forEach((q, i) => {
        // Academic Level
        if (!q.qualification_level || q.qualification_level === "Select Level") {
          newErrors[`qual_${i}_level`] = "Required";
        }

        // Specialization
        if (!q.specialization?.trim()) {
          newErrors[`qual_${i}_specialization`] = "Required";
        } else if (!/^[A-Za-z\s,&()-]+$/.test(q.specialization.trim())) {
          newErrors[`qual_${i}_specialization`] = "Numbers are not allowed";
        } else if (q.specialization.trim().length < 3) {
          newErrors[`qual_${i}_specialization`] = "Minimum 3 characters required";
        } else if (q.specialization.trim().length > 100) {
          newErrors[`qual_${i}_specialization`] = "Maximum 100 characters allowed";
        }

        // Institution
        if (!q.institution_name?.trim()) {
          newErrors[`qual_${i}_inst`] = "Required";
        } else if (!/^[A-Za-z\s,&()-]+$/.test(q.institution_name.trim())) {
          newErrors[`qual_${i}_inst`] = "Numbers are not allowed";
        } else if (q.institution_name.trim().length < 3) {
          newErrors[`qual_${i}_inst`] = "Minimum 3 characters required";
        } else if (q.institution_name.trim().length > 100) {
          newErrors[`qual_${i}_inst`] = "Maximum 100 characters allowed";
        }

        // University / Board
        if (!q.university?.trim()) {
          newErrors[`qual_${i}_university`] = "Required";
        } else if (!/^[A-Za-z\s,&()-]+$/.test(q.university.trim())) {
          newErrors[`qual_${i}_university`] = "Numbers are not allowed";
        } else if (q.university.trim().length < 3) {
          newErrors[`qual_${i}_university`] = "Minimum 3 characters required";
        } else if (q.university.trim().length > 100) {
          newErrors[`qual_${i}_university`] = "Maximum 100 characters allowed";
        }

        // Location
        if (!q.location?.trim()) {
          newErrors[`qual_${i}_location`] = "Required";
        } else if (!/^[A-Za-z\s,-]+$/.test(q.location.trim())) {
          newErrors[`qual_${i}_location`] = "Only letters, spaces, commas and hyphens are allowed";
        } else if (q.location.trim().length < 3) {
          newErrors[`qual_${i}_location`] = "Minimum 3 characters required";
        } else if (q.location.trim().length > 25) {
          newErrors[`qual_${i}_location`] = "Maximum 25 characters allowed";
        }

        // Percentage / CGPA
        if (!q.percentage?.toString().trim()) {
          newErrors[`qual_${i}_percentage`] = "Required";
        } else if (!/^-?\d+(\.\d+)?$/.test(q.percentage.toString().trim())) {
          newErrors[`qual_${i}_percentage`] =
            "Only numeric values are allowed";
        } else {
          const value = parseFloat(q.percentage);

          if (value < 1 || value > 100) {
            newErrors[`qual_${i}_percentage`] =
              "Value must be between 1 and 100";
          }
        }

        // Start Date
        if (!q.start_year) {
          newErrors[`qual_${i}_start`] = "Required";
        } else {
          const startDate = new Date(q.start_year);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (startDate > today) {
            newErrors[`qual_${i}_start`] =
              "Start Date cannot be in the future";
          }
        }

        // Pass Date
        if (!q.passing_year) {
          newErrors[`qual_${i}_pass`] = "Required";
        } else {
          const passDate = new Date(q.passing_year);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (passDate > today) {
            newErrors[`qual_${i}_pass`] =
              "Pass Date cannot be in the future";
          }

          if (q.start_year) {
            const startDate = new Date(q.start_year);

            if (passDate < startDate) {
              newErrors[`qual_${i}_pass`] =
                "Pass Date cannot be before Start Date";
            }
          }
        }

        // Certificate
        if (!q.certificate && !q.certificate_base64) {
          newErrors[`qual_${i}_certificate`] =
            "Certificate is required";
        }
      });
    }

    else if (step === 4) {
      experiences.forEach((exp, i) => {

        if (!exp.company_name?.trim()) {
          newErrors[`exp_${i}_company`] = "Required";
        } else if (!/^[A-Za-z\s&.,()-]+$/.test(exp.company_name.trim())) {
          newErrors[`exp_${i}_company`] = "Numbers are not allowed";
        } else if (exp.company_name.trim().length < 3) {
          newErrors[`exp_${i}_company`] = "Minimum 3 characters required";
        } else if (exp.company_name.trim().length > 100) {
          newErrors[`exp_${i}_company`] = "Maximum 100 characters allowed";
        }

        if (!exp.location?.trim()) {
          newErrors[`exp_${i}_location`] = "Required";
        } else if (!/^[A-Za-z\s,-]+$/.test(exp.location.trim())) {
          newErrors[`exp_${i}_location`] =
            "Only letters, spaces, commas and hyphens are allowed";
        } else if (exp.location.trim().length < 3) {
          newErrors[`exp_${i}_location`] = "Minimum 3 characters required";
        } else if (exp.location.trim().length > 25) {
          newErrors[`exp_${i}_location`] = "Maximum 25 characters allowed";
        }

        if (!exp.start_year) {
          newErrors[`exp_${i}_start`] = "Required";
        } else {
          const startDate = new Date(exp.start_year);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (startDate > today) {
            newErrors[`exp_${i}_start`] =
              "Start Date cannot be in the future";
          }
        }

        if (!exp.end_year) {
          newErrors[`exp_${i}_end`] = "Required";
        } else {
          const endDate = new Date(exp.end_year);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (endDate > today) {
            newErrors[`exp_${i}_end`] =
              "End Date cannot be in the future";
          }

          if (exp.start_year) {
            const startDate = new Date(exp.start_year);

            if (endDate < startDate) {
              newErrors[`exp_${i}_end`] =
                "End Date cannot be before Start Date";
            }
          }
        }

        if (
          exp.description &&
          exp.description.trim().length > 500
        ) {
          newErrors[`exp_${i}_description`] =
            "Maximum 500 characters allowed";
        }


        if (!exp.experience_letter && !exp.experience_letter_base64) {
          newErrors[`exp_${i}_letter`] =
            "Experience letter is required";
        }

        if (exp.designations.length === 0) {
          newErrors[`exp_${i}_desig_empty`] =
            "At least one designation is required";
        }

        exp.designations.forEach((des, d) => {

          if (!des.designation?.trim()) {
            newErrors[`exp_${i}_des_${d}_title`] = "Required";
          } else if (
            !/^[A-Za-z\s&.,()-]+$/.test(des.designation.trim())
          ) {
            newErrors[`exp_${i}_des_${d}_title`] =
              "Numbers are not allowed";
          } else if (des.designation.trim().length < 3) {
            newErrors[`exp_${i}_des_${d}_title`] =
              "Minimum 3 characters required";
          } else if (des.designation.trim().length > 100) {
            newErrors[`exp_${i}_des_${d}_title`] =
              "Maximum 100 characters allowed";
          }


          if (!des.start_date) {
            newErrors[`exp_${i}_des_${d}_start`] = "Required";
          } else {
            const desStart = new Date(des.start_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (desStart > today) {
              newErrors[`exp_${i}_des_${d}_start`] =
                "Start Date cannot be in the future";
            }

            if (exp.start_year) {
              const expStart = new Date(exp.start_year);

              if (desStart < expStart) {
                newErrors[`exp_${i}_des_${d}_start`] =
                  "Designation Start Date cannot be before Experience Start Date";
              }
            }

            if (exp.end_year) {
              const expEnd = new Date(exp.end_year);

              if (desStart > expEnd) {
                newErrors[`exp_${i}_des_${d}_start`] =
                  "Designation Start Date cannot be after Experience End Date";
              }
            }
          }


          if (!des.end_date) {
            newErrors[`exp_${i}_des_${d}_end`] = "Required";
          } else {
            const desEnd = new Date(des.end_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (desEnd > today) {
              newErrors[`exp_${i}_des_${d}_end`] =
                "End Date cannot be in the future";
            }

            if (des.start_date) {
              const desStart = new Date(des.start_date);

              if (desEnd < desStart) {
                newErrors[`exp_${i}_des_${d}_end`] =
                  "End Date cannot be before Start Date";
              }
            }

            if (exp.end_year) {
              const expEnd = new Date(exp.end_year);

              if (desEnd > expEnd) {
                newErrors[`exp_${i}_des_${d}_end`] =
                  "Designation End Date cannot be after Experience End Date";
              }
            }
          }

          if (!des.change_type) {
            newErrors[`exp_${i}_des_${d}_type`] = "Required";
          }


          if (
            des.description &&
            des.description.trim().length > 300
          ) {
            newErrors[`exp_${i}_des_${d}_description`] =
              "Maximum 300 characters allowed";
          }

        });
      });
    }


    else if (step === 5) {

      if (!profileData.aadhar_no?.trim()) {
        newErrors.aadhar_no = "Aadhar Number is required";
      } else if (!/^\d+$/.test(profileData.aadhar_no.trim())) {
        newErrors.aadhar_no = "Aadhar Number must contain only digits";
      } else if (profileData.aadhar_no.trim().length !== 12) {
        newErrors.aadhar_no = "Aadhar Number must be exactly 12 digits";
      }

      if (profileData.pan_no?.trim()) {
        const pan = profileData.pan_no.trim().toUpperCase();

        if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
          newErrors.pan_no = "Enter a valid PAN Number";
        }
      }


      if (bankDetails.length === 0) {
        newErrors.general = "At least one bank account is required.";
      }

      bankDetails.forEach((b, i) => {

        if (!b.bank_name?.trim()) {
          newErrors[`bank_${i}_name`] = "Required";
        } else if (!/^[A-Za-z\s&.,()-]+$/.test(b.bank_name.trim())) {
          newErrors[`bank_${i}_name`] = "Numbers are not allowed";
        } else if (b.bank_name.trim().length < 3) {
          newErrors[`bank_${i}_name`] = "Minimum 3 characters required";
        } else if (b.bank_name.trim().length > 100) {
          newErrors[`bank_${i}_name`] = "Maximum 100 characters allowed";
        }


        if (!b.acc_holder_name?.trim()) {
          newErrors[`bank_${i}_holder`] = "Required";
        } else if (!/^[A-Za-z\s.]+$/.test(b.acc_holder_name.trim())) {
          newErrors[`bank_${i}_holder`] = "Numbers are not allowed";
        } else if (b.acc_holder_name.trim().length < 3) {
          newErrors[`bank_${i}_holder`] = "Minimum 3 characters required";
        } else if (b.acc_holder_name.trim().length > 100) {
          newErrors[`bank_${i}_holder`] = "Maximum 100 characters allowed";
        }


        if (!b.branch_name?.trim()) {
          newErrors[`bank_${i}_branch`] = "Required";
        } else if (!/^[A-Za-z\s,-]+$/.test(b.branch_name.trim())) {
          newErrors[`bank_${i}_branch`] =
            "Only letters, spaces, commas and hyphens are allowed";
        } else if (b.branch_name.trim().length < 3) {
          newErrors[`bank_${i}_branch`] = "Minimum 3 characters required";
        } else if (b.branch_name.trim().length > 100) {
          newErrors[`bank_${i}_branch`] = "Maximum 100 characters allowed";
        }


        if (!b.account_number?.trim()) {
          newErrors[`bank_${i}_acc`] = "Required";
        } else if (!/^\d+$/.test(b.account_number.trim())) {
          newErrors[`bank_${i}_acc`] =
            "Account Number must contain only digits";
        } else if (
          b.account_number.trim().length < 9 ||
          b.account_number.trim().length > 18
        ) {
          newErrors[`bank_${i}_acc`] =
            "Account Number must be between 9 and 18 digits";
        }


        if (!b.ifsc_code?.trim()) {
          newErrors[`bank_${i}_ifsc`] = "Required";
        } else {
          const ifsc = b.ifsc_code.trim().toUpperCase();

          if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
            newErrors[`bank_${i}_ifsc`] = "Enter a valid IFSC Code";
          }
        }
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

  const handleNext = () => {
    if (validateStep(currentStep)) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      saveDraft(currentStep);
      setMessage("");
    }
  };
  const handlePrev = () => { setCurrentStep(p => p - 1); setMessage(""); };

  // ---------- Submit ----------
  const handleSubmit = async () => {
    if (!validateStep(5)) return;
    setLoading(true);
    setMessage("");

    try {
      const fd = new FormData();
      fd.append('first_name', formData.first_name);
      fd.append('last_name', formData.last_name);
      fd.append('email', formData.email);
      fd.append('mobile', formData.mobile);
      fd.append('password', formData.password);
      fd.append('gender', formData.gender);
      fd.append('biometric_id', formData.biometric_id);
      fd.append('company_id', formData.company_id.toString());
      if (formData.group_id) fd.append('group_id', formData.group_id.toString());
      if (formData.role_id) fd.append('role_id', formData.role_id.toString());
      fd.append('is_whatsapp', formData.is_whatsapp.toString());
      fd.append('is_sms', formData.is_sms.toString());
      fd.append('is_wfh', formData.is_wfh.toString());
      fd.append('is_active', formData.is_active.toString());
      fd.append('team_lead', formData.team_lead.toString());

      const profileObj = {
        staff_type_id: profileData.staff_type_id ? Number(profileData.staff_type_id) : null,
        staff_category_id: profileData.staff_category_id ? Number(profileData.staff_category_id) : null,
        staff_id: profileData.staff_id || null,
        ktu_id: profileData.ktu_id || null,
        aicte_id: profileData.aicte_id || null,
        dob: profileData.dob || null,
        religion_id: profileData.religion_id ? Number(profileData.religion_id) : null,
        caste_id: profileData.caste_id ? Number(profileData.caste_id) : null,
        blood_group: profileData.blood_group || null,
        alternate_mobile: profileData.alternate_mobile || null,
        alternate_email: profileData.alternate_email || null,
        aadhar_no: profileData.aadhar_no || null,
        pan_no: profileData.pan_no || null,
        date_of_joining: profileData.date_of_joining || null,
        date_of_contract_completion: profileData.date_of_contract_completion || null,
        date_of_relieving: profileData.date_of_relieving || null
      };
      fd.append('profile', JSON.stringify(profileObj));

      const mappedGuardians = [];
      if (profileData.guardian_name || profileData.guardian_phone) {
        mappedGuardians.push({
          name: profileData.guardian_name || "",
          phone: profileData.guardian_phone || "",
          relationship_type: "father",
          is_guardian: true
        });
      }
      fd.append('guardians', JSON.stringify(mappedGuardians));
      if (profileImage) {
        fd.append('prof_img', profileImage);
      } else if (imagePreview && imagePreview.startsWith("data:image/")) {
        fd.append('prof_img_base64', imagePreview);
      }

      const mappedBankDetails = bankDetails.map(bank => ({
        acc_holder_name: bank.acc_holder_name || `${formData.first_name} ${formData.last_name}`.trim(),
        bank_name: bank.bank_name,
        account_number: bank.account_number,
        ifsc_code: bank.ifsc_code,
        branch_name: bank.branch_name || "",
        is_primary: bank.is_primary || false
      }));

      const mappedQualifications = qualifications.map(q => ({
        qualification_level: q.qualification_level,
        specialization: q.specialization,
        institution_name: q.institution_name,
        university: q.university,
        location: q.location,
        start_year: q.start_year,
        passing_year: q.passing_year,
        percentage: q.percentage,
        certificate: q.certificate,
        certificate_base64: q.certificate_base64 || null,
        certificate_name: q.certificate_name || null
      }));

      const mappedExperiences = experiences.map(exp => ({
        company_name: exp.company_name,
        is_internal: exp.is_internal,
        location: exp.location,
        start_year: exp.start_year,
        end_year: exp.end_year,
        description: exp.description,
        experience_letter: exp.experience_letter,
        experience_letter_base64: exp.experience_letter_base64 || null,
        experience_letter_name: exp.experience_letter_name || null,
        designations: (exp.designations || []).map((des: any) => ({
          designation: des.designation,
          company_role_id: des.company_role_id ? Number(des.company_role_id) : null,
          company_group_id: des.company_group_id ? Number(des.company_group_id) : null,
          start_date: des.start_date,
          end_date: des.end_date,
          change_type: des.change_type,
          description: des.description
        }))
      }));

      fd.append('present_address', JSON.stringify(profileData.present_address));
      fd.append('permanent_address', JSON.stringify(profileData.permanent_address));
      fd.append('bank_details', JSON.stringify(mappedBankDetails));
      fd.append('qualifications', JSON.stringify(mappedQualifications.map(({ certificate, ...rest }) => rest)));
      fd.append('experiences', JSON.stringify(mappedExperiences.map(({ experience_letter, ...rest }) => rest)));

      for (let i = 0; i < qualifications.length; i++) {
        const cert = qualifications[i]?.certificate;
        if (cert) fd.append(`qualifications[${i}][certificate]`, cert);
      }
      for (let i = 0; i < experiences.length; i++) {
        const letter = experiences[i]?.experience_letter;
        if (letter) fd.append(`experiences[${i}][experience_letter]`, letter);
      }

      const response = await fetch('/api/employee-with-profile/', { method: "POST", body: fd });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || "Failed to create complete employee profile");

      setMessage("Employee and complete profile created successfully!");
      try {
        await fetch(`/api/employee-draft/?company_id=${companyId}`, { method: "DELETE" });
        setHasDraft(false);
        setDraftPayload(null);
      } catch (err) {
        console.error("Failed to delete draft:", err);
      }
      queryClient.invalidateQueries({ queryKey: ["employees", companyId] });
      setCurrentStep(0);
      setBankDetails([]);
      setQualifications([]);
      setExperiences([]);
      removeImage();
    } catch (error: any) {
      setMessage(error.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Render Functions (unchanged except Step 1) ----------
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

                  {errors.photo && (
                    <p className="text-xs text-red-500 text-center mt-1">
                      {errors.photo}
                    </p>
                  )}

                </div>
              )}
            </div>
          </div>
          <p className="text-[10px] text-[#7a8ba0] text-center max-w-[110px]">JPG, PNG<br />Max 2MB</p>
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
            <Label className="text-xs font-medium text-[#445069] mb-1.5">Alternate Email</Label>
            <Input
              name="alternate_email"
              value={profileData.alternate_email}
              onChange={handleProfileChange}
              className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all placeholder:text-[#7a8ba0]"
            />
            {errors.alternate_email && (
              <p className="text-red-500 text-xs mt-1">
                {errors.alternate_email}
              </p>
            )}
          </div>

          <div>
            <Label className="text-xs font-medium text-[#445069] mb-1.5">Alternate Mobile</Label>
            <Input
              name="alternate_mobile"
              value={profileData.alternate_mobile}
              onChange={handleProfileChange}
              className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all placeholder:text-[#7a8ba0]"
            />
            {errors.alternate_mobile && (
              <p className="text-red-500 text-xs mt-1">
                {errors.alternate_mobile}
              </p>
            )}
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

        <div>
          <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">Staff ID <span className="text-[#c9962a] ml-1">*</span></Label>
          <Input
            name="staff_id"
            value={profileData.staff_id}
            onChange={handleProfileChange}
            className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all placeholder:text-[#7a8ba0]"
          />
          {errors.staff_id && <p className="text-xs text-red-500 mt-1">{errors.staff_id}</p>}
        </div>

        <div>
          <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">Date of Joining<span className="text-[#c9962a] ml-1"> (Ignore if Date of Joining is today)</span></Label>
          <Input
            type="date"
            name="date_of_joining"
            value={profileData.date_of_joining}
            onChange={handleProfileChange}
            className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all placeholder:text-[#7a8ba0]"
          />
        </div>

        <div>
          <Label className="text-xs font-medium text-[#445069] mb-1.5">Contract Completion Date</Label>
          <Input
            type="date"
            name="date_of_contract_completion"
            value={profileData.date_of_contract_completion}
            onChange={handleProfileChange}
            className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all placeholder:text-[#7a8ba0]"
          />
        </div>

        <div className="flex items-center gap-3 mt-1 bg-[#f4f7fb] p-3 rounded-lg border border-[#dde3ec]/60">
          <Switch checked={formData.team_lead} onCheckedChange={v => setFormData({ ...formData, team_lead: v })} />
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
            {errors.present_addr_2 && (
              <p className="text-xs text-red-500 mt-1">{errors.present_addr_2}</p>
            )}
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
              <Label className="text-xs font-medium text-[#445069] mb-1.5">District <span className="text-[#c9962a] ml-1">*</span></Label>
              <Input
                value={profileData.present_address.district}
                onChange={e => handleAddressChange("present_address", "district", e.target.value)}
                className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
              />
              {errors.present_district && (
                <p className="text-xs text-red-500 mt-1">{errors.present_district}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium text-[#445069] mb-1.5">State <span className="text-[#c9962a] ml-1">*</span></Label>
              <Input
                value={profileData.present_address.state}
                onChange={e => handleAddressChange("present_address", "state", e.target.value)}
                className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
              />
              {errors.present_state && (
                <p className="text-xs text-red-500 mt-1">{errors.present_state}</p>
              )}
            </div>
            <div>
              <Label className="text-xs font-medium text-[#445069] mb-1.5">Pincode <span className="text-[#c9962a] ml-1">*</span></Label>
              <Input
                value={profileData.present_address.pincode}
                onChange={e => handleAddressChange("present_address", "pincode", e.target.value)}
                className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
              />
              {errors.present_pincode && (
                <p className="text-xs text-red-500 mt-1">{errors.present_pincode}</p>
              )}
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium text-[#445069] mb-1.5">Country <span className="text-[#c9962a] ml-1">*</span></Label>
            <Input
              value={profileData.present_address.country}
              onChange={e => handleAddressChange("present_address", "country", e.target.value)}
              className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
            />
            {errors.present_country && (
              <p className="text-xs text-red-500 mt-1">{errors.present_country}</p>
            )}
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
              onClick={() => setProfileData(p => ({ ...p, permanent_address: { ...p.present_address } }))}
              className="text-xs h-7 border-[#dde3ec] text-[#445069] pb-1 bg-[#f4f7fb] hover:bg-[#f4f7fb] hover:text-[#0f2744] transition-all"
            >
              Copy Present
            </Button>
          </div>

          <div>
            <Label className="text-xs font-medium text-[#445069] mb-1.5">Address Line 1 <span className="text-[#c9962a] ml-1">*</span></Label>
            <Input
              value={profileData.permanent_address.address_line_1}
              onChange={e => handleAddressChange("permanent_address", "address_line_1", e.target.value)}
              className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
            />
            {errors.permanent_addr_1 && (
              <p style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
                {errors.permanent_addr_1}
              </p>
            )}
          </div>
          <div>
            <Label className="text-xs font-medium text-[#445069] mb-1.5">Address Line 2 <span className="text-[#c9962a] ml-1">*</span></Label>
            <Input
              value={profileData.permanent_address.address_line_2}
              onChange={e => handleAddressChange("permanent_address", "address_line_2", e.target.value)}
              className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
            />
            {errors.permanent_addr_2 && (
              <p style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
                {errors.permanent_addr_2}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium text-[#445069] mb-1.5">City <span className="text-[#c9962a] ml-1">*</span></Label>
              <Input
                value={profileData.permanent_address.city}
                onChange={e => handleAddressChange("permanent_address", "city", e.target.value)}
                className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
              />
              {errors.permanent_city && (
                <p style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
                  {errors.permanent_city}
                </p>
              )}
            </div>
            <div>
              <Label className="text-xs font-medium text-[#445069] mb-1.5">District <span className="text-[#c9962a] ml-1">*</span></Label>
              <Input
                value={profileData.permanent_address.district}
                onChange={e => handleAddressChange("permanent_address", "district", e.target.value)}
                className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
              />
              {errors.permanent_district && (
                <p style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
                  {errors.permanent_district}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium text-[#445069] mb-1.5">State <span className="text-[#c9962a] ml-1">*</span></Label>
              <Input
                value={profileData.permanent_address.state}
                onChange={e => handleAddressChange("permanent_address", "state", e.target.value)}
                className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
              />
              {errors.permanent_state && (
                <p style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
                  {errors.permanent_state}
                </p>
              )}
            </div>
            <div>
              <Label className="text-xs font-medium text-[#445069] mb-1.5">Pincode <span className="text-[#c9962a] ml-1">*</span></Label>
              <Input
                value={profileData.permanent_address.pincode}
                onChange={e => handleAddressChange("permanent_address", "pincode", e.target.value)}
                className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
              />
              {errors.permanent_pincode && (
                <p style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
                  {errors.permanent_pincode}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium text-[#445069] mb-1.5">Country <span className="text-[#c9962a] ml-1">*</span></Label>
            <Input
              value={profileData.permanent_address.country}
              onChange={e => handleAddressChange("permanent_address", "country", e.target.value)}
              className="h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
            />
            {errors.permanent_country && (
              <p style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
                {errors.permanent_country}
              </p>
            )}
          </div>
        </div>
      </div>

      <Separator className="bg-[#dde3ec]" />

      <div className="flex flex-wrap gap-4 justify-around bg-[#f4f7fb] p-5 rounded-lg border border-[#dde3ec]/60">
        <div className="flex items-center gap-3">
          <Switch checked={formData.is_whatsapp} onCheckedChange={v => setFormData({ ...formData, is_whatsapp: v })} />
          <Label className="text-sm font-medium text-[#445069] cursor-pointer">WhatsApp Notif</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={formData.is_sms} onCheckedChange={v => setFormData({ ...formData, is_sms: v })} />
          <Label className="text-sm font-medium text-[#445069] cursor-pointer">SMS Notif</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={formData.is_wfh} onCheckedChange={v => setFormData({ ...formData, is_wfh: v })} />
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
          <Plus className="w-4 h-4" /> Add Qualification
        </Button>
      </div>

      {errors.general && <p className="text-red-500 font-medium text-sm">{errors.general}</p>}

      <div className="space-y-6">
        {qualifications.map((q, idx) => (
          <Card key={idx} className="relative bg-[#f4f7fb] border border-[#dde3ec] rounded-lg p-6 group transition-all hover:border-[#234d78]/30 shadow-sm overflow-visible">
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
                <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">Academic Level <span className="text-[#c9962a] ml-1">*</span></Label>
                <select
                  value={q.qualification_level}
                  onChange={e => updateQual(idx, 'qualification_level', e.target.value)}
                  className="w-full h-[38px] px-3 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all cursor-pointer"
                >
                  <option value="">Select Level</option>
                  <option value="UG">Undergraduate (UG)</option>
                  <option value="PG">Postgraduate (PG)</option>
                  <option value="MPHIL">M.Phil.</option>
                  <option value="PHD">Ph.D.</option>
                  <option value="POSTDOC">Post Doctoral (Post.Doc)</option>
                  <option value="RESEARCH_OTHERS">Research (Others)</option>
                  <option value="OTHERS">Others</option>
                </select>
                {errors[`qual_${idx}_level`] && <p className="text-xs text-red-500 mt-1">{errors[`qual_${idx}_level`]}</p>}
              </div>

              <div>
                <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">Specialization <span className="text-[#c9962a] ml-1">*</span></Label>
                <Input
                  value={q.specialization}
                  onChange={e => updateQual(idx, 'specialization', e.target.value)}
                  className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
                />
                {errors[`qual_${idx}_specialization`] && <p className="text-xs text-red-500 mt-1">{errors[`qual_${idx}_specialization`]}</p>}
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
                <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">University / Board <span className="text-[#c9962a] ml-1">*</span></Label>
                <Input
                  value={q.university}
                  onChange={e => updateQual(idx, 'university', e.target.value)}
                  className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
                />
                {errors[`qual_${idx}_university`] && <p className="text-xs text-red-500 mt-1">{errors[`qual_${idx}_university`]}</p>}
              </div>

              <div>
                <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">Location <span className="text-[#c9962a] ml-1">*</span></Label>
                <Input
                  placeholder="e.g. Kochi, Kerala"
                  value={q.location}
                  onChange={e => updateQual(idx, 'location', e.target.value)}
                  className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
                />
                {errors[`qual_${idx}_location`] && <p className="text-xs text-red-500 mt-1">{errors[`qual_${idx}_location`]}</p>}
              </div>

              <div>
                <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">Percentage / CGPA <span className="text-[#c9962a] ml-1">*</span></Label>
                <Input
                  type="number"
                  step="0.01"
                  value={q.percentage}
                  onChange={e => updateQual(idx, 'percentage', e.target.value)}
                  className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
                />
                {errors[`qual_${idx}_percentage`] && <p className="text-xs text-red-500 mt-1">{errors[`qual_${idx}_percentage`]}</p>}
              </div>

              <div>
                <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">Start Date <span className="text-[#c9962a] ml-1">*</span></Label>
                <Input
                  type="date"
                  value={q.start_year}
                  onChange={e => updateQual(idx, 'start_year', e.target.value)}
                  className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
                />
                {errors[`qual_${idx}_start`] && <p className="text-xs text-red-500 mt-1">{errors[`qual_${idx}_start`]}</p>}
              </div>

              <div>
                <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">Pass Date <span className="text-[#c9962a] ml-1">*</span></Label>
                <Input
                  type="date"
                  value={q.passing_year}
                  onChange={e => updateQual(idx, 'passing_year', e.target.value)}
                  className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
                />
                {errors[`qual_${idx}_pass`] && <p className="text-xs text-red-500 mt-1">{errors[`qual_${idx}_pass`]}</p>}
              </div>

              <div className="col-span-1 md:col-span-3">
                <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">Certificate <span className="text-[#c9962a] ml-1">*</span></Label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer h-[38px] px-4 border border-dashed border-[#dde3ec] rounded-[7px] bg-white text-[#7a8ba0] text-sm hover:border-[#c9962a] hover:text-[#c9962a] transition-all">
                    <Upload className="w-4 h-4" />
                    <span>{q.certificate ? (q.certificate as File).name : q.certificate_name ? q.certificate_name : "Upload Certificate"}</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0] || null; handleQualFileChange(idx, f); }}
                    />
                  </label>
                  {(q.certificate || q.certificate_base64) && (
                    <button type="button" onClick={() => handleQualFileChange(idx, null)} className="text-red-400 hover:text-red-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {errors[`qual_${idx}_certificate`] && <p className="text-xs text-red-500 mt-1">{errors[`qual_${idx}_certificate`]}</p>}
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
          <Plus className="w-4 h-4" /> Add Experience
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
              <div className="flex items-center gap-3 bg-[#f4f7fb] p-3 rounded-lg border border-[#dde3ec]/60 w-fit">
                <Switch checked={exp.is_internal} onCheckedChange={v => updateExp(idx, 'is_internal', v)} />
                <div>
                  <Label className="text-sm font-medium text-[#445069] cursor-pointer">Internal Experience</Label>
                  <p className="text-[10px] text-[#7a8ba0] mt-0.5">Check if this was an internal position within our company</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">Company Name {exp.is_internal ? '' : <span className="text-[#c9962a] ml-1">*</span>}</Label>
                  <Input
                    value={exp.company_name}
                    onChange={e => updateExp(idx, 'company_name', e.target.value)}
                    disabled={exp.is_internal}
                    className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all disabled:bg-[#f4f7fb] disabled:cursor-not-allowed"
                  />
                  {errors[`exp_${idx}_company`] && !exp.is_internal && <p className="text-xs text-red-500 mt-1">{errors[`exp_${idx}_company`]}</p>}
                </div>
                <div>
                  <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">Location {exp.is_internal ? '' : <span className="text-[#c9962a] ml-1">*</span>}</Label>
                  <Input
                    value={exp.location}
                    onChange={e => updateExp(idx, 'location', e.target.value)}
                    disabled={exp.is_internal}
                    className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all disabled:bg-[#f4f7fb] disabled:cursor-not-allowed"
                  />
                  {errors[`exp_${idx}_location`] && !exp.is_internal && <p className="text-xs text-red-500 mt-1">{errors[`exp_${idx}_location`]}</p>}
                </div>
                <div>
                  <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">Start Date <span className="text-[#c9962a] ml-1">*</span></Label>
                  <Input
                    type="date"
                    value={exp.start_year}
                    onChange={e => updateExp(idx, 'start_year', e.target.value)}
                    className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
                  />
                  {errors[`exp_${idx}_start`] && <p className="text-xs text-red-500 mt-1">{errors[`exp_${idx}_start`]}</p>}
                </div>
                <div>
                  <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">End Date <span className="text-[#c9962a] ml-1">*</span></Label>
                  <Input
                    type="date"
                    value={exp.end_year}
                    onChange={e => updateExp(idx, 'end_year', e.target.value)}
                    className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
                  />
                  {errors[`exp_${idx}_end`] && <p className="text-xs text-red-500 mt-1">{errors[`exp_${idx}_end`]}</p>}
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-[#445069] mb-1.5">Description / Notes</Label>
                <textarea
                  rows={2}
                  value={exp.description}
                  onChange={e => updateExp(idx, 'description', e.target.value)}
                  placeholder="Brief description of role or responsibilities (optional)..."
                  className="w-full px-3 py-2 border border-[#dde3ec] rounded-[7px] bg-white text-[#1a1a2e] text-sm focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all resize-none placeholder:text-[#7a8ba0]"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-[#445069] mb-1.5 flex items-center">Experience Letter <span className="text-[#c9962a] ml-1">*</span></Label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer h-[38px] px-4 border border-dashed border-[#dde3ec] rounded-[7px] bg-white text-[#7a8ba0] text-sm hover:border-[#c9962a] hover:text-[#c9962a] transition-all">
                    <Upload className="w-4 h-4" />
                    <span>{exp.experience_letter ? (exp.experience_letter as File).name : exp.experience_letter_name ? exp.experience_letter_name : "Upload Experience Letter"}</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0] || null; handleExpFileChange(idx, f); }}
                    />
                  </label>
                  {(exp.experience_letter || exp.experience_letter_base64) && (
                    <button type="button" onClick={() => handleExpFileChange(idx, null)} className="text-red-400 hover:text-red-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {errors[`exp_${idx}_letter`] && <p className="text-xs text-red-500 mt-1">{errors[`exp_${idx}_letter`]}</p>}
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
                    <Plus className="w-3 h-3" /> Add Designation
                  </Button>
                </div>
                {errors[`exp_${idx}_desig_empty`] && <p className="text-xs text-red-500 mt-1">{errors[`exp_${idx}_desig_empty`]}</p>}

                {exp.designations.map((des: any, didx: number) => (
                  <div key={didx} className="flex flex-col gap-3 bg-[#f4f7fb]/40 p-3 rounded border border-[#dde3ec]/40 relative">
                    <div className="w-full">
                      {exp.is_internal ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs font-medium text-[#445069] mb-1 block flex items-center">Company Role <span className="text-[#c9962a] ml-1">*</span></Label>
                            <select
                              className="h-8 text-xs border border-[#dde3ec] bg-white w-full rounded-md px-2 focus:outline-none cursor-pointer"
                              value={des.company_role_id || ""}
                              onChange={e => updateDesig(idx, didx, 'company_role_id', e.target.value)}
                            >
                              <option value="">Select Role</option>
                              {roles.map(r => <option key={r.id} value={r.id}>{r.role || r.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-[#445069] mb-1 block flex items-center">Company Group <span className="text-[#c9962a] ml-1">*</span></Label>
                            <select
                              className="h-8 text-xs border border-[#dde3ec] bg-white w-full rounded-md px-2 focus:outline-none cursor-pointer"
                              value={des.company_group_id || ""}
                              onChange={e => updateDesig(idx, didx, 'company_group_id', e.target.value)}
                            >
                              <option value="">Select Group</option>
                              {groups.map(g => <option key={g.id} value={g.id}>{g.group}</option>)}
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <Label className="text-xs font-medium text-[#445069] mb-1 block flex items-center">Title <span className="text-[#c9962a] ml-1">*</span></Label>
                          <Input
                            className="h-8 text-xs border-[#dde3ec] bg-white w-full"
                            value={des.designation}
                            onChange={e => updateDesig(idx, didx, 'designation', e.target.value)}
                          />
                          {errors[`exp_${idx}_des_${didx}_title`] && <p className="text-xs text-red-500 mt-1">{errors[`exp_${idx}_des_${didx}_title`]}</p>}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-[#445069] mb-1 block flex items-center">Start Date <span className="text-[#c9962a] ml-1">*</span></Label>
                        <Input
                          type="date"
                          className="h-8 text-xs border-[#dde3ec] bg-white w-full"
                          value={des.start_date}
                          onChange={e => updateDesig(idx, didx, 'start_date', e.target.value)}
                        />
                        {errors[`exp_${idx}_des_${didx}_start`] && <p className="text-xs text-red-500 mt-1">{errors[`exp_${idx}_des_${didx}_start`]}</p>}
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-[#445069] mb-1 block flex items-center">End Date <span className="text-[#c9962a] ml-1">*</span></Label>
                        <Input
                          type="date"
                          className="h-8 text-xs border-[#dde3ec] bg-white w-full"
                          value={des.end_date}
                          onChange={e => updateDesig(idx, didx, 'end_date', e.target.value)}
                        />
                        {errors[`exp_${idx}_des_${didx}_end`] && <p className="text-xs text-red-500 mt-1">{errors[`exp_${idx}_des_${didx}_end`]}</p>}
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-[#445069] mb-1 block flex items-center">Type <span className="text-[#c9962a] ml-1">*</span></Label>
                        <select
                          className="h-8 text-xs w-full border border-[#dde3ec] bg-white rounded-md px-2 focus:outline-none cursor-pointer"
                          value={des.change_type}
                          onChange={e => updateDesig(idx, didx, 'change_type', e.target.value)}
                        >
                          <option value="Joined">Joined</option>
                          <option value="Promotion">Promotion</option>
                          <option value="Demotion">Demotion</option>
                          <option value="Re-designation">Re-designation</option>
                        </select>
                        {errors[`exp_${idx}_des_${didx}_type`] && <p className="text-xs text-red-500 mt-1">{errors[`exp_${idx}_des_${didx}_type`]}</p>}
                      </div>
                    </div>

                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <Label className="text-xs font-medium text-[#445069] mb-1 block">Description (optional)</Label>
                        <Input
                          className="h-8 text-xs border-[#dde3ec] bg-white w-full"
                          placeholder="Notes about this change (optional)..."
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
                        <X className="w-4 h-4" />
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
          {errors.pan_no && (
            <p className="text-xs text-red-500 mt-1">
              {errors.pan_no}
            </p>
          )}
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
          <Plus className="w-4 h-4" /> Add Bank
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
                <Label className="text-xs font-medium text-[#445069] mb-1.5">Account Holder Name <span className="text-[#c9962a] ml-1">*</span></Label>
                <Input
                  value={b.acc_holder_name}
                  onChange={e => updateBank(idx, 'acc_holder_name', e.target.value)}
                  placeholder={`${formData.first_name} ${formData.last_name}`.trim()}
                  className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all placeholder:text-[#7a8ba0]"
                />
                {errors[`bank_${idx}_holder`] && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors[`bank_${idx}_holder`]}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-xs font-medium text-[#445069] mb-1.5">Branch <span className="text-[#c9962a] ml-1">*</span></Label>
                <Input
                  value={b.branch_name}
                  onChange={e => updateBank(idx, 'branch_name', e.target.value)}
                  className="h-[38px] px-3 border border-[#dde3ec] bg-white text-[#1a1a2e] text-sm focus-visible:ring-0 focus:outline-none focus:border-[#c9962a] focus:ring-[3px] focus:ring-[#c9962a]/12 transition-all"
                />
                {errors[`bank_${idx}_branch`] && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors[`bank_${idx}_branch`]}
                  </p>
                )}
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

  // ---------- Main Return ----------
  return (
    <div className="min-h-screen bg-[#f8fafc] py-8">
      <div className="max-w-6xl mx-auto pb-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-[#eff6ff] rounded-lg text-[#2563eb] shadow-sm"><UserPlus className="h-6 w-6" /></div>
          <div>
            <h1 className="text-2xl font-bold text-[#0f2744]">Add New Employee</h1>
            <p className="text-sm text-[#7a8ba0] mt-0.5">{company?.company_name || "EmpSync AI Client"}</p>
          </div>
        </div>

        {hasDraft && (
          <div className="bg-[#fdf3dc] border border-[#e8b84b] rounded-lg p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-[#e8b84b]/20 p-2 rounded-full text-[#c9962a]">
                <Save className="h-5 w-5" />
              </div>
              <div>
                <h5 className="font-semibold text-sm text-[#1a1a2e]">Resume Unfinished Onboarding?</h5>
                <p className="text-xs text-[#445069]">We found a saved draft for this company. Would you like to pick up where you left off?</p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button type="button" onClick={resumeDraft} className="bg-[#c9962a] hover:bg-[#b08221] text-white text-xs h-8 px-4 rounded-[7px] w-full sm:w-auto">
                Resume Draft
              </Button>
              <Button type="button" onClick={discardDraft} variant="outline" className="border-[#dde3ec] text-[#445069] hover:bg-[#f4f7fb] text-xs h-8 px-4 rounded-[7px] w-full sm:w-auto">
                Discard
              </Button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-[0_2px_16px_rgba(15,39,68,0.08)] p-6 mb-8 border border-[#dde3ec]">
          <div className="flex items-center justify-between relative px-4">
            <div className="absolute left-[5%] right-[5%] top-1/2 -translate-y-1/2 h-[3px] bg-[#dde3ec] z-0 rounded-full"></div>
            <div className="absolute left-[5%] top-1/2 -translate-y-1/2 h-[3px] bg-[#0f2744] z-0 rounded-full transition-all duration-500" style={{ width: `${(currentStep / (steps.length - 1)) * 90}%` }}></div>
            {steps.map((label, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer w-24" onClick={() => { if (idx < currentStep) setCurrentStep(idx); }}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${idx === currentStep ? 'bg-[#eff6ff] border-2 border-[#0f2744] text-[#0f2744] shadow-[0_0_0_4px_rgba(239,246,255,1)] scale-105' : idx < currentStep ? 'bg-[#0f2744] text-white' : 'bg-[#f4f7fb] text-[#7a8ba0] border-2 border-transparent'}`}>
                  {idx < currentStep ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                <span className={`text-[11px] font-semibold text-center whitespace-nowrap hidden sm:block ${idx === currentStep ? 'text-[#0f2744]' : 'text-[#7a8ba0]'}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <Card className="border border-[#dde3ec] shadow-[0_2px_16px_rgba(15,39,68,0.08)] bg-white rounded-xl overflow-hidden">
          <div className="px-8 py-5 border-b border-[#dde3ec] bg-white flex items-center">
            <div className="w-1 h-5 bg-[#e8b84b] rounded-r-sm mr-3"></div>
            <h3 className="text-lg font-bold text-[#0f2744] tracking-tight font-serif">{steps[currentStep]}</h3>
          </div>
          <CardContent className="p-8 min-h-[400px]">
            {message && (
              <div className={`p-4 rounded-lg mb-6 flex items-center gap-2 text-sm ${message.includes("successfully") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
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
            <Button type="button" variant="outline" onClick={handlePrev} disabled={currentStep === 0 || loading} className="w-32 gap-2 border-[#dde3ec] text-[#445069] bg-white hover:bg-[#f4f7fb]">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            
            <Button type="button" variant="outline" onClick={() => saveDraft(currentStep, true)} disabled={loading} className="border-[#dde3ec] text-[#445069] bg-white hover:bg-[#f4f7fb] gap-2">
              <Save className="w-4 h-4" /> Save Draft
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button type="button" onClick={handleNext} className="w-32 gap-2 bg-[#0f2744] hover:bg-[#1a3a5c] text-white shadow-sm">
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={loading} className="w-40 gap-2 bg-[#1a7f5a] hover:bg-[#146648] text-white shadow-lg shadow-green-600/10">
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
                Submit
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}