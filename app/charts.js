// HearthLedger charts: small SVG builders, no library. Every chart is drawn
// from the household's own numbers, so a screenshot always shows real data.

import { moneyShort } from './store.js';

function polar(cx, cy, radius, angleDeg) {
  const angle = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
}

function arcPath(cx, cy, radius, startAngle, endAngle) {
  const [sx, sy] = polar(cx, cy, radius, startAngle);
  const [ex, ey] = polar(cx, cy, radius, endAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${radius} ${radius} 0 ${large} 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`;
}

// Donut of spending by category. slices: [{category, spent, color}].
export function donutChart(slices, size = 220) {
  const total = slices.reduce((sum, s) => sum + s.spent, 0);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 14;
  let angle = 0;
  const parts = slices.map((s) => {
    const sweep = total ? (s.spent / total) * 360 : 0;
    const gap = sweep > 4 ? 1.5 : 0;
    const path = arcPath(cx, cy, radius, angle + gap / 2, angle + sweep - gap / 2);
    angle += sweep;
    return `<path d="${path}" fill="none" stroke="${s.color}" stroke-width="26" stroke-linecap="butt"/>`;
  });
  const biggest = slices[0];
  return `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Spending by category" class="chart-svg">
    ${parts.join('')}
    <text x="${cx}" y="${cy - 6}" text-anchor="middle" class="donut-center-top">${moneyShort(total)}</text>
    <text x="${cx}" y="${cy + 16}" text-anchor="middle" class="donut-center-sub">spent in Nov</text>
    <text x="${cx}" y="${cy + 34}" text-anchor="middle" class="donut-center-sub">${biggest ? biggest.category + ' leads' : ''}</text>
  </svg>`;
}

// Grouped bars: income vs spending for each month.
// months: [{month, income, spending}].
export function trendBars(months, width = 560, height = 240) {
  const max = Math.max(...months.map((m) => Math.max(m.income, m.spending))) * 1.08;
  const padLeft = 44;
  const padBottom = 26;
  const padTop = 14;
  const plotW = width - padLeft - 8;
  const plotH = height - padTop - padBottom;
  const groupW = plotW / months.length;
  const barW = Math.min(26, groupW / 3);
  const y = (v) => padTop + plotH - (v / max) * plotH;

  const grid = [0.25, 0.5, 0.75, 1].map((f) => {
    const gy = padTop + plotH - f * plotH;
    return `<line x1="${padLeft}" y1="${gy}" x2="${width - 8}" y2="${gy}" class="grid-line"/>
      <text x="${padLeft - 6}" y="${gy + 4}" text-anchor="end" class="axis-label">${moneyShort(max * f)}</text>`;
  });

  const bars = months
    .map((m, i) => {
      const gx = padLeft + i * groupW + groupW / 2;
      return `<rect x="${(gx - barW - 3).toFixed(1)}" y="${y(m.income).toFixed(1)}" width="${barW}" height="${(padTop + plotH - y(m.income)).toFixed(1)}" rx="3" class="bar-income">
        <title>${m.month} income ${m.income}</title></rect>
      <rect x="${(gx + 3).toFixed(1)}" y="${y(m.spending).toFixed(1)}" width="${barW}" height="${(padTop + plotH - y(m.spending)).toFixed(1)}" rx="3" class="bar-spending">
        <title>${m.month} spending ${m.spending}</title></rect>
      <text x="${gx}" y="${height - 8}" text-anchor="middle" class="axis-label">${m.month.replace(' 2026', '')}</text>`;
    })
    .join('');

  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Income versus spending, last six months" class="chart-svg">
    ${grid.join('')}
    <line x1="${padLeft}" y1="${padTop + plotH}" x2="${width - 8}" y2="${padTop + plotH}" class="axis-line"/>
    ${bars}
  </svg>`;
}

// A thin progress ring, e.g. savings rate. pct is 0–100.
export function ringChart(pctValue, size = 120, labelTop, labelBottom) {
  const radius = size / 2 - 9;
  const circumference = 2 * Math.PI * radius;
  const shown = Math.max(0, Math.min(100, pctValue));
  const dash = (shown / 100) * circumference;
  return `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="${labelTop} ${shown} percent" class="chart-svg">
    <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" class="ring-track"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" class="ring-fill"
      stroke-dasharray="${dash.toFixed(1)} ${circumference.toFixed(1)}"
      transform="rotate(-90 ${size / 2} ${size / 2})"/>
    <text x="${size / 2}" y="${size / 2 - 2}" text-anchor="middle" class="ring-center-top">${labelTop}</text>
    <text x="${size / 2}" y="${size / 2 + 16}" text-anchor="middle" class="ring-center-sub">${labelBottom}</text>
  </svg>`;
}
