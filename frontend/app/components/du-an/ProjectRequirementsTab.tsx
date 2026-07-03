import React, { useMemo, useState } from "react"
import { FileText, ExternalLink, Paperclip, CheckCircle2, Lock, Clock, ChevronRight } from "lucide-react"
import { RequirementForm } from "../../types"
import { ProjectDetailTabShell, ProjectTabEmptyState, ProjectTabSection } from "./ProjectDetailTabShell"
import { FORM_TYPE_LABELS } from "./projectRequirementMock"

function normalizeReferences(refs?: string | string[]): string[] {
  if (!refs) return []
  const raw = Array.isArray(refs) ? refs.join("\n") : refs
  return raw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
}

function hasAny(...values: unknown[]) {
  return values.some(v => v !== undefined && v !== null && v !== "" && v !== false)
}

function formTypeLabel(form: RequirementForm) {
  return FORM_TYPE_LABELS[form.projectType ?? ""] ?? "Phiếu yêu cầu"
}

function formatDate(iso?: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

/** Dòng label – giá trị, dễ quét mắt */
function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4 py-2.5 border-b border-gray-50 last:border-0">
      <dt className="text-xs font-bold text-gray-400 sm:w-40 shrink-0 pt-0.5">{label}</dt>
      <dd className="text-sm text-gray-800 leading-relaxed flex-1">{value}</dd>
    </div>
  )
}

function FeatureTags({ items }: { items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(item => (
        <span key={item} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs font-semibold">
          <CheckCircle2 size={11} className="shrink-0" />
          {item}
        </span>
      ))}
    </div>
  )
}

function collectFeatures(form: RequirementForm): { group: string; items: string[] }[] {
  const groups: { group: string; items: string[] }[] = []

  const landing = [
    form.has_register_form && "Form đăng ký",
    form.has_call_button && "Gọi điện",
    form.has_chat && "Chat Zalo/Messenger",
  ].filter(Boolean) as string[]
  if (landing.length) groups.push({ group: "Landing page", items: landing })

  const ecommerce = [
    form.has_cart && "Giỏ hàng",
    form.has_online_payment && "Thanh toán online",
    form.has_quick_order && "Đặt hàng nhanh",
    form.has_user_account && "Tài khoản",
    form.has_wishlist && "Yêu thích",
    form.has_coupon && "Mã giảm giá",
  ].filter(Boolean) as string[]
  if (ecommerce.length) groups.push({ group: "Bán hàng", items: ecommerce })

  const orders = [
    form.has_order_tracking && "Lưu đơn hàng",
    form.has_order_status && "Trạng thái đơn",
    form.has_order_email && "Email xác nhận",
    form.has_shipping_integration && "Kết nối vận chuyển",
  ].filter(Boolean) as string[]
  if (orders.length) groups.push({ group: "Đơn hàng", items: orders })

  const company = [
    form.has_contact_form && "Form liên hệ",
    form.has_newsletter && "Đăng ký nhận tin",
    form.has_news && "Tin tức",
    form.has_google_maps && "Google Maps",
  ].filter(Boolean) as string[]
  if (company.length) groups.push({ group: "Giới thiệu", items: company })

  const admin = [
    form.has_admin && "Admin tổng",
    form.has_product_admin && "QL sản phẩm",
    form.has_order_admin && "QL đơn hàng",
    form.has_customer_admin && "QL khách hàng",
    form.has_content_admin && "QL bài viết",
    form.has_page_admin && "QL trang",
    form.has_multilingual && "Đa ngôn ngữ",
  ].filter(Boolean) as string[]
  if (admin.length) groups.push({ group: "Quản trị", items: admin })

  const integrations = [
    form.has_facebook_pixel && "Facebook Pixel",
    form.has_google_analytics && "Google Analytics",
    form.has_zalo_messenger && "Zalo/Messenger",
    form.has_google_maps && "Google Maps",
  ].filter(Boolean) as string[]
  if (integrations.length) groups.push({ group: "Tích hợp", items: integrations })

  const tech = [
    form.has_responsive && "Responsive",
    form.has_speed_optimized && "Tối ưu tốc độ",
    form.has_seo && "SEO cơ bản",
    form.has_content && "Có nội dung",
    form.has_images && "Hình ảnh/video",
    form.has_logo && "Logo",
  ].filter(Boolean) as string[]
  if (tech.length) groups.push({ group: "Kỹ thuật", items: tech })

  return groups
}

