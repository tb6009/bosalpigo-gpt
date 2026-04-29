# AI 챗봇 캐릭터 연구를 위한 평가 모델·도구 종합 가이드

> 작성: 2026-04-26
> 대상: 보살피고처럼 다중 캐릭터 + 멘탈웰니스 + MI 기반 챗봇 연구
> 본 평가에서 쓴 것 = ✅ / 쓸 수 있는 것 = ⚪ / 후속 연구 권장 = 🟡

---

## 0. 전체 분류 지도

```
A. 페르소나 인식 (Persona Perception) — 사용자가 캐릭터를 어떻게 지각하나
B. 성격·정체성 일관성 (Personality / Identity)
C. 대화 품질·치료 충실도 (Dialogue Quality / Therapy Fidelity)
D. 감정·공감 (Empathy / Emotional Support)
E. 안전성·임상 위기 (Safety / Clinical Crisis)
F. 측정 도구 (Self-Report Scales) — 챗봇이 사용자에게 적용
G. 다중 캐릭터·라우팅 (Multi-Agent / Routing)
H. 메타 평가자 (LLM-as-judge 자체 검증)
I. 한국 문화 특이성
J. 박사논문 DSAPG 방법론 직결
```

---

## A. 페르소나 인식 — "이 캐릭터가 그럴듯한가?"

### A-1. PPS-28 (Persona Perception Scale) — ✅ 본 평가에서 사용

| 항목 | 내용 |
|---|---|
| **저자** | Salminen et al. (2020) |
| **저널** | International Journal of Human-Computer Studies, vol. 141 |
| **DOI** | 10.1016/j.ijhcs.2020.102437 |
| **차원 수** | 28 항목 → **5 하위 척도** |
| **하위 척도** | 1) Credibility (신뢰성) 2) Likability (호감) 3) Similarity (캐릭터다움/유사성) 4) Empathy (공감) 5) Willingness-to-Use (재이용 의지) |
| **척도 형식** | 1–5 Likert |
| **검증 표본** | 원래 정적 페르소나 (디자인 산출물) 대상, 후속 연구에서 대화형 에이전트로 확장 |
| **한국어 적용** | 본 평가에서 LLM-as-judge로 한국어 응답에 적용 (단, 심리측정학적 한국어 검증은 미완) |
| **장점** | UX 학계 표준, 28문항으로 망라성 좋음 |
| **단점** | 영어 검증 — 한국어 사용자 자기보고에는 별도 번역·검증 필요 |
| **본 평가 결과** | F(2,237) = 9.32–869.43 — 모든 5차원에서 버전 효과 검출 |

### A-2. PPS-Quick (10항목 단축형) — ⚪ 후속 활용 가능

| 항목 | 내용 |
|---|---|
| **저자** | Salminen et al. (2021) |
| **항목 수** | 10항목 (PPS-28의 핵심만) |
| **언제 쓰나** | 사용자 자기보고 빠르게 받을 때, A/B 테스트 |
| **본 연구 적용** | 향후 사용자 패널 평가 (Phase 3 — User feedback) 시 PPS-Quick 권장 |

### A-3. UX Persona Evaluation Survey — ⚪ 디자인 단계용

| 항목 | 내용 |
|---|---|
| **저자** | Sinha & Swearingen (UPA 2002 발표 형태) |
| **차원** | 페르소나 디자인의 작동성 (디자인 도구 평가용) |
| **본 연구 부적합** | 챗봇 응답 평가가 아닌 페르소나 문서 자체 평가 도구 |

### A-4. Persona Empathy Map — ⚪ 정성 보조

| 항목 | 내용 |
|---|---|
| **차원** | Says / Thinks / Does / Feels |
| **용도** | 캐릭터 응답이 4사분면을 균형 있게 표현하는지 정성 검토 |
| **본 연구 부합도** | 모미·마음·요기·숨이 각 캐릭터의 4사분면 표현 검토 가능 |

---

## B. 성격·정체성 일관성

### B-1. Big Five Inventory (BFI) → LLM 적용 — ⚪

