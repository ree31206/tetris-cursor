---
source: https://tetris.wiki/Scoring
title: Scoring
fetched: 2026-06-22
license: TetrisWiki (CC BY-SA)
---

# Scoring

## 현대 가이드라인 (Tetris DS 이후)

| Action | Points |
| --- | --- |
| Single | 100 × level |
| Double | 300 × level |
| Triple | 500 × level |
| Tetris | 800 × level; difficult |
| T-Spin Single | 800 × level; difficult |
| T-Spin Double | 1200 × level; difficult |
| T-Spin Triple | 1600 × level; difficult |
| Back-to-Back | Action score × 1.5 |
| Combo | 50 × combo count × level |
| Soft drop | 1 / cell |
| Hard drop | 2 / cell |

- B2B 체인은 Single/Double/Triple로만 끊김.

## 원조 NES 방식

| Level | 1 | 2 | 3 | 4 |
| --- | --- | --- | --- | --- |
| n | 40×(n+1) | 100×(n+1) | 300×(n+1) | 1200×(n+1) |

## 우리 게임

`[0,100,300,500,800] × level` + 하드드롭 2/칸, 소프트드롭 1/칸, B2B(테트리스 ×1.5), Combo(50×콤보×레벨) 구현(src/game.js).
