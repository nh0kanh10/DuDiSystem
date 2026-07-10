import React, { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { DayPicker } from "react-day-picker"
import { vi } from "date-fns/locale"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { setMonth, setYear, getMonth, getYear, addMonths } from "date-fns"

function parseVNDate(s: string): Date | null {
  if (!s) return null
  const parts = s.split("/").map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return null
  const [d, m, y] = parts
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) return null
  const date = new Date(y, m - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null
  return date
}

function isValidVNDate(s: string): boolean {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(s) && parseVNDate(s) !== null
}

function formatVNDate(d: Date | undefined): string {
  if (!d) return ""
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
}

const MONTHS = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"]

function CustomCaption({ month, onMonthChange }: { month: Date; onMonthChange: (m: Date) => void }) {
  const years = Array.from({ length: new Date().getFullYear() - 1990 + 31 }, (_, i) => 1990 + i)

  return (
    <div className="flex items-center justify-between gap-2 mb-1 px-1">
      <div className="flex items-center gap-1.5 flex-1">
        <select
          value={getMonth(month)}
          onChange={e => onMonthChange(setMonth(month, Number(e.target.value)))}
          className="flex-1 text-xs font-black text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#C62828]/40 cursor-pointer hover:bg-gray-100 transition-colors"
        >
          {MONTHS.map((m, i) => (
            <option key={i} value={i}>{m}</option>
          ))}
        </select>
        <select
          value={getYear(month)}
          onChange={e => onMonthChange(setYear(month, Number(e.target.value)))}
          className="w-20 text-xs font-black text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#C62828]/40 cursor-pointer hover:bg-gray-100 transition-colors"
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, -1))}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

function parseVNDateTime(s: string): { date: Date | null; hour: string; minute: string } {
  if (!s) return { date: null, hour: "08", minute: "00" }
  const [datePart, timePart] = s.split(" ")
  const date = parseVNDate(datePart)
  const [h, m] = (timePart || "08:00").split(":")
  return { date, hour: h?.padStart(2,"0") || "08", minute: m?.padStart(2,"0") || "00" }
}