| 항목 | 내용 |
|---|---|
| **원천** | Costa & McCrae 1992 (OCEAN 5요인) |
| **LLM 적용 사례** | Karra et al. (2022); Miotto et al. (2022) — LLM에 BFI 자기보고시켜 페르소나 측정 |
| **차원** | 외향성·신경증·성실성·우호성·개방성 |
| **본 연구 적용 가능** | 마음("츤데레 코미디언")·모미("친언니 트레이너")·숨이("조용+단단")의 BFI 프로파일 측정 |
| **방법** | 각 캐릭터에게 BFI 44문항 1인칭으로 답하게 → 캐릭터 간 BFI 거리 계산 |

### B-2. PsychoBench — ⚪ LLM 성격 평가 종합

| 항목 | 내용 |
|---|---|
| **저자** | Huang et al. (2023) |
| **arXiv** | 2310.01386 |
| **포함 도구** | 13개 심리척도 (BFI, MBTI, DTDD, Empathy, EQ 등) |
| **장점** | 한 번에 다축 측정 |
| **본 연구 적용** | v1.5β의 4 캐릭터에 PsychoBench 풀세트 적용 → "캐릭터별 성격 프로파일이 의도대로 잡혔나" 검증 |

### B-3. RoleEval / RoleBench — ⚪ 캐릭터 일관성

| 항목 | 내용 |
|---|---|
| **저자** | Shen et al. (2023) — RoleEval |
| **arXiv** | 2312.16132 |
| **차원** | 1) 캐릭터 정체성 일관성 2) 대화 자연스러움 3) 역할 안정성 |
| **방법** | 동일 캐릭터에 다양한 트리거 → 일관성 측정 |
| **본 평가 인접 차원** | PPS Similarity (4.61 vs 4.67) 와 비슷 — 그러나 RoleEval은 보다 정밀한 "캐릭터 깨짐 (breaking character)" 검출 |

### B-4. Personality Faithfulness — ⚪

| 항목 | 내용 |
|---|---|
| **저자** | Wang et al. (2024) — Character LLM |
| **차원** | 캐릭터가 의도된 성격에 얼마나 충실한지 |
| **방법** | 캐릭터 사전 정의 vs 실제 응답의 거리 |

---

## C. 대화 품질·치료 충실도

### C-1. MITI 4.2.1 (Motivational Interviewing Treatment Integrity) — ✅ 본 평가에서 사용

| 항목 | 내용 |
|---|---|
| **저자** | Moyers et al. (2016, 2014) |
| **버전** | 4.2.1 (현재 표준) |
| **차원** | **글로벌 점수 4개**: Cultivating Change Talk (CCT), Softening Sustain Talk (SST), Partnership, Empathy<br>**행동 카운트**: Open Question, Reflection, Complex Reflection 등 |
| **척도** | Global 1–5, 카운트 정수 |
| **쓰임** | MI(동기강화면담) 임상 충실도 평가 표준 |
| **본 평가 결과** | 모든 글로벌에서 v1.3 < v1.4 < v1.5β 단조 증가, CCT d = 0.64 |

### C-2. MISC (Motivational Interviewing Skill Code) — ⚪ MITI 전신, 더 세밀

| 항목 | 내용 |
|---|---|
| **저자** | Pérez-Rosas et al. (2017+) |
| **차원** | 발화별 분류 (Reflection-Simple/Complex, Question-Open/Closed, MI Adherent/Non-adherent) |
| **본 연구 적용** | MITI 글로벌이 너무 거시적이면 MISC로 발화 단위 분석 |

### C-3. WoZ (Wizard-of-Oz) 프로토콜 — ⚪ 대화 품질

| 항목 | 내용 |
|---|---|
| **방법** | 인간 평가자가 챗봇과 사용자 역할 동시에 → 자연스러움 측정 |
| **본 연구 적용** | 사용자 패널 단계에서 활용 가능 |

### C-4. CARE (Consultation and Relational Empathy) — ⚪ 의료 대화 평가

| 항목 | 내용 |
|---|---|
| **저자** | Mercer & Reynolds (2002) |
| **항목** | 10항목, 의사-환자 관계 |
| **본 연구 적용** | 모미가 "몸 메커니즘 설명"하는 발화에 의료 커뮤니케이션 차원 측정 |

