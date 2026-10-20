import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Arrow } from '../components/Shared';
import type { PanelKind } from '../components/Shared';
import ProjectPreview from '../cases/ProjectPreview';
import { projects, caseHref } from '../cases/projects';
import type { Project } from '../cases/projects';
import type { AmbientColor } from './caseAmbient';
import { useSectionWheelSteps } from './useSectionWheelSteps';
import './index-works.css';
import './works-variants.css';
import WorksCarousel from './WorksCarousel';
import WorksCatalog from './WorksCatalog';
import WorksFold from './WorksFold';
import WorksAtlas from './WorksAtlas';
import './works-design-controls.css';
import { setPageScroll, scrollPageTo } from '../scroll/pageScroll';
import type { CSSProperties } from 'react';

const worksTitle = 'Избранные работы';

const workMasters = [
  { id: 'carousel', layouts: 4 },
  { id: 'reel', layouts: 4 },
  { id: 'catalog', layouts: 4 },
  { id: 'fold', layouts: 4 },
  { id: 'atlas', layouts: 4 },
];

function WorksComposition({ variant, current, onNavigate, onAmbient }: {
  variant: number; current: number;
  onNavigate: (index: number) => void; onAmbient: (index: number, color: AmbientColor) => void;
}) {
  const preview = (project: Project, index: number) => <a className="iw-preview-trigger" href={caseHref(project.slug)} aria-label={`О проекте ${project.name}`}>
    <ProjectPreview project={project} onAmbient={color => onAmbient(index, color)} /><span className="iw-art-open" aria-hidden="true"><Arrow diagonal /></span>
  </a>;
  return <div className={`iw-composition iw-composition-${variant}`}>
    {variant === 1 && <div className="iw-horizontal-window"><div className="iw-horizontal-rail" style={{ transform: `translateX(calc(${current} * (-100% - 4vw)))` }}>
      {projects.map((project, index) => <div className="iw-horizontal-slide" key={project.name} data-active={index === current} inert={index !== current} aria-hidden={index !== current}>{preview(project, index)}</div>)}
    </div></div>}
    {variant === 2 && <div className="iw-index-layout">
      <nav className="iw-project-index" aria-label="Выбрать проект"><span className="iw-kicker">Четыре проекта / разные задачи</span>{projects.map((project, index) => <button key={project.name} aria-current={current === index ? 'true' : undefined} onClick={() => onNavigate(index)}><span>0{index + 1}</span><strong>{project.name}</strong><Arrow diagonal /></button>)}</nav>
      <div className="iw-index-images">{projects.map((project, index) => <div className="iw-index-image" data-active={current === index} inert={current !== index} aria-hidden={current !== index} key={project.name}>{preview(project, index)}</div>)}</div>
    </div>}
    {variant === 3 && <div className="iw-stack-layout">
      <div className="iw-stack-note"><span className="iw-kicker">Проект за проектом</span><span className="iw-stack-number" aria-hidden="true">0{current + 1}<i>/04</i></span><p key={current}>{projects[current].feature}</p><div className="iw-project-dots" role="group" aria-label="Выбрать проект">{projects.map((project, index) => <button key={project.name} aria-label={`Показать проект ${project.name}`} aria-pressed={current === index} onClick={() => onNavigate(index)} />)}</div></div>
      <div className="iw-stack-cards">{projects.map((project, index) => <div className="iw-stack-card" data-past={index < current} data-active={index === current} style={{ '--card-offset': Math.max(0, index - current), zIndex: projects.length - index } as CSSProperties} key={project.name} inert={current !== index} aria-hidden={current !== index}>{preview(project, index)}</div>)}</div>
    </div>}
  </div>;
}

