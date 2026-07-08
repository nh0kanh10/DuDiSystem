import { RequirementForm } from "../../types"
import { FORM_TYPE_LABELS } from "../du-an/projectRequirementMock"


function normalizeReferences(refs?: string | string[]): string {
  if (!refs) return ""
  const raw = Array.isArray(refs) ? refs.join("\n") : refs
  return raw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean).join(", ")
}

function hasValue(value: unknown): boolean {
  return value !== undefined && value !== null && value !== "" && value !== false
}

export function collectRequirementFeatures(form: RequirementForm): { group: string; items: string[] }[] {
  const groups: { group: string; items: string[] }[] = []

  const landing = [
    form.has_register_form && "Form đăng ký",
    form.has_call_button && "Gọi điện",
    form.has_chat && "Chat Zalo/Messenger",
  ].filter(Boolean) as string[]
  if (landing.length) groups.push({ group: "Landing page", items: landing })

  const ecommerce = [
    form.has_categories && "Danh mục sản phẩm",
    form.has_variants && "Biến thể sản phẩm",
    form.has_blog && "Blog / tin tức",
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

function hostingLabel(status?: string) {
  if (status === "already") return "Đã có hosting/domain"
  if (status === "need") return "Chưa có, cần hỗ trợ"
  return status
}

export function formatRequirementFormForAI(form: RequirementForm): string {
  const lines: string[] = []
  const typeLabel = FORM_TYPE_LABELS[form.projectType ?? ""] ?? form.projectType ?? "Yêu cầu dự án"

  lines.push(`--- PHIẾU YÊU CẦU: ${form.title || typeLabel} ---`)
  lines.push(`Mã phiếu: ${form.code || "—"}`)
  lines.push(`Loại hình dự án: ${typeLabel}`)
  if (form.lockedAt || form.createdAt) {
    lines.push(`Ngày hoàn thành: ${form.lockedAt || form.createdAt}`)
  }
  lines.push("")

  const sections: { title: string; fields: { label: string; value: unknown }[] }[] = [
    {
      title: "THÔNG TIN KHÁCH HÀNG",
      fields: [
        { label: "Tên liên hệ", value: form.customer_name },
        { label: "Công ty", value: form.company },
        { label: "Ngành", value: form.industry },
        { label: "Nguồn", value: form.source },
      ],
    },
    {
      title: "MỤC TIÊU & KPI",
      fields: [
        { label: "Mục tiêu", value: form.goal },
        { label: "Hành động mong muốn (CTA)", value: form.cta },
        { label: "KPI mong muốn", value: form.kpi },
      ],
    },
    {
      title: "SẢN PHẨM & DỊCH VỤ",
      fields: [
        { label: "Sản phẩm/Dịch vụ chính", value: form.main_product },
        { label: "USP", value: form.usp },
        { label: "Ưu đãi/Khuyến mãi", value: form.offers },
        { label: "Phân khúc giá & Cách bán", value: form.pricing },
        { label: "Ước lượng số lượng sản phẩm", value: form.product_count },
        { label: "Dịch vụ cung cấp", value: form.services },
        { label: "Điểm mạnh doanh nghiệp", value: form.strengths },
      ],
    },
    {
      title: "ĐỐI TƯỢNG MỤC TIÊU",
      fields: [
        { label: "Khách hàng mục tiêu", value: form.target_audience },
        { label: "Insight/Nỗi đau khách hàng", value: form.insight },
      ],
    },
    {
      title: "CẤU TRÚC & TÍNH NĂNG WEBSITE",
      fields: [
        { label: "Luồng người dùng (User flow)", value: form.user_flow },
        { label: "Cấu trúc trang (Sitemap)", value: form.structure },
        { label: "Các section/khối chính", value: form.sections },
        { label: "Tính năng cốt lõi ưu tiên", value: form.top_features },
        { label: "Danh sách tính năng (text)", value: form.features?.length ? form.features.join(", ") : "" },
      ],
    },
    {
      title: "THANH TOÁN & VẬN HÀNH",
      fields: [
        { label: "Phương thức thanh toán", value: form.payment_methods },
        { label: "Cách thức xử lý đơn hàng", value: form.order_handler },
        { label: "Quy trình đơn hàng", value: form.order_process },
        { label: "Tích hợp thanh toán online", value: form.payment_integrations },
        { label: "Tích hợp đơn vị vận chuyển", value: form.shipping_integrations },
      ],
    },
    {
      title: "THƯƠNG HIỆU & THIẾT KẾ",
      fields: [
        { label: "Tông màu thương hiệu", value: form.brand_color },
        { label: "Bảng màu / color scheme", value: form.colorScheme },
        { label: "Phong cách UI mong muốn", value: form.style },
        { label: "Hiện trạng Hosting/Domain", value: hostingLabel(form.hosting_status) },
        { label: "Website tham khảo", value: normalizeReferences(form.references) },
      ],
    },
    {
      title: "THỜI GIAN & NGÂN SÁCH",
      fields: [
        { label: "Thời hạn bàn giao mong muốn", value: form.deadline },
        { label: "Dự trù ngân sách", value: form.budget },
        { label: "Mức độ ưu tiên", value: form.priority },
        { label: "Ghi chú thêm", value: form.notes },
        { label: "Ghi chú bổ sung", value: form.additionalNotes },
      ],
    },
  ]

  const featureGroups = collectRequirementFeatures(form)
  if (featureGroups.length > 0) {
    sections.push({
      title: "TÍNH NĂNG ĐÃ CHỌN (CHECKBOX)",
      fields: featureGroups.map((g) => ({
        label: g.group,
        value: g.items.join(", "),
      })),
    })
  }

  if (form.attachments?.length) {
    sections.push({
      title: "TỆP ĐÍNH KÈM",
      fields: form.attachments.map((att, i) => ({
        label: `File ${i + 1}`,
        value: [att.name, att.size].filter(Boolean).join(" · "),
      })),
    })
  }

  let index = 1
  for (const section of sections) {
    const active = section.fields.filter((f) => hasValue(f.value))
    if (active.length === 0) continue
    lines.push(`${index}. ${section.title}`)
    for (const field of active) {
      lines.push(`- ${field.label}: ${field.value}`)
    }
    lines.push("")
    index += 1
  }

  return lines.join("\n").trim()
}

export function buildAiPromptWithRequirement(basePrompt: string, form: RequirementForm): string {
  const requirement = formatRequirementFormForAI(form)
  return `${basePrompt.trim()}\n\n--- DỮ LIỆU PHIẾU YÊU CẦU KHÁCH HÀNG ---\nDựa trên phiếu yêu cầu sau để lập báo giá (chi phí, phạm vi, timeline, thanh toán):\n\n${requirement}`
}
