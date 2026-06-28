import { findAll, updateById, insertOne } from "../db/index.js"

export function getSystemConfig() {
  let config = findAll("systemConfig")[0]
  if (!config) {
    config = insertOne("systemConfig", {
      id: "working_hours",
      companyName: "DuDi System",
      morningStart: "09:00",
      morningEnd: "12:00",
      afternoonStart: "13:30",
      afternoonEnd: "17:00",
      lateGraceMinutes: 15,
      earlyGraceMinutes: 15,
      requireIP: false
    })
  }
  return config
}

export function updateSystemConfig(patch) {
  const config = getSystemConfig()
  return updateById("systemConfig", config.id, patch)
}
