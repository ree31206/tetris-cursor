---
source: https://tetris.wiki/Tetris_Guideline
title: Tetris Guideline
fetched: 2026-06-22
license: TetrisWiki (CC BY-SA)
---

# Tetris Guideline

The Tetris Company가 2001년(Tetris Worlds) 이후 신규 타이틀에 요구하는 표준. 전 세계 동일한 플레이 경험 제공이 목적.

## 핵심 규칙

- **Playfield**: 가로 10 × 세로 20, 위쪽 20칸 버퍼 존(보통 숨김).
- **SRS**: 회전과 wall kick 규격. 모든 회전은 가역적.
- **스폰**: 평평한 면 아래, 중앙 정렬(왼쪽 라운딩).
- **Lock Down**: 착지 후 0.5초 고정. infinity / move reset(15회) / step reset.
- **Next Queue**: 다음 피스 미리보기(최대 6).
- **Hold**: 활성 피스 보관(1개), 락 전까지 재사용 불가.
- **Piece colors**: I cyan, J blue, L orange, O yellow, S green, Z red, T magenta.
- **7-bag**: 7종을 섞어 하나씩, 비면 재충전.
- **Ghost piece**: 낙하 지점 미리보기.
- **Keyboard 표준**: ←→ 이동, ↑ CW 회전, ↓ soft drop, Space hard drop, C/Shift hold, Z/Ctrl CCW 회전.
- **Levels**: 라인 클리어로 레벨업.
- **Game over**: 스폰 겹침(block out), 보이는 영역 위 락(lock out), 버퍼 존 초과.
- Scoring / Combo / Perfect clear / T-Spin(3-corner) 규칙 포함.

## 권장 핸들링 (120Hz 기준)

- DAS 10 frames(~167ms), ARR 2 frames(~33ms), ARE 6 frames(~100ms).

## 우리 게임 적용

- 10x20 보드, 7색, hold/ghost/next(5)/CCW 회전/DAS(170)/ARR(50)/lock delay(500, 15회) 모두 구현. 버퍼 존/21행 표시는 미구현.
