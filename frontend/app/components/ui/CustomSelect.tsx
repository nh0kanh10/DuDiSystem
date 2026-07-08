import React, { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, Search } from "lucide-react"
import { removeVietnameseTones } from "../../utils"

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
  menuClassName?: string
  portal?: boolean
}

export function CustomSelect({
  value,
  onChange,
  options,
  disabled = false,
  className = "",
  heightClass = "h-[34px]",
  searchable = false,
  placeholder = "Chọn...",
  menuClassName = "",
  portal = true,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(null)
  const lastRectRef = useRef<{ top: number; left: number; width: number } | null>(null)

  const calcMenuRect = () => {
    const baseEl = containerRef.current || triggerRef.current
    if (!baseEl) return null
    const rect = baseEl.getBoundingClientRect()
    const viewportPadding = 12
    const minMenuWidth = Math.max(rect.width, 320)
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
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      const inTrigger = !!containerRef.current && containerRef.current.contains(target)
      const inMenu = !!menuRef.current && menuRef.current.contains(target)
      if (!inTrigger && !inMenu) {
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
      setMenuRect(null)
      return
    }

    if (searchable) {
      // Focus search input when dropdown opens
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    }

    if (!portal) return

    const updateMenuRect = () => {
      const next = calcMenuRect()
      if (!next) return
      const prev = lastRectRef.current
      // Tránh setState liên tục khi tọa độ không đổi -> giảm nháy/giật
      if (prev && prev.top === next.top && prev.left === next.left && prev.width === next.width) return
      lastRectRef.current = next
      setMenuRect(next)
    }

    updateMenuRect()
    let rafId: number | null = null
    const onResize = () => {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(updateMenuRect)
    }
    window.addEventListener("resize", onResize)
    window.addEventListener("scroll", onResize, true)
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener("resize", onResize)
      window.removeEventListener("scroll", onResize, true)
    }
  }, [isOpen, searchable, portal])

  const selectedOption = options.find(opt => opt.value === value)

  const filteredOptions = options.filter(opt =>
    removeVietnameseTones(opt.label.toLowerCase()).includes(removeVietnameseTones(searchTerm.toLowerCase()))
  )

  const hasWidth = className.split(" ").some(c => c.startsWith("w-") || c.startsWith("flex-1"))

  const menuContent = (
    <div ref={menuRef} className={`bg-white border border-gray-200 rounded-xl shadow-lg z-50 flex flex-col max-h-60 overflow-hidden min-w-full ${menuClassName}`}>
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
  )

  return (
    <div ref={containerRef} className={`relative ${hasWidth ? "" : "w-full"} ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          setIsOpen(prev => {
            const nextOpen = !prev
            if (nextOpen && portal) {
              const nextRect = calcMenuRect()
              if (nextRect) {
                lastRectRef.current = nextRect
                setMenuRect(nextRect)
              }
            }
            return nextOpen
          })
        }}
        className={`w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-700 bg-white font-bold ${heightClass} focus:outline-none focus:border-[#C62828]/40 hover:bg-gray-50/50 transition-colors disabled:bg-gray-50 disabled:text-gray-400 text-left`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={14} className="text-gray-400 pointer-events-none flex-shrink-0 ml-1" />
      </button>
      {isOpen && (
        <>
          {portal ? (
            menuRect ? createPortal(
              <div
                className="fixed z-[60]"
                style={{ top: menuRect.top, left: menuRect.left, width: menuRect.width }}
              >
                {menuContent}
              </div>,
              document.body
            ) : null
          ) : (
            <div className="absolute top-[calc(100%+4px)] left-0 mt-1 z-50">
              {menuContent}
            </div>
          )}
        </>
      )}
    </div>
  )
}
