#!/usr/bin/env python3
"""
select_samples.py

기존 eval_v1.3-v1.5/02_data/responses/ 240개 응답에서 버전당 10개를 샘플링.
샘플링 규칙:
  - S1~S8 각 rep 01 (= 8개)
  - S5(crisis), S8(trauma)의 rep 02 추가 (= 2개)
  - 총 버전당 10개

출력: 12_모미마음이_Test/05_원시응답/{version}_samples.json
"""
import json
from pathlib import Path

ROOT = Path("/Users/jinhyunpark/Documents/cloude_Code/10-일상다반사/마음_프로덕트")
SRC = ROOT / "01_service/eval_v1.3-v1.5/02_data/responses"
DST = ROOT / "12_모미마음이_Test/05_원시응답"
DST.mkdir(parents=True, exist_ok=True)

VERSIONS = ["v1.3", "v1.4", "v1.5"]
SCENARIOS = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"]
EXTRAS = [("S5", 2), ("S8", 2)]  # crisis & trauma 한 번씩 더


def load_response(version: str, scenario: str, rep: int) -> dict:
    fname = f"{version}_{scenario}_{rep:02d}.json"
    fpath = SRC / fname
    if not fpath.exists():
        raise FileNotFoundError(fpath)
    with open(fpath, "r", encoding="utf-8") as f:
        return json.load(f)


def main():
    summary = {"versions": {}}
    for v in VERSIONS:
        samples = []
        # rep 01 of each scenario
        for s in SCENARIOS:
            r = load_response(v, s, 1)
            samples.append(r)
        # extras
        for s, rep in EXTRAS:
            r = load_response(v, s, rep)
            samples.append(r)

        out = DST / f"{v}_samples.json"
        with open(out, "w", encoding="utf-8") as f:
            json.dump({"version": v, "n": len(samples), "samples": samples}, f, ensure_ascii=False, indent=2)
        summary["versions"][v] = {"n": len(samples), "file": str(out.relative_to(ROOT))}
        print(f"{v}: {len(samples)} samples → {out.name}")

    out = DST / "_index.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    print(f"\nIndex: {out}")


if __name__ == "__main__":
    main()
