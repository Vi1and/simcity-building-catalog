import { describe, expect, it } from 'vitest'
import { defaultFilters, filterAndSortBuildings, formatFootprint, releaseOrder } from './catalog'
import type { Building } from './types'

const building = (overrides: Partial<Building>): Building => ({
  id: 'mayor:1:test',
  section: 'mayor',
  code: 1,
  name: 'Тестовое здание',
  aliases: [],
  originalName: 'Test Building',
  image: null,
  images: [],
  footprint: { kind: 'grid', label: '2 × 3', width: 2, depth: 3, length: null, cells: 6 },
  boost: { kind: 'populationPercent', label: '15', min: 15, max: 15, sortValue: 15 },
  season: 2,
  seasonName: 'Венеция',
  released: 'июль 2020',
  tier: null,
  passType: null,
  event: null,
  effectDescription: null,
  isFeatured: false,
  traits: [],
  specialization: null,
  effectArea: null,
  availability: null,
  ...overrides,
})

describe('catalog helpers', () => {
  it('searches Russian and original names without treating ё separately', () => {
    const entries = [building({ name: 'Ёлочный рынок' }), building({ id: 'mayor:2:x', name: 'Парк' })]
    const filters = { ...defaultFilters('mayor'), query: 'елочный' }
    expect(filterAndSortBuildings(entries, { section: 'mayor', filters })).toHaveLength(1)
  })

  it('searches alternative catalog names', () => {
    const entries = [building({
      name: 'Институт северного сияния',
      aliases: ['Музей северного сияния'],
    })]
    const filters = { ...defaultFilters('mayor'), query: 'музей северного сияния' }
    expect(filterAndSortBuildings(entries, { section: 'mayor', filters })).toHaveLength(1)
  })

  it('sorts unknown bonuses after known values in both directions', () => {
    const entries = [
      building({ id: '1', boost: { kind: 'unknown', label: null, min: null, max: null, sortValue: null } }),
      building({ id: '2', boost: { kind: 'populationPercent', label: '5', min: 5, max: 5, sortValue: 5 } }),
    ]
    for (const sort of ['boost-asc', 'boost-desc'] as const) {
      const filters = { ...defaultFilters('mayor'), sort }
      expect(filterAndSortBuildings(entries, { section: 'mayor', filters })[1].boost.kind).toBe('unknown')
    }
  })

  it('filters seasons numerically and formats occupied cells', () => {
    const entries = [building({ season: 2 }), building({ id: '2', season: 20 })]
    const filters = { ...defaultFilters('mayor'), season: '20' }
    expect(filterAndSortBuildings(entries, { section: 'mayor', filters })[0].season).toBe(20)
    expect(formatFootprint(entries[0])).toBe('2 × 3 │ 6 клеток')
  })

  it('shows only featured buildings when the rare filter is enabled', () => {
    const entries = [
      building({ id: 'regular' }),
      building({ id: 'featured', isFeatured: true, traits: ['unique-effect'] }),
    ]
    const filters = { ...defaultFilters('mayor'), featuredOnly: true }
    expect(filterAndSortBuildings(entries, { section: 'mayor', filters }).map((entry) => entry.id))
      .toEqual(['featured'])
  })

  it('shows only sheet-marked popular buildings in the popular section', () => {
    const entries = [
      building({ id: 'popular', traits: ['popular'], isFeatured: true }),
      building({ id: 'rare', traits: ['upgradeable'], isFeatured: true }),
    ]
    expect(filterAndSortBuildings(entries, {
      section: 'all',
      filters: defaultFilters('mayor'),
      popularOnly: true,
    }).map((entry) => entry.id)).toEqual(['popular'])
  })

  it('creates a stable order key from Russian month names', () => {
    expect(releaseOrder('февраль 2024')).toBe(202402)
    expect(releaseOrder('2023')).toBe(202301)
    expect(releaseOrder(null)).toBeNull()
  })
})
