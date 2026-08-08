// 헤드리스 검증: loadImage가 로드 실패(onerror)와 무응답(timeout)에서
// 무한 대기하지 않고 반드시 reject되는지 확인한다.
// 실행: node --import ./test/ts-resolve-hook.mjs test/loadImage.test.mjs
import assert from 'node:assert';

// 브라우저 Image 스텁. src 값에 따라 성공/실패/무응답을 흉내낸다.
class FakeImage {
  set src(value) {
    if (value === 'ok') setTimeout(() => this.onload?.(), 0);
    else if (value === 'broken') setTimeout(() => this.onerror?.(), 0);
    // 'hang': onload도 onerror도 부르지 않는다 (실제 브라우저에서 응답 없는 경우)
  }
}
globalThis.Image = FakeImage;

const { loadImage } = await import('../src/lib/loadImage.ts');

// 1. 정상 로드는 resolve된다.
assert.ok(await loadImage('ok', 50), 'ok는 이미지로 resolve되어야 한다');

// 2. onerror는 reject된다.
await assert.rejects(() => loadImage('broken', 50), '깨진 이미지는 reject되어야 한다');

// 3. 응답이 없어도 timeout 안에 reject된다.
const started = Date.now();
await assert.rejects(() => loadImage('hang', 50), '무응답은 timeout으로 reject되어야 한다');
assert.ok(Date.now() - started < 1000, 'timeout이 실제로 동작해야 한다');

// 4. 한 장이 실패하면 Promise.all 전체가 무한 대기 없이 실패한다 (ExportButton 경로).
await assert.rejects(
  () => Promise.all([loadImage('ok', 50), loadImage('broken', 50), loadImage('hang', 50)]),
  'Promise.all은 pending으로 남지 않아야 한다'
);

console.log('loadImage 검증 통과 (4 케이스)');
