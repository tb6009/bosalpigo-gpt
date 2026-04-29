#!/usr/bin/env node
/**
 * validate.mjs — Phase 4.5 검증
 * - Sanity check (응답·채점 무결성)
 * - Outlier detection (cell 내 ±3 SD)
 * - Prompt leakage audit (응답이 시스템 프롬프트 verbatim 포함?)
 * - Score-distribution sanity (한쪽 몰림 검출)
 *
 * 출력: 04_validation/sanity_check.md, leakage_audit.md, outlier_report.md
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../02_data");
const VALID_DIR = path.resolve(__dirname, "../04_validation");
const RESPONSES_DIR = path.join(DATA_DIR, "responses");
const SCORES_DIR = path.join(DATA_DIR, "scores");
const PROMPTS_DIR = path.join(DATA_DIR, "system_prompts");
fs.mkdirSync(VALID_DIR, { recursive: true });

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "scenarios.json"), "utf8"));
const VERSIONS = cfg.versions;
const SCENARIOS = cfg.scenarios.map(s => s.id);

// Load
const responses = [];
for (const f of fs.readdirSync(RESPONSES_DIR)) {
  if (!f.endsWith(".json") || f.startsWith("_")) continue;
  responses.push(JSON.parse(fs.readFileSync(path.join(RESPONSES_DIR, f), "utf8")));
}
const scores = [];
for (const f of fs.readdirSync(SCORES_DIR)) {
  if (!f.endsWith(".json") || f.startsWith("_")) continue;
  scores.push(JSON.parse(fs.readFileSync(path.join(SCORES_DIR, f), "utf8")));
}

// Load system prompts (for leakage detection)
const systemPrompts = {};
for (const v of VERSIONS) {
  const p = path.join(PROMPTS_DIR, `${v}.txt`);
  systemPrompts[v] = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}

// ──────────────────────────────────────────────────────────────
// 1. Sanity check
// ──────────────────────────────────────────────────────────────
function sanity() {
  const lines = ["# Sanity Check (Phase 4.5)\n"];
  lines.push(`Generated: ${new Date().toISOString()}\n`);

  lines.push("## Data inventory\n");
  lines.push(`- Total responses loaded: ${responses.length}`);
  lines.push(`- Total scores loaded: ${scores.length}`);

  // Per-cell counts
  const cells = {};
  for (const r of responses) {
    const k = `${r.version}/${r.scenario_id}`;
    cells[k] = (cells[k] || 0) + 1;
  }
  const expected = VERSIONS.length * SCENARIOS.length * cfg.replications;
  const cellsExpected = VERSIONS.length * SCENARIOS.length;
  lines.push(`- Cells with responses: ${Object.keys(cells).length} / ${cellsExpected}`);
  lines.push(`- Total responses: ${responses.length} / ${expected} (target)`);

  // OK status
  const okR = responses.filter(r => r.ok).length;
  const okS = scores.filter(s => s.scores_ok).length;
  lines.push(`- Responses with ok=true: ${okR} / ${responses.length} (${(okR/responses.length*100).toFixed(1)}%)`);
  lines.push(`- Scores with scores_ok=true: ${okS} / ${scores.length} (${(okS/scores.length*100).toFixed(1)}%)`);

  // Empty text
  const empty = responses.filter(r => r.ok && !r.text).length;
  lines.push(`- Responses with empty text: ${empty}`);

  // Model consistency
  const models = new Set(responses.filter(r => r.ok).map(r => r.model));
  lines.push(`- Response models used: ${[...models].join(", ")}`);

  // System prompt length consistency
  for (const v of VERSIONS) {
    const lens = new Set(responses.filter(r => r.version === v && r.ok).map(r => r.system_prompt_length));
    lines.push(`- ${v} system_prompt_length consistency: ${[...lens].join(", ")}`);
  }

  // Token usage
  const tokensIn = responses.filter(r=>r.ok && r.usage).map(r=>r.usage.input_tokens);
  const tokensOut = responses.filter(r=>r.ok && r.usage).map(r=>r.usage.output_tokens);
  lines.push(`- Total input tokens: ${tokensIn.reduce((a,b)=>a+b,0)}`);
  lines.push(`- Total output tokens: ${tokensOut.reduce((a,b)=>a+b,0)}`);

  lines.push("\n## Conclusion\n");
  const allGood = okR === responses.length && empty === 0;
  lines.push(allGood ? "✅ All sanity checks pass." : "⚠️ Issues detected (see above).");

  fs.writeFileSync(path.join(VALID_DIR, "sanity_check.md"), lines.join("\n"));
  console.log(`✅ sanity_check.md`);
}

// ──────────────────────────────────────────────────────────────
// 2. Outlier detection (per cell, ±3 SD on response length)
// ──────────────────────────────────────────────────────────────
function outliers() {
  const lines = ["# Outlier Report (Phase 4.5)\n"];
  lines.push(`Generated: ${new Date().toISOString()}\n`);
  lines.push("## Method\n");
  lines.push("Per (version × scenario) cell: compute mean & SD of response length (chars). Flag values beyond ±3 SD as outliers.\n");

  const cells = {};
  for (const r of responses) {
    if (!r.ok) continue;
    const k = `${r.version}/${r.scenario_id}`;
    if (!cells[k]) cells[k] = [];
    cells[k].push({ rep: r.rep, len: r.text.length });
  }
  let totalOutliers = 0;
  lines.push("\n## Cells with outliers\n");
  for (const k of Object.keys(cells).sort()) {
    const lens = cells[k].map(x => x.len);
    if (lens.length < 3) continue;
    const m = lens.reduce((a,b)=>a+b,0)/lens.length;
    const sd = Math.sqrt(lens.reduce((a,v)=>a+(v-m)**2,0)/(lens.length-1));
    const outs = cells[k].filter(x => Math.abs(x.len - m) > 3 * sd);
    if (outs.length > 0) {
      totalOutliers += outs.length;
      lines.push(`- **${k}** (mean=${m.toFixed(0)}, sd=${sd.toFixed(0)}): ${outs.length} outlier(s)`);
      for (const o of outs) lines.push(`  - rep ${o.rep}: len=${o.len} (${(((o.len-m)/sd)).toFixed(1)} SD)`);
    }
  }
  lines.push(`\n## Total outliers: ${totalOutliers} / ${responses.length} (${(totalOutliers/responses.length*100).toFixed(1)}%)`);
  fs.writeFileSync(path.join(VALID_DIR, "outlier_report.md"), lines.join("\n"));
  console.log(`✅ outlier_report.md (total: ${totalOutliers})`);
}

// ──────────────────────────────────────────────────────────────
// 3. Prompt leakage audit
// ──────────────────────────────────────────────────────────────
function leakage() {
  const lines = ["# Prompt Leakage Audit (Phase 4.5)\n"];
  lines.push(`Generated: ${new Date().toISOString()}\n`);
  lines.push("## Method\n");
  lines.push("For each response, check if it contains a verbatim 30-char substring from the system prompt (excluding common phrases).\n");

  // For each system prompt, extract unique 30-char chunks (not common boilerplate)
  const PROBE_LEN = 30;
  const probes = {};
  for (const v of VERSIONS) {
    const sp = systemPrompts[v];
    if (!sp || sp.length < PROBE_LEN) { probes[v] = []; continue; }
    // Take 50 random non-overlapping chunks
    const chunks = [];
    for (let i = 0; i < sp.length - PROBE_LEN; i += Math.max(50, Math.floor(sp.length / 50))) {
      const c = sp.substring(i, i + PROBE_LEN).trim();
      // Skip whitespace-only or very generic
      if (c.length >= PROBE_LEN - 5 && !/^[#\-\s]/.test(c)) chunks.push(c);
    }
    probes[v] = chunks;
  }

  const leaks = [];
  for (const r of responses) {
    if (!r.ok || !r.text) continue;
    const probesForVer = probes[r.version];
    for (const probe of probesForVer) {
      if (r.text.includes(probe)) {
        leaks.push({ version: r.version, scenario: r.scenario_id, rep: r.rep, probe: probe.slice(0, 40) });
        break;
      }
    }
  }
  lines.push(`## Findings\n`);
  lines.push(`- Total responses checked: ${responses.filter(r=>r.ok).length}`);
  lines.push(`- Responses with leakage: ${leaks.length} (${(leaks.length/responses.length*100).toFixed(1)}%)`);
  if (leaks.length > 0) {
    lines.push("\n### Leaks detected\n");
    for (const l of leaks) lines.push(`- ${l.version}/${l.scenario}/rep${l.rep}: matched "${l.probe}..."`);
  } else {
    lines.push("\n✅ No prompt leakage detected.");
  }
  fs.writeFileSync(path.join(VALID_DIR, "leakage_audit.md"), lines.join("\n"));
  console.log(`✅ leakage_audit.md (leaks: ${leaks.length})`);
}

// ──────────────────────────────────────────────────────────────
// 4. Score distribution sanity
// ──────────────────────────────────────────────────────────────
function scoreDist() {
  const lines = ["# Score Distribution Sanity (Phase 4.5)\n"];
  lines.push(`Generated: ${new Date().toISOString()}\n`);
  lines.push("## Method\n");
  lines.push("For each (DV × version) cell, check if scores cluster on a single value (>70% on one number = potential ceiling/floor effect).\n");

  const dvs = [
    ["pps","credibility"],["pps","likability"],["pps","similarity"],["pps","empathy"],["pps","willingness"],
    ["miti","cct"],["miti","sst"],["miti","partnership"],["miti","empathy_mi"],
    ["safety","triage_appropriateness"],
  ];
  let suspect = 0;
  for (const v of VERSIONS) {
    for (const [grp,k] of dvs) {
      const vals = scores.filter(s => s.version === v && s.scores_ok).map(s => s.scores?.[grp]?.[k]).filter(x => x != null);
      if (vals.length === 0) continue;
      const counts = {};
      for (const x of vals) counts[x] = (counts[x]||0)+1;
      const max = Math.max(...Object.values(counts));
      const ratio = max / vals.length;
      if (ratio > 0.7) {
        const dom = Object.entries(counts).find(([,c])=>c===max)[0];
        suspect++;
        lines.push(`- ⚠️ ${v} / ${grp}.${k}: ${(ratio*100).toFixed(0)}% on score ${dom} (n=${vals.length})`);
      }
    }
  }
  if (suspect === 0) {
    lines.push("\n✅ No ceiling/floor effects detected.");
  } else {
    lines.push(`\n## Total suspect cells: ${suspect}`);
  }
  fs.writeFileSync(path.join(VALID_DIR, "score_distribution.md"), lines.join("\n"));
  console.log(`✅ score_distribution.md (suspects: ${suspect})`);
}

sanity();
outliers();
leakage();
scoreDist();
console.log("\n✅ Phase 4.5 validation complete.");
