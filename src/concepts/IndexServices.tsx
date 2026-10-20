import { useState } from 'react';
import { Arrow } from '../components/Shared';
import type { PanelKind } from '../components/Shared';
import DesignVariants from '../components/DesignVariants';
import './services-variants.css';
import { services, serviceHref } from '../services/services';

type Props = { onOpen: (kind: PanelKind) => void; active: boolean };
const directions = [
  { title: 'Сайты и продукты', verb: 'Запустить.', note: 'Нужен новый сайт с нуля или пора обновить действующий.', description: 'Проектируем структуру, создаём дизайн и доводим сайт или веб-приложение до запуска.', capabilities: ['Сайты и интернет-магазины', 'Веб-приложения', 'Доработка действующих проектов'] },
  { title: 'Автоматизация процессов', verb: 'Упростить.', note: 'Рутина съедает время, данные теряются между сервисами.', description: 'Связываем сервисы и автоматизируем повторяющиеся задачи, чтобы команда занималась главным.', capabilities: ['Telegram-боты', 'Интеграции с CRM', 'Рабочие процессы и сценарии'] },
  { title: 'Продвижение и развитие', verb: 'Развивать.', note: 'Трафик есть, а обращений и роста — нет.', description: 'Работаем с рекламой, сайтом и аналитикой: находим точки роста и проверяем изменения по данным.', capabilities: ['Реклама в Яндексе', 'Поисковое продвижение', 'Аналитика и развитие сайта'] },
];
const names = ['Тёмный список', 'Три направления', 'От задачи'];
const lead = 'Подключимся на нужном этапе: спроектируем, разработаем, поможем с продвижением и развитием.';

export default function IndexServices({ onOpen, active }: Props) {
  const [expanded, setExpanded] = useState<number | null>(0);
  const discuss = () => onOpen('project');
  return <DesignVariants id="services" label="Услуги" names={names} active={active} className="sv-section">{(variant, headingId) => {
    if (variant === 0) return <div className="sv-list">
      <div className="dv-intro"><h2 id={headingId} tabIndex={-1}>Услуги</h2><p>{lead}</p></div>
      <div className="sv-accordion">{directions.map((direction, index) => {
        const open = expanded === index;
        return <article className="sv-row" data-open={open} key={direction.title}>
          <h3><button id={`sv-trigger-${index}`} aria-expanded={open} aria-controls={`sv-detail-${index}`} onClick={() => setExpanded(open ? null : index)}><span className="sv-number">0{index + 1}</span><span>{direction.title}</span><span className="sv-toggle" aria-hidden="true">{open ? '−' : '+'}</span></button></h3>
          <div className="sv-detail" id={`sv-detail-${index}`} role="region" aria-labelledby={`sv-trigger-${index}`} hidden={!open}><p>{direction.description}</p><ul>{direction.capabilities.map(item => <li key={item}>{item}</li>)}</ul><a className="sv-service-link" href={serviceHref(services[index].slug)}>Подробнее об услуге <Arrow diagonal /></a></div>
        </article>;
      })}</div>
      <div className="sv-bottom"><span>Одна задача или проект целиком.</span><button className="sv-text-action" onClick={discuss}>Обсудить задачу <Arrow diagonal /></button></div>
    </div>;
    if (variant === 1) return <div className="sv-columns">
      <div className="dv-intro"><h2 id={headingId} tabIndex={-1}>Чем занимается<br />студия.</h2><p>{lead}</p></div>
      <div className="sv-column-grid">{directions.map((direction, index) => <article key={direction.title}>
        <span className="sv-large-number">0{index + 1}</span><h3>{direction.title}</h3><p>{direction.note}</p>
        <ul>{direction.capabilities.map(item => <li key={item}>{item}</li>)}</ul>
        <a className="sv-service-link" href={serviceHref(services[index].slug)}>Подробнее об услуге <Arrow diagonal /></a>
      </article>)}</div>
      <div className="sv-column-note"><span>От первого решения<br />до работающей системы.</span><p>Можно начать с разбора сайта.<br />Найдём, что стоит улучшить в первую очередь.</p><button className="dv-cta" onClick={() => onOpen('audit')}>Получить разбор <Arrow /></button></div>
    </div>;
    return <div className="sv-tasks">
      <div className="sv-task-intro"><h2 id={headingId} tabIndex={-1}>Что сейчас<br />нужно<br /><span>бизнесу?</span></h2><p>{lead}</p><button className="dv-cta" onClick={() => onOpen('audit')}>Начать с разбора <Arrow /></button></div>
      <div className="sv-task-grid">{directions.map((direction, index) => <article key={direction.title}>
        <span className="sv-number">0{index + 1} / {direction.title}</span><h3>{direction.verb}</h3><p>{direction.note}</p>
        <ul>{direction.capabilities.map(item => <li key={item}>{item}</li>)}</ul><a className="sv-task-link" href={serviceHref(services[index].slug)} aria-label={`Подробнее: ${direction.title}`}><Arrow diagonal /></a>
      </article>)}</div>
    </div>;
  }}</DesignVariants>;
}
