import { fail } from "../utils/response.js"

export function requireFields(...fields) {
  return (req, res, next) => {
    const missing = fields.filter(f => {
      const val = req.body[f]
      return val === undefined || val === null || val === ""
    })
    if (missing.length > 0) {
      return fail(res, `Thiếu trường bắt buộc: ${missing.join(", ")}`)
    }
    next()
  }
}

export function allowedFields(...fields) {
  return (req, res, next) => {
    req.body = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => fields.includes(k))
    )
    next()
  }
}
