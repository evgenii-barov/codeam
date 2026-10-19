import { Arrow, Brand } from '../components/Shared';
import type { HeroProps } from '../components/Shared';
import './metal-manifest.css';

export default function MetalManifestHero({ onOpen }: HeroProps) {
  return (
    <section className="mm-hero" aria-label="Манифест — смелый digital">
      <div className="mm-image" aria-hidden="true">
        <img src={import.meta.env.BASE_URL + 'assets/sculpture.png'} alt="" loading="lazy" />
      </div>

      <header className="mm-header">
        <nav className="mm-navigation" aria-label="Манифест — навигация">
          <button onClick={() => onOpen('work')}>Работы</button>
          <button onClick={() => onOpen('about')}>Студия</button>
          <button onClick={() => onOpen('services')}>Услуги</button>
        </nav>
        <a className="mm-brand" href="#metal-manifest" aria-label="CODEAM — Манифест"><Brand dark /></a>
        <button className="mm-contact" onClick={() => onOpen('project')}><span>ЕСТЬ ИДЕЯ?</span><Arrow diagonal /></button>
      </header>

      <div className="mm-coordinate-row" aria-hidden="true">
        <span>НЕЗАВИСИМАЯ DIGITAL-СТУДИЯ</span>
        <span>ДИЗАЙН + КОД + ХАРАКТЕР</span>
      </div>

      <div className="mm-main">
        <div className="mm-title-row">
          <h1><span>СМЕЛЫЙ</span><span>DIGITAL<span className="mm-dot">.</span></span></h1>
          <span className="mm-aside">ХОРОШИЕ ИДЕИ <br />ЗАСЛУЖИВАЮТ <br />СИЛЬНОЙ ФОРМЫ.</span>
        </div>
        <div className="mm-bottom">
          <div className="mm-description"><span className="mm-description-index">[В ДЕЛО]</span><p>Превращаем идеи в сайты<br />и цифровые продукты,<br />которые хочется замечать.</p></div>
          <button className="mm-project" aria-label="Обсудить новый проект" onClick={() => onOpen('project')}><span>Давайте<br />создадим ваше.</span><span className="mm-project-arrow"><Arrow diagonal /></span></button>
        </div>
      </div>

      <footer className="mm-footer"><span>BUILD. LAUNCH. SCALE.</span><button onClick={() => onOpen('work')}>СМОТРЕТЬ РАБОТЫ <Arrow /></button><span>CODEAM / 2026</span></footer>
    </section>
  );
}