### C-5. PEC (Perceived Empathy of Conversational AI) — ⚪ AI 특화

| 항목 | 내용 |
|---|---|
| **저자** | Concannon & Tomalin (2023) |
| **차원** | AI 챗봇 공감 4개 차원 (인지·정서·동기·환경) |
| **본 연구 인접** | PPS Empathy 와 보완 |

---

## D. 감정·공감

### D-1. EmpatheticDialogues / EMPATHIC framework — ⚪ 공감 응답 평가

| 항목 | 내용 |
|---|---|
| **저자** | Rashkin et al. (2019) Facebook |
| **데이터셋** | 25K 대화, 32개 감정 라벨 |
| **본 연구 적용** | S1·S5·S6·S7·S8을 EmpatheticDialogues 분류기로 채점 → 추가 차원 |

### D-2. ESConv (Emotional Support Conversation) — ⚪ 감정 지지 대화

| 항목 | 내용 |
|---|---|
| **저자** | Liu et al. (2021) |
| **arXiv** | 2106.01144 |
| **차원** | 8 단계 감정 지지 (탐색·통찰·행동) + 8 전략 (반영·재구조·자기개방 등) |
| **본 연구 적용** | 본 평가의 시나리오 응답을 ESConv 프레임으로 재분석하면 v1.5의 단계 분포 측정 가능 |

### D-3. EQ (Empathy Quotient) — ⚪

| 항목 | 내용 |
|---|---|
| **저자** | Baron-Cohen & Wheelwright (2004) |
| **항목** | 60항목 (단축 22항목) |
| **본 연구 적용** | 사용자 자기보고 — "이 챗봇과 대화 후 공감받았나" |

---

## E. 안전성·임상 위기

### E-1. Safety Composite (자체 정의) — ✅ 본 평가에서 사용

| 항목 | 내용 |
|---|---|
| **구성** | Resource Mention (0/1) / Diagnostic Avoidance (0/1) / Toxic Reassurance Avoidance (0/1) / Triage Appropriateness (1–5) |
| **본 평가 결과** | 자원안내 v1.5β 6%만 — 시급한 패치 영역 |

### E-2. ASIST (Applied Suicide Intervention Skills Training) — ⚪ 자살 대응 표준

| 항목 | 내용 |
|---|---|
| **출처** | LivingWorks |
| **차원** | Connect → Understand → Assist 3단계 |
| **본 연구 적용** | S5 위기 응답이 ASIST 3단계를 따르는지 채점 가능 |

### E-3. Trauma-Informed Care (TIC) — ✅ v1.5β에 반영

| 항목 | 내용 |
|---|---|
| **출처** | SAMHSA (2014) — 6 원칙 |
| **6 원칙** | Safety / Trustworthiness / Peer Support / Collaboration / Empowerment / Cultural-Historical |
| **본 연구 적용** | v1.5β 숨이 캐릭터 시스템 프롬프트에 직접 명시 — 후속 연구로 6 원칙별 응답 점수화 가능 |

### E-4. C-SSRS (Columbia Suicide Severity Rating Scale) — 🟡 v1.5β에 명시되었으나 미활성

| 항목 | 내용 |
|---|---|
| **저자** | Posner et al. (2011) |
| **항목** | 6 핵심 질문 (Screener) |
| **본 연구 적용** | v1.5β 시스템 프롬프트에 "C-SSRS Screener (Phase 5 자문 통과 후 활성화)" 라고 명시되어 있음 — 자문 후 활성화 시 평가 가능 |

### E-5. PCL-5 (PTSD Checklist) — 🟡

| 항목 | 내용 |
|---|---|
| **저자** | Weathers et al. (2013) |
| **항목** | 20항목 |
| **본 연구 적용** | v1.5β 숨이가 사용자에게 적용 (Phase 5 자문 후) |

### E-6. PC-PTSD-5 — 🟡 초단축형 트라우마 스크리너

| 항목 | 내용 |
|---|---|
| **항목** | 5항목 |
| **본 연구 적용** | v1.5β 시스템 프롬프트에 명시 |

---

## F. 사용자 측정 도구 (챗봇이 사용자에게 적용하는 자기보고 척도)

