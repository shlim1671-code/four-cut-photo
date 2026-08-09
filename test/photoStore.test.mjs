// 헤드리스 검증: 사진 한 장당 object URL이 정확히 하나 만들어지고,
// 세션 종료 시 revokePhotos가 그 URL을 빠짐없이 해제하는지 확인한다.
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

const { createPhoto, revokePhotos } = await import('../src/lib/photoStore.ts');

// 1. Blob 한 개당 object URL 한 개. base64 문자열은 만들지 않는다.
const blobs = [{ size: 1 }, { size: 2 }, { size: 3 }];
const photos = blobs.map(createPhoto);
assert.strictEqual(created.length, 3, '사진 수만큼만 object URL을 만들어야 한다');
assert.deepStrictEqual(
  created.map((c) => c.blob),
  blobs,
  '넘긴 Blob이 그대로 URL의 원본이어야 한다 (사본 없음)'
);

// 2. id는 서로 겹치지 않는다 (React key·참조용).
assert.strictEqual(new Set(photos.map((p) => p.id)).size, 3, 'id가 고유해야 한다');

// 3. revokePhotos는 모든 URL을 정확히 한 번씩 해제한다.
revokePhotos(photos);
assert.deepStrictEqual(
  revoked.slice().sort(),
  photos.map((p) => p.url).sort(),
  '모든 사진의 URL이 해제되어야 한다'
);

// 4. 빈 목록에서도 안전하다 (사진 없이 리셋하는 경우).
revokePhotos([]);
assert.strictEqual(revoked.length, 3, '빈 목록은 아무것도 해제하지 않는다');

console.log('photoStore 검증 통과 (4 케이스)');
