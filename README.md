# 4컷 사진

브라우저에서 4컷 사진을 만들고 PNG로 저장하는 웹앱입니다.
사진을 찍거나 불러와 프레임을 고르고, 필터를 적용해 바로 내려받습니다.

**사진은 서버로 전송되지 않습니다.** 백엔드도 데이터베이스도 없고, 모든 이미지
처리는 브라우저의 Canvas에서만 일어납니다. 정적 파일만 호스팅하면 동작합니다.

- 데모: https://shlim1671-code.github.io/four-cut-photo/
- 스택: React + Vite + TypeScript + Tailwind CSS
- 상세 스펙: [SPEC.md](./SPEC.md)

> 스크린샷: TODO

## 화면 흐름

1. 프레임 고르기
2. 사진 확보 — 웹캠 촬영 또는 기기에서 불러오기
3. 4장 고르기 — 고른 순서가 곧 칸 배치 순서
4. 마무리 — 필터 프리셋·피부 보정·칸별 미세 조정 후 다운로드

웹캠 촬영은 브라우저 정책상 HTTPS(또는 localhost)에서만 동작합니다.

## 로컬 실행

Node.js 20 이상이 필요합니다.

```bash
npm install
npm run dev
```

그 밖의 스크립트:

```bash
npm run build    # dist/ 에 정적 산출물 생성
npm run preview  # 빌드 결과 미리보기
npm test         # 로직 테스트
npm run lint     # ESLint
```

## 배포

`main` 브랜치에 푸시하면 [GitHub Actions 워크플로](./.github/workflows/deploy.yml)가
테스트·빌드 후 GitHub Pages로 자동 배포합니다. 저장소 Settings → Pages에서
Source를 **GitHub Actions**로 설정해두면 됩니다.

포크해서 쓴다면 `vite.config.ts`의 `base`를 본인 저장소 이름에 맞춰 바꿔주세요.
(사용자 페이지나 커스텀 도메인처럼 하위 경로가 없는 곳에 올린다면 `base: '/'`)

```ts
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/four-cut-photo/',
})
```

## 프레임 추가하기

프레임은 `src/frames/definitions.ts`의 배열에 객체 하나를 추가하면 끝입니다.
칸 위치는 픽셀이 아니라 프레임 대비 **비율(0~1)**로 지정하므로 어떤 출력
해상도에서도 동일하게 동작합니다.

```ts
{
  id: 'my-frame',          // 고유 ID
  name: '내 프레임',        // 선택 화면에 표시될 이름
  aspectRatio: 0.25,       // 가로 / 세로
  background: '#fff0f5',   // 배경 색상 또는 이미지 경로
  borderRadius: 12,        // (선택) 칸 모서리 둥글기
  slots: [                 // 4개. x·y는 좌상단, w·h는 크기 (모두 0~1)
    { x: 0.09, y: 0.020,  w: 0.82, h: 0.2255 },
    { x: 0.09, y: 0.2585, w: 0.82, h: 0.2255 },
    { x: 0.09, y: 0.497,  w: 0.82, h: 0.2255 },
    { x: 0.09, y: 0.7355, w: 0.82, h: 0.2255 },
  ],
  decorations: [           // (선택) 텍스트·이미지 장식
    {
      type: 'text',
      content: 'PHOTO BOOTH',
      x: 0.5, y: 0.95,     // 중심점 기준 (0~1)
      fontSize: 0.06,      // 프레임 폭 대비 비율
      color: '#ffffff',
      align: 'center',
    },
  ],
}
```

타입 정의는 `src/frames/types.ts`에 있습니다. 필터 프리셋을 추가하거나 값을
조정하려면 `src/lib/filters.ts`를 보세요.

## 라이선스

MIT — [LICENSE](./LICENSE) 참조.
