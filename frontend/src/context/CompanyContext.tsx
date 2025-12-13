"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type Company = {
  id: number;
  company_name: string;
  mediaBaseUrl: string; // base URL for media/images
};

type CompanyContextType = {
  currentCompany: Company;
  setCurrentCompany: (company: Company) => void;
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const [currentCompany, setCurrentCompany] = useState<Company>({
    id: 1,
    company_name: "Default Company",
    mediaBaseUrl: "https://empsyncai.kochi.digital", // default URL
  });

  return (
    <CompanyContext.Provider value={{ currentCompany, setCurrentCompany }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) throw new Error("useCompany must be used within a CompanyProvider");
  return context;
};

