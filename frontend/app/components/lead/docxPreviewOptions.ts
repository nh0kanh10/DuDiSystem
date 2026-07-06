/** Cấu hình chung cho docx-preview — giống tab Báo giá / Hợp đồng */
export const DOCX_PREVIEW_RENDER_OPTIONS = {
  className: "docx",
  inWrapper: true,
  breakPages: true,
  ignoreWidth: false,
  ignoreHeight: false,
  renderHeaders: true,
  renderFooters: true,
} as const

export const DOCX_PREVIEW_WRAPPER_CLASS =
  "max-h-[78vh] min-h-[420px] overflow-auto py-6 px-4 bg-[#e8eaed] [&_.docx-wrapper]:bg-white [&_.docx-wrapper]:shadow-2xl [&_.docx-wrapper]:mx-auto [&_.docx-wrapper]:max-w-[816px] [&_section.docx]:!w-full"

/** Modal tab Tài liệu — một vùng cuộn, không giới hạn chiều cao lồng nhau */
export const DOCX_PREVIEW_MODAL_CLASS =
  "w-full py-6 px-3 sm:px-6 bg-[#e8eaed] [&_.docx-wrapper]:bg-white [&_.docx-wrapper]:shadow-xl [&_.docx-wrapper]:mx-auto [&_.docx-wrapper]:max-w-[816px] [&_section.docx]:!w-full [&_section.docx]:!max-w-full"
