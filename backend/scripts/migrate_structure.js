import "dotenv/config";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { connectDB, disconnectDB } from "../src/db/connect.js";
import { getModel } from "../src/db/models.js";

const __dir = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dir, "../src/db/data");

async function migrateCollection(collection) {
  const filePath = join(DATA_DIR, `${collection}.json`);
  const data = JSON.parse(readFileSync(filePath, "utf-8"));
  
  const Model = getModel(collection);
  
  console.log(`Clearing old ${collection}...`);
  await Model.deleteMany({});
  
  if (data.length > 0) {
    console.log(`Inserting ${data.length} records into ${collection}...`);
    await Model.insertMany(data);
  }
  
  try {
    await Model.collection.createIndex({ id: 1 }, { unique: true, sparse: true });
  } catch (e) {
    console.log(`Index creation note: ${e.message}`);
  }
  
  console.log(`Finished migrating ${collection}.`);
}

async function main() {
  console.log("Starting structure-only migration (orgNodes & positions)...");
  await connectDB();
  
  await migrateCollection("orgNodes");
  await migrateCollection("positions");
  
  console.log("Structure migration completed successfully!");
  await disconnectDB();
}

main().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
