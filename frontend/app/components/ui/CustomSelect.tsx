import React, { useState, useEffect, useRef } from "react"
import { ChevronDown, Search } from "lucide-react"

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
  searchable?: boolean
  placeholder?: string
}

export function CustomSelect({
  value,
  onChange,
  options,
  disabled = false,
  className = "",
  heightClass = "h-[34px]",
  searchable = false,
  placeholder = "Chọn..."
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("")
    } else if (searchable) {
      // Focus search input when dropdown opens
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    }
  }, [isOpen, searchable])

  const selectedOption = options.find(opt => opt.value === value)

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const hasWidth = className.split(" ").some(c => c.startsWith("w-") || c.startsWith("flex-1"))

  return (
    <div ref={containerRef} className={`relative ${hasWidth ? "" : "w-full"} ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(p => !p)}
        className={`w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-700 bg-white font-bold ${heightClass} focus:outline-none focus:border-[#C62828]/40 hover:bg-gray-50/50 transition-colors disabled:bg-gray-50 disabled:text-gray-400 text-left`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={14} className="text-gray-400 pointer-events-none flex-shrink-0 ml-1" />
      </button>
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 flex flex-col max-h-60 overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-gray-100 bg-gray-50 flex items-center relative">
              <Search size={12} className="absolute left-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Nhập từ khóa tìm kiếm..."
                className="w-full pl-7 pr-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#C62828]/40 bg-white text-gray-700 font-medium"
                onClick={e => e.stopPropagation()}
              />
            </div>
          )}
          <div className="overflow-y-auto py-1 divide-y divide-gray-50 flex-1" style={{ scrollbarWidth: "thin" }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
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
              ))
            ) : (
              <div className="px-4 py-3 text-xs text-gray-400 text-center font-medium">Không tìm thấy kết quả</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
