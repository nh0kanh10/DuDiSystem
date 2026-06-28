import express from "express"
import cors from "cors"
import { PORT, CORS_ORIGINS } from "./config/index.js"
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js"

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

const app = express()

app.use(cors({ origin: CORS_ORIGINS }))
app.use(express.json())

app.get("/api/health", (_, res) => res.json({ success: true, data: { status: "ok", version: "2.0.0" } }))

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

app.use(notFoundHandler)
app.use(errorHandler)

app.listen(PORT, () => console.log(`DuDi Backend v2.0 running on http://localhost:${PORT}`))
