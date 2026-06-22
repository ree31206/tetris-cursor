"use strict";

// =============================================================
// Tetris - 데이터 / 렌더링 / 게임 로직 / 입력을 분리해 구현한다.
// =============================================================

// ---------- 상수 (데이터) ----------
const COLS = 10;
const ROWS = 20;
const CELL = 30; // 보드 한 칸의 픽셀 크기 (canvas 300x600 = 10x20)
const NEXT_CELL = 24;

// 자동 낙하 간격: 레벨이 오를수록 빨라진다.
const BASE_DROP_MS = 800;
const MIN_DROP_MS = 80;
const LEVEL_STEP_MS = 70;
const LINES_PER_LEVEL = 10;

// 줄 수에 따른 점수 (레벨 가중치는 계산 시 곱한다)
const LINE_SCORES = [0, 100, 300, 500, 800];

const EMPTY = 0;

// 7종 테트로미노: 각 회전 상태를 4x4 좌표(또는 회전 행렬)로 표현한다.
// 여기서는 각 조각의 셀 좌표를 회전 상태별로 정의한다.
const TETROMINOES = {
  I: {
    color: "#3fd0e0",
    rotations: [
      [[0, 1], [1, 1], [2, 1], [3, 1]],
      [[2, 0], [2, 1], [2, 2], [2, 3]],
      [[0, 2], [1, 2], [2, 2], [3, 2]],
      [[1, 0], [1, 1], [1, 2], [1, 3]],
    ],
  },
  J: {
    color: "#5a7bff",
    rotations: [
      [[0, 0], [0, 1], [1, 1], [2, 1]],
      [[1, 0], [2, 0], [1, 1], [1, 2]],
      [[0, 1], [1, 1], [2, 1], [2, 2]],
      [[1, 0], [1, 1], [0, 2], [1, 2]],
    ],
  },
  L: {
    color: "#ff9f43",
    rotations: [
      [[2, 0], [0, 1], [1, 1], [2, 1]],
      [[1, 0], [1, 1], [1, 2], [2, 2]],
      [[0, 1], [1, 1], [2, 1], [0, 2]],
      [[0, 0], [1, 0], [1, 1], [1, 2]],
    ],
  },
  O: {
    color: "#ffd23f",
    rotations: [
      [[1, 0], [2, 0], [1, 1], [2, 1]],
      [[1, 0], [2, 0], [1, 1], [2, 1]],
      [[1, 0], [2, 0], [1, 1], [2, 1]],
      [[1, 0], [2, 0], [1, 1], [2, 1]],
    ],
  },
  S: {
    color: "#4cd964",
    rotations: [
      [[1, 0], [2, 0], [0, 1], [1, 1]],
      [[1, 0], [1, 1], [2, 1], [2, 2]],
      [[1, 1], [2, 1], [0, 2], [1, 2]],
      [[0, 0], [0, 1], [1, 1], [1, 2]],
    ],
  },
  T: {
    color: "#b46cff",
    rotations: [
      [[1, 0], [0, 1], [1, 1], [2, 1]],
      [[1, 0], [1, 1], [2, 1], [1, 2]],
      [[0, 1], [1, 1], [2, 1], [1, 2]],
      [[1, 0], [0, 1], [1, 1], [1, 2]],
    ],
  },
  Z: {
    color: "#ff5e5e",
    rotations: [
      [[0, 0], [1, 0], [1, 1], [2, 1]],
      [[2, 0], [1, 1], [2, 1], [1, 2]],
      [[0, 1], [1, 1], [1, 2], [2, 2]],
      [[1, 0], [0, 1], [1, 1], [0, 2]],
    ],
  },
};

const PIECE_TYPES = Object.keys(TETROMINOES);

// ---------- 게임 상태 (데이터) ----------
const state = {
  board: [],        // ROWS x COLS, 값은 EMPTY 또는 색상 문자열
  current: null,    // { type, rotation, x, y }
  next: null,       // type 문자열
  score: 0,
  lines: 0,
  level: 1,
  dropTimer: 0,     // 누적 시간(ms)
  lastTime: 0,
  gameOver: false,
  paused: false,
  started: false,
};

function createBoard() {
  const board = [];
  for (let r = 0; r < ROWS; r++) {
    board.push(new Array(COLS).fill(EMPTY));
  }
  return board;
}

// ---------- 순수 헬퍼 (로직, 부수효과 없음) ----------
function getCells(type, rotation) {
  return TETROMINOES[type].rotations[rotation % 4];
}

