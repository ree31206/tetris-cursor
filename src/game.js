// 게임 상태 머신: 중력(프레임 독립), Lock delay(move reset), Hold, Next 큐,
// 라인삭제 애니메이션, B2B/Combo 점수. 렌더/입력과 분리(순수 로직 + 상태).
// 참고: docs/scoring.md, docs/vanilla-js-architecture-srs-7bag.md, docs/tetris-guideline.md

import { COLS, ROWS, createBag, getCells } from "./pieces.js";
import {
  createBoard,
  fits,
  rotate,
  dropPosition,
  lockPiece,
  getFullRows,
  removeRows,
  lineScore,
} from "./board.js";

export const NEXT_COUNT = 5;
const LOCK_DELAY = 500; // ms
const MAX_RESET = 15; // move reset 횟수 제한
const CLEAR_ANIM_MS = 220;
const SOFT_DROP_POINT = 1;
const HARD_DROP_POINT = 2;
const LINES_PER_LEVEL = 10;

// NES 중력표(ms). index = level-1. docs/vanilla-js-architecture-srs-7bag.md
const GRAVITY_TABLE = [
  800, 720, 630, 550, 470, 380, 300, 220, 130, 100,
  80, 80, 80, 70, 70, 70, 50, 50, 50, 30,
];

function gravityMs(level) {
  const i = level - 1;
  return i >= GRAVITY_TABLE.length ? 30 : GRAVITY_TABLE[i];
}

