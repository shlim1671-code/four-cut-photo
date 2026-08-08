// 헤드리스 검증: savePng의 분기(Web Share 시트 vs <a download>)가
// 의도대로 갈리는지, 그리고 objectURL이 반드시 해제되는지 확인한다.
// 실행: node --import ./test/ts-resolve-hook.mjs test/savePng.test.mjs
import assert from 'node:assert';

// 브라우저 환경 스텁. 각 테스트가 필요한 만큼만 갈아끼운다.
const created = [];
const revoked = [];
let clicked = [];
let shared = [];

globalThis.URL.createObjectURL = (blob) => {
  const url = `blob:${created.length}`;
  created.push({ url, blob });
  return url;
};
globalThis.URL.revokeObjectURL = (url) => revoked.push(url);

globalThis.document = {
  createElement: () => {
    const a = { href: '', download: '', click: () => clicked.push({ ...a }) };
    return a;
  },
};

function setupEnv({ share, canShare, pointerCoarse }) {
  clicked = [];
  shared = [];
  // node의 globalThis.navigator는 getter라 재정의로만 교체할 수 있다.
  const nav = {};
  if (share) {
    nav.share = (data) => {
      shared.push(data);
      return share();
    };
  }
  if (canShare) nav.canShare = canShare;
  Object.defineProperty(globalThis, 'navigator', { value: nav, configurable: true });
  globalThis.window = {
    matchMedia: (q) => ({ matches: q === '(pointer: coarse)' && pointerCoarse }),
  };
}

// toBlob이 항상 PNG 블롭을 주는 canvas 스텁.
const canvas = {
  toBlob: (cb, type) => cb(new Blob(['png'], { type })),
};

const { savePng, shouldShareFile, toPngBlob } = await import('../src/lib/savePng.ts');

// 1. 모바일(공유 가능 + 터치 포인터): 공유 시트로 간다. 다운로드는 안 한다.
setupEnv({ share: () => Promise.resolve(), canShare: () => true, pointerCoarse: true });
assert.equal(await savePng(canvas, 'a.png'), true, '공유 성공은 저장 성공이다');
assert.equal(shared.length, 1, '공유 시트가 떠야 한다');
assert.equal(shared[0].files[0].name, 'a.png', '파일명이 공유에 실려야 한다');
assert.equal(clicked.length, 0, '공유 분기에서는 <a download>를 쓰지 않는다');

// 2. 데스크톱(공유 API 없음): 기존대로 objectURL + <a download>.
setupEnv({ pointerCoarse: false });
const before = created.length;
assert.equal(await savePng(canvas, 'b.png'), true, '다운로드는 저장 성공이다');
assert.equal(clicked.length, 1, '<a>가 클릭되어야 한다');
assert.equal(clicked[0].download, 'b.png', 'download 속성에 파일명이 있어야 한다');
assert.ok(clicked[0].href.startsWith('blob:'), 'data URL이 아니라 objectURL이어야 한다');
assert.equal(created.length, before + 1, 'objectURL이 만들어져야 한다');

// 3. objectURL은 (다음 태스크에) 반드시 해제된다.
await new Promise((r) => setTimeout(r, 0));
assert.ok(revoked.includes(clicked[0].href), 'revokeObjectURL이 호출되어야 한다');

// 4. 데스크톱 Chrome/Safari처럼 공유 API가 있어도 포인터가 터치가 아니면
//    다운로드 경로를 유지한다 (데스크톱 회귀 방지).
setupEnv({ share: () => Promise.resolve(), canShare: () => true, pointerCoarse: false });
assert.equal(await savePng(canvas, 'c.png'), true);
assert.equal(shared.length, 0, '데스크톱은 공유 시트를 띄우지 않는다');
assert.equal(clicked.length, 1, '데스크톱은 다운로드한다');

// 5. 터치 기기라도 파일 공유를 못 하면(canShare false) 다운로드로 폴백한다.
setupEnv({ share: () => Promise.resolve(), canShare: () => false, pointerCoarse: true });
assert.equal(shouldShareFile(new File([], 'x.png')), false, '분기 판단이 false여야 한다');
assert.equal(await savePng(canvas, 'd.png'), true);
assert.equal(clicked.length, 1, '폴백으로 다운로드해야 한다');

// 6. 공유 시트를 닫으면(AbortError) 저장 실패가 아니라 false를 돌려준다.
setupEnv({
  share: () => Promise.reject(Object.assign(new Error('cancel'), { name: 'AbortError' })),
  canShare: () => true,
  pointerCoarse: true,
});
assert.equal(await savePng(canvas, 'e.png'), false, '취소는 저장되지 않은 것이다');
assert.equal(clicked.length, 0, '취소 후 몰래 다운로드하지 않는다');

// 7. 그 외 공유 오류는 호출자가 실패로 다룰 수 있게 그대로 throw한다.
setupEnv({
  share: () => Promise.reject(new Error('boom')),
  canShare: () => true,
  pointerCoarse: true,
});
await assert.rejects(() => savePng(canvas, 'f.png'), '공유 오류는 전파되어야 한다');

// 8. 인코딩 실패(toBlob null)는 reject된다.
await assert.rejects(
  () => toPngBlob({ toBlob: (cb) => cb(null) }),
  '인코딩 실패는 reject되어야 한다'
);

console.log('savePng 검증 통과 (8 케이스)');
