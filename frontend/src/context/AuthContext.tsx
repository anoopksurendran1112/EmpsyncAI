"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

// ================== TYPES ==================

export type User = {
  prof_img: string;
  first_name: string;
  last_name: string;
  mobile: string;
  role: string;
  is_active: boolean;
  biometric_id: string;
  email: string;
  id: number;
  is_superuser: boolean;
  gender_display: string;
  gender: string;
  is_whatsapp: boolean;
  is_sms: boolean;
  is_wfh: boolean;
  group: string;
  role_id?: number;
  group_id?: number;
};

export type Company = {
  id: number;
  company_name: string;
  company_img: string;
  mediaBaseUrl: string;
  latitude: number;
  longitude: number;
  perimeter: number;
  travel_speed_threshold: number;
  daily_working_hours: number;
  work_summary_interval: string;
  punch_mode: string;
  is_admin: boolean;
};

type AuthContextType = {
  user: User | null;
  company: Company | null;
  isAdmin: boolean | null;
  loading: boolean;
  setAuthData: (user: User, company: Company, isAdmin: boolean) => void;
  switchCompany: (newCompany: Company) => void;
  updateUser: (updatedUser: User) => void; // ✅ ADDED
};

// ================== CONTEXT ==================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ================== PROVIDER ==================

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // ================== LOAD FROM STORAGE ==================
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      const storedCompany = localStorage.getItem("company");
      const storedIsAdmin = localStorage.getItem("isAdmin");

      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedCompany) setCompany(JSON.parse(storedCompany));
      if (storedIsAdmin) setIsAdmin(JSON.parse(storedIsAdmin));
    } catch (error) {
      console.error("Failed to parse auth data from localStorage", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ================== SET AUTH DATA ==================
  const setAuthData = (userData: User, companyData: Company, isAdminData: boolean) => {
    const companyWithDefaultMediaUrl = {
      ...companyData,
      mediaBaseUrl:
        companyData.mediaBaseUrl ||
        process.env.NEXT_PUBLIC_MEDIA_URL ||
        "https://empsyncai.kochi.digital",
    };

    setUser(userData);
    setCompany(companyWithDefaultMediaUrl);
    setIsAdmin(isAdminData);

    try {
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("company", JSON.stringify(companyWithDefaultMediaUrl));
      localStorage.setItem("isAdmin", JSON.stringify(isAdminData));
      document.cookie = `company_id=${companyData.id}; path=/;`;
    } catch (error) {
      console.error("Failed to save auth data to localStorage", error);
    }
  };

  // ================== UPDATE USER (NEW) ==================
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);

    try {
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (error) {
      console.error("Failed to update user in localStorage", error);
    }
  };

  // ================== SWITCH COMPANY ==================
  const switchCompany = async (newCompany: Company) => {
    const companyWithDefaultMediaUrl = {
      ...newCompany,
      mediaBaseUrl:
        newCompany.mediaBaseUrl ||
        process.env.NEXT_PUBLIC_MEDIA_URL ||
        "https://empsyncai.kochi.digital",
    };

    setCompany(companyWithDefaultMediaUrl);
    localStorage.setItem("company", JSON.stringify(companyWithDefaultMediaUrl));
    document.cookie = `company_id=${newCompany.id}; path=/;`;

    try {
      await fetch("/api/update-company-cookie", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ company_id: newCompany.id }),
      });

      console.log("Company switched successfully:", newCompany.company_name);
    } catch (err) {
      console.error("Failed to update company cookie on server:", err);
    }

    fetch("/api/switch-company", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ company_id: newCompany.id }),
    }).catch((err) => console.error("Failed to switch company on server", err));
  };

  // ================== PROVIDER ==================
  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        isAdmin,
        loading,
        setAuthData,
        switchCompany,
        updateUser, // ✅ ADDED HERE
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ================== HOOK ==================

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

/*"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type User = {
  prof_img: string;
  first_name: string;
  last_name: string;
  mobile: string;
  role: string;
  is_active: boolean;
  biometric_id: string;
  email: string;
  id: number;
  is_superuser: boolean;
  gender_display: string;
  gender: string;
  is_whatsapp: boolean;
  is_sms: boolean;
  is_wfh: boolean;
  group: string;
};

export type Company = {
  id: number;
  company_name: string;
  company_img: string;
  latitude: number;
  longitude: number;
  perimeter: number;
  travel_speed_threshold: number;
  daily_working_hours: number;
  work_summary_interval: string;
  punch_mode: string;
  is_admin: boolean;
};

type AuthContextType = {
  user: User | null;
  company: Company | null;
  isAdmin: boolean | null; // Added isAdmin
  loading: boolean; // Added loading state
  setAuthData: (user: User
    ,
     company: Company,
      isAdmin: boolean
    ) => void; // Modified setAuthData
    switchCompany: (newCompany: Company) => void; 
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      const storedCompany = localStorage.getItem("company");
      const storedIsAdmin = localStorage.getItem("isAdmin");

      if (storedUser && storedCompany && storedIsAdmin) {
        setUser(JSON.parse(storedUser));
        setCompany(JSON.parse(storedCompany));
        setIsAdmin(JSON.parse(storedIsAdmin));
      }
    } catch (error) {
      console.error("Failed to parse auth data from localStorage", error);
    } finally {
      setLoading(false);
    }
  }, []);
  

  const setAuthData = (
    userData: User,
    companyData: Company,
    isAdminData: boolean
  ) => {
    setUser(userData);
    setCompany(companyData);
    setIsAdmin(isAdminData);

    try {
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("company", JSON.stringify(companyData));
      localStorage.setItem("isAdmin", JSON.stringify(isAdminData));
    } catch (error) {
      console.error("Failed to save auth data to localStorage", error);
    }
  };

  // ✅ New method: switch company only
  const switchCompany = (newCompany: Company) => {
    setCompany(newCompany);
    localStorage.setItem("company", JSON.stringify(newCompany));
    document.cookie = `company_id=${newCompany.id}; path=/;`;

    // Optional: notify backend
    fetch("/api/switch-company", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_id: newCompany.id }),
    }).catch((err) => console.error("Failed to switch company on server", err));
  };

  return (
    <AuthContext.Provider value={{ user, company, isAdmin, loading, setAuthData, switchCompany }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};*/