export function CustomDateTimePicker({ value, onChange, className, disabled, placeholder = "Chọn ngày giờ..." }: {
  value: string
  onChange: (val: string) => void
  className?: string
  disabled?: boolean
  placeholder?: string
}) {
  const parsed = React.useMemo(() => parseVNDateTime(value), [value])
  const [isOpen, setIsOpen] = useState(false)
  const [hour, setHour] = useState(parsed.hour)
  const [minute, setMinute] = useState(parsed.minute)
  const [month, setMonth] = useState<Date>(parsed.date || new Date())
  const [localDateInput, setLocalDateInput] = useState(value)

  React.useEffect(() => {
    setLocalDateInput(value)
    if (parsed.date) setMonth(parsed.date)
  }, [value])

  const hours   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
  const minutes = ["00","05","10","15","20","25","30","35","40","45","50","55"]

  function emit(date: Date | undefined, h: string, m: string) {
    if (!date) return
    onChange(`${formatVNDate(date)} ${h}:${m}`)
  }

  function handleSelectDate(date: Date | undefined) {
    if (date) emit(date, hour, minute)
  }

  function handleHour(h: string) {
    setHour(h)
    if (parsed.date) emit(parsed.date, h, minute)
  }

  function handleMinute(m: string) {
    setMinute(m)
    if (parsed.date) emit(parsed.date, hour, m)
  }

  function handleClear() {
    onChange("")
    setLocalDateInput("")
    setHour("08"); setMinute("00")
    setIsOpen(false)
  }

  function handleDateInputBlur() {
    if (localDateInput === "") { onChange(""); return }
    // format: "DD/MM/YYYY HH:mm" or just date part
    const datePart = localDateInput.split(" ")[0]
    const timePart = localDateInput.split(" ")[1] || `${hour}:${minute}`
    if (isValidVNDate(datePart)) {
      onChange(`${datePart} ${timePart}`)
    } else {
      setLocalDateInput(value)
    }
  }

  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!isOpen) return
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current?.contains(e.target as Node)) return
      const popoverContent = document.querySelector('[data-slot="popover-content"]')
      if (popoverContent && popoverContent.contains(e.target as Node)) return
      setIsOpen(false)
    }
    document.addEventListener("mousedown", handleOutsideClick, true)
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick, true)
    }
  }, [isOpen])

  const widthClass = className?.split(" ").find(c => c.startsWith("w-")) || "w-full"
  const inputClass = className?.split(" ").filter(c => !c.startsWith("w-")).join(" ") || ""

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div ref={containerRef} className={`relative ${widthClass}`}>
          <input
            type="text"
            disabled={disabled}
            placeholder={placeholder}
            value={localDateInput}
            onChange={e => setLocalDateInput(e.target.value)}
            onBlur={handleDateInputBlur}
            className={`${inputClass} w-full pr-10 cursor-text`}
          />
          <CalendarIcon size={15} className="text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer hover:text-gray-600 transition-colors" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-[999] bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden" align="start">
        <DayPicker
          mode="single"
          selected={parsed.date || undefined}
          onSelect={handleSelectDate}
          month={month}
          onMonthChange={setMonth}
          locale={vi}
          showOutsideDays
          components={{
            Nav: () => <></>,
            MonthCaption: ({ calendarMonth }) => (
              <CustomCaption month={calendarMonth.date} onMonthChange={setMonth} />
            ),
          }}
          classNames={{
            months: "flex flex-col",
            month: "p-4 pb-2 space-y-2",
            month_caption: "",
            month_grid: "w-full border-collapse",
            weekdays: "flex mb-1",
            weekday: "w-9 text-center text-[11px] font-bold text-gray-400",
            week: "flex",
            day: "relative p-0 text-center",
            day_button: "w-9 h-9 text-xs font-semibold rounded-xl hover:bg-gray-100 transition-colors text-gray-700 flex items-center justify-center mx-auto cursor-pointer",
            selected: "!bg-[#C62828] !text-white hover:!bg-[#B71C1C] font-black rounded-xl",
            today: "bg-[#C62828]/8 text-[#C62828] font-black rounded-xl",
            outside: "text-gray-300",
            disabled: "text-gray-200 cursor-not-allowed",
            hidden: "invisible",
          }}
        />
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide mb-2">Giờ</p>
          <div className="flex items-center gap-2">
            <select value={hour} onChange={e => handleHour(e.target.value)}
              className="flex-1 text-sm font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#C62828]/40 cursor-pointer">
              {hours.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <span className="text-gray-400 font-black">:</span>
            <select value={minute} onChange={e => handleMinute(e.target.value)}
              className="flex-1 text-sm font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#C62828]/40 cursor-pointer">
              {minutes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex gap-2 mt-3">
            <button type="button" onClick={handleClear}
              className="flex-1 py-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              Xóa
            </button>
            <button type="button" onClick={() => setIsOpen(false)}
              className="flex-1 py-1.5 text-xs font-bold text-white bg-[#C62828] hover:bg-[#B71C1C] rounded-lg transition-colors">
              Xong
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function CustomDatePicker({ value, onChange, className, disabled, placeholder = "Chọn ngày..." }: {
  value: string
  onChange: (val: string) => void
  className?: string
  disabled?: boolean
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [localValue, setLocalValue] = useState(value)
  const dateValue = React.useMemo(() => parseVNDate(localValue) || undefined, [localValue])
  const [month, setMonth] = useState<Date>(dateValue || new Date())

  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  React.useEffect(() => {
    if (dateValue) setMonth(dateValue)
  }, [dateValue])

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const formatted = formatVNDate(date)
      setLocalValue(formatted)
      onChange(formatted)
      setIsOpen(false)
    }
  }

  const handleBlur = () => {
    if (localValue === "") {
      onChange("")
      return
    }
    if (!isValidVNDate(localValue)) {
      setLocalValue(value)
      return
    }
    onChange(localValue)
  }

  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!isOpen) return
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current?.contains(e.target as Node)) return
      const popoverContent = document.querySelector('[data-slot="popover-content"]')
      if (popoverContent && popoverContent.contains(e.target as Node)) return
      setIsOpen(false)
    }
    document.addEventListener("mousedown", handleOutsideClick, true)
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick, true)
    }
  }, [isOpen])

  const widthClass = className?.split(" ").find(c => c.startsWith("w-")) || "w-full"
  const inputClass = className?.split(" ").filter(c => !c.startsWith("w-")).join(" ") || ""

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div ref={containerRef} className={`relative ${widthClass}`}>
          <input
            type="text"
            disabled={disabled}
            placeholder={placeholder}
            value={localValue}
            onChange={e => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            className={`${inputClass} w-full pr-10 cursor-text`}
          />
          <CalendarIcon size={15} className="text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer hover:text-gray-600 transition-colors" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-[999] bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden" align="start">
        <DayPicker
          mode="single"
          selected={dateValue}
          onSelect={handleSelect}
          month={month}
          onMonthChange={setMonth}
          locale={vi}
          showOutsideDays
          components={{
            Nav: () => <></>,
            MonthCaption: ({ calendarMonth }) => (
              <CustomCaption month={calendarMonth.date} onMonthChange={setMonth} />
            ),
          }}
          classNames={{
            months: "flex flex-col",
            month: "p-4 space-y-2",
            month_caption: "",
            month_grid: "w-full border-collapse",
            weekdays: "flex mb-1",
            weekday: "w-9 text-center text-[11px] font-bold text-gray-400",
            week: "flex",
            day: "relative p-0 text-center",
            day_button: "w-9 h-9 text-xs font-semibold rounded-xl hover:bg-gray-100 transition-colors text-gray-700 flex items-center justify-center mx-auto cursor-pointer",
            selected: "!bg-[#C62828] !text-white hover:!bg-[#B71C1C] font-black rounded-xl",
            today: "bg-[#C62828]/8 text-[#C62828] font-black rounded-xl",
            outside: "text-gray-300",
            disabled: "text-gray-200 cursor-not-allowed",
            hidden: "invisible",
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

