import { useState } from 'react';
import { sampleCaseAmbient } from '../concepts/caseAmbient';
import type { AmbientColor } from '../concepts/caseAmbient';
import type { Project } from './projects';
import '../concepts/index-works.css';

export default function ProjectPreview({ project, onAmbient }: { project: Project; onAmbient?: (color: AmbientColor) => void }) {
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
