import mongoose from "mongoose"

export async function connectDB() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Copy backend/.env.example to backend/.env and add your Atlas password.")
  }
  if (uri.includes("YOUR_PASSWORD")) {
    throw new Error("Replace YOUR_PASSWORD in backend/.env with your real Atlas database password.")
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
