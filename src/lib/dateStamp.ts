import type { FrameDateStamp } from '../frames/types';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * format의 토큰(YYYY YY MM DD HH mm ss)을 date의 로컬 시각 값으로 바꾼다.
 * 토큰이 아닌 문자는 그대로 남는다.
 */
export function formatDateStamp(format: string, date: Date): string {
  return format.replace(/YYYY|YY|MM|DD|HH|mm|ss/g, (token) => {
    switch (token) {
      case 'YYYY': return String(date.getFullYear());
      case 'YY': return pad(date.getFullYear() % 100);
      case 'MM': return pad(date.getMonth() + 1);
      case 'DD': return pad(date.getDate());
      case 'HH': return pad(date.getHours());
      case 'mm': return pad(date.getMinutes());
      default: return pad(date.getSeconds());
    }
  });
}

/**
 * 날짜 스탬프 폰트가 준비될 때까지 기다린다. 웹폰트가 아직 로드되지 않은
 * 상태로 canvas에 그리면 폴백 폰트로 굳어 미리보기와 export가 어긋난다.
 * 로드에 실패해도 스탬프는 폴백 폰트로 그려야 하므로 조용히 넘어간다.
 */
export async function waitForStampFont(stamp: FrameDateStamp | undefined): Promise<void> {
  if (!stamp || typeof document === 'undefined' || !document.fonts) return;
  try {
    await document.fonts.load(`16px ${stamp.fontFamily}`);
  } catch {
    // 폴백 폰트로 진행
  }
}
