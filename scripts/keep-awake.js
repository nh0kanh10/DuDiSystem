import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

function loadEnv() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const rootDir = path.resolve(__dirname, "..");
  
  const envPaths = [
    path.join(rootDir, ".env"),
    path.join(rootDir, "backend", ".env"),
    path.join(rootDir, "frontend", ".env"),
    path.join(rootDir, "frontend", ".env.local")
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, "utf-8");
        content.split(/\r?\n/).forEach(line => {
          const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
          if (match) {
            const key = match[1];
            let value = match[2] || "";
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
            if (!process.env[key]) {
              process.env[key] = value;
            }
          }
        });
      } catch (err) {
      }
    }
  }
}

loadEnv();

const rawUrl = process.env.TARGET_URL 
  || process.env.RENDER_API_URL 
  || process.env.VITE_API_URL;

if (!rawUrl) {
  console.error("Error: TARGET_URL, RENDER_API_URL, or VITE_API_URL is not defined in the environment or any .env file!");
  process.exit(1);
}

let normalizedUrl = rawUrl;
if (!normalizedUrl.includes("/api/health")) {
  if (normalizedUrl.endsWith("/api") || normalizedUrl.endsWith("/api/")) {
    normalizedUrl = normalizedUrl.replace(/\/api\/?$/, "/api/health");
  } else {
    normalizedUrl = normalizedUrl.replace(/\/$/, "") + "/api/health";
  }
}

const TARGET_URL = normalizedUrl;
const INTERVAL_MS = 10 * 60 * 1000; 

console.log("Starting Render Keep-Awake script...");
console.log(`Target URL: ${TARGET_URL}`);
console.log("Will ping between 05:00 and 22:00 (Vietnam Time - UTC+7)\n");

function getVietnamTime() {
  const utc = new Date().getTime() + new Date().getTimezoneOffset() * 60000;
  return new Date(utc + (3600000 * 7));
}

async function ping() {
  const vnTime = getVietnamTime();
  const hour = vnTime.getHours();
  
  console.log(`[${vnTime.toLocaleString("vi-VN")}] Checking hour: ${hour}h`);
  
  if (hour >= 5 && hour < 22) {
    try {
      console.log(`[${vnTime.toLocaleString("vi-VN")}] Sending ping to ${TARGET_URL}...`);
      const res = await fetch(TARGET_URL);
      if (res.ok) {
        console.log(`[${vnTime.toLocaleString("vi-VN")}] Success: Render backend is awake!`);
      } else {
        console.warn(`[${vnTime.toLocaleString("vi-VN")}] Warning: Server responded with status ${res.status}`);
      }
    } catch (err) {
      console.error(`[${vnTime.toLocaleString("vi-VN")}] Error pinging server:`, err.message);
    }
  } else {
    console.log(`[${vnTime.toLocaleString("vi-VN")}] Outside active hours (5h - 22h). Sleeping.`);
  }
}

// Initial call
ping();

// Periodic call
setInterval(ping, INTERVAL_MS);
