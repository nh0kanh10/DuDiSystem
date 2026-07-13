import mongoose from "mongoose"
import dns from "dns"

export async function connectDB() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Copy backend/.env.example to backend/.env and add your Atlas password.")
  }
  if (uri.includes("YOUR_PASSWORD")) {
    throw new Error("Replace YOUR_PASSWORD in backend/.env with your real Atlas database password.")
  }

  if (uri.startsWith("mongodb+srv://")) {
    try {
      const hostPart = uri.split("@")[1]?.split("/")[0]?.split("?")[0]
      if (hostPart) {
        await new Promise((resolve) => {
          dns.resolveSrv(`_mongodb._tcp.${hostPart}`, (err) => {
            if (err && (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND" || err.code === "ESERVFAIL")) {
              console.log("Local DNS failed to resolve SRV record. Configuring public DNS servers (8.8.8.8, 1.1.1.1) as fallback...")
              dns.setServers(["8.8.8.8", "1.1.1.1"])
            }
            resolve()
          })
        })
      }
    } catch (e) {
      // Ignore DNS pre-check exceptions
    }
  }

  mongoose.set("strictQuery", false)
  await mongoose.connect(uri)
  console.log("MongoDB connected:", mongoose.connection.name)
}

export async function disconnectDB() {
  await mongoose.disconnect()
}

export function isConnected() {
  return mongoose.connection.readyState === 1
}
