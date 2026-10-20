import { Arrow } from './Shared';

/** Controlled locally by a section: comparing it never changes its neighbours. */
export default function SectionDesignControls({ label, names, value, onChange }: {
  label: string; names: string[]; value: number; onChange: (value: number) => void;
}) {
  return <div className="sp-design-controls" role="group" aria-label={`Варианты: ${label}`}>
    <button onClick={() => onChange((value + names.length - 1) % names.length)} aria-label={`Предыдущий вариант: ${label}`}><span className="sp-back"><Arrow /></span></button>
    <span aria-live="polite" aria-atomic="true">0{value + 1} / 0{names.length}</span>
    <button onClick={() => onChange((value + 1) % names.length)} aria-label={`Следующий вариант: ${label}`}><Arrow /></button>
  </div>;
}
