import "dotenv/config"
import http from "http"
import express from "express"
import cors from "cors"
import { PORT, CORS_ORIGINS } from "./config/index.js"
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js"
import { connectDB, isConnected } from "./db/connect.js"
import { loadCache } from "./db/index.js"
import { initChatSocket } from "./socket/chat.socket.js"

import authRoutes from "./routes/auth.routes.js"
import employeeRoutes from "./routes/employee.routes.js"
import orgNodeRoutes from "./routes/orgNode.routes.js"
import assignmentRoutes from "./routes/assignment.routes.js"
import attendanceRoutes from "./routes/attendance.routes.js"
import requestRoutes from "./routes/request.routes.js"
import taskRoutes from "./routes/task.routes.js"
import notificationRoutes from "./routes/notification.routes.js"
import dashboardRoutes from "./routes/dashboard.routes.js"
import userRoutes from "./routes/user.routes.js"
import systemConfigRoutes from "./routes/systemConfig.routes.js"
import projectRoutes from "./routes/project.routes.js"
import groupRoutes from "./routes/group.routes.js"
import announcementRoutes from "./routes/announcement.routes.js"
import positionRoutes from "./routes/position.routes.js"
import roleRoutes from "./routes/role.routes.js"
import crmRoutes from "./routes/crm.routes.js"
import allowedIPRoutes from "./routes/allowedIP.routes.js"
import timeOffSlotRoutes from "./routes/timeOffSlot.routes.js"
import profileUpdateRoutes from "./routes/profileUpdate.routes.js"
import staffChatRoutes from "./routes/staffChat.routes.js"

const app = express()

app.use(cors({ origin: CORS_ORIGINS }))
app.use(express.json())

app.get("/api/health", (_, res) =>
  res.json({
    success: true,
    data: {
      status: "ok",
      version: "2.0.0",
      db: isConnected() ? "mongodb" : "disconnected",
      realtime: "socket.io",
    },
  })
)

app.use("/api/auth", authRoutes)
app.use("/api/employees", employeeRoutes)
app.use("/api/org-nodes", orgNodeRoutes)
app.use("/api/assignments", assignmentRoutes)
app.use("/api/attendance", attendanceRoutes)
app.use("/api/requests", requestRoutes)
app.use("/api/tasks", taskRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/users", userRoutes)
app.use("/api/system-config", systemConfigRoutes)
app.use("/api/projects", projectRoutes)
app.use("/api/groups", groupRoutes)
app.use("/api/announcements", announcementRoutes)
app.use("/api/positions", positionRoutes)
app.use("/api/roles", roleRoutes)
app.use("/api/crm", crmRoutes)
app.use("/api/allowed-ips", allowedIPRoutes)
app.use("/api/time-off-slots", timeOffSlotRoutes)
app.use("/api/profile-updates", profileUpdateRoutes)
app.use("/api/staff-chat", staffChatRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

async function start() {
  try {
    await connectDB()
    await loadCache()

    const httpServer = http.createServer(app)
    initChatSocket(httpServer)

    httpServer.listen(PORT, () => {
      console.log(`DuDi Backend v2.0 running on http://localhost:${PORT}`)
      console.log(`Realtime chat: ws://localhost:${PORT}/socket.io`)
    })
  } catch (err) {
    console.error("Failed to start server:", err.message)
    process.exit(1)
  }
}

start()
