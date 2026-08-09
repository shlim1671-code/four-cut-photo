# PROGRESS.md — 4컷 사진 앱 진행 상황 (인수인계용)

> 새 세션 시작 시 이 문서 + SPEC.md + CLAUDE.md + frame-coordinates.md를
> 함께 읽으면 거의 끊김 없이 이어갈 수 있다.
> 저장소: github.com/shlim1671-code/four-cut-photo (GitHub Pages 배포)
> 개발: Claude Code. 작업 = PR 단위, 사람이 직접 머지.
> **이 문서는 작업 진행에 따라 계속 갱신해야 한다 — 낡은 채로 방치하지 말 것.**

---

## 1. 프로젝트 개요

4컷 사진 웹앱. 순수 프론트엔드(React 19 + Vite + TypeScript + Tailwind CSS4),
백엔드 없음. 모든 이미지 처리는 브라우저 Canvas. GitHub Pages 정적 배포.
프레임은 개발자가 definitions.ts에 정의값으로 관리(사용자 편집 없음).
용도: 행사용 + 오픈소스 공개. 사용 환경: 행사장 태블릿 + 개인 폰.

---

## 2. 완료된 것 (PR #1~#17 기준, 2026-05-25까지)

### 1단계 MVP
프로젝트 셋업 / 프레임 정의 4종 / 사진 입력(업로드+웹캠) / Canvas 합성 /
GitHub Pages 배포 / FramePicker / SlotEditor(칸별 위치·줌·반전·회전) /
AdjustPanel(보정+피부스무딩) / ExportButton(2400px 상한 PNG)

### 2단계
- 4단계 마법사 흐름 (프레임 고르기 → 사진 확보 → 4장 고르기 → 마무리)
- 보정 UI: 슬라이더 제거 → 프리셋 6종 + 피부보정 토글
- 미리보기↔합성 결과 구도 불일치 수정 (slotGeometry.ts 단일 진실 소스)
- 프레임 4종 칸 좌표를 레퍼런스 실측값(v2)으로 교체 (frame-coordinates.md)
- 프레임 선택 UI → 캐러셀
- 미리보기 흐림 수정 (표시 크기·DPR 기준 렌더)
- 필터 프리셋 6종 정량값 적용 + 피부 스무딩 경계 보존 강화
- 사진 보관을 base64 data URL → Blob + object URL로 전환 (src/lib/photoStore.ts).
  App의 pool이 단일 출처, 나머지는 URL만 참조. 세션 리셋·언마운트 시
  revokeObjectURL로 명시 해제. 24장 업로드 실측: 세션 종료 후 잔존
  메모리 210MB → 96MB (−54%), 사용 중 최대 702MB → 588MB (−16%)

### 문서 정리
- frame-coordinates-v2.md → frame-coordinates.md로 개명 (현재 유일한 좌표 문서)
- PROGRESS.md를 저장소에 커밋 (그 전엔 Claude 프로젝트 파일로만 존재 — 이게
  2달 공백 후 맥락 복원이 어려웠던 근본 원인이었음)

---

## 3. 2026-08-08 코드 리뷰에서 발견된 이슈 (다음 작업의 근거)

repo를 직접 클론해 빌드·테스트·의존성 감사 실행. 발견 사항:

**심각**
- 테스트 3개 중 2개가 실제로 안 돌아가거나 실패 중이었음
  (presets.test.mjs: 모듈 resolve 에러로 실행 자체 불가 /
   slotGeometry.test.mjs: grid-2x2 칸1에서 반올림 오차로 실패).
  package.json에 test 스크립트가 없어서 아무도 몰랐음.
- 이미지 로드 실패 시(onerror 미처리) ExportButton이 무한 "저장 중…"
  상태에 빠짐.
- iOS Safari는 <a download>를 무시해서 모바일 저장이 실패할 가능성 높음
  (주 사용 환경이 폰인데 치명적). → 해결(섹션 4의 3번): toBlob + Web Share
  파일 공유로 전환, 데스크톱은 objectURL 다운로드 유지.

**설계 공백**
- 행사 다중 사용자 시나리오 미고려: 저장 후 자동 초기화 없음, "처음으로"
  버튼에 확인 없음, 프라이버시 안내 문구 없음.
