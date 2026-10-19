import { useState } from 'react';
import { ActionButton, Arrow, Header } from '../components/Shared';
import type { PanelKind } from '../components/Shared';
import './editorial.css';

type OpenKind = PanelKind;

const disciplines = [
  { name: 'Стратегия', text: 'Разбираемся в задаче, аудитории и бизнесе. Находим точку, с которой стоит начать.' },
  { name: 'Дизайн', text: 'Превращаем идею в выразительный интерфейс. Продумываем каждый экран и каждый шаг.' },
  { name: 'Разработка', text: 'Собираем быстрые, удобные сайты. Запускаем новые проекты и развиваем существующие.' },
];

export default function EditorialHero({ onOpen }: { onOpen: (kind: OpenKind) => void }) {
  const [discipline, setDiscipline] = useState(0);

  return (
    <section className="hero-view ed-hero" aria-label="CODEAM — редакционный подход">
      <Header onOpen={onOpen} />

      <div className="ed-body">
        <div className="ed-intro">
          <p className="ed-eyebrow"><span aria-hidden="true" /> Digital-студия полного цикла</p>
          <p className="ed-side-note">От первой идеи<br />до работающего сайта</p>
        </div>

        <h1 className="ed-title">
          <span>Большие идеи.</span>
          <span>Точный <em>digital.</em></span>
        </h1>

        <div className="ed-lower">
          <div className="ed-copy">
            <p className="ed-description">Создаём сайты с характером.<br />Помогаем бизнесу выделяться<br />и двигаться вперёд.</p>
            <ActionButton onClick={() => onOpen('project')} className="ed-cta">Обсудить проект</ActionButton>
          </div>

          <div className="ed-art" aria-hidden="true">
            <div className="ed-art-corner ed-art-corner--tl" />
            <span className="ed-art-caption">CODE / DESIGN / TEAM</span>
            <img className="ed-object" src="/assets/brand-object.svg" alt="" />
            <div className="ed-art-corner ed-art-corner--br" />
          </div>
        </div>

        <div className="ed-disciplines">
          <div className="ed-discipline-list" role="tablist" aria-label="Как мы работаем">
            {disciplines.map((item, index) => (
              <button
                key={item.name}
                id={`ed-discipline-${index}`}
                className={`ed-discipline ${discipline === index ? 'is-active' : ''}`}
                role="tab"
                type="button"
                aria-selected={discipline === index}
                aria-controls="ed-discipline-description"
                tabIndex={discipline === index ? 0 : -1}
                onClick={() => setDiscipline(index)}
                onKeyDown={(event) => {
                  const next = event.key === 'ArrowRight' ? (index + 1) % disciplines.length
                    : event.key === 'ArrowLeft' ? (index + disciplines.length - 1) % disciplines.length
                    : event.key === 'Home' ? 0 : event.key === 'End' ? disciplines.length - 1 : null;
                  if (next !== null) {
                    event.preventDefault();
                    setDiscipline(next);
                    document.getElementById(`ed-discipline-${next}`)?.focus();
                  }
                }}
              >
                <span className="ed-discipline-number">0{index + 1}</span>
                <span>{item.name}</span>
                <Arrow diagonal />
              </button>
            ))}
          </div>
          <p
            className="ed-discipline-description"
            id="ed-discipline-description"
            role="tabpanel"
            aria-labelledby={`ed-discipline-${discipline}`}
            tabIndex={0}
          >{disciplines[discipline].text}</p>
        </div>
      </div>
    </section>
  );
}
