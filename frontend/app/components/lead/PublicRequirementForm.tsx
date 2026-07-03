import React, { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { CheckCircle2, Loader2, Send } from "lucide-react"
import { Lead, FormType } from "../../types"
import { CustomCombobox } from "../ui/CustomCombobox"

const getMockLead = (id: string): Lead | null => {
  return {
    id,
    code: "LD-2025-001",
    name: "Website bán hàng ABC",
    status: "requirement-gathering",
    contactName: "Nguyễn Văn A",
    contactPhone: "0901234567",
    contactEmail: "a@example.com",
    budgetEstimate: "50-70 triệu",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    formType: "ecommerce",
    formStatus: "sent"
  }
}

const getFormTitle = (type: FormType): string => {
  switch (type) {
    case "landing_page": return "PHIẾU THU THẬP YÊU CẦU WEBSITE LANDING PAGE"
    case "ecommerce": return "PHIẾU THU THẬP YÊU CẦU WEBSITE BÁN HÀNG (E-COMMERCE)"
    case "company_profile": return "PHIẾU THU THẬP YÊU CẦU WEBSITE GIỚI THIỆU"
    default: return "PHIẾU THU THẬP YÊU CẦU"
  }
}

export function PublicRequirementForm() {
  const { leadId } = useParams<{ leadId: string }>()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    company: "",
    industry: "",
    source: "",
    goal: "",
    cta: "",
    kpi: "",
    main_product: "",
    usp: "",
    offers: "",
    pricing: "",
    target_audience: "",
    insight: "",
    location: "",
    user_flow: "",
    structure: "",
    sections: "",
    has_register_form: false,
    has_call_button: false,
    has_chat: false,
    has_content: false,
    has_images: false,
    has_logo: false,
    brand_color: "",
    style: "",
    references: "",
    has_facebook_pixel: false,
    has_google_analytics: false,
    has_zalo_messenger: false,
    has_responsive: false,
    has_speed_optimized: false,
    has_seo: false,
    hosting_status: "",
    deadline: "",
    budget: "",
    priority: "",
    notes: "",
    product_count: "",
    has_categories: false,
    has_variants: false,
    has_blog: false,
    top_features: "",
    has_cart: false,
    has_online_payment: false,
    has_quick_order: false,
    has_user_account: false,
    has_wishlist: false,
    has_coupon: false,
    payment_methods: "",
    has_order_tracking: false,
    has_order_status: false,
    has_order_email: false,
    order_handler: "",
    order_process: "",
    has_shipping_integration: false,
    has_admin: false,
    has_product_admin: false,
    has_order_admin: false,
    has_customer_admin: false,
    payment_integrations: "",
    shipping_integrations: "",
    services: "",
    strengths: "",
    has_news: false,
    has_contact_form: false,
    has_google_maps: false,
    has_newsletter: false,
    has_content_admin: false,
    has_page_admin: false,
    has_multilingual: false,
  })

  useEffect(() => {
    if (leadId) {
      setTimeout(() => {
        const foundLead = getMockLead(leadId)
        if (foundLead) {
          setLead({...foundLead, formStatus: "opened", formOpenedAt: new Date().toISOString()})
          setForm(prev => ({
            ...prev,
            customer_name: foundLead.contactName || "",
            customer_phone: foundLead.contactPhone || "",
            customer_email: foundLead.contactEmail || "",
          }))
        }
        setLoading(false)
      }, 500)
    }
  }, [leadId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setTimeout(() => {
      if (lead) {
        setLead({...lead, formStatus: "completed", formCompletedAt: new Date().toISOString()})
      }
      setSubmitting(false)
      setSubmitted(true)
    }, 1500)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F1EF] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C62828]" />
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-[#F5F1EF] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Không tìm thấy yêu cầu</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F5F1EF] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-lg border border-gray-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-3">Cảm ơn bạn!</h2>
          <p className="text-gray-600 mb-8">
            Thông tin yêu cầu của bạn đã được gửi thành công. Chúng tôi sẽ liên hệ lại sớm nhất!
          </p>
        </div>
      </div>
    )
  }

  const currentFormType = lead.formType || "landing_page"

  return (
    <div className="min-h-screen bg-[#F5F1EF] py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
          <div className="text-center mb-8 pb-4 border-b border-gray-100">
            <h1 className="text-xl font-black text-[#C62828] mb-2">{getFormTitle(currentFormType)}</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">1</span>
                Thông tin khách hàng
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Họ tên</label>
                  <input
                    type="text"
                    required
                    value={form.customer_name}
                    onChange={(e) => setForm(prev => ({...prev, customer_name: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    required
                    value={form.customer_phone}
                    onChange={(e) => setForm(prev => ({...prev, customer_phone: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.customer_email}
                    onChange={(e) => setForm(prev => ({...prev, customer_email: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Công ty</label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm(prev => ({...prev, company: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Ngành nghề</label>
                  <input
                    type="text"
                    value={form.industry}
                    onChange={(e) => setForm(prev => ({...prev, industry: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Nguồn khách</label>
                  <input
                    type="text"
                    value={form.source}
                    onChange={(e) => setForm(prev => ({...prev, source: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* 2. Mục tiêu - All forms */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">2</span>
                Mục tiêu (WHY – QUAN TRỌNG NHẤT)
              </h3>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">{currentFormType === "landing_page" ? "Mục đích chính" : "Mục tiêu website (WHY)"}</label>
                <textarea
                  rows={3}
                  value={form.goal}
                  onChange={(e) => setForm(prev => ({...prev, goal: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Hành động mong muốn (CTA)</label>
                <textarea
                  rows={2}
                  value={form.cta}
                  onChange={(e) => setForm(prev => ({...prev, cta: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">{currentFormType === "landing_page" ? "KPI mong muốn (lead/ngày, đơn/ngày…)" : "KPI (đơn/ngày, doanh thu…)"}</label>
                <input
                  type="text"
                  value={form.kpi}
                  onChange={(e) => setForm(prev => ({...prev, kpi: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50"
                />
              </div>
            </div>

            {/* 3. Sản phẩm / Offer - Landing & Ecommerce */}
            {(currentFormType === "landing_page" || currentFormType === "ecommerce") && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">3</span>
                  {currentFormType === "landing_page" ? "Sản phẩm / Offer (WHAT)" : "Sản phẩm (WHAT)"}
                </h3>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">{currentFormType === "landing_page" ? "Sản phẩm/dịch vụ chính" : "Sản phẩm chính"}</label>
                  <textarea
                    rows={3}
                    value={form.main_product}
                    onChange={(e) => setForm(prev => ({...prev, main_product: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50 resize-none"
                  />
                </div>
                {currentFormType === "landing_page" && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Điểm nổi bật (USP)</label>
                      <textarea
                        rows={2}
                        value={form.usp}
                        onChange={(e) => setForm(prev => ({...prev, usp: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Ưu đãi (nếu có)</label>
                      <textarea
                        rows={2}
                        value={form.offers}
                        onChange={(e) => setForm(prev => ({...prev, offers: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Giá / cách bán</label>
                      <input
                        type="text"
                        value={form.pricing}
                        onChange={(e) => setForm(prev => ({...prev, pricing: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50"
                      />
                    </div>
                  </>
                )}
                {currentFormType === "ecommerce" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Số lượng sản phẩm dự kiến</label>
                      <input
                        type="text"
                        value={form.product_count}
                        onChange={(e) => setForm(prev => ({...prev, product_count: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="has_categories"
                        checked={form.has_categories}
                        onChange={(e) => setForm(prev => ({...prev, has_categories: e.target.checked}))}
                        className="w-4 h-4 text-[#C62828] rounded"
                      />
                      <label htmlFor="has_categories" className="text-xs font-bold text-gray-600">Có phân loại danh mục</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="has_variants"
                        checked={form.has_variants}
                        onChange={(e) => setForm(prev => ({...prev, has_variants: e.target.checked}))}
                        className="w-4 h-4 text-[#C62828] rounded"
                      />
                      <label htmlFor="has_variants" className="text-xs font-bold text-gray-600">Có biến thể (size, màu…)</label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. Tổng quan doanh nghiệp - Company profile */}
            {currentFormType === "company_profile" && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">3</span>
                  Tổng quan doanh nghiệp (WHAT)
                </h3>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Sản phẩm/dịch vụ chính</label>
                  <textarea
                    rows={3}
                    value={form.main_product}
                    onChange={(e) => setForm(prev => ({...prev, main_product: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Danh sách dịch vụ</label>
                  <textarea
                    rows={3}
                    value={form.services}
                    onChange={(e) => setForm(prev => ({...prev, services: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Điểm mạnh / lợi thế</label>
                  <textarea
                    rows={2}
                    value={form.strengths}
                    onChange={(e) => setForm(prev => ({...prev, strengths: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50 resize-none"
                  />
                </div>
              </div>
            )}

            {/* 4. Khách hàng mục tiêu - All forms */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">4</span>
                Khách hàng mục tiêu
              </h3>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Đối tượng</label>
                <textarea
                  rows={2}
                  value={form.target_audience}
                  onChange={(e) => setForm(prev => ({...prev, target_audience: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50 resize-none"
                />
              </div>
              {currentFormType === "landing_page" && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Insight / vấn đề khách đang gặp</label>
                  <textarea
                    rows={2}
                    value={form.insight}
                    onChange={(e) => setForm(prev => ({...prev, insight: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50 resize-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Khu vực</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm(prev => ({...prev, location: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50"
                />
              </div>
            </div>

            {/* 5. Hành trình người dùng - All forms */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">5</span>
                Hành trình người dùng (FLOW)
              </h3>
              <div>
                <textarea
                  rows={3}
                  value={form.user_flow}
                  onChange={(e) => setForm(prev => ({...prev, user_flow: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50 resize-none"
                  placeholder={currentFormType === "landing_page" ? "Khách vào → sẽ làm gì → kết thúc ra sao" :
                                 currentFormType === "ecommerce" ? "Khách vào → xem → thêm giỏ → thanh toán → nhận hàng" :
                                 "Khách vào → xem gì → liên hệ như thế nào"}
                />
              </div>
            </div>

            {/* 6. Nội dung landing / Cấu trúc website - All forms */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">6</span>
                {currentFormType === "landing_page" ? "Nội dung landing (STRUCTURE)" : "Cấu trúc website (STRUCTURE)"}
              </h3>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">{currentFormType === "landing_page" ? "Các section dự kiến (Hero / Giới thiệu / Lợi ích / Feedback / CTA…)" : "Trang dự kiến"}</label>
                <textarea
                  rows={3}
                  value={form.structure}
                  onChange={(e) => setForm(prev => ({...prev, structure: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50 resize-none"
                />
              </div>
              {currentFormType !== "landing_page" && (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="has_blog"
                    checked={form.has_blog}
                    onChange={(e) => setForm(prev => ({...prev, has_blog: e.target.checked}))}
                    className="w-4 h-4 text-[#C62828] rounded"
                  />
                  <label htmlFor="has_blog" className="text-xs font-bold text-gray-600">
                    {currentFormType === "company_profile" ? "Có blog / tin tức" : "Có blog"}
                  </label>
                </div>
              )}
            </div>

            {/* 7. Chức năng - Landing page */}
            {currentFormType === "landing_page" && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">7</span>
                  Chức năng (FEATURE)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_register_form"
                      checked={form.has_register_form}
                      onChange={(e) => setForm(prev => ({...prev, has_register_form: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_register_form" className="text-xs font-bold text-gray-600">Form đăng ký</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_call_button"
                      checked={form.has_call_button}
                      onChange={(e) => setForm(prev => ({...prev, has_call_button: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_call_button" className="text-xs font-bold text-gray-600">Gọi điện (click to call)</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_chat"
                      checked={form.has_chat}
                      onChange={(e) => setForm(prev => ({...prev, has_chat: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_chat" className="text-xs font-bold text-gray-600">Chat (Zalo, Messenger)</label>
                  </div>
                </div>
              </div>
            )}

            {/* 7. Chức năng chính - Ecommerce */}
            {currentFormType === "ecommerce" && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">7</span>
                  Chức năng chính (FEATURE)
                </h3>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">3 chức năng quan trọng nhất</label>
                  <textarea
                    rows={2}
                    value={form.top_features}
                    onChange={(e) => setForm(prev => ({...prev, top_features: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50 resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_cart"
                      checked={form.has_cart}
                      onChange={(e) => setForm(prev => ({...prev, has_cart: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_cart" className="text-xs font-bold text-gray-600">Giỏ hàng</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_online_payment"
                      checked={form.has_online_payment}
                      onChange={(e) => setForm(prev => ({...prev, has_online_payment: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_online_payment" className="text-xs font-bold text-gray-600">Thanh toán online</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_quick_order"
                      checked={form.has_quick_order}
                      onChange={(e) => setForm(prev => ({...prev, has_quick_order: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_quick_order" className="text-xs font-bold text-gray-600">Form đặt hàng nhanh</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_user_account"
                      checked={form.has_user_account}
                      onChange={(e) => setForm(prev => ({...prev, has_user_account: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_user_account" className="text-xs font-bold text-gray-600">Tài khoản người dùng</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_wishlist"
                      checked={form.has_wishlist}
                      onChange={(e) => setForm(prev => ({...prev, has_wishlist: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_wishlist" className="text-xs font-bold text-gray-600">Wishlist (yêu thích)</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_coupon"
                      checked={form.has_coupon}
                      onChange={(e) => setForm(prev => ({...prev, has_coupon: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_coupon" className="text-xs font-bold text-gray-600">Mã giảm giá</label>
                  </div>
                </div>
              </div>
            )}

            {/* 7. Chức năng chính - Company profile */}
            {currentFormType === "company_profile" && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">7</span>
                  Chức năng chính (FEATURE)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_contact_form"
                      checked={form.has_contact_form}
                      onChange={(e) => setForm(prev => ({...prev, has_contact_form: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_contact_form" className="text-xs font-bold text-gray-600">Form liên hệ</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_chat_cp"
                      checked={form.has_chat}
                      onChange={(e) => setForm(prev => ({...prev, has_chat: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_chat_cp" className="text-xs font-bold text-gray-600">Chat (Zalo, Messenger)</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_google_maps"
                      checked={form.has_google_maps}
                      onChange={(e) => setForm(prev => ({...prev, has_google_maps: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_google_maps" className="text-xs font-bold text-gray-600">Bản đồ Google Maps</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_newsletter"
                      checked={form.has_newsletter}
                      onChange={(e) => setForm(prev => ({...prev, has_newsletter: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_newsletter" className="text-xs font-bold text-gray-600">Đăng ký nhận tin</label>
                  </div>
                </div>
              </div>
            )}

            {/* 8. Đơn hàng & thanh toán - Ecommerce */}
            {currentFormType === "ecommerce" && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">8</span>
                  Đơn hàng & thanh toán (CORE)
                </h3>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Phương thức thanh toán (COD / Chuyển khoản / Online…)</label>
                  <input
                    type="text"
                    value={form.payment_methods}
                    onChange={(e) => setForm(prev => ({...prev, payment_methods: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_order_tracking"
                      checked={form.has_order_tracking}
                      onChange={(e) => setForm(prev => ({...prev, has_order_tracking: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_order_tracking" className="text-xs font-bold text-gray-600">Có lưu đơn hàng</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_order_status"
                      checked={form.has_order_status}
                      onChange={(e) => setForm(prev => ({...prev, has_order_status: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_order_status" className="text-xs font-bold text-gray-600">Trạng thái đơn</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_order_email"
                      checked={form.has_order_email}
                      onChange={(e) => setForm(prev => ({...prev, has_order_email: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_order_email" className="text-xs font-bold text-gray-600">Có email xác nhận đơn</label>
                  </div>
                </div>
              </div>
            )}

            {/* 8. Nội dung & tài nguyên - Landing & Company profile */}
            {(currentFormType === "landing_page" || currentFormType === "company_profile") && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">8</span>
                  Nội dung & tài nguyên
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_content"
                      checked={form.has_content}
                      onChange={(e) => setForm(prev => ({...prev, has_content: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_content" className="text-xs font-bold text-gray-600">Có nội dung</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_images"
                      checked={form.has_images}
                      onChange={(e) => setForm(prev => ({...prev, has_images: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_images" className="text-xs font-bold text-gray-600">
                      {currentFormType === "landing_page" ? "Có hình ảnh/video" : "Có hình ảnh/video sản phẩm"}
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 9. Vận hành - Ecommerce */}
            {currentFormType === "ecommerce" && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">9</span>
                  Vận hành (RẤT QUAN TRỌNG)
                </h3>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Ai xử lý đơn</label>
                  <input
                    type="text"
                    value={form.order_handler}
                    onChange={(e) => setForm(prev => ({...prev, order_handler: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Quy trình xử lý đơn</label>
                  <textarea
                    rows={2}
                    value={form.order_process}
                    onChange={(e) => setForm(prev => ({...prev, order_process: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50 resize-none"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="has_shipping_integration"
                    checked={form.has_shipping_integration}
                    onChange={(e) => setForm(prev => ({...prev, has_shipping_integration: e.target.checked}))}
                    className="w-4 h-4 text-[#C62828] rounded"
                  />
                  <label htmlFor="has_shipping_integration" className="text-xs font-bold text-gray-600">Có cần kết nối vận chuyển (GHN, GHTK…)</label>
                </div>
              </div>
            )}

            {/* 9. Nội dung & tài nguyên - Ecommerce */}
            {currentFormType === "ecommerce" && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">10</span>
                  Nội dung & tài nguyên
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_content_ecom"
                      checked={form.has_content}
                      onChange={(e) => setForm(prev => ({...prev, has_content: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_content_ecom" className="text-xs font-bold text-gray-600">Có nội dung</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_images_ecom"
                      checked={form.has_images}
                      onChange={(e) => setForm(prev => ({...prev, has_images: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_images_ecom" className="text-xs font-bold text-gray-600">Có hình ảnh/video sản phẩm</label>
                  </div>
                </div>
              </div>
            )}

            {/* 9. Branding & UI - Landing page */}
            {currentFormType === "landing_page" && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">9</span>
                  Branding & UI
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_logo_lp"
                      checked={form.has_logo}
                      onChange={(e) => setForm(prev => ({...prev, has_logo: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_logo_lp" className="text-xs font-bold text-gray-600">Có logo</label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Màu thương hiệu</label>
                  <input
                    type="text"
                    value={form.brand_color}
                    onChange={(e) => setForm(prev => ({...prev, brand_color: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Phong cách mong muốn</label>
                  <input
                    type="text"
                    value={form.style}
                    onChange={(e) => setForm(prev => ({...prev, style: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Landing tham khảo</label>
                  <textarea
                    rows={2}
                    value={form.references}
                    onChange={(e) => setForm(prev => ({...prev, references: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50 resize-none"
                  />
                </div>
              </div>
            )}

            {/* 10. Branding & UI - Ecommerce */}
            {currentFormType === "ecommerce" && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">11</span>
                  Branding & UI
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_logo_ecom"
                      checked={form.has_logo}
                      onChange={(e) => setForm(prev => ({...prev, has_logo: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_logo_ecom" className="text-xs font-bold text-gray-600">Có logo</label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Màu thương hiệu</label>
                  <input
                    type="text"
                    value={form.brand_color}
                    onChange={(e) => setForm(prev => ({...prev, brand_color: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Phong cách UI</label>
                  <input
                    type="text"
                    value={form.style}
                    onChange={(e) => setForm(prev => ({...prev, style: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Website tham khảo</label>
                  <textarea
                    rows={2}
                    value={form.references}
                    onChange={(e) => setForm(prev => ({...prev, references: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50 resize-none"
                  />
                </div>
              </div>
            )}

            {/* 10. Branding & UI - Company profile */}
            {currentFormType === "company_profile" && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">9</span>
                  Branding & UI
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_logo_cp"
                      checked={form.has_logo}
                      onChange={(e) => setForm(prev => ({...prev, has_logo: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_logo_cp" className="text-xs font-bold text-gray-600">Có logo</label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Màu thương hiệu</label>
                  <input
                    type="text"
                    value={form.brand_color}
                    onChange={(e) => setForm(prev => ({...prev, brand_color: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Phong cách UI</label>
                  <input
                    type="text"
                    value={form.style}
                    onChange={(e) => setForm(prev => ({...prev, style: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Website tham khảo</label>
                  <textarea
                    rows={2}
                    value={form.references}
                    onChange={(e) => setForm(prev => ({...prev, references: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50 resize-none"
                  />
                </div>
              </div>
            )}

            {/* 10. Tích hợp - Landing page */}
            {currentFormType === "landing_page" && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">10</span>
                  Tích hợp
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_facebook_pixel"
                      checked={form.has_facebook_pixel}
                      onChange={(e) => setForm(prev => ({...prev, has_facebook_pixel: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_facebook_pixel" className="text-xs font-bold text-gray-600">Facebook Pixel</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_google_analytics"
                      checked={form.has_google_analytics}
                      onChange={(e) => setForm(prev => ({...prev, has_google_analytics: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_google_analytics" className="text-xs font-bold text-gray-600">Google Analytics</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_zalo_messenger_lp"
                      checked={form.has_zalo_messenger}
                      onChange={(e) => setForm(prev => ({...prev, has_zalo_messenger: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_zalo_messenger_lp" className="text-xs font-bold text-gray-600">Zalo / Messenger</label>
                  </div>
                </div>
              </div>
            )}

            {/* 12. Hệ thống quản trị - Company profile */}
            {currentFormType === "company_profile" && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">10</span>
                  Hệ thống quản trị (ADMIN)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_admin_cp"
                      checked={form.has_admin}
                      onChange={(e) => setForm(prev => ({...prev, has_admin: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_admin_cp" className="text-xs font-bold text-gray-600">Có admin</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_content_admin"
                      checked={form.has_content_admin}
                      onChange={(e) => setForm(prev => ({...prev, has_content_admin: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_content_admin" className="text-xs font-bold text-gray-600">Quản lý bài viết</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_page_admin"
                      checked={form.has_page_admin}
                      onChange={(e) => setForm(prev => ({...prev, has_page_admin: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_page_admin" className="text-xs font-bold text-gray-600">Quản lý nội dung trang</label>
                  </div>
                </div>
              </div>
            )}

            {/* 12. Hệ thống quản trị - Ecommerce */}
            {currentFormType === "ecommerce" && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">12</span>
                  Hệ thống quản trị (ADMIN)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_admin_ecom"
                      checked={form.has_admin}
                      onChange={(e) => setForm(prev => ({...prev, has_admin: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_admin_ecom" className="text-xs font-bold text-gray-600">Có admin</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_product_admin"
                      checked={form.has_product_admin}
                      onChange={(e) => setForm(prev => ({...prev, has_product_admin: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_product_admin" className="text-xs font-bold text-gray-600">Quản lý sản phẩm</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_order_admin"
                      checked={form.has_order_admin}
                      onChange={(e) => setForm(prev => ({...prev, has_order_admin: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_order_admin" className="text-xs font-bold text-gray-600">Quản lý đơn hàng</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_customer_admin"
                      checked={form.has_customer_admin}
                      onChange={(e) => setForm(prev => ({...prev, has_customer_admin: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_customer_admin" className="text-xs font-bold text-gray-600">Quản lý khách hàng</label>
                  </div>
                </div>
              </div>
            )}

            {/* 11. Tích hợp hệ thống - Company profile */}
            {currentFormType === "company_profile" && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">11</span>
                  Tích hợp hệ thống
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_zalo_messenger_cp"
                      checked={form.has_zalo_messenger}
                      onChange={(e) => setForm(prev => ({...prev, has_zalo_messenger: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_zalo_messenger_cp" className="text-xs font-bold text-gray-600">Zalo / Messenger</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_google_maps_cp"
                      checked={form.has_google_maps}
                      onChange={(e) => setForm(prev => ({...prev, has_google_maps: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_google_maps_cp" className="text-xs font-bold text-gray-600">Google Maps</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_facebook_pixel_cp"
                      checked={form.has_facebook_pixel}
                      onChange={(e) => setForm(prev => ({...prev, has_facebook_pixel: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_facebook_pixel_cp" className="text-xs font-bold text-gray-600">Facebook Pixel / GA</label>
                  </div>
                </div>
              </div>
            )}

            {/* 13. Tích hợp hệ thống - Ecommerce */}
            {currentFormType === "ecommerce" && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">13</span>
                  Tích hợp hệ thống
                </h3>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Thanh toán (VNPay, Momo…)</label>
                  <input
                    type="text"
                    value={form.payment_integrations}
                    onChange={(e) => setForm(prev => ({...prev, payment_integrations: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Vận chuyển</label>
                  <input
                    type="text"
                    value={form.shipping_integrations}
                    onChange={(e) => setForm(prev => ({...prev, shipping_integrations: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_facebook_pixel_ecom"
                      checked={form.has_facebook_pixel}
                      onChange={(e) => setForm(prev => ({...prev, has_facebook_pixel: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_facebook_pixel_ecom" className="text-xs font-bold text-gray-600">Facebook Pixel / GA</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_zalo_messenger_ecom"
                      checked={form.has_zalo_messenger}
                      onChange={(e) => setForm(prev => ({...prev, has_zalo_messenger: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_zalo_messenger_ecom" className="text-xs font-bold text-gray-600">Chat (Zalo, Messenger)</label>
                  </div>
                </div>
              </div>
            )}

            {/* 11. Nền tảng & kỹ thuật - Landing page */}
            {currentFormType === "landing_page" && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">11</span>
                  Nền tảng & kỹ thuật
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_responsive_lp"
                      checked={form.has_responsive}
                      onChange={(e) => setForm(prev => ({...prev, has_responsive: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_responsive_lp" className="text-xs font-bold text-gray-600">Responsive mobile</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_speed_optimized_lp"
                      checked={form.has_speed_optimized}
                      onChange={(e) => setForm(prev => ({...prev, has_speed_optimized: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_speed_optimized_lp" className="text-xs font-bold text-gray-600">Tối ưu tốc độ</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_seo_lp"
                      checked={form.has_seo}
                      onChange={(e) => setForm(prev => ({...prev, has_seo: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_seo_lp" className="text-xs font-bold text-gray-600">Chuẩn SEO cơ bản</label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Hosting / Domain</label>
                  <CustomCombobox
                    value={form.hosting_status}
                    onChange={(val) => setForm(prev => ({...prev, hosting_status: val}))}
                    placeholder="Chọn"
                    options={[
                      { value: "already", label: "Đã có" },
                      { value: "not_yet", label: "Chưa có" }
                    ]}
                  />
                </div>
              </div>
            )}

            {/* 12. Nền tảng & kỹ thuật - Company profile */}
            {currentFormType === "company_profile" && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">12</span>
                  Nền tảng & kỹ thuật
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_responsive_cp"
                      checked={form.has_responsive}
                      onChange={(e) => setForm(prev => ({...prev, has_responsive: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_responsive_cp" className="text-xs font-bold text-gray-600">Responsive mobile</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_seo_cp"
                      checked={form.has_seo}
                      onChange={(e) => setForm(prev => ({...prev, has_seo: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_seo_cp" className="text-xs font-bold text-gray-600">SEO cơ bản</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_multilingual"
                      checked={form.has_multilingual}
                      onChange={(e) => setForm(prev => ({...prev, has_multilingual: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_multilingual" className="text-xs font-bold text-gray-600">Đa ngôn ngữ</label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Hosting / Domain</label>
                  <CustomCombobox
                    value={form.hosting_status}
                    onChange={(val) => setForm(prev => ({...prev, hosting_status: val}))}
                    placeholder="Chọn"
                    options={[
                      { value: "already", label: "Đã có" },
                      { value: "not_yet", label: "Chưa có" }
                    ]}
                  />
                </div>
              </div>
            )}

            {/* 14. Nền tảng & kỹ thuật - Ecommerce */}
            {currentFormType === "ecommerce" && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">14</span>
                  Nền tảng & kỹ thuật
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_responsive_ecom"
                      checked={form.has_responsive}
                      onChange={(e) => setForm(prev => ({...prev, has_responsive: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_responsive_ecom" className="text-xs font-bold text-gray-600">Responsive mobile</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_seo_ecom"
                      checked={form.has_seo}
                      onChange={(e) => setForm(prev => ({...prev, has_seo: e.target.checked}))}
                      className="w-4 h-4 text-[#C62828] rounded"
                    />
                    <label htmlFor="has_seo_ecom" className="text-xs font-bold text-gray-600">SEO cơ bản</label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Tốc độ tải trang</label>
                  <CustomCombobox
                    value={form.pricing}
                    onChange={(val) => setForm(prev => ({...prev, pricing: val}))}
                    placeholder="Chọn"
                    options={[
                      { value: "priority", label: "Ưu tiên" },
                      { value: "normal", label: "Bình thường" }
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Hosting / Domain</label>
                  <CustomCombobox
                    value={form.hosting_status}
                    onChange={(val) => setForm(prev => ({...prev, hosting_status: val}))}
                    placeholder="Chọn"
                    options={[
                      { value: "already", label: "Đã có" },
                      { value: "not_yet", label: "Chưa có" }
                    ]}
                  />
                </div>
              </div>
            )}

            {/* 12-15. Thời gian & ngân sách - All forms */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                  {currentFormType === "landing_page" ? 12 : currentFormType === "ecommerce" ? 15 : 13}
                </span>
                Thời gian & ngân sách
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Deadline</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm(prev => ({...prev, deadline: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Ngân sách</label>
                  <input
                    type="text"
                    value={form.budget}
                    onChange={(e) => setForm(prev => ({...prev, budget: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* 13-16. Ưu tiên - All forms */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                  {currentFormType === "landing_page" ? 13 : currentFormType === "ecommerce" ? 16 : 14}
                </span>
                Ưu tiên
              </h3>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Yêu cầu quan trọng nhất</label>
                <textarea
                  rows={2}
                  value={form.priority}
                  onChange={(e) => setForm(prev => ({...prev, priority: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50 resize-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                  {currentFormType === "landing_page" ? 14 : currentFormType === "ecommerce" ? 17 : 15}
                </span>
                Ghi chú
              </h3>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Khác</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm(prev => ({...prev, notes: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 bg-gray-50 resize-none"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-[#C62828] to-[#E64A19] text-white font-black rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Gửi form
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
