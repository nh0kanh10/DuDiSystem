import * as svc from "../services/customer.service.js"

function ok(res, data, status = 200) {
  res.status(status).json({ success: true, data })
}

function notFound(res, msg = "Không tìm thấy") {
  res.status(404).json({ success: false, error: msg })
}

export function list(req, res) {
  ok(res, svc.listCustomers(req.query))
}

export function getOne(req, res) {
  const customer = svc.getCustomer(req.params.id)
  if (!customer) return notFound(res)
  ok(res, customer)
}
