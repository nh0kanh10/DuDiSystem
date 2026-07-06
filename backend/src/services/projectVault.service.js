import { v4 as uuidv4 } from "uuid"
import * as repo from "../repositories/projectVault.repository.js"
import * as projectRepo from "../repositories/project.repository.js"
import { getById as getEmployeeById } from "../repositories/employee.repository.js"
import { getFileStorage, projectVaultFileKey } from "../storage/index.js"
import { FILE_STORAGE_PROVIDER } from "../config/index.js"
import { vaultMetaToLegacy } from "../utils/vaultMeta.util.js"
import { decodeUploadFilename } from "../utils/uploadFilename.util.js"

function displayName(userId) {
  if (!userId) return ""
  return getEmployeeById(userId)?.name ?? userId
}

function assertProject(projectId) {
  const project = projectRepo.getById(projectId)
  if (!project) throw new Error("Không tìm thấy dự án")
  return project
}

function publicItem(doc) {
  const hasFile = Boolean(doc.storageKey && doc.fileSize)
  return {
    ...doc,
    hasFile,
    fileAttachment: hasFile
      ? {
          name: doc.fileName || "file",
          size: doc.fileSize || 0,
          mimeType: doc.mimeType || "application/octet-stream",
          hasFile: true,
        }
      : undefined,
  }
}

async function persistFile(projectId, itemId, file) {
  if (!file?.buffer?.length) return null
  const fileName = decodeUploadFilename(String(file.originalname || "file").trim()) || "file"
  const storageKey = projectVaultFileKey(projectId, itemId, fileName)
  await getFileStorage().put(storageKey, file.buffer)
  return {
    storageKey,
    fileName,
    fileSize: file.buffer.length,
    mimeType: file.mimetype || "application/octet-stream",
    storageProvider: FILE_STORAGE_PROVIDER,
  }
}

export function listVaultItems(projectId) {
  assertProject(projectId)
  return repo.listByProject(projectId).map(publicItem)
}

export function getVaultItem(projectId, itemId) {
  assertProject(projectId)
  const doc = repo.getById(itemId)
  if (!doc || String(doc.projectId) !== String(projectId)) return null
  return doc
}

export async function createVaultItem(projectId, body = {}, file = null, user = {}) {
  assertProject(projectId)

  const name = String(body.name || "").trim()
  if (!name) throw new Error("Tên tài liệu là bắt buộc")

  const id = `PVAULT-${uuidv4().slice(0, 8).toUpperCase()}`
  const now = new Date().toISOString()
  const createdBy = user.employeeId ?? user.id ?? ""

  const meta = typeof body.meta === "object" && body.meta ? body.meta : {}
  const legacy = vaultMetaToLegacy({
    category: body.category,
    meta,
    value: body.value,
    url: body.url,
  })

  const filePatch = await persistFile(projectId, id, file)

  const doc = {
    id,
    projectId: String(projectId),
    audience: body.audience === "internal" ? "internal" : "client",
    category: body.category || "other",
    name,
    meta,
    description: String(body.description || "").trim(),
    value: legacy.value || "",
    url: legacy.url || "",
    parentId: body.parentId || null,
    isAppendix: Boolean(body.isAppendix),
    storageKey: filePatch?.storageKey ?? null,
    fileName: filePatch?.fileName ?? null,
    fileSize: filePatch?.fileSize ?? 0,
    mimeType: filePatch?.mimeType ?? null,
    storageProvider: filePatch?.storageProvider ?? FILE_STORAGE_PROVIDER,
    createdAt: now,
    updatedAt: now,
    createdBy,
    createdByName: displayName(createdBy),
  }

  repo.create(doc)
  return publicItem(doc)
}

export async function updateVaultItem(projectId, itemId, body = {}, file = null, user = {}) {
  const existing = getVaultItem(projectId, itemId)
  if (!existing) throw new Error("Không tìm thấy tài liệu vault")

  const name = body.name != null ? String(body.name).trim() : existing.name
  if (!name) throw new Error("Tên tài liệu là bắt buộc")

  const meta = body.meta != null ? body.meta : existing.meta
  const legacy = vaultMetaToLegacy({
    category: body.category ?? existing.category,
    meta,
    value: body.value ?? existing.value,
    url: body.url ?? existing.url,
  })

  const patch = {
    name,
    audience: body.audience ?? existing.audience,
    category: body.category ?? existing.category,
    meta,
    description: body.description != null ? String(body.description).trim() : existing.description,
    parentId: body.parentId !== undefined ? body.parentId : existing.parentId,
    isAppendix: body.isAppendix !== undefined ? Boolean(body.isAppendix) : existing.isAppendix,
    value: legacy.value || "",
    url: legacy.url || "",
    updatedAt: new Date().toISOString(),
    updatedBy: user.employeeId ?? user.id ?? "",
    updatedByName: displayName(user.employeeId ?? user.id),
  }

  if (file?.buffer?.length) {
    if (existing.storageKey) {
      try {
        await getFileStorage().remove(existing.storageKey)
      } catch {
      }
    }
    const filePatch = await persistFile(projectId, itemId, file)
    Object.assign(patch, filePatch)
  }

  const updated = repo.updateById(itemId, patch)
  return publicItem(updated)
}

export async function deleteVaultItem(projectId, itemId) {
  const existing = getVaultItem(projectId, itemId)
  if (!existing) throw new Error("Không tìm thấy tài liệu vault")

  if (existing.storageKey) {
    try {
      await getFileStorage().remove(existing.storageKey)
    } catch {
    }
  }

  repo.deleteById(itemId)
  return { id: itemId }
}

export async function getVaultItemFile(projectId, itemId) {
  const doc = getVaultItem(projectId, itemId)
  if (!doc?.storageKey) return null
  const buffer = await getFileStorage().get(doc.storageKey)
  if (!buffer) return null
  return {
    buffer,
    filename: doc.fileName || `${doc.name}`,
    mimeType: doc.mimeType || "application/octet-stream",
    doc,
  }
}
