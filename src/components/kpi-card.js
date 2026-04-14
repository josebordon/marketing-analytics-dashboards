export function kpiCard({title, value, format, delta, deltaLabel, color = "accent"}) {
  const formattedValue = typeof format === "function" ? format(value) : value;

  let deltaHtml = "";
  if (delta !== undefined) {
    const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
    const arrow = delta > 0 ? "\u25B2" : delta < 0 ? "\u25BC" : "\u25C6";
    const pct = typeof delta === "number" ? `${delta > 0 ? "+" : ""}${(delta * 100).toFixed(1)}%` : delta;
    deltaHtml = `<div class=\"kpi-delta ${direction}\">${arrow} ${pct}${deltaLabel ? ` ${deltaLabel}` : ""}</div>`;
  }

  const el = document.createElement("div");
  el.className = "kpi-card";
  el.innerHTML = `
    <div class="kpi-value ${color}">${formattedValue}</div>
    <div class="kpi-label">${title}</div>
    ${deltaHtml}
  `;
  return el;
}