export default function IndexWorks({ active, followingSections, leadingSections }: {
  active: boolean;
  onOpen: (kind: PanelKind) => void;
  followingSections?: string[]; leadingSections?: string[];
}) {
  const [masterIndex, setMasterIndex] = useState(0);
  const [layouts, setLayouts] = useState(() => workMasters.map(() => 0));
  const master = workMasters[masterIndex];
  const layout = layouts[masterIndex];
  const layoutKey = masterIndex * 10 + layout;
  // Keep the original four scroll compositions mapped to their existing styles.
  const variant = masterIndex === 1 ? layout + 1 : masterIndex === 0 ? 0 : 5;
  const [carouselTheme, setCarouselTheme] = useState<'dark' | 'light'>('dark');
  const [staticMode, setStaticMode] = useState(false);
  const [current, setCurrent] = useState(0);
  const [titleVisible, setTitleVisible] = useState(false);
  const [ambient, setAmbient] = useState<AmbientColor[]>(() => projects.map(project => project.ambient));
  const reel = useRef<HTMLDivElement>(null);
  const pendingAnchor = useRef<number | null>(null);
  const overview = masterIndex !== 1;
  const rememberAnchor = () => {
    const rect = reel.current?.getBoundingClientRect();
    if (rect && rect.top <= 0 && rect.bottom > 0) pendingAnchor.current = rect.top + scrollY;
  };
  const changeMaster = (direction: number) => {
    rememberAnchor();
    setCurrent(0);
    setMasterIndex(value => (value + direction + workMasters.length) % workMasters.length);
  };
  const changeLayout = (value: number) => {
    rememberAnchor();
    // Scroll compositions share the same stops, so compare them on the current case.
    if (masterIndex === 1 && pendingAnchor.current !== null) pendingAnchor.current = scrollY;
    setLayouts(previous => previous.map((selected, index) => index === masterIndex ? value : selected));
  };
  useLayoutEffect(() => {
    if (pendingAnchor.current === null) return;
    setPageScroll(pendingAnchor.current);
    pendingAnchor.current = null;
  }, [layoutKey]);
  useSectionWheelSteps(reel, active, followingSections, leadingSections, layoutKey);
  const composition = masterIndex === 1 && layout > 0 && !staticMode;
  const updateAmbient = (index: number, color: AmbientColor) => setAmbient(previous => previous.map((value, i) => i === index ? color : value));
  const navigate = (index: number) => {
    const step = reel.current?.querySelector<HTMLElement>(`.iw-step[data-index="${index}"]`);
    if (step) scrollPageTo(step, { duration: 1.3, easing: t => t * t * t * (t * (t * 6 - 15) + 10) });
  };
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce), (max-height: 700px)');
    const update = () => setStaticMode(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!active || !reel.current) return;
    // Observe the reading line, without a scroll handler or per-frame layout reads.
    const steps = reel.current.querySelectorAll<HTMLElement>('.iw-step');
    let observer: IntersectionObserver;
    let titleObserver: IntersectionObserver;
    const observeReadingLine = () => {
      observer?.disconnect();
      titleObserver?.disconnect();
      observer = new IntersectionObserver(entries => {
        const entering = entries.filter(entry => entry.isIntersecting);
        if (entering.length) setCurrent(Number((entering[entering.length - 1].target as HTMLElement).dataset.index));
      }, { rootMargin: `-${window.innerHeight * .49}px 0px -${window.innerHeight * .5}px 0px`, threshold: 0 });
      steps.forEach(step => observer.observe(step));
      titleObserver = new IntersectionObserver(entries => {
        setTitleVisible(entries[0]?.isIntersecting ?? false);
      }, { rootMargin: `0px 0px -${window.innerHeight * .5}px 0px`, threshold: 0 });
      if (reel.current) titleObserver.observe(reel.current);
    };
    const nearby = new IntersectionObserver(entries => {
      entries.forEach(entry => { (entry.target as HTMLElement).dataset.near = String(entry.isIntersecting); });
    }, { rootMargin: '100px' });
    steps.forEach(step => nearby.observe(step));
    observeReadingLine();
    window.addEventListener('resize', observeReadingLine);
    return () => {
      observer.disconnect(); nearby.disconnect(); titleObserver.disconnect();
      window.removeEventListener('resize', observeReadingLine);
      steps.forEach(step => { delete step.dataset.near; });
    };
  }, [active, layoutKey]);

  return <section id="work" className="ix-works" data-master={master.id} data-layout={layout} data-variant={variant} data-composition={composition} data-gallery={overview} data-theme={overview ? carouselTheme : undefined} aria-labelledby="works-heading" inert={!active} aria-hidden={!active}>
    <div className="iw-reel" ref={reel} data-gallery={overview} data-current={current + 1} data-introduced={active && titleVisible}>
      {!overview && <div className="iw-ambient" aria-hidden="true">
        {ambient.map((color, index) => <div key={projects[index].name} className="iw-ambient-light" data-active={titleVisible && current === index} style={{ backgroundImage: `radial-gradient(ellipse at 50% 42%, rgba(${color.join(',')}, .42) 0%, rgba(${color.join(',')}, .18) 42%, transparent 76%), radial-gradient(ellipse at 85% 70%, rgba(${color.join(',')}, .14), transparent 65%)` }} />)}
      </div>}
      <div className="iw-overlay">
        <div className="iw-top">
        <div className="iw-variants wd-controls" role="group" aria-label="Оформление кейсов">
          <button type="button" className="iw-variant-prev" onClick={() => changeMaster(-1)} aria-label="Предыдущий мастер-класс кейсов"><Arrow /></button>
          <div className="wd-selection">
            <div className="wd-master" aria-live="polite" aria-label={`Мастер-класс ${masterIndex + 1} из ${workMasters.length}`}><span>0{masterIndex + 1} / 0{workMasters.length}</span></div>
            <label className="wd-layout"><select aria-label="Композиция кейсов" value={layout} onChange={event => changeLayout(Number(event.target.value))}>
              {Array.from({length:master.layouts}, (_, index) => <option key={index} value={index}>0{index + 1}</option>)}
            </select></label>
          </div>
          <button type="button" onClick={() => changeMaster(1)} aria-label="Следующий мастер-класс кейсов"><Arrow /></button>
        </div>
        <header className="iw-reel-header">
          <span className="iw-kicker">CODEAM / PORTFOLIO</span>
          <h2 id="works-heading" tabIndex={-1} aria-label={worksTitle} data-revealed={titleVisible}>
            {worksTitle.split(' ').map((word, wordIndex) => <span className="iw-title-word" aria-hidden="true" key={word}>{[...word].map((letter, index) => <span className="iw-title-letter" key={index} style={{ transitionDelay: titleVisible ? `${(index + (wordIndex ? 10 : 0)) * 35}ms` : '0ms' }}>{letter}</span>)}{wordIndex === 0 && '\u00a0'}</span>)}
          </h2>
          {overview ? <div className="wc-theme-switch" role="group" aria-label="Цветовое оформление секции кейсов">
            <button type="button" aria-pressed={carouselTheme === 'light'} onClick={() => setCarouselTheme('light')}>Светлый</button>
            <button type="button" aria-pressed={carouselTheme === 'dark'} onClick={() => setCarouselTheme('dark')}>Тёмный</button>
          </div> : <span className="iw-scroll-hint">{variant === 2 ? 'Листайте проекты' : 'Листайте вниз'} <span aria-hidden="true">{variant === 2 ? '→' : '↓'}</span></span>}
        </header>
        </div>
        {!overview && <div className="iw-captions">
          {projects.map((project, index) => <div className="iw-caption" key={project.name} data-active={current === index} inert={current !== index} aria-hidden={current !== index}>
            <div className="iw-counter"><span>0{index + 1}</span><span>/ 0{projects.length}</span></div>
            <div className="iw-caption-title"><span className="iw-kicker">{project.kind} / {project.service}</span><h3>{project.name}</h3></div>
            <p className="iw-caption-description">{project.description}</p>
            <a className="iw-case-action" href={caseHref(project.slug)}>О проекте <Arrow diagonal /></a>
          </div>)}
        </div>}
      </div>
      {masterIndex === 0 && <WorksCarousel composition={layout} reducedMotion={staticMode} onAmbient={updateAmbient} onSelect={setCurrent} />}
      {masterIndex === 2 && <WorksCatalog composition={layout} />}
      {masterIndex === 3 && <WorksFold composition={layout} />}
      {masterIndex === 4 && <WorksAtlas composition={layout} />}
      {composition && <WorksComposition variant={variant - 1} current={current} onNavigate={navigate} onAmbient={updateAmbient} />}
      {!overview && <div className="iw-stream" inert={composition} aria-hidden={composition}>
        {projects.map((project, index) => <article className="iw-step" data-index={index} key={project.name} aria-label={project.name}>
          <div className="iw-step-frame">
          <div className="iw-art">
            <a className="iw-preview-trigger" href={caseHref(project.slug)} aria-label={`О проекте ${project.name}`}><ProjectPreview project={project} onAmbient={color => setAmbient(previous => previous.map((value, i) => i === index ? color : value))} /><span className="iw-art-open" aria-hidden="true"><Arrow diagonal /></span></a>
            <div className="iw-inline-info">
              <span className="iw-kicker">0{index + 1} / 0{projects.length} · {project.kind}</span>
              <h3>{project.name}</h3><p>{project.description}</p>
              <a className="iw-case-action" href={caseHref(project.slug)}>О проекте <Arrow diagonal /></a>
            </div>
          </div>
          </div>
        </article>)}
      </div>}
    </div>
  </section>;
}
