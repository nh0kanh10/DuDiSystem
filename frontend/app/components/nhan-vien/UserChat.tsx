import React from "react"
import { MessageCircle, FileImage } from "lucide-react"

export function UserChat() {
  return (
    <div className="h-[calc(100vh-120px)] bg-white rounded-2xl shadow-sm border border-black/5 flex overflow-hidden">
      <div className="w-80 border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100"><input placeholder="Tìm đoạn chat..." className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div>
        <div className="flex-1 overflow-y-auto">
          {["Team Frontend", "Nguyễn Văn Minh", "Phòng Hành chính"].map(t => (
            <div key={t} className="p-4 flex items-center gap-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-500 font-bold">{t.charAt(0)}</div>
              <div><p className="font-semibold text-gray-700 text-sm">{t}</p><p className="text-xs text-gray-400">Tin nhắn mới...</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-gray-50/50">
        <div className="p-4 border-b border-gray-100 bg-white flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-500 font-bold">T</div>
          <h3 className="font-bold text-gray-800">Team Frontend</h3>
        </div>
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          <div className="text-center text-xs text-gray-400">Hôm nay</div>
          <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" /><div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-sm text-gray-700">Chào buổi sáng team! ☕</div></div>
          <div className="flex gap-3 flex-row-reverse"><div className="w-8 h-8 rounded-full bg-red-200 flex-shrink-0" /><div className="bg-[#C62828] p-3 rounded-2xl rounded-tr-none shadow-sm text-sm text-white">Hello anh em!</div></div>
        </div>
        <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
          <button className="p-2 text-gray-400 hover:text-gray-600"><FileImage size={20} /></button>
          <input placeholder="Nhập tin nhắn..." className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C62828]" />
          <button className="w-10 h-10 bg-[#C62828] text-white rounded-xl flex items-center justify-center shadow-md"><MessageCircle size={18} /></button>
        </div>
      </div>
    </div>
  )
}
