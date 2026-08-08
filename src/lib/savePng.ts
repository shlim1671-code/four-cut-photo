// PNG 저장 공용 헬퍼.
// iOS Safari는 <a download>를 무시해서 새 탭에 이미지가 열리기만 하고 저장이
// 안 된다. 그래서 파일 공유가 가능한 터치 기기에서는 Web Share API로 공유
// 시트를 띄우고("사진에 저장"), 그 외에는 기존대로 <a download>로 내려받는다.

// 분기 판단: 아래 두 조건을 모두 만족할 때만 공유 시트를 쓴다.
//  1) navigator.share/canShare로 이 파일을 공유할 수 있다
//  2) 주 포인터가 터치다 (pointer: coarse) — 폰·태블릿
// 2번이 필요한 이유: Windows Chrome·macOS Safari 같은 데스크톱 브라우저도
// canShare({files})가 true라서, 1번만 보면 데스크톱 다운로드가 공유 시트로
// 바뀌어버린다. 데스크톱 동작은 종전 그대로 유지한다.
export function shouldShareFile(file: File): boolean {
  return (
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] }) &&
    window.matchMedia('(pointer: coarse)').matches
  );
}

export function toPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('png encode failed'));
    }, 'image/png');
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  // 클릭 직후 동기 revoke는 브라우저가 다운로드를 시작하기 전에 URL을 없앨 수
  // 있다. 다음 태스크로 미뤄 해제한다.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

// 저장되면 true, 사용자가 공유 시트를 닫으면 false를 돌려준다.
export async function savePng(
  canvas: HTMLCanvasElement,
  filename: string
): Promise<boolean> {
  const blob = await toPngBlob(canvas);
  const file = new File([blob], filename, { type: 'image/png' });

  if (shouldShareFile(file)) {
    try {
      await navigator.share({ files: [file] });
      return true;
    } catch (err) {
      // 공유 시트를 닫은 것(AbortError)은 실패가 아니라 취소다.
      if (err instanceof Error && err.name === 'AbortError') return false;
      throw err;
    }
  }

  downloadBlob(blob, filename);
  return true;
}
