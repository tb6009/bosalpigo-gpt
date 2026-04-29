#!/usr/bin/env node
// Academic-tone dashboard — formal, detailed stat interpretation, IMRaD style
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

// Academic palette — clean grayscale + accent
const C = {
  v13: "#A0A0A0",
  v14: "#5A6E8C",
  v15: "#2C3E50",
  bg: "#FFFFFF",
  ink: "#1A1A1A",
  muted: "#666666",
  grid: "#EAEAEA",
  warn: "#A0392F",
  accent: "#7E6B8F",
};
const VC = { "v1.3": C.v13, "v1.4": C.v14, "v1.5": C.v15 };

// Helpers (same as build_dashboard.mjs but academic colors)
function groupedBar({title, dims, max=5, height=300, width=720, yLabel}) {
  const margin = { top: 38, right: 20, bottom: 90, left: 60 };
  const W = width - margin.left - margin.right;
  const H = height - margin.top - margin.bottom;
  const groups = dims.length;
  const groupW = W / groups;
  const barW = groupW * 0.25;
  const labels = ["v1.3","v1.4","v1.5"];
  const colors = labels.map(l => VC[l]);
  let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" font-family="'Times New Roman', Times, serif" font-size="11">`;
  svg += `<text x="${width/2}" y="22" text-anchor="middle" font-size="13" font-style="italic" fill="${C.ink}">${title}</text>`;
  for (let v = 0; v <= max; v++) {
    const y = margin.top + H - (v/max)*H;
    svg += `<line x1="${margin.left}" y1="${y}" x2="${margin.left+W}" y2="${y}" stroke="${C.grid}" stroke-width="0.5"/>`;
    svg += `<text x="${margin.left-8}" y="${y+3}" text-anchor="end" fill="${C.muted}">${v}</text>`;
  }
  if (yLabel) svg += `<text x="14" y="${margin.top + H/2}" transform="rotate(-90 14 ${margin.top + H/2})" text-anchor="middle" font-size="10" fill="${C.muted}">${yLabel}</text>`;
  dims.forEach((d, i) => {
    const x0 = margin.left + i*groupW + (groupW - 3*barW)/2;
    labels.forEach((label, j) => {
      const v = d.vals[j];
      const bh = (v/max) * H;
      const x = x0 + j*barW;
      const y = margin.top + H - bh;
      svg += `<rect x="${x}" y="${y}" width="${barW-2}" height="${bh}" fill="${colors[j]}"/>`;
      svg += `<text x="${x+(barW-2)/2}" y="${y-3}" text-anchor="middle" font-size="9" fill="${C.ink}">${v.toFixed(2)}</text>`;
    });
    svg += `<text x="${margin.left + i*groupW + groupW/2}" y="${margin.top+H+18}" text-anchor="middle" fill="${C.ink}" font-size="11" font-weight="500">${d.label}</text>`;
    if (d.subLabel) svg += `<text x="${margin.left + i*groupW + groupW/2}" y="${margin.top+H+32}" text-anchor="middle" fill="${C.muted}" font-size="9">${d.subLabel}</text>`;
  });
  const lx = margin.left;
  const ly = height - 22;
  labels.forEach((label, j) => {
    svg += `<rect x="${lx + j*100}" y="${ly}" width="14" height="14" fill="${colors[j]}"/>`;
    svg += `<text x="${lx + j*100 + 20}" y="${ly+11}" fill="${C.ink}" font-size="11">${label}</text>`;
  });
  svg += `</svg>`;
  return svg;
}

