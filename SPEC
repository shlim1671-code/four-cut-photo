# 4컷 사진 웹앱 — 1단계 MVP 스펙

> Claude Code 작업 지시서. 이 문서 전체를 Claude Code에 붙여넣고 "이 스펙대로 1단계를 구현해줘"라고 요청하면 된다.

## 1. 프로젝트 개요

사용자가 사진을 넣고 → 보정하고 → 프레임을 골라 → 다운로드하는 순수 프론트엔드 웹앱.
백엔드/DB 없음. 모든 처리는 브라우저 Canvas에서 일어난다. 정적 호스팅(GitHub Pages, Vercel)에 배포.

사용자 흐름:

```
사진 넣기(업로드 또는 웹캠 촬영) → 칸 배치/조정 → 보정 → 프레임 선택 → PNG 다운로드
```

프레임은 개발자가 코드 내 JSON 정의로 관리한다. 사용자용 프레임 에디터는 1단계 범위 밖.

## 2. 기술 스택

- React 18 + Vite + TypeScript
- Tailwind CSS
- 이미지 처리: HTML5 Canvas API (라이브러리 의존 최소화)
- 상태관리: React 내장 (useState/useReducer/Context). 외부 상태 라이브러리 불필요
- 배포 산출물: 정적 파일. `vite build` 결과를 그대로 호스팅

## 3. 폴더 구조

```
src/
  components/
    PhotoInput/        업로드 + 웹캠 촬영
    SlotEditor/        칸별 사진 배치(줌·위치·반전·회전)
    AdjustPanel/       보정 슬라이더 + 필터 프리셋
    FramePicker/       프레임 선택 UI
    CanvasPreview/     실시간 합성 미리보기
    ExportButton/      최종 PNG 생성·다운로드
  frames/
    definitions.ts     프레임 JSON 정의 모음 (개발자가 여기에 추가)
    types.ts           프레임 타입 정의
  lib/
    imageProcessing.ts Canvas 보정 로직 (밝기/대비/채도 등)
    filters.ts         필터 프리셋 정의
    compositor.ts      최종 합성 로직
  state/
    editorContext.tsx  앱 전역 상태
  App.tsx
  main.tsx
```

## 4. 프레임 정의 구조

`src/frames/definitions.ts`에 아래 형태로 프레임을 추가한다. 칸 위치는 프레임 대비 **비율(0~1)**로 지정 — 어떤 출력 해상도에서도 동일하게 동작.

```typescript
interface FrameSlot {
  x: number; y: number; w: number; h: number;  // 0~1 비율
}

interface FrameDecoration {
  type: 'text' | 'image';
  content: string;            // text면 문구, image면 에셋 경로
  x: number; y: number;       // 0~1 비율, 중심점 기준
  font?: string;
  fontSize?: number;          // 프레임 폭 대비 비율
  color?: string;
  align?: 'left' | 'center' | 'right';
}

interface FrameDefinition {
  id: string;
  name: string;
  aspectRatio: number;        // width / height
  background: string;         // 색상 또는 배경 이미지 경로
  borderRadius?: number;
  slots: FrameSlot[];         // 4개 (4컷)
  decorations?: FrameDecoration[];
}
```

1단계 프리셋으로 최소 4종 제공: 세로 인생네컷 스타일, 2×2 그리드, 무지 흰 프레임, 어두운 행사용 프레임.

새 프레임 추가는 이 배열에 객체 하나 push하면 끝.

## 5. 기능 명세

### 5.1 사진 입력 (PhotoInput)
- 파일 업로드: 드래그앤드롭 + 파일선택. 여러 장 한 번에 가능
- 웹캠 촬영: `getUserMedia` API. 촬영 버튼, 카운트다운(3·2·1) 옵션
- 입력된 사진은 칸 슬롯에 순서대로 자동 배치, 이후 수동 재배치 가능

### 5.2 칸 배치/조정 (SlotEditor)
칸별로 독립 적용:
- 사진 위치 이동 (드래그/터치)
- 줌 인/아웃 (핀치 또는 슬라이더)
- 좌우반전 토글
- 회전 (90도 단위 + 미세 회전)
- 칸 비우기 / 다른 사진으로 교체

