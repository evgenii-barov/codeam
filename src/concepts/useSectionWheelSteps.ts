import { useEffect } from 'react';
import type { RefObject } from 'react';
import { usePageScroll } from '../scroll/SmoothScroll';
import { freezePageScroll, scrollPageTo } from '../scroll/pageScroll';

const defaultFollowing = ['#services', '#process', '#about', '#reviews', '#contact'];
const noLeading: string[] = [];

type Stop = { top: number; bottom: number; case: boolean };

/** One controller owns the case reel and every following section boundary. */
export function useSectionWheelSteps(reel: RefObject<HTMLDivElement | null>, enabled: boolean, followingSelectors: string[] = defaultFollowing, leadingSelectors: string[] = noLeading, layoutKey = 0) {
  const lenis = usePageScroll();
  useEffect(() => {
    const element = reel.current;
    if (!lenis || !element || !enabled) return;
    const media = matchMedia('(prefers-reduced-motion: no-preference)');
    let stops: Stop[] = [];
    let running: { index: number; direction: number; token: number } | null = null;
    let queued: number | null = null;
    let serial = 0, lastWheel = -Infinity;
    let residualDirection = 0;
    const owns = () => running && lenis.userData.caseStep === running.token;
    const cancel = () => {
      if (owns()) freezePageScroll();
      running = null; queued = null; residualDirection = 0;
    };
    const following = followingSelectors.map(selector => document.querySelector<HTMLElement>(selector)).filter((node): node is HTMLElement => !!node);
    const leading = leadingSelectors.map(selector => document.querySelector<HTMLElement>(selector)).filter((node): node is HTMLElement => !!node);
    const footer = document.querySelector<HTMLElement>('.cl-footer');
    if (footer) following.push(footer);
    const readStops = () => {
      const y = window.scrollY;
      // Small/reduced layouts show ordinary stacked cases rather than a pinned reel.
      const gallery = element.dataset.gallery === 'true';
      const cases = !gallery && innerHeight > 700 ? Array.from(element.querySelectorAll<HTMLElement>('.iw-step')) : [];
      const workFallback = !cases.length && (leading.length || gallery) ? [element] : [];
      stops = [...leading, ...cases, ...workFallback, ...following].map(node => {
        const rect = node.getBoundingClientRect();
        return { top: rect.top + y, bottom: rect.bottom + y, case: node.classList.contains('iw-step') };
      });
      lenis.resize();
    };
    const measure = () => { cancel(); readStops(); };
    const destination = (index: number, direction: number) => {
      if (index < 0) return Math.max(0, stops[0].top - innerHeight);
      const stop = stops[index];
      // Return to the readable bottom of a tall section, not past its content.
      return direction < 0 && !stop.case ? Math.max(stop.top, stop.bottom - innerHeight) : stop.top;
    };
    const begin = (index: number, direction: number) => {
      const token = ++serial;
      running = { index, direction, token }; queued = null; residualDirection = 0;
      scrollPageTo(destination(index, direction), {
        duration: 1.3, programmatic: false, userData: { caseStep: token },
        easing: t => t * t * t * (t * (t * 6 - 15) + 10),
        onComplete: () => {
          if (running?.token !== token) return;
          const next = queued;
          running = null; queued = null; residualDirection = direction;
          // Lenis clears userData after onComplete; do not start the next move before that.
          if (next !== null) queueMicrotask(() => begin(next, direction));
        },
      });
    };
    const nativeTarget = (event: WheelEvent) => event.composedPath().some(node => {
      if (!(node instanceof HTMLElement) || node === document.body || node === document.documentElement) return false;
      if (node.matches('dialog, input, textarea, select, [contenteditable="true"], [data-lenis-prevent]')) return true;
      return /^(auto|scroll)$/.test(getComputedStyle(node).overflowY) && node.scrollHeight > node.clientHeight + 1;
    });
    const wheel = (event: WheelEvent) => {
      if (!media.matches || !stops.length || event.defaultPrevented || !event.cancelable || event.ctrlKey || event.metaKey || !event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (lenis.isStopped || document.querySelector('dialog[open]') || nativeTarget(event)) { cancel(); return; }
      if (running && !owns()) { running = null; queued = null; }
      const now = performance.now(), quiet = now - lastWheel > 220;
      const direction = Math.sign(event.deltaY), y = window.scrollY;
      lastWheel = now;
      // A parent can change its height without resizing any of these sections.
      // Read once at the start of a gesture, never during an animated transition.
      if (!running && quiet) readStops();
      const consume = () => event.preventDefault();
      if (running) {
        consume();
        const next = Math.max(-1, Math.min(stops.length - 1, running.index + direction));
        if (direction !== running.direction) begin(next, direction);
        else if (quiet && next !== running.index && (stops[running.index]?.case || (stops[running.index]?.bottom ?? 0) - (stops[running.index]?.top ?? 0) <= innerHeight + 2)) queued = next;
        return;
      }
      if (residualDirection === direction && !quiet) { consume(); return; }
      residualDirection = 0;
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
      const projected = lenis.targetScroll + delta;
      if (y < stops[0].top - 1) {
        const nearEntry = y >= stops[0].top - innerHeight * .85;
        if (direction > 0 && (projected >= stops[0].top || nearEntry && quiet)) { consume(); begin(0, direction); }
        return;
      }
      // The footer is shorter than a viewport: its reachable landing is the
      // document end. An upward gesture returns to contact before leaving it.
      const contactIndex = stops.length - (footer ? 2 : 1);
      if (footer && direction < 0 && y > stops[contactIndex].top + 2) {
        const footerLanding = Math.max(stops[contactIndex].top, stops.at(-1)!.bottom - innerHeight);
        if (quiet && y >= footerLanding - 2) { consume(); begin(contactIndex, direction); return; }
      }
      const index = stops.reduce((found, stop, i) => stop.top <= y + 1 ? i : found, 0);
      const current = stops[index];
      if (current.case) {
        consume();
        const next = direction > 0 ? index + 1 : y > current.top + 1 ? index : index - 1;
        if (next < stops.length) begin(next, direction);
        return;
      }
      // Wheel inertia can finish reading a section, but only a new gesture crosses its boundary.
      const edge = Math.min(140, innerHeight * .16);
      if (direction > 0 && index < stops.length - 1) {
        const nearBottom = y + innerHeight >= current.bottom - edge;
        if (quiet && nearBottom || projected >= stops[index + 1].top) { consume(); begin(index + 1, direction); }
      } else if (direction < 0) {
        if (quiet && y <= current.top + edge || projected < current.top) { consume(); begin(index - 1, direction); }
      }
    };
    const key = (event: KeyboardEvent) => {
      if (['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' ','Tab','Escape'].includes(event.key)) cancel();
    };
    const visibility = () => { if (document.hidden) cancel(); };
    const click = (event: MouseEvent) => { if (event.composedPath().some(node => node instanceof HTMLAnchorElement)) cancel(); };
    const resize = new ResizeObserver(measure); resize.observe(element);
    [...leading, ...following].forEach(node => resize.observe(node));
    const experience = element.closest('.ix-experience');
    if (experience) resize.observe(experience);
    const overview = document.getElementById('studio');
    if (overview) resize.observe(overview);
    measure();
    window.addEventListener('wheel', wheel, { capture: true, passive: false });
    window.addEventListener('pointerdown', cancel, true);
    window.addEventListener('touchstart', cancel, { capture: true, passive: true });
    window.addEventListener('keydown', key, true);
    window.addEventListener('click', click, true);
    window.addEventListener('resize', measure);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      cancel(); resize.disconnect();
      window.removeEventListener('wheel', wheel, true);
      window.removeEventListener('pointerdown', cancel, true);
      window.removeEventListener('touchstart', cancel, true);
      window.removeEventListener('keydown', key, true);
      window.removeEventListener('click', click, true);
      window.removeEventListener('resize', measure);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [reel, enabled, lenis, followingSelectors, leadingSelectors, layoutKey]);
}