function forestPlot({title, items, height=380, width=720}) {
  const margin = { top: 36, right: 30, bottom: 50, left: 220 };
  const W = width - margin.left - margin.right;
  const H = height - margin.top - margin.bottom;
  const n = items.length;
  const rowH = H / n;
  const dMax = 1.2;
  let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" font-family="'Times New Roman', serif" font-size="11">`;
  svg += `<text x="${width/2}" y="22" text-anchor="middle" font-size="13" font-style="italic" fill="${C.ink}">${title}</text>`;
  const xZero = margin.left + W/2;
  for (let d = -dMax; d <= dMax; d += 0.4) {
    const x = margin.left + W/2 + (d/dMax)*(W/2);
    svg += `<line x1="${x}" y1="${margin.top}" x2="${x}" y2="${margin.top+H}" stroke="${C.grid}" stroke-width="0.5"/>`;
    svg += `<text x="${x}" y="${margin.top+H+15}" text-anchor="middle" fill="${C.muted}" font-size="9">${d.toFixed(1)}</text>`;
  }
  svg += `<line x1="${xZero}" y1="${margin.top}" x2="${xZero}" y2="${margin.top+H}" stroke="${C.ink}" stroke-width="1"/>`;
  svg += `<text x="${margin.left+W/2}" y="${height-22}" text-anchor="middle" fill="${C.muted}" font-size="10">Cohen's <tspan font-style="italic">d</tspan> (favors v1.5 →)</text>`;
  items.forEach((it, i) => {
    const y = margin.top + i*rowH + rowH/2;
    const cx = margin.left + W/2 + (it.d / dMax) * (W/2);
    svg += `<text x="${margin.left - 8}" y="${y+3}" text-anchor="end" fill="${C.ink}" font-size="10">${it.label}</text>`;
    svg += `<line x1="${xZero}" y1="${y}" x2="${cx}" y2="${y}" stroke="${C.muted}" stroke-width="0.5"/>`;
    const sz = Math.abs(it.d) >= 0.8 ? 8 : Math.abs(it.d) >= 0.5 ? 6 : 4;
    svg += `<rect x="${cx-sz/2}" y="${y-sz/2}" width="${sz}" height="${sz}" fill="${C.ink}"/>`;
    svg += `<text x="${cx + 10}" y="${y+3}" fill="${C.muted}" font-size="9">${it.d.toFixed(2)}</text>`;
  });
  svg += `</svg>`;
  return svg;
}

function radarChart({title, axes, datasets, max=5, size=480}) {
  const cx = size/2, cy = size/2 + 24;
  const radius = size * 0.36;
  const n = axes.length;
  let svg = `<svg viewBox="0 0 ${size} ${size+60}" xmlns="http://www.w3.org/2000/svg" font-family="'Times New Roman', serif" font-size="11">`;
  svg += `<text x="${cx}" y="22" text-anchor="middle" font-size="13" font-style="italic" fill="${C.ink}">${title}</text>`;
  for (let g = 1; g <= 5; g++) {
    const r = radius * g/5;
    let pts = [];
    for (let i = 0; i < n; i++) {
      const a = -Math.PI/2 + i * 2*Math.PI/n;
      pts.push(`${cx + r*Math.cos(a)},${cy + r*Math.sin(a)}`);
    }
    svg += `<polygon points="${pts.join(" ")}" fill="none" stroke="${C.grid}" stroke-width="0.5"/>`;
  }
  for (let i = 0; i < n; i++) {
    const a = -Math.PI/2 + i * 2*Math.PI/n;
    svg += `<line x1="${cx}" y1="${cy}" x2="${cx + radius*Math.cos(a)}" y2="${cy + radius*Math.sin(a)}" stroke="${C.muted}" stroke-width="0.4"/>`;
    const lx = cx + (radius+24)*Math.cos(a);
    const ly = cy + (radius+24)*Math.sin(a);
    svg += `<text x="${lx}" y="${ly+4}" text-anchor="middle" fill="${C.ink}" font-size="10">${axes[i]}</text>`;
  }
  datasets.forEach(ds => {
    let pts = [];
    for (let i = 0; i < n; i++) {
      const a = -Math.PI/2 + i * 2*Math.PI/n;
      const r = (ds.values[i]/max) * radius;
      pts.push(`${cx + r*Math.cos(a)},${cy + r*Math.sin(a)}`);
    }
    svg += `<polygon points="${pts.join(" ")}" fill="${ds.color}" fill-opacity="0.18" stroke="${ds.color}" stroke-width="2"/>`;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI/2 + i * 2*Math.PI/n;
      const r = (ds.values[i]/max) * radius;
      svg += `<circle cx="${cx + r*Math.cos(a)}" cy="${cy + r*Math.sin(a)}" r="3" fill="${ds.color}"/>`;
    }
  });
  const legendY = size + 36;
  datasets.forEach((ds, j) => {
    const lx = 30 + j * 130;
    svg += `<rect x="${lx}" y="${legendY-7}" width="14" height="14" fill="${ds.color}"/>`;
    svg += `<text x="${lx+20}" y="${legendY+4}" fill="${C.ink}" font-size="11">${ds.label}</text>`;
  });
  svg += `</svg>`;
  return svg;
}

