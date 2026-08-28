import { describe, expect, it } from 'vitest'
import catalogJson from './data/catalog.json'
import { buildingMatchesTheme, buildingThemeIds, findCatalogTheme } from './themes'
import type { Building, CatalogData } from './types'

const catalog = catalogJson as CatalogData

const building = (patch: Partial<Building>): Building => ({
  id: 'test',
  section: 'other',
  code: 1,
  name: 'Тестовое здание',
  aliases: [],
  originalName: null,
  image: null,
  images: [],
  footprint: { kind: 'grid', label: '2 × 2', width: 2, depth: 2, length: null, cells: 4 },
  boost: { kind: 'populationPercent', label: '10', min: 10, max: 10, sortValue: 10 },
  season: null,
  seasonName: null,
  released: null,
  tier: null,
  passType: null,
  event: null,
  effectDescription: null,
  isFeatured: false,
  traits: [],
  specialization: null,
  effectArea: null,
  availability: null,
  ...patch,
})

const namesForTheme = (id: string): string[] => {
  const theme = findCatalogTheme(id)
  if (!theme) throw new Error(`Unknown test theme: ${id}`)
  return catalog.buildings
    .filter((candidate) => buildingMatchesTheme(candidate, theme))
    .map((candidate) => candidate.name)
}

