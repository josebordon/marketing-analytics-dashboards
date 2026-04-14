import {csvFormat} from "d3-dsv";

const rooms = [
  {name: "LCM Genie", avgUsers: 15, avgQueries: 48},
  {name: "Live Pay Genie", avgUsers: 8, avgQueries: 19},
  {name: "Customer Genie", avgUsers: 15, avgQueries: 13},
  {name: "New User Cash Out", avgUsers: 6, avgQueries: 5},
  {name: "Bank Data Genie", avgUsers: 5, avgQueries: 2},
  {name: "Marketing Analytics", avgUsers: 2, avgQueries: 2},
  {name: "Experian Genie", avgUsers: 4, avgQueries: 1},
];

const rows = [];
const today = new Date();
for (const room of rooms) {
  for (let d = 89; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const queries = Math.max(0, Math.round(room.avgQueries * (0.6 + Math.random() * 0.8)));
    const users = Math.max(1, room.avgUsers + Math.round((Math.random() - 0.5) * 4));
    rows.push({
      date: date.toISOString().slice(0, 10),
      room_name: room.name,
      query_count: queries,
      active_users: users,
    });
  }
}

process.stdout.write(csvFormat(rows));
