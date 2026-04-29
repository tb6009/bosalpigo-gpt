#!/usr/bin/env node
/**
 * show_progress.mjs
 * 실시간 바그래프 진행률 표시기. 30초 간격 자동 갱신.
 *
 * Usage:
 *   node show_progress.mjs              # 한번 출력
 *   node show_progress.mjs --watch      # 30초 간격 갱신
 *   node show_progress.mjs --watch --interval 10
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../02_data");
const COLLECT_FILE = path.join(DATA_DIR, "responses/_progress.json");
const SCORE_FILE = path.join(DATA_DIR, "scores/_progress.json");

const args = process.argv.slice(2);
const WATCH = args.includes("--watch");
const INTERVAL = parseInt(args[args.indexOf("--interval") + 1] || "30", 10) * 1000;

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "scenarios.json"), "utf8"));
const SCENARIOS = cfg.scenarios.map((s) => s.id);
const VERSIONS = cfg.versions;
const REPS = cfg.replications;

function bar(done, total, width = 30) {
  const pct = total === 0 ? 0 : done / total;
  const filled = Math.round(pct * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

function pad(s, n) { return String(s).padEnd(n); }

function load(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return null; }
}

function render() {
  const collect = load(COLLECT_FILE);
  const score = load(SCORE_FILE);
  const lines = [];
  const ts = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  lines.push("═".repeat(78));
  lines.push(`🧪 Bosalpigo v1.3-v1.5 Evaluation — Progress  ${ts}`);
  lines.push("═".repeat(78));

  // Collection phase
  lines.push("\n[Phase 2] Data Collection (Sonnet 4.6)");
  if (!collect) {
    lines.push("  (대기 중 — 아직 시작 안 함)");
  } else {
    let totDone = 0, totErr = 0;
    const totMax = VERSIONS.length * SCENARIOS.length * REPS;
    for (const v of VERSIONS) {
      for (const s of SCENARIOS) {
        const k = `${v}/${s}`;
        const c = collect.cells[k] || { done: 0, total: REPS, errors: 0 };
        totDone += c.done; totErr += c.errors || 0;
        const status = c.done >= REPS ? "✅" : c.done > 0 ? "⏳" : "⏸";
        lines.push(`  ${pad(v + " × " + s, 10)} ${bar(c.done, REPS)} ${pad(c.done + "/" + REPS, 7)} ${status}${c.errors ? "  ⚠️ " + c.errors + "err" : ""}`);
      }
    }
    const pct = ((totDone / totMax) * 100).toFixed(1);
    lines.push("  " + "─".repeat(76));
    lines.push(`  TOTAL: ${totDone}/${totMax} (${pct}%)  errors: ${totErr}`);
  }

  // Scoring phase
  lines.push("\n[Phase 3] Scoring (Opus 4.7)");
  if (!score) {
    lines.push("  (대기 중)");
  } else {
    let totDone = 0, totErr = 0;
    const totMax = VERSIONS.length * SCENARIOS.length * REPS;
    for (const v of VERSIONS) {
      for (const s of SCENARIOS) {
        const k = `${v}/${s}`;
        const c = score.cells[k] || { done: 0, errors: 0 };
        totDone += c.done; totErr += c.errors || 0;
        const status = c.done >= REPS ? "✅" : c.done > 0 ? "⏳" : "⏸";
        lines.push(`  ${pad(v + " × " + s, 10)} ${bar(c.done, REPS)} ${pad(c.done + "/" + REPS, 7)} ${status}${c.errors ? "  ⚠️ " + c.errors + "err" : ""}`);
      }
    }
    const pct = ((totDone / totMax) * 100).toFixed(1);
    lines.push("  " + "─".repeat(76));
    lines.push(`  TOTAL: ${totDone}/${totMax} (${pct}%)  errors: ${totErr}`);
  }

  lines.push("═".repeat(78));
  console.log(lines.join("\n"));
}

if (WATCH) {
  const tick = () => {
    process.stdout.write("\x1Bc"); // clear screen
    render();
  };
  tick();
  setInterval(tick, INTERVAL);
} else {
  render();
}
