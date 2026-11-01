// The TouchDesigner eye animation, rebuilt so the pupils can follow the
// cursor. Shapes, colours, wander speed and blink timing were measured frame
// by frame from the exported video (videos/esp32-eyes.mp4), which stays in the
// page as the fallback if this script doesn't run.
(function () {
  const screen = document.querySelector(".round-screen[data-eyes]");
  if (!screen) return;

  const NS = "http://www.w3.org/2000/svg";

  // Measured in the video's 256 x 256 frame.
  const EYES = [
    { cx: 60.9, cy: 114.8, tilt: 11.8 },
    { cx: 183.8, cy: 122.7, tilt: -7.7 },
  ];
  const EYE_RX = 56.5;
  const EYE_RY = 32.9;
  const PUPIL_RX = 27;
  const PUPIL_RY = 33;
  const PINK = "#f460b2";
  const PUPIL = "#2b0d38";

  // How far the pupils travel from the middle of each eye.
  const REACH_X = 20;
  const REACH_Y = 11;

  // Smoothing time (seconds): the video's pupils ease to a new spot in about
  // 1.4 s; following the cursor is a little quicker so it feels responsive.
  const WANDER_EASE = 0.45;
  const FOLLOW_EASE = 0.3;

  // Blink shape from the video at 30 fps: a fast squeeze, a short hold shut,
  // then open again. Pairs are [seconds since blink began, eye height].
  const BLINK = [
    [0, 1],
    [0.033, 0.41],
    [0.067, 0.29],
    [0.1, 0.29],
    [0.133, 0],
    [0.333, 0],
    [0.367, 0.91],
    [0.4, 0.96],
    [0.433, 1],
  ];

  function el(name, attrs, parent) {
    const node = document.createElementNS(NS, name);
    for (const key in attrs) node.setAttribute(key, attrs[key]);
    if (parent) parent.appendChild(node);
    return node;
  }

  const svg = el("svg", {
    viewBox: "0 0 256 256",
    role: "img",
    "aria-label": "Two pink animated eyes that blink and follow your cursor.",
  });
  const defs = el("defs", {}, svg);

  const pupils = [];
  const lids = [];
  EYES.forEach((eye, i) => {
    const clip = el("clipPath", { id: `eye-clip-${i}` }, defs);
    el("ellipse", { rx: EYE_RX, ry: EYE_RY, transform: `rotate(${eye.tilt})` }, clip);

    const place = el("g", { transform: `translate(${eye.cx} ${eye.cy})` }, svg);
    const lid = el("g", {}, place);
    el("ellipse", { rx: EYE_RX, ry: EYE_RY, fill: PINK, transform: `rotate(${eye.tilt})` }, lid);
    const inner = el("g", { "clip-path": `url(#eye-clip-${i})` }, lid);
    pupils.push({ node: el("ellipse", { rx: PUPIL_RX, ry: PUPIL_RY, fill: PUPIL }, inner), tilt: eye.tilt });
    lids.push(lid);
  });

  screen.replaceChildren(svg);

  // Where the pupils are, and where they're heading.
  let x = 0;
  let y = 0;
  let targetX = 0;
  let targetY = 0;

  // Without a cursor nearby, wander like the original: drift to a random
  // spot, settle, pick another.
  let nextWander = 0;
  function wander(now) {
    if (now < nextWander) return;
    targetX = (Math.random() * 2 - 1) * REACH_X;
    targetY = (Math.random() * 2 - 1) * REACH_Y;
    nextWander = now + 1.5 + Math.random() * 2;
  }

  // With a cursor, look toward it. Far away means looking all the way over.
  let pointerAt = -Infinity;
  let pointer = null;
  window.addEventListener("pointermove", (event) => {
    pointer = { x: event.clientX, y: event.clientY };
    pointerAt = performance.now() / 1000;
  });
  document.addEventListener("pointerleave", () => {
    pointer = null;
  });

  function follow() {
    const box = screen.getBoundingClientRect();
    const dx = pointer.x - (box.left + box.width / 2);
    const dy = pointer.y - (box.top + box.height / 2);
    targetX = REACH_X * Math.tanh(dx / 250);
    targetY = REACH_Y * Math.tanh(dy / 250);
  }

  let blinkStart = -Infinity;
  let nextBlink = 2 + Math.random() * 3;
  function lidHeight(now) {
    if (now >= nextBlink) {
      blinkStart = now;
      nextBlink = now + 4 + Math.random() * 4;
    }
    const t = now - blinkStart;
    if (t >= BLINK[BLINK.length - 1][0]) return 1;
    for (let i = 1; i < BLINK.length; i++) {
      const [t1, h1] = BLINK[i];
      if (t <= t1) {
        const [t0, h0] = BLINK[i - 1];
        return h0 + ((h1 - h0) * (t - t0)) / (t1 - t0);
      }
    }
    return 1;
  }

  let last = performance.now() / 1000;
  function frame(ms) {
    const now = ms / 1000;
    const dt = Math.min(now - last, 0.1);
    last = now;

    const following = pointer && now - pointerAt < 4;
    if (following) follow();
    else wander(now);

    const ease = 1 - Math.exp(-dt / (following ? FOLLOW_EASE : WANDER_EASE));
    x += (targetX - x) * ease;
    y += (targetY - y) * ease;

    pupils.forEach((p) => {
      p.node.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${p.tilt})`);
    });

    const h = lidHeight(now);
    lids.forEach((lid) => {
      lid.setAttribute("transform", `scale(1 ${h.toFixed(3)})`);
    });

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
