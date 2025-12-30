/*"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AddEmployeePage() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    mobile: "",
    gender: "",
    role: "",
    company_id: "7",
    password: "empsyncai123@",
    biometric_id: "",
    is_whatsapp: true,
    is_sms: true,
    is_wfh: true,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/employees/add_employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to add employee: ${res.status} - ${errorText}`);
      }

      await res.json();
      setMessage("✅ Employee added successfully!");
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        mobile: "",
        gender: "",
        role: "",
        company_id: "7",
        password: "empsyncai123@",
        biometric_id: "",
        is_whatsapp: true,
        is_sms: true,
        is_wfh: true,
      });
    } catch (error: any) {
      console.error("Error adding employee:", error.message);
      setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-lg mx-auto p-6 border-l-4 border-l-blue-500">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold mb-4">Add Employee</CardTitle>
        {message && (
          <Badge
            variant={message.startsWith("✅") ? "default" : "destructive"}
            className="mb-4"
          >
            {message}
          </Badge>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            placeholder="First Name"
            required
            className="w-full border p-2 rounded"
          />
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            placeholder="Last Name"
            required
            className="w-full border p-2 rounded"
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            required
            className="w-full border p-2 rounded"
          />
          <input
            type="text"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            placeholder="Mobile"
            required
            className="w-full border p-2 rounded"
          />
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          >
            <option value="">Select Gender</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
              <select
        name="role"
        value={formData.role}
        onChange={handleChange}
        required
        className="w-full border p-2 rounded"
      >
        <option value="">Select Role</option>
        <option value="test">Test</option>
        <option value="test role">Test Role</option>
        <option value="developer">Developer</option>
      </select>
          <input
            type="text"
            name="biometric_id"
            value={formData.biometric_id}
            onChange={handleChange}
            placeholder="Biometric ID"
            required
            className="w-full border p-2 rounded"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded w-full"
          >
            {loading ? "Adding..." : "Add Employee"}
          </button>
        </form>
      </CardHeader>
    </Card>
  );
}*/
"use client";

