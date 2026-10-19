import { useEffect } from 'react';
import type { RefObject } from 'react';
import { usePageScroll } from '../scroll/SmoothScroll';
import { freezePageScroll, scrollPageTo } from '../scroll/pageScroll';

export function useCaseWheelSteps(reel: RefObject<HTMLDivElement | null>, enabled: boolean) {
  const lenis = usePageScroll();
  useEffect(() => {
    const element = reel.current;
    if (!lenis || !element || !enabled) return;
    const media = matchMedia('(min-height: 701px) and (prefers-reduced-motion: no-preference)');
    let stops: number[] = [], end = 0;
    let running: { index: number; direction: number; token: number } | null = null;
    let queued: number | null = null;
    let serial = 0, lastWheel = -Infinity;
    let residualDirection = 0;
    const owns = () => running && lenis.userData.caseStep === running.token;
    const cancel = () => {
      if (owns()) freezePageScroll();
      running = null; queued = null; residualDirection = 0;
    };
    const measure = () => {
      cancel();
      const y = window.scrollY;
      stops = Array.from(element.querySelectorAll<HTMLElement>('.iw-step')).map(step => step.getBoundingClientRect().top + y);
      end = element.getBoundingClientRect().bottom + y;
      lenis.resize();
    };
    const destination = (index: number) => index < 0 ? Math.max(0, stops[0] - innerHeight)
      : index >= stops.length ? (document.getElementById('services')?.getBoundingClientRect().top ?? innerHeight) + window.scrollY
      : stops[index];
    const begin = (index: number, direction: number) => {
      const token = ++serial;
      running = { index, direction, token }; queued = null; residualDirection = 0;
      scrollPageTo(destination(index), {
        duration: 1.3, programmatic: false, userData: { caseStep: token },
        easing: t => t * t * t * (t * (t * 6 - 15) + 10),
        onComplete: () => {
          if (running?.token !== token) return;
          const next = queued;
          running = null; queued = null; residualDirection = direction;
          // Lenis clears userData after onComplete. Start the queued transition afterwards.
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
      if (!media.matches || event.defaultPrevented || !event.cancelable || event.ctrlKey || event.metaKey || !event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (lenis.isStopped || document.querySelector('dialog[open]') || nativeTarget(event)) { cancel(); return; }
      if (running && !owns()) { running = null; queued = null; }
      const now = performance.now(), quiet = now - lastWheel > 220;
      const direction = Math.sign(event.deltaY), y = window.scrollY;
      lastWheel = now;
      const consume = () => { event.preventDefault(); };
      if (running) {
        consume();
        if (direction !== running.direction) begin(Math.max(-1, Math.min(stops.length, running.index + direction)), direction);
        else if (quiet) queued = Math.max(-1, Math.min(stops.length, running.index + direction));
        return;
      }
      if (residualDirection === direction && !quiet) { consume(); return; }
      residualDirection = 0;
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
      const projected = lenis.targetScroll + delta;
      if (y < stops[0] - 1) {
        // Once the end of the overview is in view, the next distinct gesture
        // brings in the whole first case. The preceding gesture's inertia must
        // not start this transition just because it reaches the entry zone.
        const nearEntry = y >= stops[0] - innerHeight * .85;
        if (direction > 0 && (projected >= stops[0] || nearEntry && quiet)) { consume(); begin(0, direction); }
        return;
      }
      if (y > end + 1) {
        if (direction < 0 && projected <= end) { consume(); begin(stops.length - 1, direction); }
        return;
      }
      if (direction < 0 && y > stops[stops.length - 1] + 1) { consume(); begin(stops.length - 1, direction); return; }
      if (direction > 0 && y > stops[stops.length - 1] + 1) return;
      consume();
      const next = direction > 0 ? stops.findIndex(stop => stop > y + 1)
        : stops.reduce((found, stop, index) => stop < y - 1 ? index : found, -1);
      begin(direction > 0 && next < 0 ? stops.length : next, direction);
    };
    const key = (event: KeyboardEvent) => {
      if (['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' ','Tab','Escape'].includes(event.key)) cancel();
    };
    const visibility = () => { if (document.hidden) cancel(); };
    const click = (event: MouseEvent) => { if (event.composedPath().some(node => node instanceof HTMLAnchorElement)) cancel(); };
    const resize = new ResizeObserver(measure); resize.observe(element);
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
  }, [reel, enabled, lenis]);
}
