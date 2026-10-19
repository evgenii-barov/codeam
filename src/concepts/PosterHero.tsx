import { Header, ActionButton, Arrow, SectionMarker } from '../components/Shared';
import type { HeroProps } from '../components/Shared';
import './poster.css';

export default function PosterHero({ onOpen }: HeroProps) {
  return <section className="hero-view poster" aria-label="Вариант 01 — Масштаб">
    <Header onOpen={onOpen} />
    <div className="poster-intro"><SectionMarker>Независимая digital-студия</SectionMarker><span>От первой идеи — до работающего продукта.</span><span className="poster-year">Дизайн & разработка / 2026</span></div>
    <div className="poster-wordmark"><img src={import.meta.env.BASE_URL + 'assets/wordmark.svg'} alt="CODEAM" fetchPriority="high" /><span className="poster-wordmark-star" aria-hidden="true">✳</span></div>
    <div className="poster-content">
      <div className="poster-main"><span className="poster-kicker">СМЫСЛ. ФОРМА. РЕЗУЛЬТАТ.</span><h1>Хороший дизайн.<br />Сильный <span>digital.</span></h1><div className="poster-actions"><ActionButton onClick={() => onOpen('project')}>Обсудить задачу</ActionButton><button className="text-link" onClick={() => onOpen('work')}>Наши работы <Arrow diagonal /></button></div></div>
      <div className="poster-detail"><p>Создаём сайты и веб-приложения.<br />Помогаем бизнесу быть заметнее,<br />а сложному — стать понятным.</p><button className="poster-art" onClick={() => onOpen('about')} aria-label="Узнать подход CODEAM"><span className="poster-art-label">ИЗ ИДЕИ В РЕАЛЬНОСТЬ</span><img src={import.meta.env.BASE_URL + 'assets/brand-object.svg'} alt="Фирменный объёмный знак CODEAM" /><span className="poster-art-footer">BUILD. LAUNCH. SCALE.<Arrow diagonal /></span></button></div>
    </div>
    <footer className="hero-footer poster-footer"><SectionMarker>Создаём. Запускаем. Развиваем.</SectionMarker><button onClick={() => onOpen('services')}>Сайты <span>·</span> Веб-приложения <span>·</span> Продвижение <Arrow /></button><span className="footer-index">01 / CODEAM</span></footer>
  </section>;
}

