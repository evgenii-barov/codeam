import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { createIndexWheelSteps } from './indexWheelSteps';
import { scrollPageTo } from '../scroll/pageScroll';

type MorphSection = 'hero' | 'transition' | 'services';
type MorphOptions = {
  track: RefObject<HTMLDivElement | null>;
  stage: RefObject<HTMLDivElement | null>;
  enabled: boolean;
  reducedMotion: boolean;
};
type NativeViewTimeline = new (options: { subject: Element; axis: 'block'; inset: string }) => AnimationTimeline;
type ViewAnimationOptions = KeyframeAnimationOptions & { rangeStart: string; rangeEnd: string };
type SavedProperty = { value: string; priority: string };
type LayoutBox = { x: number; y: number; width: number; height: number };

function timelineConstructor() {
  return (window as typeof window & { ViewTimeline?: NativeViewTimeline }).ViewTimeline;
}

function supportsMorph() {
  return typeof window !== 'undefined' && typeof timelineConstructor() === 'function'
    && typeof Element.prototype.animate === 'function'
    && CSS.supports('animation-range-start', 'contain 0px')
    && CSS.supports('animation-range-end', 'contain 100px');
}

/** Offset coordinates ignore both the reveal transforms and the running morph. */
function offsetPosition(element: HTMLElement) {
  let x = 0, y = 0;
  let current: HTMLElement | null = element;
  while (current) {
    x += current.offsetLeft;
    y += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

function boxWithin(element: HTMLElement, origin: { x: number; y: number }): LayoutBox {
  const position = offsetPosition(element);
  return { x: position.x - origin.x, y: position.y - origin.y, width: element.offsetWidth, height: element.offsetHeight };
}

/** Native, reversible scroll-linked choreography; JS only measures and changes access at boundaries. */
export function useIndexMorph({ track, stage, enabled, reducedMotion }: MorphOptions) {
  const [supported] = useState(supportsMorph);
  const [failed, setFailed] = useState(false);
  const [section, setSection] = useState<MorphSection>('hero');
  // Establish the final grid and compositing layers before the intro is rendered.
  // Completing the dock only enables interaction; it must not rebuild the layout.
  const available = supported && !reducedMotion && !failed;
  const latest = useRef({ enabled, reducedMotion, available });
  latest.current = { enabled, reducedMotion, available };
  const measurement = useRef<{ documentTop: number; travel: number } | null>(null);
  const wheelSteps = useRef<ReturnType<typeof createIndexWheelSteps> | null>(null);
  const pendingFocus = useRef(false);

  const focusServices = useCallback(() => {
    queueMicrotask(() => {
      if (!pendingFocus.current || !latest.current.enabled) return;
      const heading = track.current?.querySelector<HTMLElement>('#studio-heading');
      if (!heading || heading.closest('[inert]')) return;
      pendingFocus.current = false;
      heading.focus({ preventScroll: true });
    });
  }, [track]);

  const goToOverview = useCallback(() => {
    if (!latest.current.enabled) return;
    pendingFocus.current = true;
    const cached = measurement.current;
    if (latest.current.available && cached) {
      if (wheelSteps.current) wheelSteps.current.navigate(2);
      else scrollPageTo(cached.documentTop + cached.travel);
      if (section === 'services') focusServices();
    } else {
      const overview = track.current?.querySelector<HTMLElement>('#studio');
      if (overview) scrollPageTo(overview);
      focusServices();
    }
  }, [focusServices, section, track]);

  const goToHero = useCallback(() => {
    pendingFocus.current = false;
    if (latest.current.available && wheelSteps.current) wheelSteps.current.navigate(0);
    else scrollPageTo(0);
  }, []);

  useEffect(() => {
    if (!available) return;
    const controller = createIndexWheelSteps({
      enabled: () => latest.current.available && latest.current.enabled,
      getBounds: () => {
        const bounds = measurement.current;
        return bounds ? { start: bounds.documentTop, travel: bounds.travel } : null;
      },
    });
    wheelSteps.current = controller;
    return () => {
      controller.destroy();
      if (wheelSteps.current === controller) wheelSteps.current = null;
    };
  }, [available]);

  useEffect(() => {
    if (!enabled) pendingFocus.current = false;
    else if (!available || section === 'services') focusServices();
  }, [enabled, available, section, focusServices]);

  useLayoutEffect(() => {
    if (!available) {
      measurement.current = null;
      setSection('hero');
      return;
    }
    const trackElement = track.current;
    const deck = stage.current;
    const ViewTimeline = timelineConstructor();
    if (!trackElement || !deck || !ViewTimeline) return;

    const upper = deck.querySelector<HTMLElement>('.ix-upper');
    const hero = deck.querySelector<HTMLElement>('.ix-hero-shell');
    const wordmark = deck.querySelector<HTMLElement>('.ix-wordmark-motion');
    const white = deck.querySelector<HTMLElement>('.ix-wordmark-white');
    const ink = deck.querySelector<HTMLElement>('.ix-wordmark-ink');
    const destination = deck.querySelector<HTMLElement>('.is-brand-wordmark');
    const servicesLayer = deck.querySelector<HTMLElement>('.ix-services-layer');
    const servicesReveal = deck.querySelector<HTMLElement>('.ix-services-reveal');
    const content = deck.querySelector<HTMLElement>('.is-inner');
    const brandBar = deck.querySelector<HTMLElement>('.is-brand-bar');
    const body = deck.querySelector<HTMLElement>('.is-body');
    const footer = deck.querySelector<HTMLElement>('.ix-footer');
    const heroSentinel = trackElement.querySelector<HTMLElement>('.ix-morph-hero-sentinel');
    const servicesSentinel = trackElement.querySelector<HTMLElement>('.ix-morph-services-sentinel');
    if (!upper || !hero || !wordmark || !white || !ink || !destination || !servicesLayer || !servicesReveal || !content || !brandBar || !body || !heroSentinel || !servicesSentinel) {
      setFailed(true);
      return;
    }

    let disposed = false;
    let scheduled = 0;
    let animations: Animation[] = [];
    let boundaries: IntersectionObserver | undefined;
    let heroPassed = false, servicesPassed = false;
    let currentSection: MorphSection = 'hero';
    let lastGeometry = '';
    let nearStage = true;
    const saved = new Map<HTMLElement, Map<string, SavedProperty>>();
    const promotions: [HTMLElement, string][] = [
      [upper, 'transform, opacity'], [wordmark, 'transform'],
      [servicesLayer, 'transform'], [servicesReveal, 'transform'], [content, 'opacity'],
    ];

    const saveProperty = (element: HTMLElement, property: string) => {
      let properties = saved.get(element);
      if (!properties) { properties = new Map(); saved.set(element, properties); }
      if (!properties.has(property)) properties.set(property, { value: element.style.getPropertyValue(property), priority: element.style.getPropertyPriority(property) });
    };
    const writeStyle = (element: HTMLElement, property: string, value: string) => {
      saveProperty(element, property);
      element.style.setProperty(property, value);
    };
    const restoreProperty = (element: HTMLElement, property: string) => {
      const original = saved.get(element)?.get(property);
      if (!original) return;
      if (original.value) element.style.setProperty(property, original.value, original.priority);
      else element.style.removeProperty(property);
    };
    const promoteSurfaces = () => {
      // Retain the wordmark's full-resolution layer while this stage is nearby.
      // Rebuilding layers at the reverse boundary causes a visible raster hitch.
      for (const [element, properties] of promotions) {
        if (!nearStage) restoreProperty(element, 'will-change');
        else writeStyle(element, 'will-change', properties);
      }
    };
    const applySection = (next: MorphSection) => {
      currentSection = next;
      setSection(previous => previous === next ? previous : next);
    };
    const cancelAnimations = () => {
      animations.forEach(animation => animation.cancel());
      animations = [];
    };
    const restoreAll = () => {
      for (const [element, properties] of saved) for (const property of properties.keys()) restoreProperty(element, property);
    };

    const measure = () => {
      scheduled = 0;
      if (disposed) return;

      // All geometry is read before mutating track height, origins or animation effects.
      const origin = offsetPosition(deck);
      const source = boxWithin(wordmark, origin);
      const target = boxWithin(destination, origin);
      const heroHeight = hero.offsetHeight;
      const deckHeight = deck.offsetHeight;
      const viewportHeight = document.documentElement.clientHeight || window.innerHeight;
      const trackViewportTop = trackElement.getBoundingClientRect().top;
      const documentTop = trackViewportTop + window.scrollY;
      const travel = Math.max(1, Math.round(viewportHeight * .8));
      const signature = JSON.stringify([source, target, heroHeight, deckHeight, viewportHeight, documentTop]);
      if (!source.width || !source.height || !target.width || !deckHeight) return;
      measurement.current = { documentTop, travel };
      if (signature === lastGeometry) return;
      lastGeometry = signature;

      const upperRise = Math.min(heroHeight * .22, 190);
      const sourceScale = target.width / source.width;
      const bridgeY = Math.max(target.y + 40, Math.min(heroHeight * .2, 220));
      const bridgeTransform = `translate3d(0,${bridgeY - source.y}px,0) scale(1)`;
      const brandBarTravel = bridgeY - target.y;
      const bodyTravel = bridgeY + source.height - (target.y + source.height * sourceScale);
      const dockTransform = `translate3d(${target.x - source.x}px,${target.y - source.y}px,0) scale(${sourceScale})`;
      // First wheel stop: a full-size black wordmark on the revealed paper.
      // The ink's own half-range uses the same easing as that first flight.
      const inkFrames: Keyframe[] = Array.from({ length: 61 }, (_, index) => {
        const progress = index / 60;
        const panelTop = heroHeight * (1 - progress);
        const wordmarkY = source.y + (bridgeY - source.y) * progress;
        const wordmarkHeight = source.height;
        const clipTop = Math.max(0, Math.min(100, (panelTop - wordmarkY) / wordmarkHeight * 100));
        return { offset: progress, clipPath: `inset(${clipTop.toFixed(5)}% 0 0)` };
      });

      try {
        cancelAnimations();
        boundaries?.disconnect();
        writeStyle(trackElement, 'height', `${deckHeight + travel}px`);
        writeStyle(heroSentinel, 'height', `${travel * .02}px`);
        writeStyle(servicesSentinel, 'height', `${travel * .98}px`);
        writeStyle(wordmark, 'transform-origin', '0 0');
        writeStyle(white, 'opacity', '1');
        writeStyle(ink, 'opacity', '1');
        promoteSurfaces();

        const timeline = new ViewTimeline({ subject: trackElement, axis: 'block', inset: '0px' });
        const ease = 'cubic-bezier(.59,0,.38,1)';
        const options: ViewAnimationOptions = { timeline, rangeStart: 'contain 0px', rangeEnd: `contain ${travel}px`, fill: 'both', easing: 'linear' };
        const animate = (element: HTMLElement, keyframes: Keyframe[], overrides: Partial<ViewAnimationOptions> = {}) => {
          const animation = element.animate(keyframes.map(keyframe => ({ easing: ease, ...keyframe })), { ...options, ...overrides });
          animations.push(animation);
        };
        animate(upper, [
          { offset: 0, transform: 'translate3d(0,0,0)', opacity: 1 },
          { offset: .5, transform: `translate3d(0,${-upperRise}px,0)`, opacity: 0 },
          { offset: 1, transform: `translate3d(0,${-upperRise}px,0)`, opacity: 0 },
        ]);
        if (footer) animate(footer, [{ offset: 0, opacity: 1 }, { offset: .3, opacity: 0 }, { offset: 1, opacity: 0 }]);
        // The window and its contents move equally in opposite directions:
        // only the reveal edge travels, while the text and paper never deform.
        animate(servicesLayer, [
          { offset: 0, transform: `translate3d(0,${heroHeight}px,0)` },
          { offset: .5, transform: 'translate3d(0,0,0)' },
          { offset: 1, transform: 'translate3d(0,0,0)' },
        ]);
        animate(servicesReveal, [
          { offset: 0, transform: `translate3d(0,${-heroHeight}px,0)` },
          { offset: .5, transform: 'translate3d(0,0,0)' },
          { offset: 1, transform: 'translate3d(0,0,0)' },
        ]);
        animate(wordmark, [
          { offset: 0, transform: 'translate3d(0,0,0) scale(1)' },
          { offset: .5, transform: bridgeTransform },
          { offset: 1, transform: dockTransform },
        ]);
        animate(ink, inkFrames.map(frame => ({ ...frame, easing: 'linear' })), { rangeEnd: `contain ${travel / 2}px`, easing: ease });
        animate(content, [
          { offset: 0, opacity: 0 },
          { offset: .5, opacity: 0 },
          { offset: 1, opacity: 1 },
        ]);
        // Keep the final breathing room around the moving wordmark throughout
        // the transition, without changing the text or symbol's proportions.
        animate(brandBar, [
          { offset: 0, transform: `translate3d(0,${brandBarTravel}px,0)`, opacity: 0 },
          { offset: .5, transform: `translate3d(0,${brandBarTravel}px,0)`, opacity: 0 },
          { offset: 1, transform: 'translate3d(0,0,0)', opacity: 1 },
        ]);
        animate(body, [
          { offset: 0, transform: `translate3d(0,${bodyTravel}px,0)` },
          { offset: .5, transform: `translate3d(0,${bodyTravel}px,0)` },
          { offset: 1, transform: 'translate3d(0,0,0)' },
        ]);

        heroPassed = trackViewportTop + travel * .02 <= 0;
        servicesPassed = trackViewportTop + travel * .98 <= 0;
        applySection(servicesPassed ? 'services' : heroPassed ? 'transition' : 'hero');
        boundaries = new IntersectionObserver(entries => {
          if (disposed) return;
          for (const entry of entries) {
            const passed = entry.boundingClientRect.bottom <= (entry.rootBounds?.top ?? 0);
            if (entry.target === heroSentinel) heroPassed = passed;
            else if (entry.target === servicesSentinel) servicesPassed = passed;
          }
          const next = servicesPassed ? 'services' : heroPassed ? 'transition' : 'hero';
          if (next !== currentSection) applySection(next);
        }, { threshold: 0 });
        boundaries.observe(heroSentinel);
        boundaries.observe(servicesSentinel);
      } catch {
        cancelAnimations();
        boundaries?.disconnect();
        restoreAll();
        measurement.current = null;
        setFailed(true);
      }
    };

    const scheduleMeasure = () => {
      if (!disposed && !scheduled) scheduled = requestAnimationFrame(measure);
    };
    measure();
    const resize = new ResizeObserver(scheduleMeasure);
    resize.observe(deck);
    const layerVisibility = new IntersectionObserver(entries => {
      nearStage = entries[0]?.isIntersecting ?? false;
      promoteSurfaces();
    }, { rootMargin: '200px' });
    layerVisibility.observe(deck);
    window.addEventListener('resize', scheduleMeasure, { passive: true });
    document.fonts.ready.then(scheduleMeasure);
    return () => {
      disposed = true;
      cancelAnimationFrame(scheduled);
      resize.disconnect();
      layerVisibility.disconnect();
      boundaries?.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
      cancelAnimations();
      restoreAll();
      measurement.current = null;
    };
  }, [available, track, stage]);

  return { available, section, goToOverview, goToHero };
}

export default useIndexMorph;