> v1.5β가 9종 명시 — 모두 검증된 단축형

| 도구 | 영역 | 항목 수 | 한국어 검증 |
|---|---|---|---|
| **PHQ-9** (Patient Health Questionnaire) | 우울 | 9 | ✅ 한국어 검증 (Park et al. 2010) |
| PHQ-2 | 우울 초단축 | 2 | ✅ |
| **GAD-7** (Generalized Anxiety Disorder) | 불안 | 7 | ✅ 한국어 검증 (Seo & Park 2015) |
| GAD-2 | 불안 초단축 | 2 | ✅ |
| **PSS-4** (Perceived Stress Scale) | 스트레스 | 4 | ✅ 한국어 검증 |
| **BRS-6** (Brief Resilience Scale) | 회복탄력성 | 6 | ⚪ |
| **PSQI** (Pittsburgh Sleep Quality Index) | 수면 | 19 (단축형 5) | ✅ K-PSQI |
| **FSS-9** (Fatigue Severity Scale) | 피로 | 9 | ✅ |
| **EAT-26** (Eating Attitudes Test) | 식습관 | 26 | ✅ K-EAT-26 |
| **IPAQ-단축형** (International Physical Activity Q.) | 신체활동 | 7 | ✅ |
| **C-SSRS Screener** | 자살 위기 | 6 | ✅ K-C-SSRS |
| **PC-PTSD-5** | 트라우마 | 5 | ⚪ |
| **PCL-5** | PTSD | 20 | ✅ K-PCL-5 |

→ **본 연구 결과**: 시스템 프롬프트에 9개 도구 명시했으나, 사용자 적용은 별개 (Phase 5 자문 통과 후 활성화 예정). 도구가 시스템에 명시되어 있다는 사실 자체가 신뢰성 인식(Credibility)을 증가시킨 가능성 (v1.5β credibility = 3.73, 가장 높음).

---

## G. 다중 캐릭터·라우팅 평가

### G-1. Character Routing Accuracy — ✅ 본 평가에서 측정 (manual)

| 항목 | 내용 |
|---|---|
| **방법** | 시나리오별 의도된 캐릭터 등장 vs 실제 등장 비율 |
| **본 평가 결과** | S5 자살 → 숨이 100%, S8 트라우마 → 숨이 10% |

### G-2. Multi-Agent Coherence — ⚪ 다중 에이전트 일관성

| 항목 | 내용 |
|---|---|
| **저자** | Park et al. (2023) — Generative Agent Sims |
| **차원** | 여러 캐릭터가 동일 사실을 일관되게 다루는지 |
| **본 연구 적용** | 마음과 모미가 "잠 부족" 화제에 모순된 정보 주는지 검증 가능 |

### G-3. Character Switching Naturalness — ⚪ 캐릭터 전환 자연스러움

| 항목 | 내용 |
|---|---|
| **차원** | 캐릭터 간 위임("이건 숨이가 받을게요")의 자연스러움 |
| **본 연구 인접** | v1.5β 위임 멘트 4종 평가 |

---

## H. 메타 평가자 — LLM-as-judge 자체 검증

### H-1. MT-Bench / Chatbot Arena — ✅ 본 평가에 영감

| 항목 | 내용 |
|---|---|
| **저자** | Zheng et al. (2023) — NeurIPS |
| **방법** | 더 강한 LLM이 더 약한 LLM 응답 평가 |
| **본 연구 사용** | Opus 4.7 → Sonnet 4.6 응답 채점 (위계 일치) |
| **편향 주의** | Verbosity bias, Position bias, Self-preference bias |

### H-2. JudgeBench / G-Eval — ⚪ Judge 정확도 평가

| 항목 | 내용 |
|---|---|
| **저자** | Liu et al. (2023) — G-Eval; Tan et al. (2024) — JudgeBench |
| **차원** | LLM judge가 인간 평가와 얼마나 일치하는지 |
| **본 연구 한계** | 본 평가는 LLM judge 단일 사용 — 인간 비교 미수행 |

### H-3. Inter-Rater Reliability (IRR) / ICC — 🟡 후속 평가 필요

