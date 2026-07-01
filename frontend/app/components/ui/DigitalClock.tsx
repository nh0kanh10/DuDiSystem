import React, { useState, useEffect } from "react"

export function DigitalClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])
  const pad = (n: number) => String(n).padStart(2, "0")
  const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"]
  return (
    <div className="text-right">
      <div className="text-4xl font-bold text-white/90 font-mono tabular-nums leading-none">
        {pad(now.getHours())}:{pad(now.getMinutes())}
        <span className="text-xl text-white/60">{pad(now.getSeconds())}</span>
      </div>
      <div className="text-sm text-white/60 mt-1">{days[now.getDay()]}, {now.getDate()}/{now.getMonth() + 1}/{now.getFullYear()}</div>
    </div>
  )
}