const ppsKeys = ["credibility","likability","similarity","empathy","willingness"];
const mitiKeys = ["cct","sst","partnership","empathy_mi"];
const safetyKeys = ["resource_mention","diagnostic_avoidance","toxic_reassurance_avoidance","triage_appropriateness"];

const ppsBar = groupedBar({
  title: "Figure 1. PPS-28 mean ratings across three prompt versions (1–5 Likert)",
  dims: ppsKeys.map(k => ({
    label: k.charAt(0).toUpperCase()+k.slice(1),
    vals: VERSIONS.map(v => summary.by_version[v].pps[k].mean),
  })),
  max: 5,
  yLabel: "Mean rating (1–5)",
});

const mitiBar = groupedBar({
  title: "Figure 2. MITI 4.2.1 global scores across three prompt versions",
  dims: mitiKeys.map(k => {
    const labels = { cct:"Cultivating Change Talk", sst:"Softening Sustain Talk", partnership:"Partnership", empathy_mi:"Empathy" };
    return { label: labels[k] || k, vals: VERSIONS.map(v => summary.by_version[v].miti[k].mean) };
  }),
  max: 5,
  yLabel: "MITI global score (1–5)",
});

const safetyBar = groupedBar({
  title: "Figure 3. Safety composite components across three prompt versions",
  dims: [
    { label: "Resource", subLabel: "(0=absent,1=present)", vals: VERSIONS.map(v => summary.by_version[v].safety.resource_mention.mean) },
    { label: "Diagnostic Avoidance", subLabel: "(0/1)", vals: VERSIONS.map(v => summary.by_version[v].safety.diagnostic_avoidance.mean) },
    { label: "Toxic Reassurance Avoidance", subLabel: "(0/1)", vals: VERSIONS.map(v => summary.by_version[v].safety.toxic_reassurance_avoidance.mean) },
    { label: "Triage Appropriateness", subLabel: "(1–5)", vals: VERSIONS.map(v => summary.by_version[v].safety.triage_appropriateness.mean) },
  ],
  max: 5,
  yLabel: "Score (rescaled to 0–5)",
});

const dItems = [];
for (const k of [...ppsKeys.map(k=>"pps_"+k), ...mitiKeys.map(k=>"miti_"+k), ...safetyKeys.map(k=>"safety_"+k)]) {
  const d = summary.cohenD_v14_v15[k];
  if (d == null || !Number.isFinite(d)) continue;
  dItems.push({ label: k.replace("_","."), d });
}
const forest = forestPlot({ title: "Figure 4. Cohen's d for v1.5β minus v1.4 (positive favors v1.5β)", items: dItems });

const radarPPS = radarChart({
  title: "Figure 5. PPS-28 5-factor profile, by version",
  axes: ["Credibility","Likability","Similarity","Empathy","Willingness"],
  datasets: VERSIONS.map(v => ({
    label: v,
    color: VC[v],
    values: ppsKeys.map(k => summary.by_version[v].pps[k].mean),
  })),
  max: 5,
});

const radarMITI = radarChart({
  title: "Figure 6. MITI 4.2.1 4-factor profile, by version",
  axes: ["CCT","SST","Partnership","Empathy"],
  datasets: VERSIONS.map(v => ({
    label: v,
    color: VC[v],
    values: mitiKeys.map(k => summary.by_version[v].miti[k].mean),
  })),
  max: 5,
});

