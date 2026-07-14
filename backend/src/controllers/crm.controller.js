import * as xlsx from "xlsx"
import * as svc from "../services/crm.service.js"
import { fail } from "../utils/response.js"

export function listData(req, res) {
  try {
    const { status, assignedTo, area, search, page, size, branchId } = req.query
    const result = svc.listRecords({
      status, assignedTo, area, search, branchId,
      page: page ? parseInt(page, 10) : 0,
      size: size ? parseInt(size, 10) : 20
    })
    res.json({ success: true, data: result })
  } catch (err) { fail(res, err.message) }
}

export function createData(req, res) {
  try {
    const record = svc.createRecord(req.body, req.user.id)
    res.status(201).json({ success: true, data: record })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
}

export function updateData(req, res) {
  try {
    const record = svc.updateRecord(req.params.id, req.body)
    res.json({ success: true, data: record })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
}

export function deleteData(req, res) {
  try {
    svc.deleteRecord(req.params.id)
    res.json({ success: true, data: { id: req.params.id } })
  } catch (err) { res.status(404).json({ success: false, error: err.message }) }
}

export function deleteBulkData(req, res) {
  try {
    const result = svc.deleteRecordsBulk(req.body.ids)
    res.json({ success: true, data: result })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
}

export function updateNote(req, res) {
  try {
    const record = svc.updateNote(req.params.id, req.body.note ?? "", req.user)
    res.json({ success: true, data: record })
  } catch (err) {
    res.status(err.status === 403 ? 403 : 400).json({ success: false, error: err.message })
  }
}

export function importCsv(req, res) {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: "Chưa có file được tải lên" })

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" })

    if (rows.length < 2) return res.status(400).json({ success: false, error: "File không có dữ liệu" })

    const headers = rows[0].map(h => String(h).trim().toLowerCase())
    function colIdx(names) {
      for (const n of names) {
        const i = headers.findIndex(h => h === n.toLowerCase())
        if (i !== -1) return i
      }
      return -1
    }

    const idIdx    = colIdx(["id", "mã", "ma", "mã khách hàng", "ma khach hang", "stt", "số thứ tự", "so thu tu"])
    const nameIdx  = colIdx(["tên doanh nghiệp","ten doanh nghiep","business name","businessname","name"])
    const addrIdx  = colIdx(["địa chỉ","dia chi","address"])
    const areaIdx  = colIdx(["khu vực","khu vuc","area"])
    const phoneIdx = colIdx(["số điện thoại","so dien thoai","sdt","phone"])
    const webIdx   = colIdx(["website","trang web"])
    const typeIdx  = colIdx(["loại hình","loai hinh","businesstype","type"])
    const mapsIdx  = colIdx(["google maps","google map","maps","googlemapurl"])
    const noteIdx  = colIdx(["ghi chú","ghi chu","note"])

    const existingPhones = new Set(
      svc.listRecords({ size: 999999 }).content.map(r => r.phone).filter(Boolean)
    )
    const phoneSeen = new Set()

    let totalRows = 0, successCount = 0, failedCount = 0
    const errors = []

    rows.slice(1).forEach((cols, i) => {
      if (!cols || cols.every(c => String(c).trim() === "")) return
      totalRows++

      const businessName = nameIdx !== -1 ? String(cols[nameIdx] ?? "").trim() : ""
      const phone        = phoneIdx !== -1 ? String(cols[phoneIdx] ?? "").trim() : ""
      const customId     = idIdx !== -1 ? String(cols[idIdx] ?? "").trim() : ""

      if (!businessName) {
        failedCount++; errors.push({ row: i + 2, message: "Thiếu tên doanh nghiệp" }); return
      }
      if (phone && (phoneSeen.has(phone) || existingPhones.has(phone))) {
        failedCount++; errors.push({ row: i + 2, message: `Số điện thoại ${phone} bị trùng` }); return
      }
      if (phone) phoneSeen.add(phone)

      svc.createRecord({
        id: customId ? customId : undefined,
        businessName,
        address:      addrIdx !== -1 ? String(cols[addrIdx] ?? "").trim() : "",
        area:         areaIdx !== -1  ? String(cols[areaIdx] ?? "").trim() : "",
        phone,
        website:      webIdx !== -1   ? String(cols[webIdx] ?? "").trim()  : "",
        businessType: typeIdx !== -1  ? String(cols[typeIdx] ?? "").trim() : "",
        googleMapUrl: mapsIdx !== -1  ? String(cols[mapsIdx] ?? "").trim() : "",
        note:         noteIdx !== -1  ? String(cols[noteIdx] ?? "").trim() : "",
        status: "Chưa xử lý"
      }, req.user.id)
      successCount++
    })

    res.json({ success: true, data: { totalRows, successCount, failedCount, errors } })
  } catch (err) {
    res.status(500).json({ success: false, error: "Lỗi xử lý file: " + err.message })
  }
}

