import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Arrow } from '../components/Shared';
import ProjectPreview from '../cases/ProjectPreview';
import { caseHref, projects } from '../cases/projects';
import type { AmbientColor } from './caseAmbient';
import { portfolioReferences } from './portfolioReferences';
import './works-carousel.css';
import './carousel-compositions.css';

const count = projects.length;

export default function WorksCarousel({ reducedMotion, onAmbient, onSelect, composition = 0 }: {
  reducedMotion: boolean;
  onAmbient: (index: number, color: AmbientColor) => void;
  onSelect: (index: number) => void;
  composition?: number;
}) {
  const [cursor, setCursor] = useState(count);
  const [moving, setMoving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const frame = useRef(0);
  const current = cursor % count;
  useEffect(() => onSelect(current), [current, onSelect]);
  useLayoutEffect(() => {
    // A composition can change during a slide: settle its equivalent middle copy.
    setMoving(false);
    setResetting(true);
    setCursor(value => count + value % count);
  }, [composition]);
  useEffect(() => {
    if (!resetting) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = requestAnimationFrame(() => setResetting(false));
    });
    return () => cancelAnimationFrame(frame.current);
  }, [resetting]);
  useEffect(() => {
    const reset = () => {
      setMoving(false);
      setResetting(true);
      setCursor(value => count + value % count);
    };
    if (reducedMotion) reset();
    window.addEventListener('resize', reset);
    return () => window.removeEventListener('resize', reset);
  }, [reducedMotion]);
  const change = (direction: number) => {
    if (moving || resetting) return;
    setMoving(!reducedMotion);
    setCursor(value => reducedMotion ? count + (value + direction + count) % count : value + direction);
  };
  const finish = () => {
    if (cursor < count || cursor >= count * 2) {
      setResetting(true);
      setCursor(count + current);
    }
    setMoving(false);
  };
  return <div className="wc-carousel" data-composition={composition} aria-roledescription="карусель" aria-label="Проекты CODEAM" onKeyDown={event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      change(event.key === 'ArrowLeft' ? -1 : 1);
    }
  }}>
    <div className="wc-intro"><p>От первого знакомства до оформленного заказа.</p></div>
    <div className="wc-window">
      <div className="wc-rail" data-resetting={resetting || reducedMotion} style={{ '--cursor': cursor } as CSSProperties} onTransitionEnd={event => {
        if (event.target === event.currentTarget && event.propertyName === 'transform') finish();
      }}>
        {Array.from({ length: count * 3 }, (_, slot) => {
          const index = slot % count, project = projects[index];
          const reference = portfolioReferences[index];
          const selected = slot === cursor;
          // Only one copy of each nearby project participates in keyboard navigation.
          const accessible = composition === 2 ? slot >= cursor && slot < cursor + count : slot >= cursor - 1 && slot <= cursor + 2;
          const distance = Math.min(3, Math.abs(slot - cursor));
          return <div className="wc-slot" key={slot} data-distance={distance} data-direction={slot < cursor ? 'before' : slot > cursor ? 'after' : 'current'} data-outside={composition === 2 ? slot < cursor || slot >= cursor + count : Math.abs(slot - cursor) > 2} style={{ '--depth': distance, '--layer': 30 - distance * 10 } as CSSProperties}>
            <a className="wc-card" href={caseHref(project.slug)} data-selected={selected} inert={!accessible} aria-hidden={!accessible} aria-label={`О проекте ${project.name}`}>
              <div className="wc-card-top"><span>0{index + 1} / ПРИМЕРКА AWWWARDS</span><Arrow diagonal /></div>
              <div className="wc-art" style={{ '--reference-background': reference.background } as CSSProperties}><ProjectPreview project={{ ...project, cover: { src: reference.src, alt: `Превью сайта ${reference.name} с Awwwards — изображение для примерки` } }} onAmbient={color => onAmbient(index, color)} /></div>
              <div className="wc-card-copy"><span>{project.kind}</span><h3>{project.name}</h3><p>{project.feature}</p></div>
            </a>
          </div>;
        })}
      </div>
    </div>
    <div className="wc-controls" role="group" aria-label="Прокрутка карусели проектов">
      <button onClick={() => change(-1)} disabled={moving || resetting} aria-label="Карусель: предыдущий проект"><Arrow /></button>
      <span className="wc-counter" aria-live="polite" aria-atomic="true"><b>0{current + 1}</b> / 0{count}<span className="wc-sr-only"> — {projects[current].name}</span></span>
      <button onClick={() => change(1)} disabled={moving || resetting} aria-label="Карусель: следующий проект"><Arrow /></button>
    </div>
  </div>;
}
