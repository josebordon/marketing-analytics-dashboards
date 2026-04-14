import {csvFormat} from "d3-dsv";

const jobs = [
  {name: "Finance DM", baseRate: 0.97, avgDuration: 42},
  {name: "Customer DM ETL", baseRate: 0.93, avgDuration: 28},
  {name: "LCM DM ETL", baseRate: 0.93, avgDuration: 15},
  {name: "Payroll DM ETL", baseRate: 1.0, avgDuration: 18},
  {name: "Finance DM (longrun)", baseRate: 1.0, avgDuration: 95},
  {name: "Marketplace DM ETL", baseRate: 1.0, avgDuration: 12},
  {name: "Marketing DM ETL", baseRate: 1.0, avgDuration: 10},
  {name: "Earnings DM ETL", baseRate: 1.0, avgDuration: 35},
  {name: "Chatbot DM ETL", baseRate: 1.0, avgDuration: 8},
  {name: "Customer DM (max)", baseRate: 1.0, avgDuration: 22},
  {name: "Credit Monitoring DM", baseRate: 1.0, avgDuration: 14},
  {name: "Experiment DM ETL", baseRate: 1.0, avgDuration: 6},
  {name: "Bank DM ETL", baseRate: 1.0, avgDuration: 30},
  {name: "Early Pay DM ETL", baseRate: 1.0, avgDuration: 12},
  {name: "Live Pay DM ETL", baseRate: 1.0, avgDuration: 10},
  {name: "MBR Pipeline", baseRate: 1.0, avgDuration: 25},
];

const rows = [];
const today = new Date();
for (const job of jobs) {
  for (let d = 89; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    rows.push({
      date: date.toISOString().slice(0, 10),
      job_name: job.name,
      status: Math.random() < job.baseRate ? "SUCCESS" : "FAILED",
      duration_minutes: Math.round(job.avgDuration * (0.7 + Math.random() * 0.6)),
    });
  }
}

process.stdout.write(csvFormat(rows));
