#!/usr/bin/env node
/**
 * collect_responses.mjs
 * Phase 2 — 응답 수집기 (Claude Sonnet 4.6)
 *
 * Usage:
 *   node collect_responses.mjs --version v1.3
 *   node collect_responses.mjs --version v1.4 --concurrency 5
 *   node collect_responses.mjs --version all  (직렬 X — 병렬은 외부에서 멀티에이전트로)
 *
 * Env:
 *   ANTHROPIC_API_KEY (required)
 *
 * Output:
 *   ../02_data/responses/{version}_{scenario}_{rep:02d}.json
 *   ../02_data/responses/_progress.json   (실시간 진행 상태)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "./load_env.mjs"; // loads .env if present

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../02_data");
const PROMPTS_DIR = path.join(DATA_DIR, "system_prompts");
const RESPONSES_DIR = path.join(DATA_DIR, "responses");
const PROGRESS_FILE = path.join(RESPONSES_DIR, "_progress.json");

fs.mkdirSync(RESPONSES_DIR, { recursive: true });

// ──────────────────────────────────────────────────────────────
// CLI parsing
// ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const argMap = {};
for (let i = 0; i < args.length; i += 2) argMap[args[i].replace(/^--/, "")] = args[i + 1];
const TARGET_VERSION = argMap.version || "all";
const CONCURRENCY = parseInt(argMap.concurrency || "5", 10);
const OVERWRITE = argMap.overwrite === "true";

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("❌ ANTHROPIC_API_KEY env var not set.");
  process.exit(2);
}

// ──────────────────────────────────────────────────────────────
// Load config
// ──────────────────────────────────────────────────────────────
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "scenarios.json"), "utf8"));
const scenarios = cfg.scenarios;
const versions = TARGET_VERSION === "all" ? cfg.versions : [TARGET_VERSION];
const REPS = cfg.replications;
const MODEL = cfg.models.responder;
const TEMP = cfg.params.responder_temperature;
const MAXTOK = cfg.params.responder_max_tokens;

// Load system prompts
const systemPrompts = {};
for (const v of cfg.versions) {
  const p = path.join(PROMPTS_DIR, `${v}.txt`);
  systemPrompts[v] = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}

// ──────────────────────────────────────────────────────────────
// Build task queue
// ──────────────────────────────────────────────────────────────
const tasks = [];
for (const v of versions) {
  for (const s of scenarios) {
    for (let r = 1; r <= REPS; r++) {
      const fname = `${v}_${s.id}_${String(r).padStart(2, "0")}.json`;
      const fpath = path.join(RESPONSES_DIR, fname);
      if (!OVERWRITE && fs.existsSync(fpath)) continue;
      tasks.push({ version: v, scenario: s, rep: r, fpath });
    }
  }
}
const TOTAL = tasks.length;
console.log(`Total tasks: ${TOTAL} (versions=${versions.join(",")}, scenarios=${scenarios.length}, reps=${REPS})`);
console.log(`Concurrency: ${CONCURRENCY}, Model: ${MODEL}, Temp: ${TEMP}`);

// ──────────────────────────────────────────────────────────────
// Progress tracking (shared file)
// ──────────────────────────────────────────────────────────────
function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8"));
  } catch {}
  return { cells: {}, totals: {}, started_at: new Date().toISOString(), updated_at: null };
}
function saveProgress(p) {
  p.updated_at = new Date().toISOString();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2));
}
let progress = loadProgress();
// Initialize cells for this run
for (const v of versions) {
  for (const s of scenarios) {
    const k = `${v}/${s.id}`;
    if (!progress.cells[k]) {
      progress.cells[k] = { done: 0, total: REPS, status: "pending", errors: 0 };
    }
  }
}
saveProgress(progress);

// ──────────────────────────────────────────────────────────────
// Anthropic API call
// ──────────────────────────────────────────────────────────────
async function callAnthropic(systemPrompt, userInput, attempt = 1) {
  const body = {
    model: MODEL,
    max_tokens: MAXTOK,
    temperature: TEMP,
    messages: [{ role: "user", content: userInput }],
  };
  // v1.3: as-deployed (no system prompt)
  if (systemPrompt && systemPrompt.length > 0) body.system = systemPrompt;

  const t0 = Date.now();
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });
    const elapsed = Date.now() - t0;
    if (!res.ok) {
      const errTxt = await res.text();
      if ((res.status === 429 || res.status >= 500) && attempt < 4) {
        await new Promise((r) => setTimeout(r, 2000 * attempt));
        return callAnthropic(systemPrompt, userInput, attempt + 1);
      }
      throw new Error(`HTTP ${res.status}: ${errTxt.slice(0, 200)}`);
    }
    const json = await res.json();
    const text = (json.content || []).map((b) => b.text || "").join("");
    return {
      ok: true,
      text,
      usage: json.usage,
      latency_ms: elapsed,
      stop_reason: json.stop_reason,
      attempts: attempt,
    };
  } catch (e) {
    if (attempt < 4) {
      await new Promise((r) => setTimeout(r, 1500 * attempt));
      return callAnthropic(systemPrompt, userInput, attempt + 1);
    }
    return { ok: false, error: e.message, attempts: attempt };
  }
}

// ──────────────────────────────────────────────────────────────
// Worker
// ──────────────────────────────────────────────────────────────
async function runTask(t) {
  const sys = systemPrompts[t.version];
  const result = await callAnthropic(sys, t.scenario.input);
  const record = {
    version: t.version,
    scenario_id: t.scenario.id,
    scenario_input: t.scenario.input,
    rep: t.rep,
    model: MODEL,
    temperature: TEMP,
    timestamp: new Date().toISOString(),
    system_prompt_length: sys.length,
    system_prompt_present: sys.length > 0,
    ...result,
  };
  fs.writeFileSync(t.fpath, JSON.stringify(record, null, 2));

  // Progress update
  const k = `${t.version}/${t.scenario.id}`;
  progress = loadProgress();
  if (!progress.cells[k]) progress.cells[k] = { done: 0, total: REPS, status: "in_progress", errors: 0 };
  progress.cells[k].done = (progress.cells[k].done || 0) + 1;
  if (!result.ok) progress.cells[k].errors = (progress.cells[k].errors || 0) + 1;
  progress.cells[k].status = progress.cells[k].done >= progress.cells[k].total ? "done" : "in_progress";
  saveProgress(progress);
  return record;
}

// ──────────────────────────────────────────────────────────────
// Concurrency pool
// ──────────────────────────────────────────────────────────────
async function pool(items, limit, fn) {
  let i = 0, done = 0;
  const results = new Array(items.length);
  const workers = Array.from({ length: limit }, async () => {
    while (i < items.length) {
      const idx = i++;
      try {
        results[idx] = await fn(items[idx]);
      } catch (e) {
        results[idx] = { ok: false, error: e.message };
      }
      done++;
      if (done % 5 === 0 || done === items.length) {
        process.stdout.write(`\r  progress: ${done}/${items.length}`);
      }
    }
  });
  await Promise.all(workers);
  process.stdout.write("\n");
  return results;
}

// ──────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────
const t0 = Date.now();
console.log(`\n▶ start ${new Date().toISOString()}\n`);
await pool(tasks, CONCURRENCY, runTask);
const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`\n✅ done in ${elapsed}s — wrote ${tasks.length} files to ${path.relative(process.cwd(), RESPONSES_DIR)}`);
