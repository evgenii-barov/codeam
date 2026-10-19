import { useState } from 'react';
import type { ReactNode } from 'react';

export type PanelKind = 'project' | 'work' | 'services' | 'about' | 'audit';
export type HeroProps = { onOpen: (kind: PanelKind) => void };

export function Arrow({ diagonal = false, className = '' }: { diagonal?: boolean; className?: string }) {
  return <svg className={`arrow ${className}`} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={diagonal ? 'M6 18 18 6M6 6h12v12' : 'M4 12h15m-6-6 6 6-6 6'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" /></svg>;
}

export function Brand({ dark = false }: { dark?: boolean }) {
  return <span className={`brand ${dark ? 'brand--dark' : ''}`}><img src="/assets/logo.svg" alt="CODEAM — Build. Launch. Scale." width="180" height="28" /></span>;
}

export function Header({ dark = false, onOpen }: HeroProps & { dark?: boolean }) {
  const [menu, setMenu] = useState(false);
  const links: [PanelKind, string][] = [['work', 'Работы'], ['services', 'Услуги'], ['about', 'Подход']];
  return <header className={`site-header ${dark ? 'site-header--dark' : ''}`}>
    <a href="#" className="brand-link" aria-label="CODEAM — главная" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><Brand dark={dark} /></a>
    <nav className={`site-nav ${menu ? 'site-nav--open' : ''}`} aria-label="Навигация сайта">{links.map(([kind, name]) => <button key={kind} onClick={() => { setMenu(false); onOpen(kind); }}>{name}</button>)}</nav>
    <button className="header-contact" onClick={() => onOpen('project')}>Обсудить проект <Arrow diagonal /></button>
    <button className="menu-toggle" aria-label={menu ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={menu} onClick={() => setMenu(!menu)}><span /><span /></button>
  </header>;
}

export function ActionButton({ children, onClick, dark = false, className = '' }: { children: ReactNode; onClick: () => void; dark?: boolean; className?: string }) {
  return <button className={`action-button ${dark ? 'action-button--dark' : ''} ${className}`} onClick={onClick}><span>{children}</span><Arrow diagonal /></button>;
}

export function SectionMarker({ children }: { children: ReactNode }) {
  return <span className="section-marker"><span aria-hidden="true" className="marker-cross">+</span>{children}</span>;
}
