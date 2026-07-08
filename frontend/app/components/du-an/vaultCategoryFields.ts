import { ProjectVaultCategory } from "../../types"

export type VaultFieldType = "text" | "password" | "url" | "date" | "textarea" | "select"

export type VaultFieldDef = {
  key: string
  label: string
  type?: VaultFieldType
  placeholder?: string
  options?: { value: string; label: string }[]
}

export const VAULT_CATEGORY_FIELDS: Record<ProjectVaultCategory, VaultFieldDef[]> = {
  hosting: [
    { key: "provider", label: "Nhà cung cấp", placeholder: "AZDIGI, Vultr, AWS..." },
    { key: "host", label: "IP / Hostname", placeholder: "123.45.67.89" },
    { key: "username", label: "Username / SSH user" },
    { key: "password", label: "Mật khẩu / SSH key", type: "password" },
    { key: "panelUrl", label: "URL panel quản trị", type: "url", placeholder: "https://..." },
  ],
  domain: [
    { key: "registrar", label: "Registrar", placeholder: "Tên Miền Việt, GoDaddy..." },
    { key: "domain", label: "Tên miền", placeholder: "example.com" },
    { key: "expireDate", label: "Ngày hết hạn", type: "date" },
    { key: "nameservers", label: "Nameserver / DNS", type: "textarea", placeholder: "ns1.example.com" },
  ],
  credentials: [
    { key: "service", label: "Dịch vụ", placeholder: "GitHub, FTP, cPanel, WP Admin..." },
    { key: "username", label: "Tài khoản" },
    { key: "password", label: "Mật khẩu", type: "password" },
    { key: "loginUrl", label: "Link đăng nhập", type: "url" },
  ],
  "internal-handover": [
    { key: "handoverTo", label: "Bàn giao cho", placeholder: "Tên nhân viên / team" },
    { key: "handoverDate", label: "Ngày bàn giao", type: "date" },
    { key: "content", label: "Nội dung bàn giao", type: "textarea" },
    { key: "checklistUrl", label: "Link checklist / biên bản", type: "url" },
  ],
  "tech-doc": [
    {
      key: "docType",
      label: "Loại tài liệu",
      type: "select",
      options: [
        { value: "api", label: "API / Swagger" },
        { value: "architecture", label: "Kiến trúc hệ thống" },
        { value: "deploy", label: "Hướng dẫn deploy" },
        { value: "runbook", label: "Runbook vận hành" },
        { value: "other", label: "Khác" },
      ],
    },
    { key: "version", label: "Phiên bản", placeholder: "v1.0" },
    { key: "docUrl", label: "Link tài liệu", type: "url" },
  ],
  license: [
    { key: "product", label: "Sản phẩm / Plugin", placeholder: "Elementor Pro, Windows..." },
    { key: "licenseKey", label: "License key", type: "password" },
    { key: "seats", label: "Giới hạn (seat / domain)", placeholder: "1 site, 5 users..." },
    { key: "expireDate", label: "Ngày hết hạn", type: "date" },
  ],
  assets: [
    { key: "assetType", label: "Loại tài nguyên", placeholder: "Logo, font, ảnh, video..." },
    { key: "storageUrl", label: "Link Drive / Figma / CDN", type: "url" },
    { key: "notes", label: "Ghi chú sử dụng", type: "textarea" },
  ],
  other: [
    { key: "info", label: "Thông tin chính", type: "textarea" },
    { key: "link", label: "Link liên quan", type: "url" },
  ],
  quotation: [
    { key: "quoteNo", label: "Mã / số báo giá" },
    { key: "amount", label: "Giá trị (VNĐ)", placeholder: "15.000.000" },
    { key: "quoteUrl", label: "Link file báo giá", type: "url" },
  ],
  requirement: [
    { key: "version", label: "Phiên bản SRS / phiếu YC" },
    { key: "reqUrl", label: "Link tài liệu", type: "url" },
    { key: "approvedBy", label: "Người duyệt" },
  ],
  contract: [
    { key: "contractNo", label: "Số hợp đồng" },
    { key: "signDate", label: "Ngày ký", type: "date" },
    { key: "contractUrl", label: "Link hợp đồng", type: "url" },
  ],
  "client-handover": [
    { key: "handoverDate", label: "Ngày bàn giao", type: "date" },
    { key: "receiver", label: "Người nhận (phía khách)" },
    { key: "handoverUrl", label: "Biên bản / link bàn giao", type: "url" },
  ],
  "client-account": [
    { key: "system", label: "Hệ thống", placeholder: "Admin website, email hosting..." },
    { key: "username", label: "Tài khoản" },
    { key: "password", label: "Mật khẩu", type: "password" },
    { key: "loginUrl", label: "URL đăng nhập", type: "url" },
  ],
  "client-file": [
    { key: "fileUrl", label: "Link file / Drive", type: "url" },
    { key: "sentDate", label: "Ngày gửi khách", type: "date" },
    { key: "channel", label: "Kênh gửi", placeholder: "Email, Zalo, link công khai..." },
  ],
}

export function vaultMetaToLegacy(item: {
  category: ProjectVaultCategory
  meta?: Record<string, string>
  value?: string
  url?: string
}) {
  const m = item.meta ?? {}
  const urlKeys = ["panelUrl", "loginUrl", "docUrl", "quoteUrl", "reqUrl", "contractUrl", "handoverUrl", "checklistUrl", "storageUrl", "link", "fileUrl"]
  const secretKeys = ["password", "licenseKey"]
  const url = item.url || urlKeys.map((k) => m[k]).find(Boolean) || ""
  const value = item.value || secretKeys.map((k) => m[k]).find(Boolean) || m.info || m.quoteNo || m.contractNo || ""
  return { url: url || undefined, value: value || undefined }
}
