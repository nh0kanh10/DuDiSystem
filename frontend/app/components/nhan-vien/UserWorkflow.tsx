import React from "react"
import { Layers } from "lucide-react"

export function UserWorkflow() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Quy trình nội bộ</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {["Mua sắm trang thiết bị", "Thanh toán công tác phí", "Đề nghị cấp quyền", "Quy trình nghỉ việc"].map((w, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-[#C62828] transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center transition-colors group-hover:bg-blue-100"><Layers size={20} /></div>
              <div><p className="font-bold text-gray-800 text-sm">{w}</p><p className="text-xs text-gray-400 mt-1">Biểu mẫu và các bước xử lý</p></div>
            </div>
            <button className="px-4 py-2 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg group-hover:bg-[#C62828] group-hover:text-white transition-colors">Tạo yêu cầu</button>
          </div>
        ))}
      </div>
    </div>
  )
}
