import type { CSSProperties } from 'react';
import { Arrow } from '../components/Shared';
import { caseHref, projects } from '../cases/projects';
import { portfolioReferences } from './portfolioReferences';
import './works-catalog.css';

/** A browsable overview: every project remains visible without advancing a slide. */
export default function WorksCatalog({ composition }: { composition: number }) {
  return <div className="wcat" data-composition={composition} aria-label="Каталог проектов CODEAM">
    {projects.map((project, index) => {
      const reference = portfolioReferences[index];
      return <a className="wcat-entry" href={caseHref(project.slug)} key={project.slug} aria-label={`О проекте ${project.name}`}>
        <div className="wcat-visual">
          <div className="wcat-media" style={{ '--wcat-media-background': reference.background } as CSSProperties}>
            <img src={reference.src} alt={`Превью сайта ${reference.name} с Awwwards — изображение для примерки`} width="800" height="600" loading="lazy" decoding="async" />
          </div>
          <span className="wcat-reference">Примерка Awwwards</span>
        </div>
        <div className="wcat-copy">
          <h3>{project.name}</h3>
          <span className="wcat-kind">{project.kind}</span>
          <p>{project.feature}</p>
          <span className="wcat-action">О проекте <Arrow diagonal /></span>
        </div>
      </a>;
    })}
  </div>;
}