// 주어진 위치/회전에서 보드와 충돌하는지 검사한다.
function collides(board, type, rotation, x, y) {
  const cells = getCells(type, rotation);
  for (const [cx, cy] of cells) {
    const boardX = x + cx;
    const boardY = y + cy;
    if (boardX < 0 || boardX >= COLS) return true;   // 좌/우 벽
    if (boardY >= ROWS) return true;                  // 바닥
    if (boardY >= 0 && board[boardY][boardX] !== EMPTY) return true; // 쌓인 블록
  }
  return false;
}

function randomType() {
  const i = Math.floor(Math.random() * PIECE_TYPES.length);
  return PIECE_TYPES[i];
}

// ---------- 렌더링 (데이터와 분리) ----------
const boardCanvas = document.getElementById("board");
const boardCtx = boardCanvas.getContext("2d");
const nextCanvas = document.getElementById("next");
const nextCtx = nextCanvas.getContext("2d");

const scoreEl = document.getElementById("score");
const linesEl = document.getElementById("lines");
const levelEl = document.getElementById("level");
const overlayEl = document.getElementById("overlay");
const overlayTitleEl = document.getElementById("overlay-title");
const overlayDescEl = document.getElementById("overlay-desc");

function drawCell(ctx, col, row, size, color) {
  const x = col * size;
  const y = row * size;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
  // 하이라이트
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(x + 2, y + 2, size - 4, 3);
}

function drawGridLines() {
  boardCtx.strokeStyle = "rgba(255,255,255,0.05)";
  boardCtx.lineWidth = 1;
  for (let r = 0; r <= ROWS; r++) {
    boardCtx.beginPath();
    boardCtx.moveTo(0, r * CELL);
    boardCtx.lineTo(COLS * CELL, r * CELL);
    boardCtx.stroke();
  }
  for (let c = 0; c <= COLS; c++) {
    boardCtx.beginPath();
    boardCtx.moveTo(c * CELL, 0);
    boardCtx.lineTo(c * CELL, ROWS * CELL);
    boardCtx.stroke();
  }
}

function renderBoard() {
  boardCtx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
  drawGridLines();

  // 쌓인 블록
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const color = state.board[r][c];
      if (color !== EMPTY) {
        drawCell(boardCtx, c, r, CELL, color);
      }
    }
  }

  // 현재 조각
  if (state.current) {
    const { type, rotation, x, y } = state.current;
    const color = TETROMINOES[type].color;
    for (const [cx, cy] of getCells(type, rotation)) {
      const boardY = y + cy;
      if (boardY >= 0) {
        drawCell(boardCtx, x + cx, boardY, CELL, color);
      }
    }
  }
}

function renderNext() {
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  if (!state.next) return;
  const type = state.next;
  const color = TETROMINOES[type].color;
  const cells = getCells(type, 0);
  // 중앙 정렬을 위한 오프셋 계산
  const xs = cells.map((c) => c[0]);
  const ys = cells.map((c) => c[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const widthCells = maxX - minX + 1;
  const heightCells = maxY - minY + 1;
  const offsetX = (nextCanvas.width / NEXT_CELL - widthCells) / 2 - minX;
  const offsetY = (nextCanvas.height / NEXT_CELL - heightCells) / 2 - minY;
  for (const [cx, cy] of cells) {
    drawCell(nextCtx, cx + offsetX, cy + offsetY, NEXT_CELL, color);
  }
}

function renderStats() {
  scoreEl.textContent = String(state.score);
  linesEl.textContent = String(state.lines);
  levelEl.textContent = String(state.level);
}

function showOverlay(title, desc) {
  overlayTitleEl.textContent = title;
  overlayDescEl.textContent = desc;
  overlayEl.classList.remove("hidden");
}

function hideOverlay() {
  overlayEl.classList.add("hidden");
}

function render() {
  renderBoard();
  renderNext();
  renderStats();
}

// ---------- 게임 로직 (상태 변경) ----------
function spawnPiece() {
  const type = state.next || randomType();
  state.next = randomType();
  // 스폰 위치: 가로 중앙, 최상단. 좌표계는 4x4 기준이므로 x=3이 중앙.
  const spawn = {
    type,
    rotation: 0,
    x: 3,
    y: 0,
  };
  state.current = spawn;
  state.dropTimer = 0; // 새 조각이 즉시 떨어지지 않도록 타이머 초기화
  // 스폰 즉시 충돌하면 게임 오버
  if (collides(state.board, spawn.type, spawn.rotation, spawn.x, spawn.y)) {
    state.gameOver = true;
    state.current = null;
    showOverlay("GAME OVER", "R 키로 다시 시작");
  }
}

function lockPiece() {
  const { type, rotation, x, y } = state.current;
  const color = TETROMINOES[type].color;
  for (const [cx, cy] of getCells(type, rotation)) {
    const boardX = x + cx;
    const boardY = y + cy;
    if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
      state.board[boardY][boardX] = color;
    }
  }
  clearLines();
  spawnPiece();
}

function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    const full = state.board[r].every((cell) => cell !== EMPTY);
    if (full) {
      state.board.splice(r, 1);
      state.board.unshift(new Array(COLS).fill(EMPTY));
      cleared++;
      r++; // 같은 인덱스를 다시 검사 (위 줄이 내려왔으므로)
    }
  }
  if (cleared > 0) {
    state.lines += cleared;
    state.score += LINE_SCORES[cleared] * state.level;
    const newLevel = Math.floor(state.lines / LINES_PER_LEVEL) + 1;
    if (newLevel > state.level) {
      state.level = newLevel;
    }
  }
}

