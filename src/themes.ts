import type { Building } from './types'

export interface CatalogTheme {
  id: string
  label: string
  icon: string
  description: string
  seasons?: readonly number[]
  specializations?: readonly string[]
  keywords?: readonly string[]
  keywordPrefixes?: readonly string[]
  includeNames?: readonly string[]
  excludeNames?: readonly string[]
}

export const catalogThemes = [
  {
    id: 'japan',
    label: 'Япония',
    icon: '🌸',
    description: 'Токио, Киото, сакура и традиционная архитектура',
    seasons: [21, 34, 57],
    keywordPrefixes: ['япон', 'токио', 'киото', 'сакур', 'самура', 'синто', 'пагод', 'japan', 'tokyo', 'kyoto', 'sakura', 'shinto', 'pagoda'],
  },
  {
    id: 'desert',
    label: 'Пустыня',
    icon: '🏜️',
    description: 'Пирамиды, сфинксы, оазисы, базары и съёмочные декорации',
    seasons: [14, 55],
    keywordPrefixes: ['пустын', 'пирамид', 'сфинкс', 'каир', 'егип', 'оазис', 'бедуин', 'верблю', 'desert', 'pyramid', 'sphinx', 'cairo', 'egypt', 'oasis', 'bedouin', 'camel'],
    includeNames: ['Съем.площадка "Загадка мумии"'],
    excludeNames: ['Дорога над заливом (пляж)'],
  },
  {
    id: 'water',
    label: 'Вода',
    icon: '🌊',
    description: 'Аквапарки, океанариумы, морские центры, порты и пляжи',
    seasons: [69],
    keywords: ['море', 'порт', 'гавань', 'бухта', 'причал', 'залив', 'река', 'водопад', 'маяк', 'дельта', 'кит', 'киты', 'кита', 'китов', 'китами', 'sea', 'port', 'harbor', 'harbour', 'pier', 'bay', 'river', 'waterfall', 'lighthouse', 'delta'],
    keywordPrefixes: ['аква', 'водн', 'океан', 'морск', 'речн', 'плавуч', 'подвод', 'пляж', 'лагун', 'канал', 'озер', 'остров', 'портов', 'лодк', 'катер', 'корабл', 'яхт', 'круизн', 'субмарин', 'дельфин', 'акул', 'риф', 'коралл', 'затопл', 'набережн', 'aqua', 'ocean', 'marine', 'aquatic', 'underwater', 'beach', 'lagoon', 'canal', 'lake', 'island', 'boat', 'ship', 'yacht', 'cruise', 'submarine', 'whale', 'dolphin', 'shark', 'reef', 'coral', 'sunken', 'waterfront'],
    includeNames: ['крепость Олафсборг (пляж)'],
    excludeNames: [
      'Змей фьордов',
      'Плавучие поля',
      'Прокат велосипедов',
      'Терминал для гироскутеров',
      'Стоянка тук-туков',
      'Станция проката квадроциклов',
      'Стоянка такси',
      'Станция монорельса',
      'Стадион "Золотой гол"',
      'Космопорт',
    ],
  },
  {
    id: 'attractions',
    label: 'Аттракционы',
    icon: '🎡',
    description: 'Горки, карусели, киносъёмки, фестивали и игровые площадки',
    seasons: [16],
    keywords: ['колесо обозрения', 'американские горки', 'место посадки нло', 'гавайская вечеринка', 'музыкальный фестиваль simcity', 'ferris wheel', 'roller coaster', 'ufo landing site', 'hawaiian party'],
    keywordPrefixes: ['аттракцион', 'карусел', 'цирк', 'зоопарк', 'карнавал', 'фестивал', 'съем', 'съём', 'amusement', 'carousel', 'circus', 'zoo', 'carnival', 'festival', 'film set', 'movie set'],
    includeNames: ['Королевство приключений', 'Бамперные машинки', 'Башня свободного падения', 'Водные горки', 'Ворота киностудии', 'Канатный парк на деревьях'],
    excludeNames: ['Останцы "Рукавицы" и "Меррик"', 'Стадион "Золотой гол"'],
  },
  {
    id: 'mystic',
    label: 'Мистика',
    icon: '👻',
    description: 'Мистические преображения, призраки, ведьмы и другие сверхъестественные объекты',
    seasons: [60],
    keywordPrefixes: ['призрач', 'привиден', 'приведен', 'заколдован', 'проклят', 'жутк', 'страшн', 'вампир', 'оборотн', 'зомб', 'кладбищ', 'паранормальн', 'тыкв', 'ведьм', 'гроб', 'ужас', 'ghost', 'haunt', 'spooky', 'vampire', 'werewolf', 'zombie', 'cemetery', 'paranormal', 'pumpkin', 'witch', 'coffin', 'horror'],
    includeNames: ['Брошенная ферма', 'Зов сирены', 'Кракен', 'Летучий голандец', 'Разрушенная колокольня', 'Затопленная деревня', 'Поместье недавно умерших', 'Охотники за сверхъестественным', 'Центр помощи привидениям'],
  },
  {
    id: 'fountains',
    label: 'Фонтаны',
    icon: '⛲',
    description: 'Городские, праздничные, волшебные и природные фонтаны',
    keywordPrefixes: ['фонтан', 'fountain', 'fontana'],
  },
  {
    id: 'winter',
    label: 'Зима',
    icon: '❄️',
    description: 'Только снежные, ледовые, лыжные и рождественские объекты',
    keywords: ['северное сияние', 'замерзшее озеро', 'замёрзшее озеро', 'горнолыжный курорт', 'northern lights', 'frozen lake', 'ski resort'],
    keywordPrefixes: ['зим', 'снеж', 'ледян', 'ледов', 'ледник', 'лыж', 'арктич', 'рождеств', 'санта', 'олен', 'каток', 'хоккей', 'конькобеж', 'керлинг', 'кёрлинг', 'бобсл', 'лапланд', 'winter', 'snow', 'icy', 'ice', 'glacier', 'ski', 'arctic', 'christmas', 'santa', 'reindeer', 'hockey', 'curling', 'bobsled', 'lapland'],
    includeNames: ['Дом северного сияния', 'Дом Северного сияния', 'Езда на собаках'],
    excludeNames: ['Парк с оленями', 'Пляж Санты К. (пляж)', 'Весенний экспресс', 'Праздник на берегу', 'Курорт с горячими источниками'],
  },
  {
    id: 'autumn',
    label: 'Осень',
    icon: '🍂',
    description: 'Золотая листва, клёны, урожай и тёплые осенние пейзажи',
    seasons: [17],
    keywordPrefixes: ['осен', 'клен', 'клён', 'урожай', 'autumn', 'maple', 'harvest', 'fall'],
  },
  {
    id: 'farms',
    label: 'Фермы',
    icon: '🚜',
    description: 'Фермерская и деревенская жизнь, амбары, пастбища и мельницы',
    seasons: [23, 24],
    keywordPrefixes: ['ферм', 'сельск', 'деревен', 'амбар', 'пастбищ', 'птичник', 'свинар', 'мельниц', 'ранчо', 'farm', 'farmhouse', 'barn', 'pasture', 'poultry', 'pig pen', 'windmill', 'ranch', 'rustic village'],
  },
  {
    id: 'nature',
    label: 'Природа и парки',
    icon: '🌿',
    description: 'Сады, леса, фермы, заповедники и зелёные пространства',
    specializations: ['Парки', 'Ландшафтный дизайн'],
    keywordPrefixes: ['парк', 'сад', 'лес', 'ботан', 'цвет', 'дерев', 'ферм', 'заповед', 'природ', 'рощ', 'park', 'garden', 'forest', 'botanic', 'flower', 'tree', 'farm', 'sanctuary', 'nature', 'grove'],
  },
  {
    id: 'animals',
    label: 'Животные',
    icon: '🐾',
    description: 'Питомцы, заповедники, фермерские животные и места наблюдения за дикой природой',
    seasons: [67],
    keywords: ['кот', 'пони', 'кит', 'animal sanctuary', 'pet supply store', 'pet activity park', 'pet park', 'petting zoo'],
    keywordPrefixes: [
      'животн', 'питомц', 'ветеринар', 'зоопарк', 'кошач', 'щен', 'собак', 'лошад', 'конюш',
      'коров', 'коз', 'свинар', 'овеч', 'олен', 'птичник', 'кенгур', 'коал', 'черепах', 'гепард',
      'дельфин', 'акул', 'рептил', 'animal', 'pet', 'veterinar', 'zoo', 'dog', 'puppy', 'horse',
      'stable', 'cow', 'goat', 'pig pen', 'sheep', 'deer', 'poultry', 'kangaroo', 'koala', 'turtle',
      'cheetah', 'dolphin', 'shark', 'reptile',
    ],
    includeNames: [
      'Верный друг',
      'Башня для наблюдения за китами',
      'Зона наблюдения за китами (пляж)',
      'Катер для наблюдения за дельфинами',
      'Остров дельфин',
      'Контактный зоопарк',
      'Экскурсия с акулами',
    ],
  },
  {
    id: 'trees',
    label: 'Деревья и кусты',
    icon: '🌳',
    description: 'Деревья, рощи, кустарники, топиарии и дома среди крон',
    keywordPrefixes: ['дерев', 'куст', 'рощ', 'топиар', 'tree', 'bush', 'grove', 'topiary'],
  },
  {
    id: 'future',
    label: 'Космос и будущее',
    icon: '🚀',
    description: 'Ракеты, лунные базы, киберпанк и технологии будущего',
    seasons: [64, 66],
    specializations: ['КОСМОС'],
    keywordPrefixes: ['космос', 'лунн', 'ракет', 'обсерватор', 'спутник', 'марс', 'кибер', 'неон', 'space', 'lunar', 'moon', 'rocket', 'observatory', 'satellite', 'mars', 'cyber', 'neon'],
  },
  {
    id: 'alpha',
    label: 'Альфа-город',
    icon: '🔷',
    description: 'Архитектура, наука и инфраструктура Альфа-города',
    seasons: [26, 52],
    keywordPrefixes: ['альфа', 'alpha'],
  },
  {
    id: 'palaces',
    label: 'Замки и дворцы',
    icon: '🏰',
    description: 'Крепости, дворцы, усадьбы, шато и королевские резиденции',
    seasons: [29],
    keywordPrefixes: ['замок', 'дворец', 'крепост', 'цитадел', 'усадьб', 'помест', 'шато', 'castle', 'palace', 'fortress', 'citadel', 'manor', 'estate', 'chateau'],
    excludeNames: [
      'Гигантский песчаный замок',
      'Сьем.площадка "Замок с привидениями"',
      'Дворец "Четвероногий друг"',
      'Дворцовая пристань',
      'Дворец кино',
    ],
  },
  {
    id: 'tropics',
    label: 'Тропики и острова',
    icon: '🌴',
    description: 'Пальмы, джунгли, кораллы, лагуны и тёплые острова',
    keywords: ['пхи-пхи', 'канкун', 'гавайи', 'карибы', 'коста-рика', 'райский остров', 'остров дельфин', 'phi phi', 'cancun', 'hawaii', 'caribbean', 'costa rica', 'paradise island', 'dolphin island'],
    keywordPrefixes: ['тропич', 'пальм', 'джунг', 'коралл', 'лагун', 'луау', 'tropical', 'palm', 'jungle', 'rainforest', 'coral', 'lagoon', 'luau'],
    includeNames: ['Острова Пхи-Пхи (пляж)', 'Пляж Кехена', 'Пляж Кауиты', 'Тропический лес', 'Коралловые острова'],
    excludeNames: ['Голубой замок', 'Курорт "Крона" (гора)', 'Альфа-курорт в горах', 'Комплекс "Лапландия"', 'Курорт с горячими источниками'],
  },
  {
    id: 'transport',
    label: 'Транспорт',
    icon: '🚆',
    description: 'Поезда, вокзалы, метро, аэропорты и городская мобильность',
    seasons: [54],
    specializations: ['Общественный транспорт', 'Транспорт'],
    keywords: ['канатная дорога', 'железная дорога', 'вертолетная площадка', 'вертолётная площадка', 'cable car', 'railway', 'train station', 'bus terminal', 'taxi stop', 'helipad'],
    keywordPrefixes: ['вокзал', 'железнодорож', 'поезд', 'метро', 'трамва', 'аэропорт', 'автобус', 'паром', 'монорельс', 'велодорож', 'train', 'metro', 'tram', 'airport', 'ferry', 'monorail'],
    excludeNames: ['Призрачный портал', 'Комплекс газометров', 'Тауэрский мост', 'Романтичная поездка на карете', 'Поездка на снегоходе', 'Поездка на оленьих упряжках'],
  },
  {
    id: 'bridges',
    label: 'Мосты',
    icon: '🌉',
    description: 'Исторические, городские, пешеходные и железнодорожные мосты',
    keywords: ['пон-неф', 'пон-нёф', 'ponte', 'pont neuf'],
    keywordPrefixes: ['мост', 'bridge'],
  },
  {
    id: 'sports',
    label: 'Спорт',
    icon: '🏟️',
    description: 'Стадионы, арены, катки, гонки и спортивные площадки',
    keywordPrefixes: ['стадион', 'арена', 'спорт', 'футбол', 'баскетбол', 'теннис', 'гольф', 'каток', 'скейт', 'серф', 'бассейн', 'гонк', 'ипподром', 'хоккей', 'керлинг', 'кёрлинг', 'stadium', 'arena', 'sport', 'football', 'soccer', 'basketball', 'tennis', 'golf', 'skating', 'skate', 'surf', 'pool', 'racing', 'equestrian', 'hockey', 'curling'],
  },
  {
    id: 'usa',
    label: 'США',
    icon: '🇺🇸',
    description: 'Нью-Йорк, Чикаго, Флорида, шоссе 66 и американская городская культура',
    seasons: [1, 25, 31, 42, 56],
    keywordPrefixes: ['америк', 'нью йорк', 'чикаг', 'флорид', 'голливуд', 'лас вегас', 'сан франциск', 'лос анджелес', 'майами', 'бостон', 'america', 'american', 'new york', 'chicago', 'florida', 'hollywood', 'las vegas', 'san francisco', 'los angeles', 'miami', 'boston', 'route 66'],
  },
  {
    id: 'australia',
    label: 'Австралия',
    icon: '🇦🇺',
    description: 'Сидней, австралийская глубинка, кенгуру, коалы и природные памятники',
    seasons: [13, 45],
    keywordPrefixes: ['австрал', 'сидней', 'кенгур', 'коал', 'улуру', 'austral', 'sydney', 'kangaroo', 'koala', 'uluru', 'outback'],
  },
  {
    id: 'china',
    label: 'Китай',
    icon: '🇨🇳',
    description: 'Год Быка, Гонконг, китайский Новый год, фонари и традиционная архитектура',
    seasons: [12, 48],
    keywords: ['год быка', 'год крысы', 'год тигра', 'год кролика', 'год дракона', 'год свиньи', 'year of the ox', 'year of the rat', 'year of the tiger', 'year of the rabbit', 'year of the dragon', 'year of the pig'],
    keywordPrefixes: ['китай', 'гонконг', 'пекин', 'шанхай', 'юньнан', 'фонар', 'танцующие дракон', 'танцующие льв', 'china', 'chinese', 'hong kong', 'beijing', 'shanghai', 'yunnan', 'lantern', 'dragon dance', 'lion dance'],
  },
  {
    id: 'italy',
    label: 'Италия',
    icon: '🇮🇹',
    description: 'Венеция, Рим, Флоренция и Верона',
    seasons: [2, 15, 30, 51],
    keywords: ['rome', 'roman'],
    keywordPrefixes: ['венеци', 'римск', 'флоренц', 'верон', 'venice', 'venetian', 'florence', 'verona'],
    includeNames: ['Балкон Ромео и Джульетты', 'Итальянский ресторан', 'Тосканская вилла', 'Большая тосканская вилла', 'Понте-Веккью'],
  },
  {
    id: 'france',
    label: 'Франция',
    icon: '🇫🇷',
    description: 'Парижские бульвары, дворцы, музеи и сады',
    seasons: [22],
    keywordPrefixes: ['париж', 'франц', 'paris', 'french'],
    includeNames: ['Люксембургский сад', 'Пон-Нёф (мост)', 'Мост Александра III'],
  },
  {
    id: 'spain',
    label: 'Испания',
    icon: '🇪🇸',
    description: 'Испанские замки и архитектура Барселоны',
    seasons: [29, 43],
    keywordPrefixes: ['испан', 'барселон', 'каталон', 'spanish', 'spain', 'barcelona', 'catalan'],
    includeNames: ['Побле-Эспаньол'],
  },
  {
    id: 'germany',
    label: 'Германия',
    icon: '🇩🇪',
    description: 'Мюнхен, Октоберфест и немецкая архитектура',
    seasons: [59],
    keywordPrefixes: ['герман', 'немец', 'мюнхен', 'бавар', 'октоберфест', 'german', 'munich', 'bavaria', 'oktoberfest'],
    includeNames: ['Замок Хоэншвангау (гора)', 'Дворец Нимфенбург'],
  },
  {
    id: 'britain',
    label: 'Великобритания',
    icon: '🇬🇧',
    description: 'Лондон, английские сады и британские достопримечательности',
    seasons: [33],
    keywordPrefixes: ['лондон', 'английск', 'британ', 'london', 'english', 'british'],
    includeNames: ['Королевский Альберт Холл', 'Парковка на улице Уэлбек'],
  },
  {
    id: 'scandinavia',
    label: 'Скандинавия, Ирландия и Север',
    icon: '🇳🇴',
    description: 'Норвегия, Финляндия, Исландия, Ирландия и архитектура европейского Севера',
    seasons: [19, 32, 36, 39, 61],
    keywordPrefixes: ['норвеж', 'финск', 'исланд', 'ирланд', 'швед', 'датск', 'скандинав', 'викинг', 'драккар', 'лапланд', 'norway', 'norwegian', 'finland', 'finnish', 'iceland', 'ireland', 'irish', 'sweden', 'swedish', 'denmark', 'danish', 'scandinav', 'viking', 'longship', 'lapland'],
    includeNames: ['Переулок Шэмрок', 'Фонтан святого Патрика'],
  },
  {
    id: 'central-europe',
    label: 'Центральная Европа',
    icon: '🇦🇹',
    description: 'Австрия, Чехия, Швейцария, Вена и Прага',
    seasons: [38, 70],
    keywordPrefixes: ['австри', 'венск', 'чешск', 'пражск', 'швейцар', 'austria', 'austrian', 'vienna', 'czech', 'prague', 'swiss', 'zurich', 'geneva'],
    includeNames: ['Жижковская телебашня', 'Комплекс газометров', 'Дворец Хофбург'],
  },
  {
    id: 'netherlands',
    label: 'Нидерланды',
    icon: '🇳🇱',
    description: 'Амстердамские каналы, музеи и городские кварталы',
    seasons: [46],
    keywordPrefixes: ['амстердам', 'нидерланд', 'голланд', 'amsterdam', 'netherlands', 'dutch', 'holland'],
    includeNames: ['Консертгебау'],
  },
  {
    id: 'monaco',
    label: 'Монако',
    icon: '🇲🇨',
    description: 'Казино, гавани, виллы и архитектура Монако',
    seasons: [58],
    keywordPrefixes: ['монако', 'монте карло', 'monaco', 'monte carlo'],
  },
] as const satisfies readonly CatalogTheme[]

