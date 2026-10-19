import { Arrow } from '../components/Shared';
import type { HeroProps } from '../components/Shared';
import './metal-studio.css';

export default function MetalStudioHero({ onOpen }: HeroProps) {
  return (
    <section className="metal-studio-hero ms-hero" aria-label="CODEAM — digital-ателье">
      <div className="ms-editorial">
        <header className="ms-header">
          <nav className="ms-nav" aria-label="Навигация CODEAM">
            <button type="button" onClick={() => onOpen('work')}><span>01</span> Работы</button>
            <button type="button" onClick={() => onOpen('services')}><span>02</span> Услуги</button>
            <button type="button" onClick={() => onOpen('about')}><span>03</span> Студия</button>
          </nav>
          <a className="ms-logo" href="#metal-studio" aria-label="CODEAM — начало страницы">
            <img src={import.meta.env.BASE_URL + 'assets/logo.svg'} alt="CODEAM — Build. Launch. Scale." width="210" height="33" />
          </a>
        </header>

        <div className="ms-story">
          <p className="ms-kicker"><span aria-hidden="true" /> Дизайн и разработка сайтов</p>
          <h1 className="ms-title">Смысл.<br />Форма.<br /><span>Результат.</span></h1>

          <div className="ms-support">
            <p>Дизайн, который хочется рассматривать.<br />Сайты, которыми хочется пользоваться.</p>
            <button className="ms-project" type="button" onClick={() => onOpen('project')}>
              <span>Обсудить проект</span><span className="ms-project-icon"><Arrow diagonal /></span>
            </button>
          </div>
        </div>

        <footer className="ms-editorial-footer">
          <span>Идея становится опытом.</span>
          <button type="button" onClick={() => onOpen('about')}>Наш подход <Arrow diagonal /></button>
        </footer>
      </div>

      <div className="ms-gallery">
        <img className="ms-sculpture" src={import.meta.env.BASE_URL + 'assets/sculpture.png'} alt="Металлический фирменный знак CODEAM с лаймовыми гранями" />
        <div className="ms-gallery-shade" aria-hidden="true" />
        <div className="ms-gallery-top" aria-hidden="true"><span>CODEAM<br />DIGITAL ATELIER</span><span className="ms-gallery-cross">+</span></div>
        <div className="ms-gallery-bottom">
          <p>Всё начинается<br />с точного решения.</p>
          <button type="button" onClick={() => onOpen('work')} aria-label="Посмотреть работы CODEAM"><Arrow diagonal /></button>
        </div>
      </div>
    </section>
  );
}

