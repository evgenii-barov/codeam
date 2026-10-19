import { useEffect, useRef, useState } from 'react';
import { Arrow } from '../components/Shared';
import type { PanelKind } from '../components/Shared';
import { sampleCaseAmbient } from './caseAmbient';
import type { AmbientColor } from './caseAmbient';
import { useCaseWheelSteps } from './useCaseWheelSteps';
import './index-works.css';

type Project = {
  name: string; kind: string; service: string; visual: string;
  description: string; feature: string; scope: string[];
  ambient: AmbientColor;
  cover?: { src: string; alt: string; position?: string };
};
const projects: Project[] = [
  {
    name: 'Весна', kind: 'Интернет-магазин', service: 'Разработка', visual: 'shop',
    ambient: [112, 128, 185],
    description: 'Магазин с каталогом, карточками товаров и оформлением заказа.',
    feature: 'Корзина, онлайн-оплата и доставка СДЭК',
    scope: ['Каталог и карточки товаров', 'Корзина и оформление заказа', 'Онлайн-оплата и доставка СДЭК'],
  },
  {
    name: 'Diamond', kind: 'Корпоративный сайт', service: 'Редизайн', visual: 'corporate',
    ambient: [181, 112, 123],
    description: 'Обновлённая структура и подача с понятным путём к заявке.',
    feature: 'Единая система страниц и формы обратной связи',
    scope: ['Структура сайта', 'Единая система страниц', 'Формы обратной связи'],
  },
  {
    name: 'Спецтехника Щёкино', kind: 'Каталог техники', service: 'Разработка', visual: 'catalog',
    ambient: [117, 153, 125],
    description: 'Каталог с фильтрами по торговым маркам и характеристикам моделей.',
    feature: 'Фильтры, карточки моделей и заявка на технику',
    scope: ['Каталог и фильтры', 'Карточки моделей', 'Заявка на технику'],
  },
  {
    name: 'Сильвер', kind: 'Сайт бренда', service: 'Разработка', visual: 'brand',
    ambient: [149, 158, 180],
    description: 'Сайт с акцентом на продукте и материалах бренда.',
    feature: 'Адаптивные страницы и материалы о продукте',
    scope: ['Подача продукта', 'Адаптивные страницы', 'Материалы бренда'],
  },
];
const worksTitle = 'Избранные работы';

function ProjectPreview({ project, onAmbient }: { project: Project; onAmbient?: (color: AmbientColor) => void }) {
  const [failed, setFailed] = useState(false);
  if (project.cover && !failed) return <div className="iw-preview iw-preview-image">
    <img src={project.cover.src} alt={project.cover.alt} loading="lazy" decoding="async" style={{ objectPosition: project.cover.position }} onError={() => setFailed(true)} onLoad={event => {
      if (!onAmbient) return;
      const color = sampleCaseAmbient(event.currentTarget);
      if (color) onAmbient(color);
    }} />
  </div>;
  return <div className="iw-preview" data-visual={project.visual} aria-hidden="true">
    <div className="iw-browser"><span /><span /><span /><i /></div>
    <div className="iw-preview-layout">
      <div className="iw-preview-heading"><span>{project.name}</span><i /><i /></div>
      <div className="iw-preview-sidebar"><i /><i /><i /><i /><i /></div>
      <div className="iw-preview-tiles">{[0, 1, 2, 3, 4, 5].map(n => <div key={n}><span /><i /><i /></div>)}</div>
    </div>
    <span className="iw-preview-caption">Структура сайта</span>
  </div>;
}

function ProjectDialog({ project, onClose, onOpen }: { project: Project; onClose: () => void; onOpen: (kind: PanelKind) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    node?.showModal();
    return () => { node?.close(); document.body.style.overflow = overflow; };
  }, []);
  return <dialog ref={dialog} className="iw-dialog" aria-labelledby="iw-project-title" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="iw-dialog-inner">
      <button className="iw-dialog-close" onClick={onClose} aria-label="Закрыть проект">×</button>
      <span className="iw-kicker">{project.kind} / {project.service}</span>
      <h2 id="iw-project-title">{project.name}</h2>
      <ProjectPreview project={project} />
      <p>{project.description}</p>
      <ul>{project.scope.map(item => <li key={item}>{item}</li>)}</ul>
      <button className="iw-discuss" onClick={() => { onClose(); onOpen('project'); }}>Обсудить похожую задачу <Arrow diagonal /></button>
    </div>
  </dialog>;
}

