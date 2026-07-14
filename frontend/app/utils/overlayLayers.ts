/**
 * Global overlay stacking order for portaled UI.
 * Use these constants instead of ad-hoc z-50 / z-[1000] values.
 */
export const OVERLAY_LAYER = {
  fab: "z-[90]",
  portalEmbed: "z-[200]",
  staffPanel: "z-[900]",
  staffModal: "z-[1000]",
  modal: "z-[10000]",
  nestedModal: "z-[10001]",
  filePreview: "z-[10005]",  // Modal xem trước file bên trong modal đang mở
  toast: "z-[10002]",
  confirm: "z-[10003]",
  dropdown: "z-[10010]", // CustomSelect portal, DatePicker popover — must be above nestedModal
} as const

export type OverlayLayerKey = keyof typeof OVERLAY_LAYER

export function overlayLayer(key: OverlayLayerKey): string {
  return OVERLAY_LAYER[key]
}
