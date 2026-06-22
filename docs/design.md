---
title: Tetris 디자인 시스템 (우리 게임)
fetched: 2026-06-22
note: docs/design-references.md(외부 레퍼런스)와 가이드라인을 근거로 한 구체 디자인 토큰/규칙. index.html, style.css, src/render.js의 기준.
---

# Tetris 디자인 시스템

목표: 어두운 테마 위에서 블록이 또렷하고, 빠른 인지와 명료한 피드백을 주되, 퍼셉션 중심 게임답게 과한 연출은 피한다.

## 1. 컬러 토큰

| 도형 | hex | 밝은 변형 |
| --- | --- | --- |
| I | `#22d3ee` | `#67e8f9` |
| O | `#facc15` | `#fde047` |
| T | `#c084fc` | `#d8b4fe` |
| S | `#4ade80` | `#86efac` |
| Z | `#f87171` | `#fca5a5` |
| J | `#60a5fa` | `#93c5fd` |
| L | `#fb923c` | `#fdba74` |

UI 토큰: `--bg #0b0d18`, `--panel #161931`, `--grid #1b1f38`, `--text #e8e9f3`, `--muted #9aa0c2`, `--accent #7c8bff`, `--ghost rgba(255,255,255,0.18)`. 모든 텍스트 WCAG AA 대비 이상.

## 2. 레이아웃

`HOLD | BOARD(+Ghost) | SCORE/NEXT×5/조작법`. 보드 10x20, 셀 30px(캔버스 300x600). `<=720px`에서 세로 스택.

## 3. 블록/Ghost

- 채움 + 상단 하이라이트 + 내부 테두리로 입체감.
- Ghost: 저투명 채움 + 윤곽, 실시간 갱신.

## 4. Juice (최소·명료)

| 이벤트 | 연출 | 사양 |
| --- | --- | --- |
| 라인 클리어 | 흰색 플래시 후 붕괴 | ~220ms, 중력 일시정지 |
| 점수 획득 | 팝업 텍스트 | ~600-700ms |
| Tetris/B2B | 미세 shake + 라벨 | shake <= 0.15s |

`prefers-reduced-motion`이면 shake 제거, 플래시 축소. 강도는 `SHAKE_INTENSITY` 상수.

## 5. 구현 매핑

- 토큰 → [style.css](../style.css) `:root`
- 블록/Ghost/플래시/팝업/shake → [src/render.js](../src/render.js)
- 레이아웃 → [index.html](../index.html)
