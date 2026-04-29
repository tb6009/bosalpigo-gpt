import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../02_data");
const OUT_DIR = path.resolve(__dirname, "../05_final/visualizations");
fs.mkdirSync(OUT_DIR, { recursive: true });

const summary = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "analysis_summary.json"), "utf8"));
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "scenarios.json"), "utf8"));
const VERSIONS = cfg.versions;
const SCENARIOS = cfg.scenarios;

// Bosalpigo brand colors
const C = {
  v13: "#9CA3AF",   // gray (system: undefined)
  v14: "#D4A574",   // beige (마음·모미)
  v15: "#7C9885",   // sage green (4-character)
  bg: "#FAF8F4",    // warm cream
  ink: "#2C2A26",
  muted: "#6B6358",
  accent: "#E8B939", // 요기 yellow
  warn: "#C8553D",
};

const VC = { "v1.3": C.v13, "v1.4": C.v14, "v1.5": C.v15 };

// ─── Bar chart (grouped) ─────────────────────────────────────
function groupedBar({title, dims, key2label, max=5, height=300, width=720}) {
  const margin = { top: 30, right: 20, bottom: 80, left: 50 };
  const W = width - margin.left - margin.right;
  const H = height - margin.top - margin.bottom;
  const groups = dims.length;
  const groupW = W / groups;
  const barW = groupW * 0.25;
  const labels = ["v1.3","v1.4","v1.5"];
  const colors = labels.map(l => VC[l]);

  let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Pretendard', sans-serif" font-size="11">`;
  svg += `<text x="${width/2}" y="20" text-anchor="middle" font-size="14" font-weight="600" fill="${C.ink}">${title}</text>`;
  // Y axis grid + labels
  for (let v = 0; v <= max; v++) {
    const y = margin.top + H - (v/max)*H;
    svg += `<line x1="${margin.left}" y1="${y}" x2="${margin.left+W}" y2="${y}" stroke="#E5E1D8" stroke-width="0.5"/>`;
    svg += `<text x="${margin.left-8}" y="${y+3}" text-anchor="end" fill="${C.muted}">${v}</text>`;
  }
  // Bars
  dims.forEach((d, i) => {
    const x0 = margin.left + i*groupW + (groupW - 3*barW)/2;
    labels.forEach((label, j) => {
      const v = d.vals[j];
      const bh = (v/max) * H;
      const x = x0 + j*barW;
      const y = margin.top + H - bh;
      svg += `<rect x="${x}" y="${y}" width="${barW-2}" height="${bh}" fill="${colors[j]}" rx="2"/>`;
      svg += `<text x="${x+(barW-2)/2}" y="${y-3}" text-anchor="middle" font-size="9" fill="${C.ink}">${v.toFixed(2)}</text>`;
    });
    // X label
    svg += `<text x="${margin.left + i*groupW + groupW/2}" y="${margin.top+H+18}" text-anchor="middle" fill="${C.ink}" font-size="11" font-weight="500">${d.label}</text>`;
    if (d.subLabel) svg += `<text x="${margin.left + i*groupW + groupW/2}" y="${margin.top+H+32}" text-anchor="middle" fill="${C.muted}" font-size="9">${d.subLabel}</text>`;
  });
  // Legend
  const lx = margin.left;
  const ly = height - 18;
  labels.forEach((label, j) => {
    svg += `<rect x="${lx + j*100}" y="${ly}" width="12" height="12" fill="${colors[j]}" rx="2"/>`;
    svg += `<text x="${lx + j*100 + 18}" y="${ly+10}" fill="${C.ink}">${label}</text>`;
  });
  svg += `</svg>`;
  return svg;
}

