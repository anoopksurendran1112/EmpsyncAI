// app/api/employees/group_filter/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Simple in-memory cache with TTL (Time To Live)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const company_id = body.company_id || cookieStore.get("company_id")?.value;
    const employee_id = body.employee_id;
    const group_id = body.group_id ? Number(body.group_id) : undefined;
    const search = body.searchQuery || body.search || ""; // Handle both searchQuery and search
    const page = body.page || 1;
    const limit = body.limit || 50;
    const gender = body.gender;
    const is_active = body.is_active;
    const groups = body.groups || [];
    const avg_hour_filter = body.avg_hour_filter;
    const single_employee = body.single_employee; // ✅ NEW: Flag for single employee request

    if (!company_id) {
      return NextResponse.json(
        { success: false, error: "company_id is required" },
        { status: 400 }
      );
    }

    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      console.error("❌ API_URL environment variable is not defined");
      return NextResponse.json(
        { success: false, error: "API_URL is not defined in environment variables" },
        { status: 500 }
      );
    }
    
    // ✅ IMPROVED: Handle individual employee lookup with consistent response
    if (employee_id || single_employee) {
      const targetEmployeeId = employee_id || body.id;
      
      if (!targetEmployeeId) {
        return NextResponse.json({ 
          success: false, 
          error: "Employee ID is required for single employee lookup" 
        }, { status: 400 });
      }
      
      console.log(`🔍 [Group Filter] Searching for employee ID: ${targetEmployeeId} in company ${company_id}`);
      
      // Try cache first
      const cacheKey = `employee-groupfilter-${company_id}-${targetEmployeeId}`;
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`✅ [Group Filter] Found employee in cache`);
        // ✅ RETURN CONSISTENT STRUCTURE
        return NextResponse.json({ 
          success: true,
          company_id,
          employees: [cached.data], // Wrap in array for consistency
          data: cached.data, // Also keep for backward compatibility
          totalEmployees: 1,
          totalPages: 1,
          totalCount: 1,
          page: 1,
          hasNextPage: false,
          hasPrevPage: false
        });
      }
      
      // Efficient search
      const employee = await findEmployeeOptimized(apiUrl, token, company_id, targetEmployeeId);
      if (employee) {
        // Cache the result
        cache.set(cacheKey, {
          data: employee,
          timestamp: Date.now()
        });
        console.log(`✅ [Group Filter] Employee found: ${employee.first_name} ${employee.last_name}`);
        
        // ✅ RETURN CONSISTENT STRUCTURE
        return NextResponse.json({ 
          success: true,
          company_id,
          employees: [employee], // Wrap in array for consistency
          data: employee, // Also keep for backward compatibility
          totalEmployees: 1,
          totalPages: 1,
          totalCount: 1,
          page: 1,
          hasNextPage: false,
          hasPrevPage: false
        });
      }
      
      console.log(`❌ [Group Filter] Employee ${targetEmployeeId} not found in company ${company_id}`);
      return NextResponse.json({ 
        success: false, 
        error: "Employee not found" 
      }, { status: 404 });
    }

    // ✅ SAME PATTERN: For paginated requests with filters
    console.log(`📋 [Group Filter] Fetching paginated employees with filters:`);
    console.log(`   - Company: ${company_id}`);
    console.log(`   - Page: ${page}, Limit: ${limit}`);
    console.log(`   - Search: "${search}"`);
    console.log(`   - Group ID: ${group_id || 'None'}`);
    console.log(`   - Gender: ${gender || 'All'}`);
    console.log(`   - Active Status: ${is_active !== undefined ? is_active : 'All'}`);
    console.log(`   - Groups Array: ${groups.length > 0 ? groups.join(', ') : 'None'}`);
    console.log(`   - Avg Hour Filter: ${avg_hour_filter || 'None'}`);
    
    const url = `${apiUrl}/admin/users/${page}`;

    // Build request payload
    const requestPayload: any = {
      company_id: company_id,
      limit: limit
    };

    // Add filters
    if (group_id) {
      requestPayload.groups = [group_id];
    }
    if (search && search.trim() !== "") {
      requestPayload.search = search.trim();
    }
    if (gender) {
      requestPayload.gender = gender;
    }
    if (is_active !== undefined) {
      requestPayload.is_active = is_active;
    }
    if (groups.length > 0) {
      requestPayload.groups = groups;
    }
    if (avg_hour_filter) {
      requestPayload.avg_hour_filter = avg_hour_filter;
    }

    console.log("📤 [Group Filter] Sending payload to backend:", JSON.stringify(requestPayload, null, 2));

    const startTime = Date.now();
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestPayload),
      cache: "no-store",
    });

    console.log(`🔍 [Group Filter] Backend Response Status: ${res.status}`);
    console.log(`🔍 [Group Filter] Backend Response OK: ${res.ok}`);

    if (!res.ok) {
      let errorBody = "";
      try {
        errorBody = await res.text();
        console.error("❌ [Group Filter] Backend error response body:", errorBody);
      } catch (e) {
        console.error("❌ [Group Filter] Could not read error response body");
      }
      
      return NextResponse.json(
        {
          success: false,
          error: `Backend error: ${res.status} - ${res.statusText}`,
          details: errorBody || 'No additional details'
        },
        { status: res.status }
      );
    }

    const data = await res.json();
    let employees = data.data || [];
    
    console.log("✅ [Group Filter] Backend response data received");
    console.log("   - Total employees:", data.total);
    console.log("   - Total pages:", data.total_page);
    console.log("   - Current page:", data.page);
    console.log("   - Male count:", data.male_count);
    console.log("   - Female count:", data.female_count);
    console.log("   - Others count:", data.others_count);
    console.log("   - Data length:", employees.length);

    const fetchTime = Date.now() - startTime;
    console.log(`📊 [Group Filter] Page ${page}: ${employees.length} employees (${fetchTime}ms)`);
    
    // ✅ SAME PATTERN: Cache page 1 only when no filters are applied
    const hasFilters = search || group_id || gender || is_active !== undefined || groups.length > 0 || avg_hour_filter;
    if (page === 1 && employees.length > 0 && !hasFilters) {
      const pageCacheKey = `company-groupfilter-${company_id}-page1`;
      cache.set(pageCacheKey, {
        data: employees,
        timestamp: Date.now()
      });
      console.log(`💾 [Group Filter] Cached page 1 with ${employees.length} employees`);
    }

    // ✅ SAME PATTERN: Calculate total pages
    let totalPages = data.total_page || 1;
    let totalEmployees = data.total || data.total_count || 0;

    // ✅ RETURN CONSISTENT STRUCTURE
    return NextResponse.json({
      success: true,
      company_id,
      group_id,
      search,
      page: page,
      totalPages: totalPages,
      totalEmployees: totalEmployees,
      totalCount: totalEmployees,
      maleCount: data.male_count || 0,
      femaleCount: data.female_count || 0,
      othersCount: data.others_count || 0,
      employees: employees, // Main array of employees
      data: employees, // Also include for backward compatibility
      message: data.message,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      appliedFilters: {
        search,
        group_id,
        gender,
        is_active,
        groups,
        avg_hour_filter
      }
    });
  } catch (err) {
    console.error("❌ [Group Filter] Employees Filter API Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: err instanceof Error ? err.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ✅ OPTIONAL: You can also add a GET method for direct employee access
export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const company_id = searchParams.get('company_id') || cookieStore.get("company_id")?.value;
    const employee_id = searchParams.get('employee_id') || searchParams.get('id');
    const group_id = searchParams.get('group_id');

    if (!company_id || !employee_id) {
      return NextResponse.json(
        { success: false, error: "company_id and employee_id are required" },
        { status: 400 }
      );
    }

    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      console.error("❌ API_URL environment variable is not defined");
      return NextResponse.json(
        { success: false, error: "API_URL is not defined in environment variables" },
        { status: 500 }
      );
    }

    console.log(`🔍 [Group Filter GET] Fetching employee ID: ${employee_id} in company ${company_id}`);
    
    const cacheKey = `employee-groupfilter-${company_id}-${employee_id}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`✅ [Group Filter GET] Found employee in cache`);
      return NextResponse.json({ 
        success: true,
        company_id,
        employees: [cached.data],
        data: cached.data,
        totalEmployees: 1,
        totalPages: 1,
        page: 1,
        hasNextPage: false,
        hasPrevPage: false
      });
    }

    const employee = await findEmployeeOptimized(apiUrl, token, company_id, employee_id);
    if (employee) {
      cache.set(cacheKey, {
        data: employee,
        timestamp: Date.now()
      });
      
      console.log(`✅ [Group Filter GET] Employee found: ${employee.first_name} ${employee.last_name}`);
      return NextResponse.json({ 
        success: true,
        company_id,
        employees: [employee],
        data: employee,
        totalEmployees: 1,
        totalPages: 1,
        page: 1,
        hasNextPage: false,
        hasPrevPage: false
      });
    }

    console.log(`❌ [Group Filter GET] Employee ${employee_id} not found`);
    return NextResponse.json({ 
      success: false, 
      error: "Employee not found" 
    }, { status: 404 });

  } catch (err) {
    console.error("❌ [Group Filter GET] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: err instanceof Error ? err.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ✅ SAME PATTERN: Optimized employee search with better logging
async function findEmployeeOptimized(
  apiUrl: string, 
  token: string, 
  company_id: string, 
  employee_id: string
): Promise<any> {
  
  console.log(`🔍 [Group Filter] Starting optimized search for employee ${employee_id}`);
  
  // Strategy 1: Check cached page 1 first
  const page1CacheKey = `company-groupfilter-${company_id}-page1`;
  const cachedPage1 = cache.get(page1CacheKey);
  if (cachedPage1 && Date.now() - cachedPage1.timestamp < CACHE_TTL) {
    const employee = cachedPage1.data.find((emp: any) => 
      emp.id.toString() === employee_id || 
      emp.biometric_id?.toString() === employee_id
    );
    if (employee) {
      console.log(`✅ [Group Filter] Found in page 1 cache`);
      return employee;
    }
  }
  
  // Strategy 2: Smart page search - check first 3 pages (most employees are here)
  const pagesToCheck = [1, 2, 3];
  let totalPages = 1;
  
  for (const page of pagesToCheck) {
    console.log(`📄 [Group Filter] Searching page ${page} for employee ${employee_id}`);
    
    try {
      const fetchUrl = `${apiUrl}/admin/users/${page}`;
      const res = await fetch(fetchUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ company_id, limit: 100 }),
        cache: "no-store",
      });

      if (!res.ok) {
        console.log(`❌ [Group Filter] Page ${page} fetch failed: ${res.status}`);
        continue;
      }

      const responseData = await res.json();
      const employees = responseData.data || [];
      
      if (page === 1) {
        totalPages = responseData.total_page || 1;
        console.log(`📑 [Group Filter] Total pages: ${totalPages}`);
        
        // If total pages is large, add last few pages to search
        if (totalPages > 5) {
          // Add last 2 pages for employees who joined recently
          pagesToCheck.push(totalPages);
          if (totalPages > 1) pagesToCheck.push(totalPages - 1);
          console.log(`➕ [Group Filter] Added pages ${totalPages - 1}, ${totalPages} to search`);
        }
      }
      
      // Search for employee with multiple ID fields
      const employee = employees.find((emp: any) => 
        emp.id.toString() === employee_id || 
        emp.biometric_id?.toString() === employee_id ||
        emp.employee_id?.toString() === employee_id
      );
      
      if (employee) {
        console.log(`🎯 [Group Filter] FOUND on page ${page}: ${employee.first_name} ${employee.last_name}`);
        return employee;
      }
      
      // If we have many pages and didn't find in first 3, do targeted search
      if (page === 3 && totalPages > 10) {
        console.log(`⚡ [Group Filter] Many pages detected (${totalPages}), using targeted search`);
        const found = await targetedPageSearch(apiUrl, token, company_id, employee_id, totalPages);
        if (found) return found;
      }
    } catch (error) {
      console.error(`❌ [Group Filter] Error searching page ${page}:`, error);
      continue;
    }
  }
  
  console.log(`❌ [Group Filter] Employee ${employee_id} not found in any searched pages`);
  return null;
}

// ✅ SAME PATTERN: More efficient targeted search instead of binary search
async function targetedPageSearch(
  apiUrl: string,
  token: string,
  company_id: string,
  employee_id: string,
  totalPages: number
): Promise<any> {
  // Strategy: Check pages in chunks to find the employee faster
  const chunkSize = 5;
  const maxPagesToCheck = 10; // Don't check more than 10 pages total
  
  console.log(`🎯 [Group Filter] Starting targeted search across ${totalPages} pages`);
  
  // Create chunks of pages to check
  const chunks = [];
  for (let i = 4; i <= Math.min(totalPages, maxPagesToCheck + 3); i += chunkSize) {
    const chunk = [];
    for (let j = i; j < i + chunkSize && j <= totalPages; j++) {
      chunk.push(j);
    }
    if (chunk.length > 0) chunks.push(chunk);
  }
  
  // Search through chunks
  for (const chunk of chunks) {
    console.log(`🔍 [Group Filter] Checking pages: ${chunk.join(', ')}`);
    
    // Check pages in parallel for faster search
    const promises = chunk.map(async (page) => {
      try {
        const fetchUrl = `${apiUrl}/admin/users/${page}`;
        const res = await fetch(fetchUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ company_id, limit: 100 }),
          cache: "no-store",
        });

        if (!res.ok) return null;

        const responseData = await res.json();
        const employees = responseData.data || [];
        
        return employees.find((emp: any) => 
          emp.id.toString() === employee_id || 
          emp.biometric_id?.toString() === employee_id ||
          emp.employee_id?.toString() === employee_id
        ) || null;
      } catch (error) {
        console.error(`❌ [Group Filter] Error checking page ${page}:`, error);
        return null;
      }
    });
    
    const results = await Promise.all(promises);
    const foundEmployee = results.find(emp => emp !== null);
    
    if (foundEmployee) {
      console.log(`🎯 [Group Filter] FOUND during targeted search: ${foundEmployee.first_name} ${foundEmployee.last_name}`);
      return foundEmployee;
    }
  }
  
  console.log(`❌ [Group Filter] Employee not found in targeted search`);
  return null;
}

// ✅ SAME PATTERN: Cache cleanup function
function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}

// Run cleanup occasionally (every 10 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupCache, 10 * 60 * 1000);
}