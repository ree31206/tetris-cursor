---
source: https://tetris.wiki/Random_Generator
title: Random Generator (7-bag)
fetched: 2026-06-22
license: TetrisWiki (CC BY-SA)
---

# Random Generator (7-bag)

## 동작

- 7종(I,J,L,O,S,T,Z)을 한 봉지에 넣고 섞어 하나씩, 비면 재충전.

## 보장 특성

- 드라우트 제한(I 간격 최대 12), 같은 피스 최대 2연속(봉지 경계), 3연속 불가.

## 구현 (Fisher-Yates)

```js
function createBag(rng = Math.random) {
  let bag = [];
  function refill() {
    bag = ["I","J","L","O","S","T","Z"];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }
  return { next() { if (!bag.length) refill(); return bag.shift(); } };
}
```

우리 게임은 src/pieces.js createBag으로 구현(peek로 Next 큐 지원).
