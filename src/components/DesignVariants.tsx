import { useState } from 'react';
import type { ReactNode } from 'react';
import { Arrow } from './Shared';
import './design-variants.css';

type Props = { id: string; label: string; names: string[]; active: boolean; className: string; singlePanel?: boolean; background?: ReactNode; children: (index: number, headingId: string) => ReactNode };

/** Keep neighbouring sections still while comparing designs. */
export default function DesignVariants({ id, label, names, active, className, singlePanel = false, background, children }: Props) {
  const [current, setCurrent] = useState(0);
  const change = (direction: number) => setCurrent(value => (value + direction + names.length) % names.length);
  return <section id={id} className={`dv-section ${className}`} data-variant={current} aria-labelledby={`${id}-heading-${current}`} inert={!active} aria-hidden={!active} onKeyDown={event => {
    if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); change(event.key === 'ArrowRight' ? 1 : -1); }
  }}>
    {background}
    <div className="dv-bar"><span className="dv-label"><b aria-hidden="true">//</b>{label}</span><span className="dv-version" aria-live="polite" aria-atomic="true"><span>0{current + 1} <i>/ 0{names.length}</i></span></span>
      <div className="dv-controls" role="group" aria-label={`Варианты: ${label}`}>
        <button className="dv-prev" onClick={() => change(-1)} aria-label={`Предыдущий вариант: ${label}`}><Arrow /></button>
        <button className="dv-next" onClick={() => change(1)} aria-label={`Следующий вариант: ${label}`}><Arrow /></button>
      </div>
    </div>
    <div className="dv-body">
      <div className="dv-deck">{singlePanel ? <div className="dv-panel" data-current="true">{children(current, `${id}-heading-${current}`)}</div> : names.map((name, index) => <div className="dv-panel" key={name} data-current={index === current} inert={index !== current} aria-hidden={index !== current}>{children(index, `${id}-heading-${index}`)}</div>)}</div>
    </div>
  </section>;
}
