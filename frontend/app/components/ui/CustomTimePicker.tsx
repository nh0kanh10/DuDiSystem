import React, { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Clock } from "lucide-react"

export interface CustomTimePickerProps {
  value: string // Expected format: "HH:mm" or "--"
  onChange: (val: string) => void
  disabled?: boolean
  className?: string
}

export function CustomTimePicker({ value, onChange, disabled = false, className = "" }: CustomTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 192 })

  const displayVal = !value || value === "--" ? "--" : value
  const activeVal = !value || value === "--" ? "00:00" : value
  const [hourStr, minStr] = activeVal.split(":")

  const [typedValue, setTypedValue] = useState(displayVal)

  useEffect(() => {
    setTypedValue(displayVal)
  }, [displayVal])

  const updateDropdownPosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setDropdownPos({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX + (rect.width - 192) / 2,
        width: 192
      })
    }
  }

  const openPicker = () => {
    if (disabled) return
    updateDropdownPosition()
    setIsOpen(true)
  }

  const closePicker = () => {
    setIsOpen(false)
  }

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    openPicker()
    if (typedValue === "--") {
      setTypedValue("")
    } else {
      e.currentTarget.select()
    }
  }

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition()
      window.addEventListener("scroll", updateDropdownPosition, true)
      window.addEventListener("resize", updateDropdownPosition)

      setTimeout(() => {
        const hourContainer = document.querySelector('.portal-hours-list')
        const selectedHour = hourContainer?.querySelector('.hour-selected')
        if (hourContainer && selectedHour) {
          hourContainer.scrollTop = (selectedHour as HTMLElement).offsetTop - 60
        }

        const minContainer = document.querySelector('.portal-mins-list')
        const selectedMin = minContainer?.querySelector('.min-selected')
        if (minContainer && selectedMin) {
          minContainer.scrollTop = (selectedMin as HTMLElement).offsetTop - 60
        }
      }, 50)
    }

    return () => {
      window.removeEventListener("scroll", updateDropdownPosition, true)
      window.removeEventListener("resize", updateDropdownPosition)
    }
  }, [isOpen])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const portalEl = document.getElementById("time-picker-portal-container")
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node) &&
        (!portalEl || !portalEl.contains(event.target as Node))
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setTypedValue(val)

    if (!val || val === "--" || val === "-") {
      onChange("--")
      return
    }

    const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/
    if (timeRegex.test(val)) {
      onChange(val)
    }
  }

  const handleInputBlur = () => {
    const val = typedValue.trim()
    const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/
    const digitsOnly = /^\d{3,4}$/

    if (timeRegex.test(val)) {
      onChange(val)
      setTypedValue(val)
    } else if (digitsOnly.test(val)) {
      const padded = val.padStart(4, "0")
      const formatted = `${padded.slice(0, 2)}:${padded.slice(2, 4)}`
      if (timeRegex.test(formatted)) {
        onChange(formatted)
        setTypedValue(formatted)
      } else {
        onChange("--")
        setTypedValue("--")
      }
    } else if (!val || val === "--") {
      onChange("--")
      setTypedValue("--")
    } else {
      setTypedValue(displayVal)
    }
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative w-full flex items-center bg-gray-50 border border-gray-150 rounded-xl hover:bg-gray-100 hover:border-gray-300 focus-within:ring-2 focus-within:ring-[#C62828]/10 focus-within:border-[#C62828]/45 transition-all">
        <input
          type="text"
          disabled={disabled}
          value={typedValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          placeholder="--:--"
          className="w-full pl-3.5 pr-8 py-2.5 bg-transparent text-sm font-mono font-bold text-gray-800 focus:outline-none text-center disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (isOpen) closePicker()
            else openPicker()
          }}
          className="absolute right-2.5 p-1 text-gray-400 hover:text-gray-600 focus:outline-none flex items-center justify-center disabled:opacity-50"
        >
          <Clock size={15} />
        </button>
      </div>

      {isOpen && !disabled && createPortal(
        <div 
          id="time-picker-portal-container"
          className="fixed bg-white border border-gray-150 rounded-2xl shadow-xl z-[9999] p-3 grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2 duration-150"
          style={{ 
            top: dropdownPos.top, 
            left: dropdownPos.left, 
            width: dropdownPos.width 
          }}
        >
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase text-center mb-1.5 pb-1 border-b border-gray-100">Giờ</span>
            <div className="portal-hours-list h-40 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin text-center pb-8">
              {hours.map(h => {
                const isSelected = h === hourStr
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => {
                      onChange(`${h}:${minStr}`)
                    }}
                    className={`hour-selected w-full py-1 text-xs font-mono font-bold rounded-lg transition-colors ${
                      isSelected
                        ? "bg-[#C62828] text-white hour-selected"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {h}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase text-center mb-1.5 pb-1 border-b border-gray-100">Phút</span>
            <div className="portal-mins-list h-40 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin text-center pb-8">
              {minutes.map(m => {
                const isSelected = m === minStr
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      onChange(`${hourStr}:${m}`)
                    }}
                    className={`min-selected w-full py-1 text-xs font-mono font-bold rounded-lg transition-colors ${
                      isSelected
                        ? "bg-[#C62828] text-white min-selected"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {m}
                  </button>
                )
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