export function createGame(rng = Math.random) {
  const game = {
    board: createBoard(),
    bag: createBag(rng),
    nextQueue: [],
    current: null,
    holdType: null,
    holdUsed: false,
    score: 0,
    lines: 0,
    level: 1,
    combo: -1,
    b2b: false,
    status: "ready", // ready | playing | paused | over
    clearing: null, // { rows, timer, total }
    dropTimer: 0,
    lockTimer: 0,
    resetCount: 0,
    resting: false,
    events: [],
  };

  function emit(ev) {
    game.events.push(ev);
  }

  function fillQueue() {
    while (game.nextQueue.length < NEXT_COUNT) game.nextQueue.push(game.bag.next());
  }

  function spawnFrom(type) {
    const piece = { type, rotation: 0, x: 3, y: 0 };
    game.current = piece;
    game.holdUsed = false;
    game.dropTimer = 0;
    game.lockTimer = 0;
    game.resetCount = 0;
    game.resting = false;
    if (!fits(game.board, type, 0, piece.x, piece.y)) {
      game.current = null;
      game.status = "over";
      emit({ kind: "gameover" });
    }
  }

  function spawnNext() {
    fillQueue();
    spawnFrom(game.nextQueue.shift());
    fillQueue();
  }

  function reset() {
    game.board = createBoard();
    game.bag = createBag(rng);
    game.nextQueue = [];
    game.holdType = null;
    game.holdUsed = false;
    game.score = 0;
    game.lines = 0;
    game.level = 1;
    game.combo = -1;
    game.b2b = false;
    game.clearing = null;
    game.status = "playing";
    game.events = [];
    fillQueue();
    spawnNext();
  }

  function canMoveDown() {
    const c = game.current;
    return c && fits(game.board, c.type, c.rotation, c.x, c.y + 1);
  }

  // 착지 상태에서 성공적 이동/회전 시 lock delay 리셋(move reset, 최대 횟수).
  function onSuccessfulMove() {
    if (game.resting && game.resetCount < MAX_RESET) {
      game.lockTimer = 0;
      game.resetCount++;
    }
  }

  function applyClearScore(linesCleared) {
    const difficult = linesCleared === 4; // (T-spin은 이번 범위 외)
    let gained = lineScore(linesCleared, game.level);
    if (difficult && game.b2b) {
      gained = Math.floor(gained * 1.5);
      emit({ kind: "b2b" });
    }
    // combo
    game.combo++;
    if (game.combo > 0) gained += 50 * game.combo * game.level;
    if (linesCleared === 4) emit({ kind: "tetris" });

    game.score += gained;
    game.lines += linesCleared;
    const newLevel = Math.floor(game.lines / LINES_PER_LEVEL) + 1;
    if (newLevel > game.level) {
      game.level = newLevel;
      emit({ kind: "levelup", level: game.level });
    }
    game.b2b = difficult ? true : false;
    emit({ kind: "score", amount: gained, lines: linesCleared });
  }

  function lockCurrent() {
    // lock-out: 한 셀이라도 가시영역 위(음수 y)에서 고정되면 게임오버.
    const lockedAbove = getCells(game.current.type, game.current.rotation).some(
      ([, cy]) => game.current.y + cy < 0
    );
    lockPiece(game.board, game.current);
    emit({ kind: "lock" });
    if (lockedAbove) {
      game.current = null;
      game.status = "over";
      emit({ kind: "gameover" });
      return;
    }
    const rows = getFullRows(game.board);
    if (rows.length > 0) {
      game.clearing = { rows, timer: CLEAR_ANIM_MS, total: CLEAR_ANIM_MS };
      game.current = null; // 애니메이션 동안 활성 피스 없음
    } else {
      game.combo = -1; // 라인 없는 락은 콤보 끊김
      spawnNext();
    }
  }

  function finishClear() {
    const n = game.clearing.rows.length;
    removeRows(game.board, game.clearing.rows);
    applyClearScore(n);
    game.clearing = null;
    spawnNext();
  }

  function update(dt) {
    if (game.status !== "playing") return;
    if (game.clearing) {
      game.clearing.timer -= dt;
      if (game.clearing.timer <= 0) finishClear();
      return;
    }
    if (!game.current) return;

    game.dropTimer += dt;
    const interval = gravityMs(game.level);
    let guard = 0;
    while (game.dropTimer >= interval && canMoveDown() && guard++ < ROWS) {
      game.dropTimer -= interval;
      game.current.y++;
    }
    if (!canMoveDown()) {
      game.resting = true;
      // 착지 동안 dropTimer가 쌓여 우물로 미끄러질 때 순간 다칸 낙하하는 것 방지.
      game.dropTimer = Math.min(game.dropTimer, interval);
      game.lockTimer += dt;
      if (game.lockTimer >= LOCK_DELAY) lockCurrent();
    } else {
      game.resting = false;
      game.lockTimer = 0;
      game.resetCount = 0;
    }
  }

  function moveHoriz(dx) {
    const c = game.current;
    if (game.status !== "playing" || game.clearing || !c) return false;
    if (fits(game.board, c.type, c.rotation, c.x + dx, c.y)) {
      c.x += dx;
      onSuccessfulMove();
      return true;
    }
    return false;
  }

  function softDrop() {
    const c = game.current;
    if (game.status !== "playing" || game.clearing || !c) return;
    if (canMoveDown()) {
      c.y++;
      game.score += SOFT_DROP_POINT;
      game.dropTimer = 0;
    }
  }

  function hardDrop() {
    const c = game.current;
    if (game.status !== "playing" || game.clearing || !c) return;
    const ny = dropPosition(game.board, c.type, c.rotation, c.x, c.y);
    const dist = ny - c.y;
    if (dist > 0) game.score += dist * HARD_DROP_POINT;
    c.y = ny;
    lockCurrent();
  }

  function doRotate(dir) {
    const c = game.current;
    if (game.status !== "playing" || game.clearing || !c) return;
    const res = rotate(game.board, c, dir);
    if (res) {
      c.rotation = res.rotation;
      c.x = res.x;
      c.y = res.y;
      onSuccessfulMove();
    }
  }

  function hold() {
    if (game.status !== "playing" || game.clearing || !game.current || game.holdUsed) return;
    const cur = game.current.type;
    if (game.holdType == null) {
      game.holdType = cur;
      spawnNext();
    } else {
      const swap = game.holdType;
      game.holdType = cur;
      spawnFrom(swap);
    }
    game.holdUsed = true;
  }

  function togglePause() {
    if (game.status === "playing") game.status = "paused";
    else if (game.status === "paused") game.status = "playing";
  }

  function ghostY() {
    const c = game.current;
    if (!c) return null;
    return dropPosition(game.board, c.type, c.rotation, c.x, c.y);
  }

  function consumeEvents() {
    const ev = game.events;
    game.events = [];
    return ev;
  }

  return {
    state: game,
    reset,
    update,
    moveLeft: () => moveHoriz(-1),
    moveRight: () => moveHoriz(1),
    softDrop,
    hardDrop,
    rotateCW: () => doRotate(1),
    rotateCCW: () => doRotate(-1),
    hold,
    togglePause,
    ghostY,
    consumeEvents,
    gravityMs,
  };
}
