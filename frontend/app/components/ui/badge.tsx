import React from "react"
import { STATUS_LABEL, STATUS_COLOR } from "../../constants"

export function Badge({ status }: { status: string }) {
  const label = STATUS_LABEL[status] || status
  const color = STATUS_COLOR[status] || "bg-gray-100 text-gray-700"
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${color}`}>
      {label}
    </span>
  )
}
