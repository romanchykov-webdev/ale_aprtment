/**
 * Единственный источник истины по контенту лендинга.
 *
 * Модуль намеренно выглядит как бэкенд: наружу торчит одна асинхронная функция
 * fetchListing(), а не голые константы. Когда появится реальное API, меняется
 * только её тело — ни один компонент трогать не придётся.
 *
 * Правило, которое здесь держится: в компонентах не должно быть ни строчки
 * захардкоженного текста. Подписи характеристик, пункты навигации и надписи на
 * кнопках тоже живут в этом файле.
 *
 * ============================ TODO ПЕРЕД ВЫКАТКОЙ ============================
 * Цена, площадь, адрес, телефон, email и класс энергоэффективности ВЫДУМАНЫ.
 * Это правдоподобные заглушки для вёрстки. Заменить на реальные данные до
 * показа объекта клиентам.
 * ============================================================================
 */

/**
 * Итальянская шкала APE после 2015 года. Именно union-тип, а не enum:
 * в tsconfig включён erasableSyntaxOnly, enum там не собирается.
 */
export type EnergyClass =
    | 'A4'
    | 'A3'
    | 'A2'
    | 'A1'
    | 'B'
    | 'C'
    | 'D'
    | 'E'
    | 'F'
    | 'G';

export interface Agent {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    avatarUrl: string;
    /** Подпись под именем — должность, а не системная роль. */
    role: string;
}

/** Короткий факт для бейджа. */
export interface PropertyFeature {
    id: string;
    label: string;
}

/**
 * Характеристика в виде «подпись + значение».
 *
 * value — строка, а не число: сюда одинаково ложатся и «62», и «A2», а
 * форматированием чисел занимается слой данных, не компонент.
 */
export interface PropertyStat {
    id: string;
    label: string;
    value: string;
    unit?: string;
}

export interface Property {
    id: string;
    address: string;
    /** Целое число в валюте currency, без копеек. */
    price: number;
    currency: 'EUR';
    /** Квадратные метры. */
    area: number;
    rooms: number;
    bathrooms: number;
    energyClass: EnergyClass;
    features: readonly PropertyFeature[];
    description: string;
    /** Готовые к показу характеристики шапки. */
    stats: readonly PropertyStat[];
}

/**
 * Двухцветный заголовок из брендбука: первое слово белое, второе золотое.
 * Разбивать строку на слова в компоненте нельзя — где проходит граница,
 * решает редактор текста, а не вёрстка.
 */
export interface RoomTitle {
    lead: string;
    accent: string;
}

export interface Room {
    id: string;
    /** Бирюзовый надзаголовок: номер и тема зоны. */
    overline: string;
    title: RoomTitle;
    description: string;
    stats: readonly PropertyStat[];
    features: readonly PropertyFeature[];
    /** Alt для статичного кадра зоны в режиме prefers-reduced-motion. */
    photoAlt: string;
    /**
     * Кадр, лучше всего представляющий зону неподвижной картинкой.
     *
     * Это выбор фотографии, а не расписание показа: когда появляются панели,
     * решают пропсы FrameObserver в разметке, и выводить их отсюда нельзя.
     */
    stillFrame: number;
}

export interface NavItem {
    id: string;
    label: string;
    href: string;
    /**
     * Доля прокрутки прогулки, 0…1, куда ведёт пункт.
     *
     * Страница — одна длинная сцена без обычных секций, поэтому якорю не к чему
     * привязаться сам по себе. Скруббер расставляет по этим долям невидимые
     * цели, и ссылка начинает работать как обычный якорь.
     */
    at: number;
}

/** Подписи и надписи, которые иначе пришлось бы хардкодить в компонентах. */
export interface UiCopy {
    /** Кнопка звонка в шапке и в карточке агента. */
    callLabel: string;
    emailLabel: string;
    /** Видимая подпись перед ценой. */
    priceLabel: string;
    /** Alt для аватара собирается из имени, а это — запасные инициалы. */
    agentPhotoAlt: string;
    /** Подпись логотипа для скринридеров. */
    brandName: string;
    /** Заголовок скрытого блока для скринридеров и поисковиков. */
    srHeading: string;
    /** Описание канваса прогулки для скринридеров. */
    tourAriaLabel: string;
    /** Подсказка «листайте вниз» на первом экране. */
    scrollHint: string;
    /** Доступное имя основной навигации. */
    navLabel: string;
}

