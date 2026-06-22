// 순수 게임 로직 (DOM 미접근). 충돌/이동/회전(SRS)/라인삭제/점수.
// 보드는 ROWS x COLS 2차원 배열. 값은 EMPTY(0) 또는 색상 키(도형 타입 문자열).
// 참고: docs/scoring.md, docs/super-rotation-system-srs.md

import { COLS, ROWS, EMPTY, getCells, getKickTable } from "./pieces.js";

export function createBoard() {
  const board = [];
  for (let r = 0; r < ROWS; r++) board.push(new Array(COLS).fill(EMPTY));
  return board;
}

// 주어진 위치/회전이 보드에 들어갈 수 있는지(충돌/경계 검사).
export function fits(board, type, rotation, x, y) {
  for (const [cx, cy] of getCells(type, rotation)) {
    const bx = x + cx;
    const by = y + cy;
    if (bx < 0 || bx >= COLS) return false; // 좌/우 벽
    if (by >= ROWS) return false; // 바닥
    if (by >= 0 && board[by][bx] !== EMPTY) return false; // 쌓인 블록 (음수 y는 버퍼)
  }
  return true;
}

// piece={type,rotation,x,y}를 dir(+1 CW / -1 CCW)로 회전. SRS 킥을 순서대로 시도.
// 성공 시 {rotation,x,y,kick:[dx,dy]} 반환, 모두 실패 시 null.
export function rotate(board, piece, dir) {
  const from = piece.rotation;
  const to = (((from + dir) % 4) + 4) % 4;
  const table = getKickTable(piece.type);
  const tests = table[`${from}->${to}`] || [[0, 0]];
  for (const [dx, dy] of tests) {
    const nx = piece.x + dx;
    const ny = piece.y + dy;
    if (fits(board, piece.type, to, nx, ny)) {
      return { rotation: to, x: nx, y: ny, kick: [dx, dy] };
    }
  }
  return null;
}

// 하드드롭/Ghost용: 현재 열에서 떨어질 수 있는 최종 y.
export function dropPosition(board, type, rotation, x, y) {
  let ny = y;
  while (fits(board, type, rotation, x, ny + 1)) ny++;
  return ny;
}

// piece를 보드에 고정. board를 직접 변경. 셀 값으로 도형 타입을 저장(색상 매핑용).
export function lockPiece(board, piece) {
  for (const [cx, cy] of getCells(piece.type, piece.rotation)) {
    const bx = piece.x + cx;
    const by = piece.y + cy;
    if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
      board[by][bx] = piece.type;
    }
  }
}

// 가득 찬 행의 인덱스 목록(애니메이션용).
export function getFullRows(board) {
  const rows = [];
  for (let r = 0; r < ROWS; r++) {
    if (board[r].every((cell) => cell !== EMPTY)) rows.push(r);
  }
  return rows;
}

// 지정 행들을 제거하고 위에서 빈 행을 채운다. board 직접 변경.
export function removeRows(board, rows) {
  if (!rows || rows.length === 0) return 0;
  const set = new Set(rows);
  const kept = board.filter((_, r) => !set.has(r));
  while (kept.length < ROWS) kept.unshift(new Array(COLS).fill(EMPTY));
  for (let r = 0; r < ROWS; r++) board[r] = kept[r];
  return rows.length;
}

// 가득 찬 줄을 모두 제거하고 제거 수를 반환(테스트/단순 호출용).
export function clearLines(board) {
  return removeRows(board, getFullRows(board));
}

// 가이드라인 기본 라인 점수(레벨 배수 적용). B2B/Combo는 game에서 추가.
export const BASE_LINE_SCORES = { 0: 0, 1: 100, 2: 300, 3: 500, 4: 800 };

export function lineScore(lines, level) {
  return (BASE_LINE_SCORES[lines] || 0) * level;
}
