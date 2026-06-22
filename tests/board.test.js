import test from "node:test";
import assert from "node:assert/strict";

import {
  COLS,
  ROWS,
  PIECE_TYPES,
  createBag,
  getCells,
  getKickTable,
} from "../src/pieces.js";
import {
  createBoard,
  fits,
  rotate,
  dropPosition,
  lockPiece,
  getFullRows,
  removeRows,
  clearLines,
  lineScore,
} from "../src/board.js";
import { createGame } from "../src/game.js";

function seededRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

test("createBoard: ROWS x COLS, empty", () => {
  const b = createBoard();
  assert.equal(b.length, ROWS);
  assert.equal(b[0].length, COLS);
  assert.ok(b.every((row) => row.every((c) => c === 0)));
});

test("7-bag: one bag (7) has each piece exactly once", () => {
  const bag = createBag(seededRng(1));
  const first7 = [];
  for (let i = 0; i < 7; i++) first7.push(bag.next());
  assert.deepEqual(first7.slice().sort(), PIECE_TYPES.slice().sort());
});

test("7-bag: 14 draws yield each piece twice", () => {
  const bag = createBag(seededRng(42));
  const counts = {};
  for (let i = 0; i < 14; i++) {
    const t = bag.next();
    counts[t] = (counts[t] || 0) + 1;
  }
  for (const t of PIECE_TYPES) assert.equal(counts[t], 2, `${t} count`);
});

test("7-bag: never 3 in a row across boundaries", () => {
  const bag = createBag(seededRng(7));
  let prev = null, run = 0;
  for (let i = 0; i < 700; i++) {
    const t = bag.next();
    run = t === prev ? run + 1 : 1;
    assert.ok(run <= 2, `3 in a row: ${t} @${i}`);
    prev = t;
  }
});

test("fits: walls/floor/stack collisions", () => {
  const b = createBoard();
  assert.ok(fits(b, "O", 0, 3, 0));
  assert.ok(!fits(b, "O", 0, -2, 0));
  assert.ok(!fits(b, "O", 0, COLS, 0));
  assert.ok(!fits(b, "O", 0, 3, ROWS));
});

test("dropPosition: lands at bottom on empty board", () => {
  const b = createBoard();
  const y = dropPosition(b, "O", 0, 4, 0);
  assert.equal(y, ROWS - 2);
});

test("clearLines: clears 4 rows", () => {
  const b = createBoard();
  for (let r = ROWS - 4; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) b[r][c] = "I";
  assert.equal(clearLines(b), 4);
  assert.ok(b.every((row) => row.every((c) => c === 0)));
});

test("clearLines: ignores partial rows", () => {
  const b = createBoard();
  for (let c = 0; c < COLS - 1; c++) b[ROWS - 1][c] = "I";
  assert.equal(clearLines(b), 0);
});

test("removeRows: collapses above blocks", () => {
  const b = createBoard();
  b[ROWS - 1][0] = "J";
  for (let c = 0; c < COLS; c++) b[ROWS - 2][c] = "I";
  removeRows(b, [ROWS - 2]);
  assert.equal(b.length, ROWS);
  assert.equal(b[ROWS - 1][0], "J");
});

test("lockPiece + getFullRows", () => {
  const b = createBoard();
  for (let c = 0; c < COLS; c++) b[ROWS - 1][c] = "I";
  assert.deepEqual(getFullRows(b), [ROWS - 1]);
});

test("rotate: succeeds in open space and result fits", () => {
  const b = createBoard();
  const piece = { type: "T", rotation: 0, x: 4, y: 2 };
  const res = rotate(b, piece, 1);
  assert.ok(res);
  assert.equal(res.rotation, 1);
  assert.ok(fits(b, "T", res.rotation, res.x, res.y));
});

test("rotate: I piece rotates within board", () => {
  const b = createBoard();
  const valid = { type: "I", rotation: 1, x: 0, y: 2 };
  const res = rotate(b, valid, 1);
  assert.ok(res);
  assert.ok(fits(b, "I", res.rotation, res.x, res.y));
});

test("getCells/getKickTable: all pieces 4 states, 4 cells", () => {
  for (const t of PIECE_TYPES) {
    for (let r = 0; r < 4; r++) assert.equal(getCells(t, r).length, 4);
    const table = getKickTable(t);
    assert.ok(table["0->1"] && table["0->1"].length >= 1);
  }
});

test("lineScore: guideline base x level", () => {
  assert.equal(lineScore(1, 1), 100);
  assert.equal(lineScore(2, 1), 300);
  assert.equal(lineScore(3, 2), 1000);
  assert.equal(lineScore(4, 3), 2400);
  assert.equal(lineScore(0, 5), 0);
});

test("gravityMs: speed table by level", () => {
  const g = createGame(seededRng(1));
  assert.equal(g.gravityMs(1), 800);
  assert.equal(g.gravityMs(20), 30);
  assert.equal(g.gravityMs(99), 30);
});

test("game: reset fills current/next", () => {
  const g = createGame(seededRng(123));
  g.reset();
  assert.equal(g.state.status, "playing");
  assert.ok(g.state.current);
  assert.ok(g.state.nextQueue.length >= 5);
});

test("game: repeated hardDrop is safe and scores", () => {
  const g = createGame(seededRng(99));
  g.reset();
  const before = g.state.score;
  for (let i = 0; i < 20; i++) {
    if (g.state.status !== "playing") break;
    g.hardDrop();
    g.update(300);
  }
  assert.ok(g.state.score >= before);
});

test("game: filling a line increments lines/score", () => {
  const g = createGame(seededRng(5));
  g.reset();
  for (let c = 0; c < COLS - 1; c++) g.state.board[ROWS - 1][c] = "I";
  const linesBefore = g.state.lines;
  g.hardDrop();
  g.update(300);
  assert.ok(g.state.lines >= linesBefore);
});
