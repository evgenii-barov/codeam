import type Lenis from 'lenis';
import type { ScrollToOptions } from 'lenis';

let engine: Lenis | null = null;
let wake = () => {};
export function connectPageScroll(next: Lenis | null, resume = () => {}) { engine = next; wake = resume; }
export function pageScrollTarget() { return engine?.targetScroll ?? window.scrollY; }
export function freezePageScroll() {
  if (engine) engine.scrollTo(engine.actualScroll, { immediate: true, force: true });
}
export function setPageScroll(top: number) {
  if (engine) engine.scrollTo(top, { immediate: true, force: true });
  else window.scrollTo({ top, behavior: 'instant' });
}
export function scrollPageTo(target: number | HTMLElement, options: ScrollToOptions = {}) {
  if (engine) {
    engine.resize();
    engine.scrollTo(target, { duration: 1.15, easing: t => (1 - Math.cos(Math.PI * t)) / 2, ...options });
    wake();
  } else {
    const top = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
}
