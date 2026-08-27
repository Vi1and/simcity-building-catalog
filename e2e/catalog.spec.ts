import { expect, test } from '@playwright/test'
import { CatalogPage } from './pages/catalog-page'

test.describe('Городской архив', () => {
  test('включает тёмную тему по умолчанию и сохраняет выбор', async ({ page }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    const themeToggle = page.getByRole('button', { name: 'Включить светлую тему' })
    await expect(themeToggle).toBeVisible()
    await themeToggle.click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await expect(page.getByRole('button', { name: 'Включить тёмную тему' })).toBeVisible()
  })

  test('показывает импорт списка сразу в шапке обычного каталога', async ({ page }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()

    const importButton = page.getByRole('button', { name: 'Вставить список зданий в избранное' })
    await expect(importButton).toBeInViewport()
    await importButton.click()
    await expect(page.getByRole('dialog', { name: 'Добавить здания из списка' })).toBeVisible()
  })

  test('плавно показывает оптимизированную hero-иллюстрацию', async ({ page }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()

    const visual = page.locator('.hero__visual')
    const fullImage = visual.locator('.hero__image--full')
    await expect(visual).toBeVisible()
    await expect(visual).toHaveClass(/is-loaded/)
    await expect(fullImage).toHaveAttribute('width', '1217')
    await expect(fullImage).toHaveAttribute('height', '1292')
    await expect(fullImage).toHaveAttribute('fetchpriority', 'high')
    expect(await fullImage.evaluate((image: HTMLImageElement) => image.currentSrc)).toContain('.webp')
  })

  test('открывает Абонемент мэра первым и фильтрует сезон 71', async ({ page }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()

    await expect(page.getByRole('heading', { name: 'Абонемент мэра', exact: true })).toBeVisible()
    await expect(catalog.cards).toHaveCount(48)

    await catalog.seasonFilter.press('ArrowDown')
    const seasonList = catalog.filters.getByRole('listbox', { name: 'Сезон' })
    await expect(seasonList).toBeVisible()
    await expect(seasonList.getByRole('option').first()).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(seasonList.getByRole('option').nth(1)).toBeFocused()
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(/season=71/)
    await expect(catalog.cards).toHaveCount(5)
    await expect(catalog.cards.filter({ hasText: 'Сезон 71' })).toHaveCount(5)
  })

  test('переключает раздел и показывает только пляжные объекты', async ({ page }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()
    await catalog.showOtherBuildings()

    await expect(page.getByRole('heading', { name: 'Другие здания', exact: true })).toBeVisible()
    await catalog.specializationFilter.click()
    await catalog.filters.getByRole('option', { name: 'Пляж', exact: true }).click()

    await expect(page).toHaveURL(/spec=/)
    await expect(catalog.specializationFilter).toContainText('Пляж')
    await expect(catalog.cards).toHaveCount(48)
    await page.getByRole('button', { name: 'Показать ещё 12' }).click()
    await expect(catalog.cards).toHaveCount(60)
    await expect(catalog.cards.filter({ hasText: 'Пляж' })).toHaveCount(60)
  })

  test('находит здание по английскому названию', async ({ page }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()
    await catalog.showOtherBuildings()

    await catalog.search.fill('Alpha Museum')

    await expect(page).toHaveURL(/q=Alpha/)
    await expect(catalog.cards).toHaveCount(1)
    await expect(catalog.cards.first()).toContainText('Альфа-музей')
    await expect(catalog.cards.first()).toContainText('Alpha Museum')
  })

  test('сохраняет избранное после перезагрузки', async ({ page }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()

    const firstCard = catalog.cards.first()
    await firstCard.getByRole('button', { name: /^Добавить .+ в избранное$/ }).click()
    await expect(catalog.favoritesButton).toHaveAccessibleName('Избранное 1')

    await page.reload()
    await expect(catalog.favoritesButton).toHaveAccessibleName('Избранное 1')
    await catalog.favoritesButton.click()

    await expect(page.getByRole('heading', { name: 'Ваше избранное' })).toBeVisible()
    await expect(catalog.cards).toHaveCount(1)
  })

  test('показывает пустое состояние и восстанавливает каталог', async ({ page }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()

    await catalog.search.fill('zz-no-such-building-123')

    await expect(page.getByRole('heading', { name: 'Таких зданий не найдено' })).toBeVisible()
    await page.getByRole('button', { name: 'Сбросить фильтры', exact: true }).click()
    await expect(catalog.cards).toHaveCount(48)
  })

  test('открывает подробную карточку со всеми ключевыми данными', async ({ page }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()

    await catalog.cards.first().getByRole('button', { name: /^Открыть сведения:/ }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Размер', { exact: true })).toBeVisible()
    await expect(dialog.getByText('Бонус населения', { exact: true })).toBeVisible()
    await expect(dialog.getByText('Сезон', { exact: true })).toBeVisible()
    await expect(dialog.getByRole('button', { name: /Добавить .+ в избранное|Убрать .+ из избранного/ })).toBeVisible()
  })

  test('показывает несколько фотографий здания и переключает их', async ({ page }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()
    await catalog.search.fill('Цветочный магазин Лепесток')

    await catalog.cards.first().getByRole('button', { name: /^Открыть сведения:/ }).click()

    const dialog = page.getByRole('dialog')
    const thumbnails = dialog.getByRole('group', { name: 'Фотографии здания' }).getByRole('button')
    await expect(thumbnails).toHaveCount(3)
    await expect(dialog.getByText('3 фото', { exact: true })).toBeVisible()
    await expect(thumbnails.nth(0)).toHaveClass(/is-active/)
    await dialog.getByRole('button', { name: 'Следующее фото' }).click()
    await expect(thumbnails.nth(1)).toHaveClass(/is-active/)
  })

  test('не обрезает фото, масштабирует его и закрывает окно по фону', async ({ page }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()
    await catalog.search.fill('Цветочный магазин Лепесток')
    await catalog.cards.first().getByRole('button', { name: /^Открыть сведения:/ }).click()

    const dialog = page.getByRole('dialog')
    const stage = dialog.locator('.detail-dialog__stage')
    const image = stage.locator('img')
    await expect(dialog).toBeVisible()
    expect(await image.evaluate((node) => getComputedStyle(node).objectFit)).toBe('contain')

    await dialog.getByRole('button', { name: 'Увеличить фотографию' }).click()
    await expect(stage).toHaveClass(/is-zoomed/)
    await expect(image).toHaveAttribute('style', /scale\(1\.5\)/)
    await expect(dialog.getByRole('button', { name: 'Сбросить масштаб' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Следующее фото' })).toHaveCount(0)

    await dialog.getByRole('button', { name: 'Сбросить масштаб' }).click()
    await expect(stage).not.toHaveClass(/is-zoomed/)
    await expect(dialog.getByRole('button', { name: 'Следующее фото' })).toBeVisible()

    await page.setViewportSize({ width: 900, height: 800 })
    const geometry = await stage.evaluate((node) => {
      const stageBox = node.getBoundingClientRect()
      const imageBox = node.querySelector('img')?.getBoundingClientRect()
      return {
        stageWidth: stageBox.width,
        stageHeight: stageBox.height,
        imageWidth: imageBox?.width ?? 0,
        imageHeight: imageBox?.height ?? 0,
      }
    })
    expect(geometry.imageWidth).toBeLessThanOrEqual(geometry.stageWidth - 39)
    expect(geometry.imageHeight).toBeLessThanOrEqual(geometry.stageHeight - 39)

    await dialog.getByRole('heading', { name: /Цветочный магазин/ }).click()
    await expect(dialog).toBeVisible()

    await page.mouse.click(2, 2)
    await expect(dialog).toBeHidden()
  })

  test('показывает три проверенных фото добавленного Hot Spot-здания', async ({ page }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()
    await catalog.showOtherBuildings()
    await catalog.search.fill('Музей современного искусства')

    await expect(catalog.cards).toHaveCount(1)
    const card = catalog.cards.first()
    await expect(card).toContainText('3 фото')
    const dots = card.locator('.building-card__carousel-dots i')
    await expect(dots).toHaveCount(3)
    await expect(dots.nth(0)).toHaveClass(/is-active/)

    await expect(card.getByRole('button', { name: 'Предыдущее фото' })).toHaveCount(0)
    await expect(card.getByRole('button', { name: 'Следующее фото' })).toBeVisible()
    await card.getByRole('button', { name: 'Следующее фото' }).click()
    await expect(dots.nth(1)).toHaveClass(/is-active/)
    await expect(card.getByRole('button', { name: 'Предыдущее фото' })).toBeVisible()
    await expect(card.getByRole('button', { name: 'Следующее фото' })).toBeVisible()

    await card.getByRole('button', { name: 'Следующее фото' }).click()
    await expect(dots.nth(2)).toHaveClass(/is-active/)
    await expect(card.getByRole('button', { name: 'Следующее фото' })).toHaveCount(0)
    await expect(card.getByRole('button', { name: 'Предыдущее фото' })).toBeVisible()
    await card.getByRole('button', { name: 'Предыдущее фото' }).click()
    await expect(dots.nth(1)).toHaveClass(/is-active/)
    await expect(page.getByRole('dialog')).toHaveCount(0)

    const imageButton = card.locator('.building-card__image-button')
    const imageButtonBox = await imageButton.boundingBox()
    if (!imageButtonBox) throw new Error('Фотография карточки не найдена')
    await page.mouse.click(
      imageButtonBox.x + imageButtonBox.width / 2,
      imageButtonBox.y + imageButtonBox.height / 2,
    )
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Закрыть' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()

    await card.getByRole('button', { name: 'Сведения · 3 фото' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('group', { name: 'Фотографии здания' }).getByRole('button')).toHaveCount(3)
    await expect(dialog.getByRole('button', { name: 'Показать фото: Уровень 10' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Показать фото: Днём · уровень 1' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Показать фото: Ночью · уровень 1' })).toBeVisible()
  })

  test('показывает пирамиду без звёздочки, с итоговым бонусом и выделенными характеристиками', async ({ page }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()
    await catalog.showOtherBuildings()
    await catalog.search.fill('Великая пирамида Гизы')

    const card = catalog.cards.first()
    await expect(card).toContainText('Великая пирамида Гизы')
    await expect(card).not.toContainText('Гизы*')
    await expect(card).toContainText('4 × 4 │ 16 клеток')
    await expect(card).toContainText('+60% к населению')
    await expect(card.locator('.building-card__feature')).toBeVisible()
    await card.getByRole('button', { name: /^Открыть сведения:/ }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.locator('.detail-highlight')).toHaveCount(4)
    await expect(dialog.locator('.detail-highlight--size')).toContainText('4 × 4 │ 16 клеток')
    await expect(dialog.locator('.detail-highlight--boost')).toContainText('+60% к населению')
    await expect(dialog.locator('.detail-highlight--specialization')).toContainText('Монументы')
    await expect(dialog.locator('.detail-highlight--area')).toContainText('26 × 26')
    await expect(dialog.getByText('Доступен отдельный ночной вид')).toBeVisible()
    await expect(dialog).not.toContainText('популярный объект')
  })

  test('оставляет избранное видимым после прокрутки страницы', async ({ page }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect(catalog.favoritesButton).toBeInViewport()
    await expect(catalog.favoritesButton).toHaveCSS('position', 'fixed')
  })

  test('фильтрует популярные, редкие и прокачиваемые здания', async ({ page }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()

    await page.getByRole('checkbox', { name: /Популярные \/ редкие/ }).check()

    await expect(page).toHaveURL(/rare=1/)
    await expect(catalog.cards).toHaveCount(7)
    await expect(catalog.cards.locator('.building-card__feature')).toHaveCount(7)
  })

  test('показывает 38 популярных зданий из таблицы в отдельном разделе', async ({ page }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()

    await page.getByRole('button', { name: /Популярные/ }).click()

    await expect(page).toHaveURL(/view=popular/)
    await expect(page.getByRole('heading', { name: 'Популярные здания', exact: true })).toBeVisible()
    await expect(catalog.cards).toHaveCount(38)
    await expect(catalog.cards.filter({ hasText: 'Ракета "Артемида II"' })).toHaveCount(0)
  })

  test('собирает здания из всего каталога по тематическим плиткам', async ({ page }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()
    await catalog.showThemes()

    await expect(page).toHaveURL(/view=themes/)
    await expect(page.getByRole('heading', { name: 'Тематические подборки', exact: true })).toBeVisible()
    const themeRail = page.getByLabel('Выбор тематики')
    await expect(themeRail.getByRole('button')).toHaveCount(13)

    await themeRail.getByRole('button', { name: /^Пустыня/ }).click()

    await expect(page).toHaveURL(/theme=desert/)
    await expect(page.getByRole('heading', { name: 'Пустыня', exact: true })).toBeVisible()
    await expect(catalog.cards.filter({ hasText: 'Великий сфинкс Гизы' })).toHaveCount(1)
    await expect(catalog.specializationFilter).toBeVisible()
  })

  test('раскладывает специализации ровно в две строки на компьютере', async ({ page }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()
    await catalog.showOtherBuildings()

    const tops = await page.locator('.specialization-rail > button').evaluateAll((buttons) =>
      [...new Set(buttons.map((button) => Math.round(button.getBoundingClientRect().top)))],
    )
    expect(tops).toHaveLength(2)
  })

  test('копирует все избранные названия, даже скрытые поиском', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    const catalog = new CatalogPage(page)
    await catalog.open()

    const firstName = await catalog.cards.first().getByRole('heading').innerText()
    await catalog.cards.first().getByRole('button', { name: /^Добавить .+ в избранное$/ }).click()
    await catalog.cards.nth(1).getByRole('button', { name: /^Добавить .+ в избранное$/ }).click()
    await catalog.favoritesButton.click()
    await catalog.search.fill(firstName)
    await expect(catalog.cards).toHaveCount(1)

    await page.getByRole('button', { name: 'Копировать все названия' }).click()
    const copied = await page.evaluate(() => navigator.clipboard.readText())
    expect(copied.split('\n')).toHaveLength(2)
    expect(copied).toContain(firstName)
  })

  test('очищает всё избранное только после отдельного подтверждения', async ({ page }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()

    await catalog.cards.first().getByRole('button', { name: /^Добавить .+ в избранное$/ }).click()
    await catalog.cards.nth(1).getByRole('button', { name: /^Добавить .+ в избранное$/ }).click()
    await expect(catalog.favoritesButton).toHaveAccessibleName('Избранное 2')

    const clearButton = page.getByRole('button', { name: 'Очистить всё избранное' })
    await clearButton.click()
    const dialog = page.getByRole('dialog', { name: 'Очистить всё избранное?' })
    await expect(dialog).toContainText('2 здания')

    await dialog.getByRole('button', { name: 'Нет, оставить' }).click()
    await expect(dialog).toBeHidden()
    await expect(catalog.favoritesButton).toHaveAccessibleName('Избранное 2')

    await clearButton.click()
    await dialog.getByRole('button', { name: 'Очистить 2 здания' }).click()
    await expect(dialog).toBeHidden()
    await expect(catalog.favoritesButton).toHaveAccessibleName('Избранное 0')
    await expect(clearButton).toBeDisabled()
  })

  test('вставляет русские и английские названия одной кнопкой и сохраняет их после перезагрузки', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    const catalog = new CatalogPage(page)
    await catalog.open()
    await page.evaluate(() => navigator.clipboard.writeText('- Космопорт\nGhost Portal\nНет такого здания'))
    await page.getByRole('button', { name: 'Вставить список зданий в избранное' }).click()

    const dialog = page.getByRole('dialog', { name: 'Добавить здания из списка' })
    await dialog.getByRole('button', { name: 'Вставить из буфера' }).click()
    await expect(dialog.getByLabel('Список названий зданий')).toHaveValue('- Космопорт\nGhost Portal\nНет такого здания')
    await expect(dialog.getByText('Найдено: 2')).toBeVisible()
    await expect(dialog.getByText('Не найдено: 1')).toBeVisible()
    await dialog.getByRole('button', { name: 'Добавить 2 здания' }).click()

    await expect(catalog.cards).toHaveCount(2)
    await page.reload()
    await expect(catalog.cards).toHaveCount(2)
    await expect(catalog.cards.filter({ hasText: 'Призрачный портал' })).toHaveCount(1)
  })

  test('просит выбрать вариант для одинакового названия', async ({ page }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()
    await page.getByRole('button', { name: 'Вставить список зданий в избранное' }).click()

    const dialog = page.getByRole('dialog', { name: 'Добавить здания из списка' })
    await dialog.getByLabel('Список названий зданий').fill('Приют для животных')
    await expect(dialog.getByText('Нужно уточнить: 1')).toBeVisible()
    await dialog.getByRole('radio', { name: /Сезон 67/ }).check()
    await dialog.getByRole('button', { name: 'Добавить 1 здание' }).click()

    await expect(catalog.cards).toHaveCount(1)
    await expect(catalog.cards.first()).toContainText('Сезон 67')
  })
})

test.describe('Мобильный каталог', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('применяет сезон через мобильную панель фильтров', async ({ page }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()

    await page.getByRole('button', { name: /^Фильтры/ }).click()
    const dialog = page.getByRole('dialog', { name: 'Фильтры и сортировка' })
    await expect(dialog).toBeVisible()
    const seasonTrigger = dialog.getByRole('button', { name: /^Сезон / })
    await seasonTrigger.click()
    await dialog.getByRole('option', { name: /^71\./ }).click()
    await dialog.getByRole('button', { name: 'Показать 5 зданий' }).click()

    await expect(dialog).toBeHidden()
    await expect(catalog.cards).toHaveCount(5)
    await expect(page).toHaveURL(/season=71/)
  })

  test('показывает тёмную тему, импорт и четыре раздела в одной строке', async ({ page }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(page.locator('.hero__visual')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Вставить список зданий в избранное' })).toBeInViewport()
    const navButtons = page.locator('.catalog-nav > button')
    await expect(navButtons).toHaveCount(4)
    const tops = await navButtons.evaluateAll((buttons) =>
      buttons.map((button) => Math.round(button.getBoundingClientRect().top)),
    )
    expect(new Set(tops).size).toBe(1)
    await expect(navButtons.nth(3)).toBeInViewport()
  })

  test('открывает и листает галерею Hot Spot-здания на телефоне', async ({ page }) => {
    const catalog = new CatalogPage(page)
    await catalog.open()
    await catalog.showOtherBuildings()
    await catalog.search.fill('Музей современного искусства')

    await catalog.cards.first().getByRole('button', { name: 'Сведения · 3 фото' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('3 фото', { exact: true })).toBeVisible()
    const thumbnails = dialog.getByRole('group', { name: 'Фотографии здания' }).getByRole('button')
    await expect(thumbnails.nth(0)).toHaveClass(/is-active/)

    const stage = dialog.locator('.detail-dialog__stage')
    await stage.scrollIntoViewIfNeeded()
    const stageBox = await stage.boundingBox()
    if (!stageBox) throw new Error('Область фотографии не найдена')
    const centerX = stageBox.x + stageBox.width / 2
    const centerY = stageBox.y + stageBox.height / 2
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { x: centerX - 24, y: centerY, id: 1, radiusX: 2, radiusY: 2, force: 1 },
        { x: centerX + 24, y: centerY, id: 2, radiusX: 2, radiusY: 2, force: 1 },
      ],
    })
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        { x: centerX - 58, y: centerY, id: 1, radiusX: 2, radiusY: 2, force: 1 },
        { x: centerX + 58, y: centerY, id: 2, radiusX: 2, radiusY: 2, force: 1 },
      ],
    })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect(stage).toHaveClass(/is-zoomed/)
    await expect(dialog.getByRole('button', { name: 'Сбросить масштаб' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Следующее фото' })).toHaveCount(0)
    await dialog.getByRole('button', { name: 'Сбросить масштаб' }).click()
    await expect(stage).not.toHaveClass(/is-zoomed/)
    await expect(dialog.getByRole('button', { name: 'Следующее фото' })).toBeVisible()

    await page.mouse.move(stageBox.x + stageBox.width * 0.75, stageBox.y + stageBox.height / 2)
    await page.mouse.down()
    await page.mouse.move(stageBox.x + stageBox.width * 0.25, stageBox.y + stageBox.height / 2, { steps: 5 })
    await page.mouse.up()
    await expect(thumbnails.nth(1)).toHaveClass(/is-active/)
  })
})
