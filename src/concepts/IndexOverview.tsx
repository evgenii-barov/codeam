import { useState } from 'react';
import { Arrow } from '../components/Shared';
import type { PanelKind } from '../components/Shared';
import './index-services.css';
import './overview-variants.css';

type IndexOverviewProps = {
  active: boolean;
  onHome: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  onWorks: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  onOpen: (kind: PanelKind) => void;
};

const directions = [
  ['Веб-сайты', 'Современные сайты для реальных результатов.'],
  ['Реклама в Яндексе', 'Больше обращений, больше продаж.'],
  ['Приложения', 'Веб-продукты любого масштаба.'],
  ['Автоматизация', 'Боты, интеграции и процессы.'],
];

// Names supplied in the client's reference; no invented logos or results.
const clients = ['Весна', 'Diamond', 'Щёкино', 'Сильвер', 'READY-FLY', 'SYNAPSE'];
const variantCount = 4;
const lead = 'Создаём сайты и веб-приложения, дорабатываем действующие проекты и настраиваем продвижение. Начнём с первичного разбора вашего сайта.';

function Trust() {
  return <div className="io-trust">
    <h3><span aria-hidden="true">//</span> Нам доверяют</h3>
    <ul aria-label="Клиенты CODEAM">{clients.map(client => <li key={client}>{client}</li>)}</ul>
  </div>;
}

function Directions() {
  return <ul className="io-directions" aria-label="Чем занимаемся">
    {directions.map(([title, description], index) => <li key={title}>
      <span className="io-number">0{index + 1}</span><h3>{title}</h3><p>{description}</p>
    </li>)}
  </ul>;
}

function Scenarios({ onOpen }: Pick<IndexOverviewProps, 'onOpen'>) {
  return <div className="io-scenarios">
    <div><h3>01 Есть сайт</h3><p>Разберём и усилим действующий проект.</p></div>
    <div><h3>02 Сайта ещё нет</h3><p>Спроектируем и сделаем <button onClick={() => onOpen('project')}>новый проект с нуля.</button></p></div>
  </div>;
}

function Start({ onOpen, onWorks }: Pick<IndexOverviewProps, 'onOpen' | 'onWorks'>) {
  return <div className="ov-start">
    <div className="io-actions">
      <button className="io-audit" onClick={() => onOpen('audit')}>Получить разбор сайта <Arrow /></button>
      <a href="#work" onClick={onWorks}>Смотреть работы <Arrow /></a>
    </div>
    <p className="io-note">Бесплатно. Краткие рекомендации по вашему сайту.</p>
  </div>;
}

export default function IndexOverview({ active, onHome, onWorks, onOpen }: IndexOverviewProps) {
  const [variant, setVariant] = useState(1);
  const change = (direction: number) => setVariant(current => (current + direction + variantCount) % variantCount);
  const headingId = (index: number) => variant === index ? 'studio-heading' : `studio-heading-${index}`;
  return <section id="studio" className="ix-overview ov-comparison" aria-labelledby="studio-heading" inert={!active} aria-hidden={!active} onKeyDown={event => {
    if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); change(event.key === 'ArrowRight' ? 1 : -1); }
  }}>
    <div className="is-inner">
      <header className="is-brand-bar">
        <a href="#codeam-top" className="is-brand" onClick={onHome} aria-label="CODEAM — к первому экрану">
          <img src={import.meta.env.BASE_URL + 'assets/brand-symbol.svg'} className="is-brand-symbol" alt="" />
          <span className="is-brand-wordmark"><img src={import.meta.env.BASE_URL + 'assets/wordmark.svg'} alt="" /></span>
        </a>
        <div className="ov-version" aria-live="polite" aria-atomic="true"><span>0{variant + 1} <i>/ 0{variantCount}</i></span></div>
      </header>

      <div className="is-body">
        <div className="ov-controls" role="group" aria-label="Варианты секции">
          <button className="ov-prev" aria-label="Предыдущий вариант секции" onClick={() => change(-1)}><Arrow /></button>
          <button className="ov-next" aria-label="Следующий вариант секции" onClick={() => change(1)}><Arrow /></button>
        </div>
        <div className="ov-deck">
        <div className="ov-panel ov-original" data-current={variant === 0} inert={variant !== 0} aria-hidden={variant !== 0}>
        <div className="is-introduction">
          <h2 id={headingId(0)} className="is-heading" tabIndex={-1}>Сайты, сервисы<br />и продвижение.</h2>
          <p className="is-lead">{lead}</p>
        </div>

        <div className="io-start">
          <Start onOpen={onOpen} onWorks={onWorks} />
          <Scenarios onOpen={onOpen} />
        </div>
        <Directions /><Trust />
        </div>
        <div className="ov-panel ov-editorial" data-current={variant === 1} inert={variant !== 1} aria-hidden={variant !== 1}>
          <div className="ov-editorial-grid">
            <div className="ov-editorial-copy">
              <h2 id={headingId(1)} tabIndex={-1}>Сайты.<br />Сервисы.<br /><span>Продвижение.</span></h2>
              <p className="ov-lead">{lead}</p>
              <Start onOpen={onOpen} onWorks={onWorks} />
            </div>
            <div className="ov-editorial-index"><span className="ov-kicker">Что мы делаем</span><Directions /></div>
          </div>
          <Scenarios onOpen={onOpen} /><Trust />
        </div>
        <div className="ov-panel ov-manifesto" data-current={variant === 2} inert={variant !== 2} aria-hidden={variant !== 2}>
          <div className="ov-manifesto-copy">
            <h2 id={headingId(2)} tabIndex={-1}>Сайты, сервисы<br />и <span>продвижение.</span></h2>
            <p className="ov-lead">{lead}</p>
            <Start onOpen={onOpen} onWorks={onWorks} />
          </div>
          <Directions /><Scenarios onOpen={onOpen} /><Trust />
        </div>
        <div className="ov-panel ov-tasks" data-current={variant === 3} inert={variant !== 3} aria-hidden={variant !== 3}>
          <div className="ov-tasks-intro">
            <h2 id={headingId(3)} tabIndex={-1}>Ваш следующий<br /><span>шаг в digital.</span></h2>
            <p className="ov-lead">{lead}</p>
          </div>
          <div className="ov-task-choices">
            <div className="ov-task-existing">
              <span className="ov-kicker">01 / Уже есть сайт</span>
              <h3>Усилить.</h3>
              <p>Разберём и усилим действующий проект.</p>
              <button onClick={() => onOpen('audit')}>Получить разбор сайта <Arrow diagonal /></button>
              <small>Бесплатно. Краткие рекомендации по вашему сайту.</small>
            </div>
            <div className="ov-task-new">
              <span className="ov-kicker">02 / Сайта ещё нет</span>
              <h3>Создать.</h3>
              <p>Спроектируем и сделаем новый проект с нуля.</p>
              <button onClick={() => onOpen('project')}>Обсудить проект <Arrow diagonal /></button>
              <a href="#work" onClick={onWorks}>Смотреть работы <Arrow /></a>
            </div>
          </div>
          <Directions /><Trust />
        </div>
        </div>
      </div>
    </div>
  </section>;
}


