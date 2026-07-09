import "dotenv/config";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { connectDB, disconnectDB } from "./src/db/connect.js";
import { getModel } from "./src/db/models.js";
import mongoose from "mongoose";

const __dir = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dir, "./src/db/data");

const CORE_IDS = ["0000000000", "1111111111", "2222222222"];

async function seedMinimal() {
  await connectDB();
  const db = mongoose.connection.db;

  console.log("Dropping database...");
  await db.dropDatabase();
  console.log("Database dropped.");

  const rolesModel = getModel("roles");
  const rolesData = JSON.parse(readFileSync(join(DATA_DIR, "roles.json"), "utf-8"));
  await rolesModel.insertMany(rolesData);
  console.log(`Seeded roles: ${rolesData.length} docs`);

  const roleAssignModel = getModel("roleAssignments");
  const roleAssignData = JSON.parse(readFileSync(join(DATA_DIR, "roleAssignments.json"), "utf-8"));
  await roleAssignModel.insertMany(roleAssignData);
  console.log(`Seeded roleAssignments: ${roleAssignData.length} docs`);

  const empModel = getModel("employees");
  const empData = JSON.parse(readFileSync(join(DATA_DIR, "employees.json"), "utf-8"));
  const coreEmps = empData.filter(e => CORE_IDS.includes(e.id));
  await empModel.insertMany(coreEmps);
  console.log(`Seeded core employees: ${coreEmps.length} docs`);

  const userModel = getModel("users");
  const userData = JSON.parse(readFileSync(join(DATA_DIR, "users.json"), "utf-8"));
  const coreUsers = userData.filter(u => CORE_IDS.includes(u.employeeId));
  await userModel.insertMany(coreUsers);
  console.log(`Seeded core users: ${coreUsers.length} docs`);

  await disconnectDB();
  console.log("Minimal seeding completed!");
}

seedMinimal().catch(console.error);
