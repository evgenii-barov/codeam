import { useId, useState } from 'react';
import type { CSSProperties } from 'react';
import { Arrow } from '../components/Shared';
import { caseHref, projects } from '../cases/projects';
import { portfolioReferences } from './portfolioReferences';
import './works-fold.css';

function FoldMark({ expanded }: { expanded: boolean }) {
  return <svg className="wfold-mark" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 12h16" stroke="currentColor" strokeWidth="1.5" />
    <path className="wfold-mark-stem" data-open={expanded} d="M12 4v16" stroke="currentColor" strokeWidth="1.5" />
  </svg>;
}

/** Space is given to the selected project while the other project names remain in view. */
export default function WorksFold({ composition }: { composition: number }) {
  const instance = useId();
  const [selected, setSelected] = useState(0);
  const [pairSelected, setPairSelected] = useState([0, 2]);

  function selectProject(index: number) {
    setSelected(index);
    const pair = Math.floor(index / 2);
    setPairSelected(previous => previous.map((value, position) => position === pair ? index : value));
  }

  function heading(index: number, expanded: boolean, onSelect: () => void) {
    return <button className="wfold-heading" type="button" id={`${instance}-heading-${index}`}
      aria-expanded={expanded} aria-controls={`${instance}-panel-${index}`} onClick={onSelect}>
      <span className="wfold-number">{String(index + 1).padStart(2, '0')}</span>
      <span className="wfold-name">{projects[index].name}</span>
      <FoldMark expanded={expanded} />
    </button>;
  }

  function body(index: number, expanded: boolean) {
    const project = projects[index];
    const reference = portfolioReferences[index];
    return <div className="wfold-body" id={`${instance}-panel-${index}`} role="region"
      aria-labelledby={`${instance}-heading-${index}`} aria-hidden={!expanded} inert={!expanded}
      data-open={expanded}>
      <div className="wfold-art">
        <div className="wfold-image" style={{ '--wfold-image-background': reference.background } as CSSProperties}>
          <img src={reference.src} alt={`Превью сайта ${reference.name} с Awwwards — изображение для примерки`}
            width="800" height="600" loading="eager" decoding="async" />
        </div>
        <span className="wfold-reference">Примерка Awwwards</span>
      </div>
      <div className="wfold-copy">
        <span className="wfold-kind">{project.kind}</span>
        <p>{project.feature}</p>
        <a href={caseHref(project.slug)} aria-label={`О проекте ${project.name}`}>О проекте <Arrow diagonal /></a>
      </div>
    </div>;
  }

  function panel(index: number, expanded: boolean, onSelect: () => void) {
    return <article className="wfold-panel" data-open={expanded} key={projects[index].slug}>
      {heading(index, expanded, onSelect)}
      {body(index, expanded)}
    </article>;
  }

  const tracks = projects.map((_, index) => index === selected ? 'minmax(0,4fr)' : 'minmax(0,1fr)').join(' ');
  return <div className="wfold" data-composition={composition}>
    {composition === 2 ? <div className="wfold-center">
      <div className="wfold-center-nav">{[0, 1].map(index => <div key={index} data-open={selected === index}>
        {heading(index, selected === index, () => selectProject(index))}
      </div>)}</div>
      <div className="wfold-stage">{projects.map((project, index) => <div key={project.slug} className="wfold-stage-panel" data-open={selected === index}>
        {body(index, selected === index)}
      </div>)}</div>
      <div className="wfold-center-nav">{[2, 3].map(index => <div key={index} data-open={selected === index}>
        {heading(index, selected === index, () => selectProject(index))}
      </div>)}</div>
    </div> : composition === 3 ? <div className="wfold-pairs">
      {[0, 1].map(pair => <div className="wfold-pair" key={pair}
        style={{ '--wfold-tracks': pairSelected[pair] === pair * 2 ? 'minmax(0,4fr) minmax(0,1fr)' : 'minmax(0,1fr) minmax(0,4fr)' } as CSSProperties}>
        {[pair * 2, pair * 2 + 1].map(index => panel(index, pairSelected[pair] === index, () => selectProject(index)))}
      </div>)}
    </div> : <div className="wfold-panels" style={{ '--wfold-tracks': tracks } as CSSProperties}>
      {projects.map((_, index) => panel(index, selected === index, () => selectProject(index)))}
    </div>}
  </div>;
}
