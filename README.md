# CODEAM

Клиентский сайт на React: главная, страницы услуг и кейсов. Статическая сборка, без backend, CMS и базы данных.

## Стек

Версии установленных пакетов зафиксированы в `package-lock.json`.

| Технология | Версия | Назначение |
| --- | --- | --- |
| React / React DOM | 19.3.1 | Компоненты, локальное состояние, lazy loading |
| TypeScript | 5.8.3 | Типизация; strict mode |
| Vite | 6.4.4 | Dev-сервер, HMR, production-сборка с React plugin |
| Three.js | 0.186.1 | WebGL-сцена, геометрия, материалы и GLSL-шейдеры |
| Lenis | 1.3.26 | Плавная прокрутка |
| CSS + Web Animations API | — | Адаптивная вёрстка, переходы, ViewTimeline |
| Fontsource | 5.3.0 | Локальные variable-шрифты Manrope и Unbounded |

Маршрутизация реализована через `location.pathname` и query-параметры в `src/App.tsx`, без React Router. Состояние интерфейса — React hooks, без внешнего store. Tailwind, GSAP и Framer Motion не используются.

## Запуск и сборка

Node.js 22 (как в CI), npm. Зависимости устанавливаются через `npm ci`.

| Команда | Результат |
| --- | --- |
| `npm run dev` | Vite, по умолчанию `http://localhost:5173`, host `0.0.0.0` |
| `npm run build` | Проверка TypeScript → сборка в `dist/` → HTML-входы услуг и кейсов |
| `npm start` | Раздача готового `dist/` на `http://127.0.0.1:4173` |
| `npm run preview` | Просмотр сборки через Vite, host `0.0.0.0` |
| `npm run build:pages` | Сборка для GitHub Pages с base `/codeam/` |

Для `npm start` нужна обычная сборка `npm run build`. Сервер в `scripts/serve.mjs` принимает `HOST` и `PORT`, обслуживает только статику и не имеет SPA fallback. Пользовательские `VITE_*` переменные не настроены; `.env` для запуска не требуется.

## Где что менять

Пути ниже указаны относительно корня репозитория.

| Что | Файл / каталог |
| --- | --- |
| Зависимости, команды, Pages base | `package.json`; точные версии — `package-lock.json` |
| Vite / TypeScript | `vite.config.ts`, `tsconfig.json` |
| Точка входа, подключение шрифтов | `src/main.tsx` |
| Выбор страницы, экспериментальные hero, модальная форма | `src/App.tsx` |
| Главная, интро, порядок секций | `src/concepts/IndexExperience.tsx` |
| Обзор, услуги, процесс, о студии и отзывы | `src/concepts/IndexOverview.tsx`, `IndexServices.tsx`, `IndexProcess.tsx`, `IndexClosingSections.tsx` |
| Контент услуг / шаблон страницы | `src/services/services.ts`, `ServicePage.tsx` |
| Карточки кейсов / подробные тексты / шаблон | `src/cases/projects.ts`, `caseDetails.ts`, `CasePage.tsx` |
| Общие превью кейсов | `src/cases/ProjectPreview.tsx`; изображение — поле `cover: { src, alt, position }` в `projects.ts` |
| Портфолио: мастер-классы, композиции, тема | `src/concepts/IndexWorks.tsx`; `WorksCarousel.tsx`, `WorksCatalog.tsx`, `WorksFold.tsx`, `WorksAtlas.tsx` |
| Переключатели дизайнов секций | `src/components/DesignVariants.tsx`, `SectionDesignControls.tsx` |
| Финальная форма, 3D-фон, footer | `src/concepts/IndexContact.tsx` |
| Общие цвета, шрифты, базовые стили | `src/styles.css`; стили секций — соседние `.css` и `*-variants.css` |
| Логотипы, изображения, текстуры | `public/assets/`; пути в коде учитывают `import.meta.env.BASE_URL` |
| Временные превью Awwwards | `src/concepts/portfolioReferences.ts`, `public/assets/portfolio-references/` |

В портфолио 5 мастер-классов × 4 композиции. Их состав задаёт `workMasters` в `IndexWorks.tsx`; оформление — `works-*.css` и `carousel-compositions.css`. Выбор дизайнов хранится в состоянии компонентов и сбрасывается при перезагрузке.

## Прокрутка и 3D

| Настройка | Где |
| --- | --- |
| Lenis: `lerp`, чувствительность колеса, исключения для полей | `src/scroll/SmoothScroll.tsx` |
| Программная прокрутка, базовая длительность и easing | `src/scroll/pageScroll.ts` |
| Переход hero → обзор и обратно | `src/concepts/useIndexMorph.ts`, `indexWheelSteps.ts` |
| Остановки между кейсами и секциями, длительность переходов | `src/concepts/useSectionWheelSteps.ts` |
| Основная 3D-сцена: камера, положение, покачивание, курсор | `src/components/MatchedMetalScene.tsx` |
| Геометрия / материалы / текстура сцены | `src/components/matchedMetalGeometry.ts`, `matchedLightingMaterial.ts`, `public/assets/sculpture.png` |
| Альтернативный физический материал | `src/components/MetalLogoScene.tsx`, `metalSceneGeometry.ts`; режим `/?material=physical` |

Основная сцена использует геометрию с UV-текстурой и запечённым освещением. Рендер приостанавливается вне видимой области и в скрытой вкладке. Предусмотрены `prefers-reduced-motion` и fallback при недоступном WebGL.

## Маршруты

- `/` — главная; прежний `/?concept=2/index` также поддерживается.
- `/services/websites/`, `/services/automation/`, `/services/growth/` — услуги.
- `/cases/vesna/`, `/cases/diamond/`, `/cases/shchekino/`, `/cases/silver/` — кейсы.
- `/?concept=1`, `/?concept=2`, `/?concept=3` — экспериментальные hero; `&isolated=1` скрывает панель сравнения.
- Якоря главной: `#studio`, `#work`, `#services`, `#process`, `#about`, `#reviews`, `#contact`.

`scripts/service-pages.mjs` создаёт HTML-входы семи внутренних страниц и задаёт их `<title>`. Контент рендерится в браузере; SSR и prerender отсутствуют. При добавлении услуги или кейса обновить данные и список путей в этом скрипте.

## Формы и проверки

Обе формы (`App.tsx`, `IndexContact.tsx`) скачивают `codeam-brief.txt` через `Blob`. Отправка на сервер, email/CRM и сохранение в browser storage не подключены.

`npm run build` проверяет типы и собирает проект. Test runner, команды `test` и `lint` не настроены.

## Деплой

[GitHub Pages](https://evgenii-barov.github.io/codeam/) · [репозиторий](https://github.com/evgenii-barov/codeam).

`.github/workflows/pages.yml`: push в `main` или ручной запуск → Node.js 22 → `npm ci` → `npm run build:pages` → публикация `dist/`.

Base `/codeam/` задан в команде `build:pages`. При смене имени репозитория изменить base; ссылки и ассеты строятся через `import.meta.env.BASE_URL`.
