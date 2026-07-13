import fs from "fs"
import path from "path"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PROJECT_ROOT = path.resolve(__dirname, "../../")
const DATA_DIR = path.join(__dirname, "../src/db/data")
const BACKUP_DIR = path.join(__dirname, "../src/db/backups")

const FIREBASE_JSON_PATH = path.join(PROJECT_ROOT, "quanlynhansu-d377c-default-rtdb-export (10).json")
const EMPLOYEES_PATH = path.join(DATA_DIR, "employees.json")
const USERS_PATH = path.join(DATA_DIR, "users.json")

function getJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"))
  } catch (e) {
    return []
  }
}

function saveJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2))
}

function formatPhone(phone) {
  if (!phone) return ""
  let p = phone.replace(/[^0-9+]/g, "")
  if (p.startsWith("+84")) p = "0" + p.slice(3)
  return p
}

function backupData() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const empBackup = path.join(BACKUP_DIR, `employees_${timestamp}.bak.json`)
  const userBackup = path.join(BACKUP_DIR, `users_${timestamp}.bak.json`)
  
  if (fs.existsSync(EMPLOYEES_PATH)) fs.copyFileSync(EMPLOYEES_PATH, empBackup)
  if (fs.existsSync(USERS_PATH)) fs.copyFileSync(USERS_PATH, userBackup)
  console.log(`[Backup] Đã tạo file backup tại ${BACKUP_DIR}`)
}

const deptMap = {
  "Kỹ thuật": "dept-tech",
  "Kinh doanh – Marketing": "dept-sales",
  "Quản trị": "dept-hr"
}

const jobRoleMap = {
  "CEO": "role-manager",
  "PM": "role-manager",
  "Security Lead": "role-manager",
  "Lead": "role-manager",
  "FS": "role-user",
  "Intern": "role-user",
  "Thực tập": "role-user",
  "Intern FS": "role-user",
  "Intern sale": "role-user",
  "Intern Sale": "role-user",
  "Intern BA": "role-user",
  "Sale": "role-user",
  "Intern Tester": "role-user",
  "Intern FE": "role-user"
}

