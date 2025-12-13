"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import { Building2 } from "lucide-react";

export function SwitchCompanyButton() {
  const [companies, setCompanies] = useState<{ id: string; name: string; logo?: string }[]>([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [imageError, setImageError] = useState(false);
  const { switchCompany, company } = useAuth();

  // Set selected company when component mounts or when company changes
  useEffect(() => {
    if (company?.id) {
      setSelectedCompany(company.id.toString());
    }
  }, [company]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch("/api/companies", { method: "GET" });
        const data = await res.json();

        console.log("Companies API response:", data);

        if (Array.isArray(data?.data)) {
          const companiesData = data.data.map((c: any) => ({
            id: c.id?.toString() || c.company_id?.toString(),
            name: c.name || c.company_name || "Unnamed Company",
            logo: c.company_img || c.logo || c.image_url || null,
          }));
          
          console.log("Processed companies with logos:", companiesData);
          setCompanies(companiesData);
        } else {
          console.error("Unexpected companies response:", data);
          setCompanies([]);
        }
      } catch (err) {
        console.error("Failed to fetch companies:", err);
        setCompanies([]);
      }
    };

    fetchCompanies();
  }, []);

  const getLogoUrl = () => {
    const currentCompanyObj = companies.find(c => c.id === selectedCompany);
    
    if (currentCompanyObj?.logo) {
      return currentCompanyObj.logo.startsWith("http")
        ? currentCompanyObj.logo
        : `${company?.mediaBaseUrl}${currentCompanyObj.logo}`;
    }
    return `${company?.mediaBaseUrl}/media/default_company.png`;
  };

  const handleSwitch = async () => {
    if (!selectedCompany) return;

    const companyObj = companies.find((c) => c.id === selectedCompany);
    if (!companyObj) return;

    try {
      // FIRST: Update the company cookie
      console.log('🔄 Updating company cookie to:', selectedCompany);
      const cookieResponse = await fetch('/api/update-company-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: selectedCompany }),
      });

      const cookieResult = await cookieResponse.json();
      
      if (!cookieResult.success) {
        console.error('❌ Failed to update company cookie');
        return;
      }

      console.log('✅ Company cookie updated successfully');

      // THEN: Update AuthContext
      switchCompany({
        id: Number(companyObj.id),
        company_name: companyObj.name,
        company_img: companyObj.logo || "",
        mediaBaseUrl: company?.mediaBaseUrl || "https://empsyncai.kochi.digital",
        latitude: 0,
        longitude: 0,
        perimeter: 0,
        travel_speed_threshold: 0,
        daily_working_hours: 0,
        work_summary_interval: "",
        punch_mode: "",
        is_admin: false,
      });

      // FINALLY: Reload the page to ensure all components use the new company
      console.log('🔄 Reloading page to apply company change...');
      setTimeout(() => {
        window.location.reload();
      }, 500); // Small delay to ensure cookie is set

    } catch (error) {
      console.error('❌ Error switching company:', error);
    }
  };

  // Get current company object
  const currentCompany = companies.find(c => c.id === selectedCompany);
  const showLogo = currentCompany?.logo && !imageError;

  console.log("Current company:", currentCompany);
  console.log("Logo URL:", getLogoUrl());
  console.log("Show logo:", showLogo);

  return (
    <div className="flex items-center space-x-2">
      {/* Current Company Logo Only (without name) - Using same pattern as EmployeeBanner */}
      {currentCompany && (
        <div className="h-8 w-8 rounded overflow-hidden border bg-white flex items-center justify-center">
          {showLogo ? (
            <div className="relative h-8 w-8 rounded overflow-hidden">
              <Image
                src={getLogoUrl()}
                alt="Company Logo"
                fill
                className="object-cover w-full h-full"
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center">
              <Building2 className="h-4 w-4 text-gray-500" />
            </div>
          )}
        </div>
      )}

      {/* Company Selector with company names in dropdown */}
      <select
        value={selectedCompany}
        onChange={(e) => {
          setSelectedCompany(e.target.value);
          setImageError(false); // Reset image error when company changes
        }}
        className="border p-2 rounded min-w-[150px]"
      >
        <option value="">Select Company</option>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      
      {/* Switch Company Button (Teal) */}
      <Button 
        onClick={handleSwitch} 
        className="bg-teal-600 hover:bg-teal-700 text-white"
        size="sm"
        disabled={!selectedCompany}
      >
        Switch
      </Button>
    </div>
  );
}


