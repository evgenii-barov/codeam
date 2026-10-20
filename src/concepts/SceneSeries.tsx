import SceneHero from './SceneHero';
import MetalManifestHero from './MetalManifestHero';
import MetalStudioHero from './MetalStudioHero';
import MetalIndexHero from './MetalIndexHero';
import { Arrow } from '../components/Shared';
import type { HeroProps } from '../components/Shared';
import './scene-series.css';

const studies = [
  { id: 'metal-manifest', number: '02', note: 'Крупная акцентная типографика, навигация отдельным блоком и графика во весь экран.', component: MetalManifestHero },
  { id: 'metal-studio', number: '03', note: 'Светлая редакционная композиция, свободная шапка и металлическая графика в отдельном кадре.', component: MetalStudioHero },
  { id: 'metal-index', number: '04', note: 'Модульная композиция, вертикальная навигация и фирменное имя в масштабе всего экрана.', component: MetalIndexHero },
];

export default function SceneSeries({ onOpen }: HeroProps) {
  return <div className="metal-series">
    <nav className="metal-series-nav" aria-label="Варианты с металлической графикой">
      <span className="metal-series-label">METAL STUDIES <span>/ 04 HERO</span></span>
      <div><a href="#metal-original" aria-label="Вариант 01">01</a>{studies.map(study => <a href={`#${study.id}`} key={study.id} aria-label={`Вариант ${study.number}`}>{study.number}</a>)}</div>
      <span className="metal-series-scroll">ЛИСТАЙТЕ ВНИЗ <Arrow /></span>
    </nav>
    <div id="metal-original" className="metal-series-original"><SceneHero onOpen={onOpen} /></div>
    {studies.map(({ id, number, note, component: Study }) => <div className="metal-study" id={id} key={id}>
      <div className="metal-study-caption"><span className="metal-study-number">{number}</span><p>{note}</p><a href={id === 'metal-index' ? import.meta.env.BASE_URL : `#${id}`} aria-label={id === 'metal-index' ? 'Открыть вариант 04 с 3D-заставкой' : `Ссылка на вариант ${number}`}><Arrow diagonal /></a></div>
      <Study onOpen={onOpen} />
    </div>)}
    <div className="metal-series-end"><span>ОДИН БРЕНД. ЧЕТЫРЕ КОМПОЗИЦИИ.</span><a href="#metal-original">Вернуться к началу <Arrow /></a></div>
  </div>;
}


