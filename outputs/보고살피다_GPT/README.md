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

## API

- 기본 모델: `gpt-5.4-mini`
- 기본 Base URL: `https://api.openai.com/v1`
- 호출 방식: Chat Completions API

API 키는 브라우저 `localStorage`에만 저장됩니다. 공개 배포 시에는 서버 프록시를 두는 것이 안전합니다.