/** Ровно то, что вернёт будущий эндпоинт одним ответом. */
export interface Listing {
    agent: Agent;
    property: Property;
    rooms: readonly Room[];
    nav: readonly NavItem[];
    ui: UiCopy;
}

const AGENT: Agent = {
    id: 'agent-alessandro',
    firstName: 'Alessandro',
    lastName: 'Romanchykov',
    // TODO: выдуманный номер, формат итальянский мобильный.
    phone: '+39 342 698 56 73',
    // TODO: выдуманный адрес почты.
    email: 'alessandro@alessandro-imobilare.it',
    avatarUrl: '/agent.jpg',
    role: 'Агент по недвижимости',
};

const PROPERTY: Property = {
    id: 'property-adriana-42',
    // TODO: выдуманный адрес. Ориентир взят с вывески «Condominio Adriana» в кадре.
    address: 'Via Aldo Moro 14, Alba Adriatica (TE)',
    // TODO: выдуманная цена.
    price: 149000,
    currency: 'EUR',
    // TODO: выдуманная площадь.
    area: 62,
    rooms: 2,
    bathrooms: 1,
    // TODO: выдуманный класс. Шкала APE после 2015 года.
    energyClass: 'B',
    description:
        'Двухкомнатная квартира на верхнем этаже с террасой вдоль всего фасада. ' +
        'Оформлена в едином морском стиле: бело-голубая гамма, плитка и ламинат ' +
        'под состаренное дерево. Дом стоит на перекрёстке, на первом этаже — ' +
        'офис агентства.',
    features: [
        { id: 'terrace', label: 'Терраса вдоль фасада' },
        { id: 'ac', label: 'Кондиционер' },
        { id: 'wardrobe', label: 'Шкаф-купе' },
        { id: 'furnished', label: 'С мебелью и техникой' },
        { id: 'parking', label: 'Парковка у дома' },
    ],
    stats: [
        { id: 'area', label: 'Площадь', value: '62', unit: 'м²' },
        { id: 'rooms', label: 'Комнат', value: '2' },
        { id: 'bathrooms', label: 'Санузел', value: '1' },
        { id: 'energy', label: 'Класс', value: 'B' },
    ],
};

/**
 * Зоны, которые действительно сняты в прогулке, в порядке появления.
 *
 * Отснятый материал покрывает только три из них: экстерьер (кадры 0–36),
 * подъём вдоль фасада и вход внутрь (37–73), кухня-гостиная (74–110), выход
 * через прихожую (111–147) и спальня (148–184). Террасы и санузла в видео
 * нет — фотографии этих зон лежат в 02terassa/ и 05bathroom/, но в клипы не
 * попали. Панелей для них здесь нет намеренно: описывать посетителю комнату,
 * которой он не видит, нельзя. Терраса упомянута среди features объекта.
 *
 * Тексты пересказаны из README папок с фотографиями в тоне брендбука:
 * фактами, короткими фразами, без рекламного нажима.
 */
