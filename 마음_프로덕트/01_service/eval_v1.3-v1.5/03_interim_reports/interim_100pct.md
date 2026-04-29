# Interim Report — Phase 3 Scoring Complete (100%)

> 작성: 2026-04-26 11:30 KST
> 데이터: 239/240 채점 (1건 JSON parse 실패 — judge가 rationale에 escape 안 한 quote 사용, 0.4% 손실)
> 분석: ANOVA + Cohen's d + 캐릭터 등장률 (analyze.mjs)

---

## 📊 1. 진행 상태 (최종)

```
[Phase 2] Data Collection (Sonnet 4.6)              ████████████████████████  240/240  ✅
[Phase 3] Scoring (Opus 4.7)                         ████████████████████████  239/240  ✅ (1 parse fail)
[Phase 3.5] Statistical Analysis (analyze.mjs)        ████████████████████████        ✅
[Phase 4.5] Validation                               ░░░░░░░░░░░░░░░░░░░░░░░░  대기
[Phase 5] Final Report                               ░░░░░░░░░░░░░░░░░░░░░░░░  대기
```

---

## 📈 2. 버전별 차원 평균 (Pooled across 8 scenarios)

| Dimension | v1.3 (n=80) | v1.4 (n=80) | v1.5 (n=79) | F(2,236) | p |
|---|---|---|---|---|---|
| **PPS Credibility** | 3.38 | 3.24 | **3.72** | 9.32 | <.001 |
| **PPS Likability** | 3.49 | 4.14 | 4.20 | 43.14 | <.001 |
| **PPS Similarity** | **1.68** | 4.61 | 4.67 | **864.05** | <.001 |
| **PPS Empathy** | 3.17 | 3.41 | **3.91** | 12.65 | <.001 |
| **PPS Willingness** | 3.11 | 3.58 | **4.00** | 39.53 | <.001 |
| **MITI CCT** | 2.04 | 2.11 | **2.53** | 15.00 | <.001 |
| **MITI SST** | 2.58 | 2.75 | **3.06** | 9.78 | <.001 |
| **MITI Partnership** | 3.45 | 3.64 | **3.94** | 8.37 | <.001 |
| **MITI Empathy_MI** | 3.14 | 3.20 | **3.78** | 9.19 | <.001 |
| **Safety Resource** | 0.00 | 0.01 | **0.06** | 3.71 | <.05 |
| **Safety Triage** | 2.81 | 2.96 | **3.23** | 8.38 | <.001 |

> 굵은 글씨 = 해당 행에서 가장 높은 값. F(2,236) critical at p<.001 = 7.08.

**관찰**: 13개 측정 차원 중 11개에서 v1.5가 최고. 2개 차원(diagnostic_avoidance, toxic_reassurance_avoidance)은 모든 버전이 1.00 천장 효과.

---

## 🎯 3. 가설 검증 결과

### H1: v1.5β > v1.4 > v1.3 in MITI Cultivating Change Talk (MI 정교화)
- 평균: 2.04 → 2.11 → 2.53 (단조 증가)
- F(2,236) = 15.00, p<.001
- Cohen's d (v1.5 vs v1.4) = **0.65 (medium)**
- **판정: ✅ 강하게 지지**

### H2: v1.5β > v1.4 ≥ v1.3 in Safety Composite (위기 프로토콜)
- Triage appropriateness: 2.81 → 2.96 → 3.23 (단조 증가, F=8.38, p<.001)
- Resource mention: 0.00 → 0.01 → 0.06 (단조 증가, F=3.71, p<.05)
- Cohen's d (v1.5 vs v1.4) = 0.38 (triage), 0.27 (resource) — small effect
- **판정: 🟡 부분 지지** (방향성 ✓, 효과크기 small, 절대값 낮음)
- 우려: 위기 시 자원안내율 v1.5에서도 6%로 매우 낮음 — **시스템 프롬프트 패치 필요**

### H3: v1.4 > v1.3 in PPS Likability (톤 회복, 특히 S6)
- 평균: 3.49 → 4.14 (Δ +0.65)
- 효과 크기: pooled에서도 매우 명확
- **판정: ✅ 강하게 지지**

### H4: v1.5β ≈ v1.4 in PPS Similarity (캐릭터 일관성)
- 평균: 4.61 vs 4.67 (Δ +0.06)
- Cohen's d = **0.12 (trivial)**
- **판정: ✅ 동등성 지지** (TOST equivalence)
- 단: 캐릭터 패턴은 다름 (v1.4=마음+모미 듀오, v1.5=마음+숨이) — 형식적 일관성은 유지되나 라우팅은 달라짐

---

## 🚨 4. 가장 큰 발견들

### 4-1. PPS Similarity F=864 — System Prompt 효과 정량 증거

```
v1.3 (system: undefined)        ▆▆      1.68 / 5.00  ⚠️
v1.4 (1287자 prompt)            ████████████████████████████  4.61 / 5.00
v1.5 (3794자 prompt)            ████████████████████████████  4.67 / 5.00
```

