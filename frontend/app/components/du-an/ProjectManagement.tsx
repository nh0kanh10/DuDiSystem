import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import {
  Plus, Search, Edit2, Trash2, X, FolderOpen,
  Calendar, Paperclip, Link2, FileText,
  CheckSquare, TrendingUp, Clock, CheckCircle2, PauseCircle,
  AlertCircle, File, Trash, ExternalLink, Check,
  CircleDot, PlayCircle, User, Eye, Bell, Users2, Crown,
} from "lucide-react"
import { api } from "@/lib/api"
import { Project, ProjectTeam, ProjectStatus, Employee, Group, OrgNode, Role } from "../../types"
import { initials } from "../../utils"
import { CustomDatePicker as DateInput } from "../ui/CustomDatePicker"
import { CustomSelect } from "../ui/CustomSelect"
import { CustomCombobox } from "../ui/CustomCombobox"
import { Modal, ModalCancelButton, ModalSubmitButton } from "../ui/Modal"
import ConfirmModal from "../ui/ConfirmModal"

const STATUS_CFG: Record<ProjectStatus, { label: string; cls: string; icon: React.ElementType }> = {
  planning:  { label: "Lên kế hoạch",   cls: "bg-gray-100 text-gray-600 border-gray-200",          icon: Clock },
  active:    { label: "Đang thực hiện", cls: "bg-blue-50 text-blue-700 border-blue-200",           icon: TrendingUp },
  "on-hold": { label: "Tạm dừng",       cls: "bg-amber-50 text-amber-700 border-amber-200",        icon: PauseCircle },
  completed: { label: "Hoàn thành",     cls: "bg-emerald-50 text-emerald-700 border-emerald-200",  icon: CheckCircle2 },
}

const TASK_STATUS_CFG = {
  todo:        { label: "Chờ xử lý",   cls: "text-gray-400",    icon: CircleDot },
  "in-progress": { label: "Đang làm", cls: "text-blue-500",    icon: PlayCircle },
  done:        { label: "Hoàn thành",  cls: "text-emerald-500", icon: CheckCircle2 },
}

const PRIORITY_CFG = {
  high:   { label: "Cao",   cls: "bg-red-50 text-red-600 border-red-200" },
  medium: { label: "TB",    cls: "bg-amber-50 text-amber-600 border-amber-200" },
  low:    { label: "Thấp",  cls: "bg-gray-100 text-gray-500 border-gray-200" },
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  const cfg = STATUS_CFG[status]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${cfg.cls}`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  )
}

function ProgressBar({ value, done, total }: { value: number; done?: number; total?: number }) {
  const segments = total && total > 0 ? total : Math.max(Math.round(value / 10), 5)
  const filled = total && total > 0 ? (done ?? 0) : Math.round(value / (100 / segments))
  const color = value >= 100 ? "bg-emerald-500" : value >= 60 ? "bg-blue-500" : value >= 30 ? "bg-[#C62828]" : "bg-gray-300"
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 flex gap-1">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full transition-all ${i < filled ? color : "bg-gray-100"}`}
          />
        ))}
      </div>
      <span className="text-[11px] font-bold text-gray-500 w-8 text-right">{value}%</span>
    </div>
  )
}

function AvatarCircle({ name, photo, size = "sm" }: { name: string; photo?: string; size?: "sm" | "md" }) {
  const colors = ["from-[#C62828] to-[#E64A19]", "from-[#1565C0] to-[#0288D1]", "from-[#2E7D32] to-[#388E3C]", "from-[#6A1B9A] to-[#8E24AA]", "from-[#E65100] to-[#F57C00]"]
  const idx = name.charCodeAt(0) % colors.length
  const s = size === "md" ? "w-9 h-9 text-sm" : "w-7 h-7 text-xs"
  if (photo) {
    return (
      <img src={photo} alt={name} className={`${s} rounded-full object-cover flex-shrink-0 border border-white`} />
    )
  }
  return (
    <div className={`${s} rounded-full bg-gradient-to-br ${colors[idx]} flex items-center justify-center text-white font-black flex-shrink-0`}>
      {initials(name)}
    </div>
  )
}

function parseVNDate(s: string): number {
  if (!s) return 0
  const [d, m, y] = s.split("/").map(Number)
  return new Date(y, m - 1, d).getTime()
}

const EMPTY_FORM = {
  name: "", code: "", description: "",
  status: "planning" as ProjectStatus,
  startDate: "", endDate: "",
  managerId: "", memberIds: [] as string[],
  branchId: "",
}

const EMPTY_TASK_FORM = {
  title: "", assigneeId: "", dueDate: "", priority: "medium" as "low" | "medium" | "high",
}

