# GitHub 업로드 및 Pages 배포 절차

## 1. 준비된 구조

```text
10-일상다반사GPT/
├── docs/
│   └── index.html              # GitHub Pages가 서빙할 앱
├── outputs/보고살피다_GPT/
│   ├── index.html              # 작업 원본 앱
│   └── README.md
├── 마음_프로덕트/
├── 자료/
├── README.md
├── PROJECT.md
└── .gitignore
```

GitHub Pages는 `docs/index.html`을 공개 웹페이지로 사용합니다.

## 1-1. 원본 프로젝트에서 확인한 기존 방식

원본 `10-일상다반사` 안에는 기존 Claude/Anthropic 버전 웹앱 배포 자료가 있습니다.

- 기존 웹앱 로컬 경로: `10-일상다반사/outputs/마음_앱`
- 기존 GitHub 저장소: `https://github.com/tb6009/maeum`
- 기존 Pages 주소: `https://tb6009.github.io/maeum/`
- 기존 방식: 저장소 루트에 `index.html`, `manifest.webmanifest`, `sw.js`, `icon.svg`를 두고 GitHub Pages를 `main / root`로 배포
- 기존 프록시: `https://maeum-proxy.tb6009.workers.dev`

이번 GPT 버전은 기존 `tb6009/maeum`에 섞기보다 별도 저장소를 권장합니다.
이유는 API 공급자, 설정 화면, 모델 파라미터, 보안 안내가 달라서 운영 이력이 분리되는 편이 안전하기 때문입니다.

권장 새 저장소:

```text
https://github.com/tb6009/bosalpigo-gpt
```

예상 Pages 주소:

```text
https://tb6009.github.io/bosalpigo-gpt/
```

## 2. GitHub에서 새 저장소 만들기

추천 저장소 이름:

```text
bosalpigo-gpt
```

Public으로 만들면 GitHub Pages를 바로 쓰기 쉽습니다.
Private 저장소도 계정/플랜에 따라 Pages를 사용할 수 있습니다.

## 3. 로컬에서 Git 초기화

```bash
cd /Users/jinhyunpark/Documents/cloude_Code/10-일상다반사GPT
git init
git add .
git commit -m "Initial 보고살피다 GPT web app"
git branch -M main
```

## 4. 원격 저장소 연결

GitHub에서 만든 저장소 주소에 맞춰 실행합니다.

```bash
git remote add origin https://github.com/tb6009/bosalpigo-gpt.git
git push -u origin main
```

SSH를 쓴다면:

```bash
git remote add origin git@github.com:tb6009/bosalpigo-gpt.git
git push -u origin main
```

## 5. GitHub Pages 켜기

GitHub 저장소에서:

```text
Settings > Pages > Build and deployment
Source: Deploy from a branch
Branch: main
Folder: /docs
Save
```

배포 후 주소는 보통 아래 형태입니다.

```text
https://tb6009.github.io/bosalpigo-gpt/
```

## 6. 업데이트할 때

작업 원본인 `outputs/보고살피다_GPT/index.html`을 수정한 뒤, Pages용 파일에 복사합니다.

```bash
cp outputs/보고살피다_GPT/index.html docs/index.html
git add outputs/보고살피다_GPT/index.html docs/index.html
git commit -m "Update 보고살피다 GPT app"
git push
```

## 보안 메모

현재 앱은 사용자가 직접 API 키를 입력하는 방식입니다.
API 키를 코드에 직접 넣거나 GitHub에 커밋하지 마세요.

공개 사용자에게 서비스하려면 서버 프록시를 추가하는 구조가 더 안전합니다.
