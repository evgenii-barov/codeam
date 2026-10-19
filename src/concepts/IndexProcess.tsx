import { Arrow } from '../components/Shared';
import type { PanelKind } from '../components/Shared';
import DesignVariants from '../components/DesignVariants';
import './process-variants.css';

const steps = [
  { title: 'Разбираем задачу', text: 'Смотрим сайт, цели и текущие проблемы.', result: 'Список точек роста' },
  { title: 'Согласуем решение', text: 'Фиксируем объём, сроки и приоритеты.', result: 'Понятный план' },
  { title: 'Проектируем и делаем', text: 'Дизайн и разработка в одной системе.', result: 'Готовые страницы' },
  { title: 'Проверяем и запускаем', text: 'Тестируем сценарии и запускаем проект.', result: 'Рабочий релиз' },
  { title: 'Развиваем', text: 'Дорабатываем, продвигаем и отслеживаем метрики.', result: 'Постоянное развитие' },
];
const names = ['Карта этапов', 'Маршрут', 'Журнал проекта'];

export default function IndexProcess({ active, onOpen }: { active: boolean; onOpen: (kind: PanelKind) => void }) {
  const start = () => onOpen('audit');
  return <DesignVariants id="process" label="Как мы работаем" names={names} active={active} className="pr-section">{(variant, headingId) => <div className={`pr-layout pr-layout-${variant}`}>
    <div className="pr-intro"><h2 id={headingId} tabIndex={-1}>Пять шагов <br />от разбора <br />до роста заявок.</h2><p>Прозрачный процесс: на каждом шаге понятно, что происходит и какой получаем результат.</p>{variant === 0 && <button className="dv-cta" onClick={start}>Начать с разбора <Arrow /></button>}</div>
    <ol className="pr-steps">{steps.map((step, index) => <li key={step.title}>
      <span className="pr-number">0{index + 1}</span><span className="pr-result">{step.result}</span>
      <div className="pr-step-copy"><h3>{step.title}</h3><p>{step.text}</p></div>
    </li>)}</ol>
    {variant !== 0 && <div className="pr-bottom"><p>Начнём с вашего сайта.<br /><span>Первичный разбор — бесплатно.</span></p><button className="dv-cta" onClick={start}>Получить разбор сайта <Arrow /></button></div>}
  </div>}</DesignVariants>;
}
