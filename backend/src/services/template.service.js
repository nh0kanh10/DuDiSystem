import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import PizZip from "pizzip"
import { TEMPLATE_OVERRIDE_ROOT } from "../config/index.js"
import { getFileStorage, templateMetaKey, templateOverrideKey } from "../storage/index.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BUNDLED_DIR = path.resolve(__dirname, "../../templates")

export const TEMPLATE_TYPES = {
  quote: {
    id: "quote",
    label: "Báo giá",
    bundledFilename: "bao-gia-template.docx",
    overrideFilename: "quote.docx",
    downloadName: "bao-gia-template.docx",
    fixSplitPlaceholders: true,
  },
  contract: {
    id: "contract",
    label: "Hợp đồng",
    bundledFilename: "hop-dong-template.docx",
    overrideFilename: "contract.docx",
    downloadName: "hop-dong-template.docx",
    fixSplitPlaceholders: true,
  },
}

const META_PATH = path.join(TEMPLATE_OVERRIDE_ROOT, "meta.json")

function getTypeConfig(type) {
  const cfg = TEMPLATE_TYPES[type]
  if (!cfg) throw new Error("Loại template không hợp lệ")
  return cfg
}

function bundledPath(type) {
  const cfg = getTypeConfig(type)
  return path.join(BUNDLED_DIR, cfg.bundledFilename)
}

function legacyOverridePath(type) {
  const cfg = getTypeConfig(type)
  return path.join(TEMPLATE_OVERRIDE_ROOT, cfg.overrideFilename)
}

async function readMeta() {
  try {
    const buf = await getFileStorage().get(templateMetaKey())
    if (buf?.length) return JSON.parse(buf.toString("utf8"))
  } catch {
    /* ignore */
  }
  try {
    if (fs.existsSync(META_PATH)) return JSON.parse(fs.readFileSync(META_PATH, "utf8"))
  } catch {
    /* ignore */
  }
  return {}
}

async function writeMeta(meta) {
  await getFileStorage().put(
    templateMetaKey(),
    Buffer.from(JSON.stringify(meta, null, 2), "utf8"),
    { contentType: "application/json" },
  )
}

async function hasOverrideFile(type) {
  const buf = await getFileStorage().get(templateOverrideKey(type))
  if (buf?.length) return true
  return fs.existsSync(legacyOverridePath(type))
}

async function readOverrideBuffer(type) {
  const buf = await getFileStorage().get(templateOverrideKey(type))
  if (buf?.length) return buf
  const legacy = legacyOverridePath(type)
  if (fs.existsSync(legacy)) return fs.readFileSync(legacy)
  return null
}

/** Word đôi khi tách {{phase2_content}} / {{phase4_duration}} / {{timelineTotal}} thành nhiều run */
export function fixSplitPlaceholders(xml) {
  return xml
    .replace(
      /\{\{phase<\/w:t><\/w:r><w:r[\s\S]*?<w:t>(\d)<\/w:t><\/w:r><w:r[\s\S]*?<w:t>_content\}\}/g,
      "{{phase$1_content}}",
    )
    .replace(
      /\{\{phase<\/w:t><\/w:r><w:r[\s\S]*?<w:t>(\d)<\/w:t><\/w:r><w:r[\s\S]*?<w:t>_duration\}\}/g,
      "{{phase$1_duration}}",
    )
    .replace(
      /\{\{<\/w:t><\/w:r><w:r[\s\S]*?<w:t>timeline(?:Total|Days)<\/w:t><\/w:r><w:r[\s\S]*?<w:t>\}\}/g,
      "{{timelineDays}}",
    )
}

function findTableRow(xml, needle) {
  const pos = xml.indexOf(needle)
  if (pos < 0) return null
  let trStart = xml.lastIndexOf("<w:tr ", pos)
  if (trStart < 0) trStart = xml.lastIndexOf("<w:tr>", pos)
  const trEnd = xml.indexOf("</w:tr>", pos) + 7
  return xml.substring(trStart, trEnd)
}

