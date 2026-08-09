// 촬영·업로드한 사진의 단일 보관소.
//
// 사진 원본은 Blob 하나로만 두고, 화면·캔버스에는 object URL 문자열만 넘긴다.
// base64 data URL은 원본 바이너리의 약 1.33배 크기 문자열로 브라우저 메모리에
// 그대로 상주하지만, Blob은 브라우저가 관리해(필요하면 디스크로 내려) 다량
// 촬영 시 부담이 훨씬 적다.
//
// object URL은 revoke하기 전까지 Blob을 살려두므로, 세션이 끝나면 반드시
// revokePhotos로 해제해야 한다.

export interface Photo {
  id: string;
  /** URL.createObjectURL(blob). img.src·canvas 로드에 그대로 쓴다. */
  url: string;
}

let nextId = 0;

export function createPhoto(blob: Blob): Photo {
  return { id: `photo-${nextId++}`, url: URL.createObjectURL(blob) };
}

export function revokePhotos(photos: Photo[]): void {
  for (const p of photos) URL.revokeObjectURL(p.url);
}
