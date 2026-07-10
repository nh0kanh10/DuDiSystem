import "dotenv/config"
import * as userRepo from "../src/repositories/user.repository.js"
import * as roleRepo from "../src/repositories/role.repository.js"
import * as raRepo from "../src/repositories/roleAssignment.repository.js"
import * as empRepo from "../src/repositories/employee.repository.js"
import { loadCache } from "../src/db/index.js"
import { connectDB, disconnectDB } from "../src/db/connect.js"

function resolveScopeId(scopeType, currentScopeId, employeeId) {
  if (scopeType !== "branch") return null
  if (currentScopeId) return currentScopeId
  const emp = employeeId ? empRepo.getById(employeeId) : null
  return emp?.branchId || null
}

async function run() {
  await connectDB()
  await loadCache()
  const users = userRepo.getAll()
  let created = 0
  let updated = 0
  let skipped = 0

  for (const user of users) {
    const role = roleRepo.getById(user.roleId)
    const expectedScopeType = role?.scopeType || "self"
    const primary = raRepo.getPrimary(user.id)

    if (!primary) {
      raRepo.create({
        id: `ra-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: user.id,
        scopeType: expectedScopeType,
        scopeId: resolveScopeId(expectedScopeType, null, user.employeeId),
        isPrimary: true,
      })
      created += 1
      continue
    }

    const nextScopeId = resolveScopeId(expectedScopeType, primary.scopeId, user.employeeId)
    if (primary.scopeType !== expectedScopeType || primary.scopeId !== nextScopeId) {
      raRepo.update(primary.id, {
        scopeType: expectedScopeType,
        scopeId: nextScopeId,
      })
      updated += 1
    } else {
      skipped += 1
    }
  }

  console.log(
    JSON.stringify(
      {
        totalUsers: users.length,
        createdAssignments: created,
        updatedAssignments: updated,
        unchangedUsers: skipped,
      },
      null,
      2,
    ),
  )
  await new Promise(resolve => setTimeout(resolve, 2000))
  await disconnectDB()
}

await run()
