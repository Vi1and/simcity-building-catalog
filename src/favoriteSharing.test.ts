import { describe, expect, it } from 'vitest'
import {
  formatFavoriteShareText,
  matchFavoriteNames,
  normalizeFavoriteName,
  parseFavoriteNames,
  type FavoriteBuilding,
} from './favoriteSharing'

const buildings: FavoriteBuilding[] = [
  { id: '1', code: 101, name: 'Космопорт', originalName: 'Spaceport' },
  { id: '2', code: 102, name: 'Дом с привидениями', originalName: 'Haunted House' },
  { id: '3', code: 103, name: 'Дом с привидениями', originalName: 'Ghost Mansion' },
  { id: '4', code: 104, name: 'С новым, 2018 годом!', originalName: 'Happy New Year 2018' },
  { id: '5', code: 105, name: 'Ёлочный рынок', originalName: 'Christmas Market' },
  { id: '6', code: 101, name: 'Космический центр', originalName: 'Space Center' },
]

describe('favorite sharing', () => {
  it('copies every selected card and clarifies ambiguous names', () => {
    const result = formatFavoriteShareText(buildings, new Set(['1', '2', '3', '6']))

    expect(result.split('\n')).toEqual([
      'Дом с привидениями [код: 102]',
      'Дом с привидениями [код: 103]',
      'Космический центр',
      'Космопорт',
    ])
  })

  it('parses common list markers, new lines, semicolons and pipes without splitting commas', () => {
    expect(parseFavoriteNames('1. Космопорт; • С новым, 2018 годом!\n[x] Spaceport | 4) Ёлочный рынок\tHaunted House')).toEqual([
      'Космопорт',
      'С новым, 2018 годом!',
      'Spaceport',
      'Ёлочный рынок',
      'Haunted House',
    ])
  })

  it('matches exact normalized Russian and English names and deduplicates only the same card', () => {
    const result = matchFavoriteNames(
      '  елочный   рынок ; SPACEPORT | С новым, 2018 годом!\nКосмопорт',
      buildings,
    )

    expect(result.matched.map((building) => building.code)).toEqual([105, 101, 104])
    expect(result.matchedIds).toEqual(['5', '1', '4'])
    expect(result.ambiguous).toEqual([])
    expect(result.notFound).toEqual([])
  })

  it('keeps different buildings that share the same game code', () => {
    const copied = formatFavoriteShareText(buildings, new Set(['1', '6']))
    expect(copied.split('\n')).toEqual(['Космический центр', 'Космопорт'])

    const restored = matchFavoriteNames(copied, buildings)
    expect(restored.matchedIds).toEqual(['6', '1'])
  })

  it('matches alternative names and cards without game codes', () => {
    const withAliases: FavoriteBuilding[] = [
      ...buildings,
      {
        id: 'hotspot:northern',
        code: null,
        name: 'Институт северного сияния',
        aliases: ['Музей северного сияния'],
        originalName: 'Northern Lights Research Institute',
      },
    ]

    const result = matchFavoriteNames('Музей северного сияния', withAliases)
    expect(result.matchedIds).toEqual(['hotspot:northern'])
  })

  it('keeps ambiguous exact names separate and resolves the exported code suffix', () => {
    const result = matchFavoriteNames(
      'Дом с привидениями\nДом с привидениями [код: 103]',
      buildings,
    )

    expect(result.matchedIds).toEqual(['3'])
    expect(result.ambiguous).toHaveLength(1)
    expect(result.ambiguous[0].candidates.map((building) => building.code)).toEqual([102, 103])
    expect(result.notFound).toEqual([])
  })

  it('does not fuzzy-match typos or accept a code paired with another exact name', () => {
    const result = matchFavoriteNames('Космопор\nКосмопорт [код: 102]', buildings)

    expect(result.matched).toEqual([])
    expect(result.ambiguous).toEqual([])
    expect(result.notFound).toEqual(['Космопор', 'Космопорт [код: 102]'])
  })

  it('normalizes typography but preserves meaningful punctuation', () => {
    expect(normalizeFavoriteName('  «Ёлочный» — рынок  ')).toBe('\u0022елочный\u0022 - рынок')
    expect(normalizeFavoriteName('С новым, 2018 годом!')).not.toBe(
      normalizeFavoriteName('С новым 2018 годом!'),
    )
  })
})
