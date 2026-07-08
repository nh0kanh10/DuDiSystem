
// Let's test the current date issue!
const now = new Date("2026-07-08T14:30:00+07:00"); // Simulate local time
console.log("Now (local):", now.toString());
console.log("toISOString():", now.toISOString());
const todayStrUTC = now.toISOString().split("T")[0];
console.log("todayStr (UTC):", todayStrUTC);
// How to get today's local date string correctly!
const todayLocalStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
console.log("todayLocalStr (correct):", todayLocalStr);
