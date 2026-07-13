import * as service from "../services/user.service.js"

export function getUsers(req, res, next) {
  try {
    const includeCoreAdmins = req.query.includeCoreAdmins === "true"
    const list = service.listUsers({ includeCoreAdmins })
    res.json({ success: true, data: list })
  } catch (err) {
    next(err)
  }
}

export async function createUser(req, res, next) {
  try {
    const user = await service.createUser(req.body)
    res.status(201).json({ success: true, data: user })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
}

export function updateUser(req, res, next) {
  try {
    const user = service.updateUser(req.params.id, req.body)
    res.json({ success: true, data: user })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
}

export function toggleUserStatus(req, res, next) {
  try {
    const { reason } = req.body
    const user = service.toggleStatus(req.params.id, reason)
    res.json({ success: true, data: user })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
}

export async function resetUserPassword(req, res, next) {
  try {
    const result = await service.resetPassword(req.params.id)
    res.json({ success: true, data: result })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
}

export function deleteUser(req, res, next) {
  try {
    service.deleteUser(req.params.id)
    res.json({ success: true, data: { id: req.params.id } })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
}

export async function updateAdmin(req, res, next) {
  try {
    await service.updateAdminAccount(req.params.id, req.body)
    res.json({ success: true, data: { id: req.params.id } })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
}
