import React from "react"
import { createPortal } from "react-dom"
import { overlayLayer, type OverlayLayerKey } from "../../utils/overlayLayers"

type NestedOverlayProps = {
  children: React.ReactNode
  onClose?: () => void
  className?: string
  layer?: Extract<OverlayLayerKey, "modal" | "nestedModal" | "confirm">
}

export function NestedOverlay({
  children,
  onClose,
  className = "",
  layer = "nestedModal",
}: NestedOverlayProps) {
  if (typeof document === "undefined") return null

  return createPortal(
    <div
      className={`fixed inset-0 ${overlayLayer(layer)} flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 ${className}`}
      onClick={onClose ? (e) => {
        if (e.target === e.currentTarget) onClose()
      } : undefined}
    >
      {children}
    </div>,
    document.body,
  )
}
