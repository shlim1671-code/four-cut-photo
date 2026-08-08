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

// `node --import ./test/ts-resolve-hook.mjs`로 이 파일을 직접 불러도 훅이 걸리도록 자체 등록한다.
registerHooks({ resolve });