export default function IndexWorks({ active, onOpen }: {
  active: boolean;
  onOpen: (kind: PanelKind) => void;
}) {
  const [selected, setSelected] = useState<Project | null>(null);
  const [current, setCurrent] = useState(0);
  const [titleVisible, setTitleVisible] = useState(false);
  const [ambient, setAmbient] = useState<AmbientColor[]>(() => projects.map(project => project.ambient));
  const reel = useRef<HTMLDivElement>(null);
  useCaseWheelSteps(reel, active);

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
  }, [active]);

  return <section id="work" className="ix-works" aria-labelledby="works-heading" inert={!active} aria-hidden={!active}>
    <div className="iw-reel" ref={reel} data-current={current + 1} data-introduced={active && titleVisible}>
      <div className="iw-ambient" aria-hidden="true">
        {ambient.map((color, index) => <div key={projects[index].name} className="iw-ambient-light" data-active={titleVisible && current === index} style={{ backgroundImage: `radial-gradient(ellipse at 50% 42%, rgba(${color.join(',')}, .42) 0%, rgba(${color.join(',')}, .18) 42%, transparent 76%), radial-gradient(ellipse at 85% 70%, rgba(${color.join(',')}, .14), transparent 65%)` }} />)}
      </div>
      <div className="iw-overlay">
        <header className="iw-reel-header">
          <span className="iw-kicker">CODEAM / PORTFOLIO</span>
          <h2 id="works-heading" tabIndex={-1} aria-label={worksTitle} data-revealed={titleVisible}>
            {worksTitle.split(' ').map((word, wordIndex) => <span className="iw-title-word" aria-hidden="true" key={word}>{[...word].map((letter, index) => <span className="iw-title-letter" key={index} style={{ transitionDelay: titleVisible ? `${(index + (wordIndex ? 10 : 0)) * 35}ms` : '0ms' }}>{letter}</span>)}{wordIndex === 0 && '\u00a0'}</span>)}
          </h2>
          <span className="iw-scroll-hint">Листайте вниз <span aria-hidden="true">↓</span></span>
        </header>
        <div className="iw-captions">
          {projects.map((project, index) => <div className="iw-caption" key={project.name} data-active={current === index} inert={current !== index} aria-hidden={current !== index}>
            <div className="iw-counter"><span>0{index + 1}</span><span>/ 0{projects.length}</span></div>
            <div className="iw-caption-title"><span className="iw-kicker">{project.kind} / {project.service}</span><h3>{project.name}</h3></div>
            <p className="iw-caption-description">{project.description}</p>
            <button className="iw-case-action" onClick={() => setSelected(project)}>О проекте <Arrow diagonal /></button>
          </div>)}
        </div>
      </div>
      <div className="iw-stream">
        {projects.map((project, index) => <article className="iw-step" data-index={index} key={project.name} aria-label={project.name}>
          <div className="iw-step-frame">
          <div className="iw-art">
            <button className="iw-preview-trigger" onClick={() => setSelected(project)} aria-label={`О проекте ${project.name}`}><ProjectPreview project={project} onAmbient={color => setAmbient(previous => previous.map((value, i) => i === index ? color : value))} /><span className="iw-art-open" aria-hidden="true"><Arrow diagonal /></span></button>
            <div className="iw-inline-info">
              <span className="iw-kicker">0{index + 1} / 0{projects.length} · {project.kind}</span>
              <h3>{project.name}</h3><p>{project.description}</p>
              <button className="iw-case-action" onClick={() => setSelected(project)}>О проекте <Arrow diagonal /></button>
            </div>
          </div>
          </div>
        </article>)}
      </div>
    </div>
    {selected && <ProjectDialog project={selected} onClose={() => setSelected(null)} onOpen={onOpen} />}
  </section>;
}
