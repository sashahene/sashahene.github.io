// Pressing anywhere in the contact section blooms a pixelated flower: a dahlia,
// then a rose, then a hibiscus, then back to the dahlia. Each flower is painted
// smoothly, then shrunk to a small pixel grid with reduced colours, so the
// pixels stay crisp and square at every stage of the bloom.
(function () {
  const contact = document.querySelector(".contact");
  if (!contact) return;

  const GRID = 40;
  const PAINT = 360;
  const SIZE = 80;
  const MAX_FLOWERS = 6;
  const BLOOM = 1.3;
  const HOLD_MS = 200;
  const FADE_MS = 2500;

  // Outermost ring first. r and w are fractions of the flower's radius; base
  // and tip are the colours along each petal, from the photo of the dahlia.
  const RINGS = [
    { r: 0.96, w: 0.2, count: 17, base: "#f7a3a8", tip: "#e4476f" },
    { r: 0.84, w: 0.2, count: 16, base: "#f9b3ae", tip: "#ea5f7c" },
    { r: 0.72, w: 0.19, count: 15, base: "#fbc4b0", tip: "#f07f8c" },
    { r: 0.6, w: 0.17, count: 13, base: "#fcd6b4", tip: "#f6a39a" },
    { r: 0.48, w: 0.15, count: 12, base: "#fde3b8", tip: "#f9c49c" },
    { r: 0.36, w: 0.12, count: 10, base: "#fcd08a", tip: "#f9ab62" },
    { r: 0.24, w: 0.09, count: 8, base: "#f9a850", tip: "#ef7a30" },
    { r: 0.13, w: 0.06, count: 6, base: "#ef7a30", tip: "#d9541f" },
  ];

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const painting = document.createElement("canvas");
  painting.width = painting.height = PAINT;
  const paintCtx = painting.getContext("2d");

  function easeOut(k) {
    const clamped = Math.max(0, Math.min(1, k));
    return 1 - Math.pow(1 - clamped, 3);
  }

  const radius = PAINT / 2 - 10;

  // t is seconds since the press: the centre opens first, then each ring.
  function paintDahlia(t) {
    RINGS.forEach((ring, i) => {
      const k = easeOut((t - (RINGS.length - 1 - i) * 0.09) / 0.5);
      if (!k) return;
      const length = ring.r * radius * k;
      const width = ring.w * radius * k;
      for (let j = 0; j < ring.count; j++) {
        paintCtx.save();
        paintCtx.rotate(((j + (i % 2 ? 0.5 : 0)) / ring.count) * Math.PI * 2);
        const shade = paintCtx.createLinearGradient(0, 0, 0, -length);
        shade.addColorStop(0.25, ring.base);
        shade.addColorStop(1, ring.tip);
        paintCtx.fillStyle = shade;
        paintCtx.beginPath();
        paintCtx.moveTo(0, 0);
        paintCtx.quadraticCurveTo(width * 0.95, -length * 0.55, 0, -length);
        paintCtx.quadraticCurveTo(-width * 0.95, -length * 0.55, 0, 0);
        paintCtx.fill();
        paintCtx.strokeStyle = "rgba(150, 40, 60, 0.28)";
        paintCtx.lineWidth = 2.5;
        paintCtx.stroke();
        paintCtx.beginPath();
        paintCtx.moveTo(0, -length * 0.25);
        paintCtx.lineTo(0, -length * 0.8);
        paintCtx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        paintCtx.lineWidth = 2;
        paintCtx.stroke();
        paintCtx.restore();
      }
    });
  }

  // One wide, rounded petal. skew leans it sideways so petals overlap in a spin.
  function roundPetal(angle, width, skew, fill, edge, edgeWidth) {
    const length = 0.97 * radius;
    return (k) => {
      if (!k) return;
      const l = length * k;
      const w = width * radius * k;
      const s = skew * w;
      paintCtx.save();
      paintCtx.rotate(angle);
      paintCtx.fillStyle = fill(l);
      paintCtx.beginPath();
      paintCtx.moveTo(0, 0);
      paintCtx.bezierCurveTo(w + s, -l * 0.17, w + s, -l * 1.03, s * 0.5, -l);
      paintCtx.bezierCurveTo(-w + s, -l * 1.03, -w + s, -l * 0.17, 0, 0);
      paintCtx.fill();
      paintCtx.strokeStyle = edge;
      paintCtx.lineWidth = edgeWidth;
      paintCtx.stroke();
      paintCtx.restore();
    };
  }

  function roseFill(length) {
    const shade = paintCtx.createLinearGradient(0, 0, 0, -length);
    shade.addColorStop(0.1, "#a81430");
    shade.addColorStop(1, "#e63e5a");
    return shade;
  }

  function hibiscusFill(length) {
    const shade = paintCtx.createRadialGradient(0, 0, 4, 0, 0, length);
    shade.addColorStop(0, "#b01c5e");
    shade.addColorStop(0.35, "#e0528c");
    shade.addColorStop(1, "#f9b8d2");
    return shade;
  }

  // Five petals in a pinwheel around a small dark curl.
  function paintRose(t) {
    for (let j = 0; j < 5; j++) {
      const petal = roundPetal((j / 5) * Math.PI * 2, 0.66, 0.7, roseFill, "rgba(50, 0, 12, 0.85)", 6);
      petal(easeOut((t - 0.16 - j * 0.06) / 0.6));
    }
    const k = easeOut((t - 0.05) / 0.4);
    if (!k) return;
    paintCtx.fillStyle = "#7a0a1e";
    paintCtx.beginPath();
    paintCtx.arc(0, 0, 30 * k, 0, Math.PI * 2);
    paintCtx.fill();
    paintCtx.strokeStyle = "#2e0209";
    paintCtx.lineWidth = 6;
    paintCtx.lineCap = "round";
    paintCtx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const angle = (i / 40) * 9.5;
      const d = (2 + i * 0.62) * k;
      paintCtx.lineTo(Math.cos(angle) * d, Math.sin(angle) * d);
    }
    paintCtx.stroke();
  }

  // Five soft petals, then one long stamen with a yellow tip.
  function paintHibiscus(t) {
    for (let j = 0; j < 5; j++) {
      const petal = roundPetal((j / 5) * Math.PI * 2 + 0.35, 0.72, 0, hibiscusFill, "rgba(140, 20, 80, 0.55)", 5);
      petal(easeOut((t - j * 0.07) / 0.6));
    }
    const k = easeOut((t - 0.45) / 0.45);
    if (!k) return;
    const length = 0.6 * radius * k;
    paintCtx.save();
    paintCtx.rotate(0.95);
    paintCtx.strokeStyle = "#ffd9e6";
    paintCtx.lineWidth = 8;
    paintCtx.lineCap = "round";
    paintCtx.beginPath();
    paintCtx.moveTo(0, 0);
    paintCtx.lineTo(0, -length);
    paintCtx.stroke();
    paintCtx.fillStyle = "#f6b21e";
    paintCtx.beginPath();
    paintCtx.ellipse(0, -length, 10 * k, 18 * k, 0, 0, Math.PI * 2);
    paintCtx.fill();
    paintCtx.restore();
  }

  const FLOWERS = [paintDahlia, paintRose, paintHibiscus];
  let nextFlower = 0;

  function paint(painter, t, turn) {
    paintCtx.clearRect(0, 0, PAINT, PAINT);
    paintCtx.save();
    paintCtx.translate(PAINT / 2, PAINT / 2);
    paintCtx.rotate(turn);
    painter(t);
    paintCtx.restore();
  }

  function pixelate(ctx) {
    ctx.clearRect(0, 0, GRID, GRID);
    ctx.drawImage(painting, 0, 0, GRID, GRID);
    const image = ctx.getImageData(0, 0, GRID, GRID);
    const data = image.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.round(data[i] / 20) * 20;
      data[i + 1] = Math.round(data[i + 1] / 20) * 20;
      data[i + 2] = Math.round(data[i + 2] / 20) * 20;
      data[i + 3] = data[i + 3] < 110 ? 0 : 255;
    }
    ctx.putImageData(image, 0, 0);
  }

  // Covers the contact section edge to edge; clips flowers at the page's end
  // so one near the bottom can't make the page longer.
  const field = document.createElement("div");
  field.className = "flower-field";
  field.setAttribute("aria-hidden", "true");
  document.body.appendChild(field);

  function fitField() {
    const top = contact.getBoundingClientRect().top + window.scrollY;
    field.style.top = `${top}px`;
    field.style.height = `${document.documentElement.scrollHeight - top}px`;
    return top;
  }
  fitField();
  window.addEventListener("resize", fitField);

  function bloom(x, y) {
    const flower = document.createElement("canvas");
    flower.className = "flower";
    flower.width = flower.height = GRID;
    flower.style.left = `${x - SIZE / 2}px`;
    flower.style.top = `${y - SIZE / 2}px`;
    field.appendChild(flower);
    while (field.children.length > MAX_FLOWERS) field.firstChild.remove();

    const ctx = flower.getContext("2d", { willReadFrequently: true });
    const turn = Math.random() * Math.PI * 2;
    const painter = FLOWERS[nextFlower];
    nextFlower = (nextFlower + 1) % FLOWERS.length;
    const began = performance.now();

    function fadeAway() {
      setTimeout(() => {
        flower.classList.add("is-fading");
        setTimeout(() => flower.remove(), FADE_MS);
      }, HOLD_MS);
    }

    if (reduceMotion) {
      paint(painter, BLOOM, turn);
      pixelate(ctx);
      fadeAway();
      return;
    }

    function frame(now) {
      const t = (now - began) / 1000;
      paint(painter, t, turn);
      pixelate(ctx);
      if (t < BLOOM) {
        requestAnimationFrame(frame);
      } else {
        fadeAway();
      }
    }
    requestAnimationFrame(frame);
  }

  document.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.target.closest("a, button")) return;
    const top = fitField();
    const y = event.clientY + window.scrollY;
    if (y < top) return;
    bloom(event.clientX + window.scrollX, y - top);
  });
})();
