// Scroll reveal — directional slide animations with blur
// Supports: .reveal, .slide-left, .slide-right, .slide-down,
//           .slide-scale, .slide-fade, .slide-rotate, .draw-in

const ANIM_CLASSES = [
  'reveal', 'slide-left', 'slide-right', 'slide-down',
  'slide-scale', 'slide-fade', 'slide-rotate', 'draw-in',
];

const SELECTOR = ANIM_CLASSES.map(c => '.' + c).join(', ');

function initScrollReveal() {
  const elements = document.querySelectorAll(SELECTOR);
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = el.dataset.delay || '0';
          const duration = el.dataset.duration || '0.9';

          el.style.transition = [
            `opacity ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
            `transform ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
            `filter ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
          ].join(', ');

          el.classList.add('is-visible');
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -10% 0px' }
  );

  // Auto-stagger: children inside .stagger-children get incremental delays
  document.querySelectorAll('.stagger-children').forEach((parent) => {
    const children = parent.querySelectorAll(SELECTOR);
    children.forEach((child, i) => {
      child.dataset.delay = String(i * 120);
    });
  });

  // Also stagger grids (backwards compat)
  document.querySelectorAll('.grid').forEach((grid) => {
    const cards = grid.querySelectorAll(SELECTOR);
    cards.forEach((card, i) => {
      if (!card.dataset.delay) {
        card.dataset.delay = String(i * 100);
      }
    });
  });

  elements.forEach((el) => observer.observe(el));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScrollReveal);
} else {
  initScrollReveal();
}