// ─── Cohen's d horizontal forest ─────────────────────────────
function forestPlot({title, items, height=380, width=720}) {
  const margin = { top: 30, right: 30, bottom: 40, left: 200 };
  const W = width - margin.left - margin.right;
  const H = height - margin.top - margin.bottom;
  const n = items.length;
  const rowH = H / n;
  const dMax = 1.2; // x-axis range -1.2 to 1.2

  let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="11">`;
  svg += `<text x="${width/2}" y="20" text-anchor="middle" font-size="14" font-weight="600" fill="${C.ink}">${title}</text>`;
  // X axis grid
  const xZero = margin.left + W/2;
  for (let d = -dMax; d <= dMax; d += 0.4) {
    const x = margin.left + W/2 + (d/dMax)*(W/2);
    svg += `<line x1="${x}" y1="${margin.top}" x2="${x}" y2="${margin.top+H}" stroke="#E5E1D8" stroke-width="0.5"/>`;
    svg += `<text x="${x}" y="${margin.top+H+15}" text-anchor="middle" fill="${C.muted}" font-size="9">${d.toFixed(1)}</text>`;
  }
  svg += `<line x1="${xZero}" y1="${margin.top}" x2="${xZero}" y2="${margin.top+H}" stroke="${C.ink}" stroke-width="1"/>`;
  // Effect size bands
  svg += `<rect x="${margin.left + W/2 + (0.2/dMax)*(W/2)}" y="${margin.top}" width="${(0.3/dMax)*(W/2)}" height="${H}" fill="#FBF6E8" opacity="0.5"/>`;
  svg += `<rect x="${margin.left + W/2 + (0.5/dMax)*(W/2)}" y="${margin.top}" width="${(0.3/dMax)*(W/2)}" height="${H}" fill="#F5E5C7" opacity="0.5"/>`;
  svg += `<rect x="${margin.left + W/2 + (0.8/dMax)*(W/2)}" y="${margin.top}" width="${(0.4/dMax)*(W/2)}" height="${H}" fill="#E5C99B" opacity="0.5"/>`;
  // Items
  items.forEach((it, i) => {
    const y = margin.top + i*rowH + rowH/2;
    const cx = margin.left + W/2 + (it.d / dMax) * (W/2);
    const dotColor = it.d >= 0.8 ? C.warn : it.d >= 0.5 ? C.v14 : it.d >= 0.2 ? C.v15 : C.muted;
    // Label
    svg += `<text x="${margin.left - 8}" y="${y+3}" text-anchor="end" fill="${C.ink}" font-size="10">${it.label}</text>`;
    // Dot
    svg += `<circle cx="${cx}" cy="${y}" r="6" fill="${dotColor}"/>`;
    svg += `<text x="${cx + 10}" y="${y+3}" fill="${C.muted}" font-size="9">${it.d.toFixed(2)}</text>`;
  });
  // Legend
  const labels = [["trivial",C.muted],["small",C.v15],["medium",C.v14],["large",C.warn]];
  labels.forEach((l, j) => {
    const lx = margin.left + j*90;
    svg += `<circle cx="${lx+6}" cy="${height-12}" r="5" fill="${l[1]}"/>`;
    svg += `<text x="${lx+16}" y="${height-9}" fill="${C.ink}" font-size="10">${l[0]}</text>`;
  });
  svg += `</svg>`;
  return svg;
}

// ─── Stacked bar (horizontal) for character invocations ──────
function stackedBar({title, items, height=180, width=720}) {
  const margin = { top: 30, right: 20, bottom: 40, left: 60 };
  const W = width - margin.left - margin.right;
  const H = height - margin.top - margin.bottom;
  const rowH = H / items.length;
  const charColors = { 마음: "#7C9885", 모미: "#D4A574", 요기: "#E8B939", 숨이: "#4A7C59", "(없음)": "#CCC4B5" };

  let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, 'Pretendard', sans-serif" font-size="11">`;
  svg += `<text x="${width/2}" y="20" text-anchor="middle" font-size="14" font-weight="600" fill="${C.ink}">${title}</text>`;

  items.forEach((it, i) => {
    const y = margin.top + i*rowH + rowH*0.15;
    const bh = rowH * 0.7;
    let xCursor = margin.left;
    const labelKeys = ["마음","모미","요기","숨이","(없음)"];
    for (const k of labelKeys) {
      const r = it.rates[k] || 0;
      if (r === 0) continue;
      const w = r * W;
      svg += `<rect x="${xCursor}" y="${y}" width="${w}" height="${bh}" fill="${charColors[k]}" rx="0"/>`;
      if (r > 0.05) {
        svg += `<text x="${xCursor + w/2}" y="${y + bh/2 + 4}" text-anchor="middle" fill="white" font-size="10" font-weight="600">${k} ${(r*100).toFixed(0)}%</text>`;
      }
      xCursor += w;
    }
    svg += `<text x="${margin.left - 10}" y="${y + bh/2 + 4}" text-anchor="end" fill="${C.ink}" font-weight="600">${it.label}</text>`;
  });
  svg += `</svg>`;
  return svg;
}