async function run() {
  const isDryRun = process.argv.includes("--dry-run")
  console.log(`\n=== BẮT ĐẦU MIGRATION TỪ FIREBASE ${isDryRun ? "[DRY RUN]" : "[THỰC TẾ]"} ===\n`)

  const firebaseData = getJson(FIREBASE_JSON_PATH)
  const f_emps = Object.values(firebaseData.employees || {})
  const f_users = Object.values(firebaseData.users || {})

  let cur_emps = getJson(EMPLOYEES_PATH)
  let cur_users = getJson(USERS_PATH)

  cur_emps = cur_emps.filter(e => e.id === "0000000000")
  cur_users = cur_users.filter(u => u.employeeId === "0000000000")

  const existingEmpIds = new Set(cur_emps.map(e => e.id))
  const existingPhones = new Set(cur_emps.map(e => formatPhone(e.phone)).filter(p => p))

  const needsDeptReview = []
  const needsRoleReview = []
  const skippedDuplicates = []

  let usersCreated = 0
  let empsCreated = 0

  for (const fe of f_emps) {
    if (existingEmpIds.has(fe.id)) {
      skippedDuplicates.push(`Employee trùng ID: ${fe.id} (${fe.name})`)
      continue
    }

    const cleanPhone = formatPhone(fe.phone)
    if (cleanPhone && existingPhones.has(cleanPhone)) {
      skippedDuplicates.push(`Employee trùng Số điện thoại: ${cleanPhone} (${fe.name})`)
      continue
    }
    if (cleanPhone) existingPhones.add(cleanPhone)

    let orgNodeId = deptMap[fe.dept]
    if (!orgNodeId) {
      orgNodeId = "branch-dudi"
      needsDeptReview.push(`${fe.id} - ${fe.name} (Dept Firebase: "${fe.dept}")`)
    }
    
    let email = fe.email ? fe.email.trim() : ""
    if (!email) {
      email = `nv${fe.id}@dudi.vn`
    }

    const newEmp = {
      id: fe.id,
      name: fe.name,
      email: email,
      phone: cleanPhone,
      department: fe.dept || "",
      position: fe.job || "",
      joinDate: fe.start || "",
      status: fe.status === "Nghỉ việc" ? "inactive" : "active",
      contractType: fe.contractType === "Thực tập" ? "intern" : "staff",
      branchId: "branch-dudi",
      orgNodeId: orgNodeId,
      cccd: fe.cccd ? fe.cccd.trim() : "",
      cccdDate: fe.cccdIssueDate || "",
      cccdPlace: fe.cccdIssuePlace || "",
      bankAccount: fe.bankAccount || "",
      bank: fe.bankName || "",
      dob: fe.dob || "",
      gender: fe.gender || "",
      curProvince: fe.currentAddress?.province || fe.currentProvince || "",
      curDistrict: fe.currentAddress?.district || fe.currentDistrict || "",
      curWard: fe.currentAddress?.ward || fe.currentWard || "",
      curStreet: fe.currentAddress?.street || fe.currentStreet || "",
      homeProvince: fe.hometown?.province || fe.hometownProvince || "",
      homeDistrict: fe.hometown?.district || fe.hometownDistrict || "",
      homeWard: fe.hometown?.ward || fe.hometownWard || "",
      homeStreet: fe.hometown?.street || fe.hometownStreet || "",
      photos: []
    }
    cur_emps.push(newEmp)
    existingEmpIds.add(fe.id)
    empsCreated++
  }

  for (const fu of f_users) {
    const emp = f_emps.find(e => e.id === fu.username)
    if (!emp) {
      console.log(`[Cảnh báo] Không tìm thấy nhân viên cho user: ${fu.username}`)
      continue
    }
    
    if (!existingEmpIds.has(fu.username)) {
      continue
    }

    let roleId = "role-user"
    if (fu.role === "admin") {
      roleId = "role-admin" 
    } else {
      const jobTitle = emp.job ? emp.job.trim() : ""
      roleId = jobRoleMap[jobTitle]
      if (!roleId) {
        roleId = "role-user"
        needsRoleReview.push(`${fu.username} - ${emp.name} (Job: "${jobTitle}")`)
      }
    }

    let hash = fu.password
    if (!isDryRun) {
      const salt = await bcrypt.genSalt(10)
      hash = await bcrypt.hash(fu.password || "1234", salt)
    }

    const realEmp = cur_emps.find(e => e.id === fu.username)

    const newUser = {
      id: fu.username,
      employeeId: fu.username,
      email: realEmp ? realEmp.email : fu.username,
      password: hash,
      roleId: roleId,
      status: emp.status === "Nghỉ việc" ? "inactive" : "active"
    }
    cur_users.push(newUser)
    usersCreated++
  }

  console.log(`\n--- TỔNG KẾT MIGRATION ---`)
  console.log(`- Nhân viên sẽ tạo mới: ${empsCreated}`)
  console.log(`- Tài khoản sẽ tạo mới: ${usersCreated}`)
  
  if (skippedDuplicates.length > 0) {
    console.log(`\n[!] CẢNH BÁO: Bị bỏ qua do TRÙNG LẶP (${skippedDuplicates.length}):`)
    skippedDuplicates.forEach(s => console.log(`  - ${s}`))
  }

  if (needsDeptReview.length > 0) {
    console.log(`\n[?] CẦN REVIEW: Không khớp Phòng ban -> Đưa về chi nhánh (${needsDeptReview.length}):`)
    needsDeptReview.forEach(s => console.log(`  - ${s}`))
  }

  if (needsRoleReview.length > 0) {
    console.log(`\n[?] CẦN REVIEW: Không khớp Chức danh (Job) -> Gán tạm role-user (${needsRoleReview.length}):`)
    needsRoleReview.forEach(s => console.log(`  - ${s}`))
  }

  if (isDryRun) {
    console.log(`\n[DRY RUN] Script kết thúc an toàn. Không có file nào bị ghi đè.`)
    console.log(`Để chạy thật sự và lưu data, hãy bỏ cờ --dry-run.`)
  } else {
    console.log(`\n[THỰC TẾ] Đang tiến hành ghi dữ liệu...`)
    backupData()
    saveJson(EMPLOYEES_PATH, cur_emps)
    saveJson(USERS_PATH, cur_users)
    console.log(`Đã lưu thành công ${cur_emps.length} nhân viên và ${cur_users.length} tài khoản.`)
  }
}

run().catch(console.error)
