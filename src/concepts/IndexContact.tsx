import { useEffect, useRef, useState } from 'react';
import DesignVariants from '../components/DesignVariants';
import MatchedMetalScene from '../components/MatchedMetalScene';
import { Arrow } from '../components/Shared';
import './closing-sections.css';

function ContactScene({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [target, setTarget] = useState<{ x: number; y: number; width: number; height: number }>();
  useEffect(() => {
    const section = host.current?.closest('section');
    const slot = section?.querySelector<HTMLElement>('.ct-scene-slot');
    if (!section || !slot) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const outer = section.getBoundingClientRect(), inner = slot.getBoundingClientRect();
        const next = { x: inner.left - outer.left, y: inner.top - outer.top, width: inner.width, height: inner.height - 45 };
        setTarget(previous => previous && Object.keys(next).every(key => Math.abs(previous[key as keyof typeof next] - next[key as keyof typeof next]) < .5) ? previous : next);
      });
    };
    const observer = new ResizeObserver(measure); observer.observe(section); observer.observe(slot);
    const mutation = new MutationObserver(measure); mutation.observe(section, { attributes: true, attributeFilter: ['data-variant'] });
    measure();
    return () => { observer.disconnect(); mutation.disconnect(); cancelAnimationFrame(frame); };
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setMounted(true); observer.disconnect(); } }, { rootMargin: '600px' });
    if (host.current) observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={host} className="ct-world" data-ready={ready} aria-hidden="true">
    <div className="ct-scene-canvas">{mounted && target && !failed && <MatchedMetalScene placement="center" objectTarget={target} docked instantDock revealed active={active} reducedMotion={reducedMotion} lighting="original" onReady={() => setReady(true)} onError={() => setFailed(true)} />}</div>
    {(!ready || failed) && <img className="ct-scene-fallback" src={import.meta.env.BASE_URL + 'assets/brand-symbol.svg'} alt="" />}
  </div>;
}
function BriefForm() {
  const [kind, setKind] = useState('site');
  const [saved, setSaved] = useState(false);
  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = `CODEAM — ${kind === 'site' ? 'Разбор сайта' : 'Новый проект'}\n\nСайт: ${data.get('website') || 'Новый проект'}\nЗадача: ${data.get('task')}\nОжидаемый результат: ${data.get('result')}\nКонтакт: ${data.get('contact')}\n\nЧерновик. Данные не отправлены.`;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'codeam-brief.txt'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); setSaved(true);
  }
  return <form className="ct-form" onSubmit={save} onChange={() => setSaved(false)}>
    <fieldset className="ct-kind"><legend className="ct-sr">О чём ваш проект?</legend>{[['site', 'Есть сайт'], ['new', 'Новый проект']].map(([value, label]) => <label key={value}><input type="radio" name="kind" value={value} checked={kind === value} onChange={() => setKind(value)} /><span>{label}</span></label>)}</fieldset>
    <label className="ct-field" hidden={kind !== 'site'}>Ссылка на сайт<input name="website" type="url" placeholder="https://example.ru" autoComplete="url" required={kind === 'site'} disabled={kind !== 'site'} /></label>
    <label className="ct-field">Коротко о задаче<textarea name="task" placeholder={kind === 'site' ? 'Что происходит и что хочется улучшить?' : 'Что вы хотите создать?'} rows={2} required /></label>
    <label className="ct-field">Что хотите получить <span>необязательно</span><input name="result" placeholder="Заявки, продажи, удобство…" /></label>
    <label className="ct-field">Telegram или почта<input name="contact" placeholder="@username или email" required autoComplete="off" /></label>
    <button className="dv-cta" type="submit">Скачать бриф проекта <Arrow /></button>
    <p className="ct-form-note" role="status">{saved ? 'Бриф скачан. Данные не отправлены.' : 'Пока это демо-форма: бриф сохраняется на устройство, данные не отправляются.'}</p>
  </form>;
}
export default function IndexContact({ active, reducedMotion, homeHref = '', workHref = '#work' }: { active: boolean; reducedMotion: boolean; homeHref?: string; workHref?: string }) {
  return <><DesignVariants id="contact" label="Начнём с вашей задачи" names={['Материал и диалог', 'Открытый бриф', 'Приглашение']} active={active} className="ct-section" singlePanel background={<ContactScene active={active} reducedMotion={reducedMotion} />}>{(variant, id) => <div className={`ct-layout ct-layout-${variant}`}>
    <header className="ct-heading"><span className="cl-eyebrow">Есть задача? Давайте обсудим.</span><h2 id={id} tabIndex={-1}>{variant === 2 ? <>Следующий<br />{' '}<em>шаг — вместе.</em></> : <>Покажите сайт —<br />{' '}определим<br />{' '}<em>следующий шаг.</em></>}</h2><p>Проведём первичный разбор и дадим краткие рекомендации. Если сайта ещё нет — спроектируем новый с нуля.</p></header>
    <div className="ct-scene ct-scene-slot"><span className="ct-scene-caption">CODEAM <i>Давайте создадим что-то стоящее.</i></span></div>
    <div className="ct-form-wrap"><span className="ct-form-title">Расскажите о проекте <Arrow diagonal /></span><BriefForm /></div>
  </div>}</DesignVariants><footer className="cl-footer" inert={!active} aria-hidden={!active}><a href={homeHref || '#studio'} aria-label="CODEAM — к студии"><img src={import.meta.env.BASE_URL + 'assets/logo.svg'} alt="CODEAM" /></a><nav aria-label="Навигация в подвале"><a href={workHref}>Работы</a><a href={`${homeHref}#services`}>Услуги</a><a href={`${homeHref}#about`}>Студия</a><a href="#contact">Обсудить проект <Arrow diagonal /></a></nav><span>© {new Date().getFullYear()} CODEAM</span></footer></>;
}

