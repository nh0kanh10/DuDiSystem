import React, { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Search, X, ChevronDown } from "lucide-react"
import { removeVietnameseTones } from "../../utils"

interface Option {
  value: string
  label: string
  desc?: string
}

interface CustomComboboxProps {
  value: string
  onChange: (val: string) => void
  options: Option[]
  placeholder?: string
  className?: string
  heightClass?: string
  showSearchIcon?: boolean
  portal?: boolean
  disabled?: boolean
}

export function CustomCombobox({
  value,
  onChange,
  options,
  placeholder = "Tìm kiếm...",
  className = "",
  heightClass = "h-[34px]",
  showSearchIcon = false,
  portal = true,
  disabled = false,
}: CustomComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(null)
  const lastRectRef = useRef<{ top: number; left: number; width: number } | null>(null)

  const activeOptionLabel = React.useMemo(() => {
    return options.find(opt => opt.value === value)?.label ?? ""
  }, [options, value])

  const calcMenuRect = () => {
    const baseEl = containerRef.current || triggerRef.current
    if (!baseEl) return null
    const rect = baseEl.getBoundingClientRect()
    const viewportPadding = 12
    const minMenuWidth = Math.max(rect.width, 280)
    const maxMenuWidth = Math.max(280, window.innerWidth - viewportPadding * 2)
    const width = Math.min(minMenuWidth, maxMenuWidth)
    const maxLeft = window.innerWidth - viewportPadding - width
    const left = Math.min(Math.max(rect.left, viewportPadding), Math.max(viewportPadding, maxLeft))
    return {
      top: Math.round(rect.bottom + 4),
      left: Math.round(left),
      width: Math.round(width),
    }
  }

  useEffect(() => {
    setInputValue(activeOptionLabel)
  }, [value, activeOptionLabel])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      const inTrigger = !!containerRef.current && containerRef.current.contains(target)
      const inMenu = !!menuRef.current && menuRef.current.contains(target)
      if (!inTrigger && !inMenu) {
        setIsOpen(false)
        setInputValue(activeOptionLabel)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [activeOptionLabel])

  useEffect(() => {
    if (!isOpen) {
      setMenuRect(null)
      return
    }

    if (!portal) return

    const updateMenuRect = () => {
      const next = calcMenuRect()
      if (!next) return
      const prev = lastRectRef.current
      if (prev && prev.top === next.top && prev.left === next.left && prev.width === next.width) return
      lastRectRef.current = next
      setMenuRect(next)
    }

    updateMenuRect()
    let rafId: number | null = null
    const onReposition = () => {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(updateMenuRect)
    }
    window.addEventListener("resize", onReposition)
    window.addEventListener("scroll", onReposition, true)
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener("resize", onReposition)
      window.removeEventListener("scroll", onReposition, true)
    }
  }, [isOpen, portal])

  const filteredOptions = React.useMemo(() => {
    const query = removeVietnameseTones(inputValue.trim().toLowerCase())
    if (activeOptionLabel && query === removeVietnameseTones(activeOptionLabel.toLowerCase())) {
      return options
    }
    if (!query) return options
    return options.filter(opt =>
      removeVietnameseTones(opt.label.toLowerCase()).includes(query) ||
      removeVietnameseTones(opt.value.toLowerCase()).includes(query) ||
      (opt.desc && removeVietnameseTones(opt.desc.toLowerCase()).includes(query))
    )
  }, [options, inputValue, activeOptionLabel])

  const hasWidth = className.split(" ").some(c => c.startsWith("w-") || c.startsWith("flex-1"))

  const openMenu = () => {
    if (disabled) return
    setIsOpen(true)
    if (portal) {
      const nextRect = calcMenuRect()
      if (nextRect) {
        lastRectRef.current = nextRect
        setMenuRect(nextRect)
      }
    }
  }

  const menuContent = (
    <div
      ref={menuRef}
      className="bg-white border border-gray-200 rounded-xl shadow-lg z-[10010] max-h-60 overflow-y-auto py-1 divide-y divide-gray-50 animate-in fade-in duration-100"
    >
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
  )

  return (
    <div ref={containerRef} className={`relative ${hasWidth ? "" : "w-full"} ${className} ${disabled ? "opacity-60 cursor-not-allowed pointer-events-none" : ""}`}>
      <div ref={triggerRef} className="relative w-full flex items-center">
        {showSearchIcon && (
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        )}
        <input
          type="text"
          value={inputValue}
          disabled={disabled}
          onChange={e => {
            if (disabled) return
            setInputValue(e.target.value)
            openMenu()
          }}
          onFocus={openMenu}
          placeholder={placeholder}
          className={`w-full ${showSearchIcon ? "pl-9" : "pl-3"} pr-10 py-2 border border-gray-200 rounded-xl text-xs text-gray-700 bg-white font-bold focus:outline-none focus:border-[#C62828]/40 ${heightClass}`}
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {inputValue && !disabled && (
            <button
              type="button"
              onClick={() => {
                setInputValue("")
                openMenu()
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
        portal ? (
          menuRect ? createPortal(
            <div
              className="fixed z-[10010]"
              style={{ top: menuRect.top, left: menuRect.left, width: menuRect.width }}
            >
              {menuContent}
            </div>,
            document.body
          ) : null
        ) : (
          <div className="absolute top-[calc(100%+4px)] left-0 right-0 mt-1 z-50">
            {menuContent}
          </div>
        )
      )}
    </div>
  )
}
