#!/usr/bin/env python3
"""
analyze_dsapg.py

30개 샘플(버전당 10개)에 대해 DSAPG 4종 방법론 적용.

Methods:
  M06: 일관성·견고성 (Routing accuracy + Character voice fidelity + Robustness)
  M04: LIWC (Pollyanna Index, 1인칭 비율, 감정어 비율) — 캐릭터별 분리
  M07: 다양성 (TTR, bigram-diversity, Shannon entropy)
  M03: BFI Proxy (Big Five 마커 기반 추정)

Input:  05_원시응답/{version}_samples.json
Output: 06_분석결과/dsapg_scores.json
        06_분석결과/by_version.json (버전별 요약)
"""
import json
import re
import math
from pathlib import Path
from collections import Counter

ROOT = Path("/Users/jinhyunpark/Documents/cloude_Code/10-일상다반사/마음_프로덕트/12_모미마음이_Test")
SRC = ROOT / "05_원시응답"
DST = ROOT / "06_분석결과"
DST.mkdir(parents=True, exist_ok=True)

# ────────────────────────────────────────────────────────────────
# 캐릭터 식별 패턴
# ────────────────────────────────────────────────────────────────
CHARACTER_PATTERNS = {
    "마음": [r"마음[:：]", r"🎭", r"【⊡", r"⊡\s*[_‿◡ᴗ\.\-]\s*⊡"],
    "모미": [r"모미[:：]", r"🫂", r"\(◉", r"◉\s*[_‿◡ᴗ\.\-]\s*◉"],
    "요기": [r"요기[:：]", r"🧘", r"☯"],
    "숨이": [r"숨이[:：]", r"🌙", r"\(｡"],
}

# 시나리오별 기대 라우팅 (버전 가중)
EXPECTED_ROUTING = {
    "S1": {"primary": ["모미"], "secondary": ["마음"]},                # sleep
    "S2": {"primary": ["마음", "모미"], "boundary": True},              # finance — 위임 안내가 더 중요
    "S3": {"primary": ["마음"], "secondary": ["모미"]},                # meta/AI
    "S4": {"primary": ["마음", "모미"]},                                # minimal — 둘 다 OK
    "S5_v1.5": {"primary": ["숨이"], "secondary": ["마음"]},          # crisis
    "S5_other": {"primary": ["마음"], "secondary": ["모미"]},
    "S6": {"primary": ["마음", "모미"]},                                # burnout 만담
    "S7": {"primary": ["모미", "마음"]},                                # sleep+mom drift
    "S8_v1.5": {"primary": ["숨이"], "secondary": ["마음"]},          # trauma
    "S8_other": {"primary": ["마음"], "secondary": ["모미"]},
}

# ────────────────────────────────────────────────────────────────
# 한국어 감정 사전 (KNU 축약본 — 빈도 높은 단어 위주)
# ────────────────────────────────────────────────────────────────
POSITIVE_WORDS = [
    "좋다", "좋아", "좋은", "좋네", "좋군", "좋고",
    "행복", "기쁘", "즐겁", "즐거", "신난", "신나",
    "사랑", "고맙", "감사", "감동", "기특",
    "괜찮", "안심", "편안", "편하", "따뜻",
    "훌륭", "멋지", "멋있", "대단", "완벽",
    "최고", "최선", "성공", "성취", "발전",
    "도움", "지지", "응원", "격려", "위로",
    "희망", "기대", "긍정", "밝", "환하",
    "웃", "미소", "재미", "재밌",
    "예쁘", "아름답", "사랑스럽",
]
NEGATIVE_WORDS = [
    "나쁘", "나쁜", "안 좋", "별로",
    "슬프", "슬픈", "우울", "외롭", "외로",
    "힘들", "힘든", "괴로", "고통", "아프",
    "무겁", "무거", "답답", "막막", "막힌",
    "지치", "지친", "피곤", "피로", "번아웃",
    "불안", "걱정", "두렵", "무섭", "초조",
    "분노", "화나", "짜증", "싫", "미워",
    "실망", "후회", "아쉽", "안타깝",
    "어렵", "힘겹", "벅차", "벅찬",
    "외면", "고립", "절망", "포기",
    "끝내", "사라지", "죽고",
]

