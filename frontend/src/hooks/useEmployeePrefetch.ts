// app/hooks/useEmployeePrefetch.ts
'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useEmployeeCache } from './useEmployeeCache';

export function useEmployeePrefetch(companyId: number) {
  const { setEmployee } = useEmployeeCache();
  const timeoutRefs = useRef<Map<string, any>>(new Map());

  const prefetchEmployee = useCallback(async (employeeId: string) => {
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          company_id: companyId,
          employee_id: employeeId 
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setEmployee(employeeId, data.data, companyId);
        }
      }
    } catch (error) {
      // Silent fail - prefetch is optional
    }
  }, [companyId, setEmployee]);

  const onHoverStart = useCallback((employeeId: string) => {
    // Clear existing timeout for this employee
    const existingTimeout = timeoutRefs.current.get(employeeId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Start new timeout (delay prefetch by 300ms)
    const timeout = setTimeout(() => {
      prefetchEmployee(employeeId);
      timeoutRefs.current.delete(employeeId);
    }, 300);

    timeoutRefs.current.set(employeeId, timeout);
  }, [prefetchEmployee]);

  const onHoverEnd = useCallback((employeeId: string) => {
    const timeout = timeoutRefs.current.get(employeeId);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(employeeId);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
    };
  }, []);

  return { onHoverStart, onHoverEnd };
}