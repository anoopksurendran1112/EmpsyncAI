// hooks/employees/useEmployeeCount.ts
import { useState, useEffect } from 'react';

// hooks/employees/useEmployeeCount.ts

export function useEmployeeCount(companyId: number) {
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEmployeeCount() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/employees/count', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            company_id: companyId
          }),
        });

        console.log('🔢 Count API response status:', response.status);

        if (!response.ok) {
          throw new Error(`Failed to fetch employee count: ${response.status}`);
        }

        const data = await response.json();
        console.log('🔢 Count API response data:', data); // This should show {totalEmployees: 13, company_id: 3}
        
        // Debug: Check what we're actually getting
        console.log('🔢 totalEmployees value:', data.totalEmployees);
        console.log('🔢 totalEmployees type:', typeof data.totalEmployees);
        
        if (typeof data.totalEmployees === 'number') {
          console.log('🔢 Setting count to:', data.totalEmployees);
          setCount(data.totalEmployees);
        } else {
          console.warn('🔢 Unexpected totalEmployees value:', data.totalEmployees);
          setCount(0);
        }
      } catch (err) {
        console.error('🔢 Error in useEmployeeCount:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch employee count');
        setCount(0);
      } finally {
        setIsLoading(false);
      }
    }

    if (companyId) {
      fetchEmployeeCount();
    } else {
      setIsLoading(false);
      setCount(0);
    }
  }, [companyId]);

  return { count, isLoading, error };
}