describe('thematic catalog', () => {
  it('assigns buildings by season and allows overlapping themes', () => {
    const ids = buildingThemeIds(building({ season: 57, name: 'Сад сакуры' }))
    expect(ids).toContain('japan')
    expect(ids).toContain('nature')
  })

  it('assigns buildings by meaning in Russian and English names', () => {
    expect(buildingThemeIds(building({ name: 'Городской аквапарк' }))).toContain('water')
    expect(buildingThemeIds(building({ originalName: 'Grand Ferris Wheel' }))).toContain('attractions')
  })

  it('finds a theme only by a valid stable id', () => {
    expect(findCatalogTheme('desert')?.label).toBe('Пустыня')
    expect(findCatalogTheme('unknown')).toBeUndefined()
  })

  it('keeps the water selection about water instead of matching transport substrings', () => {
    const names = namesForTheme('water')
    expect(names).toEqual(expect.arrayContaining([
      'Морской центр Альфа',
      'Курорт Водный купол',
      'крепость Олафсборг (пляж)',
      'Порт Геркулеса',
    ]))
    for (const unrelatedName of [
      'Змей фьордов',
      'Терминал для гироскутеров',
      'Стоянка тук-туков',
      'Стоянка такси',
      'Прокат велосипедов',
      'Стадион "Золотой гол"',
      'Станция проката квадроциклов',
      'Станция монорельса',
      'Космопорт',
      'Роллердром (пляж)',
      'Колесо обозрения  (пляж)',
      'Вертолетная площадка Монако',
      'Авеню звезд',
      'Киоски с китайской едой',
      'Китайский театр',
      'Плавучие поля',
    ]) {
      expect(names).not.toContain(unrelatedName)
    }
  })

  it('keeps attractions intentional and sends the stadium to sport', () => {
    const attractions = namesForTheme('attractions')
    expect(attractions).toEqual(expect.arrayContaining([
      'Американские горки «Вулкан»',
      'Съем.площадка "Загадка мумии"',
      'Место посадки НЛО',
      'Гавайская вечеринка',
      'Карнавал в честь дракона',
      'Музыкальный фестиваль SimCity',
      'Дом с привидениями',
      'Королевство приключений',
      'Бамперные машинки',
      'Башня свободного падения',
      'Водные горки',
      'Канатный парк на деревьях',
    ]))
    expect(attractions).not.toContain('Останцы "Рукавицы" и "Меррик"')
    expect(attractions).not.toContain('Стадион "Золотой гол"')
    expect(namesForTheme('sports')).toContain('Стадион "Золотой гол"')
    expect(namesForTheme('desert')).toContain('Съем.площадка "Загадка мумии"')
  })

  it('limits winter and tropics to visibly matching buildings', () => {
    const winter = namesForTheme('winter')
    expect(winter).toEqual(expect.arrayContaining([
      'Замок Санты',
      'Зимний ресторанчик',
      'Ледовый отель',
      'Комплекс "Лапландия"',
      'Хоккей на озере',
      'Трасса для бобслея',
      'Поездка на оленьих упряжках',
    ]))
    for (const unrelatedName of [
      'Столовая',
      'Казино "Фишка и кубик"',
      'Торговец шёлком',
      'Таверна «Скачущий заяц»',
      'Институт космических исследований',
      'Галерея "Венеция"',
      'Пляж Санты К. (пляж)',
      'Весенний экспресс',
      'Праздник на берегу',
      'Курорт с горячими источниками',
      'Парк с оленями',
    ]) {
      expect(winter).not.toContain(unrelatedName)
    }

    const tropics = namesForTheme('tropics')
    expect(tropics).toEqual(expect.arrayContaining(['Тропический лес', 'Коралловые острова', 'Гавайская вечеринка']))
    expect(tropics).not.toContain('Голубой замок')
    expect(tropics).not.toContain('Курорт "Крона" (гора)')
  })

  it('fills the new mood, nature and regional collections with intentional buildings', () => {
    expect(namesForTheme('mystic')).toEqual(expect.arrayContaining([
      'Абсолютно обычная библиотека',
      'Абсолютно обычная пещера',
      'Абсолютно обычный маяк (пляж)',
      'Абсолютно обычный пикник',
      'Дом с привидениями',
      'Призрачный портал',
    ]))
    expect(namesForTheme('fountains')).toEqual(expect.arrayContaining([
      'Фонтан Треви',
      'Волшебный фонтан Монжуик',
      'Фонтан святого Патрика',
    ]))
    expect(namesForTheme('usa')).toEqual(expect.arrayContaining(['Бродвей', 'Чикагская башня']))
    expect(namesForTheme('farms')).toEqual(expect.arrayContaining(['Старый фермерский дом', 'Центр деревни', 'Удивительный амбар']))
    expect(namesForTheme('autumn')).toEqual(expect.arrayContaining(['Осенний сад', 'Центральный парк (север)', 'Клены в форме сердца']))
    expect(namesForTheme('australia')).toEqual(expect.arrayContaining(['Улуру', 'Австралийский музей']))
    expect(namesForTheme('china')).toEqual(expect.arrayContaining(['Год быка', 'Киоски с китайской едой']))
    expect(namesForTheme('trees')).toEqual(expect.arrayContaining(['Дерево-Пламбоб', 'Канатный парк на деревьях']))
  })

  it('separates bridges, transport, Alpha City and European regions', () => {
    const transport = namesForTheme('transport')
    expect(transport).toContain('Вертолётная площадка')
    expect(transport).not.toContain('Призрачный портал')
    expect(transport).not.toContain('Комплекс газометров')
    expect(transport).not.toContain('Тауэрский мост')
    expect(transport).not.toContain('Романтичная поездка на карете')
    expect(transport).not.toContain('Поездка на снегоходе')
    expect(transport).not.toContain('Поездка на оленьих упряжках')
    expect(namesForTheme('bridges')).toContain('Тауэрский мост')
    expect(namesForTheme('alpha')).toEqual(expect.arrayContaining(['Альфа-музей', 'Морской центр Альфа']))

    const europeanThemeIds = [
      'italy',
      'france',
      'spain',
      'germany',
      'britain',
      'scandinavia',
      'central-europe',
      'netherlands',
      'monaco',
    ]
    for (const themeId of europeanThemeIds) {
      expect(namesForTheme(themeId)).not.toContain('Космодром')
    }
    expect(namesForTheme('central-europe')).not.toContain('Австралийский музей')
    expect(namesForTheme('italy')).toContain('Балкон Ромео и Джульетты')
    expect(namesForTheme('italy')).toContain('Понте-Веккью')
    expect(namesForTheme('italy')).not.toContain('Романтический парк')
    expect(namesForTheme('france')).toContain('Пон-Нёф (мост)')
    expect(namesForTheme('germany')).toContain('Дворец Нимфенбург')
    expect(namesForTheme('britain')).toContain('Королевский Альберт Холл')
    expect(namesForTheme('scandinavia')).toContain('Музей драккаров')
    expect(namesForTheme('scandinavia')).toContain('Переулок Шэмрок')
    expect(namesForTheme('central-europe')).toContain('Дворец Хофбург')
    expect(namesForTheme('netherlands')).toContain('Консертгебау')
    expect(namesForTheme('monaco')).toContain('Опера Монте-Карло')
  })

  it('keeps Gardencourt Estate in the palace collection', () => {
    const palaces = namesForTheme('palaces')
    expect(palaces).toContain('Поместье Гарденкорт')
    expect(palaces).not.toContain('Дворец "Четвероногий друг"')
    expect(palaces).not.toContain('Дворцовая пристань')
    expect(palaces).not.toContain('Дворец кино')
  })
})
