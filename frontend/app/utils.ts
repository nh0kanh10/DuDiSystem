export function calcHours(ci: string, co: string): string {
  if (ci === "--" || co === "--" || !ci || !co) return "--"
  const [ih, im] = ci.split(":").map(Number)
  const [oh, om] = co.split(":").map(Number)
  if (isNaN(ih) || isNaN(im) || isNaN(oh) || isNaN(om)) return "--"
  const totalMin = oh * 60 + om - ih * 60 - im
  if (totalMin < 0) return "--"
  return `${Math.floor(totalMin / 60)}h${String(totalMin % 60).padStart(2, "0")}`
}

export function initials(name: string): string {
  return name.split(" ").pop()?.charAt(0) ?? "?"
}

export function removeVietnameseTones(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export { findBranchForNode } from "./utils/orgUtils"
