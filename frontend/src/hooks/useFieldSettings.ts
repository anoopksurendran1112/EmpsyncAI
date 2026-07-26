// frontend/src/hooks/useFieldSettings.ts
import { useState, useEffect, useCallback } from 'react'

interface FieldConfig {
  visible: boolean
  mandatory: boolean
}

interface SectionConfig {
  [field: string]: FieldConfig
}

interface FieldSettings {
  [section: string]: SectionConfig
}

export function useFieldSettings(companyId: number | null) {
  const [settings, setSettings] = useState<FieldSettings>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    if (!companyId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/company-field-setting/?company_id=${companyId}`)
      
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.data) {
          setSettings(data.data.config || {})
        } else {
          setSettings({})
        }
      } else {
        setSettings({})
      }
    } catch (err) {
      console.error('Error fetching field settings:', err)
      setError('Failed to load field settings')
      setSettings({})
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const isFieldVisible = useCallback((section: string, field: string): boolean => {
    return settings[section]?.[field]?.visible ?? false
  }, [settings])

  const isFieldMandatory = useCallback((section: string, field: string): boolean => {
    return settings[section]?.[field]?.mandatory ?? false
  }, [settings])

  const getVisibleFields = useCallback((section: string): string[] => {
    if (!settings[section]) return []
    return Object.keys(settings[section]).filter(field => settings[section][field].visible)
  }, [settings])

  const getSectionFields = useCallback((section: string): { field: string; config: FieldConfig }[] => {
    if (!settings[section]) return []
    return Object.entries(settings[section])
      .filter(([_, config]) => config.visible)
      .map(([field, config]) => ({ field, config }))
  }, [settings])

  return {
    settings,
    loading,
    error,
    isFieldVisible,
    isFieldMandatory,
    getVisibleFields,
    getSectionFields,
    refetch: fetchSettings
  }
}