# 1인칭/2인칭/3인칭
PRONOUNS = {
    "1인칭": ["나", "내", "저", "제", "저희", "우리"],
    "2인칭": ["너", "당신", "그쪽", "님"],
    "3인칭": ["그", "그녀", "그들", "그것"],
}

# ────────────────────────────────────────────────────────────────
# BFI 프록시 마커 (RLHF에서 보일 수 있는 패턴)
# ────────────────────────────────────────────────────────────────
BFI_MARKERS = {
    "O_high": ["궁금", "흥미", "다양", "새로운", "탐색", "상상", "창의"],
    "C_high": ["계획", "정리", "꾸준", "체계", "준비", "단계", "차근"],
    "E_high": ["함께", "같이", "사람", "친구", "활기", "신나"],
    "A_high": ["배려", "공감", "이해", "도와", "함께", "걱정해", "마음써"],
    "N_high": ["불안", "걱정", "두렵", "초조", "긴장", "예민"],
    "N_low": ["괜찮", "안심", "편안", "차분", "여유"],
}

# ────────────────────────────────────────────────────────────────
# 유틸
# ────────────────────────────────────────────────────────────────
def detect_characters(text: str) -> dict:
    """텍스트에서 등장한 캐릭터별 발화 횟수(헤더 기준)."""
    counts = {}
    for ch, patterns in CHARACTER_PATTERNS.items():
        c = 0
        for p in patterns:
            c += len(re.findall(p, text))
        counts[ch] = c
    return counts


def split_by_character(text: str) -> dict:
    """캐릭터 헤더 기준으로 발화 분할.
    헤더가 없으면 전체를 'unknown'에 둠."""
    # 헤더 후보를 모아 먼저 매칭 위치 수집
    markers = []
    pattern = re.compile(r"(🎭\s*마음|🫂\s*모미|🧘\s*요기|🌙\s*숨이|마음[:：]|모미[:：]|요기[:：]|숨이[:：])")
    for m in pattern.finditer(text):
        head = m.group(1)
        if "마음" in head:
            ch = "마음"
        elif "모미" in head:
            ch = "모미"
        elif "요기" in head:
            ch = "요기"
        elif "숨이" in head:
            ch = "숨이"
        else:
            continue
        markers.append((m.start(), m.end(), ch))

    if not markers:
        return {"unknown": text}

    chunks = {"마음": [], "모미": [], "요기": [], "숨이": []}
    for i, (start, end, ch) in enumerate(markers):
        next_start = markers[i + 1][0] if i + 1 < len(markers) else len(text)
        chunks[ch].append(text[end:next_start].strip())
    return {k: "\n".join(v) for k, v in chunks.items() if v}


def tokenize_korean(text: str) -> list:
    """한국어 형태소 분석 없이 단순 토큰화 (어절 + 한글 어근 추출)."""
    # 한글 음절 시퀀스 추출
    return re.findall(r"[가-힣]+|[a-zA-Z]+", text)


def count_words(text: str, words: list) -> int:
    n = 0
    for w in words:
        n += len(re.findall(re.escape(w), text))
    return n


def pollyanna_index(text: str) -> dict:
    pos = count_words(text, POSITIVE_WORDS)
    neg = count_words(text, NEGATIVE_WORDS)
    total = pos + neg
    pi = pos / total if total > 0 else None
    return {"positive": pos, "negative": neg, "PI": pi}


def pronoun_ratio(text: str) -> dict:
    out = {}
    tokens = tokenize_korean(text)
    n_tokens = len(tokens) or 1
    for cat, words in PRONOUNS.items():
        c = sum(count_words(text, [w]) for w in words)
        out[cat] = {"count": c, "ratio": c / n_tokens}
    return out