// "use client";

// import { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { useAuth } from "@/context/AuthContext";
// import Image from "next/image";
// import { Building2 } from "lucide-react";

// export function SwitchCompanyButton() {
//   const [companies, setCompanies] = useState<{ id: string; name: string; logo?: string }[]>([]);
//   const [selectedCompany, setSelectedCompany] = useState("");
//   const [imageError, setImageError] = useState(false);
//   const { switchCompany, company } = useAuth();

//   // Set selected company when component mounts or when company changes
//   useEffect(() => {
//     if (company?.id) {
//       setSelectedCompany(company.id.toString());
//     }
//   }, [company]);

//   useEffect(() => {
//     const fetchCompanies = async () => {
//       try {
//         const res = await fetch("/api/companies", { method: "GET" });
//         const data = await res.json();

//         console.log("Companies API response:", data);

//         if (Array.isArray(data?.data)) {
//           const companiesData = data.data.map((c: any) => ({
//             id: c.id?.toString() || c.company_id?.toString(),
//             name: c.name || c.company_name || "Unnamed Company",
//             logo: c.company_img || c.logo || c.image_url || null,
//           }));
          
//           console.log("Processed companies with logos:", companiesData);
//           setCompanies(companiesData);
//         } else {
//           console.error("Unexpected companies response:", data);
//           setCompanies([]);
//         }
//       } catch (err) {
//         console.error("Failed to fetch companies:", err);
//         setCompanies([]);
//       }
//     };

//     fetchCompanies();
//   }, []);

//   const getLogoUrl = () => {
//     const currentCompanyObj = companies.find(c => c.id === selectedCompany);
    
//     if (currentCompanyObj?.logo) {
//       return currentCompanyObj.logo.startsWith("http")
//         ? currentCompanyObj.logo
//         : `${company?.mediaBaseUrl}${currentCompanyObj.logo}`;
//     }
//     return `${company?.mediaBaseUrl}/media/default_company.png`;
//   };

//   const handleSwitch = () => {
//     if (!selectedCompany) return;

//     const companyObj = companies.find((c) => c.id === selectedCompany);
//     if (!companyObj) return;

//     switchCompany({
//       id: Number(companyObj.id),
//       company_name: companyObj.name,
//       company_img: companyObj.logo || "",
//       mediaBaseUrl: company?.mediaBaseUrl || "https://empsyncai.kochi.digital",
//       latitude: 0,
//       longitude: 0,
//       perimeter: 0,
//       travel_speed_threshold: 0,
//       daily_working_hours: 0,
//       work_summary_interval: "",
//       punch_mode: "",
//       is_admin: false,
//     });

//     window.location.reload();
//   };

//   // Get current company object
//   const currentCompany = companies.find(c => c.id === selectedCompany);
//   const showLogo = currentCompany?.logo && !imageError;

//   console.log("Current company:", currentCompany);
//   console.log("Logo URL:", getLogoUrl());
//   console.log("Show logo:", showLogo);

//   return (
//     <div className="flex items-center space-x-2">
//       {/* Current Company Logo Only (without name) - Using same pattern as EmployeeBanner */}
//       {currentCompany && (
//         <div className="h-8 w-8 rounded overflow-hidden border bg-white flex items-center justify-center">
//           {showLogo ? (
//             <div className="relative h-8 w-8 rounded overflow-hidden">
//               <Image
//                 src={getLogoUrl()}
//                 alt="Company Logo"
//                 fill
//                 className="object-cover w-full h-full"
//                 onError={() => setImageError(true)}
//               />
//             </div>
//           ) : (
//             <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center">
//               <Building2 className="h-4 w-4 text-gray-500" />
//             </div>
//           )}
//         </div>
//       )}

//       {/* Company Selector with company names in dropdown */}
//       <select
//         value={selectedCompany}
//         onChange={(e) => {
//           setSelectedCompany(e.target.value);
//           setImageError(false); // Reset image error when company changes
//         }}
//         className="border p-2 rounded min-w-[150px]"
//       >
//         <option value="">Select Company</option>
//         {companies.map((c) => (
//           <option key={c.id} value={c.id}>
//             {c.name}
//           </option>
//         ))}
//       </select>
      
//    {/* Switch Company Button (Teal) */}
//   <Button 
//     onClick={handleSwitch} 
//     className="bg-teal-600 hover:bg-teal-700 text-white"
//     size="sm"
//   >
//     Switch
//   </Button>
//     </div>
//   );
// }