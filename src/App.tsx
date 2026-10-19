import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import PosterHero from './concepts/PosterHero';
import SceneSeries from './concepts/SceneSeries';
import EditorialHero from './concepts/EditorialHero';
import { Arrow } from './components/Shared';
import type { PanelKind } from './components/Shared';

const IndexExperience = lazy(() => import('./concepts/IndexExperience'));

const concepts = [
  { number: '01', name: 'Масштаб', label: 'Типографическая афиша', description: 'Фирменное имя становится главным жестом. Светлое поле, крупная типографика и один выразительный акцент.', component: PosterHero },
  { number: '02', name: 'Сигнал', label: 'Материал и свет — четыре композиции', description: 'Исходный экран и три новых варианта с металлической графикой. Все композиции идут друг за другом.', component: SceneSeries },
  { number: '03', name: 'Редакция', label: 'Смысл на первом плане', description: 'Асимметричная композиция с уверенным заголовком. Типографика, фирменная графика и процесс в одной системе.', component: EditorialHero },
];
const getInitial = () => Math.min(2, Math.max(0, (Number(new URLSearchParams(window.location.search).get('concept')) || 1) - 1));

function ContentPanel({ kind, onClose }: { kind: PanelKind; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => { const node = dialog.current; node?.showModal(); return () => { node?.close(); }; }, []);
  const titles = { project: 'Начнём с вашей идеи.', work: 'От задачи к продукту.', services: 'Что мы можем сделать.', about: 'Сначала смысл. Затем форма.', audit: 'Начнём с разбора сайта.' };
  function saveBrief(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = `CODEAM — ${kind === 'audit' ? 'Разбор сайта' : 'Бриф проекта'}\n\nИмя: ${data.get('name')}\nКонтакт: ${data.get('contact')}\n${kind === 'audit' ? `Сайт: ${data.get('website')}\n` : ''}Задача: ${data.get('task')}\n\nЧерновик брифа. Данные не отправлены.`;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'codeam-brief.txt'; link.click(); URL.revokeObjectURL(url); setSaved(true);
  }
  return <dialog ref={dialog} className="content-dialog" aria-labelledby="dialog-title" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="dialog-inner"><button className="dialog-close" onClick={onClose} aria-label="Закрыть окно">×</button><span className="dialog-eyebrow">CODEAM / {kind === 'project' ? 'НОВЫЙ ПРОЕКТ' : 'СТУДИЯ'}</span><h2 id="dialog-title">{titles[kind]}</h2>
    {kind === 'project' || kind === 'audit' ? <><p className="dialog-lead">{kind === 'audit' ? 'Укажите сайт — начнём с первичного разбора и кратких рекомендаций.' : 'Расскажите, что хотите создать или улучшить.'}</p><form onSubmit={saveBrief} onChange={() => setSaved(false)}><label>Как вас зовут<input name="name" placeholder="Имя" required autoComplete="name" /></label><label>Как с вами связаться<input name="contact" placeholder="Почта или Telegram" required autoComplete="email" /></label>{kind === 'audit' && <label>Адрес сайта<input name="website" type="url" placeholder="https://example.ru" required autoComplete="url" /></label>}<label>Несколько слов о задаче<textarea name="task" placeholder="Что вы хотите сделать?" required={kind !== 'audit'} rows={3} /></label><button className="action-button" type="submit">Скачать бриф<Arrow diagonal /></button><p className="form-note" role="status">{saved ? 'Бриф скачан. Вы можете сохранить его и отправить команде.' : 'Демонстрация формы. Бриф скачивается на ваше устройство; данные никуда не отправляются.'}</p></form></> : kind === 'services' ? <div className="dialog-list">{[['01', 'Сайты и продукты', 'Сайты, интернет-магазины и веб-приложения: от структуры и сценариев до рабочего релиза.'], ['02', 'Продвижение', 'Реклама в Яндексе и развитие действующих сайтов.'], ['03', 'Автоматизация', 'Боты и интеграции, которые помогают выстроить рабочие процессы.']].map(([n, title, text]) => <article key={n}><span>{n}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div> : kind === 'about' ? <div className="dialog-list">{[['01', 'Разбираемся', 'Начинаем с задачи, аудитории и сценариев. Определяем, что действительно нужно вашему проекту.'], ['02', 'Проектируем', 'Соединяем понятную структуру, выразительный дизайн и удобное взаимодействие.'], ['03', 'Запускаем и развиваем', 'Воплощаем идею в работающий продукт и помогаем ему двигаться дальше.']].map(([n, title, text]) => <article key={n}><span>{n}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div> : <><p className="dialog-lead">В этой итерации выбираем первый экран. Проекты и подробные кейсы — следующий раздел сайта.</p><div className="project-preview"><span>ИЗ ИСХОДНОГО МАКЕТА</span><h3>Весна</h3><p>Интернет-магазин с каталогом, карточками товаров и оформлением заказа.</p><span>РАЗРАБОТКА / E-COMMERCE</span></div></>}
    </div>
  </dialog>;
}

export default function App() {
  const [active, setActive] = useState(getInitial);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [compare, setCompare] = useState(false);
  const [panel, setPanel] = useState<PanelKind | null>(null);
  const isolated = new URLSearchParams(window.location.search).get('isolated') === '1';
  const current = concepts[active];
  const Hero = current.component;
  function choose(index: number) {
    setActive(index); setCompare(false);
    const url = new URL(window.location.href); url.searchParams.set('concept', String(index + 1)); url.hash = ''; window.history.pushState({}, '', url);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  useEffect(() => { const pop = () => setActive(getInitial()); window.addEventListener('popstate', pop); return () => window.removeEventListener('popstate', pop); }, []);
  const concept = new URLSearchParams(window.location.search).get('concept');
  if (!concept || concept === '2/index') return <><Suspense fallback={<div style={{ minHeight: '100svh', background: '#10120f' }} />}><IndexExperience onOpen={setPanel} /></Suspense>{panel && <ContentPanel kind={panel} onClose={() => setPanel(null)} />}</>;
  if (isolated) return <main className="isolated"><Hero onOpen={setPanel} />{panel && <ContentPanel kind={panel} onClose={() => setPanel(null)} />}</main>;
  return <div className="studio-shell">
    <header className="review-bar"><a className="review-brand" href="?concept=1" onClick={e => { e.preventDefault(); choose(0); }}><img src={import.meta.env.BASE_URL + 'assets/brand-icon.svg'} alt="" /><span>CODEAM <span>HERO STUDIES</span></span></a>
      <nav className="concept-tabs" aria-label="Варианты дизайна">{concepts.map((c, i) => <button key={c.number} className={i === active && !compare ? 'is-selected' : ''} aria-pressed={i === active && !compare} onClick={() => choose(i)}><span>{c.number}</span>{c.name}</button>)}</nav>
      <button className={`compare-toggle ${compare ? 'is-selected' : ''}`} onClick={() => setCompare(!compare)} aria-pressed={compare}><svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M1 2h5v12H1zm9 0h5v12h-5z" stroke="currentColor" /></svg><span>Сравнить</span></button>
    </header>
    {compare ? <main className="comparison"><div className="comparison-intro"><span>CODEAM / ТРИ НАПРАВЛЕНИЯ</span><h1>Один характер.<br />Три точки зрения.</h1><p>Логотип, шрифты и фирменный лайм сохранены.<br />Меняются композиция, масштаб и настроение.</p></div><div className="comparison-grid">{concepts.map((c, i) => <article key={c.number} className="comparison-card"><button className="comparison-image" onClick={() => choose(i)} aria-label={`Открыть вариант ${c.number} — ${c.name}`}><iframe src={`?concept=${i + 1}&isolated=1`} title={`Превью ${c.name}`} tabIndex={-1} loading="lazy" /><span className="comparison-open">Открыть <Arrow diagonal /></span></button><div className="comparison-card-title"><span>{c.number}</span><h2>{c.name}</h2><span>{c.label}</span></div><p>{c.description}</p></article>)}</div></main> : <main className={`preview-stage preview-stage--${device}`} aria-label="Предпросмотр дизайна"><div className="preview-canvas" key={`${active}-${device}`}>{device === 'desktop' ? <Hero onOpen={setPanel} /> : <iframe className="mobile-preview" src={`?concept=${active + 1}&isolated=1`} title={`Мобильная версия — ${current.name}`} />}</div></main>}
    <footer className="review-footer"><div className="review-caption"><span className="review-index">{compare ? '03' : current.number}</span><div><strong>{compare ? 'Выберите направление' : current.label}</strong><p>{compare ? 'Каждый вариант можно открыть отдельно.' : current.description}</p></div></div><div className="preview-tools">{!compare && <><div className="device-switch" aria-label="Размер предпросмотра"><button className={device === 'desktop' ? 'is-selected' : ''} onClick={() => setDevice('desktop')} aria-label="Версия для компьютера" aria-pressed={device === 'desktop'}><svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="2" y="3" width="16" height="11" rx="1" stroke="currentColor" /><path d="M10 14v3m-4 0h8" stroke="currentColor" /></svg></button><button className={device === 'mobile' ? 'is-selected' : ''} onClick={() => setDevice('mobile')} aria-label="Мобильная версия" aria-pressed={device === 'mobile'}><svg width="17" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="5" y="1" width="10" height="18" rx="2" stroke="currentColor" /><path d="M8 16h4" stroke="currentColor" /></svg></button></div><a className="standalone-link" href={`?concept=${active + 1}&isolated=1`} target="_blank" rel="noreferrer" aria-label="Открыть вариант в отдельной вкладке"><Arrow diagonal /></a><span className="tools-divider" /><button className="next-concept" onClick={() => choose((active + 1) % 3)} aria-label="Следующий вариант">Следующий <Arrow /></button></>}</div></footer>
    {panel && <ContentPanel kind={panel} onClose={() => setPanel(null)} />}
  </div>;
}


