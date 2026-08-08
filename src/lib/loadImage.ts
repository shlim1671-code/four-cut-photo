// 이미지 로드 공용 헬퍼. onload만 처리하면 손상된 파일이나 디코딩 실패 시
// Promise가 영원히 pending으로 남으므로, onerror와 timeout을 모두 실패로 다룬다.
export const IMAGE_LOAD_TIMEOUT_MS = 8000;

export function loadImage(
  src: string,
  timeoutMs: number = IMAGE_LOAD_TIMEOUT_MS
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => reject(new Error('image load timeout')), timeoutMs);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error('image load failed'));
    };
    img.src = src;
  });
}
