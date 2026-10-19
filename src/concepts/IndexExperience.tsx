import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import MetalLogoScene from '../components/MetalLogoScene';
import MatchedMetalScene from '../components/MatchedMetalScene';
import { BRAND_PATHS, BRAND_VIEWBOX } from '../components/brandShape';
import { MATCHED_PATHS, MATCHED_VIEWBOX } from '../components/matchedBrandShape';
import IndexServices from './IndexServices';
import IndexProcess from './IndexProcess';
import { IndexAbout, IndexTestimonials } from './IndexClosingSections';
import IndexContact from './IndexContact';
import IndexOverview from './IndexOverview';
import IndexWorks from './IndexWorks';
import { useIndexMorph } from './useIndexMorph';
import { Arrow } from '../components/Shared';
import type { HeroProps, PanelKind } from '../components/Shared';
import './index-experience.css';
import { scrollPageTo, setPageScroll } from '../scroll/pageScroll';

type Phase = 'assembling' | 'materializing' | 'ready' | 'entering' | 'active';
const navigation: [PanelKind, string][] = [['work', 'Работы'], ['services', 'Услуги'], ['about', 'Подход']];

function Symbol({ className = '', sculpture = false }: { className?: string; sculpture?: boolean }) {
  const paths = sculpture ? MATCHED_PATHS : BRAND_PATHS;
  return <svg className={className} viewBox={sculpture ? MATCHED_VIEWBOX : BRAND_VIEWBOX} fill="currentColor" aria-hidden="true"><path className="ix-slash ix-slash-first" d={paths.first} /><path className="ix-slash ix-slash-second" d={paths.second} /><path className="ix-star" d={paths.star} /></svg>;
}

