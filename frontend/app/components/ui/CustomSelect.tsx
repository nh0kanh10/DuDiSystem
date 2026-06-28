import React, { useState, useEffect, useRef } from "react"
import { ChevronDown } from "lucide-react"

interface Option {
  value: string
  label: string
}

interface CustomSelectProps {
  value: string
  onChange: (val: string) => void
  options: Option[]
  disabled?: boolean
  className?: string
  heightClass?: string
}

export function CustomSelect({
  value,
  onChange,
  options,
  disabled = false,
  className = "",
  heightClass = "h-[34px]"
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const selectedOption = options.find(opt => opt.value === value)

  const hasWidth = className.split(" ").some(c => c.startsWith("w-") || c.startsWith("flex-1"))

  return (
    <div ref={containerRef} className={`relative ${hasWidth ? "" : "w-full"} ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(p => !p)}
        className={`w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-700 bg-white font-bold ${heightClass} focus:outline-none focus:border-[#C62828]/40 hover:bg-gray-50/50 transition-colors disabled:bg-gray-50 disabled:text-gray-400 text-left`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : "Chọn..."}</span>
        <ChevronDown size={14} className="text-gray-400 pointer-events-none flex-shrink-0 ml-1" />
      </button>
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto py-1 divide-y divide-gray-50">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value)
                setIsOpen(false)
              }}
              className={`w-full px-4 py-2.5 text-left text-xs font-bold transition-colors block truncate ${value === opt.value ? "bg-[#C62828]/5 text-[#C62828]" : "text-gray-700 hover:bg-gray-50"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
