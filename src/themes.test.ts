import { describe, expect, it } from 'vitest'
import { buildingThemeIds, findCatalogTheme } from './themes'
import type { Building } from './types'

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
  isFeatured: false,
  traits: [],
  specialization: null,
  effectArea: null,
  availability: null,
  ...patch,
})

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
})