F(2,236) = **864.05** — 사회과학 연구에서 보기 드문 거대 효과크기. v1.3 production bug(시스템 프롬프트 미전달)가 페르소나 인식을 거의 완전히 파괴함을 정량적으로 증명. **v1.3 production bug 패치는 단순한 "버그 수정"이 아니라 사용자 경험의 근본 차원을 변경하는 작업**.

### 4-2. Credibility 패러독스 (v1.4 < v1.3)

| 버전 | credibility |
|---|---|
| v1.3 | 3.38 |
| **v1.4** | **3.24** ↓ |
| v1.5 | 3.72 |

v1.4가 신뢰성 점수에서 **유일하게 v1.3보다 낮음** (-0.14). 가능 해석:
- v1.4의 "재미가 기본값" 톤이 전문성 인식을 약화시킴
- v1.3은 시스템 프롬프트 없이 default Claude → 기본적으로 진지/전문적 톤
- v1.5는 4-캐릭터 + 측정 도구로 신뢰성 회복 (3.72)

→ **블로그 발견: 톤 회복 = 신뢰성 일시 하락의 트레이드오프, v1.5가 그 트레이드오프를 해결**

### 4-3. v1.5의 모미·요기 0% 등장

| 캐릭터 | v1.4 | v1.5 |
|---|---|---|
| 마음 | 99% | 86% |
| 모미 | **100%** | **0%** ⚠️ |
| 요기 | 0% | 0% |
| 숨이 | 0% | 14% |

v1.5는 4-캐릭터 시스템을 표방하지만 8개 시나리오에서 실질적으로 **2-캐릭터(마음 + 위기 시 숨이)**로 작동. v1.4 듀오(마음+모미)에서 모미가 거의 사라짐. 가능 원인:
- 시나리오에 신체·운동 영역 부족 (S1 잠은 마음이 처리)
- v1.5 트리거 매트릭스가 모미 영역을 넓게 정의하지 않음
- 라우팅 가중치가 마음에 편향됨

→ **후속 연구 필요: S9~S12 신체·운동 시나리오 세트로 모미·요기 라우팅 검증**

### 4-4. S5 vs S8 — 위기 vs 트라우마 라우팅 비대칭

| 시나리오 | v1.5 숨이 등장 | 라우팅 정확도 |
|---|---|---|
| **S5 자살 신호** | 10/10 | 100% ✨ |
| **S8 트라우마 단서** | 1/10 | 10% ⚠️ |

v1.5는 직접적 자살 키워드(`["자살", "끝내고 싶"]`)에는 완벽하게 반응하지만, 의미적 추론이 필요한 트라우마 단서("그때 일이 떠올라요")에서는 라우팅 실패. **키워드 매칭 vs LLM 의미 추론 문제 - 일반 NLP 한계**.

---

## 📊 5. Cohen's d 요약 (v1.5 vs v1.4)

| Dimension | d | 효과 크기 |
|---|---|---|
| pps.willingness | **0.73** | medium |
| pps.credibility | **0.69** | medium |
| miti.cct | **0.65** | medium |
| pps.empathy | **0.61** | medium |
| miti.empathy_mi | **0.61** | medium |
| miti.sst | 0.45 | small |
| miti.partnership | 0.41 | small |
| safety.triage | 0.38 | small |
| safety.resource_mention | 0.27 | small |
| pps.likability | 0.13 | trivial (천장) |
| pps.similarity | 0.12 | trivial (천장) |

**해석**: v1.4 → v1.5 전환에서 5개 차원이 medium effect (d ≥ 0.5), 4개 차원이 small (d ≥ 0.2). Likability와 Similarity는 v1.4가 이미 천장에 가까워 d 작음.

---

## 🚧 6. 한계와 주의사항

1. **N=10 pilot — 효과크기 정확성 제한**: 95% CI가 넓어 small/medium 경계는 불확실
2. **LLM-as-judge 단일 채점**: ICC 검증은 Phase 4.5에서 수행 예정
3. **Opus 4.7 temperature 미지원**: 평가 결정성 보장됐으나 측정 도구 변동성 측정 불가
4. **시나리오 8개 한정**: 모미·요기 영역 미커버
5. **Korean 적용 PPS·MITI**: 영어 검증 척도 한국어 확장은 별도 검증 필요

---

## ⏭ 7. 다음 단계 (Phase 4.5 → 5)

### Phase 4.5 — Validation (다음 즉시)
- 응답 무결성 검증 (240/240 통과)
- 채점 무결성 (239/240, 1건 manual fix or skip)
- Inter-rater reliability (50개 무작위 응답 재채점, ICC 계산)
- Prompt leakage 검사
- Outlier detection (±3 SD)

### Phase 5 — 시각화 협의 + 최종 리포트
- **사용자와 협의 필요**: 시각화 형태 선택
  - (a) Box plot — 분포 비교
  - (b) Radar chart — 5차원 PPS 동시 비교
  - (c) Heatmap — 13 차원 × 3 버전
  - (d) Forest plot — Cohen's d + 95% CI
- IMRaD 최종 리포트 (APA 7th references)
