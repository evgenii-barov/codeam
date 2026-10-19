import type { HeroProps, PanelKind } from '../components/Shared';
import './metal-index.css';

function IndexArrow({ className = '' }: { className?: string }) {
  return <svg className={`mi-arrow ${className}`} width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" stroke="currentColor" strokeWidth="1.5" /></svg>;
}

const links: { number: string; label: string; kind: PanelKind }[] = [
  { number: '01', label: 'Работы', kind: 'work' },
  { number: '02', label: 'Услуги', kind: 'services' },
  { number: '03', label: 'Подход', kind: 'about' },
];

export default function MetalIndexHero({ onOpen }: HeroProps) {
  return <section className="mi-hero" aria-label="CODEAM — дизайн и технологии">
    <div className="mi-upper">
      <header className="mi-rail">
        <div className="mi-identity">
          <a className="mi-mark" href="#" aria-label="CODEAM — главная" onClick={event => { event.preventDefault(); window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }}>
            <img src={import.meta.env.BASE_URL + 'assets/brand-icon.svg'} alt="" width="50" height="48" />
          </a>
          <p className="mi-studio">Независимая<br />digital-студия</p>
        </div>
        <div className="mi-index">
          <span className="mi-index-label">Индекс</span>
          <nav className="mi-navigation" aria-label="Навигация сайта">
            {links.map(link => <button key={link.kind} onClick={() => onOpen(link.kind)}><span className="mi-nav-number">{link.number}</span><span className="mi-nav-name">{link.label}</span><IndexArrow /></button>)}
          </nav>
        </div>
        <button className="mi-contact" onClick={() => onOpen('project')}><span>Обсудить<br className="mi-contact-break" /> проект</span><IndexArrow /></button>
      </header>

      <div className="mi-stage">
        <img className="mi-sculpture" src={import.meta.env.BASE_URL + 'assets/sculpture.png'} alt="" />
        <div className="mi-stage-top"><span>ДИЗАЙН & ТЕХНОЛОГИИ</span><span aria-hidden="true">[ C / D ]</span></div>
        <div className="mi-heading">
          <h1>Смысл.<br />Форма.<br /><span>Действие.</span></h1>
        </div>
        <div className="mi-stage-bottom">
          <p>Создаём сайты и цифровые продукты.<br />От первой идеи до запуска.</p>
          <button className="mi-explore" onClick={() => onOpen('work')} aria-label="Смотреть работы CODEAM"><span>Смотреть<br />работы</span><IndexArrow /></button>
        </div>
      </div>
    </div>

    <div className="mi-wordmark"><img src={import.meta.env.BASE_URL + 'assets/wordmark.svg'} alt="CODEAM" /></div>
    <footer className="mi-footer"><span>BUILD. LAUNCH. SCALE.</span><span className="mi-footer-center"><span className="mi-footer-dot" aria-hidden="true" />Идея становится реальностью.</span><span>© 2026</span></footer>
  </section>;
}

