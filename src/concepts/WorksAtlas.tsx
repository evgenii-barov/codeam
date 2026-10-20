import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Arrow } from '../components/Shared';
import { projects, caseHref } from '../cases/projects';
import { portfolioReferences } from './portfolioReferences';
import './works-atlas.css';

// Coordinates belong to a stable canvas; the camera fits the available viewport.
const arrangements = [
  [[170, 350, -5], [405, 145, 4], [660, 400, -3], [900, 165, 5]],
  [[100, 100, 0], [366, 240, 0], [634, 380, 0], [900, 520, 0]],
  [[366, 100, 0], [900, 310, 0], [634, 520, 0], [100, 310, 0]],
  [[230, 160, -8], [650, 185, 6], [370, 455, 4], [840, 460, -5]],
];

export default function WorksAtlas({ composition }: { composition: number }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [viewport, setViewport] = useState({ width: 1000, height: 580 });
  const stage = useRef<HTMLDivElement>(null);
  const arrangement = arrangements[composition] ?? arrangements[0];
  useEffect(() => {
    if (!stage.current) return;
    const observer = new ResizeObserver(([entry]) => setViewport({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);
  const compact = viewport.width <= 700;
  const overviewScale = compact ? Math.min(viewport.width / 1240, viewport.height / 760)
    : Math.min(viewport.width / 1600, (viewport.height - 42) / 430, 1.1);
  const margin = 160 * overviewScale + 28;
  const verticalRange = Math.max(0, (viewport.height - 300 * overviewScale) / 2 - 28);
  const points = compact ? arrangement : arrangement.map(([x, y, angle]) => [
    (margin + (x - 100) / 800 * (viewport.width - margin * 2)) / overviewScale,
    (viewport.height / 2 + (y - 310) / 220 * verticalRange) / overviewScale,
    angle,
  ]);
  const scale = selected === null
    ? overviewScale
    : Math.min((viewport.width - 48) / 320, (viewport.height - 56) / 290, 1.75);
  const center = selected === null ? (compact ? [510, 310] : [viewport.width / 2 / overviewScale, viewport.height / 2 / overviewScale]) : points[selected];
  const project = selected === null ? null : projects[selected];

  return <div className="wat" data-focused={selected !== null} data-composition={composition} onKeyDown={event => {
    if (event.key === 'Escape' && selected !== null) { event.preventDefault(); setSelected(null); }
  }}>
    <div className="wat-toolbar">
      <p>{project ? 'Рассмотрите детали проекта' : 'Выберите проект, чтобы рассмотреть ближе'}</p>
      <button type="button" className="wat-reset" disabled={selected === null} onClick={() => setSelected(null)}>Все проекты <Arrow diagonal /></button>
    </div>
    <div className="wat-stage" ref={stage} aria-label="Обзор проектов">
      <div className="wat-world" style={{ transform: `translate3d(${viewport.width / 2 - center[0] * scale}px,${viewport.height / 2 - center[1] * scale}px,0) scale(${scale})` }}>
        {projects.map((item, index) => <button className="wat-project" type="button" key={item.slug}
          style={{ left: points[index][0], top: points[index][1], '--wat-angle': `${selected === index ? 0 : points[index][2]}deg` } as CSSProperties}
          data-selected={selected === index} data-muted={selected !== null && selected !== index}
          inert={selected !== null && selected !== index} aria-label={`Рассмотреть проект ${item.name}`} aria-pressed={selected === index}
          onClick={() => setSelected(index)}>
          <img src={portfolioReferences[index].src} alt={`Превью ${portfolioReferences[index].name} — примерка Awwwards`} width="1600" height="1200" loading="lazy" decoding="async" />
          <span className="wat-project-caption"><b>0{index + 1}</b><span>{item.name}</span><Arrow diagonal /></span>
        </button>)}
      </div>
      <span className="wat-reference">Примерка Awwwards</span>
    </div>
    <div className="wat-info" id="atlas-project-info" aria-live="polite" aria-atomic="true">
      {project ? <><div><span>{project.kind}</span><h3>{project.name}</h3></div><p>{project.feature}</p><a href={caseHref(project.slug)}>О проекте <Arrow diagonal /></a></>
        : <><div><span>Четыре проекта</span><h3>Разные задачи.<br />Общий подход.</h3></div><p>Сайты, каталоги и цифровые продукты — от первого знакомства до заявки.</p><span className="wat-total" aria-label="Всего четыре проекта">04</span></>}
    </div>
    <nav className="wat-index" aria-label="Выбрать проект для просмотра">
      {projects.map((item, index) => <button type="button" key={item.slug} aria-pressed={selected === index} onClick={() => setSelected(index)}><span>0{index + 1}</span><strong>{item.name}</strong><Arrow diagonal /></button>)}
    </nav>
  </div>;
}
