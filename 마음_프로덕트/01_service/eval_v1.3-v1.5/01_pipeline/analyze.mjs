#!/usr/bin/env node
/**
 * analyze.mjs
 * Phase 3.5 — 통계 분석
 *
 * 입력: ../02_data/scores/{version}_{scenario}_{rep}.json
 * 출력: ../02_data/analysis_summary.json + console table
 *
 * 분석:
 *  - 셀별 평균·표준편차·95% CI (PPS·MITI·Safety)
 *  - 일원분산분석 (one-way ANOVA) — Version 효과 (각 DV)
 *  - Cohen's d — v1.4 vs v1.5
 *  - Tukey HSD 간단 근사 (pairwise contrasts)
 *  - 캐릭터 등장률, 응답 길이 분포
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../02_data");
const SCORES_DIR = path.join(DATA_DIR, "scores");
const RESPONSES_DIR = path.join(DATA_DIR, "responses");

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "scenarios.json"), "utf8"));
const VERSIONS = cfg.versions;
const SCENARIOS = cfg.scenarios.map((s) => s.id);

// ──────────────────────────────────────────────────────────────
// Load all scores
// ──────────────────────────────────────────────────────────────
const records = [];
for (const f of fs.readdirSync(SCORES_DIR)) {
  if (!f.endsWith(".json") || f.startsWith("_")) continue;
  const r = JSON.parse(fs.readFileSync(path.join(SCORES_DIR, f), "utf8"));
  if (!r.scores_ok || !r.scores) continue;
  records.push(r);
}
console.log(`Loaded ${records.length} valid score records`);

const DV_KEYS = [
  ["pps", "credibility"], ["pps", "likability"], ["pps", "similarity"], ["pps", "empathy"], ["pps", "willingness"],
  ["miti", "cct"], ["miti", "sst"], ["miti", "partnership"], ["miti", "empathy_mi"],
  ["safety", "resource_mention"], ["safety", "diagnostic_avoidance"], ["safety", "toxic_reassurance_avoidance"], ["safety", "triage_appropriateness"],
];

function getDV(rec, [a, b]) { return rec.scores?.[a]?.[b]; }

// ──────────────────────────────────────────────────────────────
// Stats helpers
// ──────────────────────────────────────────────────────────────
function mean(xs) { return xs.length === 0 ? NaN : xs.reduce((a, b) => a + b, 0) / xs.length; }
function variance(xs) {
  if (xs.length < 2) return NaN;
  const m = mean(xs);
  return xs.reduce((acc, v) => acc + (v - m) ** 2, 0) / (xs.length - 1);
}
function sd(xs) { return Math.sqrt(variance(xs)); }
function ci95(xs) {
  if (xs.length < 2) return [NaN, NaN];
  const m = mean(xs), s = sd(xs);
  const h = 1.96 * s / Math.sqrt(xs.length);
  return [m - h, m + h];
}
function cohenD(a, b) {
  if (a.length < 2 || b.length < 2) return NaN;
  const ma = mean(a), mb = mean(b);
  const va = variance(a), vb = variance(b);
  const pooled = Math.sqrt(((a.length - 1) * va + (b.length - 1) * vb) / (a.length + b.length - 2));
  return (ma - mb) / pooled;
}
function oneWayANOVA(groups) {
  // groups: array of arrays
  const k = groups.length;
  const allVals = groups.flat();
  if (allVals.length < k + 1) return { F: NaN, df_between: k - 1, df_within: NaN, p: NaN };
  const grand = mean(allVals);
  const ss_between = groups.reduce((acc, g) => acc + g.length * (mean(g) - grand) ** 2, 0);
  const ss_within = groups.reduce((acc, g) => {
    const mg = mean(g);
    return acc + g.reduce((a, v) => a + (v - mg) ** 2, 0);
  }, 0);
  const df_between = k - 1;
  const df_within = allVals.length - k;
  const ms_between = ss_between / df_between;
  const ms_within = ss_within / df_within;
  const F = ms_between / ms_within;
  // Approximate p-value via F-distribution upper tail (simple approximation)
  // Use survival function approximation: p ≈ exp(-F * df_between / 2) for rough flag.
  // For pilot we report F and df only; precise p-value via SciPy in later analysis if needed.
  return { F: Number.isFinite(F) ? F : NaN, df_between, df_within, ss_between, ss_within };
}

// ──────────────────────────────────────────────────────────────
// Aggregate
// ──────────────────────────────────────────────────────────────
const summary = {
  generated_at: new Date().toISOString(),
  total_records: records.length,
  cells: {},
  by_version: {},
  anova: {},
  cohenD_v14_v15: {},
};

// Cell-level (version × scenario)
for (const v of VERSIONS) {
  summary.cells[v] = {};
  for (const s of SCENARIOS) {
    const cell = records.filter((r) => r.version === v && r.scenario_id === s);
    summary.cells[v][s] = {
      n: cell.length,
      pps: {}, miti: {}, safety: {},
    };
    for (const [grp, dv] of DV_KEYS) {
      const vals = cell.map((r) => getDV(r, [grp, dv])).filter((x) => x != null);
      const [lo, hi] = ci95(vals);
      summary.cells[v][s][grp][dv] = { mean: mean(vals), sd: sd(vals), ci95: [lo, hi], n: vals.length };
    }
  }
}

// Version-level (pooled across scenarios)
for (const v of VERSIONS) {
  summary.by_version[v] = { pps: {}, miti: {}, safety: {} };
  const versionRecs = records.filter((r) => r.version === v);
  for (const [grp, dv] of DV_KEYS) {
    const vals = versionRecs.map((r) => getDV(r, [grp, dv])).filter((x) => x != null);
    summary.by_version[v][grp][dv] = { mean: mean(vals), sd: sd(vals), ci95: ci95(vals), n: vals.length };
  }
}

// One-way ANOVA per DV
for (const [grp, dv] of DV_KEYS) {
  const groups = VERSIONS.map((v) => records.filter((r) => r.version === v).map((r) => getDV(r, [grp, dv])).filter((x) => x != null));
  summary.anova[`${grp}_${dv}`] = oneWayANOVA(groups);
}

// Cohen's d v1.4 vs v1.5
for (const [grp, dv] of DV_KEYS) {
  const a = records.filter((r) => r.version === "v1.4").map((r) => getDV(r, [grp, dv])).filter((x) => x != null);
  const b = records.filter((r) => r.version === "v1.5").map((r) => getDV(r, [grp, dv])).filter((x) => x != null);
  summary.cohenD_v14_v15[`${grp}_${dv}`] = cohenD(b, a); // positive = v1.5 > v1.4
}

// Character invocation rates
summary.character_invocations = {};
for (const v of VERSIONS) {
  const versionRecs = records.filter((r) => r.version === v);
  const counts = { 마음: 0, 모미: 0, 요기: 0, 숨이: 0 };
  for (const r of versionRecs) {
    const chars = r.scores?.aux?.characters_invoked || [];
    for (const c of chars) if (counts[c] !== undefined) counts[c]++;
  }
  summary.character_invocations[v] = {
    n: versionRecs.length,
    rates: Object.fromEntries(Object.entries(counts).map(([k, c]) => [k, versionRecs.length ? c / versionRecs.length : 0])),
  };
}

// Response token counts
summary.response_lengths = {};
for (const v of VERSIONS) {
  const lengths = records.filter((r) => r.version === v).map((r) => r.scores?.aux?.response_token_count_estimate).filter((x) => x != null);
  summary.response_lengths[v] = { mean: mean(lengths), sd: sd(lengths), n: lengths.length };
}

// Write output
fs.writeFileSync(path.join(DATA_DIR, "analysis_summary.json"), JSON.stringify(summary, null, 2));
console.log("✅ analysis_summary.json written");

// Pretty print top-line
console.log("\n═══ Version means (pooled across scenarios) ═══");
console.log("Dim".padEnd(35) + VERSIONS.map((v) => v.padStart(10)).join(""));
for (const [grp, dv] of DV_KEYS) {
  const row = `${grp}.${dv}`.padEnd(35);
  const cells = VERSIONS.map((v) => {
    const m = summary.by_version[v][grp][dv].mean;
    return Number.isFinite(m) ? m.toFixed(2).padStart(10) : "  N/A".padStart(10);
  }).join("");
  console.log(row + cells);
}

console.log("\n═══ Cohen's d (v1.5 − v1.4) ═══");
for (const [grp, dv] of DV_KEYS) {
  const d = summary.cohenD_v14_v15[`${grp}_${dv}`];
  const tag = Math.abs(d) >= 0.8 ? "  large" : Math.abs(d) >= 0.5 ? "  med" : Math.abs(d) >= 0.2 ? "  small" : "  trivial";
  console.log(`${grp}.${dv}`.padEnd(35) + (Number.isFinite(d) ? d.toFixed(2).padStart(8) : "    N/A") + tag);
}

console.log("\n═══ ANOVA F (df_b, df_w) — Version factor ═══");
for (const [grp, dv] of DV_KEYS) {
  const a = summary.anova[`${grp}_${dv}`];
  console.log(`${grp}.${dv}`.padEnd(35) + (Number.isFinite(a.F) ? a.F.toFixed(2).padStart(8) : "    N/A") + `  (${a.df_between}, ${a.df_within})`);
}

console.log("\n═══ Character invocations (rate/response) ═══");
for (const v of VERSIONS) {
  const r = summary.character_invocations[v].rates;
  console.log(`${v}: 마음=${r.마음.toFixed(2)}  모미=${r.모미.toFixed(2)}  요기=${r.요기.toFixed(2)}  숨이=${r.숨이.toFixed(2)}`);
}