// ─── Radar chart ─────────────────────────────────────────────
function radarChart({title, axes, datasets, max=5, size=480}) {
  const cx = size/2, cy = size/2 + 20;
  const radius = size * 0.36;
  const n = axes.length;
  let svg = `<svg viewBox="0 0 ${size} ${size+60}" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, 'Pretendard', sans-serif" font-size="11">`;
  svg += `<text x="${cx}" y="22" text-anchor="middle" font-size="15" font-weight="600" fill="${C.ink}">${title}</text>`;
  // Grid
  for (let g = 1; g <= 5; g++) {
    const r = radius * g/5;
    let pts = [];
    for (let i = 0; i < n; i++) {
      const a = -Math.PI/2 + i * 2*Math.PI/n;
      pts.push(`${cx + r*Math.cos(a)},${cy + r*Math.sin(a)}`);
    }
    svg += `<polygon points="${pts.join(" ")}" fill="none" stroke="#E5E1D8" stroke-width="0.5"/>`;
  }
  // Axis lines
  for (let i = 0; i < n; i++) {
    const a = -Math.PI/2 + i * 2*Math.PI/n;
    svg += `<line x1="${cx}" y1="${cy}" x2="${cx + radius*Math.cos(a)}" y2="${cy + radius*Math.sin(a)}" stroke="#D8D4C8" stroke-width="0.5"/>`;
    // Axis label
    const lx = cx + (radius+24)*Math.cos(a);
    const ly = cy + (radius+24)*Math.sin(a);
    svg += `<text x="${lx}" y="${ly+4}" text-anchor="middle" fill="${C.ink}" font-size="10" font-weight="500">${axes[i]}</text>`;
  }
  // Datasets
  datasets.forEach(ds => {
    let pts = [];
    for (let i = 0; i < n; i++) {
      const a = -Math.PI/2 + i * 2*Math.PI/n;
      const r = (ds.values[i]/max) * radius;
      pts.push(`${cx + r*Math.cos(a)},${cy + r*Math.sin(a)}`);
    }
    svg += `<polygon points="${pts.join(" ")}" fill="${ds.color}" fill-opacity="0.20" stroke="${ds.color}" stroke-width="2"/>`;
    // Dots
    for (let i = 0; i < n; i++) {
      const a = -Math.PI/2 + i * 2*Math.PI/n;
      const r = (ds.values[i]/max) * radius;
      svg += `<circle cx="${cx + r*Math.cos(a)}" cy="${cy + r*Math.sin(a)}" r="3" fill="${ds.color}"/>`;
    }
  });
  // Legend
  const legendY = size + 30;
  datasets.forEach((ds, j) => {
    const lx = 30 + j * 130;
    svg += `<line x1="${lx}" y1="${legendY}" x2="${lx+24}" y2="${legendY}" stroke="${ds.color}" stroke-width="3"/>`;
    svg += `<text x="${lx+30}" y="${legendY+4}" fill="${C.ink}" font-size="11">${ds.label}</text>`;
  });
  svg += `</svg>`;
  return svg;
}

// ─── Build dashboard ─────────────────────────────────────────
const ppsKeys = ["credibility","likability","similarity","empathy","willingness"];
const mitiKeys = ["cct","sst","partnership","empathy_mi"];
const safetyKeys = ["resource_mention","diagnostic_avoidance","toxic_reassurance_avoidance","triage_appropriateness"];

const ppsBar = groupedBar({
  title: "PPS-28 — 5 Dimensions × 3 Versions (means, 1–5 scale)",
  dims: ppsKeys.map(k => ({
    label: k.charAt(0).toUpperCase() + k.slice(1),
    vals: VERSIONS.map(v => summary.by_version[v].pps[k].mean),
  })),
  max: 5,
});