function currentDropInterval() {
  return Math.max(MIN_DROP_MS, BASE_DROP_MS - (state.level - 1) * LEVEL_STEP_MS);
}

// 한 칸 아래로. 이동 불가면 lock.
function softDrop() {
  if (!state.current) return;
  const { type, rotation, x, y } = state.current;
  if (!collides(state.board, type, rotation, x, y + 1)) {
    state.current.y = y + 1;
  } else {
    lockPiece();
  }
}

function move(dx) {
  if (!state.current) return;
  const { type, rotation, x, y } = state.current;
  if (!collides(state.board, type, rotation, x + dx, y)) {
    state.current.x = x + dx;
  }
}

function rotate() {
  if (!state.current) return;
  const { type, rotation, x, y } = state.current;
  const nextRotation = (rotation + 1) % 4;
  // 간단한 wall kick: 제자리 -> 왼쪽 -> 오른쪽 -> 한 칸 위
  const kicks = [0, -1, 1, -2, 2];
  for (const dx of kicks) {
    if (!collides(state.board, type, nextRotation, x + dx, y)) {
      state.current.rotation = nextRotation;
      state.current.x = x + dx;
      return;
    }
  }
}

function hardDrop() {
  if (!state.current) return;
  let dropped = 0;
  while (
    !collides(
      state.board,
      state.current.type,
      state.current.rotation,
      state.current.x,
      state.current.y + 1
    )
  ) {
    state.current.y++;
    dropped++;
  }
  state.score += dropped * 2; // 하드 드롭 보너스
  lockPiece();
}

// ---------- 게임 루프 ----------
function resetGame() {
  state.board = createBoard();
  state.current = null;
  state.next = randomType();
  state.score = 0;
  state.lines = 0;
  state.level = 1;
  state.dropTimer = 0;
  state.gameOver = false;
  state.paused = false;
  state.started = true;
  hideOverlay();
  spawnPiece();
}

function togglePause() {
  if (state.gameOver || !state.started) return;
  state.paused = !state.paused;
  if (state.paused) {
    showOverlay("PAUSED", "P 키로 계속");
  } else {
    hideOverlay();
  }
}

function update(time) {
  const delta = time - state.lastTime;
  state.lastTime = time;

  if (state.started && !state.paused && !state.gameOver) {
    state.dropTimer += delta;
    if (state.dropTimer >= currentDropInterval()) {
      state.dropTimer = 0;
      softDrop();
    }
  }

  render();
  requestAnimationFrame(update);
}

// ---------- 입력 (이벤트 -> 로직 호출) ----------
const KEY_HANDLERS = {
  ArrowLeft: () => move(-1),
  ArrowRight: () => move(1),
  ArrowUp: () => rotate(),
  ArrowDown: () => softDrop(),
  " ": () => hardDrop(),
};

document.addEventListener("keydown", (e) => {
  const key = e.key;

  // 일시정지/재시작은 게임 상태와 무관하게 처리
  if (key === "p" || key === "P") {
    togglePause();
    e.preventDefault();
    return;
  }
  if (key === "r" || key === "R") {
    resetGame();
    e.preventDefault();
    return;
  }

  if (!state.started || state.paused || state.gameOver) return;

  const handler = KEY_HANDLERS[key];
  if (handler) {
    handler();
    e.preventDefault();
  }
});

// ---------- 시작 ----------
function init() {
  state.board = createBoard();
  state.next = randomType();
  render();
  showOverlay("TETRIS", "R 키를 눌러 시작");
  state.lastTime = performance.now();
  requestAnimationFrame(update);
}

init();
