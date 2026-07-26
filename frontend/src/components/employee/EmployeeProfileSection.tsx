// frontend/src/components/employee/EmployeeProfileSection.tsx
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmployeeField } from './EmployeeField'
import { useFieldSettings } from '@/hooks/useFieldSettings'

interface EmployeeProfileSectionProps {
  section: string
  title: string
  fields: {
    key: string
    label: string
    type?: 'text' | 'email' | 'tel' | 'date' | 'select'
    options?: { value: string; label: string }[]
    placeholder?: string
  }[]
  data: Record<string, any>
  onFieldChange: (field: string, value: any) => void
  companyId: number
  isEditing?: boolean
}

export function EmployeeProfileSection({
  section,
  title,
  fields,
  data,
  onFieldChange,
  companyId,
  isEditing = false
}: EmployeeProfileSectionProps) {
  const { getVisibleFields, loading } = useFieldSettings(companyId)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.key} className="h-10 w-full bg-gray-100 animate-pulse rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const visibleFieldKeys = getVisibleFields(section)
  
  const visibleFields = fields.filter(f => visibleFieldKeys.includes(f.key))

  if (visibleFields.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {visibleFields.map((field) => (
          <EmployeeField
            key={field.key}
            section={section}
            field={field.key}
            label={field.label}
            value={data[field.key]}
            onChange={(value) => onFieldChange(field.key, value)}
            type={field.type || 'text'}
            options={field.options || []}
            placeholder={field.placeholder || ''}
            companyId={companyId}
          />
        ))}
      </CardContent>
    </Card>
  )
}