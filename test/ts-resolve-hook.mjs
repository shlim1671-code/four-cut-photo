// resolve 훅: 확장자 없는 상대 import가 실패하면 .ts를 붙여 재시도한다.
import { registerHooks } from 'node:module';

export function resolve(specifier, context, nextResolve) {
  try {
    return nextResolve(specifier, context);
  } catch (err) {
    if ((specifier.startsWith('./') || specifier.startsWith('../')) && !/\.[a-z]+$/i.test(specifier)) {
      return nextResolve(specifier + '.ts', context);
    }
    throw err;
  }
}

// Vite는 이미지 import를 URL 문자열로 바꿔주지만 Node에는 그런 로더가 없어
// .png import가 든 모듈(definitions.ts)을 그대로 못 읽는다. 테스트에서는 값이
// 경로 문자열이기만 하면 되므로 Vite와 같은 모양의 스텁으로 대체한다.
const ASSET_RE = /\.(png|jpe?g|gif|svg|webp|avif)$/i;

export function load(url, context, nextLoad) {
  if (ASSET_RE.test(new URL(url).pathname)) {
    return {
      format: 'module',
      shortCircuit: true,
      source: `export default ${JSON.stringify(url)};`,
    };
  }
  return nextLoad(url, context);
}

// `node --import ./test/ts-resolve-hook.mjs`로 이 파일을 직접 불러도 훅이 걸리도록 자체 등록한다.
registerHooks({ resolve, load });
