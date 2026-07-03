import React, { useState } from "react"
import { Lock, User, ArrowRight } from "lucide-react"
import { BrandLogo } from "../ui/BrandLogo"

export function LoginPage({ onLogin, loginError }: {
  onLogin: (id: string, pass: string) => void
  loginError?: string | null
}) {
  const [id, setId] = useState("")
  const [pass, setPass] = useState("")

  const handleSubmit = () => onLogin(id.trim(), pass)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit()
  }

  const quickLogin = (empId: string, password: string) => {
    setId(empId)
    setPass(password)
    onLogin(empId, password)
  }

  return (
    <div className="min-h-screen flex bg-white">
      <div className="hidden lg:flex flex-1 bg-[#160606] items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#C62828]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#E64A19]/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        </div>
        <div className="relative z-10 max-w-md">
          <BrandLogo
            size={56}
            withText
            textLight
            variant="hero"
            imageClassName="rounded-2xl object-contain shadow-lg"
            className="mb-10"
          />
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Hệ thống quản lý<br />
            <span className="text-[#FF8A65]">nhân sự & chấm công</span>
          </h1>
          <p className="text-white/50 text-lg leading-relaxed">
            Quản lý nhân viên, theo dõi chấm công và tạo báo cáo — toàn bộ trong một nền tảng thống nhất.
          </p>
          <div className="mt-12 flex gap-10">
            {[["42+", "Nhân viên"], ["98%", "Chính xác"], ["24/7", "Hỗ trợ"]].map(([v, l]) => (
              <div key={l}>
                <div className="text-3xl font-bold text-[#FF8A65]">{v}</div>
                <div className="text-white/40 text-sm mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[420px] flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <BrandLogo size={40} withText className="mb-10 lg:hidden" />

          <h2 className="text-2xl font-bold text-gray-800 mb-1">Đăng nhập</h2>
          <p className="text-gray-400 text-sm mb-8">Nhập mã nhân viên để truy cập hệ thống</p>

          {loginError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
              {loginError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mã nhân viên</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={id}
                  onChange={e => setId(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="VD: NV001, 0000000000..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/10 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/10 transition-all"
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-500 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 accent-[#C62828]" />
                Ghi nhớ đăng nhập
              </label>
              <a href="#" className="text-[#C62828] font-semibold hover:underline">Quên mật khẩu?</a>
            </div>
            <button
              onClick={handleSubmit}
              className="w-full bg-[#C62828] hover:bg-[#B71C1C] active:bg-[#A31515] text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-md shadow-[#C62828]/20"
            >
              Đăng nhập hệ thống <ArrowRight size={18} />
            </button>
          </div>

          <div className="mt-5 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs text-gray-500 space-y-3">
            <p className="font-semibold text-gray-700 text-sm">Đăng nhập nhanh:</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => quickLogin("0000000000", "123456")}
                className="w-full flex flex-col items-center justify-center p-3 rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 transition-colors cursor-pointer text-violet-700"
              >
                <div className="font-bold mb-0.5">Quản trị viên</div>
                <div className="font-mono text-[10px] opacity-75">0000000000 · CN HCM</div>
              </button>
              <button
                onClick={() => quickLogin("NV009", "123456")}
                className="w-full flex flex-col items-center justify-center p-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer text-amber-700"
              >
                <div className="font-bold mb-0.5">Nhân · Giám đốc CN</div>
                <div className="font-mono text-[10px] opacity-75">NV009 · CN HCM</div>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => quickLogin("NV001", "0901234567")}
                className="w-full flex flex-col items-center justify-center p-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer text-emerald-700"
              >
                <div className="font-bold mb-0.5">Bích Liên</div>
                <div className="font-mono text-[10px] opacity-75">NV001 · Nhân viên</div>
              </button>
              <button
                onClick={() => quickLogin("NV012", "123456")}
                className="w-full flex flex-col items-center justify-center p-3 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 transition-colors cursor-pointer text-sky-700"
              >
                <div className="font-bold mb-0.5">Thị Hà</div>
                <div className="font-mono text-[10px] opacity-75">NV012 · CN Hà Nội</div>
              </button>
            </div>
            <p className="text-gray-400 text-[10px] text-center pt-1">Hệ thống tự phân quyền dựa vào tài khoản đăng nhập.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
