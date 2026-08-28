import { statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const assetSize = (name: string) =>
  statSync(new URL('../public/' + name, import.meta.url)).size

const supplementalGalleryAssets = [
  'rustic-windmill-day.webp',
  'rustic-windmill-night.webp',
  'rainforest-towers-day.webp',
  'rainforest-towers-night.webp',
  'winter-brasserie-day.webp',
  'winter-brasserie-night.webp',
  'lean-library-day.webp',
  'lean-library-night.webp',
  'temple-of-dawn-day.webp',
  'temple-of-dawn-night.webp',
  'wonderful-barn-day.webp',
  'wonderful-barn-night.webp',
] as const

const specializationIconAssets = [
  'all.webp',
  'beach.webp',
  'clinic.webp',
  'education.webp',
  'entertainment.webp',
  'fire.webp',
  'gambling.webp',
  'landscape.webp',
  'mayor-pass.webp',
  'monuments.webp',
  'mountain.webp',
  'parks.webp',
  'police.webp',
  'public-transport.webp',
  'services.webp',
  'space.webp',
  'transport.webp',
  'uncategorized.webp',
] as const

describe('hero assets', () => {
  it('keeps the responsive WebP files within their loading budgets', () => {
    expect(assetSize('hero-city-v1-placeholder.webp')).toBeLessThan(10_000)
    expect(assetSize('hero-city-v1-640.webp')).toBeLessThan(200_000)
    expect(assetSize('hero-city-v1.webp')).toBeLessThan(550_000)
  })

  it('keeps supplemental Fandom gallery images optimized', () => {
    for (const name of supplementalGalleryAssets) {
      const size = statSync(new URL('../scripts/manual_images/' + name, import.meta.url)).size
      expect(size, name).toBeLessThan(200_000)
    }
  })

  it('keeps every 3D specialization icon local and lightweight', () => {
    for (const name of specializationIconAssets) {
      expect(assetSize(`icons/specializations/${name}`), name).toBeLessThan(30_000)
    }
  })
})