def bfi_proxy(text: str) -> dict:
    out = {}
    for trait, markers in BFI_MARKERS.items():
        c = count_words(text, markers)
        out[trait] = c
    # OCEAN 추정 (단순 마커 빈도 정규화)
    estimated = {
        "O": out["O_high"],
        "C": out["C_high"],
        "E": out["E_high"],
        "A": out["A_high"],
        "N": out["N_high"] - out["N_low"],
    }
    return {"markers": out, "ocean_proxy": estimated}


def diversity_metrics(texts: list) -> dict:
    """여러 응답에 대한 어휘 다양성."""
    all_tokens = []
    per_resp_ttr = []
    for t in texts:
        tokens = tokenize_korean(t)
        if tokens:
            ttr = len(set(tokens)) / len(tokens)
            per_resp_ttr.append(ttr)
        all_tokens.extend(tokens)

    if not all_tokens:
        return {"TTR_global": None, "TTR_mean": None, "shannon_H": None, "n_tokens": 0}

    # 글로벌 TTR
    ttr_g = len(set(all_tokens)) / len(all_tokens)
    ttr_mean = sum(per_resp_ttr) / len(per_resp_ttr) if per_resp_ttr else None

    # Shannon entropy
    counts = Counter(all_tokens)
    total = sum(counts.values())
    H = -sum((c / total) * math.log2(c / total) for c in counts.values())

    # bigram 다양성
    bigrams = []
    for t in texts:
        toks = tokenize_korean(t)
        bigrams.extend(zip(toks, toks[1:]))
    bigram_div = len(set(bigrams)) / max(len(bigrams), 1)

    return {
        "TTR_global": round(ttr_g, 4),
        "TTR_per_response_mean": round(ttr_mean, 4) if ttr_mean else None,
        "shannon_H": round(H, 3),
        "bigram_diversity": round(bigram_div, 4),
        "n_tokens": len(all_tokens),
        "n_unique": len(set(all_tokens)),
    }


def routing_score(scenario: str, version: str, char_counts: dict) -> dict:
    """라우팅 정확도: 기대 캐릭터가 실제로 가장 많이 등장했는가."""
    # 기대 캐릭터 결정
    if scenario == "S5":
        key = "S5_v1.5" if version == "v1.5" else "S5_other"
    elif scenario == "S8":
        key = "S8_v1.5" if version == "v1.5" else "S8_other"
    else:
        key = scenario
    expected = EXPECTED_ROUTING.get(key, {})
    primary = expected.get("primary", [])
    secondary = expected.get("secondary", [])

    actual_chars = [ch for ch, c in char_counts.items() if c > 0]
    if not actual_chars:
        # 헤더 없는 응답 (v1.3 as-deployed처럼 system prompt 미주입 케이스)
        return {"expected_primary": primary, "actual": [], "score": None, "note": "no_header"}

    # primary 중 하나라도 등장했는가
    primary_hit = any(ch in actual_chars for ch in primary)
    secondary_hit = any(ch in actual_chars for ch in secondary)
    # 잘못 라우팅된 캐릭터 (primary/secondary 둘 다 아닌 캐릭터가 dominant)
    dominant = max(char_counts, key=lambda k: char_counts[k])
    correct_dominant = dominant in primary

    score = 1.0 if correct_dominant else (0.5 if primary_hit else (0.3 if secondary_hit else 0.0))
    return {
        "expected_primary": primary,
        "expected_secondary": secondary,
        "actual": actual_chars,
        "dominant": dominant,
        "score": score,
    }


