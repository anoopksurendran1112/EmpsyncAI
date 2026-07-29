// frontend/src/components/employee/EmployeeField.tsx
import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFieldSettings } from '@/hooks/useFieldSettings'

interface EmployeeFieldProps {
  section: string
  field: string
  label: string
  value: any
  onChange: (value: any) => void
  type?: 'text' | 'email' | 'tel' | 'date' | 'select'
  options?: { value: string; label: string }[]
  placeholder?: string
  companyId: number
  className?: string
}

export function EmployeeField({
  section,
  field,
  label,
  value,
  onChange,
  type = 'text',
  options = [],
  placeholder = '',
  companyId,
  className = ''
}: EmployeeFieldProps) {
  const { isFieldVisible, isFieldMandatory, loading } = useFieldSettings(companyId)

  if (loading) {
    return <div className="h-10 w-full bg-gray-100 animate-pulse rounded"></div>
  }

  if (!isFieldVisible(section, field)) {
    return null
  }

  const isRequired = isFieldMandatory(section, field)

  const renderField = () => {
    switch (type) {
      case 'select':
        return (
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger className={className}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      default:
        return (
          <Input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={className}
          />
        )
    }
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1">
        {label}
        {isRequired && <span className="text-red-500 text-sm">*</span>}
      </Label>
      {renderField()}
      {isRequired && (
        <p className="text-xs text-gray-500">This field is required</p>
      )}
    </div>
  )
}