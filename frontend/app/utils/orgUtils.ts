import type { OrgNode } from "../types"

const PARENT_TYPE: Record<string, string | null> = {
  branch: null,
  department: "branch",
  "sub-department": "department",
  position: "sub-department",
  team: "position",
}

export function getNodeById(nodes: OrgNode[], id: string): OrgNode | undefined {
  return nodes.find(n => n.id === id)
}

export function getAncestorChain(nodeId: string, nodes: OrgNode[]): OrgNode[] {
  const chain: OrgNode[] = []
  let current = getNodeById(nodes, nodeId)
  const seen = new Set<string>()
  while (current) {
    if (seen.has(current.id)) break
    seen.add(current.id)
    chain.unshift(current)
    current = current.parentId ? getNodeById(nodes, current.parentId) : undefined
  }
  return chain
}

export function findBranchForNode(nodeId: string, nodes: OrgNode[]): string {
  let current = getNodeById(nodes, nodeId)
  const seen = new Set<string>()
  while (current) {
    if (seen.has(current.id)) return "all"
    seen.add(current.id)
    if (current.type === "branch") return current.id
    current = current.parentId ? getNodeById(nodes, current.parentId) : undefined
  }
  return "all"
}

export function buildOrgSnapshot(nodeId: string, nodes: OrgNode[]): string {
  return getAncestorChain(nodeId, nodes).map(n => n.name).join(" · ")
}

export function deriveOrgFields(orgNodeId: string, nodes: OrgNode[]) {
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

export function applyOrgFieldsToEmployee<T extends Record<string, unknown>>(
  emp: T,
  orgNodeId: string,
  nodes: OrgNode[]
): T {
  if (!orgNodeId) return emp
  const derived = deriveOrgFields(orgNodeId, nodes)
  return {
    ...emp,
    orgNodeId,
    branchId: derived.branchId || (emp.branchId as string) || "",
    department: derived.department || (emp.department as string) || "",
    position: derived.position || (emp.position as string) || "",
  }
}

export function isOrgPlacementChanged(
  prev: { orgNodeId?: string; branchId?: string; department?: string; position?: string },
  next: { orgNodeId?: string; branchId?: string; department?: string; position?: string }
): boolean {
  return (
    (prev.orgNodeId || "") !== (next.orgNodeId || "") ||
    (prev.branchId || "") !== (next.branchId || "") ||
    (prev.department || "") !== (next.department || "") ||
    (prev.position || "") !== (next.position || "")
  )
}

export function parentTypeFor(childType: string): string | null {
  return PARENT_TYPE[childType] ?? null
}
