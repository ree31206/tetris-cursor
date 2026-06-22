---
source: https://dev.to/sendotltd/tetris-in-vanilla-js-srs-rotation-7-bag-randomizer-and-why-you-should-separate-game-logic-from-4d25
code: https://github.com/sen-ltd/tetris
title: Tetris in Vanilla JS — SRS, 7-bag, 로직/렌더 분리
fetched: 2026-06-22
note: 로직/렌더 분리, 프레임 독립 중력, DAS, 테스트 우선 — 우리 구조의 직접적 근거.
---

# Tetris in Vanilla JS — 아키텍처

## 1. 로직과 렌더 분리

```
pieces.js   ← 도형, SRS 킥, 7-bag
board.js    ← 순수 로직 (DOM 미접근)
render.js   ← Canvas 렌더
main.js     ← 입력 + 게임 루프
```
의존 방향 한 방향. 하위 계층이 순수라 Node로 전체 규칙 검증 가능.

## 2. 프레임 독립 중력 (ms 누적기 + 클램프)

```js
function tick(ms) {
  game.dropTimer += ms;
  const interval = gravityMs(game.level);
  while (game.dropTimer >= interval) { game.dropTimer -= interval; /* move down */ }
}
// dt = Math.min(now - lastFrame, 100)  // 탭 전환 폭주 방지
```
NES 중력표: [800,720,...,30].

## 3. DAS (Delayed Auto-Shift)

OS 자동반복 무시, 초기 지연 ~150-200ms, 반복 ~30-60ms. 하드드롭/회전은 DAS 제외.

## 4. 비선형 점수

Tetris(4줄)=싱글의 30배(NES) → 전략성. 우리는 가이드라인 base + B2B/Combo 채택.

## 우리 게임 적용

src/ 구조가 이 문서 권장을 그대로 따름: pieces/board(순수, 테스트됨)/game/render/input/main, dt 클램프, DAS/ARR, ms 누적 중력.
