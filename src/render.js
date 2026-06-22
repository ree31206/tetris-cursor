// Canvas 렌더러: 보드/Ghost/활성/Hold/Next/HUD + 라인클리어 플래시, 점수 팝업, 미세 shake.
// docs/design.md 디자인 토큰/규칙 기준. Juice는 최소·명료, prefers-reduced-motion 대응.

import { COLS, ROWS, COLORS, EMPTY, getCells } from "./pieces.js";
import { dropPosition } from "./board.js";
import { NEXT_COUNT } from "./game.js";

const CELL = 30;
const NEXT_CELL = 20;
const HOLD_CELL = 20;
const SHAKE_INTENSITY = 4; // px, 큰 이벤트에만

const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function readCss(name, fallback) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name);
  return v ? v.trim() : fallback;
}

export function createRenderer(dom) {
  const boardCtx = dom.boardCanvas.getContext("2d");
  const nextCtx = dom.nextCanvas.getContext("2d");
  const holdCtx = dom.holdCanvas.getContext("2d");

  const theme = {
    grid: readCss("--grid", "#1b1f38"),
    gridLine: readCss("--grid-line", "rgba(255,255,255,0.05)"),
    ghost: readCss("--ghost", "rgba(255,255,255,0.18)"),
    flash: readCss("--flash", "#ffffff"),
  };

  let shake = 0;
  const popups = []; // { text, x, y, age, ttl }

  function block(ctx, col, row, size, base, light, opts = {}) {
    const x = col * size;
    const y = row * size;
    if (opts.ghost) {
      ctx.fillStyle = theme.ghost;
      ctx.fillRect(x, y, size, size);
      ctx.strokeStyle = base;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
      return;
    }
    ctx.fillStyle = base;
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = light;
    ctx.fillRect(x + 2, y + 2, size - 4, 3); // 상단 하이라이트
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
  }

  function drawGrid() {
    boardCtx.fillStyle = theme.grid;
    boardCtx.fillRect(0, 0, dom.boardCanvas.width, dom.boardCanvas.height);
    boardCtx.strokeStyle = theme.gridLine;
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

  function drawBoardCells(board, clearing) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const type = board[r][c];
        if (type !== EMPTY) {
          const col = COLORS[type];
          block(boardCtx, c, r, CELL, col.base, col.light);
        }
      }
    }
    // 라인 클리어 플래시
    if (clearing) {
      const p = clearing.timer / clearing.total; // 1 -> 0
      const alpha = reduceMotion ? 0.5 : 0.2 + 0.6 * p;
      boardCtx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
      for (const r of clearing.rows) {
        boardCtx.fillRect(0, r * CELL, COLS * CELL, CELL);
      }
    }
  }

  function drawGhostAndCurrent(board, current) {
    if (!current) return;
    const col = COLORS[current.type];
    const gy = dropPosition(board, current.type, current.rotation, current.x, current.y);
    if (gy !== current.y) {
      for (const [cx, cy] of getCells(current.type, current.rotation)) {
        const by = gy + cy;
        if (by >= 0) block(boardCtx, current.x + cx, by, CELL, col.base, col.light, { ghost: true });
      }
    }
    for (const [cx, cy] of getCells(current.type, current.rotation)) {
      const by = current.y + cy;
      if (by >= 0) block(boardCtx, current.x + cx, by, CELL, col.base, col.light);
    }
  }

  function drawMini(ctx, canvas, type, size) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!type) return;
    const col = COLORS[type];
    const cells = getCells(type, 0);
    const xs = cells.map((c) => c[0]);
    const ys = cells.map((c) => c[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const w = (maxX - minX + 1) * size;
    const h = (maxY - minY + 1) * size;
    const ox = (canvas.width - w) / 2 - minX * size;
    const oy = (canvas.height - h) / 2 - minY * size;
    for (const [cx, cy] of cells) {
      const x = ox + cx * size;
      const y = oy + cy * size;
      ctx.fillStyle = col.base;
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = col.light;
      ctx.fillRect(x + 2, y + 2, size - 4, 3);
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
    }
  }

  function drawHold(type) {
    drawMini(holdCtx, dom.holdCanvas, type, HOLD_CELL);
  }

  function drawNext(queue) {
    nextCtx.clearRect(0, 0, dom.nextCanvas.width, dom.nextCanvas.height);
    const slotH = dom.nextCanvas.height / NEXT_COUNT;
    for (let i = 0; i < Math.min(NEXT_COUNT, queue.length); i++) {
      const type = queue[i];
      const col = COLORS[type];
      const cells = getCells(type, 0);
      const xs = cells.map((c) => c[0]);
      const ys = cells.map((c) => c[1]);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const w = (maxX - minX + 1) * NEXT_CELL;
      const h = (maxY - minY + 1) * NEXT_CELL;
      const ox = (dom.nextCanvas.width - w) / 2 - minX * NEXT_CELL;
      const oy = i * slotH + (slotH - h) / 2 - minY * NEXT_CELL;
      for (const [cx, cy] of cells) {
        const x = ox + cx * NEXT_CELL;
        const y = oy + cy * NEXT_CELL;
        nextCtx.fillStyle = col.base;
        nextCtx.fillRect(x, y, NEXT_CELL, NEXT_CELL);
        nextCtx.fillStyle = col.light;
        nextCtx.fillRect(x + 2, y + 2, NEXT_CELL - 4, 3);
        nextCtx.strokeStyle = "rgba(0,0,0,0.35)";
        nextCtx.lineWidth = 1;
        nextCtx.strokeRect(x + 0.5, y + 0.5, NEXT_CELL - 1, NEXT_CELL - 1);
      }
    }
  }

  function drawPopups() {
    for (const p of popups) {
      const t = p.age / p.ttl;
      boardCtx.globalAlpha = Math.max(0, 1 - t);
      boardCtx.fillStyle = "#ffffff";
      boardCtx.font = "bold 20px system-ui, sans-serif";
      boardCtx.textAlign = "center";
      boardCtx.fillText(p.text, p.x, p.y - t * 24);
    }
    boardCtx.globalAlpha = 1;
    boardCtx.textAlign = "start";
  }

  function handleEvents(events) {
    for (const ev of events) {
      if (ev.kind === "score" && ev.amount > 0) {
        popups.push({ text: `+${ev.amount}`, x: COLS * CELL * 0.5, y: CELL * 4, age: 0, ttl: 700 });
      }
      if ((ev.kind === "tetris" || ev.kind === "b2b") && !reduceMotion) {
        shake = SHAKE_INTENSITY;
      }
      if (ev.kind === "tetris") {
        popups.push({ text: "TETRIS", x: COLS * CELL * 0.5, y: CELL * 6, age: 0, ttl: 800 });
      }
      if (ev.kind === "b2b") {
        popups.push({ text: "B2B", x: COLS * CELL * 0.5, y: CELL * 8, age: 0, ttl: 800 });
      }
    }
  }

  function tickEffects(dt) {
    for (let i = popups.length - 1; i >= 0; i--) {
      popups[i].age += dt;
      if (popups[i].age >= popups[i].ttl) popups.splice(i, 1);
    }
    if (shake > 0) {
      shake = Math.max(0, shake - dt * 0.03);
    }
  }

  function drawOverlay(status) {
    if (!dom.overlay) return;
    const map = {
      ready: ["TETRIS", "R 키를 눌러 시작"],
      paused: ["PAUSED", "P 키로 계속"],
      over: ["GAME OVER", "R 키로 다시 시작"],
    };
    if (map[status]) {
      dom.overlay.classList.remove("hidden");
      dom.overlayTitle.textContent = map[status][0];
      dom.overlayDesc.textContent = map[status][1];
    } else {
      dom.overlay.classList.add("hidden");
    }
  }

  function render(api, dt) {
    const s = api.state;
    handleEvents(api.consumeEvents());
    tickEffects(dt);

    boardCtx.save();
    if (shake > 0) {
      const dx = (Math.random() - 0.5) * shake;
      const dy = (Math.random() - 0.5) * shake;
      boardCtx.translate(dx, dy);
    }
    drawGrid();
    drawBoardCells(s.board, s.clearing);
    drawGhostAndCurrent(s.board, s.current);
    drawPopups();
    boardCtx.restore();

    drawHold(s.holdType);
    drawNext(s.nextQueue);

    dom.score.textContent = String(s.score);
    dom.lines.textContent = String(s.lines);
    dom.level.textContent = String(s.level);

    drawOverlay(s.status);
  }

  return { render };
}
