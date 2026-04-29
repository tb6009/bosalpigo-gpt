#!/usr/bin/env node
/**
 * retry_failed.mjs
 * Retry only the cells whose existing JSON response has ok:false.
 * Usage: node retry_failed.mjs --version v1.3 --concurrency 1
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "./load_env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../02_data");
const PROMPTS_DIR = path.join(DATA_DIR, "system_prompts");
const RESPONSES_DIR = path.join(DATA_DIR, "responses");

const args = process.argv.slice(2);
const argMap = {};
for (let i = 0; i < args.length; i += 2) argMap[args[i].replace(/^--/, "")] = args[i + 1];
const TARGET_VERSION = argMap.version;
const CONCURRENCY = parseInt(argMap.concurrency || "1", 10);
if (!TARGET_VERSION) { console.error("--version required"); process.exit(2); }
if (!process.env.ANTHROPIC_API_KEY) { console.error("API key missing"); process.exit(2); }

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "scenarios.json"), "utf8"));
const scenarios = cfg.scenarios;
const REPS = cfg.replications;
const MODEL = cfg.models.responder;
const TEMP = cfg.params.responder_temperature;
const MAXTOK = cfg.params.responder_max_tokens;

const sysPath = path.join(PROMPTS_DIR, `${TARGET_VERSION}.txt`);
const systemPrompt = fs.existsSync(sysPath) ? fs.readFileSync(sysPath, "utf8") : "";

// Find failed cells
const tasks = [];
for (const s of scenarios) {
  for (let r = 1; r <= REPS; r++) {
    const fname = `${TARGET_VERSION}_${s.id}_${String(r).padStart(2, "0")}.json`;
    const fpath = path.join(RESPONSES_DIR, fname);
    if (!fs.existsSync(fpath)) { tasks.push({ scenario: s, rep: r, fpath }); continue; }
    try {
      const d = JSON.parse(fs.readFileSync(fpath, "utf8"));
      if (!d.ok) tasks.push({ scenario: s, rep: r, fpath });
    } catch { tasks.push({ scenario: s, rep: r, fpath }); }
  }
}
console.log(`Retry tasks: ${tasks.length} (version=${TARGET_VERSION}) concurrency=${CONCURRENCY}`);

async function callAnthropic(userInput, attempt = 1) {
  const body = { model: MODEL, max_tokens: MAXTOK, temperature: TEMP, messages: [{ role: "user", content: userInput }] };
  if (systemPrompt && systemPrompt.length > 0) body.system = systemPrompt;
  const t0 = Date.now();
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify(body),
    });
    const elapsed = Date.now() - t0;
    if (!res.ok) {
      const errTxt = await res.text();
      if ((res.status === 429 || res.status >= 500) && attempt < 8) {
        const wait = Math.min(60000, 5000 * attempt);
        await new Promise((r) => setTimeout(r, wait));
        return callAnthropic(userInput, attempt + 1);
      }
      throw new Error(`HTTP ${res.status}: ${errTxt.slice(0, 200)}`);
    }
    const json = await res.json();
    const text = (json.content || []).map((b) => b.text || "").join("");
    return { ok: true, text, usage: json.usage, latency_ms: elapsed, stop_reason: json.stop_reason, attempts: attempt };
  } catch (e) {
    if (attempt < 8) { await new Promise((r) => setTimeout(r, 4000 * attempt)); return callAnthropic(userInput, attempt + 1); }
    return { ok: false, error: e.message, attempts: attempt };
  }
}

const PACING_MS = 2000; // baseline pacing between successful calls
async function runTask(t) {
  const result = await callAnthropic(t.scenario.input);
  const record = {
    version: TARGET_VERSION,
    scenario_id: t.scenario.id,
    scenario_input: t.scenario.input,
    rep: t.rep,
    model: MODEL,
    temperature: TEMP,
    timestamp: new Date().toISOString(),
    system_prompt_length: systemPrompt.length,
    system_prompt_present: systemPrompt.length > 0,
    retry_pass: true,
    ...result,
  };
  fs.writeFileSync(t.fpath, JSON.stringify(record, null, 2));
  // Pacing — keep well under rate limit (~30 req/min target)
  await new Promise(r => setTimeout(r, PACING_MS));
  return record;
}

async function pool(items, limit, fn) {
  let i = 0, done = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (i < items.length) {
      const idx = i++;
      try { await fn(items[idx]); } catch (e) { console.error("worker err", e.message); }
      done++;
      process.stdout.write(`\r  progress: ${done}/${items.length}`);
    }
  });
  await Promise.all(workers);
  process.stdout.write("\n");
}

const t0 = Date.now();
await pool(tasks, CONCURRENCY, runTask);
console.log(`\n✅ retry done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
