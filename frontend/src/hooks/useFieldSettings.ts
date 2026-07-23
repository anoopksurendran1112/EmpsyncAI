// src/hooks/useFieldSettings.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

interface FieldConfig {
  mandatory: boolean;
}

interface FieldSettings {
  [section: string]: {
    [field: string]: FieldConfig;
  };
}

export function useFieldSettings() {
  const { company } = useAuth();
  const [settings, setSettings] = useState<FieldSettings>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number>(0);

  const fetchSettings = useCallback(async () => {
    if (!company?.id) {
      setLoading(false);
      setSettings({});
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log("🔍 Fetching field settings for company:", company.id);
      
      const res = await fetch(`/api/company-field-setting/?company_id=${company.id}`, {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      console.log("📥 Response status:", res.status);
      
      if (res.status === 404) {
        console.log("ℹ️ No field settings found (404), using empty config");
        setSettings({});
        setLastFetched(Date.now());
        return;
      }
      
      if (!res.ok) {
        
        let errorMessage = `Server error: ${res.status}`;
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
         
          try {
            const text = await res.text();
            if (text) errorMessage = text;
          } catch {
           
          }
        }
        throw new Error(errorMessage);
      }
      
      
      const data = await res.json();
      console.log("📥 Response data:", data);
      
      if (data.success && data.data) {
        
        const configData = data.data.config || {};
        console.log("✅ Settings config:", configData);
        setSettings(configData);
      } else if (data.success && !data.data) {
        console.log("ℹ️ Success but no data, using empty config");
        setSettings({});
      } else {
        console.warn("⚠️ Response indicated failure:", data.message);
        setSettings({});
      }
      
      setLastFetched(Date.now());
      
    } catch (err) {
      console.error('❌ Error fetching field settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load field settings');
     
      setSettings({});
    } finally {
      setLoading(false);
    }
  }, [company?.id]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const isFieldVisible = useCallback((section: string, field: string): boolean => {
    
    const fieldConfig = settings[section]?.[field];
    return fieldConfig !== undefined && fieldConfig !== null;
  }, [settings]);

  const isFieldMandatory = useCallback((section: string, field: string): boolean => {
    const fieldConfig = settings[section]?.[field];
    return fieldConfig?.mandatory || false;
  }, [settings]);

  const getFieldConfig = useCallback((section: string, field: string): FieldConfig | undefined => {
    return settings[section]?.[field];
  }, [settings]);

  const refresh = useCallback(async () => {
    await fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    isFieldVisible,
    isFieldMandatory,
    getFieldConfig,
    refresh,
    lastFetched,
  };
}