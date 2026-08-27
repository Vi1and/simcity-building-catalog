import type { Building } from './types'

export interface CatalogTheme {
  id: string
  label: string
  icon: string
  description: string
  seasons?: readonly number[]
  specializations?: readonly string[]
  keywords?: readonly string[]
}

export const catalogThemes = [
  {
    id: 'japan',
    label: 'Япония',
    icon: '🌸',
    description: 'Токио, Киото, сады и традиционная архитектура',
    seasons: [21, 34, 57],
    keywords: ['япон', 'токио', 'киото', 'сакур', 'самура', 'синто', 'пагод', 'japan', 'tokyo', 'kyoto', 'sakura', 'shinto', 'pagoda'],
  },
  {
    id: 'desert',
    label: 'Пустыня',
    icon: '🏜️',
    description: 'Пирамиды, сфинксы, оазисы и древний Каир',
    seasons: [14, 55],
    keywords: ['пустын', 'пирамид', 'сфинкс', 'каир', 'егип', 'оазис', 'бедуин', 'desert', 'pyramid', 'sphinx', 'cairo', 'egypt', 'oasis', 'bedouin'],
  },
  {
    id: 'europe',
    label: 'Европа',
    icon: '🏛️',
    description: 'Лондон, Париж, Вена и европейская классика',
    seasons: [2, 15, 22, 27, 29, 30, 33, 38, 39, 43, 46, 51, 58, 59, 61, 70, 71],
    keywords: ['лондон', 'париж', 'рим', 'венеци', 'флоренц', 'праг', 'барселон', 'амстердам', 'верон', 'монако', 'венск', 'london', 'paris', 'rome', 'venice', 'florence', 'prague', 'barcelona', 'amsterdam', 'verona', 'monaco', 'vienna'],
  },
  {
    id: 'water',
    label: 'Вода',
    icon: '🌊',
    description: 'Аквапарки, океанариумы, каналы и набережные',
    seasons: [69],
    specializations: ['Пляж'],
    keywords: ['аква', 'водн', 'океан', 'морск', 'море', 'озер', 'речн', 'канал', 'порт', 'гаван', 'причал', 'пляж', 'лагун', 'water', 'aqua', 'ocean', 'sea ', 'lake', 'river', 'canal', 'harbor', 'harbour', 'pier', 'beach', 'lagoon'],
  },
  {
    id: 'attractions',
    label: 'Аттракционы',
    icon: '🎡',
    description: 'Колёса обозрения, горки, цирки и игровые парки',
    specializations: ['Развлечения'],
    keywords: ['аттракцион', 'колесо обозрения', 'американские горки', 'карусел', 'цирк', 'зоопарк', 'игровой парк', 'ferris wheel', 'roller coaster', 'carousel', 'circus', 'zoo', 'amusement', 'funfair'],
  },
  {
    id: 'winter',
    label: 'Зима',
    icon: '❄️',
    description: 'Снег, лёд, северное сияние и уютные праздники',
    seasons: [3, 11, 19, 36, 62],
    keywords: ['зим', 'снеж', 'ледян', 'лёд', 'ледник', 'северное сияние', 'лыж', 'арктич', 'рождеств', 'winter', 'snow', 'ice ', 'glacier', 'aurora', 'ski ', 'arctic', 'christmas'],
  },
  {
    id: 'nature',
    label: 'Природа и парки',
    icon: '🌿',
    description: 'Сады, леса, фермы и зелёные пространства',
    seasons: [5, 6, 17, 23, 24, 63],
    specializations: ['Парки', 'Ландшафтный дизайн'],
    keywords: ['парк', 'сад', 'лес', 'ботан', 'цвет', 'дерев', 'ферм', 'заповед', 'природ', 'park', 'garden', 'forest', 'botanic', 'flower', 'tree', 'farm', 'sanctuary', 'nature'],
  },
  {
    id: 'future',
    label: 'Космос и будущее',
    icon: '🚀',
    description: 'Ракеты, лунные базы, киберпанк и технологии',
    seasons: [26, 52, 64, 66],
    specializations: ['КОСМОС'],
    keywords: ['космос', 'лунн', 'ракет', 'обсерватор', 'спутник', 'марс', 'кибер', 'space', 'lunar', 'moon', 'rocket', 'observatory', 'satellite', 'mars', 'cyber'],
  },
  {
    id: 'palaces',
    label: 'Замки и дворцы',
    icon: '🏰',
    description: 'Крепости, усадьбы, шато и королевские резиденции',
    seasons: [10, 29],
    keywords: ['замок', 'дворец', 'крепост', 'цитадел', 'усадьб', 'помест', 'шато', 'castle', 'palace', 'fortress', 'citadel', 'manor', 'estate', 'chateau'],
  },
  {
    id: 'tropics',
    label: 'Тропики',
    icon: '🌴',
    description: 'Пальмы, курорты, джунгли и островная жизнь',
    seasons: [28, 31, 37, 40, 41, 44, 45, 50, 63],
    keywords: ['тропич', 'пальм', 'курорт', 'джунг', 'остров', 'лагун', 'карнавал', 'tropical', 'palm', 'resort', 'jungle', 'island', 'lagoon', 'carnival'],
  },
  {
    id: 'transport',
    label: 'Транспорт',
    icon: '🚆',
    description: 'Поезда, вокзалы, метро, мосты и аэропорты',
    seasons: [54],
    specializations: ['Общественный транспорт', 'Транспорт'],
    keywords: ['вокзал', 'станци', 'железнодорож', 'поезд', 'метро', 'трамва', 'аэропорт', 'мост', 'шоссе', 'автобус', 'паром', 'канатная дорога', 'railway', 'station', 'train', 'metro', 'tram', 'airport', 'bridge', 'highway', 'bus ', 'ferry', 'cable car'],
  },
  {
    id: 'sports',
    label: 'Спорт',
    icon: '🏟️',
    description: 'Стадионы, арены, гонки и спортивные площадки',
    keywords: ['стадион', 'арена', 'спорт', 'футбол', 'баскетбол', 'теннис', 'гольф', 'каток', 'скейт', 'серф', 'бассейн', 'гонк', 'ипподром', 'stadium', 'arena', 'sport', 'football', 'soccer', 'basketball', 'tennis', 'golf', 'skating', 'skate', 'surf', 'pool', 'racing', 'equestrian'],
  },
] as const satisfies readonly CatalogTheme[]

export type CatalogThemeId = (typeof catalogThemes)[number]['id']

const normalize = (value: string): string =>
  value.normalize('NFKC').toLocaleLowerCase('ru').replace(/ё/g, 'е')

const searchableThemeText = (building: Building): string => normalize([
  building.name,
  ...building.aliases,
  building.originalName,
  building.seasonName,
  building.specialization,
].filter(Boolean).join(' '))

export const buildingMatchesTheme = (building: Building, theme: CatalogTheme): boolean => {
  if (building.season !== null && theme.seasons?.includes(building.season)) return true
  if (building.specialization && theme.specializations?.includes(building.specialization)) return true
  const haystack = searchableThemeText(building)
  return theme.keywords?.some((keyword) => haystack.includes(normalize(keyword))) ?? false
}

export const buildingThemeIds = (building: Building): CatalogThemeId[] =>
  catalogThemes.filter((theme) => buildingMatchesTheme(building, theme)).map((theme) => theme.id)

export const findCatalogTheme = (id: string): CatalogTheme | undefined =>
  catalogThemes.find((theme) => theme.id === id)
