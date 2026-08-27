import { describe, expect, it } from 'vitest'
import catalogOverridesJson from '../scripts/catalog_overrides.json'
import catalogJson from './data/catalog.json'
import { formatFavoriteShareText, matchFavoriteNames } from './favoriteSharing'
import type { Building, CatalogData } from './types'

const catalog = catalogJson as CatalogData
const catalogOverrides = catalogOverridesJson as Record<string, {
  originalName?: string
  additionalGalleries?: string[]
  additionalImages?: Array<{ file: string; kind: string; label: string }>
  manualImages?: Array<{ file: string; kind: string; label: string }>
  imageSequence?: number[]
}>

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
  'Стадион "Золотой гол"',
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

  it('contains all 21 regional Hot Spot buildings from the linked sheet', () => {
    for (const name of hotSpotNames) {
      const building = findUpgradeableOther(name)
      expect(building, name).toBeDefined()
      expect(building?.isFeatured, name).toBe(true)
      expect(building?.boost.max, name).toBe(80)
    }
  })

  it('exports a concise action description for every unique effect', () => {
    const effectBuildings = catalog.buildings.filter((building) => building.traits.includes('unique-effect'))
    expect(effectBuildings.length).toBeGreaterThan(0)
    for (const building of effectBuildings) {
      expect(building.effectDescription?.trim(), building.name).toBeTruthy()
    }

    expect(catalog.buildings.find((building) => building.event === 'ЭФФЕКТ снег на весь город')?.effectDescription)
      .toBe('Покрывает весь город снегом')
    expect(catalog.buildings.find((building) => building.event === 'фейерверк и  лазеры')?.effectDescription)
      .toBe('Запускает фейерверк и лазерное шоу')
  })

  it('keeps deployed IDs stable when only gallery presentation changes', () => {
    const expectedIds = new Map([
      ['Стадион "Золотой гол"', 'other:-252552977:be534aa29f'],
      ['Снежный замок', 'other:-1674266991:2e9c2a4683'],
      ['Затопленная деревня', 'other:-2127049860:e525deb41b'],
      ['Альфа-шоу дронов', 'other:-1749904249:c1aa8d5c65'],
    ])
    for (const [name, id] of expectedIds) {
      expect(catalog.buildings.find((building) => building.name === name)?.id, name).toBe(id)
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

  it('merges the verified Gardencourt Estate gallery with its catalog photo', () => {
    const gardencourt = catalog.buildings.find((building) => building.code === 2080167789)
    expect(gardencourt?.name).toBe('Поместье Гарденкорт')
    expect(gardencourt?.originalName).toBe('Gardencourt Estate')
    expect(gardencourt?.images.map((image) => image.kind)).toEqual(['main', 'day', 'night'])
    expect(gardencourt?.images).toHaveLength(3)
  })

  it('uses the second Legendary Holiday Tree photo first and the original main photo second', () => {
    const name = 'Легендарная праздничная елка'
    const tree = catalog.buildings.find((building) => building.name === name)

    expect(catalogOverrides[name]?.imageSequence).toEqual([2, 1])
    expect(tree?.image).toBe('buildings/2d23626449d39b13eb9b.jpg')
    expect(tree?.images.map((image) => image.src)).toEqual([
      'buildings/2d23626449d39b13eb9b.jpg',
      'buildings/4cd133ae5bf6be1fc845.jpg',
    ])
  })

  it('exports every verified supplemental photo set with main, day, and night photos', () => {
    const supplementalGalleries = Object.entries(catalogOverrides)
      .filter(([, override]) => override.additionalGalleries?.length)
    const supplementalImages = Object.entries(catalogOverrides)
      .filter(([, override]) => override.additionalImages?.length && !override.manualImages?.length)
    const supplementalPhotoSets = [...supplementalGalleries, ...supplementalImages]

    expect(supplementalGalleries).toHaveLength(50)
    expect(supplementalImages).toHaveLength(6)
    for (const [name, override] of supplementalPhotoSets) {
      const buildings = catalog.buildings.filter((building) => building.name === name)
      expect(buildings.length, name).toBeGreaterThan(0)

      for (const building of buildings) {
        expect(building.originalName, name).toBe(override.originalName)
        expect(new Set(building.images.map((image) => image.kind)), name)
          .toEqual(new Set(['main', 'day', 'night']))
      }
    }
  })

  it('keeps AI reconstructions explicitly labelled and strictly last', () => {
    for (const name of ['Кей-поп концертная сцена', 'Скульптура «Огненный конь»']) {
      const building = catalog.buildings.find((item) => item.name === name)
      expect(building, name).toBeDefined()
      expect(building?.images[0].kind, name).toBe('main')
      expect(building?.images.at(-1), name).toMatchObject({
        kind: 'event',
        label: 'AI-реконструкция · последний кадр',
      })
      expect(building?.images.slice(0, -1).every((image) => !image.label.startsWith('AI-')), name).toBe(true)
    }
  })

  it('does not mistake building-name fragments for rejected gallery markers', () => {
    const bridge = catalog.buildings.find((building) => building.originalName === 'Bridge Classico')
    const waterpark = catalog.buildings.find((building) => building.originalName === 'Rainforest Waterpark')
    expect(bridge?.images.some((image) => image.kind === 'night')).toBe(true)
    expect(waterpark?.images.some((image) => image.kind === 'night')).toBe(true)
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
