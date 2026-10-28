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
