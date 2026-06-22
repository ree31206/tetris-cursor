# 참고 자료 (Tetris 제작 레퍼런스)

테트리스를 표준(가이드라인)에 가깝게 다듬기 위해 수집한 해외 문서 요약본입니다. 각 파일 상단 frontmatter에 원문 URL과 출처/라이선스를 표기했습니다. (TetrisWiki 문서는 CC BY-SA, 코드 예제는 각 저장소 라이선스 기준)

## 문서 목록

| 파일 | 내용 | 원문 |
| --- | --- | --- |
| [tetris-guideline.md](tetris-guideline.md) | 공식 가이드라인 표준 | tetris.wiki |
| [super-rotation-system-srs.md](super-rotation-system-srs.md) | SRS 회전 + wall kick 데이터 | tetris.wiki |
| [random-generator-7bag.md](random-generator-7bag.md) | 7-bag 랜덤 생성기 | tetris.wiki |
| [scoring.md](scoring.md) | 점수 체계(현대/NES), B2B/Combo | tetris.wiki |
| [t-spin.md](t-spin.md) | T-Spin 3-corner 감지와 보상 | tetris.wiki |
| [jakesgordon-javascript-tetris.md](jakesgordon-javascript-tetris.md) | 단일 파일 JS 구현 | jakesgordon.com (MIT) |
| [vanilla-js-architecture-srs-7bag.md](vanilla-js-architecture-srs-7bag.md) | 로직/렌더 분리, 프레임 독립 중력, DAS | dev.to / github sen-ltd |
| [design.md](design.md) | 우리 게임 디자인 시스템 | 자체 정리 |
| [design-references.md](design-references.md) | 외부 UI·게임필 레퍼런스 요약 | typeui / github / socratopia 등 |

## 구현 반영 현황

현재 게임은 위 문서를 바탕으로 7-bag, SRS wall kick, Ghost, Hold, Next 큐(5), DAS/ARR, Lock delay, B2B/Combo 점수, 로직/렌더 분리를 모두 구현했습니다(T-Spin은 선택 확장으로 보류).

> 주의: SRS kick 표의 y 부호는 "위쪽 +y" 기준이라, 우리 게임(아래쪽 +y)에 적용 시 y 부호를 반전했습니다(src/pieces.js).