const mitiBar = groupedBar({
  title: "MITI 4.2.1 Global Scores × 3 Versions (means, 1–5 scale)",
  dims: mitiKeys.map(k => {
    const labels = { cct: "CCT", sst: "SST", partnership: "Partnership", empathy_mi: "Empathy (MI)" };
    return {
      label: labels[k] || k,
      vals: VERSIONS.map(v => summary.by_version[v].miti[k].mean),
    };
  }),
  max: 5,
});

const safetyBar = groupedBar({
  title: "Safety Composite × 3 Versions (binary→0–1, triage→1–5)",
  dims: [
    { label: "Resource", subLabel: "(0/1)", vals: VERSIONS.map(v => summary.by_version[v].safety.resource_mention.mean) },
    { label: "Dx Avoid", subLabel: "(0/1)", vals: VERSIONS.map(v => summary.by_version[v].safety.diagnostic_avoidance.mean) },
    { label: "Toxic Avoid", subLabel: "(0/1)", vals: VERSIONS.map(v => summary.by_version[v].safety.toxic_reassurance_avoidance.mean) },
    { label: "Triage", subLabel: "(1-5)", vals: VERSIONS.map(v => summary.by_version[v].safety.triage_appropriateness.mean) },
  ],
  max: 5,
});

// Cohen's d forest
const dItems = [];
for (const k of [...ppsKeys.map(k=>"pps_"+k), ...mitiKeys.map(k=>"miti_"+k), ...safetyKeys.map(k=>"safety_"+k)]) {
  const d = summary.cohenD_v14_v15[k];
  if (d == null || !Number.isFinite(d)) continue;
  dItems.push({ label: k.replace("_", "."), d });
}
const forest = forestPlot({ title: "Cohen's d (v1.5 − v1.4) — Effect Sizes", items: dItems });

// ANOVA F bar (single-version cross-sectional)
const anovaItems = Object.entries(summary.anova).filter(([_,v]) => Number.isFinite(v.F)).map(([k,v]) => ({ key: k, F: v.F }));
anovaItems.sort((a,b) => b.F - a.F);
const anovaBar = (() => {
  const margin = { top: 30, right: 30, bottom: 30, left: 220 };
  const width = 720, height = 400;
  const W = width - margin.left - margin.right;
  const H = height - margin.top - margin.bottom;
  const rowH = H / anovaItems.length;
  const Fmax = Math.log10(Math.max(...anovaItems.map(x=>x.F))+1);
  let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, 'Pretendard', sans-serif" font-size="11">`;
  svg += `<text x="${width/2}" y="20" text-anchor="middle" font-size="14" font-weight="600" fill="${C.ink}">ANOVA F-statistic by DV (log scale, df = 2, 237)</text>`;
  for (const ticks of [1,5,10,50,100,500,1000]) {
    const f = Math.log10(ticks+1);
    const x = margin.left + (f/Fmax)*W;
    if (x > margin.left + W) continue;
    svg += `<line x1="${x}" y1="${margin.top}" x2="${x}" y2="${margin.top+H}" stroke="#E5E1D8" stroke-width="0.5"/>`;
    svg += `<text x="${x}" y="${margin.top+H+15}" text-anchor="middle" fill="${C.muted}" font-size="9">${ticks}</text>`;
  }
  // p<.001 critical line at F=7.08
  const xCrit = margin.left + (Math.log10(7.08+1)/Fmax)*W;
  svg += `<line x1="${xCrit}" y1="${margin.top}" x2="${xCrit}" y2="${margin.top+H}" stroke="${C.warn}" stroke-width="1" stroke-dasharray="4,3"/>`;
  svg += `<text x="${xCrit+4}" y="${margin.top+12}" fill="${C.warn}" font-size="9">p&lt;.001 critical (F≈7.08)</text>`;

  anovaItems.forEach((it, i) => {
    const y = margin.top + i*rowH + rowH*0.15;
    const bh = rowH * 0.7;
    const w = (Math.log10(it.F+1)/Fmax)*W;
    svg += `<rect x="${margin.left}" y="${y}" width="${w}" height="${bh}" fill="${C.v15}" rx="2"/>`;
    svg += `<text x="${margin.left + w + 6}" y="${y + bh/2 + 4}" fill="${C.ink}" font-size="10" font-weight="500">${it.F.toFixed(1)}</text>`;
    svg += `<text x="${margin.left - 6}" y="${y + bh/2 + 4}" text-anchor="end" fill="${C.ink}" font-size="10">${it.key.replace("_",".")}</text>`;
  });
  svg += `</svg>`;
  return svg;
})();

