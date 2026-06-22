---
source: https://jakesgordon.com/writing/javascript-tetris/
code: https://github.com/jakesgordon/javascript-tetris (MIT)
title: Javascript Tetris (Jake Gordon)
fetched: 2026-06-22
note: 가장 유명한 단일 파일 JS 테트리스 튜토리얼. 비트마스크 회전, 봉지 랜덤, 게임 루프.
---

# Javascript Tetris (Jake Gordon)

HTML5 + 인라인 JS 단순 구현. 핵심 아이디어.

## 회전: 4x4 비트마스크

7피스 × 4회전 = 28패턴을 16비트 정수로 하드코딩.

```js
var i = { blocks: [0x0F00, 0x2222, 0x00F0, 0x4444], color: 'cyan'   };
var o = { blocks: [0xCC00, 0xCC00, 0xCC00, 0xCC00], color: 'yellow' };
var t = { blocks: [0x0E40, 0x4C40, 0x4E00, 0x4640], color: 'purple' };
```

## 충돌 검사

```js
function occupied(type, x, y, dir) {
  var result = false;
  eachblock(type, x, y, dir, function(x, y) {
    if ((x < 0) || (x >= nx) || (y < 0) || (y >= ny) || getBlock(x, y)) result = true;
  });
  return result;
}
```

## 랜덤 (단순 봉지)

각 피스 4개씩 담은 봉지에서 비복원 추출(현대 표준은 각 1개씩 7-bag — random-generator-7bag.md).

## 게임 루프

`requestAnimationFrame`으로 dt 기반 update + draw. invalidate 플래그로 바뀐 부분만 다시 그림.

## 우리 게임과 비교

- 우리는 좌표 배열(가독성) + SRS kick(정확성) 채택. invalidate 부분 렌더링은 추후 최적화 아이디어.
