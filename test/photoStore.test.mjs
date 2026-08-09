// 헤드리스 검증: 사진 한 장당 원본·썸네일 object URL이 만들어지고, 썸네일이
// 긴 변 320px로 축소되며, 세션 종료 시 두 URL이 빠짐없이 해제되는지 확인한다.
// (해제가 빠지면 행사장에서 사람이 바뀔 때마다 Blob이 그대로 쌓인다.)
// 실행: node --import ./test/ts-resolve-hook.mjs test/photoStore.test.mjs
import assert from 'node:assert';

const created = [];
const revoked = [];
globalThis.URL = class {
  static createObjectURL(blob) {
    const url = `blob:test/${created.length}`;
    created.push({ url, blob });
    return url;
  }
  static revokeObjectURL(url) {
    revoked.push(url);
  }
};

// 원본 크기와 축소 결과를 확인하려고 canvas·Image를 최소한으로 흉내낸다.
let drawn = null;
const canvases = [];
globalThis.document = {
  createElement() {
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({
        drawImage: (_img, _x, _y, w, h) => { drawn = { w, h }; },
      }),
      toBlob: (cb, type, quality) => {
        canvas.encoded = { type, quality };
        cb({ thumbOf: canvas.width * canvas.height });
      },
    };
    canvases.push(canvas);
    return canvas;
  },
};

// 4000×3000 원본을 디코딩한 것처럼 동작. size가 0이면 디코딩 실패.
let closed = 0;
const bitmaps = [];
globalThis.createImageBitmap = async (blob, options) => {
  if (blob.size === 0) throw new Error('decode failed');
  const bitmap = { width: 4000, height: 3000, options, close: () => { closed++; } };
  bitmaps.push(bitmap);
  return bitmap;
};

const { createPhoto, revokePhotos } = await import('../src/lib/photoStore.ts');

// 1. 사진 한 장당 원본 + 썸네일 URL 두 개.
const photo = await createPhoto({ size: 3_200_000 });
assert.strictEqual(created.length, 2, '사진 한 장당 URL 두 개(원본·썸네일)여야 한다');
assert.strictEqual(created[0].blob.size, 3_200_000, '첫 URL은 원본 Blob이어야 한다');
assert.strictEqual(photo.url, created[0].url);
assert.strictEqual(photo.thumbUrl, created[1].url);

// 2. 썸네일은 긴 변 320px로 축소된다 (4000×3000 → 320×240).
assert.deepStrictEqual(drawn, { w: 320, h: 240 }, '긴 변 320px로 축소해 그려야 한다');

// 3. 그리드용이므로 JPEG 0.7로 인코딩한다.
assert.deepStrictEqual(
  canvases[0].encoded,
  { type: 'image/jpeg', quality: 0.7 },
  'JPEG quality 0.7로 인코딩해야 한다'
);

// 4. 원본 디코딩은 close()로 즉시 반납한다 (이걸 빠뜨리면 축소한 의미가 없다).
assert.strictEqual(closed, 1, 'ImageBitmap을 close()해야 한다');

// 5. EXIF 회전을 <img>와 같게 적용한다 (썸네일과 미리보기 방향 일치).
assert.strictEqual(
  bitmaps[0].options.imageOrientation,
  'from-image',
  'EXIF 회전을 적용해야 한다'
);

// 6. id는 서로 겹치지 않는다 (React key·참조용).
const more = [await createPhoto({ size: 1 }), await createPhoto({ size: 2 })];
assert.strictEqual(new Set([photo, ...more].map((p) => p.id)).size, 3, 'id가 고유해야 한다');

// 7. revokePhotos는 원본과 썸네일을 모두 해제한다.
revokePhotos([photo, ...more]);
assert.deepStrictEqual(
  revoked.slice().sort(),
  [photo, ...more].flatMap((p) => [p.url, p.thumbUrl]).sort(),
  '원본·썸네일 URL이 모두 해제되어야 한다'
);

// 8. 디코딩에 실패하면 object URL을 하나도 만들지 않는다 (누수 방지).
const urlsBefore = created.length;
await assert.rejects(() => createPhoto({ size: 0 }), '디코딩 실패는 reject되어야 한다');
assert.strictEqual(created.length, urlsBefore, '실패 시 URL을 만들지 않아야 한다');

console.log('photoStore 검증 통과 (8 케이스)');