/** Sửa bảng tiến độ HĐ khi giai đoạn 2–4 bị dán nhầm vào 1 hàng nhiều cột */
export function repairContractPhaseTable(xml) {
  const row1 = findTableRow(xml, "Giai đoạn 1")
  const row2 = findTableRow(xml, "Giai đoạn 2")
  if (!row1 || !row2) return xml
  const cells = (row2.match(/<w:tc>/g) || []).length
  if (cells <= 3) return xml

  const clonePhaseRow = (n) => row1
    .replace(/Giai đoạn 1/g, `Giai đoạn ${n}`)
    .replace(/\{\{phase1_content\}\}/g, `{{phase${n}_content}}`)
    .replace(/\{\{phase1_duration\}\}/g, `{{phase${n}_duration}}`)

  return xml.replace(row2, [2, 3, 4].map(clonePhaseRow).join(""))
}

function prepareContractDocumentXml(xml) {
  let out = fixSplitPlaceholders(xml)
  out = repairContractPhaseTable(out)
  return out
}

function validateDocxBuffer(buffer) {
  if (!buffer?.length) throw new Error("File trống")
  const zip = new PizZip(buffer)
  const docFile = zip.file("word/document.xml")
  if (!docFile) throw new Error("File không phải .docx hợp lệ (thiếu word/document.xml)")
  return zip
}

function prepareTemplateZip(type, buffer) {
  const cfg = getTypeConfig(type)
  const zip = validateDocxBuffer(buffer)
  if (cfg.fixSplitPlaceholders) {
    const docFile = zip.file("word/document.xml")
    const raw = docFile.asText()
    const fixed = cfg.id === "contract"
      ? prepareContractDocumentXml(raw)
      : fixSplitPlaceholders(raw)
    zip.file("word/document.xml", fixed)
  }
  return zip
}

export async function getTemplateInfo(type) {
  const cfg = getTypeConfig(type)
  const bundled = bundledPath(type)
  const hasOverride = await hasOverrideFile(type)
  const meta = (await readMeta())[type] ?? {}
  let size = 0
  let updatedAt = meta.updatedAt ?? null

  if (hasOverride) {
    const buf = await readOverrideBuffer(type)
    size = buf?.length ?? 0
    if (!updatedAt && buf?.length) updatedAt = new Date().toISOString()
  } else if (fs.existsSync(bundled)) {
    const stat = fs.statSync(bundled)
    size = stat.size
    if (!updatedAt) updatedAt = stat.mtime.toISOString()
  }

  return {
    type: cfg.id,
    label: cfg.label,
    source: hasOverride ? "override" : "default",
    hasOverride,
    hasBundled: fs.existsSync(bundled),
    exists: hasOverride || fs.existsSync(bundled),
    filename: cfg.downloadName,
    updatedAt,
    updatedBy: meta.updatedBy ?? null,
    originalName: meta.originalName ?? null,
    size,
  }
}

export async function listTemplates() {
  const types = Object.keys(TEMPLATE_TYPES)
  return Promise.all(types.map((type) => getTemplateInfo(type)))
}

export async function loadTemplateZip(type) {
  const cfg = getTypeConfig(type)
  let buffer = await readOverrideBuffer(type)
  if (!buffer?.length) {
    const bundled = bundledPath(type)
    if (!fs.existsSync(bundled)) {
      throw new Error(`Chưa có template ${cfg.label}. Tải lên file .docx hoặc thêm mặc định tại templates/`)
    }
    buffer = fs.readFileSync(bundled)
  }
  return prepareTemplateZip(type, buffer)
}

export async function readTemplateFile(type) {
  const cfg = getTypeConfig(type)
  const hasOverride = await hasOverrideFile(type)
  let buffer = await readOverrideBuffer(type)
  if (!buffer?.length) {
    const bundled = bundledPath(type)
    if (!fs.existsSync(bundled)) throw new Error(`Chưa có template ${cfg.label}`)
    buffer = fs.readFileSync(bundled)
  }
  return {
    buffer,
    filename: cfg.downloadName,
    source: hasOverride ? "override" : "default",
  }
}

export async function saveTemplateOverride(type, buffer, { originalName, updatedBy } = {}) {
  getTypeConfig(type)
  validateDocxBuffer(buffer)
  await getFileStorage().put(templateOverrideKey(type), buffer, {
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  })

  const meta = await readMeta()
  meta[type] = {
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy ?? "",
    originalName: originalName ?? "",
  }
  await writeMeta(meta)
  return getTemplateInfo(type)
}

export async function resetTemplateOverride(type) {
  getTypeConfig(type)
  await getFileStorage().remove(templateOverrideKey(type))

  const meta = await readMeta()
  delete meta[type]
  await writeMeta(meta)
  return getTemplateInfo(type)
}
