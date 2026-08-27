import type { Building, BuildingBoost, Section, SectionFilters, SortMode } from './types'

export const russianCollator = new Intl.Collator('ru', {
  numeric: true,
  sensitivity: 'base',
})

const monthNumbers: Record<string, number> = {
  январь: 1,
  февраль: 2,
  март: 3,
  апрель: 4,
  май: 5,
  июнь: 6,
  июль: 7,
  август: 8,
  сентябрь: 9,
  октябрь: 10,
  ноябрь: 11,
  декабрь: 12,
}

export const defaultFilters = (section: Section): SectionFilters => ({
  query: '',
  season: 'all',
  specialization: 'all',
  theme: 'all',
  footprint: 'all',
  featuredOnly: false,
  sort: section === 'mayor' ? 'season-desc' : 'boost-desc',
})

export const normalizeSearch = (value: string): string =>
  value
    .normalize('NFKC')
    .toLocaleLowerCase('ru')
    .replace(/ё/g, 'е')
    .replace(/[×х]/g, 'x')
    .replace(/[^a-zа-я0-9]+/gi, ' ')
    .trim()

export const formatFootprint = (building: Building): string => {
  if (building.footprint.kind === 'unknown') return 'Размер неизвестен'
  if (building.footprint.kind === 'linear') {
    const length = building.footprint.length
    return length === null
      ? 'Линейный объект'
      : `Длина · ${length} ${length === 1 ? 'клетка' : length >= 2 && length <= 4 ? 'клетки' : 'клеток'}`
  }
  const { width, depth, cells } = building.footprint
  if (width === null || depth === null || cells === null) return 'Размер неизвестен'
  const cellWord = cells % 10 === 1 && cells % 100 !== 11 ? 'клетка' : cells % 10 >= 2 && cells % 10 <= 4 && (cells % 100 < 10 || cells % 100 >= 20) ? 'клетки' : 'клеток'
  return `${width} × ${depth} │ ${cells} ${cellWord}`
}

const simpleNumber = (value: number): string =>
  Number.isInteger(value) ? String(value) : String(value).replace('.', ',')

export const formatBoost = (boost: BuildingBoost): string => {
  if (boost.kind === 'unknown' || boost.min === null || boost.max === null) return 'Бонус неизвестен'
  const value = boost.min === boost.max
    ? simpleNumber(boost.max)
    : `${simpleNumber(boost.min)}–${simpleNumber(boost.max)}`
  if (boost.kind === 'capacity') return `Вместимость · ${value}`
  if (boost.max === 0) return 'Без бонуса'
  return `+${value}% к населению`
}

export const footprintKey = (building: Building): string =>
  building.footprint.kind === 'grid'
    ? `${building.footprint.width}x${building.footprint.depth}`
    : building.footprint.kind === 'linear'
      ? `linear-${building.footprint.length}`
      : 'unknown'

export const releaseOrder = (released: string | null): number | null => {
  if (!released) return null
  const normalized = normalizeSearch(released)
  const yearMatch = normalized.match(/(?:19|20)\d{2}/)
  if (!yearMatch) return null
  const year = Number(yearMatch[0])
  const month = Object.entries(monthNumbers).find(([name]) => normalized.includes(name))?.[1] ?? 1
  return year * 100 + month
}

const compareNullable = (
  left: number | null,
  right: number | null,
  direction: 'asc' | 'desc',
): number => {
  if (left === null && right === null) return 0
  if (left === null) return 1
  if (right === null) return -1
  return direction === 'asc' ? left - right : right - left
}

export const compareBuildings = (left: Building, right: Building, sort: SortMode): number => {
  let result = 0
  switch (sort) {
    case 'season-asc':
      result = compareNullable(left.season, right.season, 'asc')
      break
    case 'season-desc':
      result = compareNullable(left.season, right.season, 'desc')
      break
    case 'boost-asc':
      result = compareNullable(left.boost.sortValue, right.boost.sortValue, 'asc')
      break
    case 'boost-desc':
      result = compareNullable(left.boost.sortValue, right.boost.sortValue, 'desc')
      break
    case 'released-asc':
      result = compareNullable(releaseOrder(left.released), releaseOrder(right.released), 'asc')
      break
    case 'released-desc':
      result = compareNullable(releaseOrder(left.released), releaseOrder(right.released), 'desc')
      break
    case 'name-asc':
      break
  }

  if (result !== 0) return result
  return russianCollator.compare(left.name, right.name)
}

const searchableText = (building: Building): string =>
  normalizeSearch(
    [
      building.name,
      ...building.aliases,
      building.originalName,
      building.season,
      building.seasonName,
      building.specialization,
      building.released,
      building.event,
    ]
      .filter(Boolean)
      .join(' '),
  )

export interface CatalogQuery {
  section: Section | 'all'
  filters: SectionFilters
  favoriteIds?: ReadonlySet<string>
  favoritesOnly?: boolean
  popularOnly?: boolean
}

export const filterAndSortBuildings = (
  buildings: readonly Building[],
  query: CatalogQuery,
): Building[] => {
  const normalizedQuery = normalizeSearch(query.filters.query)
  const terms = normalizedQuery.split(' ').filter(Boolean)

  return buildings
    .filter((building) => query.section === 'all' || building.section === query.section)
    .filter((building) => !query.favoritesOnly || query.favoriteIds?.has(building.id))
    .filter((building) => !query.popularOnly || building.traits.includes('popular'))
    .filter((building) => {
      if (terms.length === 0) return true
      const haystack = searchableText(building)
      return terms.every((term) => haystack.includes(term))
    })
    .filter(
      (building) =>
        query.filters.season === 'all' || String(building.season) === query.filters.season,
    )
    .filter(
      (building) =>
        query.filters.specialization === 'all' ||
        building.specialization === query.filters.specialization,
    )
    .filter(
      (building) =>
        query.filters.footprint === 'all' || footprintKey(building) === query.filters.footprint,
    )
    .filter((building) => !query.filters.featuredOnly || building.isFeatured)
    .sort((left, right) => compareBuildings(left, right, query.filters.sort))
}

export const sortLabels: Record<SortMode, string> = {
  'season-desc': 'Сезон: новые → старые',
  'season-asc': 'Сезон: старые → новые',
  'boost-desc': 'Бонус: больше → меньше',
  'boost-asc': 'Бонус: меньше → больше',
  'released-desc': 'Дата: новые → старые',
  'released-asc': 'Дата: старые → новые',
  'name-asc': 'Название: А → Я',
}