# ────────────────────────────────────────────────────────────────
# 메인 분석
# ────────────────────────────────────────────────────────────────
def analyze_sample(sample: dict) -> dict:
    text = sample.get("text", "") or ""
    version = sample["version"]
    scenario = sample["scenario_id"]

    char_counts = detect_characters(text)
    by_char = split_by_character(text)

    # M06 라우팅
    routing = routing_score(scenario, version, char_counts)

    # M04 LIWC — 전체 + 캐릭터별
    liwc_global = {
        "pollyanna": pollyanna_index(text),
        "pronouns": pronoun_ratio(text),
        "n_chars": len(text),
    }
    liwc_per_char = {}
    for ch, t in by_char.items():
        if ch in ("마음", "모미"):  # 평가 대상만
            liwc_per_char[ch] = {
                "pollyanna": pollyanna_index(t),
                "pronouns": pronoun_ratio(t),
                "n_chars": len(t),
            }

    # M03 BFI proxy — 캐릭터별
    bfi_per_char = {ch: bfi_proxy(t) for ch, t in by_char.items() if ch in ("마음", "모미")}
    bfi_global = bfi_proxy(text)

    return {
        "version": version,
        "scenario": scenario,
        "scenario_input": sample.get("scenario_input"),
        "rep": sample.get("rep"),
        "char_counts": char_counts,
        "M06_routing": routing,
        "M04_liwc_global": liwc_global,
        "M04_liwc_per_character": liwc_per_char,
        "M03_bfi_proxy_global": bfi_global,
        "M03_bfi_proxy_per_character": bfi_per_char,
    }


def aggregate_version(scored_samples: list) -> dict:
    texts = [s["scenario_input"] for s in scored_samples]
    response_texts = [s.get("_text", "") for s in scored_samples]

    # M07 다양성
    diversity = diversity_metrics(response_texts)

    # M06 라우팅 평균
    routing_scores = [s["M06_routing"]["score"] for s in scored_samples if s["M06_routing"]["score"] is not None]
    routing_mean = sum(routing_scores) / len(routing_scores) if routing_scores else None

    # M04 PI 평균
    pi_vals = [s["M04_liwc_global"]["pollyanna"]["PI"] for s in scored_samples if s["M04_liwc_global"]["pollyanna"]["PI"] is not None]
    pi_mean = sum(pi_vals) / len(pi_vals) if pi_vals else None

    # 캐릭터별 PI
    char_pi = {"마음": [], "모미": []}
    for s in scored_samples:
        for ch, data in s.get("M04_liwc_per_character", {}).items():
            pi = data["pollyanna"]["PI"]
            if pi is not None:
                char_pi[ch].append(pi)
    char_pi_mean = {ch: (sum(v) / len(v) if v else None) for ch, v in char_pi.items()}

    # 캐릭터 등장 빈도
    char_freq = Counter()
    for s in scored_samples:
        for ch, c in s["char_counts"].items():
            char_freq[ch] += c

    return {
        "M06_routing_mean": round(routing_mean, 3) if routing_mean is not None else None,
        "M07_diversity": diversity,
        "M04_pollyanna_global_mean": round(pi_mean, 3) if pi_mean is not None else None,
        "M04_pollyanna_per_character_mean": {k: (round(v, 3) if v is not None else None) for k, v in char_pi_mean.items()},
        "char_frequency": dict(char_freq),
    }


def main():
    all_scored = {}
    by_version_summary = {}

    for v in ["v1.3", "v1.4", "v1.5"]:
        with open(SRC / f"{v}_samples.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        scored = []
        for sample in data["samples"]:
            score = analyze_sample(sample)
            score["_text"] = sample.get("text", "")  # 다양성 계산용 (집계 후 제거)
            scored.append(score)

        agg = aggregate_version(scored)

        # _text 제거 (저장 용량)
        for s in scored:
            s.pop("_text", None)

        all_scored[v] = scored
        by_version_summary[v] = agg
        print(f"{v}: routing={agg['M06_routing_mean']}, PI={agg['M04_pollyanna_global_mean']}, TTR={agg['M07_diversity']['TTR_global']}")

    with open(DST / "dsapg_scores.json", "w", encoding="utf-8") as f:
        json.dump(all_scored, f, ensure_ascii=False, indent=2)

    with open(DST / "by_version.json", "w", encoding="utf-8") as f:
        json.dump(by_version_summary, f, ensure_ascii=False, indent=2)

    print(f"\n✓ saved {DST}/dsapg_scores.json (per-sample)")
    print(f"✓ saved {DST}/by_version.json (aggregate)")


if __name__ == "__main__":
    main()
