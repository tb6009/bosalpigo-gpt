# 🚚 새 컴퓨터로 이사 가이드

> 마음·모미 프로젝트를 다른 컴퓨터로 옮길 때 이 문서만 따라하면 끝.

## ✅ 옮길 때 포함되는 것

이 폴더 전체(`10-일상다반사/`)에 담긴 모든 자산은 **순수 텍스트/Markdown**.
새 컴퓨터에 **추가 설치할 게 거의 없음**.

```
10-일상다반사/
├── 자료/                    # 논문·강의노트·참고자료 (원본)
├── QA_아카이브/              # 분야별 대화 기록
├── 코칭자료/                 # 동기강화면담 교안 등 PDF/PPTX
├── outputs/
│   └── 마음_앱/             # 웹앱 소스 (HTML/JS/CSS) — GitHub와 동기화
├── 마음_프로덕트/
│   ├── 00_비전.md
│   ├── 01_로드맵.md
│   ├── 02_사용자_여정.md
│   ├── 03_캐릭터_시트.md
│   ├── research/           # 연구 아카이브 11개 + 질문맵
│   └── logs/               # 세션 로그
└── .claude/CLAUDE.md       # 프로젝트 규칙
```

## 🏃 이동 방법 3가지

### 방법 A: 폴더 통째로 복사 (가장 간단)

1. 이 폴더(`10-일상다반사/`)를 USB·외장하드·AirDrop·iCloud Drive 등으로 새 컴퓨터에 복사
2. 새 컴퓨터에서 아무 경로에 붙여넣기 (예: `~/Documents/cloude_Code/10-일상다반사`)
3. 끝. 파일 읽기/편집은 바로 가능.

### 방법 B: Git 클론 (웹앱만 동기화하고 싶을 때)

새 컴퓨터 터미널에서:

```bash
mkdir -p ~/Documents/cloude_Code/10-일상다반사/outputs
cd ~/Documents/cloude_Code/10-일상다반사/outputs
git clone https://github.com/tb6009/maeum.git 마음_앱
```

> 주의: 연구 자료·QA아카이브·코칭자료는 GitHub에 없음. 이건 방법 A로 따로 복사.

### 방법 C: zip 아카이브

현재 컴퓨터 터미널:

```bash
cd ~/Documents/cloude_Code
zip -r 10-일상다반사_backup_$(date +%Y%m%d).zip 10-일상다반사
```

생성된 zip을 새 컴퓨터로 옮겨서 압축 해제.

---

## 🌐 웹앱을 새 컴퓨터에서 쓰려면

### 옵션 1: GitHub Pages 그대로 쓰기 (권장)

새 컴퓨터에서도 **https://tb6009.github.io/maeum/** 는 그대로 접속 가능.
브라우저만 있으면 됨. 앱 파일 복사 필요 없음.

**설정만 새로 하면 됨:**
1. 사이트 접속
2. ⚙️ 설정에서:
   - 프록시 URL: `https://maeum-proxy.tb6009.workers.dev`
   - Anthropic API 키: 새로 입력 (localStorage는 기기마다 분리됨)
   - 모델 선택

### 옵션 2: 로컬에서 실행 (오프라인 대비)

```bash
cd ~/Documents/cloude_Code/10-일상다반사/outputs/마음_앱
python3 -m http.server 8080
```
브라우저에서 http://localhost:8080

### 옵션 3: 직접 열기
`index.html` 더블클릭 → 브라우저에서 열림 (단 Service Worker는 비활성)

---

## 🔧 새 컴퓨터에서 Git 푸시하려면

웹앱을 새 컴퓨터에서 편집하고 GitHub에 올리고 싶다면:

### 1. Git 설치 확인
```bash
git --version
```
없으면: macOS는 Xcode Command Line Tools 자동 설치 프롬프트 나옴.

### 2. Git 사용자 설정 (한 번만)
```bash
git config --global user.name "tb6009"
git config --global user.email "tb6009@gmail.com"
```

### 3. GitHub 인증
- **쉬운 방법**: Personal Access Token 새로 발급
  - https://github.com/settings/tokens/new?scopes=repo
  - 복사한 토큰을 이렇게 사용:
  ```bash
  cd ~/Documents/cloude_Code/10-일상다반사/outputs/마음_앱
  git remote set-url origin https://tb6009:여기_토큰_붙여넣기@github.com/tb6009/maeum.git
  ```
- 이후 `git push` 자동 인증

### 4. `gh` CLI (선택)
Homebrew 있으면:
```bash
brew install gh
gh auth login   # 브라우저 인증으로 완료
```

---

## 🛠 Cloudflare Worker (프록시) 접근

프록시는 **Cloudflare 계정에 묶여 있음** — 코드 수정하려면 대시보드에서.

- 대시보드: https://dash.cloudflare.com
- Worker 이름: `maeum-proxy`
- 엔드포인트: https://maeum-proxy.tb6009.workers.dev
- 소스 파일 (로컬 참고용): [`outputs/마음_앱/worker.js`](../outputs/마음_앱/worker.js)

새 컴퓨터에서도 동일 Cloudflare 계정 로그인하면 바로 편집 가능.

---

## 📦 의존성 요약 (새 컴퓨터에서 필요한 것)

| 항목 | 필수? | 용도 |
|------|-------|------|
| 브라우저 (크롬/사파리) | ✅ | 앱 실행 |
| Anthropic API 키 | ✅ | 대화 기능 |
| 인터넷 | ✅ | API 호출 |
| Git | 선택 | 앱 편집·푸시 시에만 |
| Python 3 | 선택 | 로컬 서버 실행 시 (`python3 -m http.server`) |
| VSCode | 선택 | 문서 편집 |
| Cloudflare 계정 | 선택 | 프록시 코드 수정 시 |
| GitHub 계정 | 선택 | 앱 편집·푸시 시 |

---

## 🔐 백업 안 되는 것 (재입력/재발급 필요)

1. **Anthropic API 키** (`localStorage`에만 저장됨 — 기기별 분리)
2. **GitHub Personal Access Token** (새 발급 권장)
3. **대화 히스토리** (`localStorage`에 있음 — 기기 이동하면 초기화)
4. **Cloudflare 세션** (재로그인)

> 이 네 가지는 의도적으로 동기화 안 함. 보안상 서버에 저장 안 하는 BYOK(Bring Your Own Key) 구조.

---

## ✅ 새 컴퓨터 이사 체크리스트

- [ ] `10-일상다반사/` 폴더 복사 완료
- [ ] 브라우저에서 https://tb6009.github.io/maeum/ 접속 확인
- [ ] ⚙️ 설정에 프록시 URL 입력
- [ ] Anthropic API 키 입력
- [ ] 첫 메시지 보내서 응답 오는지 확인
- [ ] (필요 시) Git 사용자 설정 + PAT 발급
- [ ] (필요 시) `git clone https://github.com/tb6009/maeum.git` 테스트

---

## 🆘 문제 발생 시

- 403 에러 — 프록시 또는 API 키 문제. `logs/` 폴더 최신 로그 참고.
- CORS 에러 — 프록시 URL 확인 (끝 슬래시 제거, `/v1/messages` 붙이지 말기)
- 캐릭터 얼굴 뒤섞임 — 대화 초기화(🧹) 후 재시도
- Worker 403 지속 — Anthropic 정책 변경 가능성. `worker.js` 헤더 조정 후 재배포
