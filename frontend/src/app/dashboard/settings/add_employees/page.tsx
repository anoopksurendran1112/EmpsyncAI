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

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UserPlus, Save } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AddEmployeePage() {
  const { company } = useAuth(); // ✅ Get current company from context
  const companyId = company?.id || ""; 
  const queryClient = useQueryClient();

  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    mobile: "",
    gender: "",
    role: "",
    company_id: companyId,
    password: "empsyncai123@",
    biometric_id: "",
    is_whatsapp: true,
    is_sms: true,
    is_wfh: true,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 🔄 Update company_id whenever company changes
// 🔄 Fetch roles whenever companyId changes
useEffect(() => {
  if (!companyId) return;

  const fetchRoles = async () => {
    try {
      const res = await fetch(`/api/settings/roles/${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch roles");
      const responseData = await res.json();
      
      console.log("Roles API response:", responseData); // Debug log
      
      // Handle both response structures:
      // 1. Direct array from API route: []
      // 2. Wrapped object from backend: { success: true, data: [...] }
      let rolesArray = [];
      
      if (Array.isArray(responseData)) {
        // Case 1: Direct array from API route
        rolesArray = responseData;
      } else if (responseData.success && Array.isArray(responseData.data)) {
        // Case 2: Wrapped response from backend
        rolesArray = responseData.data;
      } else if (Array.isArray(responseData.data)) {
        // Case 3: Just data array
        rolesArray = responseData.data;
      }
      
      console.log("Processed roles:", rolesArray); // Debug log
      setRoles(rolesArray);
    } catch (err) {
      console.error("Error fetching roles:", err);
      setRoles([]);
    }
  };

  fetchRoles();
}, [companyId]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.first_name.trim()) newErrors.first_name = "First name is required";
    if (!formData.last_name.trim()) newErrors.last_name = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Please enter a valid email";
    if (!formData.mobile.trim()) newErrors.mobile = "Mobile number is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.role) newErrors.role = "Role is required";
    if (!formData.biometric_id.trim()) newErrors.biometric_id = "Biometric ID is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
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
      const res = await fetch("/api/employees/add_employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `Failed to add employee: ${res.status}`);
      }

      setMessage("Employee added successfully!");
      queryClient.invalidateQueries(["employees", companyId]);

      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        mobile: "",
        gender: "",
        role: "",
        company_id: companyId,
        password: "empsyncai123@",
        biometric_id: "",
        is_whatsapp: true,
        is_sms: true,
        is_wfh: true,
      });
      setErrors({});
    } catch (error: any) {
      console.error("Error adding employee:", error.message);
      setMessage(error.message);
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
                    message.includes("successfully") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {message}
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Personal Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input name="first_name" value={formData.first_name} onChange={handleChange} placeholder="First Name" />
                <Input name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Last Name" />
                <Input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" />
                <Input name="mobile" value={formData.mobile} onChange={handleChange} placeholder="Mobile" />
                <select name="gender" value={formData.gender} onChange={handleChange} className="p-2 border rounded">
                  <option value="">Select Gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>

              <Separator />

              {/* Role Dropdown */}
            {/* Role Dropdown */}
            <div>
              <label className="block text-sm font-medium mb-2">Role *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="">Select Role</option>
                {roles.length > 0 ? (
                  roles.map((role: any) => (
                    <option key={role.id} value={role.id}> {/* ✅ Use role.id as value */}
                      {role.role} {/* ✅ Use role.role for display */}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    {companyId ? "Loading roles..." : "Select a company first"}
                  </option>
                )}
              </select>
              {errors.role && <p className="text-red-500 text-xs">{errors.role}</p>}
            </div>

              <Input name="biometric_id" value={formData.biometric_id} onChange={handleChange} placeholder="Biometric ID" />

              <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? "Adding..." : <span className="flex items-center gap-2"><Save className="h-5 w-5" />Add Employee</span>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
