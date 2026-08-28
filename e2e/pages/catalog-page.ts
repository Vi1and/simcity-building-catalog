import type { Locator, Page } from '@playwright/test'

export class CatalogPage {
  constructor(readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('/')
  }

  get search(): Locator {
    return this.page.getByRole('searchbox', { name: 'Поиск зданий' })
  }

  get results(): Locator {
    return this.page.getByRole('list', { name: 'Результаты каталога' })
  }

  get cards(): Locator {
    return this.results.getByRole('listitem')
  }

  get filters(): Locator {
    return this.page.getByRole('region', { name: 'Фильтры каталога' })
  }

  get seasonFilter(): Locator {
    return this.filters.getByRole('button', { name: /^Сезон / })
  }

  get specializationFilter(): Locator {
    return this.filters.getByRole('button', { name: /^Специализация / })
  }

  get sortFilter(): Locator {
    return this.filters.getByRole('button', { name: /^Сортировка / })
  }

  get favoritesButton(): Locator {
    return this.page.getByRole('button', { name: /^Избранное \d+$/ })
  }

  get primaryNavigation(): Locator {
    return this.page.getByRole('navigation', { name: 'Разделы каталога', exact: true })
  }

  async showMayorPass(): Promise<void> {
    await this.primaryNavigation.getByRole('button', { name: /Абонемент мэра/ }).click()
  }

  async showOtherBuildings(): Promise<void> {
    await this.primaryNavigation.getByRole('button', { name: /Другие здания/ }).click()
  }

  async showThemes(): Promise<void> {
    await this.primaryNavigation.getByRole('button', { name: /Тематические/ }).click()
  }
}
