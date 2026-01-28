// import { NextResponse } from "next/server";
// import { cookies } from "next/headers";
// import * as XLSX from 'xlsx';

// // Helper function to generate Excel response with bold headers
// function generateExcelResponse(data: any[], filename: string) {
//   if (data.length === 0) {
//     return new Response('No data to export', {
//       status: 404,
//       headers: {
//         'Content-Type': 'text/plain',
//       },
//     });
//   }

//   // Get headers from data
//   const headers = Object.keys(data[0]);
  
//   // Create worksheet starting from A1
//   const wsData = [
//     headers, // First row: headers
//     ...data.map(row => headers.map(header => row[header]))
//   ];
  
//   const worksheet = XLSX.utils.aoa_to_sheet(wsData);
  
//   // Define bold style for headers
//   const headerStyle = {
//     font: { bold: true },
//     fill: { fgColor: { rgb: "E0E0E0" } }, // Light gray background
//     alignment: { horizontal: "center", vertical: "center" }
//   };
  
//   // Apply bold style to header row (row 1)
//   const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
//   // Style each header cell
//   for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
//     const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C }); // Row 0 (first row), Column C
//     if (!worksheet[cellAddress]) continue;
    
//     // Apply style to header cell
//     worksheet[cellAddress].s = headerStyle;
    
//     // Auto-size column width based on content
//     const maxWidth = Math.max(
//       headers[C].length,
//       ...data.map(row => String(row[headers[C]] || '').length)
//     );
//     const colWidth = Math.min(Math.max(maxWidth, 10), 50);
    
//     if (!worksheet['!cols']) worksheet['!cols'] = [];
//     worksheet['!cols'][C] = { wch: colWidth };
//   }
  
//   // Create workbook
//   const workbook = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
  
//   // Generate buffer
//   const excelBuffer = XLSX.write(workbook, { 
//     type: 'buffer', 
//     bookType: 'xlsx' 
//   });
  
//   // Create response with headers
//   return new Response(excelBuffer, {
//     headers: {
//       'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//       'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
//       'Content-Length': excelBuffer.length.toString(),
//     },
//   });
// }

// // Fetch ALL employees with pagination
// async function fetchAllEmployees(apiUrl: string, token: string, company_id: string, group?: string): Promise<any[]> {
//   console.log(`📥 Starting bulk download for company ${company_id}`);
  
//   try {
//     let allEmployees: any[] = [];
//     let currentPage = 1;
//     let hasMorePages = true;
//     const pageSize = 100; // Fetch 100 per page for efficiency
    
//     console.log('🔍 Fetching first page to get total count...');
    
//     while (hasMorePages) {
//       try {
//         console.log(`📄 Fetching page ${currentPage}...`);
        
//         const res = await fetch(`${apiUrl}/admin/users/${currentPage}`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({ 
//             company_id, 
//             limit: pageSize,
//             ...(group && { group })
//           }),
//         });

//         if (!res.ok) {
//           console.error(`Failed to fetch page ${currentPage}:`, res.status);
//           break;
//         }

//         const responseData = await res.json();
//         const employees = responseData.data || [];
        
//         console.log(`✅ Page ${currentPage}: ${employees.length} employees`);
        
//         // Add employees to the list
//         allEmployees = [...allEmployees, ...employees];
        
//         // Check if there are more pages
//         const totalPages = responseData.total_page || 1;
//         const totalEmployees = responseData.total || 0;
        
//         console.log(`📊 Total pages: ${totalPages}, Total employees: ${totalEmployees}`);
        
//         if (currentPage >= totalPages || employees.length === 0) {
//           hasMorePages = false;
//           console.log(`✅ Reached end of pages. Total employees fetched: ${allEmployees.length}`);
//         } else {
//           currentPage++;
          
//           // Small delay to avoid rate limiting
//           await new Promise(resolve => setTimeout(resolve, 100));
//         }
        
//       } catch (error) {
//         console.error(`Error fetching page ${currentPage}:`, error);
//         hasMorePages = false;
//       }
//     }
    
//     // Process and enhance employee data with proper column headers
//     const enhancedEmployees = allEmployees.map(emp => ({
//       // Basic Info
//       "Employee ID": emp.id || 'N/A',
//       "Biometric ID": emp.biometric_id || 'N/A',

      
//       // Personal Details
  
//       "Full Name": `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
      
//       // Contact Info
//       "Email": emp.email || 'N/A',
//       "Phone Number": emp.phone_number || emp.phone || emp.mobile || 'N/A',
    
//     }));
    
//     return enhancedEmployees;
//   } catch (error) {
//     console.error("❌ Error fetching all employees:", error);
//     return [];
//   }
// }

// // Handle GET requests for download
// export async function GET(req: Request) {
//   try {
//     const cookieStore = await cookies();
//     const token = cookieStore.get("access_token")?.value;

//     if (!token) {
//       return NextResponse.json({ 
//         success: false, 
//         error: "Unauthorized" 
//       }, { status: 401 });
//     }

//     const url = new URL(req.url);
//     const company_id = url.searchParams.get('company_id') || cookieStore.get("company_id")?.value;
//     const group = url.searchParams.get('group');
//     const format = url.searchParams.get('format') || 'excel';

//     if (!company_id) {
//       return NextResponse.json({ 
//         success: false, 
//         error: "Missing company_id" 
//       }, { status: 400 });
//     }

//     const apiUrl = process.env.API_URL;
//     if (!apiUrl) {
//       return NextResponse.json({ 
//         success: false, 
//         error: "API URL not configured" 
//       }, { status: 500 });
//     }

//     console.log(`📥 Starting bulk download for company ${company_id}...`);
    
//     // Fetch ALL employees (not just one page)
//     const allEmployees = await fetchAllEmployees(apiUrl, token, company_id, group || undefined);
    
//     if (allEmployees.length === 0) {
//       return NextResponse.json({ 
//         success: false, 
//         error: "No employees found" 
//       }, { status: 404 });
//     }
    
//     console.log(`✅ Prepared ${allEmployees.length} employees for download`);
    
//     // Generate filename
//     const dateStr = new Date().toISOString().split('T')[0];
//     let filename = `employees_${dateStr}`;
    
//     if (group) {
//       filename += `_group_${group}`;
//     } else {
//       filename += '_all_employees';
//     }
    
//     if (format === 'json') {
//       return NextResponse.json({
//         success: true,
//         data: allEmployees,
//         count: allEmployees.length,
//         company_id,
//         downloaded_at: new Date().toISOString()
//       });
//     }
    
//     return generateExcelResponse(allEmployees, filename);

//   } catch (err) {
//     console.error("❌ Download error:", err);
//     return NextResponse.json(
//       { success: false, error: "Server error" },
//       { status: 500 }
//     );
//   }
// }