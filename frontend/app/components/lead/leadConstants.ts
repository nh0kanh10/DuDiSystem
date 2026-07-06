import type { ElementType } from "react"
import { CheckCircle2, Clock, Edit, ExternalLink, Send, User, XCircle, ArrowRight } from "lucide-react"
import { FormStatus, LeadStatus } from "../../types"

export const STATUS_CONFIG: Record<LeadStatus, { label: string; cls: string; icon: ElementType }> = {
  new: { label: "Mới", cls: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock },
  contacted: { label: "Đã liên hệ", cls: "bg-purple-50 text-purple-700 border-purple-200", icon: User },
  "requirement-gathering": { label: "Thu thập yêu cầu", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: Send },
  "requirement-done": { label: "Đủ yêu cầu", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  converted: { label: "Đã thành dự án", cls: "bg-green-50 text-green-700 border-green-200", icon: ArrowRight },
  lost: { label: "Đã mất", cls: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
}

export const FORM_STATUS_CONFIG: Record<FormStatus, { label: string; cls: string; icon: ElementType }> = {
  not_sent: { label: "Chưa gửi form", cls: "bg-gray-100 text-gray-600 border-gray-200", icon: Clock },
  sent: { label: "Đã gửi form", cls: "bg-blue-50 text-blue-700 border-blue-200", icon: Send },
  opened: { label: "Khách đã mở", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: ExternalLink },
  in_progress: { label: "Đang điền", cls: "bg-purple-50 text-purple-700 border-purple-200", icon: Edit },
  completed: { label: "Đã hoàn thành", cls: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
}
