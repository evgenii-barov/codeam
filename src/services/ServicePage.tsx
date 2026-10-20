import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Arrow } from '../components/Shared';
import type { PanelKind } from '../components/Shared';
import IndexWorks from '../concepts/IndexWorks';
import IndexContact from '../concepts/IndexContact';
import { setPageScroll } from '../scroll/pageScroll';
import { services, serviceHref } from './services';
import type { Service } from './services';
import SectionDesignControls from '../components/SectionDesignControls';
import './service-page.css';

const following = ['#service-faq', '#service-related', '#contact'];
const leading = ['#service-intro', '#service-scope'];
const designs = ['Редакция', 'Контраст', 'Система'];

export default function ServicePage({ service, onOpen }: { service: Service; onOpen: (kind: PanelKind) => void }) {
  const [design, setDesign] = useState(0);
  const [scopeDesign, setScopeDesign] = useState(0);
  const [faqDesign, setFaqDesign] = useState(0);
  const [relatedDesign, setRelatedDesign] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    const oldTitle = document.title;
    document.title = `${service.title} — CODEAM`;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    media.addEventListener('change', update);
    if (!location.hash) setPageScroll(0);
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { (entry.target as HTMLElement).dataset.visible = 'true'; observer.unobserve(entry.target); }
    }), { threshold: .08 });
    main.current?.querySelectorAll('.sp-reveal').forEach(node => observer.observe(node));
    return () => { document.title = oldTitle; observer.disconnect(); media.removeEventListener('change', update); };
  }, [service]);
  const related = services.filter(item => item.slug !== service.slug);
  return <main ref={main} className="service-page">
    <section id="service-intro" className="sp-intro" data-design={design} aria-labelledby="service-title">
      <header className="sp-header">
        <a className="sp-brand" href={import.meta.env.BASE_URL} aria-label="CODEAM — главная"><img src={import.meta.env.BASE_URL + 'assets/brand-symbol.svg'} alt="" /><img src={import.meta.env.BASE_URL + 'assets/wordmark.svg'} alt="CODEAM" /></a>
        <nav aria-label="Навигация страницы"><a href="#service-scope">Что делаем</a><a href="#work">Работы</a><a href="#service-faq">Вопросы</a></nav>
        <a href="#contact" className="sp-header-contact">Обсудить задачу <Arrow diagonal /></a>
      </header>
      <SectionDesignControls label="Первый экран услуги" names={designs} value={design} onChange={setDesign} />
      <nav className="sp-breadcrumbs" aria-label="Хлебные крошки"><a href={import.meta.env.BASE_URL}>Главная</a><span>/</span><a href={`${import.meta.env.BASE_URL}#services`}>Услуги</a><span>/</span><span aria-current="page">{service.title}</span></nav>
      <div className="sp-hero-layout" key={design}>
        <div className="sp-hero-title"><span className="sp-kicker">{service.number} / Направление студии</span><h1 id="service-title">{service.lines[0]}<br /><em>{service.lines[1]}</em></h1><ul className="sp-tags">{service.tags.map(tag => <li key={tag}>{tag}</li>)}</ul></div>
        <div className="sp-hero-copy"><span className="sp-hero-number" aria-hidden="true">{service.number}</span><p>{service.lead}</p><a className="sp-primary" href="#contact">Обсудить задачу <Arrow diagonal /></a><a className="sp-text-link" href="#work">Смотреть работы <Arrow /></a></div>
      </div>
      <div className="sp-hero-bottom"><div><span className="sp-kicker">С чего начнём</span><p>{service.start}</p></div><div><span className="sp-kicker">К чему придём</span><p>{service.result}</p></div><a href="#service-scope" aria-label="К составу услуги"><Arrow /></a></div>
    </section>

    <section id="service-scope" className="sp-section sp-scope" data-design={scopeDesign} aria-labelledby="scope-title">
      <SectionDesignControls label="Состав услуги" names={['Сетка', 'Четыре направления', 'Нумерованные строки']} value={scopeDesign} onChange={setScopeDesign} />
      <div className="sp-section-heading sp-reveal"><span className="sp-kicker">01 / Что делаем</span><h2 id="scope-title">Состав<br /><em>услуги.</em></h2><p>Соберём нужный объём под вашу задачу. Можно начать с отдельного этапа.</p></div>
      <div className="sp-scope-grid">{service.scope.map((item, index) => <article className="sp-scope-item sp-reveal" key={item.title} style={{ '--reveal-delay': `${index * 70}ms` } as CSSProperties}><span className="sp-scope-number">0{index + 1}</span><div><h3>{item.title}</h3><p>{item.text}</p><small>{item.detail}</small></div><span className="sp-scope-mark" aria-hidden="true">//</span></article>)}</div>
    </section>

    <IndexWorks active onOpen={onOpen} leadingSections={leading} followingSections={following} />

    <section id="service-faq" className="sp-section sp-faq" data-design={faqDesign} aria-labelledby="faq-title">
      <SectionDesignControls label="Вопросы об услуге" names={['Диалог', 'Контраст', 'Открытые ответы']} value={faqDesign} onChange={setFaqDesign} />
      <div className="sp-section-heading sp-reveal"><span className="sp-kicker">02 / До начала работы</span><h2 id="faq-title">Частые<br /><em>вопросы.</em></h2><p>Если вашей ситуации здесь нет — начнём с разговора.</p><a className="sp-text-link" href="#contact">Задать вопрос <Arrow diagonal /></a></div>
      <div className="sp-questions sp-reveal">{service.faq.map((item, index) => <details key={item.question} name={faqDesign === 2 ? undefined : "service-faq"} open={faqDesign === 2 || index === 0 ? true : undefined}><summary><span>0{index + 1}</span><h3>{item.question}</h3><i aria-hidden="true" /></summary><p>{item.answer}</p></details>)}</div>
    </section>

    <section id="service-related" className="sp-section sp-related" data-design={relatedDesign} aria-labelledby="related-title">
      <SectionDesignControls label="Другие услуги" names={['Карточки', 'Список направлений', 'Акцент']} value={relatedDesign} onChange={setRelatedDesign} />
      <div className="sp-section-heading sp-reveal"><span className="sp-kicker">03 / Работаем вместе</span><h2 id="related-title">Что<br /><em>дальше?</em></h2><p>Подключим другие направления, если этого требует задача.</p></div>
      <div className="sp-related-grid">{related.map(item => <a className="sp-related-card sp-reveal" href={serviceHref(item.slug)} key={item.slug}><span className="sp-related-number">{item.number}</span><h3>{item.title}</h3><p>{item.lead}</p><ul>{item.tags.map(tag => <li key={tag}>{tag}</li>)}</ul><span className="sp-related-link">Перейти к услуге <Arrow diagonal /></span></a>)}</div>
    </section>
    <IndexContact active reducedMotion={reducedMotion} homeHref={import.meta.env.BASE_URL} />
  </main>;
}