const ROOMS: readonly Room[] = [
    {
        id: 'exterior',
        overline: '01 · Расположение',
        title: { lead: 'ФАСАД', accent: 'ЗДАНИЯ' },
        description:
            'Пятиэтажный дом песочно-кремового цвета на перекрёстке. Балконы ' +
            'закрыты белыми деревянными ставнями, ограждения кованые. На первом ' +
            'этаже углового фасада — остеклённый офис агентства.',
        stats: [
            { id: 'floors', label: 'Этажей', value: '5' },
            { id: 'floor', label: 'Этаж квартиры', value: '4' },
        ],
        features: [
            { id: 'corner', label: 'Угловое здание' },
            { id: 'shutters', label: 'Деревянные ставни' },
            { id: 'parking', label: 'Парковка у входа' },
        ],
        photoAlt:
            'Фасад пятиэтажного дома песочно-кремового цвета с балконами и деревянными ставнями',
        stillFrame: 8,
    },
    {
        id: 'living',
        overline: '02 · Дневная зона',
        title: { lead: 'КУХНЯ', accent: 'ГОСТИНАЯ' },
        description:
            'Кухня, гостиная и прихожая объединены в одно помещение. Обеденный ' +
            'стол на четверых, диван у стены с цветочным рисунком, бирюзовый ' +
            'застеклённый буфет. Два окна в пол с полупрозрачными шторами.',
        stats: [
            { id: 'seats', label: 'Мест за столом', value: '4' },
            { id: 'windows', label: 'Окна', value: '2' },
        ],
        features: [
            { id: 'fridge', label: 'Ретро-холодильник' },
            { id: 'backsplash', label: 'Фартук плиткой-кабанчиком' },
            { id: 'tv', label: 'Телевизор' },
            { id: 'entrance', label: 'Прихожая с зеркалом' },
        ],
        photoAlt:
            'Объединённая кухня-гостиная в бело-синей гамме с обеденным столом и ретро-холодильником',
        stillFrame: 92,
    },
    {
        id: 'bedroom',
        overline: '03 · Ночная зона',
        title: { lead: 'СПАЛЬНЯ', accent: 'С ГАРДЕРОБОМ' },
        description:
            'Двуспальная кровать с текстилем в морском принте, три декоративных ' +
            'панно над изголовьем. Белый шкаф-купе на две двери во всю стену. ' +
            'Зеркало в полный рост у окна, раздвижная дверь в гостиную.',
        stats: [
            { id: 'beds', label: 'Спальных мест', value: '2' },
            { id: 'wardrobe-doors', label: 'Двери шкафа', value: '2' },
        ],
        features: [
            { id: 'mirror', label: 'Зеркало в полный рост' },
            { id: 'bedroom-tv', label: 'Телевизор на кронштейне' },
            { id: 'bedroom-ac', label: 'Кондиционер' },
        ],
        photoAlt:
            'Спальня с двуспальной кроватью в морском текстиле и белым шкафом-купе',
        stillFrame: 166,
    },
];

const NAV: readonly NavItem[] = [
    { id: 'tour', label: 'Прогулка', href: '#tour', at: 0 },
    { id: 'exterior', label: 'Фасад', href: '#nav-exterior', at: 0.14 },
    { id: 'living', label: 'Гостиная', href: '#nav-living', at: 0.52 },
    { id: 'bedroom', label: 'Спальня', href: '#nav-bedroom', at: 0.94 },
];

const UI: UiCopy = {
    callLabel: 'Позвонить',
    emailLabel: 'Написать',
    priceLabel: 'Цена',
    agentPhotoAlt: 'Фотография агента',
    brandName: 'Alessandro Imobilare',
    srHeading: 'Квартира в морском стиле — видеопрогулка',
    tourAriaLabel:
        'Проход по квартире: фасад дома, терраса, кухня-гостиная, спальня, санузел',
    scrollHint: 'Листайте вниз',
    navLabel: 'Разделы страницы',
};

const LISTING: Listing = {
    agent: AGENT,
    property: PROPERTY,
    rooms: ROOMS,
    nav: NAV,
    ui: UI,
};

/**
 * Здесь появится реальный запрос:
 *
 *   const res = await fetch(`/api/listings/${id}`);
 *   if (!res.ok) throw new Error(`HTTP ${res.status}`);
 *   return (await res.json()) as Listing;
 *
 * Подписи компонентов от этого не изменятся — они уже читают всё из Listing.
 */
export function fetchListing(): Promise<Listing> {
    return Promise.resolve(LISTING);
}

/**
 * Локаль зафиксирована намеренно. Без неё разделители разрядов зависели бы от
 * настроек браузера, и одна и та же цена выглядела бы по-разному у разных
 * посетителей.
 */
const PRICE_FORMAT = new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
});

export function formatPrice(property: Property): string {
    return PRICE_FORMAT.format(property.price);
}

export function agentFullName(agent: Agent): string {
    return `${agent.firstName} ${agent.lastName}`;
}

export function agentInitials(agent: Agent): string {
    return `${agent.firstName.charAt(0)}${agent.lastName.charAt(0)}`;
}

/** Телефон для href="tel:" — без пробелов, которые есть в отображаемом виде. */
export function phoneHref(agent: Agent): string {
    return `tel:${agent.phone.replace(/\s/g, '')}`;
}
