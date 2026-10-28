// Fade elements up as they enter the screen, like Framer's appear effects.
const appearing = document.querySelectorAll(".appear");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -10% 0px" }
  );
  appearing.forEach((el) => observer.observe(el));
} else {
  appearing.forEach((el) => el.classList.add("is-in"));
}

// Draw the "iterate" loop on a flow chart, from the step marked
// data-loop="start" back into data-loop="end". In a row it runs under the
// steps; when the steps stack into a column it runs up their right side.
function drawFlowLoops() {
  document.querySelectorAll(".flow-wrap").forEach((wrap) => {
    const svg = wrap.querySelector(".flow-loop");
    const label = wrap.querySelector(".flow-loop-label");
    const from = wrap.querySelector('[data-loop="start"]');
    const to = wrap.querySelector('[data-loop="end"]');
    if (!svg || !from || !to) return;

    const box = wrap.getBoundingClientRect();
    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();
    const r = 8;
    const stacked = Math.abs(a.top - b.top) > 4;
    let d;
    let labelX;
    let labelY;

    if (stacked) {
      const x1 = a.right - box.left + 6;
      const x2 = b.right - box.left + 6;
      const y1 = a.top + a.height / 2 - box.top;
      const y2 = b.top + b.height / 2 - box.top;
      const side = Math.max(x1, x2) + 28;
      d =
        `M ${x1} ${y1} H ${side - r} Q ${side} ${y1} ${side} ${y1 - r}` +
        ` V ${y2 + r} Q ${side} ${y2} ${side - r} ${y2} H ${x2}` +
        ` M ${x2 + 5} ${y2 - 4} L ${x2} ${y2} L ${x2 + 5} ${y2 + 4}`;
      labelX = side + 10;
      labelY = (y1 + y2) / 2;
    } else {
      const x1 = a.left + a.width / 2 - box.left;
      const x2 = b.left + b.width / 2 - box.left;
      const top = Math.max(a.bottom, b.bottom) - box.top + 6;
      const low = top + 26;
      d =
        `M ${x1} ${top} V ${low - r} Q ${x1} ${low} ${x1 - r} ${low}` +
        ` H ${x2 + r} Q ${x2} ${low} ${x2} ${low - r} V ${top}` +
        ` M ${x2 - 4} ${top + 5} L ${x2} ${top} L ${x2 + 4} ${top + 5}`;
      labelX = (x1 + x2) / 2;
      labelY = low;
    }

    svg.querySelector("path").setAttribute("d", d);
    svg.classList.add("is-drawn");

    if (label) {
      label.classList.toggle("is-beside", stacked);
      label.style.left = `${labelX}px`;
      label.style.top = `${labelY}px`;
    }
  });
}

if (document.querySelector(".flow-wrap")) {
  drawFlowLoops();
  window.addEventListener("resize", drawFlowLoops);
  if (document.fonts) document.fonts.ready.then(drawFlowLoops);
}

// Glide down to in-page sections (like the Contact link) instead of jumping.
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();

    const start = window.scrollY;
    const end = Math.min(
      target.getBoundingClientRect().top + start,
      document.documentElement.scrollHeight - window.innerHeight
    );
    const duration = 1400;
    const began = performance.now();

    function step(now) {
      const t = Math.min((now - began) / duration, 1);
      window.scrollTo({ top: start + (end - start) * easeInOut(t), behavior: "instant" });
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    history.replaceState(null, "", link.getAttribute("href"));
  });
});