// Character invocations stacked bar
const charBar = stackedBar({
  title: "Character Invocation Rate per Response (헤더/이모티콘 검출)",
  items: VERSIONS.map(v => {
    const r = summary.character_invocations[v].rates;
    const total = r.마음 + r.모미 + r.요기 + r.숨이;
    return { label: v, rates: { ...r, "(없음)": Math.max(0, 1 - total) } };
  }),
});

// Per-scenario bar charts (PPS Likability + Similarity, MITI cct, Safety triage)
function perScenarioBar(grp, dv, title, max=5) {
  const dims = SCENARIOS.map(s => ({
    label: s.id,
    subLabel: s.input.length > 18 ? s.input.slice(0,16)+"…" : s.input,
    vals: VERSIONS.map(v => summary.cells[v][s.id][grp][dv].mean),
  }));
  return groupedBar({ title, dims, max, height: 320 });
}

const perScenLikability = perScenarioBar("pps","likability","PPS Likability — per Scenario × Version");
const perScenSimilarity = perScenarioBar("pps","similarity","PPS Similarity — per Scenario × Version");
const perScenCct = perScenarioBar("miti","cct","MITI CCT — per Scenario × Version");
const perScenTriage = perScenarioBar("safety","triage_appropriateness","Safety Triage — per Scenario × Version");

// Radar chart
const radar = radarChart({
  title: "PPS-28 5-Dimension Profile — Final Synthesis",
  axes: ["Credibility","Likability","Similarity","Empathy","Willingness"],
  datasets: VERSIONS.map(v => ({
    label: v,
    color: VC[v],
    values: ppsKeys.map(k => summary.by_version[v].pps[k].mean),
  })),
  max: 5,
});

// MITI radar
const radarMiti = radarChart({
  title: "MITI 4.2.1 4-Dimension Profile",
  axes: ["CCT","SST","Partnership","Empathy_MI"],
  datasets: VERSIONS.map(v => ({
    label: v,
    color: VC[v],
    values: mitiKeys.map(k => summary.by_version[v].miti[k].mean),
  })),
  max: 5,
});

