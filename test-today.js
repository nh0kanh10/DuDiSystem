
const now = new Date();
console.log("Local time:", now.toString());
console.log("UTC time:", now.toUTCString());
console.log("toISOString().split('T')[0]:", now.toISOString().split("T")[0]);
const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const todayLocalStr = todayLocal.toISOString().split("T")[0];
console.log("Local today string (correct):", todayLocalStr);
