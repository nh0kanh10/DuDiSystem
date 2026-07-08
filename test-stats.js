
// Let's simulate what StatisticsPage does for July 2026, today 2026-07-08!
const employees = [
  { id: "NV003", name: "Lê Thu Hương" },
  { id: "NV001", name: "Trần Thị Bích Liên" },
];

// Attendance records for NV003 and NV001 for July
const attendance = [
  // NV001 July
  { id: "ATT107", employeeId: "NV001", checkIn: "10:40", checkOut: "10:42:47", date: "2026-07-01", status: "on-time", note: "" },
  { id: "ATT116", employeeId: "NV001", checkIn: "08:02", checkOut: "17:35", date: "2026-07-02", status: "on-time", note: "" },
  { id: "ATT132", employeeId: "NV001", checkIn: "08:02", checkOut: "17:35", date: "2026-07-03", status: "on-time", note: "" },
  { id: "ATT148", employeeId: "NV001", checkIn: "08:02", checkOut: "17:35", date: "2026-07-06", status: "on-time", note: "" },
  { id: "ATT164", employeeId: "NV001", checkIn: "08:02", checkOut: "17:35", date: "2026-07-07", status: "on-time", note: "" },
  { id: "ATT180", employeeId: "NV001", checkIn: "08:02", checkOut: "17:35", date: "2026-07-08", status: "on-time", note: "" },
  
  // NV003 July (original data)
  { id: "ATT109", employeeId: "NV003", checkIn: "08:45", checkOut: "--", date: "2026-07-01", status: "on-time", note: "" },
  { id: "ATT118", employeeId: "NV003", checkIn: "07:58", checkOut: "17:05", date: "2026-07-02", status: "on-time", note: "" },
  // Missing 03,06,07,08? Wait but let's see what the code does!
];

const now = new Date("2026-07-08T14:30:00+07:00");
const todayStr = now.toISOString().split("T")[0]; // UTC?
console.log("todayStr:", todayStr);

const dateRange = {
  start: "2026-07-01",
  end: "2026-07-31"
};

const statsMap = {};
const daysList = [];

if (dateRange.start && dateRange.end) {
  const [sy, sm, sd] = dateRange.start.split("-").map(Number);
  const [ey, em, ed] = dateRange.end.split("-").map(Number);
  let current = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);

  while (current <= end) {
    const yStr = current.getFullYear();
    const mStr = String(current.getMonth() + 1).padStart(2, "0");
    const dStr = String(current.getDate()).padStart(2, "0");
    const dayStr = `${yStr}-${mStr}-${dStr}`;
    
    const dt = new Date(yStr, current.getMonth(), current.getDate());
    const isWeekend = dt.getDay() === 0 || dt.getDay() === 6;
    
    console.log(`Checking day ${dayStr}: isWeekend=${isWeekend}, <= todayStr? ${dayStr <= todayStr}`);
    if (!isWeekend && dayStr <= todayStr) {
      daysList.push(dayStr);
      console.log("-> Added to daysList!");
    }
    current.setDate(current.getDate() + 1);
  }
}
console.log("\ndaysList:", daysList, "\nTotal days:", daysList.length);

employees.forEach(e => {
  statsMap[e.id] = { late: 0, leave: 0, absent: 0, total: 0, onTime: 0 };
  
  daysList.forEach(day => {
    const matched = attendance.find(r => r.employeeId === e.id && r.date === day);
    console.log(`${e.id} on ${day}:`, matched ? matched.status : "NOT FOUND!");
    if (matched) {
      if (matched.status === "late" || matched.status === "late_early") {
        statsMap[e.id].late += 1;
        statsMap[e.id].total += 1;
      } else if (matched.status === "leave") {
        statsMap[e.id].leave += 1;
      } else if (matched.status === "absent") {
        statsMap[e.id].absent += 1;
      } else if (matched.status === "on-time" || matched.status === "early") {
        statsMap[e.id].onTime += 1;
        statsMap[e.id].total += 1;
      }
    } else {
      statsMap[e.id].absent += 1;
    }
  });
  console.log(`\nStats for ${e.id}:`, statsMap[e.id]);
});
