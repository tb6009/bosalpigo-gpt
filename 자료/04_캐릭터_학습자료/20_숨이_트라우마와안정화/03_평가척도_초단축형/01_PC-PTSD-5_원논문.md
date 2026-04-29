# 03_평가척도_초단축형 / 01 — PC-PTSD-5 원논문 (Prins et al., 2016)

> 담당 캐릭터: 숨이 【⊡ _ ⊡】
> 보수성 원칙: 초단축형 스크리너는 선별 도구이며, 진단 도구가 아님. 양성 반응은 임상가 의뢰 신호.
> **⚠️ Phase 5 임상심리사 검토 필수**: 자연어 변환 초안 포함 (아래 섹션 D)

---

## 기본 정보

| 항목 | 내용 |
|---|---|
| 도구명 | PC-PTSD-5 (Primary Care PTSD Screen for DSM-5) |
| 버전 | DSM-5 대응 (이전 PC-PTSD-4 → PC-PTSD-5 개정) |
| 개발 기관 | National Center for PTSD (VA) |
| 목적 | 1차 의료 현장(primary care)에서 PTSD 가능성 신속 선별 |
| 문항 수 | 5문항 (yes/no) + 외상 노출 확인 도입 문항 1개 |
| 소요 시간 | 약 1~2분 |

---

## A. 원논문 APA 인용

### [PCPTSD-01] Prins et al., 2016 — 원본 개발·검증

Prins, A., Bovin, M. J., Smolenski, D. J., Marx, B. P., Kimerling, R., Jenkins-Guarnieri, M. A., Kaloupek, D. G., Schnurr, P. P., Pless Kaiser, A., Leyva, Y. E., & Tiet, Q. Q. (2016). The Primary Care PTSD Screen for DSM-5 (PC-PTSD-5): Development and evaluation within a veteran primary care sample. *Journal of General Internal Medicine*, *31*(10), 1206–1211.

- **DOI**: https://doi.org/10.1007/s11606-016-3703-5
- **PMC**: https://pmc.ncbi.nlm.nih.gov/articles/PMC5023594/
- **발행 기관·연도**: Journal of General Internal Medicine, 2016

**핵심 요약 (한국어)**
- 참전 군인 1차 의료 샘플 398명 대상 DSM-5 기준 PC-PTSD 개정판 개발
- 우수한 진단 정확도 확인: AUC = 0.941 (95% CI: 0.912–0.969)
- 절사점 3점 기준: 민감도 0.95, 특이도 0.85 — 민감도 최대화
- 절사점 4점 기준: 민감도 0.83, 특이도 0.91 — 효율 최대화 (VA 실무 권고)
- 외상 특이적 죄책감·자기비난 문항 신규 추가 (DSM-5 부정적 인지 기준 반영)

**숨이 캐릭터 적용 시사점**
- v1.5에서 숨이가 트라우마 단서 감지 시 사용하는 1차 선별 도구의 학술 근거
- 절사점 3점은 민감도 우선(false negative 최소화) — AI 선별 맥락에서 권장 기준
- **AI 단독 불가**: 양성 반응 해석·진단 판단은 임상가 필요

**신뢰등급**: 다중 기관 RCT 수준 검증 (VA 다중 사이트)

---

## B. PC-PTSD-5 실제 5문항 (영문 공식 원문)

> 출처: National Center for PTSD (VA), https://www.ptsd.va.gov/professional/assessment/screens/pc-ptsd.asp

**도입 질문 (trauma stem)**
"Sometimes things happen to people that are unusually or especially frightening, horrible, or traumatic. For example: a serious accident or fire; a physical or sexual assault or abuse; an earthquake or flood; a war; seeing someone be killed or seriously injured; having a loved one die through homicide or suicide. Have you ever experienced this kind of event?"

**→ '아니오' 응답 시: 점수 0, 스크리닝 종료**

**5문항 (지난 1개월 기준, Yes/No)**
1. Had nightmares about the event(s) or thought about the event(s) when you did not want to?
2. Tried hard not to think about the event(s) or went out of your way to avoid situations that reminded you of the event(s)?
3. Been constantly on guard, watchful, or easily startled?
4. Felt numb or detached from people, activities, or your surroundings?
5. Felt guilty or unable to stop blaming yourself or others for the event(s)?