export function assignOne(req, res) {
  try {
    const record = svc.assignOne(req.body.dataId, req.body.employeeId)
    res.json({ success: true, data: record })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
}

export function assignBulk(req, res) {
  try {
    const result = svc.assignBulk(req.body.dataIds, req.body.employeeId)
    res.json({ success: true, data: result })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
}

export function reassign(req, res) {
  try {
    const result = svc.reassign(req.body.fromEmployeeId, req.body.toEmployeeId)
    res.json({ success: true, data: result })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
}

export function autoAssign(req, res) {
  try {
    const { employeeIds } = req.body
    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({ success: false, error: "Vui lòng chọn ít nhất một nhân viên để chia data" })
    }
    const result = svc.autoAssign(employeeIds)
    res.json({ success: true, data: result })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
}

export function assignSpecific(req, res) {
  try {
    const { employeeId, quantity } = req.body
    if (!employeeId || !quantity || quantity <= 0) {
      return res.status(400).json({ success: false, error: "Vui lòng chọn nhân viên và số lượng hợp lệ" })
    }
    const result = svc.assignSpecific(employeeId, parseInt(quantity, 10))
    res.json({ success: true, data: result })
  } catch (err) { res.status(400).json({ success: false, error: err.message }) }
}

export function adminDashboard(req, res) {
  try {
    const { branchId, period } = req.query
    res.json({ success: true, data: svc.getAdminDashboard({ branchId, period }) })
  } catch (err) { fail(res, err.message) }
}

export function employeeDashboard(req, res) {
  try {
    res.json({ success: true, data: svc.getEmployeeDashboard(req.user.employeeId) })
  } catch (err) { fail(res, err.message) }
}

export function listMyData(req, res) {
  try {
    const { status, search, page, size } = req.query
    const result = svc.listMyRecords(req.user.employeeId, {
      status, search,
      page: page ? parseInt(page, 10) : 0,
      size: size ? parseInt(size, 10) : 20
    })
    res.json({ success: true, data: result })
  } catch (err) { fail(res, err.message) }
}

export function updateMyStatus(req, res) {
  try {
    const record = svc.updateStatusByEmployee(req.params.id, req.body.status, req.user)
    res.json({ success: true, data: record })
  } catch (err) {
    res.status(err.status === 403 ? 403 : 400).json({ success: false, error: err.message })
  }
}

export function convertToLead(req, res) {
  try {
    const result = svc.convertToLead(req.params.id, req.user, req.body ?? {})
    res.status(result.alreadyExists ? 200 : 201).json({ success: true, data: result })
  } catch (err) {
    res.status(err.status === 403 ? 403 : 400).json({ success: false, error: err.message })
  }
}

export function listCrmLeads(req, res) {
  try {
    const data = svc.listLeadsForCrmRecord(req.params.id)
    res.json({ success: true, data })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
}
