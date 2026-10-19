import { Header, ActionButton, Arrow, SectionMarker } from '../components/Shared';
import type { HeroProps } from '../components/Shared';
import './scene.css';

export default function SceneHero({ onOpen }: HeroProps) {
  return <section className="hero-view scene" aria-label="Вариант 02 — Сигнал">
    <div className="scene-backdrop" aria-hidden="true"><img src={import.meta.env.BASE_URL + 'assets/sculpture.png'} alt="" /><div className="scene-shade" /></div>
    <Header dark onOpen={onOpen} />
    <div className="scene-topline"><SectionMarker>Студия digital-продуктов</SectionMarker><span>ИДЕЯ → ДИЗАЙН → ЗАПУСК</span></div>
    <div className="scene-body"><div className="scene-heading"><div className="scene-eyebrow"><span /> ВАШ БИЗНЕС. НОВЫЙ МАСШТАБ.</div><h1>Заметный дизайн.<br /><span>Ощутимый</span><br />результат.</h1><div className="scene-bottom-copy"><p>Сайты и цифровые продукты,<br />которые работают на ваш бизнес.</p><ActionButton onClick={() => onOpen('project')}>Начать проект</ActionButton></div></div><button className="scene-art-note" onClick={() => onOpen('about')} aria-label="Узнать, как работает CODEAM"><span className="scene-art-cross">+</span><span>ФОРМА СЛЕДУЕТ<br />ЗА СМЫСЛОМ</span><Arrow diagonal /></button></div>
    <footer className="hero-footer scene-footer"><span>BUILD. LAUNCH. SCALE.</span><button onClick={() => onOpen('work')}>Исследовать работы <Arrow diagonal /></button><span className="scene-footer-last">ДИЗАЙН & ТЕХНОЛОГИИ <span>© 2026</span></span></footer>
  </section>;
}

