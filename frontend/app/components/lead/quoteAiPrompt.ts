import { RequirementForm } from "../../types"
import { buildAiPromptWithRequirement } from "./requirementFormForAi"

export const QUOTE_AI_FORMAT_PROMPT = `Bạn là chuyên gia báo giá DUDI Software. Trả về DUY NHẤT 1 khối JSON hợp lệ (không markdown, không giải thích) theo schema:

{
  "overviewBullets": ["bullet marketing ngắn gọn"],
  "deployKind": "website",
  "costItems": [{ "name": "string", "description": "string", "amount": 2500000 }],
  "scopeItems": [{ "group": "string", "item": "string", "scope": "string" }],
  "timelineDays": "10 – 14 ngày",
  "phases": [{ "content": "string", "duration": "string" }],
  "payments": [{ "label": "Đợt 1", "percent": 50, "timing": "string" }]
}

Quy tắc:
- deployKind: "website" hoặc "hệ thống"
- costItems: amount là số nguyên VNĐ (không dấu chấm). Mỗi hạng mục triển khai chính có 1 dòng.
- scopeItems: group (nhóm), item (trang/module), scope (chi tiết, cách nhau bằng "; ")
- Luôn đủ 4 phases (content + duration kiểu "07 - 10 ngày")
- payments: tổng percent = 100, timing = thời điểm thanh toán
- Không trả customer, project, date, owner, title, bank — hệ thống tự điền từ lead
- Tuyệt đối không ghi "BÁO GIÁ PHÁT TRIỂN" trong bất kỳ field nào`

export type QuoteAiPromptMode = "format" | "requirement"

export function buildQuoteAiPrompt(
  mode: QuoteAiPromptMode,
  requirement?: RequirementForm | null,
): string {
  if (mode === "requirement" && requirement) {
    return buildAiPromptWithRequirement(QUOTE_AI_FORMAT_PROMPT, requirement)
  }
  return QUOTE_AI_FORMAT_PROMPT
}