export type CatalogThemeId = (typeof catalogThemes)[number]['id']

const normalize = (value: string): string => value
  .normalize('NFKC')
  .toLocaleLowerCase('ru')
  .replace(/ё/g, 'е')
  .replace(/[^a-zа-я0-9]+/gi, ' ')
  .trim()

const normalizeName = (value: string): string => normalize(
  value.replace(/\s*\((?:пляж|гора)\)\s*$/iu, ''),
)

const normalizedNames = (building: Building): string[] => [
  building.name,
  ...building.aliases,
  building.originalName,
].filter((value): value is string => Boolean(value)).map(normalizeName)

const matchesName = (names: readonly string[], candidates?: readonly string[]): boolean =>
  candidates?.some((candidate) => names.includes(normalizeName(candidate))) ?? false

const matchesKeyword = (haystack: string, keyword: string): boolean =>
  ` ${haystack} `.includes(` ${normalize(keyword)} `)

const matchesPrefix = (words: readonly string[], prefix: string): boolean => {
  const normalizedPrefix = normalize(prefix)
  return normalizedPrefix.includes(' ')
    ? matchesKeyword(words.join(' '), normalizedPrefix)
    : words.some((word) => word.startsWith(normalizedPrefix))
}

export const buildingMatchesTheme = (building: Building, theme: CatalogTheme): boolean => {
  const names = normalizedNames(building)
  if (matchesName(names, theme.excludeNames)) return false
  if (matchesName(names, theme.includeNames)) return true
  if (building.season !== null && theme.seasons?.includes(building.season)) return true
  if (building.specialization && theme.specializations?.includes(building.specialization)) return true

  const haystack = names.join(' ')
  const words = haystack.split(' ').filter(Boolean)
  if (theme.keywords?.some((keyword) => matchesKeyword(haystack, keyword))) return true
  return theme.keywordPrefixes?.some((prefix) => matchesPrefix(words, prefix)) ?? false
}

export const buildingThemeIds = (building: Building): CatalogThemeId[] =>
  catalogThemes.filter((theme) => buildingMatchesTheme(building, theme)).map((theme) => theme.id)

export const findCatalogTheme = (id: string): CatalogTheme | undefined =>
  catalogThemes.find((theme) => theme.id === id)
