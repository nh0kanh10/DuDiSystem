/** Thông tin Bên B (DUDI) — cố định trong hợp đồng */
export const DUDI_PARTY_B = {
  companyName: "CÔNG TY TNHH CÔNG NGHỆ PHẦN MỀM DUDI",
  taxId: "0318776997",
  address: "232 Nguyễn Thị Minh Khai, phường Xuân Hòa, TP.HCM",
  representative: "Võ Bá Thành Nhân",
  position: "Giám đốc",
  phone: "0909 163 821",
  email: "contact@dudisoftware.com",
  bankAccount: "202412",
  bankName: "Techcombank",
  bankHolder: "CTY TNHH CONG NGHE PHAN MEM DUDI",
}

/**
 * Placeholder Word (docxtemplater) — hop-dong-template.docx
 *
 * Đầu HĐ:  {{contractNo}} {{contractDateLong}} {{contractPlace}} {{projectName}}
 * Điều 1.1: {{#costItems}}{{stt}} {{name}} {{description}} {{amount}}{{/costItems}}
 *          hoặc {{#implementationItems}}- {{text}}{{/implementationItems}}
 * Điều 1.2: {{#scopeItems}}{{group}} {{item}} {{scope}}{{/scopeItems}}
 * Điều 2:   {{timelineDays}} {{phase1_content}} {{phase1_duration}} … {{phase4_duration}}
 * Điều 3:   {{total}} {{totalWords}} {{#payments}}...{{/payments}}
 */
export function nextContractNumber(seq = 1, year = new Date().getFullYear()) {
  return `${seq}/HĐDV-DUDI/${year}`
}
