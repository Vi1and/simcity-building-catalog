import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import catalogJson from './data/catalog.json'
import {
  AllSpecializationsIcon,
  CatalogThemeIcon,
  CountryFlag,
  MayorPassIcon,
  SpecializationIcon,
  isCountryTheme,
  specializationIconKey,
} from './catalogIcons'

describe('catalog iconography', () => {
  it('maps every catalog specialization to a distinct recognizable glyph', () => {
    const specializations = catalogJson.meta.specializations

    expect(new Set(specializations.map(specializationIconKey)).size).toBe(specializations.length)
    expect(specializationIconKey('монументы')).toBe('monuments')
    expect(specializationIconKey('Неизвестно')).toBe('uncategorized')
    expect(renderToStaticMarkup(<SpecializationIcon specialization="Монументы" />)).toContain('data-catalog-icon="monuments"')
  })

  it('renders repository-owned 3D game icons for all specializations and the mayor pass', () => {
    const allMarkup = renderToStaticMarkup(<AllSpecializationsIcon />)
    const markup = renderToStaticMarkup(<MayorPassIcon />)

    expect(allMarkup).toContain('<img')
    expect(allMarkup).toContain('icons/specializations/all.webp')
    expect(allMarkup).toContain('data-catalog-icon="all"')
    expect(markup).toContain('<img')
    expect(markup).toContain('icons/specializations/mayor-pass.webp')
    expect(markup).toContain('data-catalog-icon="mayor-pass"')
  })

  it('renders country themes as repository-owned SVG flags instead of emoji', () => {
    const countryThemes = [
      'usa',
      'australia',
      'china',
      'italy',
      'france',
      'spain',
      'germany',
      'britain',
      'scandinavia',
      'central-europe',
      'netherlands',
      'monaco',
    ] as const

    expect(countryThemes.every(isCountryTheme)).toBe(true)
    expect(isCountryTheme('japan')).toBe(false)
    expect(isCountryTheme('ireland')).toBe(false)

    for (const themeId of countryThemes) {
      const flag = renderToStaticMarkup(<CountryFlag themeId={themeId} />)
      expect(flag).toContain('<svg')
      expect(flag).toContain(`data-country-theme="${themeId}"`)
    }

    expect(renderToStaticMarkup(<CountryFlag themeId="italy" />)).not.toContain('🇮🇹')

    const fallback = renderToStaticMarkup(<CatalogThemeIcon themeId="japan" fallback="🌸" />)
    expect(fallback).toContain('🌸')
  })
})
