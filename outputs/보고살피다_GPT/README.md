# 보고살피다 GPT

OpenAI API로 작동하는 `보고살피다` 정적 웹앱입니다.

## 실행

```bash
cd /Users/jinhyunpark/Documents/cloude_Code/10-일상다반사GPT/outputs/보고살피다_GPT
python3 -m http.server 8081
```

브라우저에서 `http://127.0.0.1:8081/`을 엽니다.

## 구성

- v1.3: 마음·모미, 주제 경계 강화
- v1.4: 마음·모미, 만담과 톤 복구
- v1.5β: 마음·모미·요기·숨이, 측정 동의와 위기 안전망
- v1.6: GPT 보완판, 동의 게이트 코드화 + 프로브 상태관리 + SNS 안전 차단

## v1.6 보완 내용

- 위기 키워드는 API 호출 전에 고정 안전 응답으로 처리합니다.
- 수면·스트레스·섭식·트라우마 신호는 먼저 동의를 받고, 동의 후 1문항씩 자연어 프로브를 진행합니다.
- 프로브 진행 상태와 yes-count를 브라우저 localStorage로 관리합니다.
- SNS “들어봤어요?” 인사는 안전한 일반 대화에서만 하루 1회 사용합니다.

## API

- 기본 모델: `gpt-5.4-mini`
- 기본 Base URL: `https://api.openai.com/v1`
- 호출 방식: Chat Completions API

API 키는 브라우저 `localStorage`에만 저장됩니다. 공개 배포 시에는 서버 프록시를 두는 것이 안전합니다.
