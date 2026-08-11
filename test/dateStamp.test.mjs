// 날짜 스탬프 포맷 토큰 치환 검증.
// 실행: node --import ./test/ts-resolve-hook.mjs test/dateStamp.test.mjs
import assert from 'node:assert';
import { formatDateStamp } from '../src/lib/dateStamp.ts';

// 로컬 시각 기준(브라우저에서 사용자가 보는 날짜와 같아야 한다).
const d = new Date(2026, 7, 11, 9, 5, 3);

assert.equal(formatDateStamp('YYYY.MM.DD', d), '2026.08.11');
assert.equal(formatDateStamp('YY/MM/DD HH:mm:ss', d), '26/08/11 09:05:03');
assert.equal(formatDateStamp('DD MM YYYY', d), '11 08 2026');
// 토큰이 아닌 문자는 그대로 남는다.
assert.equal(formatDateStamp('four cut YYYY', d), 'four cut 2026');

console.log('dateStamp: ok');
