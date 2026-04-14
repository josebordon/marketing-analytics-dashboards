import {html} from "npm:htl";

export function filterBar(filters) {
  return html`<div class="filter-bar">${filters.map(f => html`
    <label>${f.label}</label>
    ${f.input}
  `)}</div>`;
}
