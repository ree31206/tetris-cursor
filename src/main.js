// 부트스트랩: 모듈 연결 + 게임 루프(requestAnimationFrame, dt 클램프).
import { createGame } from "./game.js";
import { createRenderer } from "./render.js";
import { attachInput } from "./input.js";

const dom = {
  boardCanvas: document.getElementById("board"),
  nextCanvas: document.getElementById("next"),
  holdCanvas: document.getElementById("hold"),
  score: document.getElementById("score"),
  lines: document.getElementById("lines"),
  level: document.getElementById("level"),
  overlay: document.getElementById("overlay"),
  overlayTitle: document.getElementById("overlay-title"),
  overlayDesc: document.getElementById("overlay-desc"),
};

const api = createGame();
const renderer = createRenderer(dom);
const input = attachInput(api);

let last = performance.now();
function frame(now) {
  // 탭 전환 등으로 큰 dt가 누적되는 폭주 방지 클램프.
  const dt = Math.min(now - last, 100);
  last = now;

  input.update(dt);
  api.update(dt);
  renderer.render(api, dt);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