export default function IndexExperience({ onOpen }: HeroProps) {
  const physical = new URLSearchParams(window.location.search).get('material') === 'physical';
  const [phase, setPhase] = useState<Phase>('assembling');
  const [sceneFailed, setSceneFailed] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [instant, setInstant] = useState(false);
  const [paused, setPaused] = useState(document.hidden);
  const [introHeight, setIntroHeight] = useState(window.innerHeight);
  const [dockTarget, setDockTarget] = useState<{ x: number; y: number; width: number; height: number }>();
  const phaseRef = useRef<Phase>('assembling');
  const loadedRef = useRef(false);
  const failedRef = useRef(false);
  const keyboardEntry = useRef(false);
  const lastWheelAt = useRef(-Infinity);
  const wheelGestureAllowed = useRef(false);
  const stage = useRef<HTMLDivElement>(null);
  const canvasHost = useRef<HTMLDivElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const skipButton = useRef<HTMLButtonElement>(null);
  const morphTrack = useRef<HTMLDivElement>(null);
  const morphStage = useRef<HTMLDivElement>(null);
  const morph = useIndexMorph({ track: morphTrack, stage: morphStage, enabled: phase === 'active', reducedMotion });
  const isDocked = phase === 'entering' || phase === 'active';
  const isRevealed = phase !== 'assembling';
  const showWorks = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const works = document.getElementById('work');
    if (works) scrollPageTo(works);
    works?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  };
  const showServices = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const services = document.getElementById('services');
    if (services) scrollPageTo(services);
    services?.querySelector<HTMLElement>('.dv-panel[data-current="true"] h2')?.focus({ preventScroll: true });
  };
  const showOverview = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    morph.goToOverview();
  };

  const changePhase = useCallback((next: Phase) => { phaseRef.current = next; setPhase(next); }, []);
  const onReady = useCallback(() => { loadedRef.current = true; }, []);
  const onDocked = useCallback(() => {
    if (phaseRef.current === 'entering') changePhase('active');
  }, [changePhase]);
  const onError = useCallback(() => { failedRef.current = true; setSceneFailed(true); }, []);
  const enter = useCallback((skip = false, keyboard = false) => {
    if (phaseRef.current === 'active' || phaseRef.current === 'entering') return;
    if (!skip && phaseRef.current !== 'ready') return;
    keyboardEntry.current = keyboard;
    if (skip || reducedMotion) { setInstant(true); changePhase('active'); }
    else changePhase('entering');
  }, [changePhase, reducedMotion]);

  useEffect(() => {
    const oldTitle = document.title;
    document.title = 'CODEAM — Дизайн и технологии';
    return () => { document.title = oldTitle; };
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    const visibility = () => setPaused(document.hidden);
    media.addEventListener('change', update);
    document.addEventListener('visibilitychange', visibility);
    return () => { media.removeEventListener('change', update); document.removeEventListener('visibilitychange', visibility); };
  }, []);

  useEffect(() => {
    if (cycle > 0) skipButton.current?.focus({ preventScroll: true });
  }, [cycle]);

  useLayoutEffect(() => {
    const restoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    setPageScroll(0);
    return () => { history.scrollRestoration = restoration; };
  }, []);

  useLayoutEffect(() => {
    const origin = (element: HTMLElement) => {
      let x = 0, y = 0;
      for (let node: HTMLElement | null = element; node; node = node.offsetParent as HTMLElement | null) {
        x += node.offsetLeft;
        y += node.offsetTop;
      }
      return { x, y };
    };
    const measure = () => {
      if (!stage.current || !canvasHost.current) return;
      const slot = origin(stage.current);
      const host = origin(canvasHost.current);
      const nextTarget = { x: slot.x - host.x, y: slot.y - host.y, width: stage.current.offsetWidth, height: stage.current.offsetHeight };
      const nextIntroHeight = intro.current?.offsetHeight;
      setDockTarget(nextTarget);
      if (nextIntroHeight) setIntroHeight(nextIntroHeight);
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (stage.current) observer.observe(stage.current);
    if (canvasHost.current) observer.observe(canvasHost.current);
    if (intro.current) observer.observe(intro.current);
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  // Advance the intro on visible time only. React updates at phase boundaries, not every frame.
  useEffect(() => {
    let elapsed = 0;
    let revealStarted = -1;
    let previous = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      if (phaseRef.current === 'active' || phaseRef.current === 'entering') return;
      if (!document.hidden) elapsed += Math.min(now - previous, 80);
      previous = now;
      if (elapsed > 9000 && !loadedRef.current && !failedRef.current) onError();
      if ((loadedRef.current || failedRef.current) && elapsed >= (reducedMotion ? 0 : 2350)) {
        if (revealStarted < 0) { revealStarted = elapsed; changePhase(reducedMotion ? 'ready' : 'materializing'); }
        if (reducedMotion || elapsed - revealStarted >= 1450) { changePhase('ready'); return; }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [cycle, reducedMotion, changePhase, onError]);

  useEffect(() => {
    // The matched renderer completes entry after presenting its final dock frame.
    // Keep a timer only for the optional physical scene and the vector fallback.
    if (phase !== 'entering' || (!physical && !sceneFailed)) return;
    let elapsed = 0;
    let previous = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      if (!document.hidden) elapsed += Math.min(now - previous, 80);
      previous = now;
      if (elapsed >= 1500 || reducedMotion) { changePhase('active'); return; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase, reducedMotion, changePhase, physical, sceneFailed]);

  useEffect(() => {
    if (phase === 'active') {
      if (keyboardEntry.current) heading.current?.focus({ preventScroll: true });
      return;
    }
    let total = 0;
    let touch: { x: number; y: number; ready: boolean } | null = null;
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      event.preventDefault();
      const now = performance.now();
      if (now - lastWheelAt.current > 180) { total = 0; wheelGestureAllowed.current = phaseRef.current === 'ready'; }
      lastWheelAt.current = now;
      if (phaseRef.current !== 'ready' || !wheelGestureAllowed.current || event.deltaY <= 0) { total = 0; return; }
      total += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
      if (total >= 24) enter();
    };
    const key = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.key === 'Escape') { event.preventDefault(); enter(true, true); }
      if (['ArrowDown', 'PageDown', ' '].includes(event.key) && event.target === document.body) { event.preventDefault(); enter(false, true); }
    };
    const start = (event: TouchEvent) => { touch = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY, ready: phaseRef.current === 'ready' } : null; };
    const move = (event: TouchEvent) => {
      if (!touch || event.touches.length !== 1) return;
      const dx = event.touches[0].clientX - touch.x;
      const dy = touch.y - event.touches[0].clientY;
      if (Math.abs(dy) > Math.abs(dx)) { event.preventDefault(); if (touch.ready && dy > 32) enter(); }
    };
    window.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('keydown', key);
    window.addEventListener('touchstart', start, { passive: true });
    window.addEventListener('touchmove', move, { passive: false });
    return () => {
      window.removeEventListener('wheel', wheel); window.removeEventListener('keydown', key);
      window.removeEventListener('touchstart', start); window.removeEventListener('touchmove', move);
    };
  }, [phase, enter]);

  const replay = () => {
    setPageScroll(0);
    keyboardEntry.current = false;
    lastWheelAt.current = -Infinity;
    wheelGestureAllowed.current = false;
    setInstant(true);
    changePhase('assembling');
    setCycle(value => value + 1);
    // Reset the scene while hidden; subsequent docking should animate again.
    window.setTimeout(() => setInstant(false), 60);
  };

  return <main id="codeam-top" className="ix-experience" data-morph={morph.available} data-morph-section={morph.section} data-material={physical ? 'physical' : 'matched'} data-phase={phase} data-paused={paused} data-instant={instant || reducedMotion} data-fallback={sceneFailed}>
    <div className="ix-morph-track" ref={morphTrack}>
    <div className="ix-morph-hero-sentinel" aria-hidden="true" />
    <div className="ix-morph-services-sentinel" aria-hidden="true" />
    <div className="ix-morph-stage" ref={morphStage}>
    <div className="ix-hero-shell">
    <div className="ix-canvas-fold">
    <div className="ix-canvas-host" ref={canvasHost} aria-hidden="true">
      {physical ? <MetalLogoScene onReady={onReady} onError={onError} docked={isDocked} revealed={isRevealed} reducedMotion={reducedMotion || instant} active={!sceneFailed && morph.section === 'hero'} dockTarget={dockTarget} introHeight={introHeight} /> : <MatchedMetalScene onReady={onReady} onDocked={onDocked} onError={onError} docked={isDocked} revealed={isRevealed} reducedMotion={reducedMotion} instantDock={instant} active={!sceneFailed && morph.section === 'hero'} dockTarget={dockTarget} introHeight={introHeight} lighting="original" />}
    </div>
    </div>

    <div className="ix-intro" ref={intro} inert={isDocked} aria-hidden={isDocked}>
      <header className="ix-intro-header"><img src={import.meta.env.BASE_URL + 'assets/wordmark.svg'} alt="CODEAM" width="119" /><button ref={skipButton} onClick={() => enter(true, true)} aria-label="Пропустить заставку" title="Пропустить заставку"><Arrow diagonal /></button></header>
      <div className="ix-silhouette" key={cycle}><Symbol sculpture={!physical} /></div>
      <div className="ix-intro-bottom">
        <div className="ix-intro-control"><button className="ix-continue" onClick={() => enter(false, true)} disabled={phase !== 'ready'} aria-label="Листайте, чтобы продолжить" title="Продолжить"> <span aria-hidden="true">↓</span></button></div>
        
      </div>
    </div>

    <section className="ix-hero" inert={phase !== 'active' || morph.section !== 'hero'} aria-hidden={phase !== 'active' || morph.section !== 'hero'} aria-label="CODEAM — дизайн и технологии">
      <div className="ix-upper">
        <header className="ix-rail ix-reveal">
          <a href={import.meta.env.BASE_URL} className="ix-identity" aria-label="CODEAM — повторить заставку" onClick={event => { event.preventDefault(); replay(); }}><img src={import.meta.env.BASE_URL + 'assets/brand-symbol.svg'} alt="" /></a>
          <div className="ix-index"><nav aria-label="Навигация сайта">{navigation.map(([kind, label], index) => kind === 'services' || kind === 'work' ? <a key={kind} href={kind === 'work' ? '#work' : '#services'} onClick={kind === 'work' ? showWorks : showServices}><span className="ix-number">0{index + 1}</span><span>{label}</span><Arrow diagonal /></a> : <button key={kind} onClick={() => onOpen(kind)}><span className="ix-number">0{index + 1}</span><span>{label}</span><Arrow diagonal /></button>)}</nav></div>
          <button className="ix-contact" onClick={() => onOpen('project')}><span>Обсудить<br /> проект</span><Arrow diagonal /></button>
        </header>
        <div className="ix-stage" ref={stage}>
          {sceneFailed && <div className="ix-fallback"><Symbol /></div>}
          <h1 className="ix-heading ix-reveal" tabIndex={-1} ref={heading}>Развиваем сайты,<br />на которых бизнес<br /><span>получает заявки</span></h1>
        </div>
      </div>
      <div className="ix-wordmark ix-reveal"><div className="ix-wordmark-motion"><img className="ix-wordmark-white" src={import.meta.env.BASE_URL + 'assets/wordmark.svg'} alt="CODEAM" /><img className="ix-wordmark-ink" src={import.meta.env.BASE_URL + 'assets/wordmark.svg'} alt="" aria-hidden="true" /></div></div>
      <div className="ix-footer ix-reveal"><button onClick={replay}>Смотреть интро <span aria-hidden="true">↺</span></button><a href="#studio" onClick={showOverview}>Далее <span aria-hidden="true">↓</span></a></div>
    </section>
    </div>
    <div className="ix-services-layer">
      <div className="ix-services-reveal">
      <div className="ix-morph-paper" aria-hidden="true" />
      <IndexOverview active={phase === 'active' && (!morph.available || morph.section === 'services')} onHome={event => { event.preventDefault(); morph.goToHero(); }} onWorks={showWorks} onOpen={onOpen} />
      </div>
    </div>
    </div>
    </div>
    <IndexWorks onOpen={onOpen} active={phase === 'active'} />
    <IndexServices onOpen={onOpen} active={phase === 'active'} />
    <IndexProcess onOpen={onOpen} active={phase === 'active'} />
    <IndexAbout onOpen={onOpen} active={phase === 'active'} />
    <IndexTestimonials active={phase === 'active'} />
    <IndexContact active={phase === 'active'} reducedMotion={reducedMotion} />
  </main>;
}