import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UserPlus, Save, Upload, X, Camera } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AddEmployeePage() {
  const { company } = useAuth();
  const companyId = company?.id || "";
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [roles, setRoles] = useState<{ id: number; role: string }[]>([]);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    mobile: "",
    gender: "",
    role_id: "",
    company_id: companyId,
    password: "empsyncai123@",
    biometric_id: "",
    is_whatsapp: true,
    is_sms: true,
    is_wfh: true,
  });

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 🔄 Fetch roles whenever companyId changes
  useEffect(() => {
    if (!companyId) return;

    const fetchRoles = async () => {
      try {
        const res = await fetch(`/api/settings/roles/${companyId}`);
        if (!res.ok) throw new Error("Failed to fetch roles");
        const responseData = await res.json();
        
        let rolesArray = [];
        
        if (Array.isArray(responseData)) {
          rolesArray = responseData;
        } else if (responseData.success && Array.isArray(responseData.data)) {
          rolesArray = responseData.data;
        } else if (Array.isArray(responseData.data)) {
          rolesArray = responseData.data;
        } else if (responseData.roles) {
          rolesArray = responseData.roles;
        }
        
        setRoles(rolesArray);
      } catch (err) {
        console.error("Error fetching roles:", err);
        setRoles([]);
      }
    };

    fetchRoles();
  }, [companyId]);

  // 🔄 Update company_id whenever company changes
  useEffect(() => {
    if (companyId) {
      setFormData(prev => ({
        ...prev,
        company_id: companyId
      }));
    }
  }, [companyId]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    const processedValue = (name === 'role_id' || name === 'company_id') ? 
      (value === '' ? '' : Number(value)) : value;
    
    setFormData({ ...formData, [name]: processedValue });
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setMessage("Please select a valid image file (JPEG, PNG, GIF, WebP)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image size should be less than 5MB");
      return;
    }

    setProfileImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setProfileImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setMessage("Please fix the errors above");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formDataToSend.append(key, value.toString());
        }
      });
      
      // Append profile image if exists
      if (profileImage) {
        formDataToSend.append('prof_img', profileImage);
      }

      console.log("Sending FormData:", Object.fromEntries(formDataToSend.entries()));

      const res = await fetch("/api/employees/add_employees", {
        method: "POST",
        // Don't set Content-Type header for FormData, browser will set it automatically
        body: formDataToSend,
      });

      const responseData = await res.json();
      console.log("Backend response:", responseData);

      if (!res.ok) {
        if (responseData.message && typeof responseData.message === 'object') {
          const errorMessages = Object.entries(responseData.message)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
          throw new Error(errorMessages);
        } else if (responseData.message) {
          throw new Error(responseData.message);
        } else if (responseData.details) {
          throw new Error(responseData.details);
        } else {
          throw new Error(`Failed to add employee: ${res.status}`);
        }
      }

      // Success case
      setMessage(responseData.message || "Employee added successfully!");
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["employees", companyId] });
      queryClient.invalidateQueries({ queryKey: ["roles", companyId] });

      // Reset form
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        mobile: "",
        gender: "",
        role_id: "",
        company_id: companyId,
        password: "empsyncai123@",
        biometric_id: "",
        is_whatsapp: true,
        is_sms: true,
        is_wfh: true,
      });
      removeImage();
      setErrors({});

    } catch (error: any) {
      console.error("Error adding employee:", error);
      setMessage(error.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

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
                <div
                  className={`p-3 rounded-md ${
                    message.includes("successfully") || message.includes("Signup success") 
                      ? "bg-green-100 text-green-700" 
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {message}
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Profile Image Upload Section */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div 
                    className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 overflow-hidden bg-gray-50 dark:bg-gray-800"
                    onClick={triggerFileInput}
                  >
                    {imagePreview ? (
                      <div className="relative w-full h-full group">
                        <img 
                          src={imagePreview} 
                          alt="Profile preview" 
                          className="w-full h-full rounded-full object-cover"
                        />
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
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Supported: JPG, PNG, GIF, WebP
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Max size: 5MB
                  </p>
                </div>
              </div>

              <Separator />

              {/* Personal Info */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input 
                      name="first_name" 
                      value={formData.first_name} 
                      onChange={handleChange} 
                      placeholder="First Name *" 
                    />
                    {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
                  </div>
                  <div>
                    <Input 
                      name="last_name" 
                      value={formData.last_name} 
                      onChange={handleChange} 
                      placeholder="Last Name *" 
                    />
                    {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
                  </div>
                  <div>
                    <Input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      placeholder="Email *" 
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Input 
                      name="mobile" 
                      value={formData.mobile} 
                      onChange={handleChange} 
                      placeholder="Mobile *" 
                    />
                    {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
                  </div>
                  <div>
                    <select 
                      name="gender" 
                      value={formData.gender} 
                      onChange={handleChange} 
                      className="w-full p-2.5 border rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select Gender *</option>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="O">Other</option>
                    </select>
                    {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                  </div>
                  <div>
                    <Input 
                      name="biometric_id" 
                      value={formData.biometric_id} 
                      onChange={handleChange} 
                      placeholder="Biometric ID *" 
                    />
                    {errors.biometric_id && <p className="text-red-500 text-xs mt-1">{errors.biometric_id}</p>}
                  </div>
                </div>

                <Separator />

                {/* Role Dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-2">Role *</label>
                  <select
                    name="role_id"
                    value={formData.role_id}
                    onChange={handleChange}
                    className="w-full p-2.5 border rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Role</option>
                    {roles.length > 0 ? (
                      roles.map((role: any) => (
                        <option key={role.id} value={role.id}>
                          {role.role || role.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        {companyId ? "Loading roles..." : "Select a company first"}
                      </option>
                    )}
                  </select>
                  {errors.role_id && <p className="text-red-500 text-xs mt-1">{errors.role_id}</p>}
                </div>

                {/* Notification Preferences */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="flex items-center space-x-2 p-2 rounded border">
                    <input
                      type="checkbox"
                      id="is_whatsapp"
                      name="is_whatsapp"
                      checked={formData.is_whatsapp}
                      onChange={(e) => setFormData({...formData, is_whatsapp: e.target.checked})}
                      className="h-4 w-4 text-primary rounded"
                    />
                    <label htmlFor="is_whatsapp" className="text-sm">WhatsApp Notifications</label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 rounded border">
                    <input
                      type="checkbox"
                      id="is_sms"
                      name="is_sms"
                      checked={formData.is_sms}
                      onChange={(e) => setFormData({...formData, is_sms: e.target.checked})}
                      className="h-4 w-4 text-primary rounded"
                    />
                    <label htmlFor="is_sms" className="text-sm">SMS Notifications</label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 rounded border">
                    <input
                      type="checkbox"
                      id="is_wfh"
                      name="is_wfh"
                      checked={formData.is_wfh}
                      onChange={(e) => setFormData({...formData, is_wfh: e.target.checked})}
                      className="h-4 w-4 text-primary rounded"
                    />
                    <label htmlFor="is_wfh" className="text-sm">Work From Home</label>
                  </div>
                </div>

                {/* Default Password Info
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Default Password:</strong> {formData.password}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Employee will use this password for first login
                  </p>
                </div> */}

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleSubmit} 
                    disabled={loading || !companyId}
                    className="gap-2 min-w-[180px]"
                    size="lg"
                  >
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