# 마음 (◉ ◡ ◉)

> 몸과 마음의 과학을 시니컬하고 유쾌하게 풀어주는 대화형 에이전트.
> Anthropic Claude API 기반 단일 HTML 웹앱 + PWA.

![badge](https://img.shields.io/badge/HTML-single%20file-blue)
![badge](https://img.shields.io/badge/PWA-ready-brightgreen)
![badge](https://img.shields.io/badge/API-Claude-orange)

---

## ✨ 특징

- **단일 HTML** — 빌드 과정 없음. 그냥 열면 됨.
- **PWA** — iPhone/Android 홈 화면에 추가하면 네이티브 앱처럼 동작.
- **BYOK (Bring Your Own Key)** — 각자 Anthropic API 키를 자기 브라우저에 저장. 서버 안 거침.
- **모델 전환** — Opus / Sonnet / Haiku 선택 가능.
- **대화 기록 보존** — localStorage에 저장, 🧹 버튼으로 초기화.
- **다크/라이트 자동**, 모바일 safe-area 대응.

---

## 🚀 배포 — GitHub Pages

가장 간단한 방법:

1. 이 폴더의 파일들을 GitHub 레포 루트에 푸시.
2. 레포 **Settings → Pages → Source: `main` / root** 선택.
3. 몇 초 후 `https://<username>.github.io/<repo>/` 로 접속.
4. iPhone Safari에서 열고 **공유 → 홈 화면에 추가** 하면 앱처럼 씀.

> ⚠️ API 키는 **각 사용자**가 자기 브라우저에 직접 입력. 레포에 커밋하지 마세요.

### 다른 정적 호스팅
Vercel, Netlify, Cloudflare Pages — 빌드 명령 필요 없음. 폴더만 드래그하면 끝.

---

## 🖥️ 로컬 실행

```bash
python3 -m http.server 8080
# → http://localhost:8080
```

또는 `index.html`을 브라우저로 직접 열기 (Service Worker는 `file://`에서 비활성화됨).

---

## 🔑 API 키 발급

1. https://console.anthropic.com 에서 계정 생성
2. **API Keys** 메뉴 → Create Key (`sk-ant-...` 형식)
3. 앱 실행 후 ⚙️ 설정에서 붙여넣기

키는 해당 기기 브라우저 `localStorage`에만 저장됨.

---

## 🧠 모델

| 모델 | 특징 |
|------|------|
| `claude-opus-4-6` | 가장 똑똑. 느리고 비쌈. |
| `claude-sonnet-4-6` | 균형 (기본값) |
| `claude-haiku-4-5` | 빠름, 저렴 |

---

## 📁 파일 구조

```
.
├── index.html              # 앱 본체 (UI + 로직 + 시스템 프롬프트)
├── manifest.webmanifest    # PWA 메타데이터
├── sw.js                   # 오프라인 캐시
├── icon.svg                # 아이콘
├── .gitignore
├── LICENSE
└── README.md
```

---

## ⚠️ 보안 주의

이 앱은 브라우저에서 Anthropic API를 **직접** 호출한다 (`anthropic-dangerous-direct-browser-access: true`).
공개 사이트여도 **각 사용자의 키는 각자 브라우저에만** 저장되므로 유출되지 않지만:

- 🚫 **절대 자기 API 키를 코드에 하드코딩해서 커밋하지 말 것.**
- 🚫 타인의 키를 대신 넣어주는 용도로 쓰지 말 것.
- ✅ 완전한 앱으로 배포하려면 백엔드 프록시(Cloudflare Worker, Vercel Function 등) 권장.

---

## 🎭 캐릭터

```
(◉ ◡ ◉)  기본, 기분 좋음
(◉ ◡ ◉)ノ 인사, 신남
(◉ _ ◉)  진지, 공감
(◉ ᴗ ◉)  설명 중
(◉ ◡ ◉)b 칭찬
```

몸과 마음의 경계를 두지 않는다. 도파민, 코르티솔, 염증, 혈당 — 몸의 메커니즘이 만드는 느낌이 전부 "마음"이다.

내장 지식:
- 게으름의 7가지 몸속 경로 (도파민 / 전전두엽 / HPA축 / 염증 / 장-뇌축 / 수면 / 에너지 대사)
- 식사와 몸 (식곤증 / 알코올 / 카페인)
- 봄철 (춘곤증 / 빛 / 알레르기)
- 감정과 눈물의 과학

---

## 📜 License

MIT