### 5.3 보정 (AdjustPanel) — **최우선 품질 영역**
전체 또는 칸별 적용 선택. 슬라이더:
- 밝기 (brightness)
- 대비 (contrast)
- 채도 (saturation)
- 색온도 (warm/cool)
- 하이라이트 / 섀도우
- 선명도 (sharpen, 가벼운 언샤프 마스크)
- 필름 그레인 강도

필터 프리셋 (filters.ts):
- 원본
- 흑백 (고대비 / 부드러운 톤 2종)
- 세피아
- 필름톤 (따뜻한 빈티지)
- 쿨톤 (차분한 청록)
프리셋 선택 후에도 슬라이더로 미세 조정 가능해야 함.

구현: Canvas `getImageData`/`putImageData` 픽셀 연산 또는 `ctx.filter` 문자열 조합.
픽셀 연산은 미리보기용으로 다운스케일된 이미지에 적용하고, 최종 export 시에만 원본 해상도에 적용해 성능 확보.

### 5.4 프레임 선택 (FramePicker)
- definitions.ts의 프레임을 썸네일 그리드로 표시
- 선택 즉시 미리보기 반영
- 배경색만 빠르게 바꾸는 간단 옵션 (선택)

### 5.5 미리보기 (CanvasPreview)
- 프레임 + 4컷 사진 + 보정 + 데코레이션을 합성한 실시간 미리보기
- 성능을 위해 미리보기는 화면 표시 해상도로만 렌더

### 5.6 내보내기 (ExportButton)
- 최종 합성을 원본 해상도(상한 적용)로 렌더 후 PNG 다운로드
- JPG 옵션 + 품질 슬라이더 (선택)
- 다운로드 파일명에 날짜 자동 포함

## 6. 성능·기술 주의사항

- **출력 해상도 상한**을 둔다 (예: 긴 변 2400px). 4장 고해상도 합성은 모바일에서 메모리 초과 위험
- 미리보기와 최종 export의 해상도를 분리: 미리보기는 가볍게, export는 한 번만 고품질
- 픽셀 단위 보정은 무거우므로, 슬라이더 조작 중에는 다운스케일 이미지에 적용 (debounce)
- 웹캠은 HTTPS에서만 동작 → 배포 호스팅이 HTTPS인지 확인 (GitHub Pages·Vercel 기본 제공)
- 이미지 EXIF 회전 처리: 모바일 사진은 방향 메타데이터가 있으므로 로드 시 정방향 보정
- 모든 이미지 처리는 클라이언트에서만 — 사진이 서버로 전송되지 않음 (개인정보 안전, 행사용 장점)

## 7. UI 레이아웃 가이드

- 데스크톱: 좌측 입력/프레임 패널, 중앙 미리보기, 우측 보정 패널
- 모바일: 미리보기 상단 고정, 하단 탭(입력 / 보정 / 프레임 / 저장)
- 터치 타깃 충분히 크게 (행사장 태블릿 사용 대비)

## 8. 1단계 완료 기준 (Definition of Done)

- [ ] 파일 업로드와 웹캠 촬영 둘 다 동작
- [ ] 4개 칸에 사진 배치, 칸별 줌·이동·반전·회전 동작
- [ ] 보정 슬라이더 7종 + 필터 프리셋 6종 동작, 실시간 미리보기
- [ ] 프리셋 프레임 최소 4종, 선택 시 즉시 반영
- [ ] PNG 다운로드, 출력 해상도 상한 적용
- [ ] 데스크톱·모바일 반응형
- [ ] `vite build`로 정적 배포 산출물 생성 확인

## 9. 다음 단계 (1단계 범위 밖, 참고용)

- 2단계: 프레임 색·여백·로고·텍스트 사용자 커스터마이징, 로컬 저장
- 3단계: 프레임 정의 JSON 내보내기/불러오기, URL 공유
- 4단계: 공개 갤러리 (이때부터 Supabase 등 백엔드 필요)

각 단계는 1단계 완성 후 별도로 Claude Code에 지시할 것. 한 번에 전부 만들지 말 것.
