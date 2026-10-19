import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { connectPageScroll, freezePageScroll, scrollPageTo } from './pageScroll';

const ScrollContext = createContext<Lenis | null>(null);
export const usePageScroll = () => useContext(ScrollContext);

export default function SmoothScroll({ children }: { children: ReactNode }) {
  const [engine, setEngine] = useState<Lenis | null>(null);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let dispose = () => {};
    const setup = () => {
      dispose();
      if (media.matches) { setEngine(null); return; }
      let frame = 0;
      const wake = () => {
        if (!frame && !document.hidden) {
          lenis.time = performance.now();
          frame = requestAnimationFrame(tick);
        }
      };
      // Same wheel response as VNE, with a frame loop that sleeps at rest.
      const lenis = new Lenis({
        autoRaf: false, anchors: false, gestureOrientation: 'vertical',
        lerp: .1, smoothWheel: true, syncTouch: false, wheelMultiplier: 1,
        allowNestedScroll: true,
        prevent: node => node.matches('dialog, input, textarea, select, [contenteditable="true"]'),
        virtualScroll: ({ event }) => !event.defaultPrevented,
      });
      function tick(time: number) {
        frame = 0;
        lenis.raf(time);
        if (lenis.isScrolling === 'smooth' && !document.hidden) frame = requestAnimationFrame(tick);
      }
      connectPageScroll(lenis, wake);
      setEngine(lenis);
      const off = lenis.on('virtual-scroll', wake);
      const syncLock = () => {
        const intro = document.querySelector<HTMLElement>('.ix-experience');
        const locked = !!document.querySelector('dialog[open]') || !!(intro && intro.dataset.phase !== 'active');
        if (locked && !lenis.isStopped) lenis.stop();
        else if (!locked && lenis.isStopped) lenis.start();
      };
      const mutation = new MutationObserver(syncLock);
      mutation.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'data-phase'] });
      syncLock();
      const visibility = () => {
        if (document.hidden) { freezePageScroll(); cancelAnimationFrame(frame); frame = 0; }
      };
      const key = (event: KeyboardEvent) => {
        if (['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' ','Tab'].includes(event.key)) freezePageScroll();
      };
      const anchor = (event: MouseEvent) => {
        // Custom hero/case navigation already owns its animation.
        if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return;
        const link = event.composedPath().find(node => node instanceof HTMLAnchorElement) as HTMLAnchorElement | undefined;
        if (!link || link.target || link.hasAttribute('download')) return;
        const url = new URL(link.href);
        if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search || !url.hash) return;
        const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
        if (!target) return;
        event.preventDefault(); scrollPageTo(target);
      };
      document.addEventListener('visibilitychange', visibility);
      window.addEventListener('keydown', key, true);
      window.addEventListener('click', anchor);
      dispose = () => {
        mutation.disconnect(); off(); cancelAnimationFrame(frame);
        document.removeEventListener('visibilitychange', visibility);
        window.removeEventListener('keydown', key, true);
        window.removeEventListener('click', anchor);
        connectPageScroll(null); lenis.destroy();
      };
    };
    setup(); media.addEventListener('change', setup);
    return () => { media.removeEventListener('change', setup); dispose(); };
  }, []);
  return <ScrollContext.Provider value={engine}>{children}</ScrollContext.Provider>;
}
