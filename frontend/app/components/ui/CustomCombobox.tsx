import React, { useState, useEffect, useRef } from "react"
import { Search, X, ChevronDown } from "lucide-react"

interface Option {
  value: string
  label: string
  desc?: string // Extra description line in suggestion
}

interface CustomComboboxProps {
  value: string
  onChange: (val: string) => void
  options: Option[]
  placeholder?: string
  className?: string
  heightClass?: string
  showSearchIcon?: boolean
}

export function CustomCombobox({
  value,
  onChange,
  options,
  placeholder = "Tìm kiếm...",
  className = "",
  heightClass = "h-[34px]",
  showSearchIcon = false
}: CustomComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync input label value with selected option
  const activeOption = options.find(opt => opt.value === value)
  
  useEffect(() => {
    if (activeOption) {
      setInputValue(activeOption.label)
    } else {
      setInputValue("")
    }
  }, [value, activeOption])

  // Handle click outside: close and rollback to active option
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        if (activeOption) {
          setInputValue(activeOption.label)
        } else {
          setInputValue("")
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [activeOption])

  // Filter options based on input
  const filteredOptions = React.useMemo(() => {
    const query = inputValue.trim().toLowerCase()
    // If query matches the active selected label exactly, show all options on focus
    if (activeOption && query === activeOption.label.toLowerCase()) {
      return options
    }
    if (!query) return options
    return options.filter(opt =>
      opt.label.toLowerCase().includes(query) ||
      opt.value.toLowerCase().includes(query) ||
      (opt.desc && opt.desc.toLowerCase().includes(query))
    )
  }, [options, inputValue, activeOption])

  const hasWidth = className.split(" ").some(c => c.startsWith("w-") || c.startsWith("flex-1"))

  return (
    <div ref={containerRef} className={`relative ${hasWidth ? "" : "w-full"} ${className}`}>
      <div className="relative w-full flex items-center">
        {showSearchIcon && (
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        )}
        <input
          type="text"
          value={inputValue}
          onChange={e => {
            setInputValue(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full ${showSearchIcon ? "pl-9" : "pl-3"} pr-10 py-2 border border-gray-200 rounded-xl text-xs text-gray-700 bg-white font-bold focus:outline-none focus:border-[#C62828]/40 ${heightClass}`}
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {inputValue && (
            <button
              type="button"
              onClick={() => {
                setInputValue("")
                setIsOpen(true)
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown size={14} className="text-gray-400 pointer-events-none" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto py-1 divide-y divide-gray-50 animate-in fade-in duration-100">
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-2.5 text-xs text-gray-400 text-center font-bold">Không tìm thấy kết quả</div>
          ) : (
            filteredOptions.slice(0, 15).map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                className={`w-full px-4 py-2.5 text-left text-xs font-bold transition-colors flex justify-between items-center ${value === opt.value ? "bg-[#C62828]/5 text-[#C62828]" : "text-gray-700 hover:bg-gray-50/80 hover:text-[#C62828]"}`}
              >
                <span>{opt.label}</span>
                {opt.desc && (
                  <span className="text-[10px] text-gray-400 font-semibold">{opt.desc}</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
