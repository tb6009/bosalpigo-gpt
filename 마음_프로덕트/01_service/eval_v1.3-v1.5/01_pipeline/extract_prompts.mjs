#!/usr/bin/env node
/**
 * extract_prompts.mjs
 * 각 버전의 index.html에서 system prompt 빌더 함수를 추출·평가하여
 * 02_data/system_prompts/{version}.txt 로 저장.
 *
 * Phase 1 산출물.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../../../"); // 10-일상다반사
const APP_DIR = path.join(ROOT, "outputs/마음_앱");
const OUT_DIR = path.resolve(__dirname, "../02_data/system_prompts");

fs.mkdirSync(OUT_DIR, { recursive: true });

const TARGETS = [
  {
    version: "v1.3",
    file: path.join(APP_DIR, "v1.3/index.html"),
    fnName: "buildSystemPrompt",
    versionLiteral: "1.3",
  },
  {
    version: "v1.4",
    file: path.join(APP_DIR, "index.html"),
    fnName: "buildPrompt",
    versionLiteral: "1.4",
  },
  {
    version: "v1.5",
    file: path.join(APP_DIR, "v1.5/index.html"),
    fnName: "buildPrompt",
    versionLiteral: "1.5β",
  },
];

// Stub for browser-only dependencies (localStorage, LS, etc.)
const stubGlobals = `
  const localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  const LS = { SCALES: "scales", RECENT: "recent", PROFILE: "profile", PROMISES: "promises", DAILY: "daily", PROFILE_HASH: "profile_hash" };
  // Profile fixed at "first-time visitor" (no name) to control for profile effects
  const __profile = {};
`;

function extractFunctionBody(source, fnName) {
  // Find: function NAME( ... ) {
  const startRegex = new RegExp(
    "function\\s+" + fnName + "\\s*\\([^)]*\\)\\s*\\{",
    "m"
  );
  const startMatch = source.match(startRegex);
  if (!startMatch) {
    throw new Error(`Function ${fnName} not found`);
  }
  const fnStart = startMatch.index;
  let braceCount = 0;
  let i = fnStart + startMatch[0].length;
  braceCount = 1;
  // We're now AFTER the opening `{`. Walk forward, tracking braces while
  // respecting string/template/comment boundaries.
  while (i < source.length && braceCount > 0) {
    const ch = source[i];
    // Skip string literals
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i++;
      while (i < source.length && source[i] !== quote) {
        if (source[i] === "\\") i += 2;
        else i++;
      }
      i++;
      continue;
    }
    // Skip template literals (allow nested ${...})
    if (ch === "`") {
      i++;
      while (i < source.length && source[i] !== "`") {
        if (source[i] === "\\") {
          i += 2;
          continue;
        }
        if (source[i] === "$" && source[i + 1] === "{") {
          i += 2;
          let inner = 1;
          while (i < source.length && inner > 0) {
            if (source[i] === "{") inner++;
            else if (source[i] === "}") inner--;
            if (inner > 0) i++;
          }
          i++;
        } else {
          i++;
        }
      }
      i++;
      continue;
    }
    // Skip comments
    if (ch === "/" && source[i + 1] === "/") {
      while (i < source.length && source[i] !== "\n") i++;
      continue;
    }
    if (ch === "/" && source[i + 1] === "*") {
      i += 2;
      while (i < source.length - 1 && !(source[i] === "*" && source[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (ch === "{") braceCount++;
    else if (ch === "}") braceCount--;
    i++;
  }
  return source.substring(fnStart, i); // includes outer braces
}

async function main() {
  const summary = [];
  for (const t of TARGETS) {
    console.log(`\n[${t.version}] reading ${path.relative(ROOT, t.file)}`);
    const html = fs.readFileSync(t.file, "utf8");
    const fnSrc = extractFunctionBody(html, t.fnName);
    console.log(`  function source: ${fnSrc.length} chars`);

    // Detect missing `return` (v1.3 production bug). Fall back to extracting
    // the `profileBlock` variable directly, evaluating its false-branch
    // (empty-profile case) — which is the intended prompt content.
    const hasReturn = /\breturn\b/.test(fnSrc);
    if (!hasReturn) {
      console.warn(
        `  ⚠️ ${t.version}: function has NO 'return' statement. ` +
        `Production likely sends system=undefined. ` +
        `Falling back to profileBlock value (intended prompt).`
      );
    }
    const fnBodySrc = hasReturn
      ? `
        ${stubGlobals}
        const VERSION = ${JSON.stringify(t.versionLiteral)};
        ${fnSrc}
        return ${t.fnName}(__profile);
      `
      : `
        ${stubGlobals}
        const VERSION = ${JSON.stringify(t.versionLiteral)};
        // Strip the wrapping function declaration so the body executes inline,
        // then return profileBlock directly.
        ${fnSrc.replace(/^function\s+\w+\s*\([^)]*\)\s*\{/, "(function(profile){").replace(/\}$/, "; return profileBlock; })")}(__profile);
      `;

    // For non-return functions we wrap differently: replace declaration with
    // an IIFE that returns profileBlock at the end.
    const finalSrc = hasReturn
      ? fnBodySrc
      : `
        ${stubGlobals}
        const VERSION = ${JSON.stringify(t.versionLiteral)};
        ${fnSrc.replace(/^function\s+\w+\s*\(([^)]*)\)\s*\{/, "function __wrapped($1) {")
              .replace(/\}\s*$/, "  ; return profileBlock; }")}
        return __wrapped(__profile);
      `;
    let prompt;
    try {
      const runner = new Function(finalSrc);
      prompt = runner();
    } catch (e) {
      console.error(`  ❌ eval failed: ${e.message}`);
      throw e;
    }

    if (typeof prompt !== "string") {
      throw new Error(`${t.version}: result is ${typeof prompt}, not string`);
    }
    const outPath = path.join(OUT_DIR, `${t.version}.txt`);
    fs.writeFileSync(outPath, prompt, "utf8");
    const tokens = Math.round(prompt.length / 3.5); // rough estimate
    console.log(`  ✅ wrote ${path.relative(ROOT, outPath)}`);
    console.log(`     length: ${prompt.length} chars (~${tokens} tokens)`);
    summary.push({ version: t.version, chars: prompt.length, est_tokens: tokens });
  }

  // Write manifest
  const manifest = {
    extracted_at: new Date().toISOString(),
    profile_used: "empty (first-time visitor)",
    targets: TARGETS.map((t) => ({ version: t.version, source: path.relative(ROOT, t.file), fn: t.fnName })),
    summary,
  };
  fs.writeFileSync(
    path.join(OUT_DIR, "_manifest.json"),
    JSON.stringify(manifest, null, 2)
  );
  console.log(`\n📋 manifest: ${path.relative(ROOT, path.join(OUT_DIR, "_manifest.json"))}`);
  console.log("\n✅ Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
