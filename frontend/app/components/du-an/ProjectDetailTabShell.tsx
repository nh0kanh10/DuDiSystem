import React from "react"
import type { LucideIcon } from "lucide-react"

export function ProjectDetailTabShell({
  icon: Icon,
  title,
  description,
  action,
  stats,
  children,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  stats?: { label: string; value: string | number; cls?: string }[]
  children: React.ReactNode
}) {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C62828]/12 to-[#C62828]/5 border border-[#C62828]/10 flex items-center justify-center shrink-0">
            <Icon size={18} className="text-[#C62828]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-gray-800">{title}</h3>
            {description && (
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed max-w-xl">{description}</p>
            )}
          </div>
        </div>
        {action}
      </div>

      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map(s => (
            <div key={s.label} className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-xs">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{s.label}</p>
              <p className={`text-lg font-black mt-0.5 tabular-nums ${s.cls ?? "text-gray-800"}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {children}
    </div>
  )
}

export function ProjectTabEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="text-center py-14 px-6 bg-white border border-dashed border-gray-200 rounded-2xl">
      <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
        <Icon size={26} className="text-gray-300" />
      </div>
      <p className="text-sm font-bold text-gray-600">{title}</p>
      {description && (
        <p className="text-xs text-gray-400 mt-1.5 max-w-sm mx-auto leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ProjectTabSection({
  title,
  children,
  className = "",
}: {
  title?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-xs ${className}`}>
      {title && <h4 className="text-sm font-black text-gray-800">{title}</h4>}
      {children}
    </div>
  )
}

export const tabPrimaryBtn =
  "inline-flex items-center gap-1.5 px-4 py-2 bg-[#C62828] text-white text-xs font-bold rounded-xl hover:bg-[#B71C1C] transition-colors shadow-sm"

export const tabDashedAddBtn =
  "w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-bold text-gray-400 hover:border-[#C62828]/30 hover:text-[#C62828] hover:bg-[#C62828]/[0.02] transition-all"
