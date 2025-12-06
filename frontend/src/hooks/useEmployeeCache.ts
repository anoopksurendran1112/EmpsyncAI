// app/hooks/useEmployeeCache.ts
'use client';

import { useCallback } from 'react';

// In-memory cache for instant employee lookup
class EmployeeCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

// Global cache instance
export const globalEmployeeCache = new EmployeeCache();

export function useEmployeeCache() {
  const getEmployee = useCallback((employeeId: string, companyId?: string | number): any | null => {
    const key = companyId ? `emp-${companyId}-${employeeId}` : `emp-${employeeId}`;
    return globalEmployeeCache.get(key);
  }, []);

  const setEmployee = useCallback((employeeId: string, data: any, companyId?: string | number): void => {
    const key = companyId ? `emp-${companyId}-${employeeId}` : `emp-${employeeId}`;
    globalEmployeeCache.set(key, data);
  }, []);

  return { getEmployee, setEmployee };
}