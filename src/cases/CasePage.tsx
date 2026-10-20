import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import DesignVariants from '../components/DesignVariants';
import { Arrow } from '../components/Shared';
import IndexContact from '../concepts/IndexContact';
import { useSectionWheelSteps } from '../concepts/useSectionWheelSteps';
import { setPageScroll } from '../scroll/pageScroll';
import { serviceHref } from '../services/services';
import type { AmbientColor } from '../concepts/caseAmbient';
import ProjectPreview from './ProjectPreview';
import { projects, caseHref } from './projects';
import type { Project } from './projects';
import { caseDetails } from './caseDetails';
import '../services/service-page.css';
import './case-page.css';

const stops = ['#case-intro', '#case-cover', '#case-task', '#case-solution', '#case-results', '#case-review', '#case-next', '#contact'];

export default function CasePage({ project }: { project: Project }) {
  const flow = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [ambient, setAmbient] = useState<AmbientColor>(project.ambient);
  const details = caseDetails[project.slug];
  const index = projects.indexOf(project);
  const next = projects[(index + 1) % projects.length];
  const home = import.meta.env.BASE_URL;
  useSectionWheelSteps(flow, true, stops);

  useEffect(() => {
    const oldTitle = document.title;
    document.title = `${project.name} — кейс CODEAM`;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    media.addEventListener('change', update);
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      const node = entry.target as HTMLElement;
      node.dataset.inview = String(entry.isIntersecting);
      if (entry.isIntersecting) node.dataset.visible = 'true';
    }), { threshold: .08 });
    flow.current?.querySelectorAll('.cp-section').forEach(node => observer.observe(node));
    let frame = 0, disposed = false;
    void document.fonts.ready.then(() => {
      if (disposed) return;
      frame = requestAnimationFrame(() => {
        const target = location.hash ? document.getElementById(location.hash.slice(1)) : null;
        setPageScroll(target ? target.getBoundingClientRect().top + scrollY : 0);
      });
    });
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect();
      document.title = oldTitle; media.removeEventListener('change', update);
    };
  }, [project]);

  return <main className="service-page case-page" style={{ '--case-color': ambient.join(',') } as CSSProperties}>
    <div ref={flow}>
      <DesignVariants id="case-intro" label="О проекте" names={['Редакция', 'Типографика', 'Паспорт проекта']} active className="cp-section cp-intro" singlePanel background={
        <header className="sp-header cp-header">
          <a className="sp-brand" href={home} aria-label="CODEAM — главная"><img src={home + 'assets/brand-symbol.svg'} alt="" /><img src={home + 'assets/wordmark.svg'} alt="CODEAM" /></a>
          <nav aria-label="Навигация кейса"><a href={home + '#work'}>Все работы</a><a href="#case-solution">Решение</a><a href="#case-results">Результат</a></nav>
          <a href="#contact" className="sp-header-contact">Обсудить задачу <Arrow diagonal /></a>
        </header>
      }>{(variant, headingId) => <div className={`cp-content cp-intro-layout cp-intro-${variant}`} key={variant}>
        <nav className="sp-breadcrumbs" aria-label="Хлебные крошки"><a href={home}>Главная</a><span>/</span><a href={home + '#work'}>Работы</a><span>/</span><span aria-current="page">{project.name}</span></nav>
        <div className="cp-title"><span className="sp-kicker">{project.kind} / {project.service}</span><h1 id={headingId}>{project.name}</h1><p>{project.description}</p></div>
        <dl className="cp-facts"><div><dt>Клиент</dt><dd>{project.name}</dd></div><div><dt>Формат</dt><dd>{project.kind}</dd></div><div><dt>Работа</dt><dd>{project.service}</dd></div><div><dt>Услуга</dt><dd><a href={serviceHref('websites')}>Сайты и продукты <Arrow diagonal /></a></dd></div></dl>
        <div className="cp-intro-bottom"><span>0{index + 1} / 0{projects.length}<i>CODEAM / SELECTED WORK</i></span><a href="#case-cover">Смотреть проект <Arrow /></a></div>
      </div>}</DesignVariants>

      <DesignVariants id="case-cover" label="Превью проекта" names={['На сцене', 'Экран и детали', 'Крупный план']} active className="cp-section cp-cover" singlePanel>{(variant, headingId) => <div className={`cp-content cp-cover-layout cp-cover-${variant}`} key={variant}>
        <div className="cp-light" aria-hidden="true" />
        <div className="cp-cover-copy"><span className="sp-kicker">{project.kind}</span><h2 id={headingId}>{variant === 1 ? 'В центре —\nпользователь.' : project.name}</h2><p>{project.feature}</p></div>
        <figure><ProjectPreview project={project} onAmbient={setAmbient} /><figcaption><span>↗ {project.feature}</span><span>{project.cover ? 'Проект' : 'Схематичное превью'}</span></figcaption></figure>
      </div>}</DesignVariants>

      <DesignVariants id="case-task" label="01 / Задача" names={['Тезис', 'Акцент', 'Контекст']} active className="cp-section cp-task" singlePanel>{(variant, headingId) => <div className={`cp-content cp-task-layout cp-task-${variant}`} key={variant}>
        <div className="cp-section-title"><span className="sp-kicker">Отправная точка</span><h2 id={headingId}>Задача.</h2></div>
        <div className="cp-task-copy"><p className="cp-statement">{details.task}</p><p className="cp-text">{details.context}</p><ul className="cp-tags">{project.scope.map(item => <li key={item}>{item}</li>)}</ul></div>
      </div>}</DesignVariants>

      <DesignVariants id="case-solution" label="02 / Решение" names={['Сетка', 'Последовательность', 'Крупные номера']} active className="cp-section cp-solution" singlePanel>{(variant, headingId) => <div className={`cp-content cp-solution-layout cp-solution-${variant}`} key={variant}>
        <div className="cp-section-title"><span className="sp-kicker">Из задачи в интерфейс</span><h2 id={headingId}>Что мы<br />сделали.</h2></div>
        <div className="cp-solution-grid">{details.solution.map((item, i) => <article key={item.title}><span className="cp-number">0{i + 1}</span><div><h3>{item.title}</h3><p>{item.text}</p></div></article>)}</div>
      </div>}</DesignVariants>

      <DesignVariants id="case-results" label="03 / Результат" names={['Три акцента', 'Итог проекта', 'Список изменений']} active className="cp-section cp-results" singlePanel>{(variant, headingId) => <div className={`cp-content cp-results-layout cp-results-${variant}`} key={variant}>
        <div className="cp-section-title"><span className="sp-kicker">Что получилось</span><h2 id={headingId}>Результат<br />в деталях.</h2><p className="cp-text">{project.feature}.</p></div>
        <div className="cp-outcomes">{details.outcomes.map((item, i) => <article key={item.title}><span className="cp-outcome-index">0{i + 1}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
        <ul className="cp-tags">{project.scope.map(item => <li key={item}>{item}</li>)}</ul>
      </div>}</DesignVariants>

      <DesignVariants id="case-review" label="04 / Обратная связь" names={['Цитата', 'Карточка', 'Диалог']} active className="cp-section cp-review" singlePanel>{(variant, headingId) => <div className={`cp-content cp-review-layout cp-review-${variant}`} key={variant}>
        <div className="cp-section-title"><span className="sp-kicker">Со стороны клиента</span><h2 id={headingId}>Обратная<br />связь.</h2></div>
        <div className="cp-review-copy">
          <span className="cp-quote-mark" aria-hidden="true">“</span>
          {details.review ? <><p className="cp-review-status">{details.review.source}</p><blockquote>{details.review.text}</blockquote><p className="cp-review-author">{details.review.author}<span>{details.review.role}</span></p></> : <><p className="cp-review-status">Отзыв пока не опубликован</p><p className="cp-review-placeholder">Здесь будет<br />голос клиента.</p><p className="cp-text">Добавим отзыв о проекте «{project.name}» после согласования с клиентом.</p></>}
        </div>
      </div>}</DesignVariants>

      <DesignVariants id="case-next" label="Следующий проект" names={['Приглашение', 'Обложка', 'Индекс']} active className="cp-section cp-next" singlePanel>{(variant, headingId) => <div className={`cp-content cp-next-layout cp-next-${variant}`} key={variant}>
        <div className="cp-section-title"><span className="sp-kicker">Продолжим знакомство</span><h2 id={headingId}>Хотите<br />так же?</h2><p className="cp-text">Начнём с разбора вашего сайта и определим следующий шаг.</p><a className="sp-primary" href="#contact">Получить разбор сайта <Arrow /></a><a className="sp-text-link" href={home + '#work'}>Все работы <Arrow /></a></div>
        <a className="cp-next-project" href={caseHref(next.slug)}><div className="cp-next-title"><span className="sp-kicker">Следующий кейс / 0{(index + 1) % projects.length + 1}</span><h3>{next.name}</h3><p>{next.kind} / {next.service}</p></div><ProjectPreview project={next} /><span className="cp-next-action">Смотреть кейс <Arrow diagonal /></span></a>
      </div>}</DesignVariants>
      <IndexContact active reducedMotion={reducedMotion} homeHref={home} workHref={home + '#work'} />
    </div>
  </main>;
}
