# Prompt Leakage Audit (Phase 4.5)

Generated: 2026-04-26T02:31:28.879Z

## Method

For each response, check if it contains a verbatim 30-char substring from the system prompt (excluding common phrases).

## Findings

- Total responses checked: 240
- Responses with leakage: 0 (0.0%)

✅ No prompt leakage detected.