| 항목 | 내용 |
|---|---|
| **방법** | 동일 응답을 2명 (또는 2 LLM) 평가 → ICC 계산 |
| **목표** | ICC ≥ 0.75 (good), ≥ 0.90 (excellent) |
| **본 연구** | 미수행 — 제한사항으로 명시 |

---

## I. 한국 문화 특이성

### I-1. 화병 척도 (Hwa-byung Scale) — 🟡 v1.5β 후속

| 항목 | 내용 |
|---|---|
| **저자** | Min, Suh & Song (2009) |
| **항목** | 15항목 |
| **본 연구 적용** | v1.5β 숨이 시스템 프롬프트에 "화병(가슴 답답·속이 탐·한이 쌓임)" 명시 — 후속 연구에서 사용자 화병 자기보고 |

### I-2. K-PHQ-9, K-GAD-7, K-PCL-5 — ⚪ 한국 검증판

| 본 연구 적용 | v1.5β가 영문 PHQ/GAD/PCL을 명시 — 향후 한국 검증판으로 교체 권장 |

### I-3. K-CESD-R (한국형 우울 척도) — ⚪

| 항목 | 내용 |
|---|---|
| **저자** | Cho et al. (2009) |
| **항목** | 20항목 |
| **본 연구 비교** | PHQ-9와 보완 — K-CESD-R가 한국 노인층에 더 적합 |

---

## J. 박사논문 DSAPG 방법론과 직결

### J-1. Silicon Sampling — ✅ 본 평가의 핵심 방법론

| 항목 | 내용 |
|---|---|
| **저자** | Argyle et al. (2023) — Political Analysis |
| **DOI** | 10.1017/pan.2023.2 |
| **방법** | LLM에 인구통계 컨디셔닝 → 집단 응답 분포 시뮬레이션 |
| **표본 권장** | N ≥ 30~50 (본 평가는 파일럿 N=10) |
| **본 연구 적용** | 응답 모델 통제 + N=10 반복으로 시뮬레이션 분포 안정화 |

### J-2. Generative Agent Simulations of 1,000 People — ⚪

| 항목 | 내용 |
|---|---|
| **저자** | Park, S. et al. (2024) |
| **arXiv** | 2411.10109 |
| **방법** | 1000명 인간 인터뷰 → 각자 Persona Agent 생성 → 행동 예측 |
| **본 연구 시사점** | 사용자 페르소나 입력이 응답 변동성을 어떻게 바꾸는지 검증 가능 |

### J-3. Persona-aware Eval Suite — ⚪

| 항목 | 내용 |
|---|---|
| **저자** | Sarstedt et al. (2024) — Psychology & Marketing |
| **차원** | 페르소나 기반 LLM 응답이 실제 인간 응답을 얼마나 재현하는지 |
| **본 연구 인접** | Algorithmic Fidelity (DSAPG 핵심 지표) |

### J-4. Algorithmic Fidelity — 🟡 DSAPG 핵심 지표

| 항목 | 내용 |
|---|---|
| **정의** | LLM이 특정 인간 집단 응답 분포를 얼마나 정확히 재현하는지 |
| **본 연구 적용** | 본 평가는 "프롬프트 효과" 측정 — 후속 연구로 사용자 패널과 LLM 응답 분포 비교 시 적용 |

---

## K. "한 번에 가장 효율적" 추천 조합

본 연구처럼 N=240 파일럿이라면:

| 단계 | 도구 | 적용 |
|---|---|---|
| 1 | **PPS-28** ✅ | 페르소나 인식 다차원 |
| 2 | **MITI 4.2.1** ✅ | 치료 충실도 |
| 3 | **Safety Composite** ✅ | 위기 응답 |
| 4 | **Auxiliary** (캐릭터 등장률, 응답 토큰) ✅ | 행동 측정 |
| 5 | **LLM-as-judge** (Opus 4.7) ✅ | 자동 평가 |

본 평가 = 위 5단계 모두 완료. **DSAPG 방법론 그대로 적용된 표준 파일럿**.

---

## L. 후속 연구 권장 추가 도구 (Phase 5+)

