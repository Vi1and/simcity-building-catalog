import { describe, expect, it } from 'vitest'
import catalogJson from './data/catalog.json'
import { formatFavoriteShareText, matchFavoriteNames } from './favoriteSharing'
import type { Building, CatalogData } from './types'

const catalog = catalogJson as CatalogData

const hotSpotNames = [
  'Павильон для маджонга',
  'Оазис казино',
  'Ледяное казино',
  'Казино на вулкане',
  'Музей современного искусства',
  'Школа боевых искусств',
  'Институт океанографии',
  'Институт северного сияния',
  'Засекреченная лаборатория',
  'Парк для домашних питомцев',
  'Чайный домик',
  'Место посадки НЛО',
  'Музей драккаров',
  'Гавайская вечеринка',
  'Прокат велосипедов',
  'Терминал для гироскутеров',
  'Стоянка тук-туков',
  'Трасса для грузовиков',
  'Станция проката квадроциклов',
  'Стоянка такси',
] as const

const findUpgradeableOther = (name: string): Building | undefined =>
  catalog.buildings.find((building) =>
    building.section === 'other' &&
    building.name === name &&
    building.traits.includes('upgradeable'),
  )

describe('exported catalog data', () => {
  it('keeps the corrected Great Pyramid name, final boost, and full gallery', () => {
    const pyramid = catalog.buildings.find((building) => building.code === -609346807)
    expect(pyramid?.name).toBe('Великая пирамида Гизы')
    expect(pyramid?.boost.min).toBe(60)
    expect(pyramid?.boost.max).toBe(60)
    expect(pyramid?.images).toHaveLength(8)
  })

  it('contains exactly the 38 buildings currently marked popular in the sheet', () => {
    const popular = catalog.buildings.filter((building) => building.traits.includes('popular'))
    expect(popular).toHaveLength(38)
    expect(popular.some((building) => building.name === 'Ракета "Артемида II"')).toBe(false)
  })

  it('contains all 20 regional Hot Spot buildings from the linked sheet', () => {
    for (const name of hotSpotNames) {
      const building = findUpgradeableOther(name)
      expect(building, name).toBeDefined()
      expect(building?.isFeatured, name).toBe(true)
      expect(building?.boost.max, name).toBe(80)
    }
  })

  it('keeps unknown game codes empty instead of inventing identifiers', () => {
    for (const name of [
      'Музей современного искусства',
      'Школа боевых искусств',
      'Институт океанографии',
      'Институт северного сияния',
    ]) {
      expect(findUpgradeableOther(name)?.code, name).toBeNull()
    }
  })

  it('uses the correct Taxi Stop identity and gallery', () => {
    const taxiStop = findUpgradeableOther('Стоянка такси')
    expect(taxiStop?.originalName).toBe('Taxi Stop')
    expect(taxiStop?.images.map((image) => image.label)).toEqual([
      'Днём · уровень 1',
      'Ночью · уровень 1',
    ])
  })

  it('preserves different favorite cards even when their game codes collide', () => {
    const byCode = new Map<number, Building[]>()
    for (const building of catalog.buildings) {
      if (building.code === null) continue
      byCode.set(building.code, [...(byCode.get(building.code) ?? []), building])
    }
    const collision = [...byCode.values()].find((entries) =>
      entries.length > 1 && new Set(entries.map((entry) => entry.name)).size > 1,
    )
    expect(collision).toBeDefined()
    const pair = collision!.slice(0, 2)
    const copied = formatFavoriteShareText(catalog.buildings, new Set(pair.map((entry) => entry.id)))
    expect(copied.split('\n')).toHaveLength(2)

    const restored = matchFavoriteNames(copied, catalog.buildings)
    expect(new Set(restored.matchedIds)).toEqual(new Set(pair.map((entry) => entry.id)))
  })
})
