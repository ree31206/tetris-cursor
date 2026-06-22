---
source: https://www.tetris.wiki/T-spin
title: T-Spin
fetched: 2026-06-22
license: TetrisWiki (CC BY-SA, 출처 표기)
note: T-Spin 감지(3-corner) 규칙과 보상. 고급 기능 추가 시 참고.
---

# T-Spin

T 미노를 좁은 공간에 비틀어 넣는 고급 기술. 현대 가이드라인은 3-corner T 규칙으로 감지.

## 감지 규칙 (3-corner T)

T 미노가 락다운될 때, 다음이 모두 참이면 T-Spin 보너스:

1. 락되는 피스가 T다.
2. 마지막으로 성공한 움직임이 **회전**이다.
3. T의 중심 3×3 영역에서 대각 4개 코너 중 **3개 이상이 점유**됨.

세부:
- 앞쪽 코너 2개 점유 + 뒤쪽 1개 이상 → proper T-Spin.
- 앞쪽 1개 + 뒤쪽 2개 → Mini T-Spin (마지막 kick이 중심 1×2 이동이면 proper).
- 벽/바닥에 면한 코너는 점유된 것으로 간주.

## 보상 (점수)

| Lines | Mini T-Spin | T-Spin |
| --- | --- | --- |
| 0 | 100 | 400 |
| 1 | 200 | 800 |
| 2 | 400 | 1200 |
| 3 | (불가능) | 1600 |

- level과 B2B 배수를 추가로 곱함. 라인 지운 T-Spin은 B2B 시작/유지.

## 우리 게임 적용 포인트

- 전제: (1) SRS wall kick(구현됨), (2) "마지막 동작이 회전인지" 플래그, (3) 3-corner 검사. 현재는 선택 확장으로 보류.
