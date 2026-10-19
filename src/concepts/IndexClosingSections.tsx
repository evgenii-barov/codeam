import DesignVariants from '../components/DesignVariants';
import { Arrow } from '../components/Shared';
import type { PanelKind } from '../components/Shared';
import './closing-sections.css';

type Props = { active: boolean; onOpen: (kind: PanelKind) => void };
const description = 'CODEAM — современная студия, которая делает digital-продукты: сайты, веб-приложения и автоматизацию. Работаем по понятному процессу и показываем реальный прогресс.';
function Signature() { return <div className="ab-signature"><strong>Александр Фролов</strong><span>Основатель, арт-директор</span></div>; }
function Portrait() { return <div className="ab-portrait"><img src={import.meta.env.BASE_URL + 'assets/brand-symbol.svg'} alt="" /><span>Здесь будет фото Александра</span><div><span>CODEAM / ART DIRECTION</span><strong>За каждым проектом —<br />люди и их решения.</strong></div></div>; }
export function IndexAbout({ active, onOpen }: Props) {
  return <DesignVariants id="about" label="О студии" names={['Люди и подход', 'Типографический манифест', 'Редакция']} active={active} className="ab-section">{(variant, id) => <div className={`ab-layout ab-layout-${variant}`}>
    <div className="ab-visual"><Portrait /></div>
    <div className="ab-copy"><span className="cl-eyebrow">Дизайн. Разработка. Развитие.</span><h2 id={id} tabIndex={-1}>Надёжная студия <br />с сильным <br /><em>арт-директором.</em></h2><p>{description}</p><div className="ab-person"><Signature /><button className="cl-link" onClick={() => onOpen('project')}>Обсудить проект <Arrow diagonal /></button></div></div>
    <div className="ab-principles"><span><b>01</b>Погружаемся в задачу</span><span><b>02</b>Внимательны к деталям</span><span><b>03</b>Остаёмся на связи</span></div>
  </div>}</DesignVariants>;
}

// Quotes supplied in the user's layout. Project attribution avoids guessing tiny author names.
const reviews = [
  { client: 'Весна', type: 'Интернет-магазин', text: 'Пришли с устаревшим сайтом, а получили аккуратный интернет-магазин под ключ. Заявки перестали теряться, менеджерам стало проще.' },
  { client: 'Спецтехника Щёкино', type: 'Каталог техники', text: 'Делали проект фактически с нуля: структура, дизайн, разработка. Команда держала процесс прозрачным и укладывалась в сроки.' },
  { client: 'Diamond', type: 'Редизайн', text: 'Редизайн заметно освежил бренд. Отдельно ценю внимание к типографике и то, что путь к заявке стал очевидным.' },
];
export function IndexTestimonials({ active }: { active: boolean }) {
  return <DesignVariants id="reviews" label="Отзывы" names={['Три голоса', 'Крупный план', 'Прямая речь']} active={active} className="rv-section">{(variant, id) => <div className={`rv-layout rv-layout-${variant}`}>
    <header className="rv-heading"><h2 id={id} tabIndex={-1}>Что говорят<br /><em>клиенты.</em></h2><span className="cl-eyebrow">О работе вместе</span></header>
    <div className="rv-quotes">{reviews.map((review, index) => <figure key={review.client}><div className="rv-top"><span aria-hidden="true">“</span><span>{review.type}</span><b>0{index + 1}</b></div><blockquote>{review.text}</blockquote><figcaption><strong>{review.client}</strong><span>{review.type}</span><Arrow diagonal /></figcaption></figure>)}</div>
  </div>}</DesignVariants>;
}


