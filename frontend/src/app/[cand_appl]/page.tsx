"use client";

import { useState, useEffect } from 'react';
import { User, Mail, Phone, Building, Users, Briefcase } from 'lucide-react';

interface Company {
  id: number;
  company_name: string;
}

interface Group {
  id: number;
  group?: string;
  name?: string;
  group_name?: string;
}

interface Role {
  id: number;
  role?: string;
  name?: string;
}

interface CandidateFormData {
  company_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  group: number;
  role: number;
  status: 'pending' | 'approved' | 'rejected';
}

export default function CandidateApplicationPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const [form, setForm] = useState<Partial<CandidateFormData>>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_id: 0,
    group: 0,
    role: 0,
    status: 'pending',
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Helper to extract array from nested responses
  const extractArray = (data: unknown): any[] => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      for (const key of ['data', 'results', 'items', 'companies', 'groups', 'roles']) {
        const value = (data as any)[key];
        if (Array.isArray(value)) return value;
        if (value && typeof value === 'object') {
          const nested = extractArray(value);
          if (nested.length) return nested;
        }
      }
      for (const value of Object.values(data as object)) {
        if (Array.isArray(value)) return value;
        if (value && typeof value === 'object') {
          const nested = extractArray(value);
          if (nested.length) return nested;
        }
      }
    }
    return [];
  };

  // Fetch companies
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/company');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const companiesArray = extractArray(json);
        setCompanies(companiesArray);
        if (companiesArray.length > 0) {
          setForm(prev => ({ ...prev, company_id: companiesArray[0].id }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load companies');
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  // Fetch groups & roles
  useEffect(() => {
    if (!form.company_id) {
      setGroups([]);
      setRoles([]);
      setForm(prev => ({ ...prev, group: 0, role: 0 }));
      setError(null);
      return;
    }

    const fetchGroupsAndRoles = async () => {
      setLoading(true);
      setError(null);
      try {
        const groupUrl = `/api/settings/groups/${form.company_id}`;
        const roleUrl = `/api/settings/roles/${form.company_id}`;

        const [groupsRes, rolesRes] = await Promise.all([
          fetch(groupUrl, { headers: { 'x-company-id': form.company_id.toString() } }),
          fetch(roleUrl, { headers: { 'x-company-id': form.company_id.toString() } }),
        ]);

        if (!groupsRes.ok) throw new Error(`Groups endpoint returned ${groupsRes.status}`);
        if (!rolesRes.ok) throw new Error(`Roles endpoint returned ${rolesRes.status}`);

        const groupsJson = await groupsRes.json();
        const rolesJson = await rolesRes.json();

        setGroups(extractArray(groupsJson));
        setRoles(extractArray(rolesJson));
        setForm(prev => ({ ...prev, group: 0, role: 0 }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
        setGroups([]);
        setRoles([]);
        setForm(prev => ({ ...prev, group: 0, role: 0 }));
      } finally {
        setLoading(false);
      }
    };

    fetchGroupsAndRoles();
  }, [form.company_id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]:
        name === 'company_id' || name === 'group' || name === 'role'
          ? parseInt(value, 10) || 0
          : value,
    }));
    setSuccess(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.company_id ||
      !form.first_name?.trim() ||
      !form.last_name?.trim() ||
      !form.email?.trim() ||
      !form.phone?.trim() ||
      !form.group ||
      !form.role
    ) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = {
        company_id: form.company_id,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        group: form.group,
        role: form.role,
        status: 'pending',
      };

      const res = await fetch('/api/candidate_request/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned an unexpected response (not JSON).');
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.errors || 'Submission failed');
      }

      setSuccess(true);
      setForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company_id: form.company_id,
        group: 0,
        role: 0,
        status: 'pending',
      });
      setGroups([]);
      setRoles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission error');
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitDisabled =
    submitting ||
    loading ||
    !form.company_id ||
    !form.first_name?.trim() ||
    !form.last_name?.trim() ||
    !form.email?.trim() ||
    !form.phone?.trim() ||
    !form.group ||
    !form.role;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50/50 to-indigo-50/50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100/80 p-8 md:p-10 backdrop-blur-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4 border border-blue-100">
            <Briefcase className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Candidate Application Form
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Please fill in the details below to submit your application.
          </p>
          <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto mt-4 rounded-full" />
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-start gap-3">
            <span className="text-lg">✅</span>
            <span>Application submitted successfully!</span>
          </div>
        )}
        {loading && (
          <div className="mb-6 text-center text-sm text-gray-500">
            <span className="inline-block animate-spin mr-2">⏳</span> Loading options...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* First & Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label htmlFor="first_name" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <User className="h-4 w-4 text-blue-500" />
                First name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={form.first_name || ''}
                  onChange={handleChange}
                  placeholder="Enter your first name"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
                  required
                />
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="last_name" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <User className="h-4 w-4 text-blue-500" />
                Last name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={form.last_name || ''}
                  onChange={handleChange}
                  placeholder="Enter your last name"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
                  required
                />
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Mail className="h-4 w-4 text-blue-500" />
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                name="email"
                value={form.email || ''}
                onChange={handleChange}
                placeholder="Enter your email address"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
                required
              />
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label htmlFor="phone" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Phone className="h-4 w-4 text-blue-500" />
              Phone <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                id="phone"
                name="phone"
                value={form.phone || ''}
                onChange={handleChange}
                placeholder="Enter your phone number"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
                required
              />
              <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Company */}
          <div className="space-y-1.5">
            <label htmlFor="company_id" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Building className="h-4 w-4 text-blue-500" />
              Company <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="company_id"
                name="company_id"
                value={form.company_id || ''}
                onChange={handleChange}
                disabled={loading || companies.length === 0}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed appearance-none"
                required
              >
                <option value="">Select company</option>
                {companies.map(comp => (
                  <option key={comp.id} value={comp.id}>
                    {comp.company_name || comp.name || `Company ${comp.id}`}
                  </option>
                ))}
              </select>
              <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Group */}
          <div className="space-y-1.5">
            <label htmlFor="group" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Users className="h-4 w-4 text-blue-500" />
              Group <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="group"
                name="group"
                value={form.group || ''}
                onChange={handleChange}
                disabled={!form.company_id || loading || groups.length === 0}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed appearance-none"
                required
              >
                <option value="">Select group</option>
                {groups.map(grp => (
                  <option key={grp.id} value={grp.id}>
                    {grp.group || grp.name || grp.group_name || `Group ${grp.id}`}
                  </option>
                ))}
              </select>
              <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
            {form.company_id && groups.length === 0 && !loading && (
              <p className="mt-1.5 text-xs text-amber-600">No groups available for this company</p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label htmlFor="role" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Briefcase className="h-4 w-4 text-blue-500" />
              Role <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="role"
                name="role"
                value={form.role || ''}
                onChange={handleChange}
                disabled={!form.company_id || loading || roles.length === 0}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed appearance-none"
                required
              >
                <option value="">Select role</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.role || role.name || `Role ${role.id}`}
                  </option>
                ))}
              </select>
              <Briefcase className="absolute left-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
            {form.company_id && roles.length === 0 && !loading && (
              <p className="mt-1.5 text-xs text-amber-600">No roles available for this company</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white font-semibold rounded-xl shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-indigo-600 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="inline-block animate-spin">⏳</span> Submitting...
              </>
            ) : (
              <>
                <Briefcase className="h-5 w-5" /> Submit Application
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-xs text-center text-gray-400">
          All fields are required. Your information will be kept confidential.
        </p>
      </div>
    </main>
  );
}