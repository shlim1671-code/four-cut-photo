// node 테스트에서 소스의 확장자 없는 상대 import('./foo')를 './foo.ts'로 해석해 준다.
// 소스 코드(번들러 기준)를 건드리지 않고 헤드리스 테스트를 돌리기 위한 용도.
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('./ts-resolve-hook.mjs', pathToFileURL('./test/'));
