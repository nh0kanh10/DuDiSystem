import * as ProfileUpdateRequestRepo from "../repositories/profileUpdateRequest.repository.js"
import * as EmployeeRepo from "../repositories/employee.repository.js"

export const getRequests = (req, res) => {
  try {
    const filters = {
      employeeId: req.query.employeeId,
      status: req.query.status
    }
    const data = ProfileUpdateRequestRepo.getAll(filters)
    res.json({ data })
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách yêu cầu" })
  }
}

export const createRequest = (req, res) => {
  try {
    const { employeeId, note } = req.body
    if (!employeeId) return res.status(400).json({ message: "Thiếu employeeId" })

    const existing = ProfileUpdateRequestRepo.getAll({ employeeId }).find(r => 
      ["sent", "pending_approval", "rework_requested"].includes(r.status)
    )
    if (existing) {
      return res.status(400).json({ message: "Nhân viên này đang có một yêu cầu cập nhật chưa hoàn tất" })
    }

    const newReq = ProfileUpdateRequestRepo.create({
      employeeId,
      status: "sent",
      note
    })
    res.status(201).json({ data: newReq })
  } catch (error) {
    res.status(500).json({ message: "Lỗi tạo yêu cầu" })
  }
}

export const submitDraft = (req, res) => {
  try {
    const { id } = req.params
    const { pendingData } = req.body
    
    const request = ProfileUpdateRequestRepo.getById(id)
    if (!request) return res.status(404).json({ message: "Không tìm thấy yêu cầu" })
    
    const updated = ProfileUpdateRequestRepo.update(id, {
      status: "pending_approval",
      pendingData,
      submittedAt: new Date().toLocaleDateString("en-GB")
    })
    res.json({ data: updated })
  } catch (error) {
    res.status(500).json({ message: "Lỗi nộp bản nháp" })
  }
}

export const approveRequest = (req, res) => {
  try {
    const { id } = req.params
    const request = ProfileUpdateRequestRepo.getById(id)
    if (!request) return res.status(404).json({ message: "Không tìm thấy yêu cầu" })
    
    if (request.status !== "pending_approval") {
      return res.status(400).json({ message: "Yêu cầu không ở trạng thái chờ duyệt" })
    }

    EmployeeRepo.update(request.employeeId, request.pendingData)

    const updated = ProfileUpdateRequestRepo.update(id, {
      status: "approved",
      approvedAt: new Date().toLocaleDateString("en-GB")
    })
    res.json({ data: updated })
  } catch (error) {
    res.status(500).json({ message: "Lỗi phê duyệt yêu cầu" })
  }
}

export const rejectRequest = (req, res) => {
  try {
    const { id } = req.params
    const { reworkReason } = req.body
    
    const request = ProfileUpdateRequestRepo.getById(id)
    if (!request) return res.status(404).json({ message: "Không tìm thấy yêu cầu" })

    const updated = ProfileUpdateRequestRepo.update(id, {
      status: "rework_requested",
      reworkReason
    })
    res.json({ data: updated })
  } catch (error) {
    res.status(500).json({ message: "Lỗi từ chối yêu cầu" })
  }
}
