// 촬영·업로드한 사진의 단일 보관소.
//
// 사진 원본은 Blob 하나로만 두고, 화면·캔버스에는 object URL 문자열만 넘긴다.
// base64 data URL은 원본 바이너리의 약 1.33배 크기 문자열로 브라우저 메모리에
// 그대로 상주하지만, Blob은 브라우저가 관리해(필요하면 디스크로 내려) 다량
// 촬영 시 부담이 훨씬 적다.
//
// 사진 한 장당 원본과 축소 썸네일 두 가지를 들고 있다. 그리드(단계2·단계3)가
// 원본을 <img>로 그리면 12MP 사진 하나가 약 48MB짜리 디코딩 비트맵으로 올라와
// 20~30장에서 메모리가 무너진다. 그리드는 썸네일만 보고, 원본은 단계4의
// 합성·보정·내보내기에서만 로드한다.
//
// object URL은 revoke하기 전까지 Blob을 살려두므로, 세션이 끝나면 반드시
// revokePhotos로 해제해야 한다.

export interface Photo {
  id: string;
  /** 원본. 단계4 합성·보정·내보내기용. */
  url: string;
  /** 축소본. 단계2·단계3 그리드용. */
  thumbUrl: string;
}

// 그리드 칸은 실제로 100px 남짓이라 긴 변 320px이면 고해상도 화면에서도 충분하다.
const THUMB_MAX_SIDE = 320;
// 그리드용이라 화질보다 크기 우선.
const THUMB_QUALITY = 0.7;

let nextId = 0;

async function makeThumbnail(blob: Blob): Promise<Blob> {
  // <img>가 아니라 createImageBitmap으로 디코딩한다. <img>로 읽으면 원본
  // 비트맵이 브라우저 이미지 캐시에 URL 단위로 남아, 그리드가 썸네일만 봐도
  // 메모리가 줄지 않는다(실측 확인: 오히려 +40MB 늘었다). ImageBitmap은
  // close()로 디코딩 결과를 그 자리에서 되돌려줄 수 있다.
  // imageOrientation은 명시한다 — <img>처럼 EXIF 회전을 적용해야 단계4
  // 미리보기와 썸네일의 방향이 어긋나지 않는다.
  const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
  const canvas = document.createElement('canvas');
  try {
    const scale = Math.min(1, THUMB_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  } finally {
    bitmap.close();
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (thumb) => (thumb ? resolve(thumb) : reject(new Error('thumbnail encode failed'))),
      'image/jpeg',
      THUMB_QUALITY
    );
  });
}

// 썸네일을 먼저 만든다 — 실패하면 object URL을 하나도 만들지 않아 정리할 것도 없다.
export async function createPhoto(blob: Blob): Promise<Photo> {
  const thumb = await makeThumbnail(blob);
  return {
    id: `photo-${nextId++}`,
    url: URL.createObjectURL(blob),
    thumbUrl: URL.createObjectURL(thumb),
  };
}

export function revokePhotos(photos: Photo[]): void {
  for (const p of photos) {
    URL.revokeObjectURL(p.url);
    URL.revokeObjectURL(p.thumbUrl);
  }
}