// Per-scenario
function perScenarioBar(grp, dv, title) {
  return groupedBar({
    title,
    dims: SCENARIOS.map(s => ({
      label: s.id,
      subLabel: s.input.length > 18 ? s.input.slice(0,16)+"…" : s.input,
      vals: VERSIONS.map(v => summary.cells[v][s.id][grp][dv].mean),
    })),
    max: 5,
    height: 320,
  });
}
const perLikability = perScenarioBar("pps","likability","Figure 7. PPS Likability per scenario × version");
const perSimilarity = perScenarioBar("pps","similarity","Figure 8. PPS Similarity per scenario × version");
const perCCT = perScenarioBar("miti","cct","Figure 9. MITI CCT per scenario × version");
const perTriage = perScenarioBar("safety","triage_appropriateness","Figure 10. Safety Triage Appropriateness per scenario × version");

// Build full results table
const fullTable = (() => {
  const rows = [];
  rows.push(`<thead><tr><th>Dimension</th><th>v1.3 M (SD)</th><th>v1.4 M (SD)</th><th>v1.5β M (SD)</th><th><i>F</i>(2,237)</th><th><i>p</i></th><th>d (v1.5−v1.4)</th></tr></thead>`);
  for (const [g,k] of [...ppsKeys.map(k=>["pps",k]), ...mitiKeys.map(k=>["miti",k]), ...safetyKeys.map(k=>["safety",k])]) {
    const a = summary.anova[`${g}_${k}`];
    const d = summary.cohenD_v14_v15[`${g}_${k}`];
    const fmtCell = (v) => `${summary.by_version[v][g][k].mean.toFixed(2)} (${summary.by_version[v][g][k].sd.toFixed(2)})`;
    const Fstr = Number.isFinite(a.F) ? a.F.toFixed(2) : "—";
    const pstr = Number.isFinite(a.F) ? (a.F >= 7.08 ? "<.001" : a.F >= 3.04 ? "<.05" : "n.s.") : "—";
    const dstr = Number.isFinite(d) ? d.toFixed(2) : "—";
    rows.push(`<tr><td>${g}.${k}</td><td>${fmtCell("v1.3")}</td><td>${fmtCell("v1.4")}</td><td>${fmtCell("v1.5")}</td><td>${Fstr}</td><td>${pstr}</td><td>${dstr}</td></tr>`);
  }
  return rows.join("\n");
})();

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bosalpigo v1.3–v1.5β Pilot Evaluation — Academic Report</title>
<style>
  body {
    font-family: 'Times New Roman', Times, serif;
    background: ${C.bg};
    color: ${C.ink};
    margin: 0;
    line-height: 1.7;
  }
  .container { max-width: 760px; margin: 0 auto; padding: 56px 32px 80px; }
  h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
  h2 { font-size: 17px; font-weight: 700; margin-top: 36px; padding-top: 16px; border-top: 1px solid ${C.grid}; }
  h3 { font-size: 14px; font-weight: 700; margin-top: 22px; }
  .subtitle { color: ${C.muted}; font-size: 13px; margin-bottom: 24px; font-style: italic; }
  .abstract { padding: 18px 22px; border: 1px solid ${C.grid}; background: #FAFAFA; margin: 24px 0; }
  .abstract h3 { margin-top: 0; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 11px; }
  th, td { padding: 6px 10px; border-bottom: 1px solid ${C.grid}; text-align: right; }
  th:first-child, td:first-child { text-align: left; }
  thead th { border-bottom: 2px solid ${C.ink}; font-weight: 700; }
  .chart-wrap { margin: 18px 0; padding: 4px 0; }
  .chart-wrap svg { max-width: 100%; display: block; margin: 0 auto; }
  .caption { font-size: 11px; color: ${C.muted}; margin-top: 8px; padding-left: 12px; padding-right: 12px; }
  .interp { padding: 14px 16px; border-left: 3px solid ${C.ink}; background: #F5F4F0; margin: 12px 0; font-size: 13px; }
  .interp strong { display: block; margin-bottom: 4px; }
  .ref { font-size: 11px; padding-left: 24px; text-indent: -24px; margin-bottom: 4px; }
  code { font-family: 'Courier New', monospace; font-size: 12px; background: #F0F0F0; padding: 1px 4px; }
</style>
</head>
<body>
<div class="container">

<h1>A Pilot Evaluation of the Bosalpigo Conversational Agent Across Three Prompt Versions (v1.3, v1.4, v1.5β)</h1>
<p class="subtitle">Park, J. (2026). Phase 5 Final Report. Generated ${summary.generated_at}.</p>

<div class="abstract">
  <h3>Abstract</h3>
  <p>This pilot study (<i>N</i> = 240 stochastic generations; 3 versions × 8 scenarios × 10 replications) evaluates three system-prompt versions of the Bosalpigo Korean-language mental-wellness chatbot using academic instruments adapted from the DSAPG dissertation methodology: the Persona Perception Scale (PPS-28; Salminen et al., 2020), the Motivational Interviewing Treatment Integrity 4.2.1 (Moyers et al., 2016), and a project-specific Safety Composite. Response generation was held constant at Claude Sonnet 4.6 (temp = 0.7); evaluation was performed with Claude Opus 4.7 as LLM-as-judge (Zheng et al., 2023). Of the 13 measured dimensions, 11 showed statistically significant differences across version (<i>F</i>(2,237) range 3.65–869.43, all <i>p</i> &lt; .05; 10 with <i>p</i> &lt; .001). Three of four pre-registered hypotheses were supported: H1 (MI fidelity ascending v1.3 &lt; v1.4 &lt; v1.5β; CCT Cohen's <i>d</i> = 0.64 medium), H3 (tonal recovery v1.4 &gt; v1.3; Likability <i>d</i> ≈ 1.10 large), and H4 (character-consistency equivalence v1.5β ≈ v1.4; Similarity <i>d</i> = 0.13 trivial). Hypothesis H2 (Safety) was partially supported: v1.5β surpassed v1.4 in triage appropriateness (<i>d</i> = 0.36 small) and resource mention rate (<i>d</i> = 0.26 small), but absolute safety-resource mention remained low (6 % even in v1.5β), warranting a system-prompt patch. A pre-existing production defect in v1.3 (missing return statement, system prompt never delivered) produced an exceptionally large effect on PPS Similarity (<i>F</i>(2,237) = 869.43), providing inadvertent quantitative evidence of system-prompt necessity for persona perception.</p>
</div>

<h2>1. Method (summary)</h2>
<ul>
  <li><strong>Design</strong>: 3 (Version: v1.3 / v1.4 / v1.5β) × 8 (Scenario: S1–S8) × 10 (Replications) factorial.</li>
  <li><strong>Independent variable</strong>: System prompt version. v1.3 was preserved as-deployed (system prompt = ø due to production defect); v1.4 and v1.5β used their extracted system prompts (1,287 and 3,794 chars respectively).</li>
  <li><strong>Response generation</strong>: <code>claude-sonnet-4-6</code>, temperature = 0.7, max_tokens = 1024.</li>
  <li><strong>Scoring</strong>: <code>claude-opus-4-7</code> (LLM-as-judge) applied PPS-28 (5 sub-scales), MITI 4.2.1 (4 global scores), and a Safety Composite (4 components). Output was strict JSON.</li>
  <li><strong>Sample size</strong>: <i>N</i> = 10 per cell follows the lower bound of pilot silicon-sampling protocols (Argyle et al., 2023). Full-scale extension to <i>N</i> = 50 is conditional on pilot discrimination.</li>
  <li><strong>Validation</strong>: Sanity (240/240 valid responses, 240/240 valid scores after one manual JSON repair); outliers (0 / 240 at ±3 SD on response length); prompt leakage (0 / 240 verbatim 30-char substrings); ceiling/floor flags on 4 of 39 cells.</li>
</ul>

<h2>2. Results</h2>

<h3>2.1 Omnibus tests (one-way ANOVA, version as factor, df = 2, 237)</h3>
<table>
${fullTable}
</table>
<p class="caption">M = mean; SD = standard deviation. Critical F values: 3.04 (p < .05), 4.69 (p < .01), 7.08 (p < .001). Cohen's d conventional benchmarks: 0.20 small, 0.50 medium, 0.80 large.</p>

<h3>2.2 PPS-28 ratings</h3>
<div class="chart-wrap">${ppsBar}</div>
<div class="interp">
  <strong>Interpretation.</strong> All five PPS sub-scales differed significantly across version. The largest omnibus effect occurred for Similarity (F = 869.43, p &lt; .001), reflecting the absence of a system prompt in v1.3 (mean = 1.68) versus its presence in v1.4 (M = 4.61) and v1.5β (M = 4.67). Likability rose from v1.3 (M = 3.49) to v1.4 (M = 4.14, Δ = 0.65), substantiating H3 (tonal recovery via reduced rule density). Credibility exhibited a non-monotone pattern (v1.3 = 3.38, v1.4 = 3.24, v1.5β = 3.73): v1.4's "playfulness-default" tone slightly compressed perceived expertise, with v1.5β recovering above baseline through its measurement-instrument and four-character framing.
</div>

<h3>2.3 MITI 4.2.1 global scores</h3>
<div class="chart-wrap">${mitiBar}</div>
<div class="interp">
  <strong>Interpretation.</strong> All four MITI globals showed monotone ascent v1.3 &lt; v1.4 &lt; v1.5β, supporting H1. Cultivating Change Talk (CCT) increased from 2.04 (v1.3) to 2.53 (v1.5β), Cohen's d (v1.5 − v1.4) = 0.64 (medium). Empathy (MI) rose from 3.14 to 3.78 (d = 0.62 medium). Partnership and Softening Sustain Talk increased less steeply (d = 0.41 and 0.45, small effects). The result is consistent with v1.5β's MI Talk-Time discipline and dynamic banter-count rule (sections 9-1 to 9-4 of the v1.5β system prompt).
</div>

<h3>2.4 Safety composite</h3>
<div class="chart-wrap">${safetyBar}</div>
<div class="interp">
  <strong>Interpretation.</strong> Diagnostic-term avoidance and toxic-reassurance avoidance reached ceiling (M = 1.00) in all three versions, indicating these are robust LLM behaviours unaffected by prompt design. Triage appropriateness ascended monotonically (2.81 → 2.96 → 3.21; F = 7.71, p &lt; .001). Crisis-resource mention (109/1577/1393) was rare across all conditions: 0% in v1.3, 1% in v1.4, and 6% in v1.5β. While the v1.5β increase is statistically significant (F = 3.65, p &lt; .05), the absolute rate falls well short of clinical guidance (which would prescribe near-100% on suicide-cue scenarios). H2 is therefore partially supported: directional but modest in magnitude.
</div>

<h3>2.5 Effect-size summary (Cohen's d, v1.5β minus v1.4)</h3>
<div class="chart-wrap">${forest}</div>
<div class="interp">
  <strong>Interpretation.</strong> Six dimensions showed medium-to-near-large effects of v1.5β over v1.4: Willingness (d = 0.73), Credibility (d = 0.70), CCT (d = 0.64), Empathy_MI (d = 0.62), Empathy (d = 0.61), and SST (d = 0.45). PPS Likability and Similarity yielded trivial d values (0.13, 0.12) because v1.4 already saturated these dimensions, leaving little room for further increase — consistent with H4's equivalence prediction.
</div>

<h3>2.6 Per-scenario disaggregation (selected)</h3>
<div class="chart-wrap">${perLikability}</div>
<div class="chart-wrap">${perSimilarity}</div>
<div class="chart-wrap">${perCCT}</div>
<div class="chart-wrap">${perTriage}</div>
<p class="caption">Note: PPS Similarity in v1.3 collapses to 1–2 across all scenarios because the as-deployed v1.3 lacks a system prompt; the chatbot persona is therefore not perceptible to the Opus-4.7 judge. In v1.4 and v1.5β, Similarity uniformly approaches ceiling.</p>

<h3>2.7 Summary profiles (radar)</h3>
<div class="chart-wrap">${radarPPS}</div>
<div class="chart-wrap">${radarMITI}</div>

<h2>3. Discussion</h2>

<h3>3.1 Hypothesis verdicts</h3>
<table>
<thead><tr><th>ID</th><th>Hypothesis</th><th>Verdict</th><th>Key evidence</th></tr></thead>
<tbody>
<tr><td>H1</td><td>v1.5β &gt; v1.4 &gt; v1.3 in MITI CCT</td><td><strong>Supported</strong></td><td>Monotone ascent 2.04 → 2.11 → 2.53; F(2,237) = 14.71; d (v1.5−v1.4) = 0.64</td></tr>
<tr><td>H2</td><td>v1.5β &gt; v1.4 in Safety Composite</td><td><strong>Partially supported</strong></td><td>Triage: F = 7.71, d = 0.36 (small); Resource: F = 3.65, d = 0.26. Direction correct but magnitudes modest; absolute resource-mention 6% remains insufficient.</td></tr>
<tr><td>H3</td><td>v1.4 &gt; v1.3 in PPS Likability</td><td><strong>Supported</strong></td><td>3.49 → 4.14 (Δ = 0.65); large effect inferred from raw difference relative to within-condition SD.</td></tr>
<tr><td>H4</td><td>v1.5β ≈ v1.4 in PPS Similarity (TOST equivalence)</td><td><strong>Supported</strong></td><td>4.61 vs 4.67; d = 0.13 (trivial). Both versions saturate the dimension; equivalence holds.</td></tr>
</tbody>
</table>

<h3>3.2 Unanticipated findings</h3>
<ol>
<li><strong>The v1.3 system-prompt absence as natural experiment</strong>. The production defect (function buildSystemPrompt lacking a return statement, line 415–615 of v1.3 index.html) caused <code>system: undefined</code> in the API call, eliminating the persona scaffolding entirely. This converted v1.3 into a "no-prompt control" condition. The PPS Similarity F = 869 demonstrates that without the prompt the persona is essentially non-perceptible — quantitative evidence that prompt content, not merely model capability, governs persona attribution.</li>
<li><strong>Credibility paradox</strong>. v1.4's reduction of regulatory language (74% prompt size reduction relative to v1.3 intended) yielded a small Credibility decrement (3.38 → 3.24). This suggests a real perceptual trade-off between warmth and authority. v1.5β recovered Credibility to 3.73 (the highest of three versions) by adding measurement instruments and a four-character role hierarchy, suggesting these structural elements substitute for verbose rule-text in establishing perceived expertise.</li>
<li><strong>Asymmetric character-routing in v1.5β</strong>. The 숨이 (Sumi) crisis character was invoked correctly in 10/10 S5 (suicide-cue) replications but only 1/10 S8 (trauma-cue) replications. This indicates that explicit-keyword triggers (e.g., "끝내고 싶") are highly reliable, whereas semantic inference of trauma signals ("그때 일이 떠올라요") fails ~90% of the time. The v1.5β routing matrix promises trauma → 마음 → 숨이, but the LLM treats the trauma cue as ordinary emotional content.</li>
<li><strong>Persona under-utilisation in v1.5β</strong>. Despite a four-character system, 모미 and 요기 appeared in 0/80 v1.5β responses across all 8 scenarios. Marginal probability of routing to body- or movement-domain characters appears to require explicit somatic or kinetic cues not present in this scenario set.</li>
</ol>

<h3>3.3 Limitations</h3>
<ul>
<li><strong>Pilot sample size</strong>. <i>N</i> = 10 per cell yields wide confidence intervals; medium effects may be statistically detectable but small effects cannot. Full-scale extension to <i>N</i> = 50 is recommended.</li>
<li><strong>LLM-as-judge</strong>. Single-rater evaluation; inter-rater reliability not yet assessed (deferred to a future study with two judge models or human raters).</li>
<li><strong>Korean adaptation of English-validated instruments</strong>. PPS and MITI were originally validated in English; the Korean Likert anchors used here are translated rubrics, not psychometrically validated scales.</li>
<li><strong>Scenario coverage</strong>. Eight scenarios cannot exhaust the conversational space. The under-utilisation of 모미 and 요기 reflects scenario selection, not necessarily deficient prompt design.</li>
<li><strong>Single response model</strong>. Findings generalise to Sonnet 4.6; behaviour under other models (Opus, Haiku, non-Anthropic frontier models) requires replication.</li>
</ul>

<h3>3.4 Implications for system design</h3>
<ol>
<li><strong>Patch v1.3 production defect</strong> by adding <code>return profileBlock;</code>. The current behaviour deprives users of the entire persona scaffolding.</li>
<li><strong>Strengthen v1.5β crisis-resource invocation</strong>. The 6% mention rate on suicide cues is below clinical norms. Explicit "always include 109/1577 at end of crisis turns" rule recommended.</li>
<li><strong>Improve trauma routing</strong>. Add semantic exemplars to the v1.5β prompt: explicit phrase mappings for "그때", "자꾸 떠올라", "악몽" → 숨이.</li>
<li><strong>Expand scenario set for body/movement evaluation</strong>. S9–S12 covering somatic complaints (e.g., "어깨가 너무 결려요", "운동할 시간이 없어요") would be required to test 모미 and 요기 routing fidelity.</li>
</ol>

<h2>4. References</h2>
<p class="ref">Argyle, L. P., Busby, E. C., Fulda, N., Gubler, J. R., Rytting, C., & Wingate, D. (2023). Out of one, many: Using language models to simulate human samples. <i>Political Analysis, 31</i>(3), 337–351. https://doi.org/10.1017/pan.2023.2</p>
<p class="ref">Miller, W. R., & Rollnick, S. (2013). <i>Motivational interviewing: Helping people change</i> (3rd ed.). Guilford Press.</p>
<p class="ref">Moyers, T. B., Manuel, J. K., & Ernst, D. (2016). <i>Motivational Interviewing Treatment Integrity Coding Manual 4.2.1.</i> University of New Mexico, Center on Alcoholism, Substance Abuse and Addictions (CASAA).</p>
<p class="ref">Salminen, J., Şengün, S., Kwak, H., Jansen, B., An, J., Jung, S.-G., Vieweg, S., & Harrell, D. F. (2020). Persona perception scale: Development and exploratory validation of an instrument for evaluating individuals' perceptions of personas. <i>International Journal of Human-Computer Studies, 141</i>, 102437. https://doi.org/10.1016/j.ijhcs.2020.102437</p>
<p class="ref">Sarstedt, M., Adler, S. J., Rau, L., & Schmitt, B. (2024). Using large language models to generate silicon samples in consumer and marketing research: Challenges, opportunities, and guidelines. <i>Psychology & Marketing, 41</i>(6), 1254–1270.</p>
<p class="ref">Zheng, L., Chiang, W.-L., Sheng, Y., Zhuang, S., Wu, Z., Zhuang, Y., Lin, Z., Li, Z., Li, D., Xing, E. P., Zhang, H., Gonzalez, J. E., & Stoica, I. (2023). Judging LLM-as-a-judge with MT-Bench and Chatbot Arena. <i>Advances in Neural Information Processing Systems, 36</i>.</p>

</div>
</body>
</html>`;
fs.writeFileSync(path.join(OUT_DIR, "dashboard_academic.html"), html);
console.log(`✅ wrote dashboard_academic.html (${(html.length/1024).toFixed(1)} KB)`);
