import React from "react"

interface Option {
  value: string
  label: string
}

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  className?: string
  placeholder?: string
}

export function CustomSelect({ value, onChange, options, className = "", placeholder = "Chọn..." }: CustomSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      <option value="" disabled className="dark:bg-[#1A1A1E]">
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value} className="dark:bg-[#1A1A1E]">
          {option.label}
        </option>
      ))}
    </select>
  )
}