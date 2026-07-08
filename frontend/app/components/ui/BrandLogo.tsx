import logoSrc from "@/assets/logo.png"

export { logoSrc as dudiLogo }

type BrandLogoProps = {
  size?: number
  className?: string
  imageClassName?: string
  withText?: boolean
  collapsed?: boolean
  textLight?: boolean
  variant?: "default" | "hero"
}

export function BrandLogo({
  size = 36,
  className = "",
  imageClassName = "rounded-xl object-contain",
  withText = false,
  collapsed = false,
  textLight = false,
  variant = "default",
}: BrandLogoProps) {
  const titleClass = variant === "hero"
    ? `text-3xl font-black tracking-wide leading-none ${textLight ? "text-white" : "text-gray-800"}`
    : `text-sm font-black tracking-wide leading-none ${textLight ? "text-white" : "text-gray-800"}`
  const subtitleClass = variant === "hero"
    ? `font-medium ${textLight ? "text-white/50" : "text-gray-400"}`
    : `text-xs font-medium ${textLight ? "text-white/40" : "text-gray-400"}`

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={logoSrc}
        alt="DUDI Software"
        width={size}
        height={size}
        className={`flex-shrink-0 ${imageClassName}`}
        style={{ width: size, height: size }}
      />
      {withText && !collapsed && (
        <div>
          <div className={titleClass}>DUDI</div>
          <div className={subtitleClass}>software</div>
        </div>
      )}
    </div>
  )
}