export function ProjectManagement({
  currentUserId,
  currentUserRole,
  selectedBranch = "all",
}: {
  currentUserId?: string
  currentUserRole?: Role
  selectedBranch?: string
}) {
  const [projects, setProjects] = useState<Project[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [branches, setBranches] = useState<OrgNode[]>([])
  const [deadlineWarningDays, setDeadlineWarningDays] = useState(7)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [myOnly, setMyOnly] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Project | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [formErr, setFormErr] = useState<Partial<typeof EMPTY_FORM>>({})
  const [saving, setSaving] = useState(false)

  const [mainTab, setMainTab] = useState<"projects" | "teams">("projects")
  const [teamProjectFilter, setTeamProjectFilter] = useState("all")

  const [detail, setDetail] = useState<Project | null>(null)
  const [detailTab, setDetailTab] = useState<"overview" | "tasks" | "attachments">("overview")
  const [tasks, setTasks] = useState<any[]>([])
  const [loadingTasks, setLoadingTasks] = useState(false)

  const [showTeamForm, setShowTeamForm] = useState(false)
  const [editTeam, setEditTeam] = useState<ProjectTeam | null>(null)
  const [teamForm, setTeamForm] = useState({ name: "", leaderId: "", memberIds: [] as string[], description: "" })
  const [savingTeam, setSavingTeam] = useState(false)
  const [teamMemberSearch, setTeamMemberSearch] = useState("")

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Project | null>(null)
  const [deleteGroup, setDeleteGroup] = useState<Group | null>(null)

  const [memberTab, setMemberTab] = useState<"member" | "group">("member")
  const [memberSearch, setMemberSearch] = useState("")
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])

  const [attachForm, setAttachForm] = useState({ name: "", url: "", type: "file" as "file" | "link" })
  const [showAttachForm, setShowAttachForm] = useState(false)

  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskForm, setTaskForm] = useState({ ...EMPTY_TASK_FORM })
  const [savingTask, setSavingTask] = useState(false)
  const [taskDeleteConfirm, setTaskDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    load()
    api.employees.list().then(d => setEmployees(d as Employee[]))
    api.groups.list().then(d => setGroups(d as Group[]))
    api.orgNodes.list({ type: "branch" }).then(d => setBranches((d as OrgNode[]).filter(n => n.type === "branch")))
    api.systemConfig.get().then(cfg => {
      if (cfg && (cfg as any).projectDeadlineWarningDays) {
        setDeadlineWarningDays(Number((cfg as any).projectDeadlineWarningDays))
      }
    }).catch(() => {})
  }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await api.projects.list()
      setProjects(data as Project[])
    } finally {
      setLoading(false)
    }
  }

  async function refreshProject(projectId: string) {
    const updated = await api.projects.getById(projectId) as Project
    setProjects(ps => ps.map(p => p.id === updated.id ? updated : p))
    setDetail(prev => prev?.id === updated.id ? updated : prev)
  }

  const filtered = projects
    .filter(p => {
      if (myOnly && currentUserId) {
        const isMember = p.memberIds.includes(currentUserId)
        const isManager = p.managerId === currentUserId
        if (!isMember && !isManager) return false
      }
      if (selectedBranch !== "all") {
        const pBranch = (p as any).branchId
        if (pBranch) {
          if (pBranch !== selectedBranch) return false
        } else {
          const managerEmp = employees.find(e => e.id === p.managerId)
          if (managerEmp?.branchId !== selectedBranch) return false
        }
      }
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase())
      const matchStatus = filterStatus === "all" || p.status === filterStatus
      return matchSearch && matchStatus
    })
    .sort((a, b) => {
      if (sortBy === "progress-desc") return b.progress - a.progress
      if (sortBy === "progress-asc") return a.progress - b.progress
      if (sortBy === "endDate") return parseVNDate(a.endDate) - parseVNDate(b.endDate)
      if (sortBy === "name") return a.name.localeCompare(b.name, "vi")
      return 0
    })

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === "active").length,
    completed: projects.filter(p => p.status === "completed").length,
    onhold: projects.filter(p => p.status === "on-hold").length,
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const nearDeadline = projects
    .filter(p => p.status !== "completed" && p.endDate)
    .map(p => {
      const end = parseVNDate(p.endDate)
      const diffMs = end - today.getTime()
      const daysLeft = Math.ceil(diffMs / 86400000)
      return { ...p, daysLeft }
    })
    .filter(p => p.daysLeft >= 0 && p.daysLeft <= deadlineWarningDays)
    .sort((a, b) => a.daysLeft - b.daysLeft)

  function openCreate() {
    setEditTarget(null)
    setForm({ ...EMPTY_FORM })
    setFormErr({})
    setSelectedGroups([])
    setMemberSearch("")
    setShowForm(true)
  }

  function openEdit(p: Project) {
    setEditTarget(p)
    setSelectedGroups([])
    setMemberSearch("")
    setForm({
      name: p.name, code: p.code, description: p.description,
      status: p.status, startDate: p.startDate, endDate: p.endDate,
      managerId: p.managerId, memberIds: [...p.memberIds],
      branchId: (p as any).branchId ?? "",
    })
    setFormErr({})
    setShowForm(true)
  }

  function validateForm() {
    const err: Partial<typeof EMPTY_FORM> = {}
    if (!form.name.trim()) err.name = "Bắt buộc"
    if (!form.code.trim()) err.code = "Bắt buộc"
    if (!form.managerId) err.managerId = "Bắt buộc"
    setFormErr(err)
    return Object.keys(err).length === 0
  }

  async function submitForm() {
    if (!validateForm()) return
    setSaving(true)
    try {
      if (editTarget) {
        const updated = await api.projects.update(editTarget.id, form) as Project
        setProjects(ps => ps.map(p => p.id === updated.id ? updated : p))
        setDetail(prev => prev?.id === updated.id ? updated : prev)
      } else {
        const created = await api.projects.create(form) as Project
        setProjects(ps => [created, ...ps])
      }
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(p: Project) {
    await api.projects.delete(p.id)
    setProjects(ps => ps.filter(x => x.id !== p.id))
    if (detail?.id === p.id) setDetail(null)
    setShowDeleteConfirm(null)
  }

  async function openDetail(p: Project) {
    setDetail(p)
    setDetailTab("overview")
    setShowTaskForm(false)
    setTaskForm({ ...EMPTY_TASK_FORM })
    loadTasksFor(p.id)
  }

  async function loadTasksFor(projectId: string) {
    setLoadingTasks(true)
    try {
      const t = await api.tasks.list({ projectId })
      setTasks(t as any[])
    } finally {
      setLoadingTasks(false)
    }
  }

  async function handleCreateTask() {
    if (!detail || !taskForm.title.trim()) return
    setSavingTask(true)
    try {
      const created = await api.tasks.create({
        title: taskForm.title.trim(),
        assigneeId: taskForm.assigneeId || undefined,
        dueDate: taskForm.dueDate || undefined,
        priority: taskForm.priority,
        status: "todo",
        projectId: detail.id,
      }) as any
      setTasks(ts => [...ts, created])
      setTaskForm({ ...EMPTY_TASK_FORM })
      setShowTaskForm(false)
      refreshProject(detail.id)
    } finally {
      setSavingTask(false)
    }
  }

  async function cycleTaskStatus(t: any) {
    if (!detail) return
    const next = t.status === "todo" ? "in-progress" : t.status === "in-progress" ? "done" : "todo"
    setTasks(ts => ts.map(x => x.id === t.id ? { ...x, status: next } : x))
    await api.tasks.update(t.id, { status: next })
    refreshProject(detail.id)
  }

  async function handleDeleteTask(taskId: string) {
    if (!detail) return
    setTasks(ts => ts.filter(x => x.id !== taskId))
    setTaskDeleteConfirm(null)
    await api.tasks.delete(taskId)
    refreshProject(detail.id)
  }

  async function handleAddAttachment() {
    if (!detail || !attachForm.name.trim() || !attachForm.url.trim()) return
    const updated = await api.projects.addAttachment(detail.id, attachForm) as Project
    setProjects(ps => ps.map(p => p.id === updated.id ? updated : p))
    setDetail(updated)
    setAttachForm({ name: "", url: "", type: "file" })
    setShowAttachForm(false)
  }

  async function handleRemoveAttachment(attachId: string) {
    if (!detail) return
    const updated = await api.projects.removeAttachment(detail.id, attachId) as Project
    setProjects(ps => ps.map(p => p.id === updated.id ? updated : p))
    setDetail(updated)
  }

  function toggleMember(id: string) {
    setForm(f => ({
      ...f,
      memberIds: f.memberIds.includes(id) ? f.memberIds.filter(m => m !== id) : [...f.memberIds, id],
    }))
  }

  function toggleGroup(groupId: string) {
    const grp = groups.find(g => g.id === groupId)
    const deptIds = grp ? grp.memberIds : []
    const isGroupSelected = selectedGroups.includes(groupId)
    setSelectedGroups(gs => isGroupSelected ? gs.filter(g => g !== groupId) : [...gs, groupId])
    setForm(f => ({
      ...f,
      memberIds: isGroupSelected
        ? f.memberIds.filter(id => !deptIds.includes(id))
        : [...new Set([...f.memberIds, ...deptIds])],
    }))
  }

  function genCode(name: string) {
    return name.trim().split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 8)
  }

  const empById = (id: string) => employees.find(e => e.id === id)

  const projectMembers = detail
    ? employees.filter(e => detail.memberIds.includes(e.id))
    : []

  const teamViewProject = teamProjectFilter !== "all" ? projects.find(p => p.id === teamProjectFilter) ?? null : null
  const activeEmployees = employees.filter(e => e.status === "active")

  // Standalone groups (independent of projects)
  const [groupSearch, setGroupSearch] = useState("")
  const filteredGroups = groups.filter(g =>
    !groupSearch || g.name.toLowerCase().includes(groupSearch.toLowerCase())
  )

  function openTeamCreate() {
    setEditTeam(null)
    setTeamForm({ name: "", leaderId: "", memberIds: [], description: "" })
    setTeamMemberSearch("")
    setShowTeamForm(true)
  }

  function openTeamEdit(g: Group) {
    setEditTeam({ id: g.id, name: g.name, leaderId: g.leaderId, memberIds: g.memberIds, description: g.description ?? "", createdAt: g.createdAt })
    setTeamForm({ name: g.name, leaderId: g.leaderId, memberIds: [...g.memberIds], description: g.description ?? "" })
    setTeamMemberSearch("")
    setShowTeamForm(true)
  }

  async function handleSaveTeam() {
    if (!teamForm.name.trim()) return
    setSavingTeam(true)
    try {
      if (editTeam) {
        const updated = await api.groups.update(editTeam.id, teamForm) as Group
        setGroups(gs => gs.map(g => g.id === updated.id ? updated : g))
      } else {
        const created = await api.groups.create(teamForm) as Group
        setGroups(gs => [...gs, created])
      }
      setShowTeamForm(false)
      setEditTeam(null)
    } finally {
      setSavingTeam(false)
    }
  }

  async function handleDeleteGroup(id: string) {
    await api.groups.delete(id)
    setGroups(gs => gs.filter(g => g.id !== id))
  }

  function toggleTeamMember(id: string) {
    setTeamForm(f => ({
      ...f,
      memberIds: f.memberIds.includes(id) ? f.memberIds.filter(m => m !== id) : [...f.memberIds, id],
    }))
  }

  return (
    <div className="space-y-5">
      <div className="bg-[#C62828] bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:8px_8px] p-5 rounded-2xl text-white flex items-center justify-between flex-wrap gap-4 shadow-md">
        <div className="flex items-center">
          <div className="flex gap-1.5 items-center mr-4 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-white/30 animate-pulse" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/60 animate-pulse delay-75" />
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse delay-150" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white">Quản lý dự án</h2>
            <p className="text-xs text-white/80 mt-1">Tạo, giao việc và theo dõi tiến độ các dự án nội bộ</p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative">
          <div className="flex bg-white/10 rounded-xl p-0.5 gap-0.5">
            {(["projects", "teams"] as const).map(t => (
              <button key={t} onClick={() => setMainTab(t)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mainTab === t ? "bg-white text-[#C62828]" : "text-white/70 hover:text-white"}`}>
                {t === "projects" ? "Dự án" : "Nhóm"}
              </button>
            ))}
          </div>
          {mainTab === "projects" && (
            <button onClick={openCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white rounded-xl text-sm font-bold transition-colors flex-shrink-0">
              <Plus size={15} /> Tạo dự án
            </button>
          )}
          {mainTab === "teams" && (
            <button onClick={openTeamCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white rounded-xl text-sm font-bold transition-colors flex-shrink-0">
              <Plus size={15} /> Tạo nhóm
            </button>
          )}
        </div>
      </div>

      {nearDeadline.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Bell size={14} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-amber-800 mb-2">
              {nearDeadline.length} dự án sắp đến hạn trong {deadlineWarningDays} ngày tới
            </p>
            <div className="flex flex-wrap gap-2">
              {nearDeadline.map(p => (
                <button
                  key={p.id}
                  onClick={() => openDetail(p)}
                  className="flex items-center gap-2 bg-white border border-amber-200 hover:border-amber-400 rounded-xl px-3 py-1.5 transition-colors group">
                  <span className="text-[10px] font-black text-gray-400 font-mono">{p.code}</span>
                  <span className="text-xs font-bold text-gray-700 max-w-[160px] truncate">{p.name}</span>
                  <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-lg ${
                    p.daysLeft === 0
                      ? "bg-red-100 text-red-600"
                      : p.daysLeft <= 3
                      ? "bg-orange-100 text-orange-600"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {p.daysLeft === 0 ? "Hôm nay" : `còn ${p.daysLeft} ngày`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {mainTab === "teams" && (
        <div className="space-y-4">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={groupSearch} onChange={e => setGroupSearch(e.target.value)}
                placeholder="Tìm nhóm..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40" />
            </div>
            <span className="text-xs text-gray-400 font-bold">{filteredGroups.length} nhóm</span>
          </div>

          {filteredGroups.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-black/5">
              <Users2 size={40} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm text-gray-400 font-bold">Chưa có nhóm nào</p>
              <p className="text-xs text-gray-300 mt-1">Nhấn «+ Tạo nhóm» để thêm nhóm</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredGroups.map(g => {
                const leader = empById(g.leaderId)
                return (
                  <div key={g.id} className="bg-white rounded-2xl border border-black/[0.06] p-5 space-y-3 hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#C62828]/10 flex items-center justify-center flex-shrink-0">
                          <Users2 size={18} className="text-[#C62828]" />
                        </div>
                        <div>
                          <p className="font-black text-gray-800 text-sm">{g.name}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{g.memberIds.length} thành viên</p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openTeamEdit(g)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => setDeleteGroup(g)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash size={13} />
                        </button>
                      </div>
                    </div>
                    {g.description && <p className="text-xs text-gray-400 leading-relaxed">{g.description}</p>}
                    {leader && (
                      <div className="flex items-center gap-2 py-2 border-t border-gray-50">
                        <Crown size={11} className="text-amber-500" />
                        <AvatarCircle name={leader.name} photo={leader.photos?.[0]} />
                        <span className="text-xs font-bold text-gray-600">{leader.name}</span>
                        <span className="text-[10px] text-gray-400">· Trưởng nhóm</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-1.5">
                        {g.memberIds.slice(0, 6).map(mid => {
                          const emp = empById(mid)
                          return emp ? <AvatarCircle key={mid} name={emp.name} photo={emp.photos?.[0]} /> : null
                        })}
                        {g.memberIds.length > 6 && (
                          <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                            +{g.memberIds.length - 6}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {mainTab === "projects" && (<><div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tổng dự án",      value: stats.total,     cls: "text-gray-700",    dot: "bg-gray-400",    border: "border-l-gray-400" },
          { label: "Đang thực hiện",  value: stats.active,    cls: "text-blue-700",    dot: "bg-blue-500",    border: "border-l-blue-500" },
          { label: "Hoàn thành",      value: stats.completed, cls: "text-emerald-700", dot: "bg-emerald-500", border: "border-l-emerald-500" },
          { label: "Tạm dừng",        value: stats.onhold,    cls: "text-amber-700",   dot: "bg-amber-400",   border: "border-l-amber-400" },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-2xl p-5 border border-black/5 border-l-4 ${s.border} shadow-xs flex justify-between items-center`}>
            <div>
              <p className="text-xs text-gray-400 font-bold">{s.label}</p>
              <h4 className={`text-2xl font-black mt-1 ${s.cls}`}>{s.value}</h4>
            </div>
            <span className={`w-3 h-3 rounded-full ${s.dot}`} />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-5 border border-black/5 shadow-xs space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm tên, mã dự án..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-[#C62828]/40 focus:ring-2 focus:ring-[#C62828]/10 transition-all"
            />
          </div>
          <CustomSelect
            value={filterStatus}
            onChange={setFilterStatus}
            className="w-44"
            options={[
              { value: "all",       label: "Tất cả trạng thái" },
              { value: "planning",  label: "Lên kế hoạch" },
              { value: "active",    label: "Đang thực hiện" },
              { value: "on-hold",   label: "Tạm dừng" },
              { value: "completed", label: "Hoàn thành" },
            ]}
          />
          <CustomSelect
            value={sortBy}
            onChange={setSortBy}
            className="w-44"
            options={[
              { value: "newest",        label: "Mới nhất" },
              { value: "name",          label: "Tên A→Z" },
              { value: "progress-desc", label: "Tiến độ cao nhất" },
              { value: "progress-asc",  label: "Tiến độ thấp nhất" },
              { value: "endDate",       label: "Deadline gần nhất" },
            ]}
          />
          {currentUserId && (
            <button
              onClick={() => setMyOnly(p => !p)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-all border ${
                myOnly
                  ? "bg-[#C62828]/8 text-[#C62828] border-[#C62828]/20"
                  : "bg-gray-50 text-gray-500 border-gray-100 hover:border-gray-200"
              }`}>
              <User size={14} />
              Của tôi
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-16 text-center flex items-center justify-center gap-1.5">
            {[0,1,2].map(i => (
              <span key={i} className="w-2 h-2 rounded-full bg-[#C62828]/40 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <FolderOpen size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">Không có dự án nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(p => {
              const manager = empById(p.managerId)
              const isMyProject = currentUserId && (p.memberIds.includes(currentUserId) || p.managerId === currentUserId)
              return (
                <div key={p.id}
                  className="border border-black/[0.06] rounded-2xl p-4 hover:border-[#C62828]/20 hover:shadow-md transition-all group space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-gray-400 font-mono">{p.code}</span>
                        <StatusBadge status={p.status} />
                        {isMyProject && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#C62828]/8 text-[#C62828] rounded-md">Của tôi</span>
                        )}
                      </div>
                      <h3
                        className="font-black text-gray-800 text-sm leading-snug line-clamp-2 cursor-pointer hover:text-[#C62828] transition-colors"
                        onClick={() => openDetail(p)}>
                        {p.name}
                      </h3>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openDetail(p)}
                        className="p-1.5 rounded-lg hover:bg-[#C62828]/8 text-gray-400 hover:text-[#C62828] transition-colors" title="Xem chi tiết">
                        <Eye size={13} />
                      </button>
                      <button onClick={() => openEdit(p)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => setShowDeleteConfirm(p)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {p.description && (
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{p.description}</p>
                  )}

                  <ProgressBar value={p.progress} done={p.doneCount} total={p.taskCount} />

                  <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                      <CheckSquare size={12} />
                      <span>{p.doneCount ?? 0}/{p.taskCount ?? 0} task</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                      <Calendar size={12} />
                      <span>{p.endDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {manager && <AvatarCircle name={manager.name} photo={manager.photos?.[0]} />}
                      <span className="text-[11px] text-gray-500 font-semibold">{p.managerName ?? manager?.name ?? "—"}</span>
                    </div>
                    <div className="flex -space-x-1.5">
                      {p.memberIds.slice(0, 3).map(mid => {
                        const emp = empById(mid)
                        return emp ? <AvatarCircle key={mid} name={emp.name} photo={emp.photos?.[0]} /> : null
                      })}
                      {p.memberIds.length > 3 && (
                        <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                          +{p.memberIds.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div></>)}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editTarget ? "Chỉnh sửa dự án" : "Tạo dự án mới"}
        icon={FolderOpen}
        width="xl"
        footer={
          <>
            <ModalCancelButton onClick={() => setShowForm(false)} />
            <ModalSubmitButton onClick={submitForm} loading={saving} label={editTarget ? "Lưu thay đổi" : "Tạo dự án"} />
          </>
        }
      >
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="text-xs font-bold text-gray-600 block mb-1.5">Tên dự án <span className="text-red-500">*</span></label>
                  <input
                    value={form.name} onChange={e => {
                      const name = e.target.value
                      setForm(f => ({ ...f, name, ...(!editTarget && { code: genCode(name) }) }))
                    }}
                    placeholder="Nhập tên dự án..."
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828]/50 transition-all ${formErr.name ? "border-red-300" : "border-gray-200"}`}
                  />
                  {formErr.name && <p className="text-xs text-red-500 mt-1">{formErr.name}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1.5">Mã dự án <span className="text-red-500">*</span></label>
                  <input
                    value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="VD: DUDI-V2"
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828]/50 transition-all ${formErr.code ? "border-red-300" : "border-gray-200"}`}
                  />
                  {formErr.code && <p className="text-xs text-red-500 mt-1">{formErr.code}</p>}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Mô tả</label>
                <textarea
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} placeholder="Mô tả ngắn về dự án..."
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828]/50 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1.5">Trạng thái</label>
                  <CustomSelect
                    value={form.status}
                    onChange={v => setForm(f => ({ ...f, status: v as ProjectStatus }))}
                    heightClass="h-[42px]"
                    options={[
                      { value: "planning",  label: "Lên kế hoạch" },
                      { value: "active",    label: "Đang thực hiện" },
                      { value: "on-hold",   label: "Tạm dừng" },
                      { value: "completed", label: "Hoàn thành" },
                    ]}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1.5">Chi nhánh</label>
                  <CustomSelect
                    value={form.branchId || ""}
                    onChange={v => setForm(f => ({ ...f, branchId: v }))}
                    heightClass="h-[42px]"
                    options={[
                      { value: "", label: "Tất cả chi nhánh" },
                      ...branches.map(b => ({ value: b.id, label: b.name })),
                    ]}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1.5">Ngày bắt đầu</label>
                  <DateInput
                    value={form.startDate}
                    onChange={v => setForm(f => ({ ...f, startDate: v }))}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1.5">Ngày kết thúc</label>
                  <DateInput
                    value={form.endDate}
                    onChange={v => setForm(f => ({ ...f, endDate: v }))}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Quản lý dự án <span className="text-red-500">*</span></label>
                <CustomCombobox
                  value={form.managerId}
                  onChange={v => setForm(f => ({ ...f, managerId: v }))}
                  heightClass="h-[42px]"
                  placeholder="Tìm tên, phòng ban..."
                  className={formErr.managerId ? "ring-1 ring-red-300 rounded-xl" : ""}
                  options={employees.filter(e => e.status !== "inactive").map(e => ({
                    value: e.id, label: e.name, desc: e.department,
                  }))}
                />
                {formErr.managerId && <p className="text-xs text-red-500 mt-1">{formErr.managerId}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-600">
                    Thành viên tham gia
                    {form.memberIds.length > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 bg-[#C62828]/10 text-[#C62828] rounded-full text-[10px] font-black">
                        {form.memberIds.length}
                      </span>
                    )}
                  </label>
                  <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
                    {(["member", "group"] as const).map(t => (
                      <button key={t} type="button" onClick={() => setMemberTab(t)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${memberTab === t ? "bg-white text-gray-700 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                        {t === "member" ? "Thành viên" : "Theo nhóm"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative mb-2">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={memberSearch} onChange={e => setMemberSearch(e.target.value)}
                    placeholder={memberTab === "member" ? "Tìm tên, phòng ban..." : "Tìm nhóm..."}
                    className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:outline-none focus:border-[#C62828]/40 focus:ring-1 focus:ring-[#C62828]/10 transition-all"
                  />
                </div>

                {memberTab === "member" ? (
                  <div className="max-h-56 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                    {employees.filter(e => {
                      if (e.status === "inactive") return false
                      const effectiveBranch = form.branchId || (selectedBranch !== "all" ? selectedBranch : "")
                      if (effectiveBranch && e.branchId !== effectiveBranch) return false
                      if (!memberSearch) return true
                      const q = memberSearch.toLowerCase()
                      return e.name.toLowerCase().includes(q) || e.department.toLowerCase().includes(q) || e.position.toLowerCase().includes(q)
                    }).map(e => {
                      const selected = form.memberIds.includes(e.id)
                      const fromGroup = selectedGroups.some(gid => groups.find(g => g.id === gid)?.memberIds.includes(e.id))
                      const isManager = e.id === form.managerId
                      return (
                        <button key={e.id} type="button" onClick={() => toggleMember(e.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all group ${selected ? "bg-[#C62828]/6" : "hover:bg-gray-50"}`}>
                          <AvatarCircle name={e.name} photo={e.photos?.[0]} size="md" />
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <p className={`font-bold truncate ${selected ? "text-[#C62828]" : "text-gray-700"}`}>{e.name}</p>
                              {isManager && (
                                <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-md">Quản lý</span>
                              )}
                              {fromGroup && !isManager && (
                                <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded-md">Nhóm</span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5">{e.department} · {e.position}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected ? "bg-[#C62828] border-[#C62828]" : "border-gray-200 group-hover:border-gray-400"}`}>
                            {selected && <Check size={11} className="text-white" strokeWidth={3} />}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                    {groups.filter(g => !memberSearch || g.name.toLowerCase().includes(memberSearch.toLowerCase())).map(g => {
                      const isSelected = selectedGroups.includes(g.id)
                      const leader = empById(g.leaderId)
                      return (
                        <button key={g.id} type="button" onClick={() => toggleGroup(g.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all group ${isSelected ? "bg-[#C62828]/[0.06]" : "hover:bg-gray-50"}`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-[#C62828]/15 text-[#C62828]" : "bg-gray-100 text-gray-500"}`}>
                            <Users2 size={14} />
                          </div>
                          <div className="flex-1 text-left">
                            <p className={`font-bold ${isSelected ? "text-[#C62828]" : "text-gray-700"}`}>{g.name}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {g.memberIds.length} thành viên{leader ? ` · ${leader.name}` : ""}
                            </p>
                          </div>
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? "bg-[#C62828] border-[#C62828]" : "border-gray-200 group-hover:border-gray-400"}`}>
                            {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
                          </div>
                        </button>
                      )
                    })}
                    {groups.length === 0 && (
                      <p className="text-center text-xs text-gray-400 py-6">Chưa có nhóm nào. Tạo nhóm ở tab «Nhóm» trước.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
      </Modal>

      {detail && createPortal(
        <div className="fixed inset-0 z-50 flex" onClick={() => setDetail(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative ml-auto w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-black text-gray-400 font-mono">{detail.code}</span>
                  <StatusBadge status={detail.status} />
                </div>
                <h3 className="text-base font-black text-gray-800 leading-snug">{detail.name}</h3>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => { setDetail(null); openEdit(detail) }}
                  className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 transition-colors">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => setDetail(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex border-b border-gray-100 flex-shrink-0">
              {(["overview", "tasks", "attachments"] as const).map(tab => (
                <button key={tab} onClick={() => setDetailTab(tab)}
                  className={`px-5 py-3 text-xs font-bold transition-colors border-b-2 ${detailTab === tab ? "border-[#C62828] text-[#C62828]" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
                  {tab === "overview" ? "Tổng quan"
                    : tab === "tasks" ? `Công việc (${tasks.length})`
                    : `Tài liệu (${detail.attachments.length})`}
                </button>
              ))}
              <button onClick={() => { setDetail(null); setMainTab("teams"); setTeamProjectFilter(detail.id) }}
                className="px-5 py-3 text-xs font-bold transition-colors border-b-2 border-transparent text-gray-400 hover:text-gray-600 ml-auto flex items-center gap-1">
                <Users2 size={12} /> Nhóm →
              </button>
            </div>

            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#e5e7eb transparent" }}>
              {detailTab === "overview" && (
                <div className="p-6 space-y-5">
                  {detail.description && (
                    <p className="text-sm text-gray-500 leading-relaxed">{detail.description}</p>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-500">Tiến độ</span>
                      <span className="text-xs font-black text-gray-700">{detail.progress}%</span>
                    </div>
                    <ProgressBar value={detail.progress} done={detail.doneCount} total={detail.taskCount} />
                    <p className="text-[11px] text-gray-400">{detail.doneCount ?? 0} / {detail.taskCount ?? 0} task hoàn thành</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Ngày bắt đầu", value: detail.startDate },
                      { label: "Ngày kết thúc", value: detail.endDate },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Calendar size={12} className="text-gray-400" />
                          <span className="text-[10px] font-bold text-gray-400">{label}</span>
                        </div>
                        <p className="text-sm font-bold text-gray-700">{value || "—"}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-2">Quản lý dự án</p>
                    {(() => {
                      const m = empById(detail.managerId)
                      return m ? (
                        <div className="flex items-center gap-2.5">
                          <AvatarCircle name={m.name} photo={m.photos?.[0]} size="md" />
                          <div>
                            <p className="text-sm font-bold text-gray-700">{m.name}</p>
                            <p className="text-[11px] text-gray-400">{m.position} · {m.department}</p>
                          </div>
                        </div>
                      ) : <p className="text-sm text-gray-400">—</p>
                    })()}
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-2">Thành viên ({detail.memberIds.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {detail.memberIds.map(mid => {
                        const emp = empById(mid)
                        return emp ? (
                          <div key={mid} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5">
                            <AvatarCircle name={emp.name} photo={emp.photos?.[0]} />
                            <div>
                              <p className="text-xs font-bold text-gray-700 leading-none">{emp.name}</p>
                              <p className="text-[10px] text-gray-400">{emp.department}</p>
                            </div>
                          </div>
                        ) : null
                      })}
                      {detail.memberIds.length === 0 && <p className="text-sm text-gray-400">Chưa có thành viên</p>}
                    </div>
                  </div>
                </div>
              )}

              {detailTab === "tasks" && (
                <div className="p-6 space-y-3">
                  {!showTaskForm ? (
                    <button onClick={() => setShowTaskForm(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-[#C62828]/30 hover:text-[#C62828] transition-colors">
                      <Plus size={15} /> Thêm công việc
                    </button>
                  ) : (
                    <div className="border border-gray-200 rounded-2xl p-4 space-y-3 bg-gray-50/50">
                      <p className="text-xs font-black text-gray-700">Tạo công việc mới</p>
                      <input
                        value={taskForm.title}
                        onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="Tên công việc..."
                        autoFocus
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 mb-1">Giao cho</p>
                          <CustomCombobox
                            value={taskForm.assigneeId}
                            onChange={v => setTaskForm(f => ({ ...f, assigneeId: v }))}
                            heightClass="h-9"
                            placeholder="Chọn thành viên..."
                            options={projectMembers.map(e => ({ value: e.id, label: e.name, desc: e.position }))}
                          />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 mb-1">Ưu tiên</p>
                          <CustomSelect
                            value={taskForm.priority}
                            onChange={v => setTaskForm(f => ({ ...f, priority: v as any }))}
                            heightClass="h-9"
                            options={[
                              { value: "high",   label: "Cao" },
                              { value: "medium", label: "Trung bình" },
                              { value: "low",    label: "Thấp" },
                            ]}
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 mb-1">Deadline</p>
                        <DateInput
                          value={taskForm.dueDate}
                          onChange={v => setTaskForm(f => ({ ...f, dueDate: v }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => { setShowTaskForm(false); setTaskForm({ ...EMPTY_TASK_FORM }) }}
                          className="px-4 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                          Hủy
                        </button>
                        <button onClick={handleCreateTask} disabled={savingTask || !taskForm.title.trim()}
                          className="px-4 py-1.5 text-xs font-bold bg-[#C62828] text-white rounded-lg hover:bg-[#B71C1C] disabled:opacity-50 transition-colors">
                          {savingTask ? "Đang lưu..." : "Tạo"}
                        </button>
                      </div>
                    </div>
                  )}

                  {loadingTasks ? (
                    <div className="py-10 text-center text-gray-300 text-sm">Đang tải...</div>
                  ) : tasks.length === 0 ? (
                    <div className="py-10 text-center">
                      <CheckSquare size={32} className="mx-auto text-gray-200 mb-2" />
                      <p className="text-sm text-gray-400">Chưa có task nào trong dự án này</p>
                    </div>
                  ) : (
                    tasks.map(t => {
                      const statusCfg = TASK_STATUS_CFG[t.status as keyof typeof TASK_STATUS_CFG] ?? TASK_STATUS_CFG.todo
                      const StatusIcon = statusCfg.icon
                      const priorityCfg = PRIORITY_CFG[t.priority as keyof typeof PRIORITY_CFG] ?? PRIORITY_CFG.medium
                      const assignee = empById(t.assigneeId)
                      return (
                        <div key={t.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors group">
                          <button
                            onClick={() => cycleTaskStatus(t)}
                            title={`${statusCfg.label} — click để đổi`}
                            className={`flex-shrink-0 transition-transform hover:scale-110 ${statusCfg.cls}`}>
                            <StatusIcon size={18} />
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-bold truncate ${t.status === "done" ? "line-through text-gray-400" : "text-gray-700"}`}>{t.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {assignee && (
                                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                  <AvatarCircle name={assignee.name} photo={assignee.photos?.[0]} size="sm" />
                                  {assignee.name}
                                </span>
                              )}
                              {t.dueDate && (
                                <span className="text-[11px] text-gray-400">· {t.dueDate}</span>
                              )}
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${priorityCfg.cls}`}>
                            {priorityCfg.label}
                          </span>
                          <button
                            onClick={() => setTaskDeleteConfirm(t.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">
                            <Trash size={13} />
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {detailTab === "attachments" && (
                <div className="p-6 space-y-3">
                  {!showAttachForm ? (
                    <button onClick={() => setShowAttachForm(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-[#C62828]/30 hover:text-[#C62828] transition-colors">
                      <Plus size={15} /> Thêm tài liệu
                    </button>
                  ) : (
                    <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50">
                      <div className="flex gap-2">
                        <button onClick={() => setAttachForm(f => ({ ...f, type: "file" }))}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${attachForm.type === "file" ? "bg-[#C62828] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                          <File size={12} /> File
                        </button>
                        <button onClick={() => setAttachForm(f => ({ ...f, type: "link" }))}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${attachForm.type === "link" ? "bg-[#C62828] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                          <Link2 size={12} /> Link
                        </button>
                      </div>
                      <input
                        value={attachForm.name} onChange={e => setAttachForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Tên tài liệu..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
                      />
                      {attachForm.type === "link" ? (
                        <input
                          value={attachForm.url} onChange={e => setAttachForm(f => ({ ...f, url: e.target.value }))}
                          placeholder="https://..."
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
                        />
                      ) : (
                        <label className="flex items-center gap-2 w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-400 hover:border-[#C62828]/40 hover:text-[#C62828] cursor-pointer transition-colors">
                          <File size={14} className="shrink-0" />
                          <span className="truncate">{attachForm.url ? attachForm.url : "Chọn file từ máy..."}</span>
                          <input
                            type="file" className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              setAttachForm(f => ({
                                ...f,
                                url: file.name,
                                name: f.name || file.name,
                              }))
                            }}
                          />
                        </label>
                      )}
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setShowAttachForm(false)}
                          className="px-4 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">Hủy</button>
                        <button onClick={handleAddAttachment}
                          className="px-4 py-1.5 text-xs font-bold bg-[#C62828] text-white rounded-lg hover:bg-[#B71C1C] transition-colors">Thêm</button>
                      </div>
                    </div>
                  )}

                  {detail.attachments.length === 0 ? (
                    <div className="py-8 text-center">
                      <Paperclip size={28} className="mx-auto text-gray-200 mb-2" />
                      <p className="text-sm text-gray-400">Chưa có tài liệu đính kèm</p>
                    </div>
                  ) : (
                    detail.attachments.map(a => (
                      <div key={a.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:border-gray-200 group transition-colors">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${a.type === "link" ? "bg-blue-50" : "bg-gray-100"}`}>
                          {a.type === "link" ? <Link2 size={16} className="text-blue-500" /> : <FileText size={16} className="text-gray-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-700 truncate">{a.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{a.uploadedAt}{a.size ? ` · ${a.size}` : ""}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {a.type === "link" && (
                            <a href={a.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                              <ExternalLink size={13} />
                            </a>
                          )}
                          <button onClick={() => handleRemoveAttachment(a.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                            <Trash size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      , document.body)}

      <Modal
        open={showTeamForm}
        onClose={() => { setShowTeamForm(false); setEditTeam(null) }}
        title={editTeam ? "Chỉnh sửa nhóm" : "Tạo nhóm mới"}
        icon={Users2}
        width="lg"
        footer={<>
          <ModalCancelButton onClick={() => { setShowTeamForm(false); setEditTeam(null) }} />
          <ModalSubmitButton
            onClick={handleSaveTeam}
            loading={savingTeam}
            disabled={!teamForm.name.trim() || teamProjectFilter === "all"}
            label={editTeam ? "Lưu thay đổi" : "Tạo nhóm"}
            loadingLabel="Đang lưu..."
          />
        </>}
      >
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Thuộc dự án <span className="text-red-500">*</span></label>
                <CustomSelect
                  value={teamProjectFilter !== "all" ? teamProjectFilter : ""}
                  onChange={v => setTeamProjectFilter(v || "all")}
                  heightClass="h-[42px]"
                  options={[
                    { value: "", label: "Chọn dự án..." },
                    ...projects.map(p => ({ value: p.id, label: `[${p.code}] ${p.name}` })),
                  ]}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Tên nhóm <span className="text-red-500">*</span></label>
                <input
                  value={teamForm.name}
                  onChange={e => setTeamForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="VD: Nhóm phát triển, Nhóm kiểm thử..."
                  autoFocus
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828]/50"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Trưởng nhóm</label>
                <CustomCombobox
                  value={teamForm.leaderId}
                  onChange={v => setTeamForm(f => ({ ...f, leaderId: v }))}
                  heightClass="h-[42px]"
                  placeholder="Tìm tên nhân viên..."
                  options={activeEmployees.map(e => ({ value: e.id, label: e.name, desc: `${e.department} · ${e.position}` }))}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-600">
                    Thành viên
                    {teamForm.memberIds.length > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 bg-[#C62828]/10 text-[#C62828] rounded-full text-[10px] font-black">{teamForm.memberIds.length}</span>
                    )}
                  </label>
                </div>
                <div className="relative mb-2">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={teamMemberSearch}
                    onChange={e => setTeamMemberSearch(e.target.value)}
                    placeholder="Tìm tên, phòng ban..."
                    className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:outline-none focus:border-[#C62828]/40"
                  />
                </div>
                <div className="max-h-52 overflow-y-auto border border-gray-100 rounded-xl" style={{ scrollbarWidth: "thin" }}>
                  {activeEmployees.filter(e => {
                    if (!teamMemberSearch) return true
                    const q = teamMemberSearch.toLowerCase()
                    return e.name.toLowerCase().includes(q) || e.department.toLowerCase().includes(q) || e.position.toLowerCase().includes(q)
                  }).map(e => {
                    const sel = teamForm.memberIds.includes(e.id)
                    const isLead = e.id === teamForm.leaderId
                    return (
                      <button key={e.id} type="button" onClick={() => toggleTeamMember(e.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs transition-all ${sel ? "bg-[#C62828]/6" : "hover:bg-gray-50"}`}>
                        <AvatarCircle name={e.name} photo={e.photos?.[0]} />
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className={`font-bold truncate ${sel ? "text-[#C62828]" : "text-gray-700"}`}>{e.name}</p>
                            {isLead && <Crown size={10} className="text-amber-500 flex-shrink-0" />}
                          </div>
                          <p className="text-[10px] text-gray-400">{e.department} · {e.position}</p>
                        </div>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${sel ? "bg-[#C62828] border-[#C62828]" : "border-gray-200"}`}>
                          {sel && <Check size={9} className="text-white" strokeWidth={3} />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Mô tả</label>
                <input
                  value={teamForm.description}
                  onChange={e => setTeamForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Mục tiêu, nhiệm vụ của nhóm..."
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/20"
                />
              </div>
            </div>
      </Modal>

      {showDeleteConfirm && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={20} className="text-red-500" />
              </div>
              <div>
                <h4 className="font-black text-gray-800 text-sm">Xóa dự án</h4>
                <p className="text-xs text-gray-400 mt-0.5">Hành động này không thể hoàn tác</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Bạn có chắc muốn xóa dự án <span className="font-bold text-gray-800">{showDeleteConfirm.name}</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">
                Hủy
              </button>
              <button onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors">
                Xóa
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {taskDeleteConfirm && createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setTaskDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={20} className="text-red-500" />
              </div>
              <div>
                <h4 className="font-black text-gray-800 text-sm">Xóa công việc</h4>
                <p className="text-xs text-gray-400 mt-0.5">Tiến độ dự án sẽ được cập nhật lại</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setTaskDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">
                Hủy
              </button>
              <button onClick={() => handleDeleteTask(taskDeleteConfirm)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors">
                Xóa
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      <ConfirmModal
        isOpen={deleteGroup !== null}
        onClose={() => setDeleteGroup(null)}
        onConfirm={() => {
          if (deleteGroup) handleDeleteGroup(deleteGroup.id)
        }}
        title="Xóa nhóm"
        message={`Bạn có chắc muốn xóa nhóm "${deleteGroup?.name}"?`}
        confirmText="Xác nhận xóa"
        cancelText="Hủy"
        type="danger"
      />
    </div>
  )
}
