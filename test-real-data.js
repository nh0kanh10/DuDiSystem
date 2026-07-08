
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load real data
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const employees = JSON.parse(fs.readFileSync(path.join(__dirname, 'backend', 'src', 'db', 'data', 'employees.json'), 'utf8'));
const attendance = JSON.parse(fs.readFileSync(path.join(__dirname, 'backend', 'src', 'db', 'data', 'attendance.json'), 'utf8'));

// Simulate current date as 2026-07-08 00:30 AM local time (GMT+7), which is 2026-07-07T17:30:00Z
const currentDate = new Date('2026-07-08T00:30:00+07:00');
console.log('Testing with date:', currentDate);
console.log('Date (local):', currentDate.toLocaleDateString());
console.log('Date (ISO):', currentDate.toISOString());

// Simulate dateRange for July 2026
const dateRange = { start: '2026-07-01', end: '2026-07-31' };

console.log('\n--- Calculating daysList ---');
const daysList = [];
if (dateRange.start && dateRange.end) {
  const [sy, sm, sd] = dateRange.start.split("-").map(Number);
  const [ey, em, ed] = dateRange.end.split("-").map(Number);
  let current = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  // Get today's date in local time, not UTC
  const nowLocal = currentDate;
  const todayStr = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, "0")}-${String(nowLocal.getDate()).padStart(2, "0")}`;
  console.log('todayStr (ISO date):', todayStr);

  while (current <= end) {
    const yStr = current.getFullYear();
    const mStr = String(current.getMonth() + 1).padStart(2, "0");
    const dStr = String(current.getDate()).padStart(2, "0");
    const dayStr = `${yStr}-${mStr}-${dStr}`;
    
    const dt = new Date(yStr, current.getMonth(), current.getDate());
    const isWeekend = dt.getDay() === 0 || dt.getDay() === 6;
    
    console.log(`Check day ${dayStr}: weekend? ${isWeekend} | <= ${todayStr}? ${dayStr <= todayStr}`);
    if (!isWeekend && dayStr <= todayStr) {
      daysList.push(dayStr);
    }
    current.setDate(current.getDate() + 1);
  }
}
console.log('\ndaysList:', daysList);
console.log('Total days in daysList:', daysList.length);

// Now calculate stats
const map = {};
employees.forEach(e => {
  map[e.id] = { late: 0, leave: 0, absent: 0, total: 0, onTime: 0, matchedDays: [] };
  
  daysList.forEach(day => {
    const matched = attendance.find(r => r.employeeId === e.id && r.date === day);
    if (matched) {
      map[e.id].matchedDays.push(day);
      if (matched.status === "late" || matched.status === "late_early") {
        map[e.id].late += 1;
        map[e.id].total += 1;
      } else if (matched.status === "leave") {
        map[e.id].leave += 1;
      } else if (matched.status === "absent") {
        map[e.id].absent += 1;
      } else if (matched.status === "on-time" || matched.status === "early") {
        map[e.id].onTime += 1;
        map[e.id].total += 1;
      }
    } else {
      map[e.id].absent += 1;
    }
  });
});

// Print stats for NV001, NV002, NV003
console.log('\n--- Stats ---');
['NV001', 'NV002', 'NV003'].forEach(id => {
  const e = employees.find(emp => emp.id === id);
  console.log(`\n${e?.name} (${id}):`);
  console.log('Stats:', map[id]);
  console.log('Matched days:', map[id].matchedDays);
});
