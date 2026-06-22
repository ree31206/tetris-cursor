# Tetris (Cursor 실습)

순수 HTML/CSS/JavaScript(ES 모듈)로 만든 브라우저 테트리스 게임입니다. 외부 라이브러리 없이 동작하며, 게임 로직과 렌더링을 분리해 Node로 단위 테스트할 수 있습니다. Cursor AI 워크북 4장(제작) ~ 6장(검증)을 따라 단계별 품질 게이트를 거쳐 제작하고, `docs/`의 가이드라인·SRS·7-bag·디자인 자료를 근거로 표준 사양에 맞게 고도화했습니다.

## 배포 링크

- GitHub Pages: https://ree31206.github.io/tetris-cursor/

## 실행 방법

ES 모듈을 사용하므로 `index.html`을 파일로 직접 열면(`file://`) 브라우저 보안정책(CORS)으로 동작하지 않습니다. 로컬 서버 또는 GitHub Pages로 실행하세요.

```bash
# Python 3
python -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

## 조작법

| 키 | 동작 |
| --- | --- |
| ← / → | 좌우 이동 (DAS/ARR 자동반복) |
| ↑ 또는 X | 시계 방향 회전 (SRS wall kick) |
| Z 또는 Ctrl | 반시계 방향 회전 |
| ↓ | 소프트 드롭 (+1점/칸) |
| Space | 하드 드롭 (+2점/칸) |
| C 또는 Shift | 홀드 (1회/락 전까지) |
| P | 일시정지 / 계속 |
| R | 다시 시작 |

게임 시작 시 `R` 키를 누르면 플레이가 시작됩니다.

## 기능 목록

- 10 x 20 보드, 7종 테트로미노(I, J, L, O, S, T, Z)
- **7-bag 랜덤 생성기** — 같은 블록이 길게 반복되지 않는 공정한 분배
- **SRS 회전 + wall kick** — 표준 회전 시스템(JLSTZ/I 킥 테이블)
- **Ghost piece** — 착지 위치 미리보기
- **Hold** — 조각 보관/교체
- **Next 큐(5개)** 미리보기
- **DAS/ARR** — 좌우/소프트드롭 자동반복(170ms/50ms), OS 자동반복 무시
- **Lock delay(0.5s, move reset 15회)** — 착지 후 미세 조정 여유
- 프레임 독립 중력(레벨별 가속, 탭 전환 폭주 클램프)
- **점수: B2B(테트리스 ×1.5), Combo(50×콤보×레벨)**, 레벨업(10줄마다)
- 라인 클리어 플래시, 점수 팝업, 큰 이벤트 미세 화면 흔들림(접근성 `prefers-reduced-motion` 대응)
- 일시정지 / 게임 오버(블록아웃·락아웃) / 다시 시작

## 파일 구성

```
tetris-cursor/
├── index.html        # 레이아웃(HOLD / BOARD / SCORE·NEXT)
├── style.css         # 디자인 토큰·레이아웃·반응형
├── src/
│   ├── pieces.js     # 도형, SRS 킥 테이블, 7-bag
│   ├── board.js      # 순수 로직(충돌/회전/라인삭제/점수) — DOM 미접근
│   ├── game.js       # 상태머신(중력/락딜레이/hold/next/B2B/Combo)
│   ├── render.js     # Canvas 렌더(Ghost/Hold/Next/HUD/juice)
│   ├── input.js      # 키 입력(DAS/ARR)
│   └── main.js       # 부트스트랩 + 게임 루프
├── tests/
│   └── board.test.js # node --test 단위 테스트
├── docs/             # 가이드라인·SRS·7-bag·점수·T-Spin·디자인 레퍼런스
├── package.json
└── .cursor/          # 슬래시 품질 게이트(5장) + 검증 Subagents(6장)
```

## 테스트

```bash
npm test    # 또는: node --test
```

순수 로직(`src/board.js`, `src/pieces.js`, `src/game.js`)을 브라우저 없이 검증합니다(7-bag, 라인삭제, SRS 회전, 점수, 중력표 등).

## 설계 근거 문서 (docs/)

게임플레이는 [docs/tetris-guideline.md](docs/tetris-guideline.md), [docs/super-rotation-system-srs.md](docs/super-rotation-system-srs.md), [docs/random-generator-7bag.md](docs/random-generator-7bag.md), [docs/scoring.md](docs/scoring.md), 디자인은 [docs/design.md](docs/design.md) / [docs/design-references.md](docs/design-references.md)를 기준으로 했습니다.

## 품질 게이트 (워크북 4~6장)

| 단계 | 게이트 |
| --- | --- |
| 구조/코드 | `/code-review` |
| 게임 로직 | `/review-game-logic`, game-logic-reviewer 서브에이전트 |
| 조작 QA | `/qa-playtest`, qa-tester 서브에이전트 |
| 버그 | `/bug-hunt`, `/refactor-safe` |
| 배포 전 | `/release-check` |
