#!/usr/bin/env node
/**
 * show_progress_summary.mjs
 * 바그래프 + 콘텐츠 요약을 같이 보여주는 향상된 진행 표시기.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../02_data");
const RESPONSES_DIR = path.join(DATA_DIR, "responses");
const SCORES_DIR = path.join(DATA_DIR, "scores");

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "scenarios.json"), "utf8"));
const SCENARIOS = cfg.scenarios.map(s => s.id);
const VERSIONS = cfg.versions;
const REPS = cfg.replications;

function bar(done, total, width = 24) {
  const pct = total === 0 ? 0 : done / total;
  const filled = Math.round(pct * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}
function pad(s, n) { return String(s).padEnd(n); }
function loadJSON(f) { try { return JSON.parse(fs.readFileSync(f,"utf8")); } catch { return null; } }

// ─── Load all response data ───────────────────────────────────
const allResponses = [];
if (fs.existsSync(RESPONSES_DIR)) {
  for (const f of fs.readdirSync(RESPONSES_DIR)) {
    if (!f.endsWith(".json") || f.startsWith("_")) continue;
    const d = loadJSON(path.join(RESPONSES_DIR, f));
    if (d) allResponses.push(d);
  }
}
const allScores = [];
if (fs.existsSync(SCORES_DIR)) {
  for (const f of fs.readdirSync(SCORES_DIR)) {
    if (!f.endsWith(".json") || f.startsWith("_")) continue;
    const d = loadJSON(path.join(SCORES_DIR, f));
    if (d) allScores.push(d);
  }
}

// ─── Header ───────────────────────────────────────────────────
const out = [];
out.push("═".repeat(82));
out.push(`🧪 v1.3-v1.5 Evaluation — ${new Date().toLocaleString("ko-KR",{timeZone:"Asia/Seoul"})}`);
out.push("═".repeat(82));

// ─── Phase 2: Collection bar graph ────────────────────────────
out.push("\n[Phase 2] Data Collection (Sonnet 4.6)");
const cellOK = {}, cellFail = {};
for (const v of VERSIONS) for (const s of SCENARIOS) { cellOK[`${v}/${s}`] = 0; cellFail[`${v}/${s}`] = 0; }
for (const r of allResponses) {
  const k = `${r.version}/${r.scenario_id}`;
  if (k in cellOK) {
    if (r.ok) cellOK[k]++; else cellFail[k]++;
  }
}
let totOK=0, totFail=0;
for (const v of VERSIONS) {
  for (const s of SCENARIOS) {
    const ok = cellOK[`${v}/${s}`], fail = cellFail[`${v}/${s}`];
    totOK+=ok; totFail+=fail;
    const status = ok >= REPS ? "✅" : (ok+fail) > 0 ? "⏳" : "⏸";
    const failTag = fail ? `  ❌${fail}` : "";
    out.push(`  ${pad(v+" × "+s, 11)} ${bar(ok, REPS)} ${pad(ok+"/"+REPS, 7)} ${status}${failTag}`);
  }
}
out.push("  " + "─".repeat(80));
const totMax = VERSIONS.length * SCENARIOS.length * REPS;
const pct = ((totOK / totMax) * 100).toFixed(1);
out.push(`  TOTAL: OK=${totOK}/${totMax} (${pct}%)  failed=${totFail}`);

// ─── Phase 3: Scoring bar graph ───────────────────────────────
out.push("\n[Phase 3] Scoring (Opus 4.7)");
const scoreOK = {}, scoreFail = {};
for (const v of VERSIONS) for (const s of SCENARIOS) { scoreOK[`${v}/${s}`] = 0; scoreFail[`${v}/${s}`] = 0; }
for (const r of allScores) {
  const k = `${r.version}/${r.scenario_id}`;
  if (k in scoreOK) {
    if (r.scores_ok) scoreOK[k]++; else scoreFail[k]++;
  }
}
if (allScores.length === 0) {
  out.push("  (대기 중)");
} else {
  let sOK=0, sFail=0;
  for (const v of VERSIONS) {
    for (const s of SCENARIOS) {
      const ok = scoreOK[`${v}/${s}`], fail = scoreFail[`${v}/${s}`];
      sOK+=ok; sFail+=fail;
      const status = ok >= REPS ? "✅" : (ok+fail) > 0 ? "⏳" : "⏸";
      const failTag = fail ? `  ❌${fail}` : "";
      out.push(`  ${pad(v+" × "+s, 11)} ${bar(ok, REPS)} ${pad(ok+"/"+REPS, 7)} ${status}${failTag}`);
    }
  }
  out.push("  " + "─".repeat(80));
  out.push(`  TOTAL: OK=${sOK}/${totMax} (${((sOK/totMax)*100).toFixed(1)}%)  failed=${sFail}`);
}

// ─── Content Summary (응답 데이터 기반) ─────────────────────
out.push("\n📊 Content Summary (수집된 응답 기준)");
out.push("─".repeat(82));
for (const v of VERSIONS) {
  const vRecs = allResponses.filter(r => r.version === v && r.ok && r.text);
  if (vRecs.length === 0) { out.push(`  ${v}: (응답 없음)`); continue; }
  const lens = vRecs.map(r => r.text.length);
  const avgLen = (lens.reduce((a,b)=>a+b,0)/lens.length).toFixed(0);
  const minLen = Math.min(...lens);
  const maxLen = Math.max(...lens);
  // Character detection by regex
  const charCounts = { 마음:0, 모미:0, 요기:0, 숨이:0 };
  for (const r of vRecs) {
    if (r.text.includes("🎭") || r.text.includes("【⊡")) charCounts.마음++;
    if (r.text.includes("🫂") || r.text.includes("(◉")) charCounts.모미++;
    if (r.text.includes("🧘") || r.text.includes("☯")) charCounts.요기++;
    if (r.text.includes("🌙") || /\(｡/.test(r.text)) charCounts.숨이++;
  }
  const charStr = Object.entries(charCounts)
    .filter(([_,c])=>c>0)
    .map(([k,c])=>`${k}=${(c/vRecs.length*100).toFixed(0)}%`)
    .join(" ") || "(캐릭터 미검출)";
  // Latency
  const latencies = vRecs.map(r => r.latency_ms).filter(x => x);
  const avgLat = latencies.length ? (latencies.reduce((a,b)=>a+b,0)/latencies.length/1000).toFixed(1) : "?";
  out.push(`  ${v}  n=${vRecs.length}  길이 ${minLen}-${maxLen}자 평균 ${avgLen}자  지연 ${avgLat}s`);
  out.push(`        캐릭터 등장률: ${charStr}`);
}

// ─── Crisis & trauma scenarios sample ─────────────────────────
out.push("\n🚨 Safety scenarios — sample first responses");
out.push("─".repeat(82));
for (const sid of ["S5", "S8"]) {
  const sample = cfg.scenarios.find(s=>s.id===sid);
  out.push(`  ${sid} "${sample.input}"`);
  for (const v of VERSIONS) {
    const r = allResponses.find(x => x.version === v && x.scenario_id === sid && x.ok && x.text);
    if (r) {
      const txt = r.text.replace(/\n/g," ").slice(0, 100);
      const has109 = /109|1577|1393/.test(r.text) ? "📞" : "  ";
      const hasSumi = /숨이|🌙|\(｡/.test(r.text) ? "🌙" : "  ";
      out.push(`    ${v} ${has109}${hasSumi} → "${txt}..."`);
    }
  }
}

out.push("\n" + "═".repeat(82));
console.log(out.join("\n"));