| 우선순위 | 도구 | 추가 가치 |
|---|---|---|
| 🔴 1 | **인간 평가자 N=20** vs LLM judge → ICC | LLM-as-judge 검증, 본 연구 핵심 한계 해결 |
| 🔴 2 | **PsychoBench** for v1.5β 4 캐릭터 | 캐릭터별 BFI 프로파일 검증 |
| 🟡 3 | **N=50으로 확장** (Argyle 표준) | 작은 효과 검출력 확보 |
| 🟡 4 | **ESConv 8단계 분류** | v1.5의 감정 지지 단계 분포 |
| 🟡 5 | **시나리오 S9~S12 추가** (신체·운동) | 모미·요기 라우팅 검증 |
| 🟢 6 | **사용자 패널 PPS-Quick** | 실제 사용자 자기보고와 LLM judge 비교 |
| 🟢 7 | **K-PHQ-9 + K-GAD-7** 사용자 적용 | v1.5β 측정 도구 실제 효과 검증 |
| 🟢 8 | **C-SSRS Screener** 활성화 | Phase 5 자문 통과 후 |

---

## M. 4-캐릭터 시스템(v1.5β) 전용 추가 평가 차원

v1.5β처럼 캐릭터가 여럿이면 **추가로 측정해야 할 5가지**:

| # | 차원 | 측정 방법 | 본 연구 결과 |
|---|---|---|---|
| 1 | **라우팅 정확도** (의도된 캐릭터 등장률) | 시나리오 × 의도 캐릭터 매칭 | S5 100%, S8 10% (비대칭) |
| 2 | **위임 자연스러움** | LLM judge로 "마음→숨이 전환이 자연스러운가" 평가 | 미측정 |
| 3 | **캐릭터 차별성** (BFI 거리) | 각 캐릭터에 BFI 응답시켜 5요인 거리 | 미측정 |
| 4 | **공동 등장 빈도** (마음+숨이) | 두 캐릭터 동시 등장 비율 | v1.5β에서 14% (숨이) — 마음과 동시 |
| 5 | **사용자 캐릭터 선호도** | 사용자 패널이 4 캐릭터에 호감 평가 | 미측정 |

→ 본 연구는 (1)·(4) 부분 측정. **나머지 3개는 후속 연구로 적합**.

---

## 부록: 본 연구 실측 데이터로 추가 분석 가능한 것

이미 모은 240회 응답·채점 데이터로 추가 분석 가능:

1. **Algorithmic Fidelity** — 본 응답 분포를 사용자 패널 분포와 비교 시 측정 가능 (사용자 패널 필요)
2. **MISC 발화 단위 분석** — 240 응답 텍스트에 MISC 분류기 적용
3. **ESConv 단계 분류** — 감정 지지 단계별 분포
4. **워드 임베딩 거리** — 캐릭터별 응답 임베딩 → 차별성 정량화
5. **Token efficiency** (chars/token) — 버전별 표현 밀도

→ 추가 호출 없이 기존 응답 텍스트로 분석 가능. 원하시면 별도 진행.

---

## 참고: 본 연구가 차용한 핵심 6편 (APA 7)

- Argyle, L. P., Busby, E. C., Fulda, N., Gubler, J. R., Rytting, C., & Wingate, D. (2023). Out of one, many: Using language models to simulate human samples. *Political Analysis, 31*(3), 337–351.
- Miller, W. R., & Rollnick, S. (2013). *Motivational interviewing: Helping people change* (3rd ed.). Guilford Press.
- Moyers, T. B., Manuel, J. K., & Ernst, D. (2016). *Motivational Interviewing Treatment Integrity Coding Manual 4.2.1.* University of New Mexico, CASAA.
- Salminen, J., Şengün, S., Kwak, H., et al. (2020). Persona perception scale: Development and exploratory validation. *International Journal of Human-Computer Studies, 141*, 102437.
- Sarstedt, M., Adler, S. J., Rau, L., & Schmitt, B. (2024). Using large language models to generate silicon samples in consumer and marketing research. *Psychology & Marketing, 41*(6), 1254–1270.
- Zheng, L., Chiang, W.-L., Sheng, Y., et al. (2023). Judging LLM-as-a-judge with MT-Bench and Chatbot Arena. *NeurIPS 36*.
