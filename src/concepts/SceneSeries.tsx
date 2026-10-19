import SceneHero from './SceneHero';
import MetalManifestHero from './MetalManifestHero';
import MetalStudioHero from './MetalStudioHero';
import MetalIndexHero from './MetalIndexHero';
import { Arrow } from '../components/Shared';
import type { HeroProps } from '../components/Shared';
import './scene-series.css';

const studies = [
  { id: 'metal-manifest', number: '02.A', name: 'Манифест', note: 'Крупная акцентная типографика, навигация отдельным блоком и графика во весь экран.', component: MetalManifestHero },
  { id: 'metal-studio', number: '02.B', name: 'Ателье', note: 'Светлая редакционная композиция, свободная шапка и металлическая графика в отдельном кадре.', component: MetalStudioHero },
  { id: 'metal-index', number: '02.C', name: 'Индекс', note: 'Модульная композиция, вертикальная навигация и фирменное имя в масштабе всего экрана.', component: MetalIndexHero },
];

export default function SceneSeries({ onOpen }: HeroProps) {
  return <div className="metal-series">
    <nav className="metal-series-nav" aria-label="Варианты с металлической графикой">
      <span className="metal-series-label">METAL STUDIES <span>/ 04 HERO</span></span>
      <div><a href="#metal-original">Исходный</a>{studies.map(study => <a href={`#${study.id}`} key={study.id}><span>{study.number.slice(-1)}</span> {study.name}</a>)}</div>
      <span className="metal-series-scroll">ЛИСТАЙТЕ ВНИЗ <Arrow /></span>
    </nav>
    <div id="metal-original" className="metal-series-original"><SceneHero onOpen={onOpen} /></div>
    {studies.map(({ id, number, name, note, component: Study }) => <div className="metal-study" id={id} key={id}>
      <div className="metal-study-caption"><span className="metal-study-number">{number}</span><div><h2>{name}</h2><p>{note}</p></div><a href={id === 'metal-index' ? import.meta.env.BASE_URL : `#${id}`} aria-label={id === 'metal-index' ? 'Открыть Индекс с 3D-заставкой' : `Ссылка на вариант ${name}`}><Arrow diagonal /></a></div>
      <Study onOpen={onOpen} />
    </div>)}
    <div className="metal-series-end"><span>ОДИН БРЕНД. ЧЕТЫРЕ КОМПОЗИЦИИ.</span><a href="#metal-original">Вернуться к началу <Arrow /></a></div>
  </div>;
}


