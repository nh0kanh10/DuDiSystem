import React from "react"

interface CustomDatePickerProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}

export function CustomDatePicker({ value, onChange, className = "", placeholder = "dd/mm/yyyy" }: CustomDatePickerProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    if (inputValue) {
      // Convert from YYYY-MM-DD to DD/MM/YYYY
      const [year, month, day] = inputValue.split('-')
      const vnDate = `${day}/${month}/${year}`
      onChange(vnDate)
    } else {
      onChange("")
    }
  }

  // Convert from DD/MM/YYYY to YYYY-MM-DD for input
  const inputValue = value ? (() => {
    try {
      const [day, month, year] = value.split('/')
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    } catch {
      return ""
    }
  })() : ""

  return (
    <input
      type="date"
      value={inputValue}
      onChange={handleChange}
      className={className}
      placeholder={placeholder}
    />
  )
}

interface CustomDateTimePickerProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function CustomDateTimePicker({ value, onChange, className = "" }: CustomDateTimePickerProps) {
  return (
    <input
      type="datetime-local"
      value={value}
      onChange={e => onChange(e.target.value)}
      className={className}
    />
  )
}