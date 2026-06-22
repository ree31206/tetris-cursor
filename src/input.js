// 키보드 입력. OS 자동반복을 무시하고 좌우/소프트드롭에 자체 DAS/ARR 적용.
// 회전 CW(↑/X)·CCW(Z/Ctrl), hard drop(Space), hold(C/Shift), pause(P), restart(R).
// docs/vanilla-js-architecture-srs-7bag.md, docs/tetris-guideline.md

const DAS_DELAY = 170; // ms, 자동반복 시작 지연
const ARR_INTERVAL = 50; // ms, 반복 간격

export function attachInput(api) {
  // 반복 대상 액션(좌/우/소프트드롭)의 보유 상태와 타이머
  const repeat = {
    left: { held: false, timer: 0, started: false },
    right: { held: false, timer: 0, started: false },
    down: { held: false, timer: 0, started: false },
  };

  function act(name) {
    if (name === "left") api.moveLeft();
    else if (name === "right") api.moveRight();
    else if (name === "down") api.softDrop();
  }

  function press(name) {
    const r = repeat[name];
    if (r.held) return; // OS 반복 무시
    r.held = true;
    r.timer = 0;
    r.started = false;
    act(name); // 첫 입력 즉시 반영
  }

  function release(name) {
    repeat[name].held = false;
  }

  // 게임 루프에서 호출: DAS/ARR 처리
  function update(dt) {
    for (const name of ["left", "right", "down"]) {
      const r = repeat[name];
      if (!r.held) continue;
      r.timer += dt;
      if (!r.started) {
        if (r.timer >= DAS_DELAY) {
          r.started = true;
          r.timer = 0;
          act(name);
        }
      } else {
        while (r.timer >= ARR_INTERVAL) {
          r.timer -= ARR_INTERVAL;
          act(name);
        }
      }
    }
  }

  function onKeyDown(e) {
    if (e.repeat) return; // OS 자동반복 무시(회전/하드드롭/홀드 연사 방지)
    const k = e.key;
    // 상태 무관 키
    if (k === "p" || k === "P") { api.togglePause(); e.preventDefault(); return; }
    if (k === "r" || k === "R") { api.reset(); e.preventDefault(); return; }

    switch (k) {
      case "ArrowLeft": press("left"); e.preventDefault(); break;
      case "ArrowRight": press("right"); e.preventDefault(); break;
      case "ArrowDown": press("down"); e.preventDefault(); break;
      case "ArrowUp":
      case "x":
      case "X":
        api.rotateCW(); e.preventDefault(); break;
      case "z":
      case "Z":
      case "Control":
        api.rotateCCW(); e.preventDefault(); break;
      case " ":
        api.hardDrop(); e.preventDefault(); break;
      case "c":
      case "C":
      case "Shift":
        api.hold(); e.preventDefault(); break;
      default:
        break;
    }
  }

  function onKeyUp(e) {
    switch (e.key) {
      case "ArrowLeft": release("left"); break;
      case "ArrowRight": release("right"); break;
      case "ArrowDown": release("down"); break;
      default: break;
    }
  }

  function releaseAll() {
    repeat.left.held = false;
    repeat.right.held = false;
    repeat.down.held = false;
  }

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
  // 포커스 상실 중 키를 떼면 keyup 누락 → 키 끼임 방지
  window.addEventListener("blur", releaseAll);

  return { update };
}
