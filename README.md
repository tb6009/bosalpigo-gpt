# 보고살피다 GPT

OpenAI API로 작동하는 `보고살피다` 챗봇 웹앱입니다.

## 바로 사용

GitHub Pages 배포 후 `docs/index.html`이 웹 앱의 첫 화면이 됩니다.

로컬 실행:

```bash
cd outputs/보고살피다_GPT
python3 -m http.server 8081
```

브라우저:

```text
http://127.0.0.1:8081/
```

## 버전

- `v1.3`: 마음·모미, 주제 경계 강화
- `v1.4`: 마음·모미, 만담과 톤 복구
- `v1.5β`: 마음·모미·요기·숨이, 측정 동의와 위기 안전망

## GitHub Pages 배포

이 저장소는 GitHub Pages의 `docs/` 배포 방식을 기준으로 구성되어 있습니다.

원본 Claude 버전은 `tb6009/maeum` 저장소에서 `main / root` 방식으로 배포되어 있습니다.
이 GPT 버전은 API 공급자가 다르므로 별도 저장소 `tb6009/bosalpigo-gpt`로 분리하는 것을 권장합니다.

1. GitHub에 새 저장소를 만듭니다.
2. 이 폴더를 push합니다.
3. GitHub 저장소 `Settings > Pages`로 이동합니다.
4. `Build and deployment > Source`를 `Deploy from a branch`로 설정합니다.
5. Branch는 `main`, Folder는 `/docs`를 선택합니다.
6. 몇 분 뒤 Pages URL로 접속합니다.

## API 키 주의

이 앱은 사용자가 브라우저에서 직접 OpenAI API 키를 입력하는 BYOK 방식입니다.
키는 브라우저 `localStorage`에만 저장되고 저장소에는 포함되지 않습니다.

공개 서비스로 운영하면서 비용 통제나 키 보호가 필요하면 Cloudflare Worker, Vercel, Netlify Function 같은 서버 프록시를 별도로 두는 것이 안전합니다.