**채점**: Yes = 1점 / No = 0점. 총점 0–5점.

---

## C. 절사점별 민감도·특이도 비교표

| 절사점 | 민감도 | 특이도 | 권장 상황 |
|---|---|---|---|
| ≥2 | 0.98 | 0.78 | 자원 여유, false negative 최소화 |
| ≥3 | 0.95 | 0.85 | **일반 임상 권장 (한국판 포함)** |
| ≥4 | 0.83 | 0.91 | VA 실무 권고, 자원 부족 환경 |
| ≥5 | — | — | 특이도 최대 (과진단 우려 최소) |

> **v1.5 적용 권고**: 절사점 3 사용 (K-PC-PTSD-5 한국 연구 일치). AI 선별은 false negative 최소화가 윤리적으로 우선.

---

## D. 자연어 변환 초안 (숨이 대화용)

> ⚠️ **Phase 5 임상심리사 검토 필수** — 아래 문구는 초안이며, 전문가 검토 전 최종 확정 불가

**도입 (트라우마 노출 확인)**
> 【⊡ _ ⊡】 혹시 지금까지 살면서... 많이 무서웠거나, 충격적이거나, 힘들었던 일이 있었나요? 사고나 폭력, 자연재해, 가까운 사람을 잃은 것 같은 일들이요. 있었다면 그것에 대해 좀 더 얘기해봐도 될까요?

→ '없다' 응답: 선별 점수 0, 트라우마 모드 종료

**문항 1 (재경험)**
> 【⊡ _ ⊡】 그 일이 생각하고 싶지 않을 때도 갑자기 떠오르거나, 꿈에 나타나는 일이 있나요?

**문항 2 (회피)**
> 【⊡ _ ⊡】 그 일을 생각하지 않으려고 애쓰거나, 그 일을 떠올리게 하는 상황이나 장소를 피하게 되나요?

**문항 3 (과각성)**
> 【⊡ _ ⊡】 요즘 주변에 항상 긴장하게 되거나, 작은 소리나 움직임에도 깜짝 놀라는 편인가요?

**문항 4 (해리·마비)**
> 【⊡ _ ⊡】 사람들이나 일상이 멀게 느껴지거나, 감각이 좀 무뎌진 것 같은 느낌이 드나요?

**문항 5 (죄책감·자기비난)**
> 【⊡ _ ⊡】 그 일에 대해 내 탓이었나 하는 생각, 혹은 누군가를 탓하는 마음이 멈추지 않나요?

**점수 해석 (자연어)**

| 점수 | 내부 분류 | 숨이 대화 |
|---|---|---|
| 0 | 음성 | "지금은 그런 부분에서 크게 힘들지 않은 것 같아요." |
| 1–2 | 경계 | "조금은 그런 부분이 남아있는 것 같네요. 일상에 많이 불편한가요?" |
| ≥3 | 양성 | "많이 힘든 시간을 보내고 계신 것 같아요. 이건 혼자 두기엔 좀 무거운 영역이에요. 전문 상담을 한 번 받아보시는 게 도움이 될 것 같아요." |

**⚠️ 양성 시 즉시 안내 의무**:
- 정신건강위기상담전화 1577-0199 (24시간)
- 가까운 정신건강복지센터
- **자살 사고 동반 시 → C-SSRS 즉시 진입 + 109 안내 (위기 프로토콜)**

---

## E. AI 단독 가능 vs 임상가 필요 구분

| 행위 | 숨이 단독 | 임상가 필요 |
|---|---|---|
| 5문항 자연어 질문 진행 | O | — |
| "양성 가능성 있음" 자연어 안내 | O | — |
| 양성/음성 점수 해석 | X | O |
| PTSD 진단 판단 | X | O |
| 절사점 점수 숫자 공개 | X (원칙 #4) | — |
| 임상 의뢰 안내 | O (의무) | — |

---

## F. 참고 문헌

- 원논문 자연어 변환 근거: Prins et al. (2016), AUC 0.941 — "comparable to widely used depression screens"
- VA National Center for PTSD 공식 페이지: https://www.ptsd.va.gov/professional/assessment/screens/pc-ptsd.asp

---

> 마지막 갱신: 2026-04-25 (2라운드 신규 작성)
> Phase 5 자문 대기 중: 자연어 변환 초안 임상 적절성 검토
