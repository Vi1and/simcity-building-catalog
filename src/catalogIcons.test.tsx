import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import catalogJson from './data/catalog.json'
import {
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

  it('renders the mayor pass mark as a repository-owned SVG', () => {
    const markup = renderToStaticMarkup(<MayorPassIcon />)
    expect(markup).toContain('<svg')
    expect(markup).toContain('data-catalog-icon="mayor-pass"')
  })

  it('renders country themes as repository-owned SVG flags instead of emoji', () => {
    const countryThemes = [
      'italy',
      'france',
      'spain',
      'germany',
      'britain',
      'scandinavia',
      'central-europe',
      'netherlands',
      'ireland',
      'monaco',
    ] as const

    expect(countryThemes.every(isCountryTheme)).toBe(true)
    expect(isCountryTheme('japan')).toBe(false)

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