- 사진을 base64 문자열로 다중 보관 → 태블릿에서 다량 촬영 시 메모리 우려.
  → 해결(섹션 4의 6번): Blob + object URL 전환. 다만 실측 결과 메모리의
  주된 소비처는 base64 문자열이 아니라 **원본 해상도 썸네일의 디코딩
  비트맵**이었다 (섹션 4의 7번으로 이어짐).

**오픈소스 공개 준비 0%**
- README가 Vite 기본 템플릿 그대로, LICENSE 없음, package.json 메타 비어있음.

**기타**: dark-event 텍스트가 칸 침범 가능성, 해상도 상한(2400px) 정책이
세로 스트립엔 칸당 폭이 작아 부족할 수 있음, index.html lang="en"/제목 미설정,
접근성(aria) 거의 없음, deploy.yml이 npm ci 대신 npm install 사용.

**해소된 것**: frame-coordinates-final.md(구버전 추론, aspectRatio 0.333)는
frame-coordinates.md(v2, aspectRatio 0.25)로 이미 대체되어 있었고 실제
definitions.ts와도 v2가 일치함 — 문서 상충 우려는 기우였음.

---

## 4. 다음 작업 순서

0-B. 테스트 파이프라인 복구 (모델: Opus) — ts-resolve-hook 확장자 미지정
     import 처리, slotGeometry 허용오차 현실화
0-C. package.json test 스크립트 + deploy.yml에 테스트 연결 (Sonnet)
1.   이미지 로드 실패 처리 — onerror/timeout (Opus)
2.   행사 운영 UX — 자동 초기화, 확인 다이얼로그, 프라이버시 문구 (Sonnet)
3.   모바일 저장 — toBlob + Web Share API 폴백 (Opus) — 완료
     (src/lib/savePng.ts, test/savePng.test.mjs. 분기 조건:
      canShare({files}) && pointer:coarse → 공유 시트, 그 외 → 다운로드)
4.   오픈소스 공개 준비 — README/LICENSE/package.json 메타 (Sonnet)
6.   사진 보관 중복 제거 — Blob + object URL, 단일 출처, 명시적 해제 (Opus) — 완료
     (src/lib/photoStore.ts, test/photoStore.test.mjs)
7.   **썸네일 다운스케일** — 남은 메모리의 대부분이 여기다. 단계2·단계3
     그리드가 원본 해상도 <img>를 그대로 써서, 12MP 사진 1장당 디코딩
     비트맵이 약 48MB. 24장이면 사용 중 약 590MB. 업로드 시 긴 변
     ~320px 썸네일 Blob을 따로 만들어 그리드는 그것만 보게 하면
     대부분 회수된다. (원본은 단계4 합성·export용으로만 유지)
8+.  dark-event 텍스트 침범 수정, 해상도 정책 재검토, 캐러셀 폭 100%,
     white-plain 경계 표시, editorContext.tsx 死코드 정리, 비주얼 마감

각 PR 지시문은 Claude(claude.ai) 세션에서 작성해 여기에 붙여넣는 방식으로
진행. PR 머지 시마다 이 문서의 "완료된 것" 섹션을 갱신할 것.

---

## 5. 확정된 설계 원칙

- 보정 UI: 사용자에게 슬라이더 노출 안 함. 프리셋 6종(원본/부스톤/필름흑백/
  빈티지컬러/쿨톤/클래식세피아) + 피부보정 on/off 토글만.
- 프레임 칸 좌표는 frame-coordinates.md(v2)가 유일한 기준 —
  portrait-strip 계열 aspectRatio 0.25 (칸비율 1:1.1, 세로 살짝 김),
  grid-2x2는 aspectRatio 0.667 (칸비율 1:1.25).
- 작업 방식: 한 작업 = 한 PR, 사람이 머지. Claude Code 작업 지시문
  첫 줄엔 항상 "SPEC.md와 CLAUDE.md를 읽어줘" 포함.
- 모델 선택: 로직이 얽히거나 정밀한 작업(비동기 흐름, 브라우저별 분기,
  부동소수점/허용오차 설계)은 Opus, 단순 반복·문서·설정 작업은 Sonnet.
- 모든 이미지 처리는 클라이언트에서만. 서버 전송 금지.
- 출력 해상도 상한 2400px (긴 변 기준) — 단, 정책 재검토 예정(섹션 4의 5+ 참조).