function formHasContent(form: RequirementForm): boolean {
  const refs = normalizeReferences(form.references)
  return hasAny(
    form.customer_name, form.customer_phone, form.customer_email, form.company, form.industry, form.source,
    form.goal, form.cta, form.kpi,
    form.main_product, form.usp, form.offers, form.pricing, form.product_count,
    form.services, form.strengths,
    form.target_audience, form.insight, form.location,
    form.user_flow, form.structure, form.sections, form.top_features,
    form.payment_methods, form.order_handler, form.order_process,
    form.brand_color, form.style, refs.length, form.deadline, form.budget, form.priority, form.notes,
    form.hosting_status, form.payment_integrations, form.shipping_integrations,
    form.attachments?.length,
    ...collectFeatures(form).flatMap(g => g.items),
  )
}

function RequirementFormReadable({ form }: { form: RequirementForm }) {
  const refs = normalizeReferences(form.references)
  const featureGroups = collectFeatures(form)
  const hostingLabel = form.hosting_status === "already" ? "Đã có hosting/domain" : form.hosting_status === "need" ? "Chưa có, cần hỗ trợ" : form.hosting_status

  if (!formHasContent(form)) {
    return (
      <ProjectTabEmptyState
        icon={FileText}
        title="Phiếu chưa có nội dung"
        description="Khách hàng chưa hoàn thành hoặc mới gửi link form"
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Tóm tắt nhanh */}
      {(form.customer_name || form.company || form.goal) && (
        <div className="rounded-2xl border border-[#C62828]/10 bg-gradient-to-br from-[#C62828]/[0.04] to-white p-5">
          <p className="text-[10px] font-black text-[#C62828] uppercase tracking-wider mb-2">Tóm tắt</p>
          {form.company && <p className="text-base font-black text-gray-800">{form.company}</p>}
          {form.customer_name && (
            <p className="text-sm text-gray-600 mt-1">
              {form.customer_name}
              {form.customer_phone ? ` · ${form.customer_phone}` : ""}
              {form.customer_email ? ` · ${form.customer_email}` : ""}
            </p>
          )}
          {form.goal && <p className="text-sm text-gray-700 mt-3 leading-relaxed border-t border-[#C62828]/10 pt-3">{form.goal}</p>}
        </div>
      )}

      {hasAny(form.customer_name, form.customer_phone, form.customer_email, form.company, form.industry, form.source) && (
        <ProjectTabSection title="Thông tin khách hàng">
          <dl className="divide-y divide-gray-50">
            <InfoRow label="Họ tên" value={form.customer_name} />
            <InfoRow label="Điện thoại" value={form.customer_phone} />
            <InfoRow label="Email" value={form.customer_email} />
            <InfoRow label="Công ty" value={form.company} />
            <InfoRow label="Ngành" value={form.industry} />
            <InfoRow label="Nguồn" value={form.source} />
          </dl>
        </ProjectTabSection>
      )}

      {hasAny(form.goal, form.cta, form.kpi) && (
        <ProjectTabSection title="Mục tiêu & KPI">
          <dl className="divide-y divide-gray-50">
            <InfoRow label="Mục tiêu" value={form.goal} />
            <InfoRow label="Hành động (CTA)" value={form.cta} />
            <InfoRow label="KPI" value={form.kpi} />
          </dl>
        </ProjectTabSection>
      )}

      {hasAny(form.main_product, form.usp, form.offers, form.pricing, form.product_count, form.services, form.strengths) && (
        <ProjectTabSection title="Sản phẩm & Dịch vụ">
          <dl className="divide-y divide-gray-50">
            <InfoRow label="Sản phẩm chính" value={form.main_product} />
            <InfoRow label="USP" value={form.usp} />
            <InfoRow label="Ưu đãi" value={form.offers} />
            <InfoRow label="Giá / Cách bán" value={form.pricing} />
            <InfoRow label="Số lượng SP" value={form.product_count} />
            <InfoRow label="Dịch vụ" value={form.services} />
            <InfoRow label="Điểm mạnh" value={form.strengths} />
          </dl>
        </ProjectTabSection>
      )}

      {hasAny(form.target_audience, form.insight, form.location) && (
        <ProjectTabSection title="Khách hàng mục tiêu">
          <dl className="divide-y divide-gray-50">
            <InfoRow label="Đối tượng" value={form.target_audience} />
            <InfoRow label="Insight" value={form.insight} />
            <InfoRow label="Khu vực" value={form.location} />
          </dl>
        </ProjectTabSection>
      )}

      {hasAny(form.user_flow, form.structure, form.sections, form.top_features) && (
        <ProjectTabSection title="Cấu trúc & Luồng">
          <dl className="divide-y divide-gray-50">
            <InfoRow label="User flow" value={form.user_flow} />
            <InfoRow label="Cấu trúc trang" value={form.structure} />
            <InfoRow label="Các section" value={form.sections} />
            <InfoRow label="Tính năng ưu tiên" value={form.top_features} />
          </dl>
        </ProjectTabSection>
      )}

      {hasAny(form.payment_methods, form.order_handler, form.order_process, form.payment_integrations, form.shipping_integrations) && (
        <ProjectTabSection title="Thanh toán & Vận hành">
          <dl className="divide-y divide-gray-50">
            <InfoRow label="PT thanh toán" value={form.payment_methods} />
            <InfoRow label="Xử lý đơn" value={form.order_handler} />
            <InfoRow label="Quy trình đơn" value={form.order_process} />
            <InfoRow label="Tích hợp TT" value={form.payment_integrations} />
            <InfoRow label="Tích hợp VC" value={form.shipping_integrations} />
          </dl>
        </ProjectTabSection>
      )}

      {hasAny(form.brand_color, form.style, refs.length, hostingLabel) && (
        <ProjectTabSection title="Thương hiệu & Tham khảo">
          <dl className="divide-y divide-gray-50">
            <InfoRow label="Màu thương hiệu" value={form.brand_color} />
            <InfoRow label="Phong cách UI" value={form.style} />
            <InfoRow label="Hosting" value={hostingLabel} />
            {refs.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:gap-4 py-2.5">
                <dt className="text-xs font-bold text-gray-400 sm:w-40 shrink-0">Website tham khảo</dt>
                <dd className="flex flex-col gap-1 flex-1">
                  {refs.map((url, i) => (
                    <a key={i} href={url.startsWith("http") ? url : `https://${url}`} target="_blank" rel="noreferrer"
                      className="text-sm text-[#C62828] hover:underline inline-flex items-center gap-1">
                      <ExternalLink size={12} /> {url}
                    </a>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </ProjectTabSection>
      )}

      {featureGroups.length > 0 && (
        <ProjectTabSection title="Tính năng đã chọn">
          <div className="space-y-3">
            {featureGroups.map(g => (
              <div key={g.group}>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">{g.group}</p>
                <FeatureTags items={g.items} />
              </div>
            ))}
          </div>
        </ProjectTabSection>
      )}

      {hasAny(form.deadline, form.budget, form.priority, form.notes) && (
        <ProjectTabSection title="Thời gian & Ghi chú">
          <dl className="divide-y divide-gray-50">
            <InfoRow label="Deadline" value={form.deadline} />
            <InfoRow label="Ngân sách" value={form.budget} />
            <InfoRow label="Ưu tiên số 1" value={form.priority} />
            <InfoRow label="Ghi chú" value={form.notes} />
          </dl>
        </ProjectTabSection>
      )}

      {form.attachments && form.attachments.length > 0 && (
        <ProjectTabSection title={`Tệp đính kèm (${form.attachments.length})`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {form.attachments.map(att => (
              <div key={att.id} className="flex items-center gap-2.5 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                <Paperclip size={15} className="text-gray-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-800 truncate">{att.name}</p>
                  <p className="text-[10px] text-gray-400">{att.size || formatDate(att.uploadedAt)}</p>
                </div>
                {att.url && att.url !== "#" && (
                  <a href={att.url} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-[#C62828] shrink-0">Mở</a>
                )}
              </div>
            ))}
          </div>
        </ProjectTabSection>
      )}
    </div>
  )
}

export function ProjectRequirementsTab({
  requirementForms,
  requirementForm,
}: {
  requirementForms?: RequirementForm[]
  requirementForm?: RequirementForm
}) {
  const forms = useMemo(() => {
    const list = requirementForms?.length
      ? requirementForms
      : requirementForm
        ? [requirementForm]
        : []
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [requirementForms, requirementForm])

  const [activeId, setActiveId] = useState<string | null>(null)
  const activeForm = forms.find(f => f.id === activeId) ?? forms[0] ?? null

  if (forms.length === 0) {
    return (
      <ProjectDetailTabShell
        icon={FileText}
        title="Yêu cầu dự án"
        description="Phiếu thu thập từ khách — đồng bộ khi khách gửi form web"
      >
        <ProjectTabEmptyState
          icon={FileText}
          title="Chưa có phiếu yêu cầu"
          description="Phiếu sẽ xuất hiện khi gửi link form cho khách hoặc chuyển đổi từ Lead"
        />
      </ProjectDetailTabShell>
    )
  }

  const lockedCount = forms.filter(f => f.isLocked).length

  return (
    <ProjectDetailTabShell
      icon={FileText}
      title="Yêu cầu dự án"
      description={`${forms.length} phiếu · ${lockedCount} đã hoàn thành`}
    >
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Danh sách phiếu */}
        <div className="lg:w-72 shrink-0 space-y-2">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider px-1 mb-2">Danh sách phiếu</p>
          {forms.map(form => {
            const active = activeForm?.id === form.id
            return (
              <button
                key={form.id}
                type="button"
                onClick={() => setActiveId(form.id)}
                className={`w-full text-left rounded-2xl border p-4 transition-all ${
                  active
                    ? "border-[#C62828]/30 bg-[#C62828]/[0.04] shadow-sm"
                    : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/80"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-mono font-bold text-gray-400">{form.code}</p>
                    <p className={`text-sm font-bold mt-0.5 leading-snug ${active ? "text-[#C62828]" : "text-gray-800"}`}>
                      {form.title || formTypeLabel(form)}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">{formTypeLabel(form)}</p>
                  </div>
                  {active && <ChevronRight size={16} className="text-[#C62828] shrink-0 mt-1" />}
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="text-[10px] text-gray-400">{formatDate(form.createdAt)}</span>
                  {form.isLocked ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                      <Lock size={9} /> Đã gửi
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-100">
                      <Clock size={9} /> Đang soạn
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Nội dung phiếu đang xem */}
        {activeForm && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-black text-gray-800">{activeForm.title || formTypeLabel(activeForm)}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {activeForm.code} · {formTypeLabel(activeForm)} · Gửi {formatDate(activeForm.lockedAt || activeForm.createdAt)}
                </p>
              </div>
              {activeForm.isLocked ? (
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold shrink-0">
                  Đã khóa
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold shrink-0">
                  Bản nháp
                </span>
              )}
            </div>
            <RequirementFormReadable form={activeForm} />
          </div>
        )}
      </div>
    </ProjectDetailTabShell>
  )
}
