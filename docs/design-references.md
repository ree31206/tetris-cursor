---
title: 디자인 레퍼런스 (외부 자료 요약)
fetched: 2026-06-22
note: 테트리스 UI/UX·게임필(Juice) 외부 레퍼런스와 출처. design.md의 근거.
---

# 디자인 레퍼런스 (외부 자료)

## UI / 비주얼

- **TypeUI - Tetris Design Skill** (https://www.typeui.sh/design-skills/tetris): 시맨틱 토큰, 고대비, 시각 위계, WCAG AA. 딥 네이비 + 퍼플 액센트.
- **ItsRicmor/tetris-game** (https://github.com/ItsRicmor/tetris-game): 현대 hex 팔레트, Ghost/Hold/실시간 스탯, 모듈 컴포넌트, 로직 분리.
- **FariNoveri/modern-tetris-game** (https://github.com/FariNoveri/modern-tetris-game): 글래스모피즘, 라인클리어 플래시+파티클, CSS 변수 테마.
- **wesmar/Tetris** (https://github.com/wesmar/Tetris): Ghost hatch 패턴, 라인클리어 골드 페이드, 더블버퍼링.

## 게임필 (Juice)

- **Juice, the Difference Between Code and Feel** (socratopia ch.11): Tetris는 minimal juice. 라인클리어 = 깜빡임+소리+하강+점수. juice는 미학에 맞게 튜닝.
- **Juice Overload (wayline) / Making a Game Feel Juicy (medium)**: 과한 연출은 정보를 방해. 화면 흔들림 0.1~0.3s, easing 감쇠, 접근성 올션.

## 결론 (→ design.md)

1. 가이드라인 의미색 + 현대 hex. 2. 딥 네이비 다크 + 퍼플 액센트(토큰화). 3. Ghost 저투명+윤곽. 4. Juice 최소·명료 + reduced-motion. 5. WCAG AA.
