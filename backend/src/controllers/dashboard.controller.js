import { getDashboardStats } from "../services/dashboard.service.js"
import { ok } from "../utils/response.js"

export function stats(req, res) {
  ok(res, getDashboardStats())
}
