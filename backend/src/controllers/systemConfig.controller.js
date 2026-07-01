import * as service from "../services/systemConfig.service.js"

export function getConfig(req, res, next) {
  try {
    const config = service.getSystemConfig()
    res.json({ success: true, data: config })
  } catch (err) {
    next(err)
  }
}

export function updateConfig(req, res, next) {
  try {
    const updated = service.updateSystemConfig(req.body)
    res.json({ success: true, data: updated })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
}