// ─── Compose HTML ────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bosalpigo v1.3-v1.5 평가 대시보드</title>
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Pretendard", sans-serif;
    background: ${C.bg};
    color: ${C.ink};
    margin: 0;
    line-height: 1.6;
  }
  .container { max-width: 880px; margin: 0 auto; padding: 40px 20px 80px; }
  h1 { font-size: 26px; font-weight: 700; margin-bottom: 8px; letter-spacing: -0.02em; }
  h2 { font-size: 19px; font-weight: 600; margin-top: 48px; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid ${C.ink}; letter-spacing: -0.01em; }
  h3 { font-size: 15px; font-weight: 600; margin-top: 24px; color: ${C.ink}; }
  .subtitle { color: ${C.muted}; font-size: 14px; margin-bottom: 32px; }
  .meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin: 24px 0; }
  .meta div { background: white; padding: 12px 16px; border-radius: 8px; border: 1px solid #E5E1D8; }
  .meta strong { display: block; font-size: 11px; color: ${C.muted}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
  .meta span { font-size: 18px; font-weight: 600; color: ${C.ink}; }
  .chart-wrap { background: white; padding: 16px 8px; border-radius: 12px; border: 1px solid #E5E1D8; margin: 16px 0; }
  .chart-wrap svg { display: block; max-width: 100%; height: auto; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; background: white; border-radius: 8px; overflow: hidden; }
  th, td { padding: 8px 10px; text-align: right; border-bottom: 1px solid #E5E1D8; }
  th:first-child, td:first-child { text-align: left; }
  thead { background: #F0EBE0; font-weight: 600; }
  .hyp { display: grid; grid-template-columns: 80px 1fr 80px; gap: 10px; padding: 12px 16px; background: white; margin: 8px 0; border-radius: 8px; border: 1px solid #E5E1D8; }
  .hyp .id { font-weight: 700; color: ${C.muted}; }
  .hyp .verdict { font-weight: 600; text-align: right; }
  .verdict.passed { color: #4A7C59; }
  .verdict.partial { color: ${C.accent}; }
  .verdict.failed { color: ${C.warn}; }
  .finding { padding: 16px 18px; background: white; border-left: 4px solid ${C.accent}; margin: 14px 0; border-radius: 4px; }
  .finding strong { display: block; font-size: 14px; margin-bottom: 4px; color: ${C.ink}; }
  .pill { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; background: #F0EBE0; color: ${C.ink}; margin-right: 4px; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #E5E1D8; color: ${C.muted}; font-size: 12px; }
</style>
</head>
<body>
<div class="container">
  <h1>보살피고 v1.3 → v1.4 → v1.5β 학술적 평가 대시보드</h1>
  <p class="subtitle">DSAPG (Salminen 2020 PPS · Moyers 2016 MITI · Argyle 2023 silicon sampling) 방법론 적용 · ${summary.total_records} valid score records · ${new Date(summary.generated_at).toLocaleString("ko-KR",{timeZone:"Asia/Seoul"})}</p>

  <div class="meta">
    <div><strong>Total Responses</strong><span>240</span></div>
    <div><strong>Valid Scores</strong><span>240/240</span></div>
    <div><strong>Versions</strong><span>3</span></div>
    <div><strong>Scenarios</strong><span>8</span></div>
    <div><strong>Reps per cell</strong><span>10</span></div>
    <div><strong>Responder</strong><span>Sonnet 4.6</span></div>
    <div><strong>Judge</strong><span>Opus 4.7</span></div>
    <div><strong>Outliers</strong><span>0</span></div>
    <div><strong>Prompt leakage</strong><span>0%</span></div>
  </div>

  <h2>1. 가설 검증 결과</h2>
  <div class="hyp"><span class="id">H1</span><span>v1.5β &gt; v1.4 &gt; v1.3 in MITI Cultivating Change Talk (MI 정교화)</span><span class="verdict passed">✅ 지지</span></div>
  <div class="hyp"><span class="id">H2</span><span>v1.5β &gt; v1.4 in Safety Composite (위기 프로토콜)</span><span class="verdict partial">🟡 부분</span></div>
  <div class="hyp"><span class="id">H3</span><span>v1.4 &gt; v1.3 in PPS Likability (톤 회복)</span><span class="verdict passed">✅ 지지</span></div>
  <div class="hyp"><span class="id">H4</span><span>v1.5β ≈ v1.4 in PPS Similarity (캐릭터 동등성)</span><span class="verdict passed">✅ 동등성 지지</span></div>

  <h2>2. ANOVA F-statistic 한눈에</h2>
  <div class="chart-wrap">${anovaBar}</div>
  <p class="subtitle">대수 스케일. 빨간 점선은 p&lt;.001 임계값. PPS Similarity F=869는 시스템 프롬프트 전달 여부 효과 — 사회과학에서 보기 드문 거대 효과.</p>

  <h2>3. PPS-28 — 5 차원 비교 (그룹 막대)</h2>
  <div class="chart-wrap">${ppsBar}</div>

  <h2>4. MITI 4.2.1 — 4 글로벌 점수</h2>
  <div class="chart-wrap">${mitiBar}</div>

  <h2>5. Safety Composite — 4 항목</h2>
  <div class="chart-wrap">${safetyBar}</div>
  <p class="subtitle">Resource Mention(위기 자원 안내)는 모든 버전에서 매우 낮음. v1.5에서도 6%만. 시스템 프롬프트 패치 권장 영역.</p>

  <h2>6. Cohen's d — v1.5 vs v1.4 효과 크기</h2>
  <div class="chart-wrap">${forest}</div>
  <p class="subtitle">노란 영역 = small (0.2), 진한 영역 = medium (0.5), 가장 진한 영역 = large (0.8). v1.5 → v1.4 전환에서 Credibility, Empathy, Willingness, MITI CCT가 medium effect.</p>

  <h2>7. 캐릭터 등장률 (응답 텍스트 검출)</h2>
  <div class="chart-wrap">${charBar}</div>
  <p class="subtitle">v1.3 = 캐릭터 0% (system prompt 미전달 — production bug 효과). v1.4 = 듀오 99~100%. v1.5 = 마음 86% + 숨이 14%, 모미·요기 0%.</p>

  <h2>8. 시나리오별 — PPS Likability</h2>
  <div class="chart-wrap">${perScenLikability}</div>

  <h2>9. 시나리오별 — PPS Similarity</h2>
  <div class="chart-wrap">${perScenSimilarity}</div>

  <h2>10. 시나리오별 — MITI Cultivating Change Talk</h2>
  <div class="chart-wrap">${perScenCct}</div>

  <h2>11. 시나리오별 — Safety Triage</h2>
  <div class="chart-wrap">${perScenTriage}</div>

  <h2>12. 종합 — PPS Profile (Radar)</h2>
  <div class="chart-wrap">${radar}</div>
  <p class="subtitle">v1.3(회색) 대비 v1.4·v1.5는 모든 PPS 차원에서 큰 폭 개선. v1.5는 Credibility·Empathy·Willingness에서 v1.4를 넘음.</p>

  <h2>13. MITI Profile (Radar)</h2>
  <div class="chart-wrap">${radarMiti}</div>
  <p class="subtitle">MITI 4 차원 모두 v1.5가 최고. CCT(변화 대화 유발)에서 v1.5의 우위가 가장 두드러짐 — H1 가설의 정성적 시각화.</p>

  <h2>14. 핵심 발견 4가지</h2>
  <div class="finding">
    <strong>1. PPS Similarity F=869 — System Prompt 효과의 정량 증거</strong>
    v1.3은 production bug로 system prompt가 LLM에 전달되지 않음. 결과적으로 PPS Similarity = 1.68 (v1.4·v1.5의 4.6 대비 압도적 격차). 사회과학에서 보기 드문 거대 효과.
  </div>
  <div class="finding">
    <strong>2. Credibility 패러독스 — v1.4 < v1.3 < v1.5</strong>
    v1.4의 "재미가 기본값" 톤이 신뢰성 인식 살짝 약화. v1.5가 4-캐릭터 + 측정 도구 전문성으로 회복. Cohen's d (v1.5 vs v1.4) = 0.70 (medium).
  </div>
  <div class="finding">
    <strong>3. v1.5 캐릭터 라우팅 비대칭</strong>
    S5 자살 키워드 → 숨이 등장 100% (완벽). S8 트라우마 단서 → 숨이 등장 10% (90% 마음 처리). 키워드 매칭은 강하나 의미 추론 라우팅은 불안정.
  </div>
  <div class="finding">
    <strong>4. 모미·요기 미등장 — 시나리오 커버리지 한계</strong>
    v1.5는 4-캐릭터 시스템이지만 8개 시나리오에서 사실상 2-캐릭터(마음+위기 시 숨이). 신체·운동 영역(S9~S12) 후속 연구 필요.
  </div>

  <h2>15. 모든 데이터 — 13 차원 × 3 버전 평균</h2>
  <table>
    <thead><tr><th>Dimension</th><th>v1.3</th><th>v1.4</th><th>v1.5</th><th>F(2,237)</th></tr></thead>
    <tbody>
      ${[
        ["pps","credibility"],["pps","likability"],["pps","similarity"],["pps","empathy"],["pps","willingness"],
        ["miti","cct"],["miti","sst"],["miti","partnership"],["miti","empathy_mi"],
        ["safety","resource_mention"],["safety","diagnostic_avoidance"],["safety","toxic_reassurance_avoidance"],["safety","triage_appropriateness"],
      ].map(([g,k]) => {
        const a = summary.anova[`${g}_${k}`];
        return `<tr><td>${g}.${k}</td>${VERSIONS.map(v => `<td>${summary.by_version[v][g][k].mean.toFixed(2)}</td>`).join("")}<td>${Number.isFinite(a.F)?a.F.toFixed(1):"N/A"}</td></tr>`;
      }).join("\n      ")}
    </tbody>
  </table>

  <div class="footer">
    Bosalpigo v1.3-v1.5 Evaluation · Park, J. (2026) · Generated ${summary.generated_at}
  </div>
</div>
</body>
</html>`;

const outPath = path.join(OUT_DIR, "dashboard.html");
fs.writeFileSync(outPath, html);
console.log(`✅ wrote ${path.relative(process.cwd(), outPath)}`);
console.log(`   ${(html.length/1024).toFixed(1)} KB`);
