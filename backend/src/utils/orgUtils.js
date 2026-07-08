const VALID_TYPES = ["branch", "department", "sub-department", "position", "team"]

const PARENT_TYPE = {
  branch: null,
  department: "branch",
  "sub-department": "department",
  position: "sub-department",
  team: "position",
}

export function getNodeById(nodes, id) {
  return nodes.find(n => n.id === id) ?? null
}

export function getAncestorChain(nodeId, nodes) {
  const chain = []
  let current = getNodeById(nodes, nodeId)
  const seen = new Set()
  while (current) {
    if (seen.has(current.id)) break
    seen.add(current.id)
    chain.unshift(current)
    current = current.parentId ? getNodeById(nodes, current.parentId) : null
  }
  return chain
}

export function findBranchId(nodeId, nodes) {
  let current = getNodeById(nodes, nodeId)
  const seen = new Set()
  while (current) {
    if (seen.has(current.id)) return ""
    seen.add(current.id)
    if (current.type === "branch") return current.id
    current = current.parentId ? getNodeById(nodes, current.parentId) : null
  }
  return ""
}

export function buildOrgSnapshot(nodeId, nodes) {
  return getAncestorChain(nodeId, nodes).map(n => n.name).join(" · ")
}

/** Derive branchId, department, position from orgNodeId by walking the tree. */
export function deriveOrgFields(orgNodeId, nodes) {
  if (!orgNodeId) {
    return { branchId: "", department: "", position: "", snapshot: "" }
  }
  const chain = getAncestorChain(orgNodeId, nodes)
  let branchId = ""
  let department = ""
  let position = ""
  for (const n of chain) {
    if (n.type === "branch") branchId = n.id
    if (n.type === "department") department = n.name
    if (n.type === "position") position = n.name
  }
  return {
    branchId,
    department,
    position,
    snapshot: chain.map(n => n.name).join(" · "),
  }
}

export function syncEmployeeOrgFields(employeePatch, orgNodeId, nodes) {
  if (!orgNodeId) return employeePatch
  const derived = deriveOrgFields(orgNodeId, nodes)
  return {
    ...employeePatch,
    orgNodeId,
    branchId: derived.branchId || employeePatch.branchId || "",
    department: derived.department || employeePatch.department || "",
    position: derived.position || employeePatch.position || "",
  }
}

export function validateOrgNodePayload(data, nodes, existingId) {
  const type = data.type
  if (!type || !VALID_TYPES.includes(type)) {
    return "Loại đơn vị không hợp lệ"
  }
  const parentId = data.parentId || undefined
  const expectedParentType = PARENT_TYPE[type]

  if (type === "branch") {
    if (parentId) return "Chi nhánh không được có đơn vị cha"
  } else {
    if (!parentId) return "Đơn vị này bắt buộc phải có đơn vị cha"
    const parent = getNodeById(nodes, parentId)
    if (!parent) return "Đơn vị cha không tồn tại"
    if (parent.type !== expectedParentType) {
      return `Đơn vị cha phải là loại "${expectedParentType}"`
    }
  }

  if (existingId && parentId) {
    const descendants = collectDescendantIds(existingId, nodes)
    if (parentId === existingId || descendants.includes(parentId)) {
      return "Không thể đặt đơn vị cha là chính nó hoặc đơn vị con"
    }
  }

  if (data.code) {
    const dup = nodes.find(n => n.code === data.code && n.id !== existingId)
    if (dup) return `Mã đơn vị "${data.code}" đã tồn tại`
  }

  return null
}

export function collectDescendantIds(nodeId, nodes) {
  const ids = []
  const queue = [nodeId]
  while (queue.length) {
    const id = queue.shift()
    const children = nodes.filter(n => n.parentId === id)
    for (const c of children) {
      ids.push(c.id)
      queue.push(c.id)
    }
  }
  return ids
}

export function getDescendantIdSet(nodeId, nodes) {
  return new Set([nodeId, ...collectDescendantIds(nodeId, nodes)])
}
