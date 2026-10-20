import type { AmbientColor } from '../concepts/caseAmbient';

export type Project = {
  slug: string; name: string; kind: string; service: string; visual: string;
  description: string; feature: string; scope: string[];
  ambient: AmbientColor;
  cover?: { src: string; alt: string; position?: string };
};
export const projects: Project[] = [
  {
    slug: 'vesna', name: 'Весна', kind: 'Интернет-магазин', service: 'Разработка', visual: 'shop',
    ambient: [112, 128, 185],
    description: 'Магазин с каталогом, карточками товаров и оформлением заказа.',
    feature: 'Корзина, онлайн-оплата и доставка СДЭК',
    scope: ['Каталог и карточки товаров', 'Корзина и оформление заказа', 'Онлайн-оплата и доставка СДЭК'],
  },
  {
    slug: 'diamond', name: 'Diamond', kind: 'Корпоративный сайт', service: 'Редизайн', visual: 'corporate',
    ambient: [181, 112, 123],
    description: 'Обновлённая структура и подача с понятным путём к заявке.',
    feature: 'Единая система страниц и формы обратной связи',
    scope: ['Структура сайта', 'Единая система страниц', 'Формы обратной связи'],
  },
  {
    slug: 'shchekino', name: 'Спецтехника Щёкино', kind: 'Каталог техники', service: 'Разработка', visual: 'catalog',
    ambient: [117, 153, 125],
    description: 'Каталог с фильтрами по торговым маркам и характеристикам моделей.',
    feature: 'Фильтры, карточки моделей и заявка на технику',
    scope: ['Каталог и фильтры', 'Карточки моделей', 'Заявка на технику'],
  },
  {
    slug: 'silver', name: 'Сильвер', kind: 'Сайт бренда', service: 'Разработка', visual: 'brand',
    ambient: [149, 158, 180],
    description: 'Сайт с акцентом на продукте и материалах бренда.',
    feature: 'Адаптивные страницы и материалы о продукте',
    scope: ['Подача продукта', 'Адаптивные страницы', 'Материалы бренда'],
  },
];

export const caseHref = (slug: string) => `${import.meta.env.BASE_URL}cases/${slug}/`;
export function caseFromLocation() {
  const path = location.pathname.replace(import.meta.env.BASE_URL, '').replace(/^\/+|\/+$/g, '');
  return projects.find(project => path === `cases/${project.slug}`);
}
