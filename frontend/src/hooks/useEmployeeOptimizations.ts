// app/hooks/useEmployeeOptimizations.ts
'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useEmployeeCache } from './useEmployeeCache';

export function useEmployeeOptimizations(companyId: number) {
  const router = useRouter();
  const { getEmployee, setEmployee } = useEmployeeCache();

  const handleEmployeeClick = useCallback(async (employee: { id: string | number; predictedPage?: number }, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const employeeId = employee.id.toString();
    
    console.log(`🔍 Clicking employee: ${employeeId} (Predicted page: ${employee.predictedPage})`);
    
    try {
      // 1. INSTANT: Check cache first
      const cachedEmployee = getEmployee(employeeId, companyId);
      if (cachedEmployee) {
        console.log('⚡ Instant from cache!');
        router.push(`/dashboard/employees/${employeeId}`);
        return;
      }
      
      // 2. FAST: Try direct API lookup
      const startTime = Date.now();
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          company_id: companyId,
          employee_id: employeeId 
        }),
      });
      
      const data = await response.json();
      const searchTime = Date.now() - startTime;
      
      if (data.success && data.data) {
        console.log(`✅ Found in ${searchTime}ms`);
        
        // Cache for future clicks
        setEmployee(employeeId, data.data, companyId);
        router.push(`/dashboard/employees/${employeeId}`);
      } else {
        console.error('Employee not found via API');
        // Fallback to regular navigation
        router.push(`/dashboard/employees/${employeeId}`);
      }
    } catch (error) {
      console.error('Failed to fetch employee:', error);
      // Fallback to regular navigation
      router.push(`/dashboard/employees/${employeeId}`);
    }
  }, [companyId, getEmployee, setEmployee, router]);

  return { handleEmployeeClick };
}