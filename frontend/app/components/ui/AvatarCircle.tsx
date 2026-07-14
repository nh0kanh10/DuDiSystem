import React from "react"
import { initials } from "../../utils"

export function AvatarCircle({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const s = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm"
  return (
    <div className={`${s} rounded-full bg-gradient-to-br from-[#C62828] to-[#E64A19] flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials(name)}
    </div>
  )
}
